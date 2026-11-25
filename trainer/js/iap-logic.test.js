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

assert.strictEqual(L.DOCTOR_FREE_PER_DAY, 1);
assert.strictEqual(L.DOCTOR_PAID_PER_DAY, 15);
assert.strictEqual(L.doctorDailyLimit(null, NOW), 1);
assert.strictEqual(L.doctorDailyLimit(tx(SEAT, recent), NOW), 15);
assert.strictEqual(L.doctorDailyLimit(tx(SEAT, old), NOW), 1);
assert.strictEqual(L.doctorDailyLimit(tx(PACK, new Date(NOW - 364 * 86400000).toISOString()), NOW), 15);
assert.strictEqual(L.doctorDailyLimit(tx(PACK, new Date(NOW - 366 * 86400000).toISOString()), NOW), 1);
assert.strictEqual(L.doctorDailyLimit(tx(PASS, new Date(NOW - 6 * 86400000).toISOString()), NOW), 15);
assert.strictEqual(L.doctorDailyLimit(tx(PASS, new Date(NOW - 8 * 86400000).toISOString()), NOW), 1);
assert.strictEqual(L.doctorDailyLimit(tx(SEAT, recent, { revocationDate: NOW }), NOW), 1);
assert.strictEqual(L.doctorDailyLimit(tx("com.wrap911.trainer.other", recent), NOW), 1);
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
assert.strictEqual(L.restoreMessage(false, ""), "No active purchase was found for this Apple ID on this phone.");
assert.ok(!/email|code|web|stripe/i.test(L.restoreMessage(false, "")), "the nothing-found message mentions no email, code, or web");
assert.strictEqual(L.restoreMessage(false, "  Request failed.  "), "Request failed.");
assert.strictEqual(L.licenseFromRestore, undefined, "the email-restore license builder is gone");

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
assert.strictEqual(iap.indexOf("Your extra seat codes will appear here"), -1, "the iOS pricing card shows no crew code text");
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
assert.ok(iap.indexOf(">Restore purchases<") !== -1, "Pricing says Restore purchases");
assert.strictEqual(iap.indexOf("Restore with email"), -1, "no Restore with email");
assert.strictEqual(iap.indexOf("Restore Purchases"), -1, "the old Apple restore label is gone");
["/license/apple/bind", "/license/restore/start", "/license/restore/verify", "\"iap-email\"", "\"iap-code\"", "iap-send-code", "iap-verify-code", "iap-save-email", "one-time-code", "6-digit", "openEmailRestore", "sendCode", "verifyCode", "saveEmail", "wrap911_restore_email"].forEach(function (bad) {
  assert.strictEqual(iap.indexOf(bad), -1, "iOS iap.js has no email-code restore: " + bad);
});
assert.ok(!/type="email"|type=\\"email|inputmode="email"/.test(iap), "iOS iap.js renders no email field");
var iosFiles = { "iap.js": iap, "iap-logic.js": logicSrc, "polish.js": fs.readFileSync(path.join(__dirname, "polish.js"), "utf8") };
Object.keys(iosFiles).forEach(function (name) {
  assert.ok(!/Restore with email|email you saved|Enter the email|restore\/start|restore\/verify/i.test(iosFiles[name]), name + " has no email restore copy");
});
var planFix = fs.readFileSync(path.join(__dirname, "plan-fix.js"), "utf8");
assert.ok(planFix.indexOf("Restore with email") === -1, "plan-fix has no Restore with email");
assert.ok(planFix.indexOf('lic.sku === "pack" && iosApp()') !== -1, "iOS pack card shows no crew code text");
var aboutSrc = fs.readFileSync(path.join(__dirname, "about.js"), "utf8");
assert.ok(!/Restore with email|email you saved/i.test(aboutSrc), "about.js has no email restore copy");
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
assert.ok(project.indexOf("MARKETING_VERSION = 1.3;") !== -1);
assert.ok(project.indexOf("CURRENT_PROJECT_VERSION = 30;") !== -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 29;"), -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 28;"), -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 27;"), -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 26;"), -1);
assert.strictEqual(project.indexOf("MARKETING_VERSION = 1.2;"), -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 25;"), -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 24;"), -1);
assert.strictEqual(project.indexOf("CURRENT_PROJECT_VERSION = 22;"), -1);
assert.strictEqual(project.indexOf("MARKETING_VERSION = 1.1;"), -1);
var flight = fs.readFileSync(path.join(__dirname, "../../.github/workflows/ios-testflight.yml"), "utf8");
assert.ok(flight.indexOf("CURRENT_PROJECT_VERSION=29") !== -1 || flight.indexOf("CURRENT_PROJECT_VERSION=30") !== -1);
assert.ok(flight.indexOf("MARKETING_VERSION=1.3") !== -1);
assert.strictEqual(flight.indexOf("CURRENT_PROJECT_VERSION=25"), -1);
assert.strictEqual(flight.indexOf("CURRENT_PROJECT_VERSION=24"), -1);
assert.strictEqual(flight.indexOf("CURRENT_PROJECT_VERSION=22"), -1);
assert.strictEqual(flight.indexOf("MARKETING_VERSION=1.2"), -1);
var doctor = fs.readFileSync(path.join(__dirname, "problem-doctor.js"), "utf8");
assert.ok(doctor.indexOf("xAI (Grok)") !== -1, "Problem Doctor names xAI");
assert.ok(doctor.indexOf("problem-doctor-consent") !== -1, "Problem Doctor has its own consent checkbox");
assert.ok(doctor.indexOf("The video is not uploaded") !== -1);
assert.ok(doctor.indexOf("Open Pricing") !== -1);
assert.ok(doctor.indexOf("/coach/doctor") !== -1);
assert.ok(doctor.indexOf("WRAP911_APPLE_RECEIPT") !== -1, "iOS sends the StoreKit receipt");
assert.strictEqual(doctor.indexOf("buy.stripe.com"), -1);
assert.strictEqual(doctor.indexOf("Photo Fix"), -1);
assert.strictEqual(doctor.indexOf("AppStore.sync"), -1);
assert.strictEqual(doctor.indexOf("$149"), -1);
assert.strictEqual(doctor.indexOf("$49"), -1);
assert.strictEqual(doctor.indexOf("$12.99"), -1);
var plist = fs.readFileSync(path.join(__dirname, "../../ios/App/App/Info.plist"), "utf8");
assert.ok(plist.indexOf("NSCameraUsageDescription") !== -1);
assert.ok(plist.indexOf("NSPhotoLibraryUsageDescription") !== -1);
assert.ok(plist.indexOf("NSMicrophoneUsageDescription") !== -1);
assert.ok(plist.indexOf("The video file is not uploaded.") !== -1);
var privacyManifest = fs.readFileSync(path.join(__dirname, "../../ios/App/App/PrivacyInfo.xcprivacy"), "utf8");
assert.ok(privacyManifest.indexOf("NSPrivacyCollectedDataTypePhotosorVideos") !== -1);
assert.ok(iap.indexOf("WRAP911_APPLE_RECEIPT") !== -1, "the purchase script exposes the signed transaction");
assert.ok(iap.indexOf("AppStore.sync") === -1, "Problem Doctor receipt read does not call AppStore.sync");
assert.ok(iap.indexOf("insertBefore(card, h1.nextSibling)") !== -1, "the pricing heading stays above the card");
assert.strictEqual(iap.indexOf("insertBefore(card, screen.firstChild)"), -1, "the card must not be inserted above the heading");
var css = fs.readFileSync(path.join(__dirname, "../css/style.css"), "utf8");
assert.ok(css.indexOf(":not(.seat):not(.restore)") !== -1, "Seat and Restore stay outlined");
var appstore = fs.readFileSync(path.join(__dirname, "appstore.js"), "utf8");
assert.ok(appstore.indexOf("if (isNative) return;") !== -1, "iOS does not add a second privacy link on the body");
assert.ok(appstore.indexOf("color:#ffb000") !== -1, "privacy links use the app gold");

