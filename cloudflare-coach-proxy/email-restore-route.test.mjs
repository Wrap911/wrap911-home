import assert from "node:assert/strict";
import worker from "./worker.js";
import { storeEmailPurchase } from "./license-restore.js";

const BASE = "https://wrap911-coach-proxy.wrap911.workers.dev";
const APP = "capacitor://localhost";
const SEAT = "com.wrap911.trainer.seat.12mo";

function kv() {
  const m = new Map();
  return {
    map: m,
    async get(k, type) { if (!m.has(k)) return null; const v = m.get(k); return type === "json" ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
  };
}
function post(path, body, origin) {
  return new Request(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin || APP },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
async function call(req, env) {
  const res = await worker.fetch(req, env);
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  return { status: res.status, data, cors: res.headers.get("Access-Control-Allow-Origin") };
}

const realFetch = globalThis.fetch;
const resend = [];
globalThis.fetch = async (url, init) => {
  if (String(url) !== "https://api.resend.com/emails") throw new Error("unexpected fetch " + url);
  resend.push({ headers: init.headers, body: JSON.parse(init.body) });
  return new Response(JSON.stringify({ id: "re_route_" + resend.length }), { status: 200 });
};

const store = kv();
const now = Date.now();
await storeEmailPurchase({ LICENSES: store }, {
  email: "buyer@example.com", jws: "signed-jws", productId: SEAT, transactionId: "2000000999",
  purchaseDate: now - 86400000, expiresAt: now - 86400000 + 365 * 86400000, sku: "seat", seats: 1,
});

/* No RESEND_API_KEY: clear 503, no outbound call. */
let r = await call(post("/license/restore/start", { email: "buyer@example.com" }), { LICENSES: store });
assert.equal(r.status, 503);
assert.equal(r.data.ok, false);
assert.equal(r.data.code, "EMAIL_NOT_CONFIGURED");
assert.equal(r.cors, APP);
assert.equal(resend.length, 0);

/* No KV at all: 503 too. */
r = await call(post("/license/restore/start", { email: "buyer@example.com" }), { RESEND_API_KEY: "k" });
assert.equal(r.status, 503);

/* With the key: one Resend POST with a 6-digit code. */
const env = { LICENSES: store, RESEND_API_KEY: "route-test-key" };
r = await call(post("/license/restore/start", { email: "Buyer@Example.com" }), env);
assert.equal(r.status, 200);
assert.equal(r.data.ok, true);
assert.equal(resend.length, 1);
assert.equal(resend[0].headers.Authorization, "Bearer route-test-key");
assert.equal(resend[0].body.from, "WRAP 911 <info@wrap911.com>");
assert.deepEqual(resend[0].body.to, ["buyer@example.com"]);
const code = (resend[0].body.text.match(/\b(\d{6})\b/) || [])[1];
assert.ok(code && code.length === 6);

/* Unknown email: 200 ok, nothing sent (no address probing). */
r = await call(post("/license/restore/start", { email: "nobody@example.com" }), env);
assert.equal(r.status, 200);
assert.equal(resend.length, 1);

/* Verify with the emailed code. Stored JWS is re-verified with Apple's chain; a fake one fails closed. */
r = await call(post("/license/restore/verify", { email: "buyer@example.com", code: code === "000000" ? "000001" : "000000" }), env);
assert.equal(r.status, 400);
r = await call(post("/license/restore/verify", { email: "buyer@example.com", code }), env);
assert.equal(r.status, 410, "fake JWS must not restore");
assert.notEqual(r.data.ok, true);

/* Bind rejects a junk JWS and a bad email. */
r = await call(post("/license/apple/bind", { email: "buyer@example.com", jws: "a.b.c" }), env);
assert.equal(r.status, 400);
r = await call(post("/license/apple/bind", { email: "nope", jws: "a.b.c" }), env);
assert.equal(r.status, 400);
r = await call(post("/license/apple/bind", "{not json"), env);
assert.equal(r.status, 400);

/* GET on a restore route is 405, not the coach hint. */
r = await call(new Request(BASE + "/license/restore/start", { headers: { Origin: APP } }), env);
assert.equal(r.status, 405);

/* Live routes behave as before (matches the 2026-10-12 live probe). */
r = await call(new Request(BASE + "/"), env);
assert.equal(r.status, 200);
assert.equal(r.data.service, "wrap911-coach-proxy");
r = await call(post("/lead", { email: "bad" }, "https://wrap911.com"), env);
assert.equal(r.status, 400);
assert.equal(r.data.error, "Enter a valid email.");
r = await call(new Request(BASE + "/lead", { headers: { Origin: "https://wrap911.com" } }), env);
assert.equal(r.status, 405);
r = await call(post("/stripe/webhook", "{}", "https://wrap911.com"), env);
assert.equal(r.status, 500);
assert.equal(r.data.error, "Webhook secret is not configured.");
r = await call(post("/license/redeem", { code: "x" }, "https://wrap911.com"), env);
assert.equal(r.status, 400);
assert.equal(r.data.error, "Not a WRAP 911 code.");
r = await call(post("/license/apple", {}, APP), env);
assert.equal(r.status, 400);
assert.equal(r.data.error, "Invalid Apple receipt.");
r = await call(post("/coach/photo", {}, "https://wrap911.com"), env);
assert.equal(r.status, 400);
assert.equal(r.data.error, "Consent is required before a photo is sent.");
r = await call(post("/", { messages: [] }, "https://evil.example"), env);
assert.equal(r.status, 403);
r = await call(post("/", { messages: [] }, "https://wrap911.com"), { ...env, LLM_API_KEY: "x" });
assert.equal(r.status, 400);
assert.equal(r.data.error, "messages array required");

assert.equal(resend.length, 1);
globalThis.fetch = realFetch;
console.log("email-restore-route tests passed");
