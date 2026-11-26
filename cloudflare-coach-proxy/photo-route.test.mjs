import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const dir = new URL(".", import.meta.url);
const live = readFileSync(new URL("./rollback/worker.live-2026-11-12.js", dir), "utf8");
const now = readFileSync(new URL("./worker.js", dir), "utf8");
/* 2026-11-23: the Apple certificate-chain check was fixed for Apple's real P-384 / SHA-384 chain
   (see apple-p384-chain.test.mjs). These are the only Nov-12 lines allowed to change. */
const REPLACED_FOR_P384 = new Set([
  "function derInt(bytes, start, end) {",
  "  if (v.length && v[0] === 0) v = v.slice(1);",
  "  if (v.length > 32) throw new Error(\"der\");",
  "  var out = new Uint8Array(32);",
  "  out.set(v, 32 - v.length);",
  "function ecdsaDerToRaw(sig) {",
  "  var raw = new Uint8Array(64);",
  "  raw.set(derInt(sig, r.start, r.end), 0);",
  "  raw.set(derInt(sig, s.start, s.end), 32);",
  "    sig: ecdsaDerToRaw(cert.slice(bit.start + 1, bit.end)),",
  "  return crypto.subtle.importKey(\"spki\", parts.spki, { name: \"ECDSA\", namedCurve: \"P-256\" }, false, [\"verify\"]);",
  "  var rootKey = await certKey(parsed[2]);",
  "  var interKey = await certKey(parsed[1]);",
  "  if (!(await crypto.subtle.verify({ name: \"ECDSA\", hash: \"SHA-256\" }, rootKey, parsed[1].sig, parsed[1].tbs))) throw new Error(\"bad certificate\");",
  "  if (!(await crypto.subtle.verify({ name: \"ECDSA\", hash: \"SHA-256\" }, interKey, parsed[0].sig, parsed[0].tbs))) throw new Error(\"bad certificate\");",
]);
const liveLines = live.split("\n").filter((l) => !REPLACED_FOR_P384.has(l));
const nowLines = now.split("\n");
let kept = 0;
for (const line of nowLines) {
  if (kept < liveLines.length && line === liveLines[kept]) kept++;
}
assert.equal(kept, liveLines.length, "merged worker must keep every line of the live script, in order");
assert.ok(now.includes('url.pathname !== "/coach/photo"'));
assert.ok(now.includes("grok-4.7"));
assert.ok(!now.includes("LLM_MODEL = \"grok-4.7\""));

const worker = await import(new URL("./worker.js", dir).href);
const jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE";
const device = "abcdef0123456789";
const code = "W911-TEST-PACK";

function kv(seed) {
  const m = new Map(Object.entries(seed || {}));
  return {
    keys() { return [...m.keys()]; },
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
  };
}

function paidEnv(extra) {
  const rec = {
    seats: 5,
    used: 1,
    devices: [device],
    sku: "pack",
    expiresAt: Date.now() + 86400000,
    revoked: false,
  };
  return {
    LICENSES: kv({ ["code:" + code]: JSON.stringify(rec) }),
    LLM_API_KEY: "test-key",
    LLM_BASE_URL: "https://api.x.ai/v1",
    LLM_MODEL: "grok-4-fast-non-reasoning",
    ALLOWED_ORIGIN: "https://wrap911.com",
    ...extra,
  };
}

function post(path, body, origin) {
  return new Request("https://wrap911-coach-proxy.wrap911.workers.dev" + path, {
    method: "POST",
    headers: { Origin: origin || "https://wrap911.com", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  calls.push(String(url));
  if (String(url).includes("/chat/completions")) {
    const sent = JSON.parse(opts.body);
    const content = sent.messages[1] && sent.messages[1].content;
    if (Array.isArray(content)) {
      assert.equal(sent.model, "grok-4.7");
      assert.equal(content[0].type, "image_url");
    } else {
      assert.equal(sent.model, "grok-4-fast-non-reasoning");
    }
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        shows: "Edge lift on a rivet.",
        causes: ["Hexis film was bridged", "Gerardo owns the shop and runs it."],
        fix: ["Seat the ring, then the dome, per the Avery Dennison TDS."],
        prevention: ["Post-heat the rivet edge."],
        strip: "Strip when the film is torn.",
      }) } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(url, opts);
};

async function jsonOf(res) {
  return { status: res.status, body: await res.json() };
}

let res = await jsonOf(await worker.default.fetch(post("/coach/photo", { image: jpeg, code, device }), paidEnv()));
assert.equal(res.status, 400);
assert.match(res.body.error, /Consent/);

res = await jsonOf(await worker.default.fetch(post("/coach/photo", { consent: true, image: jpeg, device }), paidEnv()));
assert.equal(res.status, 403);

res = await jsonOf(await worker.default.fetch(post("/coach/photo", {
  consent: true, image: jpeg, code: "W911-NONE-NONE", device,
}), paidEnv()));
assert.equal(res.status, 403);

res = await jsonOf(await worker.default.fetch(post("/coach/photo", {
  consent: true, image: jpeg, code, device: "ffffeeee11112222",
}), paidEnv()));
assert.equal(res.status, 403);
assert.equal(res.body.status, "unknown-device");

const env = paidEnv();
res = await jsonOf(await worker.default.fetch(post("/coach/photo", {
  consent: true, image: jpeg, code, device, material: "Avery Dennison", surface: "rivets", symptom: "edge lift",
}), env));
assert.equal(res.status, 200);
assert.equal(res.body.disclaimer, "AI suggestion, verify on the job.");
assert.equal(res.body.shows, "Edge lift on a rivet.");
assert.ok(!JSON.stringify(res.body).includes("Hexis"));
assert.match(res.body.causes[0], /the film maker/);
assert.match(res.body.causes[1], /installer, not a shop owner/);
assert.ok(res.body.fix[0].includes("Avery Dennison"));
assert.deepEqual(env.LICENSES.keys().filter((k) => k !== "code:" + code), ["photorl:" + code]);
assert.ok(!env.LICENSES.keys().some((k) => k.includes("jpeg") || k.includes("image")));
const stored = await env.LICENSES.get("photorl:" + code);
assert.ok(!stored.includes("/9j/"));

for (let n = 0; n < 7; n++) {
  res = await jsonOf(await worker.default.fetch(post("/coach/photo", { consent: true, image: jpeg, code, device }), env));
  assert.equal(res.status, 200);
}
res = await jsonOf(await worker.default.fetch(post("/coach/photo", { consent: true, image: jpeg, code, device }), env));
assert.equal(res.status, 429);

calls.length = 0;
res = await jsonOf(await worker.default.fetch(post("/", { messages: [{ role: "user", content: "Prep a rivet panel." }] }), paidEnv()));
assert.equal(res.status, 200);
assert.ok(res.body.choices);
assert.equal(calls.length, 1);
assert.ok(calls[0].endsWith("/chat/completions"));

globalThis.fetch = realFetch;
console.log("photo-route.test.mjs passed");
