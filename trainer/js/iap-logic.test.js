/* node trainer/js/iap-logic.test.js */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var L = require("./iap-logic.js");

var YEAR = 365 * 86400000;
var WEEK = 7 * 86400000;
var NOW = Date.parse("2026-06-01T00:00:00.000Z");
var PACK = "com.wrap911.trainer.pack.12mo";
var SEAT = "com.wrap911.trainer.seat.12mo";
var PASS = "com.wrap911.trainer.pass.7d";

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

var passRecent = new Date(NOW - 2 * 86400000).toISOString();
var passBuy = L.pickEntitlement([tx(PASS, passRecent)], NOW);
assert.strictEqual(passBuy.sku, "pass");
assert.strictEqual(passBuy.seats, 1);
assert.strictEqual(passBuy.expiresAt, Date.parse(passRecent) + WEEK);
assert.ok(passBuy.expiresAt > NOW);
var passSix = new Date(NOW - 6 * 86400000).toISOString();
assert.ok(L.pickEntitlement([tx(PASS, passSix)], NOW).expiresAt > NOW);
assert.strictEqual(L.pickEntitlement([tx(PASS, new Date(NOW - 8 * 86400000).toISOString())], NOW), null);
var passAndPack = L.pickEntitlement([
  tx(PASS, passRecent),
  tx(PACK, new Date(NOW - 20 * 86400000).toISOString())
], NOW);
assert.strictEqual(passAndPack.sku, "pack");
assert.strictEqual(passAndPack.seats, 5);
var passAndSeat = L.pickEntitlement([
  tx(PASS, passRecent),
  tx(SEAT, new Date(NOW - 30 * 86400000).toISOString())
], NOW);
assert.strictEqual(passAndSeat.sku, "seat");
assert.ok(passAndSeat.expiresAt >= Date.parse(passRecent) + WEEK);

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
var passNext = { sku: "pass", expiresAt: NOW + WEEK };
assert.strictEqual(L.shouldWrite(stripe, passNext, NOW, true), false);

assert.strictEqual(L.isUsStorefront("USA"), true);
assert.strictEqual(L.isUsStorefront(" us "), true);
assert.strictEqual(L.isUsStorefront("GBR"), false);
assert.strictEqual(L.isUsStorefront(""), false);
assert.strictEqual(L.isUsStorefront(null), false);
assert.strictEqual(L.isNativeApp(), false);

var missing = L.missingProductsMessage();
var stall = L.purchaseStallMessage();
var seatDay = Date.parse("2026-10-10T15:00:00.000Z");
var seatBuy = new Date(seatDay).toISOString();
var restoredSeat = L.pickEntitlement([tx(SEAT, seatBuy)], seatDay + 1000);
assert.strictEqual(restoredSeat.sku, "seat");
assert.strictEqual(restoredSeat.expiresAt, seatDay + YEAR);
assert.strictEqual(L.restoreMessage(true, "read failed"), "Purchase restored on this phone.");
assert.strictEqual(L.restoreMessage(false, ""), "Nothing active is stored on this phone. Enter the email you saved with the purchase.");
assert.strictEqual(L.restoreMessage(false, "  Request failed.  "), "Request failed.");
var boughtAt = Date.parse("2026-02-01T00:00:00.000Z");
var originalEnd = boughtAt + YEAR;
var restored = L.licenseFromRestore({
  sku: "seat",
  productId: SEAT,
  transactionId: "orig-1",
  purchaseDate: boughtAt,
  expiresAt: originalEnd
}, NOW);
assert.strictEqual(restored.sku, "seat");
assert.strictEqual(restored.expiresAt, originalEnd);
assert.notStrictEqual(restored.expiresAt, NOW + YEAR);
assert.strictEqual(L.licenseFromRestore({ sku: "seat", purchaseDate: boughtAt, expiresAt: NOW - 1 }, NOW), null);
assert.strictEqual(L.licenseFromRestore({ sku: "pack", purchaseDate: boughtAt, expiresAt: originalEnd }, NOW).seats, 5);
var passEnd = NOW + 3 * 86400000;
var restoredPass = L.licenseFromRestore({
  sku: "pass",
  productId: PASS,
  transactionId: "pass-1",
  purchaseDate: NOW - 2 * 86400000,
  expiresAt: passEnd
}, NOW);
assert.strictEqual(restoredPass.sku, "pass");
assert.strictEqual(restoredPass.seats, 1);
assert.strictEqual(restoredPass.expiresAt, passEnd);
assert.notStrictEqual(restoredPass.expiresAt, NOW + WEEK);
assert.strictEqual(L.licenseFromRestore({ sku: "pass", purchaseDate: boughtAt, expiresAt: NOW - 1 }, NOW), null);

