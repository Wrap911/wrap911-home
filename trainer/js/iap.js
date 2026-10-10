/* Apple In-App Purchase on the iOS app only.
   Non-renewing Shop Pack and Seat. Prices come from StoreKit (priceString).
   A purchase unlocks this phone for 365 days, same as an unlock code.
   Web and PWA: this file returns immediately. */
(function () {
  var Logic = window.WRAP911_IAP_LOGIC;
  if (!Logic || !Logic.isNativeApp()) return;

  var PACK = "com.wrap911.trainer.pack.12mo";
  var SEAT = "com.wrap911.trainer.seat.12mo";
  var IDS = [PACK, SEAT];
  var API = "https://wrap911-coach-proxy.wrap911.workers.dev";
  var CREW_KEY = "wrap911_crew_code";
  var CLAIM_TRY = "wrap911_apple_claim_tried";
  var LS = "wrap911_license";
  var WEB = "https://wrap911.com";
  var TERMS = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
  var PRIVACY = "https://wrap911.com/privacy.html";
  var cap = window.Capacitor;
  var NP = cap.Plugins && cap.Plugins.NativePurchases;
  var products = {};
  var productError = "";
  var us = false;
  var storeCode = "";
  var PURCHASE_WAIT_MS = 45000;
  var JS_MARK = "iap-4";
  var diag = null;
  var steps = [];
  var buyingId = "";

  function readLic() {
    try { return JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { return null; }
  }
  function crewCode() {
    try { return localStorage.getItem(CREW_KEY) || ""; } catch (e) { return ""; }
  }
  function deviceId() {
    var k = "wrap911_device", id = "";
    try { id = localStorage.getItem(k) || ""; } catch (e) {}
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      var b = new Uint8Array(16);
      crypto.getRandomValues(b);
      id = Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      try { localStorage.setItem(k, id); } catch (e2) {}
    }
    return id;
  }
  function refreshUi() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core) return;
    try { if (core.updatePlanChip) core.updatePlanChip(); } catch (e) {}
    try { if (core.renderHome) core.renderHome(); } catch (e2) {}
    try { if (window.WRAP911_PLAN_FIX_PAINT) window.WRAP911_PLAN_FIX_PAINT(); } catch (e3) {}
  }
  function writeLicense(lic, force) {
    var cur = readLic();
    if (!Logic.shouldWrite(cur, lic, Date.now(), !!force)) return cur;
    if (cur && cur.source === "apple" && /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(cur.code || ""))) {
      lic.code = cur.code;
    }
    try { localStorage.setItem(LS, JSON.stringify(lic)); } catch (e) {}
    refreshUi();
    return lic;
  }
  function priceText(id) {
    var p = products[id];
    var s = p && (p.priceString || p.localizedPrice);
    return s ? String(s) : "";
  }
  function escapeText(t) {
    return String(t || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function note(line) {
    steps.push(String(line));
    if (steps.length > 6) steps = steps.slice(steps.length - 6);
    var el = document.getElementById("iap-steps");
    if (el) el.textContent = steps.join(" · ");
  }
  function diagText() {
    var plugin = !!(NP && NP.purchaseProduct);
    var pay = !diag ? "payments ?" : (diag.canMakePayments ? "payments yes" : "payments NO");
    var build = diag && diag.build ? diag.build : "?";
    var scenes = diag ? String(diag.sceneCount) : "?";
    var windows = diag ? String(diag.windowCount) : "?";
    var kinds = diag && diag.windows ? (" " + diag.windows) : "";
    var onScreen = !diag ? "window ?" : (diag.rootInWindow ? "window yes" : "window NO");
    var store = storeCode || "?";
    return "Build " + build + " · js " + JS_MARK + " · plugin " + (plugin ? "yes" : "NO") +
      " · " + pay + " · store " + store + " · scenes " + scenes + " · windows " + windows + kinds + " · " + onScreen;
  }
  function contactMail() {
    var cfg = window.WRAP911_CONFIG || {};
    return cfg.contactEmail || "";
  }
  function css() {
    if (document.getElementById("w911-iap-css")) return;
    var s = document.createElement("style");
    s.id = "w911-iap-css";
    s.textContent =
      ".iap-card{background:#161018;border:1px solid #ffb000;border-radius:14px;padding:16px;margin:12px 0}" +
      ".iap-card h2{margin:0 0 6px;font-size:1.15rem;letter-spacing:.04em}" +
      ".iap-card .iap-lead{margin:0 0 8px;line-height:1.4}" +
      ".iap-card button,.iap-card .iap-web{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;border-radius:12px;padding:14px 12px;font-weight:800;margin-top:10px}" +
      ".iap-card .buy{background:linear-gradient(100deg,#ff2d8c,#ffb000);color:#fff;border:0;font-size:1.05rem}" +
      ".iap-card .buy.seat{background:#24182a;color:#fff6ee;border:1px solid #ffb000}" +
      ".iap-card .restore{background:transparent;color:#ffb000;border:1px solid #4a2a44;font-weight:700}" +
      ".iap-card .iap-web{background:transparent;color:#fff6ee;border:1px solid #4a2a44;font-weight:700;font-size:.95rem}" +
      ".iap-card .fine{font-size:12px;opacity:.8;margin:12px 0 0;line-height:1.45}" +
      ".iap-card a{color:#ffb000}" +
      ".iap-card .msg{font-size:14px;margin-top:10px;line-height:1.4}" +
      ".iap-card .diag{font-size:12px;line-height:1.35;color:#ffb000;margin:0 0 8px;word-break:break-word}" +
      ".iap-card .code{font-size:1.15rem;letter-spacing:.06em}";
    document.head.appendChild(s);
  }
  function buyLabel(id, name) {
    var price = priceText(id);
    return price ? ("Buy " + name + " · " + price) : ("Buy " + name);
  }
  function activeLicense() {
    var lic = readLic();
    if (!lic || lic.source !== "apple") return null;
    if (lic.expiresAt && Date.now() > Number(lic.expiresAt)) return null;
    if (lic.sku !== "pack" && lic.sku !== "seat") return null;
    return lic;
  }
  function rememberCode(code) {
    try { localStorage.setItem(CREW_KEY, code); } catch (e) {}
    var lic = readLic();
    if (lic && lic.source === "apple" && lic.sku === "pack" && code) {
      lic.code = code;
      try { localStorage.setItem(LS, JSON.stringify(lic)); } catch (e2) {}
    }
    refreshUi();
    try { render(); } catch (e3) {}
  }
  function setMsg(t) {
    var m = document.getElementById("iap-msg");
    if (m) m.textContent = t;
  }
  function reportJs(text) {
    var line = String(text || "error").replace(/\s+/g, " ").slice(0, 140);
    note("JS " + line);
  }
  function buttonFromEvent(ev) {
    var node = ev.target;
    if (!node || !node.closest) return null;
    return node.closest("[data-iap], #iap-restore");
  }
  function finishBuying(btn) {
    buyingId = "";
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute("data-buying");
    }
  }
  function purchase(btn) {
    var id = btn.getAttribute("data-iap");
    if (!btn.getAttribute("data-tap")) note("tap " + (id === SEAT ? "seat" : "pack"));
    if (!NP || !NP.purchaseProduct) {
      note("no purchase method");
      setMsg("App Store purchasing is not available in this build. You were not charged.");
      return;
    }
    if (!products[id]) {
      note("product missing");
      setMsg(Logic.missingProductsMessage());
      return;
    }
    if (diag && diag.canMakePayments === false) {
      note("payments off");
      setMsg("In-App Purchases are turned off on this iPhone. Check Screen Time and Restrictions. You were not charged.");
      return;
    }
    if (buyingId) {
      note("purchase already running");
      return;
    }
    buyingId = id;
    btn.setAttribute("data-buying", "1");
    btn.disabled = true;
    setMsg("Opening App Store checkout…");
    note("purchase called");
    var finished = false;
    var timer = setTimeout(function () {
      if (finished) return;
      finishBuying(btn);
      note("timed out");
      setMsg(Logic.purchaseStallMessage());
    }, PURCHASE_WAIT_MS);
    NP.purchaseProduct({ productIdentifier: id, productType: "inapp", quantity: 1 }).then(function (tx) {
      finished = true;
      clearTimeout(timer);
      note("purchase returned");
      var stamped = tx || {};
      if (!stamped.purchaseDate) stamped.purchaseDate = new Date().toISOString();
      if (!stamped.productIdentifier) stamped.productIdentifier = id;
      var row = Logic.pickEntitlement([stamped], Date.now());
      if (row) grantRow(row, true);
      return sync();
    }).then(function () {
      finishBuying(btn);
      setMsg("This phone is unlocked.");
      render();
    }).catch(function (e) {
      finished = true;
      clearTimeout(timer);
      finishBuying(btn);
      var raw = String(e && (e.message || e) || "");
      if (/cancel/i.test(raw)) {
        note("cancelled");
        setMsg("");
      } else if (/cannot find product|not found/i.test(raw)) {
        note("product not found");
        setMsg(Logic.missingProductsMessage());
      } else {
        note(raw ? raw.slice(0, 140) : "purchase failed");
        setMsg(raw ? raw : "Purchase did not finish, so you were not charged. Please try again.");
      }
    });
  }
  function readStore() {
    if (!NP || !NP.getPurchases) {
      return Promise.reject(new Error("App Store purchasing is not available in this build."));
    }
    function one(opts) {
      return NP.getPurchases(opts).then(function (r) {
        return { purchases: (r && r.purchases) || [], error: "" };
      }, function (e) {
        return { purchases: [], error: String((e && (e.message || e)) || "Could not read App Store purchases.") };
      });
    }
    /* Transaction.all, then currentEntitlements. Both stay on the phone. */
    return Promise.all([
      one(),
      one({ onlyCurrentEntitlements: true })
    ]).then(function (parts) {
      var list = [];
      var errors = [];
      parts.forEach(function (part) {
        if (part.error) errors.push(part.error);
        for (var i = 0; i < part.purchases.length; i++) list.push(part.purchases[i]);
      });
      return { list: list, error: errors.length === parts.length ? errors[0] : "" };
    });
  }
  function finishRestore(row, errorText) {
    if (row) grantRow(row, true);
    render();
    setMsg(Logic.restoreMessage(!!row, errorText));
  }
  function restore() {
    setMsg("Restoring…");
    note("tap restore");
    readStore().then(function (first) {
      if (first.error && !first.list.length) throw new Error(first.error);
      var row = Logic.pickEntitlement(first.list, Date.now());
      if (row) {
        note("restored " + row.sku);
        finishRestore(row, "");
        return;
      }
      /* A new phone has an empty local history until Apple syncs it. */
      if (!NP.restorePurchases) {
        finishRestore(null, "");
        return;
      }
      return NP.restorePurchases().then(function () {
        return readStore();
      }).then(function (second) {
        if (second.error && !second.list.length) throw new Error(second.error);
        var again = Logic.pickEntitlement(second.list, Date.now());
        if (again) note("restored " + again.sku);
        finishRestore(again, "");
      });
    }).catch(function (e) {
      var raw = String((e && (e.message || e)) || "Restore failed.");
      note(raw.slice(0, 140));
      finishRestore(null, raw);
    });
  }
  function installTaps() {
    if (installTaps.done) return;
    installTaps.done = true;
    window.addEventListener("error", function (ev) {
      reportJs(ev && ev.message);
    });
    window.addEventListener("unhandledrejection", function (ev) {
      var reason = ev && ev.reason;
      reportJs((reason && (reason.message || reason)) || "rejection");
    });
    document.addEventListener("pointerdown", function (ev) {
      try {
        var btn = buttonFromEvent(ev);
        if (!btn || !btn.getAttribute("data-iap")) return;
        var id = btn.getAttribute("data-iap");
        btn.setAttribute("data-tap", "1");
        note("tap " + (id === SEAT ? "seat" : "pack"));
      } catch (e) {
        reportJs(e && (e.message || e));
      }
    }, true);
    document.addEventListener("click", function (ev) {
      var btn = buttonFromEvent(ev);
      if (!btn) return;
      try {
        if (btn.id === "iap-restore") restore();
        else purchase(btn);
      } catch (e) {
        reportJs(e && (e.message || e));
      }
    }, true);
  }
  function claimPack(tx, force) {
    var have = crewCode();
    if (have && /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(have) && !force) return Promise.resolve(have);
    if (!tx || !tx.jwsRepresentation) return Promise.resolve("");
    var last = 0;
    try { last = Number(localStorage.getItem(CLAIM_TRY) || 0); } catch (e) {}
    if (!force && Date.now() - last < 86400000) return Promise.resolve("");
    try { localStorage.setItem(CLAIM_TRY, String(Date.now())); } catch (e2) {}
    return fetch(API + "/license/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jws: tx.jwsRepresentation, device: deviceId() })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok && /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(d.code)) {
        rememberCode(d.code);
        return d.code;
      }
      return "";
    }).catch(function () { return ""; });
  }
  function grantRow(row, force) {
    if (!row) return null;
    var lic = writeLicense(Logic.licenseFrom(row, Date.now()), force);
    if (row.sku === "pack") claimPack(row.tx, !!force);
    return lic;
  }
  function sync() {
    if (!NP || !NP.getPurchases) return Promise.resolve(false);
    return NP.getPurchases().then(function (r) {
      var row = Logic.pickEntitlement((r && r.purchases) || [], Date.now());
      if (row) {
        grantRow(row, false);
        return true;
      }
      var cur = readLic();
      if (cur && cur.source === "apple") {
        /* A purchase just wrote this license. StoreKit can return an empty list
           for a moment. Keep a fresh unlock; the next sync removes it if it is really gone. */
        var age = Date.now() - Number(cur.checkedAt || 0);
        if (Number(cur.expiresAt) > Date.now() && age < 20000) return true;
        try { localStorage.removeItem(LS); } catch (e) {}
        refreshUi();
      }
      return false;
    }).catch(function () { return false; });
  }
  function render() {
    var screen = document.getElementById("screen-pricing");
    if (!screen) return;
    css();
    var lead = screen.querySelector(".lead");
    if (lead) lead.textContent = "Shop Pack is 5 seats for 12 months. Seat is 1 tech for 12 months. One payment. It does not auto-renew.";
    var stripe = document.getElementById("stripe-link-wrap");
    if (stripe) {
      stripe.classList.add("hidden");
      stripe.innerHTML = "";
    }
    var card = document.getElementById("iap-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "iap-card";
      card.className = "iap-card";
      var h1 = screen.querySelector("h1");
      if (h1 && h1.nextSibling) screen.insertBefore(card, h1.nextSibling);
      else screen.insertBefore(card, screen.firstChild);
    }
    var unlock = screen.querySelector(".unlock-box");
    if (unlock && !document.getElementById("iap-code-note")) {
      var codeNote = document.createElement("p");
      codeNote.id = "iap-code-note";
      codeNote.className = "muted";
      codeNote.textContent = "Already have an unlock code? Enter it here.";
      unlock.parentNode.insertBefore(codeNote, unlock);
    }
    var lic = activeLicense();
    var code = crewCode();
    var mail = contactMail();
    var mailHtml = mail ? '<a href="mailto:' + escapeText(mail) + '?subject=WRAP%20911%20Apple%20crew%20code">' + escapeText(mail) + "</a>" : "us";
    var status = "";
    if (lic) {
      var when = new Date(Number(lic.expiresAt)).toLocaleDateString();
      var name = lic.sku === "pack" ? "Shop Pack" : "Seat";
      status = '<p class="msg"><b>' + name + " is active</b> until " + escapeText(when) + ".</p>";
      if (lic.sku === "pack") {
        if (/^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) || /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(lic.code || ""))) {
          var shown = /^W911-/.test(code) ? code : lic.code;
          status += '<p class="msg">Crew code <b class="code">' + escapeText(shown) + "</b><br>Type it in Unlock on up to 4 other phones.</p>";
        } else {
          status += '<p class="msg">Your extra seat codes will appear here. This phone is already unlocked. Until then, email ' + mailHtml + " and we will send the codes for the other four phones.</p>";
        }
      }
    }
    var buttons = "";
    if (!NP) {
      buttons = '<p class="msg">App Store purchasing is not available in this build. You can still enter an unlock code.</p>';
    } else if (!lic) {
      buttons =
        '<button type="button" class="buy" data-iap="' + PACK + '">' + escapeText(buyLabel(PACK, "Shop Pack")) + "</button>" +
        '<button type="button" class="buy seat" data-iap="' + SEAT + '">' + escapeText(buyLabel(SEAT, "Seat")) + "</button>";
    } else if (lic.sku === "seat") {
      buttons = '<button type="button" class="buy" data-iap="' + PACK + '">' + escapeText(buyLabel(PACK, "Shop Pack")) + "</button>";
    }
    var restore = NP ? '<button type="button" class="restore" id="iap-restore">Restore Purchases</button>' : "";
    var web = us
      ? '<a class="iap-web" href="' + WEB + '" target="_blank" rel="noopener noreferrer">Buy on wrap911.com</a>'
      : "";
    var packP = priceText(PACK);
    var seatP = priceText(SEAT);
    var priceLine = (packP || seatP)
      ? ("Shop Pack " + (packP || "—") + ". Seat " + (seatP || "—") + ". ")
      : "";
    card.innerHTML =
      "<h2>Buy with Apple</h2>" +
      '<p class="iap-lead">Full trainer on this phone for 12 months. Shop Pack is the crew buy: this phone plus four more.</p>' +
      buttons +
      status +
      restore +
      '<p class="msg" id="iap-msg"></p>' +
      '<p class="fine">' + escapeText(priceLine) +
      "One-time purchase. Access lasts 12 months from the purchase date and does not auto-renew. " +
      "Payment is charged to your Apple ID. " +
      '<a href="' + TERMS + '" target="_blank" rel="noopener">Terms of Use (EULA)</a> · ' +
      '<a href="' + PRIVACY + '" target="_blank" rel="noopener">Privacy policy</a></p>' +
      web;
    if (productError) setMsg(productError);
    if (buyingId) {
      var pendingBtn = card.querySelector('[data-iap="' + buyingId + '"]');
      if (pendingBtn) pendingBtn.disabled = true;
    }
  }
  function loadProducts() {
    if (!NP || !NP.getProducts) return Promise.resolve();
    return NP.getProducts({ productIdentifiers: IDS, productType: "inapp" }).then(function (r) {
      var next = {};
      ((r && r.products) || []).forEach(function (p) {
        next[p.identifier || p.productIdentifier] = p;
      });
      products = next;
      productError = (products[PACK] && products[SEAT]) ? "" : Logic.missingProductsMessage();
    }).catch(function () {
      productError = Logic.missingProductsMessage();
    });
  }
  function loadStorefront() {
    window.WRAP911_IAP_US = false;
    if (!NP || !NP.getStorefront) return Promise.resolve();
    return NP.getStorefront().then(function (r) {
      storeCode = String((r && r.countryCode) || "");
      us = Logic.isUsStorefront(storeCode);
      window.WRAP911_IAP_US = us;
      note("store " + (storeCode || "none"));
    }).catch(function () {
      storeCode = "";
      us = false;
      window.WRAP911_IAP_US = false;
      note("store failed");
    });
  }
  function hookCore() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core || core._iapHook || typeof core.renderPricing !== "function") return;
    var orig = core.renderPricing;
    core.renderPricing = function () {
      var result = orig.apply(this, arguments);
      render();
      return result;
    };
    core._iapHook = true;
  }
  function loadDiagnostics() {
    if (!NP || !NP.diagnostics) {
      note(NP ? "no diagnostics" : "no plugin");
      return Promise.resolve();
    }
    return NP.diagnostics().then(function (d) {
      diag = d || {};
      note("diag build " + (diag.build || "?") + " pay " + (diag.canMakePayments ? "yes" : "no"));
    }).catch(function (e) {
      note("diag failed " + String((e && e.message) || e || "").slice(0, 80));
    });
  }
  function boot() {
    installTaps();
    render();
    hookCore();
    loadDiagnostics().then(render);
    loadStorefront().then(function () {
      try { if (window.WRAP911_PLAN_FIX_PAINT) window.WRAP911_PLAN_FIX_PAINT(); } catch (e) {}
      render();
    });
    loadProducts().then(render);
    sync().then(render);
  }
  window.WRAP911_IAP = { sync: sync, render: render, productIds: IDS, hook: hookCore };
  if (NP && NP.addListener) {
    try {
      NP.addListener("transactionUpdated", function (tx) {
        var row = Logic.pickEntitlement([tx], Date.now());
        if (row) grantRow(row, true);
        render();
      });
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(function () { hookCore(); render(); }, 400);
  setTimeout(function () { hookCore(); render(); }, 1600);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) sync().then(render);
  });
})();
