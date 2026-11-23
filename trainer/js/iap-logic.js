/* Pure Apple IAP rules for the iOS app. No prices live here.
   Shop Pack and Seat are non-renewing 12-month purchases. The 7-Day Pass is
   a non-renewing 7-day purchase. StoreKit does not put an expiration on that
   product type, so expiry is purchaseDate plus the product duration. The web
   app never calls these to change UI. */
(function (factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.WRAP911_IAP_LOGIC = api;
    window.WRAP911_NATIVE = function () { return api.isNativeApp(); };
  }
})(function () {
  var YEAR = 365 * 86400000;
  var WEEK = 7 * 86400000;
  var PRODUCTS = {
    "com.wrap911.trainer.pack.12mo": { sku: "pack", seats: 5, duration: YEAR },
    "com.wrap911.trainer.seat.12mo": { sku: "seat", seats: 1, duration: YEAR },
    "com.wrap911.trainer.pass.7d": { sku: "pass", seats: 1, duration: WEEK }
  };

  function isNativeApp() {
    try {
      var cap = typeof window !== "undefined" ? window.Capacitor : null;
      return !!(cap && typeof cap.getPlatform === "function" && cap.getPlatform() === "ios");
    } catch (e) {
      return false;
    }
  }

  /* StoreKit Storefront.countryCode is ISO 3166-1 alpha-3 ("USA"). */
  function isUsStorefront(code) {
    var c = String(code || "").trim().toUpperCase();
    return c === "USA" || c === "US";
  }

  function productIdOf(tx) {
    return (tx && (tx.productIdentifier || tx.productId || tx.identifier)) || "";
  }

  function purchaseMs(tx) {
    var raw = tx && (tx.purchaseDate || tx.transactionDate);
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number" && isFinite(raw)) return raw;
    var parsed = Date.parse(String(raw));
    return isNaN(parsed) ? 0 : parsed;
  }

  function revoked(tx) {
    return !!(tx && tx.revocationDate);
  }

  function rowFrom(tx, now) {
    var id = productIdOf(tx);
    var meta = PRODUCTS[id];
    if (!meta || revoked(tx)) return null;
    var start = purchaseMs(tx);
    if (!start) return null;
    var stated = tx.expirationDate ? Date.parse(tx.expirationDate) : NaN;
    var exp = stated && !isNaN(stated) ? stated : start + meta.duration;
    if (exp <= now) return null;
    return {
      tx: tx,
      sku: meta.sku,
      seats: meta.seats,
      productId: id,
      unlockedAt: start,
      expiresAt: exp
    };
  }

  /* Shop Pack wins the label, then Seat, then the 7-Day Pass. Expiry is the
     later of the active purchases so a shorter pass does not shorten this phone. */
  function pickEntitlement(list, now) {
    var pack = null;
    var seat = null;
    var pass = null;
    var rows = list || [];
    for (var i = 0; i < rows.length; i++) {
      var row = rowFrom(rows[i], now);
      if (!row) continue;
      if (row.sku === "pack" && (!pack || row.expiresAt > pack.expiresAt)) pack = row;
      if (row.sku === "seat" && (!seat || row.expiresAt > seat.expiresAt)) seat = row;
      if (row.sku === "pass" && (!pass || row.expiresAt > pass.expiresAt)) pass = row;
    }
    if (!pack && !seat && !pass) return null;
    var primary = pack || seat || pass;
    return {
      tx: primary.tx,
      sku: pack ? "pack" : (seat ? "seat" : "pass"),
      seats: pack ? 5 : 1,
      productId: primary.productId,
      unlockedAt: primary.unlockedAt,
      expiresAt: Math.max(pack ? pack.expiresAt : 0, seat ? seat.expiresAt : 0, pass ? pass.expiresAt : 0)
    };
  }

  function licenseFrom(row, now) {
    var tx = row.tx || {};
    return {
      code: "APPLE",
      plan: "pro",
      sku: row.sku,
      seats: row.seats,
      source: "apple",
      productId: row.productId,
      transactionId: String(tx.transactionId || tx.transactionIdentifier || ""),
      unlockedAt: row.unlockedAt,
      expiresAt: row.expiresAt,
      checkedAt: now
    };
  }

  function stillPaid(existing, now) {
    if (!existing || existing.expired) return false;
    if (existing.expiresAt && Number(existing.expiresAt) <= now) return false;
    if (existing.plan === "pro" || existing.plan === "trial") return true;
    if (existing.sku === "pack" || existing.sku === "seat" || existing.sku === "pass") return true;
    return false;
  }

  /* Background sync must not wipe a longer website license. A new Apple
     purchase replaces it, except a live Shop Pack is not downgraded to a Seat. */
  /* Shown when StoreKit returns no Shop Pack or Seat. The buttons stay usable. */
  function missingProductsMessage() {
    return "The App Store did not return Shop Pack, Seat, and 7-Day Pass. Check your connection, then open Pricing again. You were not charged.";
  }

  /* Shown when purchaseProduct never calls back, so the Apple sheet never opened. */
  function purchaseStallMessage() {
    return "The App Store purchase sheet did not open, so you were not charged. Try again.";
  }

  /* Same-phone restore reads Transaction.all and currentEntitlements.
     A new phone uses the email the buyer saved. Neither asks for an Apple Account. */
  function restoreMessage(found, errorText) {
    if (found) return "Purchase restored on this phone.";
    var reason = String(errorText || "").replace(/\s+/g, " ").trim();
    if (reason) return reason.slice(0, 280);
    return "Nothing active is stored on this phone. Enter the email you saved with the purchase.";
  }

  /* Email restore returns the original expiry. Do not start a new term. */
  function licenseFromRestore(data, now) {
    var sku = data && data.sku;
    var exp = Number(data && data.expiresAt);
    var start = Number(data && data.purchaseDate) || 0;
    if ((sku !== "pack" && sku !== "seat" && sku !== "pass") || !exp || exp <= now) return null;
    return {
      code: "APPLE",
      plan: "pro",
      sku: sku,
      seats: sku === "pack" ? 5 : 1,
      source: "apple",
      productId: String(data.productId || ""),
      transactionId: String(data.transactionId || ""),
      unlockedAt: start || now,
      expiresAt: exp,
      checkedAt: now
    };
  }

  /* Problem Doctor daily cap. Active Seat and Shop Pack last 365 days from
     purchase. The 7-Day Pass lasts 7 days. Revoked, expired, or unknown
     purchases get the free cap. No prices live here. */
  var DOCTOR_FREE_PER_DAY = 1;
  var DOCTOR_PAID_PER_DAY = 15;
  function doctorDailyLimit(tx, now) {
    return rowFrom(tx, now) ? DOCTOR_PAID_PER_DAY : DOCTOR_FREE_PER_DAY;
  }

  function shouldWrite(existing, next, now, force) {
    if (!next || !next.expiresAt) return false;
    if (!stillPaid(existing, now)) return true;
    if (existing.source === "apple") return true;
    var exp = Number(existing.expiresAt) || 0;
    if (force && existing.sku === "pack" && next.sku !== "pack" && exp >= next.expiresAt) return false;
    if (!force && exp >= next.expiresAt) return false;
    if (!force) return next.expiresAt > exp;
    return true;
  }

  return {
    YEAR: YEAR,
    WEEK: WEEK,
    PRODUCTS: PRODUCTS,
    isNativeApp: isNativeApp,
    isUsStorefront: isUsStorefront,
    pickEntitlement: pickEntitlement,
    licenseFrom: licenseFrom,
    shouldWrite: shouldWrite,
    missingProductsMessage: missingProductsMessage,
    purchaseStallMessage: purchaseStallMessage,
    restoreMessage: restoreMessage,
    licenseFromRestore: licenseFromRestore,
    DOCTOR_FREE_PER_DAY: DOCTOR_FREE_PER_DAY,
    DOCTOR_PAID_PER_DAY: DOCTOR_PAID_PER_DAY,
    doctorDailyLimit: doctorDailyLimit
  };
});
