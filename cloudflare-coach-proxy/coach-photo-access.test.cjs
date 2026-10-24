/* node cloudflare-coach-proxy/coach-photo-access.test.js */
var assert = require("assert");
var A = require("./coach-photo-access.cjs");

var NOW = Date.parse("2026-06-01T00:00:00.000Z");
var PURCHASE = NOW - 10 * 86400000;
var JPEG = "data:image/jpeg;base64,QQ==";

function tx(extra) {
  var row = {
    bundleId: "com.wrap911.trainer",
    productId: "com.wrap911.trainer.seat.12mo",
    originalTransactionId: "1000001234567890",
    purchaseDate: PURCHASE,
    environment: "Production"
  };
  if (extra) Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
  return row;
}

function deps(txRow, rec) {
  return {
    now: NOW,
    verifyAppleJws: function () { return Promise.resolve(txRow); },
    lookupCode: function () { return Promise.resolve(rec || null); },
    recordStatus: function () { return Promise.resolve("ok"); }
  };
}

async function main() {
  var noConsent = await A.authorizePhoto({ image: JPEG }, deps(tx()));
  assert.strictEqual(noConsent.statusCode, 400);

  var seat = await A.authorizePhoto({ consent: true, appleJws: "a.b.c", image: JPEG, code: "W911-AAAA-AAAA" }, deps(tx(), null));
  assert.strictEqual(seat.ok, true);
  assert.strictEqual(seat.via, "apple");
  assert.strictEqual(seat.rateKey, "apple:1000001234567890");
  assert.strictEqual(seat.frames.length, 1);

  var pack = await A.authorizePhoto({
    consent: true,
    appleJws: "a.b.c",
    images: [JPEG, JPEG, JPEG, JPEG]
  }, deps(tx({ productId: "com.wrap911.trainer.pack.12mo", environment: "Sandbox" })));
  assert.strictEqual(pack.ok, true);
  assert.strictEqual(pack.frames.length, 4);
  assert.strictEqual(pack.productId, "com.wrap911.trainer.pack.12mo");
  assert.strictEqual(A.photoUserContent(pack.frames, "rivets").length, 5);

  var tooMany = await A.authorizePhoto({ consent: true, appleJws: "a.b.c", images: [JPEG, JPEG, JPEG, JPEG, JPEG] }, deps(tx()));
  assert.strictEqual(tooMany.statusCode, 400);

  var expired = await A.authorizePhoto({ consent: true, appleJws: "a.b.c", image: JPEG }, deps(tx({ purchaseDate: NOW - 400 * 86400000 })));
  assert.strictEqual(expired.statusCode, 403);

  var refunded = await A.authorizePhoto({ consent: true, appleJws: "a.b.c", image: JPEG }, deps(tx({ revocationDate: NOW - 1000 })));
  assert.strictEqual(refunded.ok, false);

  var rec = { devices: ["0123456789abcdef"], expiresAt: NOW + 86400000 };
  var byCode = await A.authorizePhoto({
    consent: true,
    code: "W911-ABCD-EFGH",
    device: "0123456789abcdef",
    images: [JPEG, JPEG]
  }, deps(null, rec));
  assert.strictEqual(byCode.ok, true);
  assert.strictEqual(byCode.via, "code");
  assert.strictEqual(byCode.rateKey, "W911-ABCD-EFGH");
  assert.strictEqual(byCode.frames.length, 2);

  var unknownPhone = await A.authorizePhoto({
    consent: true,
    code: "W911-ABCD-EFGH",
    device: "zzzzzzzzzzzzzzzz",
    image: JPEG
  }, deps(null, rec));
  assert.strictEqual(unknownPhone.statusCode, 403);
  assert.strictEqual(unknownPhone.reason, "unknown-device");

  assert.ok(A.PHOTO_PROMPT.indexOf("BriteLine") !== -1);
  assert.strictEqual(A.PHOTO_PROMPT.indexOf("Arlon"), -1);
  assert.ok(A.PHOTO_PROMPT.indexOf("installer") !== -1);
  assert.ok(A.PHOTO_PROMPT.indexOf("does not own or run a shop") !== -1);
  console.log("coach-photo-access tests ok");
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