console.log("iap-logic tests ok");

/* Build 27: field-photo backgrounds. Ten real shop photos, Storefront card label, no payment or code UI added. */
var crypto = require("crypto");
var BG_SHA = {
  "box-truck": "ca3b68a61e6f49b0a018e63680797a8ecdb40ba03bdd6ff7e8222f87d061b703",
  "doctor": "077277adce5912cc6aad149d69a9735bff5157a341a001c35b076988cd9e46a4",
  "fleet": "5630a1d6eddf521430206f9ebaf18ef5eccb8f52049268def93ce232e707dd6b",
  "home": "ff30f1d97455d1f134df3d1b1cc61d0d5c5a83917c3b3823f3718acec3ab436b",
  "practice": "f458eca105485e54ce61da9c9e1f8f90c40f16ebd9bb60629b7347bab945af37",
  "rv-bus": "f996ecf87b54e36bebdf110dc1cb6ace2f94bb761c57ff5ac1ac4bd8ad0be7fb",
  "storefront": "1960e02c9104cbcd6f00ed1def0b54519bc5e6b7108030a2d1dba56524e92ff1",
  "trailer": "885d6f72770d67b96de9cd485960cce36ff6507513ff72b50ecfd23d26cf17f5",
  "van": "275f03eb4960c896e453ff84441136d59afdecfbac353dcc1afff7c51672273d"
};
Object.keys(BG_SHA).forEach(function (name) {
  var bytes = fs.readFileSync(path.join(__dirname, "../media/bg/" + name + ".webp"));
  assert.strictEqual(crypto.createHash("sha256").update(bytes).digest("hex"), BG_SHA[name], "bg " + name);
});
assert.strictEqual(fs.readdirSync(path.join(__dirname, "../media/bg")).length, 9, "nine backgrounds; the lime-green pricing photo is not shipped");
assert.ok(!fs.existsSync(path.join(__dirname, "../media/bg/pricing.webp")));
assert.ok(fieldJsSrc().indexOf("pricing.webp") === -1);
function fieldJsSrc() { return fs.readFileSync(path.join(__dirname, "field-bg.js"), "utf8"); }
var fieldJs = fs.readFileSync(path.join(__dirname, "field-bg.js"), "utf8");
var fieldCss = fs.readFileSync(path.join(__dirname, "../css/field-bg.css"), "utf8");
var indexHtml = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
var swJs = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
assert.ok(indexHtml.indexOf('id="field-bg"') !== -1 && indexHtml.indexOf("css/field-bg.css") !== -1 && indexHtml.indexOf("js/field-bg.js") !== -1);
assert.ok(swJs.indexOf('var CACHE = "wrap911-trainer-1.3-bg1"') !== -1);
assert.strictEqual(swJs.indexOf("bg-mock"), -1);
Object.keys(BG_SHA).forEach(function (name) { assert.ok(swJs.indexOf("./media/bg/" + name + ".webp") !== -1, "sw precache " + name); });
[fieldJs, fieldCss].forEach(function (src) {
  assert.ok(!/stripe|arlon|dunkin|buy\.|https?:\/\//i.test(src), "background files carry no links, Stripe, Arlon, or Dunkin");
});
var labels = fs.readFileSync(path.join(__dirname, "labels-fix.js"), "utf8");
assert.ok(labels.indexOf('storefront: { title: "Storefront"') !== -1, "Storefront card reads Storefront");
assert.strictEqual(labels.indexOf('storefront: { title: "Interior"'), -1);
var trim = fs.readFileSync(path.join(__dirname, "jobs-trim.js"), "utf8");
assert.ok(trim.indexOf('v.title = "Storefront";') !== -1 && trim.indexOf('v.title = "Interior";') === -1, "jobs-trim keeps the Storefront title");

/* Build 28: Material calculator fix. Labels above boxes, Height box, 54 in roll, waste 10-20. */
var idx28 = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert.ok(idx28.indexOf('<option value="54">54</option>') !== -1);
assert.ok(idx28.indexOf('<option value="60" selected>60</option>') !== -1);
assert.ok(/id="calc-waste"[^>]*min="10"[^>]*max="20"/.test(idx28));
assert.ok(/<label for="calc-h">Height \(in\)\s*<input[^>]*id="calc-h"/.test(idx28));

/* Build 29: Search, Settings, Help are open screens; Settings shows Apple restore and no Stripe, buy link, or code entry. */
var cfg29 = fs.readFileSync(path.join(__dirname, "config.js"), "utf8");
["search", "settings", "help"].forEach(function (s) { assert.ok(cfg29.indexOf('"' + s + '"') !== -1, "freeScreens has " + s); });
var polish29 = fs.readFileSync(path.join(__dirname, "polish.js"), "utf8");
assert.ok(/Restore purchases/.test(polish29));
assert.ok(!/buy\.stripe|checkout\.stripe|stripe\.com/i.test(polish29), "polish.js has no Stripe link");
assert.ok(!/id=["']?[a-z-]*(seat|unlock)-?code/i.test(polish29), "polish.js has no code entry");
var idx29 = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
assert.ok(idx29.indexOf("js/polish.js") !== -1 && idx29.indexOf("css/polish.css") !== -1);
var doc29 = fs.readFileSync(path.join(__dirname, "problem-doctor.js"), "utf8");
assert.ok(doc29.indexOf("MIN_SCORE") !== -1, "Problem Doctor watch ranking present");
