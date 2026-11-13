import assert from "node:assert/strict";
import {
  hashRestoreCode,
  newRestoreCode,
  normalizeEmail,
  pickActive,
  startEmailRestore,
  storeEmailPurchase,
  timingSafeEqual,
  verifyEmailRestore,
} from "./license-restore.js";

const YEAR = 365 * 86400000;
const NOW = Date.parse("2026-06-01T00:00:00.000Z");
const PACK = "com.wrap911.trainer.pack.12mo";
const SEAT = "com.wrap911.trainer.seat.12mo";

function kv() {
  const map = new Map();
  return {
    map,
    async get(key, type) {
      if (!map.has(key)) return null;
      const v = map.get(key);
      return type === "json" ? JSON.parse(v) : v;
    },
    async put(key, value) { map.set(key, String(value)); },
    async delete(key) { map.delete(key); },
  };
}

assert.equal(normalizeEmail("  Buyer@Example.com "), "buyer@example.com");
assert.equal(normalizeEmail("not-an-email"), "");
assert.equal(newRestoreCode(new Uint8Array([0, 0, 1, 44])), "000300");
assert.equal(timingSafeEqual("abc", "abc"), true);
assert.equal(timingSafeEqual("abc", "abd"), false);

const bought = NOW - 100 * 86400000;
const expires = bought + YEAR;
const chosen = pickActive([
  { sku: "seat", productId: SEAT, transactionId: "s", purchaseDate: bought, expiresAt: expires, jws: "seat-jws" },
  { sku: "pack", productId: PACK, transactionId: "p", purchaseDate: bought - 86400000, expiresAt: bought - 86400000 + YEAR, jws: "pack-jws" },
], NOW);
assert.equal(chosen.sku, "pack");
assert.equal(chosen.expiresAt, expires);
assert.notEqual(chosen.expiresAt, NOW + YEAR);
assert.equal(pickActive([{ sku: "seat", expiresAt: NOW - 1, jws: "x" }], NOW), null);

const store = kv();
const sent = [];
const calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init });
  sent.push(JSON.parse(init.body));
  return new Response(JSON.stringify({ id: "re_test_" + sent.length }), { status: 200, headers: { "Content-Type": "application/json" } });
};
const env = {
  LICENSES: store,
  RESEND_API_KEY: "test-resend-key",
};
await storeEmailPurchase(env, {
  email: "Buyer@Example.com",
  jws: "signed-jws",
  productId: SEAT,
  transactionId: "orig-9",
  purchaseDate: bought,
  expiresAt: expires,
  sku: "seat",
  seats: 1,
});

const missing = await startEmailRestore({ email: "nobody@example.com" }, env, NOW);
assert.equal(missing[1], 200);
assert.equal(missing[0].ok, true);
assert.equal(sent.length, 0);

const unconfigured = await startEmailRestore({ email: "buyer@example.com" }, { LICENSES: store }, NOW);
assert.equal(unconfigured[1], 503);
assert.equal(unconfigured[0].ok, false);
assert.equal(unconfigured[0].code, "EMAIL_NOT_CONFIGURED");
assert.equal(calls.length, 0);

const started = await startEmailRestore({ email: "buyer@example.com" }, env, NOW);
assert.equal(started[1], 200);
assert.equal(sent.length, 1);
assert.equal(calls[0].url, "https://api.resend.com/emails");
assert.equal(calls[0].init.method, "POST");
assert.equal(calls[0].init.headers.Authorization, "Bearer test-resend-key");
assert.equal(calls[0].init.headers["Content-Type"], "application/json");
assert.equal(sent[0].from, "WRAP 911 <info@wrap911.com>");
assert.deepEqual(sent[0].to, ["buyer@example.com"]);
assert.equal(sent[0].reply_to, "info@wrap911.com");
assert.equal(sent[0].subject, "Your WRAP 911 restore code");
assert.match(sent[0].text, /Restore with email/);
assert.equal(sent[0].html, undefined);
const code = (sent[0].text.match(/\b(\d{6})\b/) || [])[1];
assert.equal(code.length, 6);

const again = await startEmailRestore({ email: "buyer@example.com" }, env, NOW + 1000);
assert.equal(again[0].ok, true);
assert.equal(sent.length, 1);

const badCode = code === "000000" ? "000001" : "000000";
const bad = await verifyEmailRestore({ email: "buyer@example.com", code: badCode }, env, async () => ({ ok: true }), NOW);
assert.equal(bad[1], 400);

const verified = await verifyEmailRestore(
  { email: "buyer@example.com", code },
  env,
  async (jws) => {
    assert.equal(jws, "signed-jws");
    return { productId: SEAT };
  },
  NOW
);
assert.equal(verified[1], 200);
assert.equal(verified[0].sku, "seat");
assert.equal(verified[0].productId, SEAT);
assert.equal(verified[0].transactionId, "orig-9");
assert.equal(verified[0].purchaseDate, bought);
assert.equal(verified[0].expiresAt, expires);
assert.equal(verified[0].jws, "signed-jws");
assert.notEqual(verified[0].expiresAt, NOW + YEAR);

const reused = await verifyEmailRestore({ email: "buyer@example.com", code }, env, async () => ({}), NOW);
assert.equal(reused[1], 400);

const hash = await hashRestoreCode("buyer@example.com", code);
assert.equal(typeof hash, "string");
assert.equal(hash.length, 64);

/* Resend failure: 502, and the pending code is removed so a retry can send. */
const failStore = kv();
const failEnv = { LICENSES: failStore, RESEND_API_KEY: "test-resend-key" };
await storeEmailPurchase(failEnv, {
  email: "fail@example.com", jws: "j", productId: PACK, transactionId: "f1",
  purchaseDate: bought, expiresAt: expires, sku: "pack", seats: 5,
});
globalThis.fetch = async () => new Response(JSON.stringify({ message: "domain not verified" }), { status: 403 });
const failed = await startEmailRestore({ email: "fail@example.com" }, failEnv, NOW);
assert.equal(failed[1], 502);
assert.equal(failed[0].ok, false);
globalThis.fetch = realFetch;

console.log("license-restore tests ok");
