/* Apple In-App Purchase: Wrap911 Pro yearly subscription ($49/yr, 7-day free trial).
   iOS app only. Uses @capgo/native-purchases (StoreKit 2). An active subscription writes a
   local "pro" license (sku "iap") that app-core.js / license-gate.js already treat as full access.
   Web visitors and Stripe seat codes are untouched. */
(function () {
  var PRODUCT_ID = "com.wrap911.trainer.pro.yearly";
  var LS = "wrap911_license";
  var TERMS = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
  var PRIVACY = "https://wrap911.com/privacy.html";
  var cap = window.Capacitor;
  var isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  if (!isNative) return;
  var NP = cap.Plugins && cap.Plugins.NativePurchases;
  if (!NP) return;

  var product = null;

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
        productId: PRODUCT_ID, trial: !!(tx && tx.isTrialPeriod),
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
      if ((p.productIdentifier || p.productId) !== PRODUCT_ID) continue;
      var exp = p.expirationDate ? Date.parse(p.expirationDate) : 0;
      if (p.isActive === true || exp > now) return p;
    }
    return null;
  }
  function sync() {
    return NP.getPurchases({ productType: "subs" }).then(function (r) {
      var a = activeFrom(r && r.purchases);
      if (a) grant(a); else revokeIfIap();
      return !!a;
    }).catch(function () { return false; });
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
  function priceText() { return product && (product.priceString || product.localizedPrice) || "$49.00"; }
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
    var price = priceText();
    card.innerHTML = '<h2>Wrap911 Pro</h2>' +
      '<p>Full trainer on this iPhone: every lesson, drill, photo, video and the job manager.</p>' +
      '<p class="price">7 days free, then ' + price + ' per year</p>' +
      (active ? '<p class="msg">Pro is active' + (lic.trial ? ' (free trial)' : '') + ' until ' + new Date(Number(lic.expiresAt)).toLocaleDateString() + '.</p>'
              : '<button type="button" class="buy" id="iap-buy">Start 7-day free trial</button>') +
      '<button type="button" class="restore" id="iap-restore">Restore purchases</button>' +
      '<p class="msg" id="iap-msg"></p>' +
      '<p class="fine">Payment is charged to your Apple ID when the free trial ends. The subscription renews automatically at ' + price +
      ' per year unless you cancel at least 24 hours before the end of the current period. Manage or cancel in Settings &gt; your name &gt; Subscriptions. ' +
      '<a href="' + TERMS + '" target="_blank" rel="noopener">Terms of Use (EULA)</a> · <a href="' + PRIVACY + '" target="_blank" rel="noopener">Privacy policy</a></p>';
    var msg = function (t) { var m = document.getElementById("iap-msg"); if (m) m.textContent = t; };
    var buy = document.getElementById("iap-buy");
    if (buy) buy.onclick = function () {
      buy.disabled = true; msg("Opening Apple checkout…");
      NP.purchaseProduct({ productIdentifier: PRODUCT_ID, productType: "subs", quantity: 1 }).then(function (tx) {
        grant(tx); return sync();
      }).then(function () { msg("Welcome to Wrap911 Pro."); render(); })
        .catch(function (e) { buy.disabled = false; msg(/cancel/i.test(String(e && e.message || e)) ? "" : "Purchase did not finish. Please try again."); });
    };
    document.getElementById("iap-restore").onclick = function () {
      msg("Restoring…");
      NP.restorePurchases().then(sync).then(function (ok) {
        msg(ok ? "Pro restored." : "No active Wrap911 Pro subscription found for this Apple ID."); render();
      }).catch(function () { msg("Restore failed. Check your connection and try again."); });
    };
  }
  function loadProduct() {
    return NP.getProducts({ productIdentifiers: [PRODUCT_ID], productType: "subs" }).then(function (r) {
      product = (r && r.products && r.products[0]) || null;
    }).catch(function () {});
  }
  function run() {
    render();
    loadProduct().then(render);
    sync().then(render);
  }
  window.WRAP911_IAP = { sync: sync, render: render, productId: PRODUCT_ID };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) sync().then(render); });
})();
