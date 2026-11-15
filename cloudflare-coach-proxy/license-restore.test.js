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
  claimRestoreDevice,
  emailStorageKey,
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
  { email: "buyer@example.com", code, device: "seatphone1" },
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

async function freshCode(env, email, now) {
  const before = sent.length;
  const started = await startEmailRestore({ email }, env, now);
  assert.equal(started[1], 200);
  assert.equal(sent.length, before + 1);
  return (sent[sent.length - 1].text.match(/\b(\d{6})\b/) || [])[1];
}

async function storedDevices(env, email, transactionId) {
  const rec = await env.LICENSES.get(await emailStorageKey(email), "json");
  const row = (rec.transactions || []).find((item) => item.transactionId === transactionId);
  return row.devices;
}

/* Seat keeps one phone. A new device id replaces the previous one, so delete/reinstall restores.
   A restore with no device id still returns the purchase. */
const seatEnv = { LICENSES: kv(), RESEND_API_KEY: "test-resend-key" };
await storeEmailPurchase(seatEnv, {
  email: "seat@example.com", jws: "seat-jws", productId: SEAT, transactionId: "seat-1",
  purchaseDate: bought, expiresAt: expires, sku: "seat", seats: 1, device: "buyerphone",
});
assert.deepEqual(await storedDevices(seatEnv, "seat@example.com", "seat-1"), ["buyerphone"]);
const seatCode = await freshCode(seatEnv, "seat@example.com", NOW);
const seatMissing = await verifyEmailRestore(
  { email: "seat@example.com", code: seatCode },
  seatEnv,
  async () => ({ productId: SEAT }),
  NOW
);
assert.equal(seatMissing[1], 200);
assert.equal(seatMissing[0].sku, "seat");
assert.deepEqual(await storedDevices(seatEnv, "seat@example.com", "seat-1"), ["buyerphone"]);
const seatCode2 = await freshCode(seatEnv, "seat@example.com", NOW + 120000);
const seatOther = await verifyEmailRestore(
  { email: "seat@example.com", code: seatCode2, device: "otherphone" },
  seatEnv,
  async () => ({ productId: SEAT }),
  NOW + 120000
);
assert.equal(seatOther[1], 200);
assert.equal(seatOther[0].jws, "seat-jws");
assert.deepEqual(await storedDevices(seatEnv, "seat@example.com", "seat-1"), ["otherphone"]);
const seatCode3 = await freshCode(seatEnv, "seat@example.com", NOW + 240000);
const seatSame = await verifyEmailRestore(
  { email: "seat@example.com", code: seatCode3, device: "buyerphone" },
  seatEnv,
  async () => ({ productId: SEAT }),
  NOW + 240000
);
assert.equal(seatSame[1], 200);
assert.equal(seatSame[0].sku, "seat");
assert.deepEqual(await storedDevices(seatEnv, "seat@example.com", "seat-1"), ["buyerphone"]);

/* Shop Pack keeps 5 ids. A 6th verified restore replaces the oldest instead of refusing. */
const packEnv = { LICENSES: kv(), RESEND_API_KEY: "test-resend-key" };
await storeEmailPurchase(packEnv, {
  email: "pack@example.com", jws: "pack-jws", productId: PACK, transactionId: "pack-1",
  purchaseDate: bought, expiresAt: expires, sku: "pack", seats: 5, device: "packphone1",
});
for (let n = 2; n <= 5; n++) {
  const packCode = await freshCode(packEnv, "pack@example.com", NOW + n * 120000);
  const ok = await verifyEmailRestore(
    { email: "pack@example.com", code: packCode, device: "packphone" + n },
    packEnv,
    async () => ({ productId: PACK }),
    NOW + n * 120000
  );
  assert.equal(ok[1], 200, "phone " + n);
  assert.equal(ok[0].seats, 5);
}
assert.deepEqual(await storedDevices(packEnv, "pack@example.com", "pack-1"), [
  "packphone1", "packphone2", "packphone3", "packphone4", "packphone5",
]);
const fullCode = await freshCode(packEnv, "pack@example.com", NOW + 800000);
const packed = await verifyEmailRestore(
  { email: "pack@example.com", code: fullCode, device: "packphone6" },
  packEnv,
  async () => ({ productId: PACK }),
  NOW + 800000
);
assert.equal(packed[1], 200);
assert.equal(packed[0].ok, true);
assert.deepEqual(await storedDevices(packEnv, "pack@example.com", "pack-1"), [
  "packphone2", "packphone3", "packphone4", "packphone5", "packphone6",
]);
const againCode = await freshCode(packEnv, "pack@example.com", NOW + 1000000);
const packAgain = await verifyEmailRestore(
  { email: "pack@example.com", code: againCode, device: "packphone1" },
  packEnv,
  async () => ({ productId: PACK }),
  NOW + 1000000
);
assert.equal(packAgain[1], 200);
assert.deepEqual(await storedDevices(packEnv, "pack@example.com", "pack-1"), [
  "packphone3", "packphone4", "packphone5", "packphone6", "packphone1",
]);

const replaced = claimRestoreDevice(
  { transactions: [{ transactionId: "s", sku: "seat", seats: 1, devices: ["buyerphone"] }] },
  "s",
  "otherphone",
  1
);
assert.equal(replaced.ok, true);
assert.deepEqual(replaced.devices, ["otherphone"]);
const rotated = claimRestoreDevice(
  { transactions: [{ transactionId: "p", sku: "pack", seats: 5, devices: ["phoneaaa", "phonebbb", "phoneccc", "phoneddd", "phoneeee"] }] },
  "p",
  "phonefff",
  5
);
assert.equal(rotated.ok, true);
assert.deepEqual(rotated.devices, ["phonebbb", "phoneccc", "phoneddd", "phoneeee", "phonefff"]);
const kept = claimRestoreDevice(
  { transactions: [{ transactionId: "s", sku: "seat", seats: 1, devices: ["buyerphone"] }] },
  "s",
  "",
  1
);
assert.equal(kept.ok, true);
assert.deepEqual(kept.devices, ["buyerphone"]);

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
