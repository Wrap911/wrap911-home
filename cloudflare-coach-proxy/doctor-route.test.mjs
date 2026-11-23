import assert from "node:assert/strict";
import { doctorTierFromClaims } from "./worker.js";

const worker = (await import("./worker.js")).default;
const jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCE";
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ";
const device = "abcdef0123456789";
const code = "W911-TEST-PACK";
const NOW = Date.parse("2026-11-23T12:00:00.000Z");
const DAY = 86400000;

function kv(seed) {
  const m = new Map(Object.entries(seed || {}));
  return {
    keys() { return [...m.keys()]; },
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
  };
}
function env(extra) {
  return {
    LICENSES: kv(),
    LLM_API_KEY: "test-key",
    LLM_BASE_URL: "https://api.x.ai/v1",
    ALLOWED_ORIGIN: "https://wrap911.com",
    ...extra,
  };
}
function paidCodeEnv() {
  const rec = { seats: 5, used: 1, devices: [device], sku: "pack", expiresAt: Date.now() + DAY, revoked: false };
  return env({ LICENSES: kv({ ["code:" + code]: JSON.stringify(rec) }) });
}
function post(body, origin) {
  return new Request("https://wrap911-coach-proxy.wrap911.workers.dev/coach/doctor", {
    method: "POST",
    headers: { Origin: origin || "https://wrap911.com", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  calls.push(String(url));
  const sent = JSON.parse(opts.body);
  assert.equal(sent.model, "grok-4.7");
  const content = sent.messages[1].content;
  assert.equal(content[0].type, "image_url");
  assert.ok(!JSON.stringify(sent).includes("data:image") || content[0].image_url.url.startsWith("data:image/"));
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({
      observations: "Edge lift. Heat to 180 F. Hexis film.",
      likely_causes: ["Hexis was bridged", "Gerardo owns the shop and runs it."],
      fix_steps: ["Follow the Avery Dennison TDS."],
      prevention: ["Seat the rivet."],
      lesson_keywords: ["rivet"],
      confidence: "high",
    }) } }],
  }), { status: 200, headers: { "content-type": "application/json" } });
};
async function jsonOf(res) {
  return { status: res.status, body: await res.json() };
}

assert.equal(doctorTierFromClaims(null, NOW).limit, 1);
assert.equal(doctorTierFromClaims({ productId: "com.wrap911.trainer.seat.12mo", purchaseDate: NOW - 10 * DAY, originalTransactionId: "100" }, NOW).limit, 15);
assert.equal(doctorTierFromClaims({ productId: "com.wrap911.trainer.pack.12mo", purchaseDate: NOW - 364 * DAY, originalTransactionId: "200" }, NOW).limit, 15);
assert.equal(doctorTierFromClaims({ productId: "com.wrap911.trainer.pack.12mo", purchaseDate: NOW - 366 * DAY, originalTransactionId: "200" }, NOW).limit, 1);
assert.equal(doctorTierFromClaims({ productId: "com.wrap911.trainer.pass.7d", purchaseDate: NOW - 6 * DAY, originalTransactionId: "300" }, NOW).limit, 15);
assert.equal(doctorTierFromClaims({ productId: "com.wrap911.trainer.pass.7d", purchaseDate: NOW - 8 * DAY, originalTransactionId: "300" }, NOW).limit, 1);
assert.equal(doctorTierFromClaims({ productId: "com.wrap911.trainer.seat.12mo", purchaseDate: NOW - DAY, originalTransactionId: "100", revocationDate: NOW }, NOW).limit, 1);

let res = await jsonOf(await worker.fetch(post({}), env()));
assert.equal(res.status, 400);
assert.equal(res.body.error, "Confirm the photo can be sent. Nothing is stored.");
assert.equal(calls.length, 0);

res = await jsonOf(await worker.fetch(post({ consent: true }), env()));
assert.equal(res.status, 400);
assert.equal(res.body.error, "Add a photo or a few still frames.");

res = await jsonOf(await worker.fetch(post({ consent: true, images: ["nope"] }), env()));
assert.equal(res.status, 400);
assert.equal(res.body.error, "Send a JPEG or PNG.");

res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg] }, "https://evil.example"), env()));
assert.equal(res.status, 403);
assert.equal(res.body.error, "Origin not allowed");
assert.equal(calls.length, 0);

res = await jsonOf(await worker.fetch(new Request("https://wrap911-coach-proxy.wrap911.workers.dev/coach/doctor", { method: "GET" }), env()));
assert.equal(res.status, 405);

res = await jsonOf(await worker.fetch(post({ consent: true, jws: "a.b.c", device, images: [jpeg] }), env()));
assert.equal(res.status, 400);
assert.equal(res.body.error, "Invalid Apple receipt.");
assert.equal(calls.length, 0);

const web = env();
res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg], note: "rivet lift" }), web));
assert.equal(res.status, 200);
assert.equal(res.body.ok, true);
assert.equal(res.body.confidence, "high");
assert.ok(!JSON.stringify(res.body).includes("Hexis"));
assert.ok(!JSON.stringify(res.body).includes("180"));
assert.match(res.body.likely_causes[0], /the film maker/);
assert.match(res.body.likely_causes[1], /installer, not a shop owner/);
assert.equal(web.LICENSES.keys().length, 0);
res = await jsonOf(await worker.fetch(post({ consent: true, images: [png], note: "" }), web));
assert.equal(res.status, 200);
assert.equal(web.LICENSES.keys().length, 0);

const free = env();
res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg], device }), free));
assert.equal(res.status, 200);
assert.deepEqual(free.LICENSES.keys(), ["doctorrl:dev:" + device]);
const stored = await free.LICENSES.get("doctorrl:dev:" + device);
assert.ok(!stored.includes("/9j/"));
res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg], device }), free));
assert.equal(res.status, 429);
assert.match(res.body.error, /Too many reads/);

const coded = paidCodeEnv();
res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg], code: "W911-NONE-NONE", device }), coded));
assert.equal(res.status, 403);
res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg], code, device: "ffffeeee11112222" }), coded));
assert.equal(res.status, 403);
assert.equal(res.body.status, "unknown-device");
for (let n = 0; n < 15; n++) {
  res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg], code, device }), coded));
  assert.equal(res.status, 200);
}
res = await jsonOf(await worker.fetch(post({ consent: true, images: [jpeg], code, device }), coded));
assert.equal(res.status, 429);

globalThis.fetch = realFetch;
console.log("doctor-route.test.mjs passed");
