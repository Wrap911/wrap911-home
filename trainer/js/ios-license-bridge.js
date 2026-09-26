/* Mirror paid license, and show the one code that unlocks the Home Screen icon. */
(function () {
  var COOKIE = "wrap911_lic";
  var LS = "wrap911_license";
  var OWNER = "wrap911_owner";
  var SEAT = "RIVET-149";

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

  function standalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }

  function showSeatCard() {
    var home = document.getElementById("screen-home");
    if (!home || home.querySelector(".seat-carry")) return;
    var paid = !!restore();
    var box = document.createElement("div");
    box.className = "passion-note seat-carry";
    if (!paid) {
      box.innerHTML = "<strong>Icon says Free</strong><p>Open Unlock and type the Home Screen code from the Safari tab that already says Pack. Then tap Unlock.</p>";
    } else if (!standalone()) {
      box.innerHTML = "<strong>Home Screen code</strong><p>If the icon says Free, open it and type <b>" + SEAT + "</b> in Unlock. Do not copy the address bar.</p>";
    } else {
      return;
    }
    var lead = home.querySelector(".lead");
    if (lead && lead.parentNode) lead.parentNode.insertBefore(box, lead.nextSibling);
    else home.insertBefore(box, home.firstChild);
  }

  window.WRAP911_LICENSE_BRIDGE = { save: save, restore: restore, valid: valid, packLicense: packLicense, seatCode: SEAT };

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

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest("#btn-unlock");
    if (!btn) return;
    var inp = document.getElementById("unlock-code");
    var code = String((inp && inp.value) || "").trim().toUpperCase().replace(/\s+/g, "");
    if (code !== SEAT) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    save(packLicense());
    var fb = document.getElementById("unlock-feedback");
    if (fb) {
      fb.className = "quiz-feedback ok";
      fb.textContent = "Pack is on this icon. Full trainer is open.";
    }
    refreshUi();
    setTimeout(function () { location.reload(); }, 400);
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var inp = document.getElementById("unlock-code");
    if (!inp || e.target !== inp) return;
    var code = String(inp.value || "").trim().toUpperCase().replace(/\s+/g, "");
    if (code !== SEAT) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    save(packLicense());
    setTimeout(function () { location.reload(); }, 400);
  }, true);

  function boot() {
    var lic = restore();
    if (lic) refreshUi();
    showSeatCard();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1600);
})();
