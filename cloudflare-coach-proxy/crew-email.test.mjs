import assert from "node:assert/strict";
import { crewCodesEmailContent, crewCodesResendPayload, handleCrewEmail, allowCrewEmailSend } from "./crew-email.js";
import { RESEND_URL, RESTORE_FROM } from "./license-restore.js";

const codes = ["W911-AAAA-1111", "W911-BBBB-2222", "W911-CCCC-3333", "W911-DDDD-4444"];
const copy = crewCodesEmailContent(codes, Date.parse("2027-11-25T00:00:00Z"));
assert.match(copy.text, /W911-AAAA-1111/);
assert.match(copy.text, /W911-DDDD-4444/);
assert.match(copy.text, /website trainer/);
assert.match(copy.text, /Do not type these codes in the iPhone app/);
assert.doesNotMatch(copy.text, /Stripe|buy\.stripe|Arlon|\$29|\d+\s*°/i);
const payload = crewCodesResendPayload("buyer@example.com", codes, Date.parse("2027-11-25T00:00:00Z"));
assert.equal(payload.from, RESTORE_FROM);
assert.deepEqual(payload.to, ["buyer@example.com"]);
assert.equal(payload.reply_to, "info@wrap911.com");

function kv() {
  const store = new Map();
  return {
    async get(key, type) {
      const raw = store.get(key);
      if (raw == null) return null;
      if (type === "json") return JSON.parse(raw);
      return raw;
    },
    async put(key, val) { store.set(key, typeof val === "string" ? val : JSON.stringify(val)); },
    _store: store
  };
}

const packTx = {
  bundleId: "com.wrap911.trainer",
  productId: "com.wrap911.trainer.pack.12mo",
  originalTransactionId: "2000000111111111",
  environment: "Sandbox",
  purchaseDate: Date.now() - 1000
};

function deps(overrides) {
  return Object.assign({
    verifyAppleJws: async () => packTx,
    issueAppleSeatCodes: async () => ({ sku: "pack", codes: codes, expiresAt: Date.now() + 86400000 * 30 }),
    APPLE_BUNDLE_ID: "com.wrap911.trainer",
    APPLE_PACK_SKU: "com.wrap911.trainer.pack.12mo",
    now: Date.now()
  }, overrides);
}

async function call(body, env, d) {
  const request = { method: "POST", json: async () => body };
  return handleCrewEmail(request, env, "https://wrap911.com", d || deps());
}

const sent = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url) !== RESEND_URL) throw new Error("unexpected fetch " + url);
  sent.push(JSON.parse(init.body));
  return new Response(JSON.stringify({ id: "re_crew_" + sent.length }), { status: 200 });
};

let env = { LICENSES: kv(), RESEND_API_KEY: "test-resend-key" };
let out = await call({ email: "buyer@example.com", jws: "header.payload.sig" }, env);
assert.equal(out.status, 200);
assert.deepEqual(out.body, { ok: true });
assert.equal(sent.length, 1);
assert.deepEqual(sent[0].to, ["buyer@example.com"]);
assert.match(sent[0].text, /W911-AAAA-1111/);
assert.equal(JSON.stringify(out.body).indexOf("W911-"), -1, "HTTP body must not include the codes");

out = await call({ email: "nope" }, env);
assert.equal(out.status, 400);

out = await call({ email: "buyer@example.com", jws: "x" }, env, deps({
  verifyAppleJws: async () => { throw new Error("bad"); }
}));
assert.equal(out.status, 400);

out = await call({ email: "buyer@example.com", jws: "x" }, env, deps({
  verifyAppleJws: async () => ({ ...packTx, productId: "com.wrap911.trainer.seat.12mo" })
}));
assert.equal(out.status, 400);
assert.match(out.body.error, /Shop Pack/);

out = await call({ email: "buyer@example.com", jws: "x" }, { LICENSES: kv() });
assert.equal(out.status, 503);
assert.equal(out.body.code, "EMAIL_NOT_CONFIGURED");

const limited = kv();
const now = 1_700_000_000_000;
for (let i = 0; i < 5; i++) {
  const g = await allowCrewEmailSend({ LICENSES: limited }, packTx.originalTransactionId, now);
  assert.equal(g.ok, true);
  g.rec.sends.push(now);
  await limited.put(g.key, JSON.stringify(g.rec));
}
const blocked = await allowCrewEmailSend({ LICENSES: limited }, packTx.originalTransactionId, now + 1000);
assert.equal(blocked.ok, false);
assert.equal(blocked.status, 429);

globalThis.fetch = realFetch;
console.log("crew-email.test.mjs ok");
