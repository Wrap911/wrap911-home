/* Apple In-App Purchase: Wrap911 Seat ($49/yr, 1 installer) and Crew ($149/yr, 5 installers), 7-day free trial.
   iOS app only. Uses @capgo/native-purchases (StoreKit 2). An active subscription writes a
   local "pro" license (sku "iap") that app-core.js / license-gate.js already treat as full access.
   Web visitors and Stripe seat codes are untouched. */
(function () {
  var SEAT = "com.wrap911.trainer.seat.yearly";
  var CREW = "com.wrap911.trainer.crew.yearly";
  var IDS = [SEAT, CREW];
  var API = "https://wrap911-coach-proxy.wrap911.workers.dev";
  var CREW_KEY = "wrap911_crew_code";
  var LS = "wrap911_license";
  var TERMS = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
  var PRIVACY = "https://wrap911.com/privacy.html";
  var cap = window.Capacitor;
  var isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  if (!isNative) return;
  var NP = cap.Plugins && cap.Plugins.NativePurchases;
  if (!NP) return;

  var products = {};

  function readLic() { try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { return null; } }
  function isIapLic(l) { return !!(l && l.sku === "iap"); }
  function refreshUi() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core) return;
    try { if (core.updatePlanChip) core.updatePlanChip(); } catch (e) {}
    try { if (core.renderHome) core.renderHome(); } catch (e2) {}
  }
  function grant(tx) {
    var exp = tx && tx.expirationDate ? Date.parse(tx.expirationDate) : NaN;
    if (!exp || isNaN(exp)) exp = Date.now() + 8 * 86400000;
    var cur = readLic();
    /* Do not overwrite a Stripe/server license that lasts longer. */
    if (cur && !isIapLic(cur) && cur.plan === "pro" && Number(cur.expiresAt) > exp) return;
    try {
      localStorage.setItem(LS, JSON.stringify({
        code: "APPLE", plan: "pro", sku: "iap", seats: 1, source: "apple",
        productId: (tx && (tx.productIdentifier || tx.productId)) || SEAT, trial: !!(tx && tx.isTrialPeriod),
        unlockedAt: Date.now(), expiresAt: exp, checkedAt: Date.now()
      }));
    } catch (e) {}
    refreshUi();
  }
  function revokeIfIap() {
    if (isIapLic(readLic())) { try { localStorage.removeItem(LS); } catch (e) {} refreshUi(); }
  }
  function activeFrom(list) {
    var now = Date.now();
    for (var i = 0; i < (list || []).length; i++) {
      var p = list[i];
      if (IDS.indexOf(p.productIdentifier || p.productId) < 0) continue;
      var exp = p.expirationDate ? Date.parse(p.expirationDate) : 0;
      if (p.isActive === true || exp > now) return p;
    }
    return null;
  }
  function sync() {
    return NP.getPurchases({ productType: "subs" }).then(function (r) {
      var a = activeFrom(r && r.purchases);
      if (a) { grant(a); if ((a.productIdentifier || a.productId) === CREW && !crewCode()) crewClaim(a); }
      else revokeIfIap();
      return !!a;
    }).catch(function () { return false; });
  }

  function crewCode() { try { return localStorage.getItem(CREW_KEY) || ""; } catch (e) { return ""; } }
  function deviceId() {
    try { return localStorage.getItem("wrap911_device") || ""; } catch (e) { return ""; }
  }
  /* Crew: send Apple's signed transaction to the license server, get a 5-seat code to share. */
  function crewClaim(tx) {
    if (!tx || !tx.jwsRepresentation) return Promise.resolve("");
    return fetch(API + "/license/apple", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jws: tx.jwsRepresentation, device: deviceId() })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok && /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(d.code)) {
        try { localStorage.setItem(CREW_KEY, d.code); } catch (e) {}
        render();
        return d.code;
      }
      return "";
    }).catch(function () { return ""; });
  }
  function css() {
    if (document.getElementById("w911-iap-css")) return;
    var s = document.createElement("style"); s.id = "w911-iap-css";
    s.textContent = ".iap-card{background:#15171c;border:1px solid #ffb020;border-radius:14px;padding:18px;margin:14px 0}" +
      ".iap-card h2{margin:0 0 4px;font-size:20px}.iap-card .price{font-size:17px;font-weight:700;margin:6px 0}" +
      ".iap-card button{width:100%;padding:14px;border-radius:10px;border:0;font-weight:700;font-size:16px;margin-top:10px}" +
      ".iap-card .buy{background:#ffb020;color:#111}.iap-card .restore{background:#2a2d35;color:#eee}" +
      ".iap-card .fine{font-size:12px;opacity:.75;margin-top:10px;line-height:1.4}.iap-card a{color:#ffb020}" +
      ".iap-card .msg{font-size:14px;margin-top:8px}";
    document.head.appendChild(s);
  }
  function priceText(id) {
    var p = products[id];
    return (p && (p.priceString || p.localizedPrice)) || (id === CREW ? "$149.00" : "$49.00");
  }
  function render() {
    var p = document.getElementById("screen-pricing");
    if (!p) return;
    css();
    var card = document.getElementById("iap-card");
    if (!card) {
      card = document.createElement("div"); card.id = "iap-card"; card.className = "iap-card";
      var lead = p.querySelector(".lead");
      p.insertBefore(card, lead ? lead.nextSibling : p.firstChild);
    }
    var lic = readLic(), active = isIapLic(lic) && Number(lic.expiresAt) > Date.now();
    var seatP = priceText(SEAT), crewP = priceText(CREW), code = crewCode();
    var activeName = active ? (lic.productId === CREW ? "Crew (5 seats)" : "Seat") : "";
    card.innerHTML = '<h2>Wrap911 Pro</h2>' +
      '<p>Full trainer: every lesson, drill, photo, video and the job manager. Try it free for 7 days.</p>' +
      (active
        ? '<p class="msg">' + activeName + ' is active' + (lic.trial ? ' (free trial)' : '') + ' until ' + new Date(Number(lic.expiresAt)).toLocaleDateString() + '.</p>'
        : '<p class="price">Seat · 1 installer · ' + seatP + ' per year</p>' +
          '<button type="button" class="buy" data-iap="' + SEAT + '">Start free trial · Seat</button>' +
          '<p class="price" style="margin-top:14px">Crew · 5 installers · ' + crewP + ' per year</p>' +
          '<button type="button" class="buy" data-iap="' + CREW + '">Start free trial · Crew</button>') +
      (code ? '<p class="msg"><b>Crew code: ' + code + '</b><br>Give this code to up to 4 installers. They enter it under Unlock on their phone.</p>' : '') +
      '<button type="button" class="restore" id="iap-restore">Restore purchases</button>' +
      '<p class="msg" id="iap-msg"></p>' +
      '<p class="fine">7 days free, then ' + seatP + ' per year (Seat) or ' + crewP + ' per year (Crew), charged to your Apple ID when the trial ends. ' +
      'The subscription renews automatically unless you cancel at least 24 hours before the end of the current period. ' +
      'Manage or cancel in Settings &gt; your name &gt; Subscriptions. ' +
      '<a href="' + TERMS + '" target="_blank" rel="noopener">Terms of Use (EULA)</a> · <a href="' + PRIVACY + '" target="_blank" rel="noopener">Privacy policy</a></p>';
    var msg = function (t) { var m = document.getElementById("iap-msg"); if (m) m.textContent = t; };
    Array.prototype.forEach.call(card.querySelectorAll("[data-iap]"), function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-iap");
        btn.disabled = true; msg("Opening Apple checkout…");
        NP.purchaseProduct({ productIdentifier: id, productType: "subs", quantity: 1 }).then(function (tx) {
          grant(tx);
          return (id === CREW ? crewClaim(tx) : Promise.resolve("")).then(sync);
        }).then(function () { msg("Welcome to Wrap911 Pro."); render(); })
          .catch(function (e) { btn.disabled = false; msg(/cancel/i.test(String(e && e.message || e)) ? "" : "Purchase did not finish. Please try again."); });
      };
    });
    document.getElementById("iap-restore").onclick = function () {
      msg("Restoring…");
      NP.restorePurchases().then(sync).then(function (ok) {
        msg(ok ? "Subscription restored." : "No active Wrap911 subscription found for this Apple ID."); render();
      }).catch(function () { msg("Restore failed. Check your connection and try again."); });
    };
  }
  function loadProduct() {
    return NP.getProducts({ productIdentifiers: IDS, productType: "subs" }).then(function (r) {
      ((r && r.products) || []).forEach(function (p) { products[p.identifier || p.productIdentifier] = p; });
    }).catch(function () {});
  }
  function run() {
    render();
    loadProduct().then(render);
    sync().then(render);
  }
  window.WRAP911_IAP = { sync: sync, render: render, productIds: IDS };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) sync().then(render); });
})();
