import { createSign, randomBytes } from "crypto";
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { handleAppleLicense, issueAppleSeatCodes, verifyAppleJws } from "./worker.js";

const YEAR_MS = 365 * 86400000;
const CODE_RE = /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function derToRaw(sig) {
  let p = 2;
  if (sig[0] !== 0x30) throw new Error("sig");
  const read = () => {
    if (sig[p++] !== 0x02) throw new Error("int");
    const n = sig[p++];
    let v = sig.slice(p, p + n);
    p += n;
    if (v[0] === 0) v = v.slice(1);
    const out = Buffer.alloc(32);
    v.copy(out, 32 - v.length);
    return out;
  };
  return Buffer.concat([read(), read()]);
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeChain(dir) {
  const ext = (oid) => {
    const path = join(dir, oid.split(".").pop() + ".ext");
    writeFileSync(path, `${oid}=critical,DER:05:00\n`);
    return path;
  };
  const key = (name) => {
    execFileSync("openssl", ["ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", join(dir, name + ".key")]);
  };
  key("root");
  key("inter");
  key("leaf");
  execFileSync("openssl", ["req", "-new", "-x509", "-key", join(dir, "root.key"), "-days", "3650", "-subj", "/CN=Root", "-out", join(dir, "root.pem")]);
  execFileSync("openssl", ["req", "-new", "-key", join(dir, "inter.key"), "-subj", "/CN=Inter", "-out", join(dir, "inter.csr")]);
  execFileSync("openssl", ["x509", "-req", "-in", join(dir, "inter.csr"), "-CA", join(dir, "root.pem"), "-CAkey", join(dir, "root.key"), "-CAcreateserial", "-days", "3650", "-out", join(dir, "inter.pem"), "-extfile", ext("1.2.840.113635.100.6.2.1")]);
  execFileSync("openssl", ["req", "-new", "-key", join(dir, "leaf.key"), "-subj", "/CN=Leaf", "-out", join(dir, "leaf.csr")]);
  execFileSync("openssl", ["x509", "-req", "-in", join(dir, "leaf.csr"), "-CA", join(dir, "inter.pem"), "-CAkey", join(dir, "inter.key"), "-CAcreateserial", "-days", "3650", "-out", join(dir, "leaf.pem"), "-extfile", ext("1.2.840.113635.100.6.11.1")]);
  const der = (name) => execFileSync("openssl", ["x509", "-in", join(dir, name + ".pem"), "-outform", "DER"]);
  return { dir, ders: [der("leaf"), der("inter"), der("root")] };
}

function signJws(dir, ders, payload, rootSha) {
  const header = { alg: "ES256", x5c: ders.map((d) => d.toString("base64")) };
  const h = b64url(Buffer.from(JSON.stringify(header)));
  const p = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = derToRaw(createSign("SHA256").update(h + "." + p).end().sign(readFileSync(join(dir, "leaf.key"))));
  return { jws: h + "." + p + "." + b64url(sig), rootSha };
}

function kv() {
  const m = new Map();
  return {
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, v); },
    m,
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dir = mkdtempSync(join(tmpdir(), "apple-jws-"));
const chain = makeChain(dir);
const rootSha = (await crypto.subtle.digest("SHA-256", chain.ders[2]));
const rootHex = [...new Uint8Array(rootSha)].map((b) => b.toString(16).padStart(2, "0")).join("");
const purchase = Date.now() - 86400000;
const payload = {
  bundleId: "com.wrap911.trainer",
  productId: "com.wrap911.trainer.pack.12mo",
  environment: "Sandbox",
  originalTransactionId: "2000000123456789",
  purchaseDate: purchase,
};
const signed = signJws(chain.dir, chain.ders, payload, rootHex);
const tx = await verifyAppleJws(signed.jws, rootHex);
assert(tx.productId === payload.productId, "payload");
let threw = false;
try { await verifyAppleJws("not-a-jws", rootHex); } catch (e) { threw = true; }
assert(threw, "bad jws");
threw = false;
try { await verifyAppleJws(signed.jws); } catch (e) { threw = true; }
assert(threw, "real apple root rejects the test chain");

const store = kv();
const env = { LICENSES: store };
const first = await issueAppleSeatCodes(env, tx);
const second = await issueAppleSeatCodes(env, tx);
assert(first.codes.length === 4, "four codes");
assert(first.codes.join() === second.codes.join(), "same codes");
assert(new Set(first.codes).size === 4, "distinct");
assert(first.codes.every((c) => CODE_RE.test(c)), "format");
assert(first.expiresAt === purchase + YEAR_MS, "expiry");
for (const code of first.codes) {
  const rec = JSON.parse(store.m.get("code:" + code));
  assert(rec.sku === "seat" && rec.seats === 1 && rec.used === 0 && rec.revoked === false, "redeem record");
  assert(rec.expiresAt === first.expiresAt, "record expiry");
}
const seat = await issueAppleSeatCodes(env, { ...tx, productId: "com.wrap911.trainer.seat.12mo", originalTransactionId: "2000000999999999" });
assert(seat.codes.length === 0 && seat.sku === "seat", "seat mints nothing");

const req = (body) => new Request("https://wrap911-coach-proxy.wrap911.workers.dev/license/apple", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const bad = await handleAppleLicense(req({ jws: "a.b.c" }), env, "https://wrap911.com");
assert(bad.status === 400, "bad jws status " + bad.status);
const badBody = await bad.json();
assert(badBody.error === "Invalid Apple receipt.", "clean 4xx");
const ok = await handleAppleLicense(req({ jws: signed.jws }), env, "https://wrap911.com");
assert(ok.status === 400, "test chain is not the Apple root, status " + ok.status);
console.log("apple route tests passed");
