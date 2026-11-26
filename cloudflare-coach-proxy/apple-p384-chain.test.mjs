/* Apple's real chain is P-384 / SHA-384 for the root and WWDR intermediate; the StoreKit leaf is P-256.
   1) real Apple public certs link (root G3 signed WWDR G6) through our verifier,
   2) a locally generated P-384 chain with a P-256 leaf verifies a JWS end to end. */
import { createSign, X509Certificate } from "crypto";
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { verifyAppleJws, __appleCertLinkOk } from "./worker.js";

function assert(c, m) { if (!c) throw new Error(m); }
const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fx = (n) => new X509Certificate(readFileSync(new URL("./fixtures/" + n + ".pem", import.meta.url))).raw;

const root = fx("AppleRootCA-G3"), g6 = fx("AppleWWDRCAG6");
assert(await __appleCertLinkOk(new Uint8Array(g6), new Uint8Array(root)), "real WWDR G6 must verify under real Apple Root G3");
assert(!(await __appleCertLinkOk(new Uint8Array(root), new Uint8Array(g6))), "reverse link must not verify");

function derToRaw(sig, size) {
  let p = 2; const rd = () => { p++; const n = sig[p++]; let v = sig.slice(p, p + n); p += n; while (v.length > 1 && v[0] === 0) v = v.slice(1); const o = Buffer.alloc(size); v.copy(o, size - v.length); return o; };
  return Buffer.concat([rd(), rd()]);
}
for (const leafHash of ["sha256", "sha384"]) {
  const dir = mkdtempSync(join(tmpdir(), "p384-"));
  const ext = (oid) => { const p = join(dir, oid.split(".").pop() + ".ext"); writeFileSync(p, `${oid}=critical,DER:05:00\n`); return p; };
  const run = (...a) => execFileSync("openssl", a, { stdio: "pipe" });
  run("ecparam", "-name", "secp384r1", "-genkey", "-noout", "-out", join(dir, "root.key"));
  run("ecparam", "-name", "secp384r1", "-genkey", "-noout", "-out", join(dir, "inter.key"));
  run("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", join(dir, "leaf.key"));
  run("req", "-new", "-x509", "-sha384", "-key", join(dir, "root.key"), "-days", "3650", "-subj", "/CN=Root", "-out", join(dir, "root.pem"));
  run("req", "-new", "-key", join(dir, "inter.key"), "-subj", "/CN=Inter", "-out", join(dir, "inter.csr"));
  run("x509", "-req", "-sha384", "-in", join(dir, "inter.csr"), "-CA", join(dir, "root.pem"), "-CAkey", join(dir, "root.key"), "-CAcreateserial", "-days", "3650", "-out", join(dir, "inter.pem"), "-extfile", ext("1.2.840.113635.100.6.2.1"));
  run("req", "-new", "-key", join(dir, "leaf.key"), "-subj", "/CN=Leaf", "-out", join(dir, "leaf.csr"));
  run("x509", "-req", "-" + leafHash, "-in", join(dir, "leaf.csr"), "-CA", join(dir, "inter.pem"), "-CAkey", join(dir, "inter.key"), "-CAcreateserial", "-days", "3650", "-out", join(dir, "leaf.pem"), "-extfile", ext("1.2.840.113635.100.6.11.1"));
  const der = (n) => run("x509", "-in", join(dir, n + ".pem"), "-outform", "DER");
  const ders = [der("leaf"), der("inter"), der("root")];
  const rootHex = Buffer.from(await crypto.subtle.digest("SHA-256", ders[2])).toString("hex");
  const h = b64url(JSON.stringify({ alg: "ES256", x5c: ders.map((d) => d.toString("base64")) }));
  const p = b64url(JSON.stringify({ bundleId: "com.wrap911.trainer", productId: "com.wrap911.trainer.pass.7d", environment: "Sandbox", originalTransactionId: "42", purchaseDate: Date.now() }));
  const sig = derToRaw(createSign("SHA256").update(h + "." + p).end().sign(readFileSync(join(dir, "leaf.key"))), 32);
  const jws = h + "." + p + "." + b64url(sig);
  const tx = await verifyAppleJws(jws, rootHex);
  assert(tx.environment === "Sandbox" && tx.originalTransactionId === "42", "P-384 chain payload (" + leafHash + ")");
  let bad = false; try { await verifyAppleJws(h + "." + p + "." + b64url(Buffer.alloc(64)), rootHex); } catch (e) { bad = true; }
  assert(bad, "bad signature rejected");
  bad = false; try { await verifyAppleJws(jws); } catch (e) { bad = true; }
  assert(bad, "real Apple root pin rejects test chain");
}
console.log("apple p384 chain tests passed");
