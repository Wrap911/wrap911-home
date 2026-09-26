/* Mirror paid license, and redeem a Stripe seat code on this phone. */
(function () {
  var COOKIE = "wrap911_lic";
  var LS = "wrap911_license";
  var OWNER = "wrap911_owner";
  /* Audit 2026-09-26: this used to be a plain-text universal unlock code in public JS.
     Now stored as SHA-256 only. It is still in git history, so retire it once Worker seat codes work. */
  var SEAT_HASH = "0d284a0c71cd9d96e692a2028026826903f3ceeccf23e03cf4590b3227d0fbe6";
  var API = "https://wrap911-coach-proxy.wrap911.workers.dev";

  function packLicense() {
    var now = Date.now();
    return {
      code: "SHOP", plan: "pro", sku: "pack", seats: 5,
      unlockedAt: now, expiresAt: now + 365 * 86400000, source: "ios-bridge"
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
        return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(p.slice(COOKIE.length + 1))))));
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
    if (lic.sku === "pack" || lic.sku === "seat" || lic.sku === "field") return true;
    if (lic.code === "SHOP" || lic.code === "STRIPE" || lic.code === "HOME" || lic.code === "CREW") return true;
    if (lic.plan === "free" && !lic.expiresAt) return true;
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
    try { var raw = localStorage.getItem(LS); if (raw) lic = JSON.parse(raw); } catch (e) {}
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
  function applyRemote(data) {
    var now = Date.now();
    save({
      code: data.code || "STRIPE", plan: "pro", sku: data.sku || "seat",
      seats: data.seats || 1, unlockedAt: now, expiresAt: now + 365 * 86400000, source: "stripe-seat"
    });
  }
  function showIssuedCode(code, sku, seats) {
    var home = document.getElementById("screen-home") || document.body;
    var old = document.getElementById("issued-seat-code");
    if (old) old.remove();
    var box = document.createElement("div");
    box.id = "issued-seat-code";
    box.className = "passion-note";
    box.innerHTML = "<strong>Your seat code</strong><p>Type <b>" + escapeText(code) + "</b> in Unlock on each phone. " + (sku === "pack" ? seats + " phones." : "This phone only.") + " Write it down.</p>";
    home.insertBefore(box, home.firstChild);
  }
  function claimSession(id) {
    return fetch(API + "/license/claim?session_id=" + encodeURIComponent(id)).then(function (res) {
      return res.json().then(function (data) {
        /* The Worker answers any GET with {ok:true, service:...}. Only a real seat code counts. */
        if (!res.ok || !data.ok || !/^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(data.code || ""))) throw new Error(data.error || "Seat code server is not live yet. Your checkout still unlocked this phone.");
        return data;
      });
    }).then(function (data) {
      applyRemote(data);
      showIssuedCode(data.code, data.sku, data.seats);
      refreshUi();
      return data;
    });
  }
  function redeemRemote(code) {
    return fetch(API + "/license/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data.ok || !data.sku) throw new Error(data.error || "Code rejected.");
        applyRemote(data);
        refreshUi();
        return data;
      });
    });
  }
  function escapeText(t) {
    return String(t || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
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
      box.innerHTML = "<strong>Icon says Free</strong><p>Open Unlock and type the seat code from the phone that just paid.</p>";
    } else if (!standalone()) {
      box.innerHTML = "<strong>Home Screen</strong><p>If the icon says Free, open it and type the seat code in Unlock.</p>";
    } else return;
    var lead = home.querySelector(".lead");
    if (lead && lead.parentNode) lead.parentNode.insertBefore(box, lead.nextSibling);
    else home.insertBefore(box, home.firstChild);
  }
  window.WRAP911_LICENSE_BRIDGE = { save: save, restore: restore, valid: valid, packLicense: packLicense };
  try {
    var origSet = localStorage.setItem.bind(localStorage);
    var origRemove = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      origSet(k, v);
      if (k === LS) { try { writeCookie(JSON.parse(v)); } catch (e) {} }
      if (k === OWNER && String(v) === "1") writeCookie(restore() || packLicense());
    };
    localStorage.removeItem = function (k) {
      origRemove(k);
      if (k === LS || k === OWNER) clearCookie();
    };
  } catch (e3) {}
  function sha(text) {
    try {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
        var v = new Uint8Array(buf), out = "";
        for (var i = 0; i < v.length; i++) out += ("0" + v[i].toString(16)).slice(-2);
        return out;
      });
    } catch (e) { return Promise.resolve(""); }
  }
  function takeCode(code, fb) {
    if (/^RIVET-\d{3}$/.test(code)) {
      sha(code).then(function (h) {
        if (h !== SEAT_HASH) {
          if (fb) { fb.className = "quiz-feedback bad"; fb.textContent = "Code not recognized."; }
          return;
        }
        save(packLicense());
        if (fb) { fb.className = "quiz-feedback ok"; fb.textContent = "Pack is on this icon. Full trainer is open."; }
        refreshUi();
        setTimeout(function () { location.reload(); }, 400);
      });
      return true;
    }
    if (!/^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return false;
    redeemRemote(code).then(function () {
      if (fb) { fb.className = "quiz-feedback ok"; fb.textContent = "Seat accepted. Full trainer is open on this phone."; }
      setTimeout(function () { location.reload(); }, 400);
    }).catch(function (err) {
      if (fb) { fb.className = "quiz-feedback bad"; fb.textContent = err.message || "Code rejected."; }
    });
    return true;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest("#btn-unlock");
    if (!btn) return;
    var inp = document.getElementById("unlock-code");
    var code = String((inp && inp.value) || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!takeCode(code, document.getElementById("unlock-feedback"))) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var inp = document.getElementById("unlock-code");
    if (!inp || e.target !== inp) return;
    var code = String(inp.value || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!takeCode(code, document.getElementById("unlock-feedback"))) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  function boot() {
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { q = new URLSearchParams(); }
    var sid = q.get("session_id") || "";
    if (/^cs_/.test(sid)) {
      claimSession(sid).then(function () {
        q.delete("session_id");
        var qs = q.toString();
        history.replaceState({}, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
      }).catch(function (err) {
        var home = document.getElementById("screen-home") || document.body;
        var box = document.createElement("div");
        box.className = "passion-note";
        box.innerHTML = "<strong>Seat code not ready</strong><p>" + escapeText(err.message || "The license server is not set up yet.") + "</p>";
        home.insertBefore(box, home.firstChild);
      });
    }
    if (restore()) refreshUi();
    showSeatCard();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1600);
})();