assert.ok(missing.indexOf("not charged") !== -1);
assert.ok(stall.indexOf("did not open") !== -1);
assert.ok(stall.indexOf("not charged") !== -1);
["$149", "$49", "$29", "$12.99"].forEach(function (bad) {
  assert.strictEqual(missing.indexOf(bad), -1);
  assert.strictEqual(stall.indexOf(bad), -1);
});
var iap = fs.readFileSync(path.join(__dirname, "iap.js"), "utf8");
assert.ok(iap.indexOf("PURCHASE_WAIT_MS") !== -1, "purchase must time out instead of leaving the button disabled");
assert.ok(iap.indexOf("iap-7") !== -1, "the bundle marker stays in source");
assert.strictEqual(iap.indexOf('id="iap-diag"'), -1, "the build diagnostic line must not render");
assert.strictEqual(iap.indexOf('id="iap-steps"'), -1, "the tap diagnostic line must not render");
assert.ok(iap.indexOf("Your extra seat codes will appear here") !== -1);
assert.strictEqual(iap.indexOf("btn.onclick"), -1, "buy taps must stay on the document so a re-render cannot drop them");
assert.strictEqual(iap.indexOf("var note ="), -1, "a local var note would hide the diagnostic function and throw on tap");
assert.ok(iap.indexOf('addEventListener("error"') !== -1, "a script error must reach the diagnostic line");
assert.ok(iap.indexOf("pointerdown") !== -1, "a tap must be recorded before the purchase call");
assert.ok(iap.indexOf("diagnostics") !== -1);
assert.ok(iap.indexOf("missingProductsMessage") !== -1);
assert.ok(iap.indexOf("onlyCurrentEntitlements") !== -1, "restore must also read currentEntitlements");
assert.ok(iap.indexOf("restoreMessage") !== -1, "restore must show the logic message");
assert.strictEqual(iap.indexOf("Check your connection"), -1, "a thrown restore must show the real error");
var restoreFn = iap.slice(iap.indexOf("function restore()"), iap.indexOf("function installTaps"));
assert.ok(restoreFn.indexOf("readStore()") !== -1, "restore reads on-device StoreKit history");
assert.strictEqual(restoreFn.indexOf("restorePurchases"), -1, "restore must not call the plugin method that signs in");
assert.strictEqual(restoreFn.indexOf("AppStore.sync"), -1, "restore must not call the account sync that shows a password sheet");
assert.strictEqual(restoreFn.indexOf("restoreCompletedTransactions"), -1, "restore must not call the StoreKit 1 restore that shows a password sheet");
assert.strictEqual(iap.indexOf(".restorePurchases"), -1, "the pricing screen must not call the sign-in restore");
assert.strictEqual(iap.indexOf("AppStore.sync"), -1, "the iOS purchase script must not call account sync");
assert.strictEqual(iap.indexOf("restoreCompletedTransactions"), -1, "the iOS purchase script must not call the StoreKit 1 restore");
var pluginPatch = fs.readFileSync(path.join(__dirname, "../../patches/@capgo+native-purchases+8.8.1.patch"), "utf8");
assert.ok(pluginPatch.indexOf("\n-                try await AppStore.sync()") !== -1, "the plugin patch removes the account sync call");
assert.strictEqual(pluginPatch.indexOf("\n+                try await AppStore.sync()"), -1, "the plugin patch must not add an account sync call");
assert.strictEqual(pluginPatch.indexOf("\n+            try await AppStore.sync()"), -1, "the plugin patch must not add an account sync call");
assert.ok(pluginPatch.indexOf("no Apple Account prompt") !== -1, "the plugin restore method documents that it does not prompt");
["$149", "$49", "$29", "$12.99"].forEach(function (bad) {
  assert.strictEqual(iap.indexOf(bad), -1, "iap.js must not hardcode " + bad);
});

var webFiles = ["plan-fix.js", "license-gate.js", "app-core.js", "about.js", "config.js"];
webFiles.forEach(function (name) {
  var src = fs.readFileSync(path.join(__dirname, name), "utf8");
  assert.ok(src.indexOf("$149") !== -1, name + " still has the website pack price");
});

