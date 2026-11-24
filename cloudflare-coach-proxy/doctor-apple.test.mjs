import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import worker, { __resetDoctorLimitsForTests, doctorTierFromClaims, doctorAppleGate } from "./worker.js";

const SAMPLE = readFileSync(fileURLToPath(new URL("./magenta-rivet-field-tented-heads.jpg", import.meta.url)));
const SAMPLE_URL = "data:image/jpeg;base64," + SAMPLE.toString("base64");
const DAY = 86400000;
const O = "https://wrap911.com";

function kv() {
  const m = new Map();
  return { async get(k) { return m.has(k) ? m.get(k) : null; }, async put(k, v) { m.set(k, v); }, m };
}
function env(extra) {
  return Object.assign({ LLM_API_KEY: "test-key", LLM_BASE_URL: "https://api.x.ai/v1", LLM_VISION_MODEL: "grok-4.7", DOCTOR_TEST_IP: "1", DOCTOR_RATE_PER_HOUR: "50", LICENSES: kv() }, extra || {});
}
const tx = (productId, ageDays, extra) => Object.assign({ bundleId: "com.wrap911.trainer", productId, environment: "Production", originalTransactionId: "2000000111", purchaseDate: Date.now() - ageDays * DAY }, extra || {});
const PACK = "com.wrap911.trainer.pack.12mo", SEAT = "com.wrap911.trainer.seat.12mo", PASS = "com.wrap911.trainer.pass.7d";

test("tiers: seat/pack 365d, pass 7d, revoked/expired free", () => {
  const now = Date.now();
  assert.equal(doctorTierFromClaims(tx(PACK, 100), now).limit, 15);
  assert.equal(doctorTierFromClaims(tx(SEAT, 364), now).limit, 15);
  assert.equal(doctorTierFromClaims(tx(SEAT, 366), now).limit, 1);
  assert.equal(doctorTierFromClaims(tx(PASS, 6), now).limit, 15);
  assert.equal(doctorTierFromClaims(tx(PASS, 8), now).limit, 1);
  assert.equal(doctorTierFromClaims(tx(PACK, 1, { revocationDate: Date.now() }), now).limit, 1);
  assert.equal(doctorTierFromClaims(tx("com.other.x", 1), now).limit, 1);
});

test("gate: website request (no jws, no device) is not gated", async () => {
  assert.equal(await doctorAppleGate(env(), { consent: true }, O), null);
});

test("gate: device-only gets 1/day, then 429; counts in doctorrl:dev:*", async () => {
  const e = env();
  const b = { device: "device-abcdef12" };
  assert.equal(await doctorAppleGate(e, b, O), null);
  const r = await doctorAppleGate(e, b, O);
  assert.equal(r.status, 429);
  assert.ok(e.LICENSES.m.has("doctorrl:dev:device-abcdef12"));
  assert.equal(await doctorAppleGate(e, { device: "device-other123" }, O), null);
});

test("gate: paid transaction gets 15/day keyed doctorrl:apple:<id>", async () => {
  const e = env();
  const v = async () => tx(PACK, 2);
  for (let i = 0; i < 15; i++) assert.equal(await doctorAppleGate(e, { jws: "x", device: "device-abcdef12" }, O, v), null, "read " + i);
  assert.equal((await doctorAppleGate(e, { jws: "x", device: "device-abcdef12" }, O, v)).status, 429);
  assert.ok(e.LICENSES.m.has("doctorrl:apple:2000000111"));
  assert.ok(!e.LICENSES.m.has("doctorrl:dev:device-abcdef12"));
});

test("gate: expired or revoked purchase falls to 1/day per device", async () => {
  const e = env();
  const expired = async () => tx(PASS, 9);
  assert.equal(await doctorAppleGate(e, { jws: "x", device: "device-abcdef12" }, O, expired), null);
  assert.equal((await doctorAppleGate(e, { jws: "x", device: "device-abcdef12" }, O, expired)).status, 429);
  const revoked = async () => tx(PACK, 1, { revocationDate: Date.now() });
  assert.equal(await doctorAppleGate(e, { jws: "x", device: "device-revoked01" }, O, revoked), null);
});

