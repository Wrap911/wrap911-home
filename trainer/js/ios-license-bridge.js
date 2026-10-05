/* Mirror paid license, and redeem a Stripe seat code on this phone. */
(function () {
  var COOKIE = "wrap911_lic";
  var LS = "wrap911_license";
  var OWNER = "wrap911_owner";
  /* Audit 2026-09-26: this used to be a plain-text universal unlock code in public JS.
     Now stored as SHA-256 only. It is still in git history, so retire it once Worker seat codes work. */
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
    return /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(lic.code || "")) && lic.source === "server";
  }
  /* Hotfix 2.6.1: save() -> setItem(OWNER) -> restore() -> save() recursed until the stack blew
     (caught), about 140 ms per paid check on a paid phone. Re-entry guard + skip rewrites when nothing changed. */
  var saving = false;
  function save(lic) {
    if (saving) return;
    saving = true;
    try {
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
    } finally {
      saving = false;
    }
  }
  function restore() {
    var lic = null, fromLs = false;
    try { var raw = localStorage.getItem(LS); if (raw) lic = JSON.parse(raw); } catch (e) {}
    if (valid(lic)) fromLs = true;
    else lic = readCookie();
    if (!valid(lic)) return null;
    var ownerOk = true;
    try { ownerOk = lic.plan === "free" || localStorage.getItem(OWNER) === "1"; } catch (e3) {}
    if (!fromLs || !ownerOk || !readCookie()) save(lic);
    return lic;
  }
  function refreshUi() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core) return;
    try { if (core.updatePlanChip) core.updatePlanChip(); } catch (e) {}
    try { if (core.renderHome) core.renderHome(); } catch (e2) {}
  }
  function deviceId() {
    var k = "wrap911_device", id = "";
    try { id = localStorage.getItem(k) || ""; } catch (e) {}
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      var b = new Uint8Array(16); crypto.getRandomValues(b);
      id = Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      try { localStorage.setItem(k, id); } catch (e2) {}
    }
    return id;
  }
  function applyRemote(data) {
    save({
      code: data.code, plan: "pro", sku: data.sku || "seat",
      seats: data.seats || 1, unlockedAt: Date.now(), expiresAt: Number(data.expiresAt) || (Date.now() + 35 * 86400000),
      source: "server", checkedAt: Date.now()
    });
  }
  /* Re-check the code with the server once a day. Offline keeps the phone unlocked. */
  function recheck() {
    var lic = null;
    try { lic = JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) {}
    if (!lic || lic.source !== "server" || (lic.checkedAt && Date.now() - lic.checkedAt < 86400000)) return;
    fetch(API + "/license/check", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: lic.code, device: deviceId() })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (res.ok && data.ok) { applyRemote(data); return; }
        if (res.status === 404 || res.status === 403 || res.status === 410) { save(null); refreshUi(); }
      });
    }).catch(function () {});
  }
  function showIssuedCode(code, sku, seats) {
    var home = document.getElementById("screen-home") || document.body;
    var old = document.getElementById("issued-seat-code");
    if (old) old.remove();
    var box = document.createElement("div");
    box.id = "issued-seat-code";
    box.className = "passion-note";
    box.innerHTML = "<strong>Your unlock code</strong><p><b style=\"font-size:1.2em;letter-spacing:.05em\">" + escapeText(code) + "</b></p><p>This phone is unlocked. " + (sku === "pack" ? "Type this code in Unlock on up to " + (seats - 1) + " more phones." : "Type it in Unlock if you switch phones.") + " Write it down or screenshot it.</p>";
    home.insertBefore(box, home.firstChild);
  }
  function claimSession(id) {
    return fetch(API + "/license/claim?session_id=" + encodeURIComponent(id) + "&device=" + deviceId()).then(function (res) {
      return res.json().then(function (data) {
        /* The Worker answers any GET with {ok:true, service:...}. Only a real seat code counts. */
        if (!res.ok || !data.ok || !/^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(data.code || ""))) throw new Error(data.error || "Seat code server is not live yet. Your payment went through. Email us and we will send your code.");
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
      body: JSON.stringify({ code: code, device: deviceId() })
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
  function openUnlock() {
    try {
      var core = window.WRAP911_APP && window.WRAP911_APP.core;
      if (core && core.showScreen) core.showScreen("pricing");
      else { var nb = document.querySelector('[data-nav="pricing"]'); if (nb) nb.click(); }
    } catch (e) {}
    setTimeout(function () {
      var inp = document.getElementById("unlock-code");
      if (inp) { try { inp.scrollIntoView({ block: "center" }); inp.focus(); } catch (e2) {} }
    }, 60);
  }
  function paidNow() {
    if (restore()) return true;
    try { if (window.WRAP911_GATE && window.WRAP911_GATE.paid && window.WRAP911_GATE.paid()) return true; } catch (e) {}
    return false;
  }
  /* Hotfix 2.6.1: free phones saw "Icon says Free". Free = "Have a seat code?" with a tap to Unlock.
     Paid in a browser tab = Home Screen tip. Paid on the Home Screen icon = no card. Re-checked on each boot. */
  function showSeatCard() {
    var home = document.getElementById("screen-home");
    if (!home) return;
    var paid = paidNow();
    var mode = !paid ? "free" : (!standalone() ? "browser" : "");
    var old = home.querySelector(".seat-carry");
    if (old) {
      if (old.getAttribute("data-mode") === mode) return;
      old.parentNode.removeChild(old);
    }
    if (!mode) return;
    var box = document.createElement("div");
    box.className = "passion-note seat-carry";
    box.setAttribute("data-mode", mode);
    if (mode === "free") {
      box.innerHTML = '<strong>Have a seat code?</strong><p>Enter it here to unlock this phone.</p>' +
        '<button type="button" class="chip seat-carry-go" style="margin-top:.5rem">Enter seat code</button>';
      var go = box.querySelector(".seat-carry-go");
      if (go) go.addEventListener("click", openUnlock);
    } else {
      box.innerHTML = "<strong>Add to Home Screen</strong><p>Save WRAP 911 to your Home Screen. If the icon opens on the free look, enter your seat code in Unlock.</p>";
    }
    var lead = home.querySelector(".lead");
    if (lead && lead.parentNode) lead.parentNode.insertBefore(box, lead.nextSibling);
    else home.insertBefore(box, home.firstChild);
  }
  window.WRAP911_LICENSE_BRIDGE = { save: save, restore: restore, valid: valid, packLicense: packLicense };
  /* Hotfix 2.6.4: `localStorage.setItem = fn` / `localStorage.removeItem = fn` assigned onto the Storage
     object itself, so every phone got junk keys named "setItem" and "removeItem" (Object.keys shows them,
     value null; spec-following engines store them as real items). Hook Storage.prototype instead, for
     localStorage only. Same cookie mirroring as before, no keys on the store. */
  try {
    var SP = window.Storage && window.Storage.prototype;
    var origSet = SP.setItem;
    var origRemove = SP.removeItem;
    /* Cleanup: drop the two junk keys (only these exact names) left by earlier builds. Acts once; a no-op after. */
    ["setItem", "removeItem"].forEach(function (junk) {
      try { if (localStorage.getItem(junk) !== null) origRemove.call(localStorage, junk); } catch (e5) {}
    });
    SP.setItem = function (k, v) {
      origSet.call(this, k, v);
      if (this !== localStorage) return;
      if (k === LS) { try { writeCookie(JSON.parse(v)); } catch (e) {} }
      if (k === OWNER && String(v) === "1") writeCookie(restore() || packLicense());
    };
    SP.removeItem = function (k) {
      origRemove.call(this, k);
      if (this !== localStorage) return;
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
        /* Temporary: license server has no Stripe key yet. Unlock the plan the buyer picked on checkout return. */
        if (/^cs_live_/.test(sid)) {
          /* 2.7.0: keep the session id so retryClaim() can swap this for a real W911 code once the server reads Stripe. */
          try { localStorage.setItem("wrap911_claim_session", sid); } catch (eS) {}
          var plan = "";
          try { plan = localStorage.getItem("wrap911_pending_plan") || sessionStorage.getItem("wrap911_pending_plan") || ""; } catch (e0) {}
          var sku = plan === "pack" ? "pack" : "seat";
          try {
            localStorage.setItem(LS, JSON.stringify({
              code: "STRIPE", plan: "pro", sku: sku, seats: sku === "pack" ? 5 : 1,
              unlockedAt: Date.now(), expiresAt: Date.now() + 365 * 86400000, source: "checkout-return"
            }));
            localStorage.removeItem("wrap911_pending_plan");
          } catch (e1) {}
          q.delete("session_id");
          var qs2 = q.toString();
          history.replaceState({}, "", window.location.pathname + (qs2 ? "?" + qs2 : "") + window.location.hash);
          refreshUi();
          return;
        }
        var home = document.getElementById("screen-home") || document.body;
        var box = document.createElement("div");
        box.className = "passion-note";
        box.innerHTML = "<strong>Seat code not ready</strong><p>" + escapeText(err.message || "The license server is not set up yet.") + "</p>";
        home.insertBefore(box, home.firstChild);
      });
    }
    if (restore()) refreshUi();
    recheck();
    retryClaim();
    showSeatCard();
  }
  /* 2.7.0: a checkout-return phone (honor unlock) asks the license server again at most once a day. On success the
     server code replaces the honor license and is shown on Home; any failure leaves the phone as it is. */
  var retried = false;
  function retryClaim() {
    if (retried) return; retried = true;
    var lic = null, sid = "", last = 0;
    try { lic = JSON.parse(localStorage.getItem(LS) || "null"); sid = localStorage.getItem("wrap911_claim_session") || ""; last = Number(localStorage.getItem("wrap911_claim_tried") || 0); } catch (e) {}
    if (!lic || lic.source !== "checkout-return" || !/^cs_live_/.test(sid) || Date.now() - last < 86400000) return;
    try { localStorage.setItem("wrap911_claim_tried", String(Date.now())); } catch (e2) {}
    claimSession(sid).then(function () {
      try { localStorage.removeItem("wrap911_claim_session"); localStorage.removeItem("wrap911_claim_tried"); } catch (e3) {}
    }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1600);
})();