var logicSrc = fs.readFileSync(path.join(__dirname, "iap-logic.js"), "utf8");
assert.ok(logicSrc.indexOf('getPlatform() === "ios"') !== -1, "iOS is Capacitor.getPlatform() === ios");
assert.ok(iap.indexOf("Restore with email") !== -1, "Pricing says Restore with email");
assert.strictEqual(iap.indexOf("Restore Purchases"), -1, "the old Apple restore label is gone");
assert.ok(iap.indexOf("/license/apple/bind") !== -1, "a purchase can be saved against an email");
assert.ok(iap.indexOf("/license/restore/start") !== -1, "restore emails a code");
assert.ok(iap.indexOf("/license/restore/verify") !== -1, "the code returns the original purchase");
assert.ok(iap.indexOf("stripPricingChrome") !== -1, "iOS pricing keeps only the Apple card");
assert.ok(iap.indexOf('n.id === "iap-card"') !== -1, "the Apple card stays on the pricing screen");
assert.ok(iap.indexOf("com.wrap911.trainer.seat.12mo") !== -1);
assert.ok(iap.indexOf("com.wrap911.trainer.pack.12mo") !== -1);
assert.ok(iap.indexOf("com.wrap911.trainer.pass.7d") !== -1);
assert.ok(iap.indexOf("7-Day Pass") !== -1);
assert.ok(iap.indexOf('productType: "inapp"') !== -1, "non-renewing products go through native-purchases");
assert.ok(iap.indexOf("stripExternalPurchase") !== -1);
assert.ok(iap.indexOf("unlock-box") !== -1, "iOS removes the unlock-code field");
assert.strictEqual(iap.indexOf("Buy on wrap911.com"), -1, "iOS has no website buy CTA");
assert.strictEqual(iap.indexOf("buy.stripe.com"), -1, "iOS has no Stripe link");
assert.strictEqual(iap.indexOf("Already have an unlock code"), -1);
["about.js", "plan-fix.js"].forEach(function (name) {
  var src = fs.readFileSync(path.join(__dirname, name), "utf8");
  assert.strictEqual(src.indexOf("Buy on wrap911.com"), -1, name + " has no website buy CTA");
});
var plan = fs.readFileSync(path.join(__dirname, "plan-fix.js"), "utf8");
assert.ok(plan.indexOf("buy.stripe.com") !== -1, "the website Stripe Payment Links stay");
var privacy = fs.readFileSync(path.join(__dirname, "../../privacy.html"), "utf8");
assert.ok(/Apple In-App Purchase/i.test(privacy), "privacy.html mentions Apple IAP");
assert.ok(/Stripe/i.test(privacy), "privacy.html keeps the website Stripe paragraph");
var storekit = fs.readFileSync(path.join(__dirname, "../../ios/App/App/WRAP911.storekit"), "utf8");
assert.ok(storekit.indexOf("com.wrap911.trainer.pass.7d") !== -1);
assert.ok(storekit.indexOf("12.99") !== -1);
var project = fs.readFileSync(path.join(__dirname, "../../ios/App/App.xcodeproj/project.pbxproj"), "utf8");
assert.ok(project.indexOf("MARKETING_VERSION = 1.2;") !== -1);
assert.ok(project.indexOf("CURRENT_PROJECT_VERSION = 25;") !== -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 24;"), -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 22;"), -1);
assert.strictEqual(project.indexOf("MARKETING_VERSION = 1.1;"), -1);
var flight = fs.readFileSync(path.join(__dirname, "../../.github/workflows/ios-testflight.yml"), "utf8");
assert.ok(flight.indexOf("CURRENT_PROJECT_VERSION=25") !== -1);
assert.ok(flight.indexOf("MARKETING_VERSION=1.2") !== -1);
assert.strictEqual(flight.indexOf("CURRENT_PROJECT_VERSION=24"), -1);
assert.strictEqual(flight.indexOf("CURRENT_PROJECT_VERSION=22"), -1);
assert.ok(iap.indexOf("insertBefore(card, h1.nextSibling)") !== -1, "the pricing heading stays above the card");
assert.strictEqual(iap.indexOf("insertBefore(card, screen.firstChild)"), -1, "the card must not be inserted above the heading");
var css = fs.readFileSync(path.join(__dirname, "../css/style.css"), "utf8");
assert.ok(css.indexOf(":not(.seat):not(.restore)") !== -1, "Seat and Restore stay outlined");
var appstore = fs.readFileSync(path.join(__dirname, "appstore.js"), "utf8");
assert.ok(appstore.indexOf("if (isNative) return;") !== -1, "iOS does not add a second privacy link on the body");
assert.ok(appstore.indexOf("color:#ffb000") !== -1, "privacy links use the app gold");

console.log("iap-logic tests ok");
