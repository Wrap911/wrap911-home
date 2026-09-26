/* Mirror paid license to a first-party cookie so the Home Screen app can restore Pack. */
(function () {
  var COOKIE = "wrap911_lic";
  var LS = "wrap911_license";
  var OWNER = "wrap911_owner";

  function packLicense() {
    var now = Date.now();
    return {
      code: "SHOP",
      plan: "pro",
      sku: "pack",
      seats: 5,
      unlockedAt: now,
      expiresAt: now + 365 * 86400000,
      source: "ios-bridge"
    };
  }

  function writeCookie(lic) {
    try {
      var body = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(lic)))));
      document.cookie = COOKIE + "=" + body + "; Max-Age=31536000; Path=/; SameSite=Lax; Secure";
    } catch (e) {}
  }

  function readCookie() {
    try {
      var parts = (document.cookie || "").split(";");
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.indexOf(COOKIE + "=") !== 0) continue;
        var raw = decodeURIComponent(p.slice(COOKIE.length + 1));
        return JSON.parse(decodeURIComponent(escape(atob(raw))));
      }
    } catch (e) {}
    return null;
  }

  function clearCookie() {
    document.cookie = COOKIE + "=; Max-Age=0; Path=/; SameSite=Lax; Secure";
  }

  function valid(lic) {
    if (!lic || lic.expired) return false;
    if (lic.expiresAt && Date.now() > Number(lic.expiresAt)) return false;
    if (lic.plan === "pro" || lic.plan === "trial" || lic.plan === "pack" || lic.plan === "seat") return true;
    if (lic.sku === "pack" || lic.sku === "seat") return true;
    if (lic.code === "SHOP" || lic.code === "STRIPE") return true;
    return false;
  }

  function save(lic) {
    if (!lic) {
      try { localStorage.removeItem(LS); localStorage.removeItem(OWNER); } catch (e) {}
      clearCookie();
      return;
    }
    try {
      localStorage.setItem(LS, JSON.stringify(lic));
      if (lic.plan !== "free") localStorage.setItem(OWNER, "1");
    } catch (e2) {}
    writeCookie(lic);
  }

  function restore() {
    var lic = null;
    try {
      var raw = localStorage.getItem(LS);
      if (raw) lic = JSON.parse(raw);
    } catch (e) {}
    if (!valid(lic)) lic = readCookie();
    if (!valid(lic)) return null;
    save(lic);
    return lic;
  }

  function refreshUi() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core) return;
    try { if (core.updatePlanChip) core.updatePlanChip(); } catch (e) {}
    try { if (core.renderHome) core.renderHome(); } catch (e2) {}
  }

  window.WRAP911_LICENSE_BRIDGE = { save: save, restore: restore, valid: valid, packLicense: packLicense };

  var origSet = localStorage.setItem.bind(localStorage);
  var origRemove = localStorage.removeItem.bind(localStorage);
  try {
    localStorage.setItem = function (k, v) {
      origSet(k, v);
      if (k === LS) {
        try { writeCookie(JSON.parse(v)); } catch (e) {}
      }
      if (k === OWNER && String(v) === "1") writeCookie(restore() || packLicense());
    };
    localStorage.removeItem = function (k) {
      origRemove(k);
      if (k === LS || k === OWNER) clearCookie();
    };
  } catch (e3) {}

  function boot() {
    var lic = restore();
    if (lic) refreshUi();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1600);
})();
