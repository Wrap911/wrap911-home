/* node trainer/js/iap-logic.test.js */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var L = require("./iap-logic.js");

var YEAR = 365 * 86400000;
var NOW = Date.parse("2026-06-01T00:00:00.000Z");
var PACK = "com.wrap911.trainer.pack.12mo";
var SEAT = "com.wrap911.trainer.seat.12mo";

function tx(id, iso, extra) {
  var row = { productIdentifier: id, purchaseDate: iso, transactionId: "t-" + id };
  if (extra) {
    Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
  }
  return row;
}

var recent = new Date(NOW - 10 * 86400000).toISOString();
var old = new Date(NOW - 400 * 86400000).toISOString();

var pack = L.pickEntitlement([tx(PACK, recent)], NOW);
assert.strictEqual(pack.sku, "pack");
assert.strictEqual(pack.seats, 5);
assert.strictEqual(pack.expiresAt, Date.parse(recent) + YEAR);

assert.strictEqual(L.pickEntitlement([tx(PACK, old)], NOW), null);
assert.strictEqual(L.pickEntitlement([tx(SEAT, recent, { revocationDate: "2026-05-01T00:00:00.000Z" })], NOW), null);
assert.strictEqual(L.pickEntitlement([tx("com.example.other", recent)], NOW), null);

var both = L.pickEntitlement([
  tx(SEAT, new Date(NOW - 5 * 86400000).toISOString()),
  tx(PACK, new Date(NOW - 20 * 86400000).toISOString())
], NOW);
assert.strictEqual(both.sku, "pack");
assert.ok(both.expiresAt > Date.parse(new Date(NOW - 20 * 86400000).toISOString()) + YEAR - 1);

var stated = L.pickEntitlement([
  tx(SEAT, recent, { expirationDate: new Date(NOW + 3 * 86400000).toISOString() })
], NOW);
assert.strictEqual(stated.expiresAt, Date.parse(new Date(NOW + 3 * 86400000).toISOString()));

var lic = L.licenseFrom(pack, NOW);
assert.strictEqual(lic.plan, "pro");
assert.strictEqual(lic.sku, "pack");
assert.strictEqual(lic.source, "apple");
assert.strictEqual(lic.code, "APPLE");
assert.strictEqual(lic.seats, 5);
assert.strictEqual(lic.expiresAt, pack.expiresAt);

var stripe = { plan: "pro", sku: "pack", source: "server", expiresAt: NOW + 200 * 86400000 };
var seatNext = { sku: "seat", expiresAt: NOW + 100 * 86400000 };
assert.strictEqual(L.shouldWrite(stripe, seatNext, NOW, false), false);
assert.strictEqual(L.shouldWrite(stripe, seatNext, NOW, true), false);
var packNext = { sku: "pack", expiresAt: NOW + YEAR };
assert.strictEqual(L.shouldWrite(stripe, packNext, NOW, true), true);
assert.strictEqual(L.shouldWrite(null, seatNext, NOW, true), true);

assert.strictEqual(L.isUsStorefront("USA"), true);
assert.strictEqual(L.isUsStorefront(" us "), true);
assert.strictEqual(L.isUsStorefront("GBR"), false);
assert.strictEqual(L.isUsStorefront(""), false);
assert.strictEqual(L.isUsStorefront(null), false);
assert.strictEqual(L.isNativeApp(), false);

var missing = L.missingProductsMessage();
var stall = L.purchaseStallMessage();
assert.ok(missing.indexOf("not charged") !== -1);
assert.ok(stall.indexOf("did not open") !== -1);
assert.ok(stall.indexOf("not charged") !== -1);
["$149", "$49", "$29"].forEach(function (bad) {
  assert.strictEqual(missing.indexOf(bad), -1);
  assert.strictEqual(stall.indexOf(bad), -1);
});
var iap = fs.readFileSync(path.join(__dirname, "iap.js"), "utf8");
assert.ok(iap.indexOf("PURCHASE_WAIT_MS") !== -1, "purchase must time out instead of leaving the button disabled");
assert.ok(iap.indexOf("iap-4") !== -1, "the bundle marker stays in source");
assert.strictEqual(iap.indexOf('id="iap-diag"'), -1, "the build diagnostic line must not render");
assert.strictEqual(iap.indexOf('id="iap-steps"'), -1, "the tap diagnostic line must not render");
assert.ok(iap.indexOf("Your extra seat codes will appear here") !== -1);
assert.strictEqual(iap.indexOf("btn.onclick"), -1, "buy taps must stay on the document so a re-render cannot drop them");
assert.strictEqual(iap.indexOf("var note ="), -1, "a local var note would hide the diagnostic function and throw on tap");
assert.ok(iap.indexOf('addEventListener("error"') !== -1, "a script error must reach the diagnostic line");
assert.ok(iap.indexOf("pointerdown") !== -1, "a tap must be recorded before the purchase call");
assert.ok(iap.indexOf("diagnostics") !== -1);
assert.ok(iap.indexOf("missingProductsMessage") !== -1);
["$149", "$49", "$29"].forEach(function (bad) {
  assert.strictEqual(iap.indexOf(bad), -1, "iap.js must not hardcode " + bad);
});

var webFiles = ["plan-fix.js", "license-gate.js", "app-core.js", "about.js", "config.js"];
webFiles.forEach(function (name) {
  var src = fs.readFileSync(path.join(__dirname, name), "utf8");
  assert.ok(src.indexOf("$149") !== -1, name + " still has the website pack price");
});

console.log("iap-logic tests ok");