test("gate: never 400. Wrong bundle, bad environment, bad receipt, missing jws all get the free read", async () => {
  const cases = [
    async () => tx(PACK, 1, { bundleId: "com.evil" }),
    async () => tx(PACK, 1, { environment: "Xcode" }),
    async () => { throw new Error("bad"); },
    async () => null,
  ];
  for (let i = 0; i < cases.length; i++) {
    const e = env();
    const b = { jws: "x", device: "device-case-000" + i };
    assert.equal(await doctorAppleGate(e, b, O, cases[i]), null, "free read " + i);
    const second = await doctorAppleGate(e, b, O, cases[i]);
    assert.equal(second.status, 429, "limit " + i);
    assert.equal((await second.json()).error, "Too many reads. Wait and try again.");
    assert.ok(e.LICENSES.m.has("doctorrl:dev:device-case-000" + i));
  }
  const e = env();
  assert.equal(await doctorAppleGate(e, { jws: "", device: "device-empty-001" }, O), null);
  assert.equal(await doctorAppleGate(e, { jws: "not-a-jws", device: "device-empty-002" }, O), null);
  assert.equal(await doctorAppleGate(e, { jws: "not-a-jws" }, O), null);
});

test("gate: Sandbox (TestFlight) transaction counts as paid", async () => {
  const e = env();
  const v = async () => tx(PASS, 1, { environment: "Sandbox", originalTransactionId: "2000000555" });
  for (let i = 0; i < 15; i++) assert.equal(await doctorAppleGate(e, { jws: "x", device: "device-abcdef12" }, O, v), null);
  assert.equal((await doctorAppleGate(e, { jws: "x", device: "device-abcdef12" }, O, v)).status, 429);
  assert.ok(e.LICENSES.m.has("doctorrl:apple:2000000555"));
});

async function post(body, e, ip) {
  return worker.fetch(new Request("https://worker.test/coach/doctor", {
    method: "POST",
    headers: { "content-type": "application/json", origin: O, "x-test-ip": ip || "203.0.113.50" },
    body: JSON.stringify(body),
  }), e);
}

test("route: consent and image errors come first and do not count; bogus jws gets the free read", async () => {
  __resetDoctorLimitsForTests();
  const e = env();
  const orig = globalThis.fetch;
  let upstream = 0;
  globalThis.fetch = async () => { upstream++; return new Response(JSON.stringify({ output: [{ type: "message", content: [{ type: "output_text", text: "{\"observations\":\"Edge lift.\",\"confidence\":\"medium\"}" }] }] }), { status: 200 }); };
  try {
    let r = await post({ device: "device-abcdef12" }, e);
    assert.equal(r.status, 400); assert.match((await r.json()).error, /Confirm the photo can be sent/);
    r = await post({ consent: true, device: "device-abcdef12" }, e);
    assert.equal(r.status, 400); assert.match((await r.json()).error, /Add a photo or a few still frames/);
    assert.equal(e.LICENSES.m.size, 0);
    // bogus jws plus a device: free read (200), then the normal limit message, never a 400
    r = await post({ consent: true, images: [SAMPLE_URL], jws: "a.b.c", device: "device-abcdef12" }, e);
    assert.equal(r.status, 200);
    r = await post({ consent: true, images: [SAMPLE_URL], jws: "a.b.c", device: "device-abcdef12" }, e);
    assert.equal(r.status, 429); assert.equal((await r.json()).error, "Too many reads. Wait and try again.");
    // empty jws plus another device behaves the same
    r = await post({ consent: true, images: [SAMPLE_URL], jws: "", device: "device-second-01" }, e);
    assert.equal(r.status, 200);
    assert.equal(upstream, 2);
    // website request: unchanged, no KV counting
    const before = e.LICENSES.m.size;
    r = await post({ consent: true, images: [SAMPLE_URL], note: "x" }, e);
    assert.equal(r.status, 200);
    assert.equal(e.LICENSES.m.size, before);
  } finally { globalThis.fetch = orig; }
});
