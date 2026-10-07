/* Pure Apple IAP rules for the iOS app. No prices live here.
   Shop Pack and Seat are non-renewing 12-month purchases. StoreKit does not
   put an expiration on that product type, so expiry is the same 365 days the
   unlock-code path already uses. The web app never calls these to change UI. */
(function (factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.WRAP911_IAP_LOGIC = api;
    window.WRAP911_NATIVE = function () { return api.isNativeApp(); };
  }
})(function () {
  var YEAR = 365 * 86400000;
  var PRODUCTS = {
    "com.wrap911.trainer.pack.12mo": { sku: "pack", seats: 5 },
    "com.wrap911.trainer.seat.12mo": { sku: "seat", seats: 1 }
  };

  function isNativeApp() {
    try {
      var cap = typeof window !== "undefined" ? window.Capacitor : null;
      return !!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
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
    var exp = stated && !isNaN(stated) ? stated : start + YEAR;
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

  /* Active Shop Pack wins the label. Expiry is the later of the active purchases
     so a Seat bought as well does not shorten this phone. */
  function pickEntitlement(list, now) {
    var pack = null;
    var seat = null;
    var rows = list || [];
    for (var i = 0; i < rows.length; i++) {
      var row = rowFrom(rows[i], now);
      if (!row) continue;
      if (row.sku === "pack" && (!pack || row.expiresAt > pack.expiresAt)) pack = row;
      if (row.sku === "seat" && (!seat || row.expiresAt > seat.expiresAt)) seat = row;
    }
    if (!pack && !seat) return null;
    var primary = pack || seat;
    return {
      tx: primary.tx,
      sku: pack ? "pack" : "seat",
      seats: pack ? 5 : 1,
      productId: primary.productId,
      unlockedAt: primary.unlockedAt,
      expiresAt: Math.max(pack ? pack.expiresAt : 0, seat ? seat.expiresAt : 0)
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
    if (existing.sku === "pack" || existing.sku === "seat") return true;
    return false;
  }

  /* Background sync must not wipe a longer website license. A new Apple
     purchase replaces it, except a live Shop Pack is not downgraded to a Seat. */
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
    PRODUCTS: PRODUCTS,
    isNativeApp: isNativeApp,
    isUsStorefront: isUsStorefront,
    pickEntitlement: pickEntitlement,
    licenseFrom: licenseFrom,
    shouldWrite: shouldWrite
  };
});
