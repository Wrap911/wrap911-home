/* Seat $49 is one phone. Shop pack $149 is five phones and a crew link. */
(function () {
  var KEY = "wrap911_license";
  var PENDING = "wrap911_pending_plan";
  /* Audit 2026-09-26: links come from config.js. In stripeTestMode only test-mode links are used, so the
     sandbox can never send a real card to live checkout. */
  var CFG = window.WRAP911_CONFIG || {};
  var TEST = CFG.stripeTestMode === true;
  var SEAT_URL = TEST ? (CFG.stripeTestSeatLink || "") : (CFG.stripeSeatLink || "https://buy.stripe.com/eVq8wQ1EDc9643nanD9ws04");
  var PACK_URL = TEST ? (CFG.stripeTestPackLink || "") : (CFG.stripePaymentLink || "https://buy.stripe.com/3cI6oI3ML8WU2ZjdzP9ws03");
  var FIELD_URL = CFG.fieldSkuLive ? (TEST ? (CFG.stripeTestFieldLink || "") : (CFG.stripeFieldLink || "")) : "";
  var YEAR = 365 * 86400000;

  function pending() {
    try {
      return localStorage.getItem(PENDING) || sessionStorage.getItem(PENDING) || "";
    } catch (e) {
      return "";
    }
  }

  function remember(plan) {
    try { localStorage.setItem(PENDING, plan); } catch (e) {}
    try { sessionStorage.setItem(PENDING, plan); } catch (e2) {}
  }

  function clearPending() {
    try { localStorage.removeItem(PENDING); } catch (e) {}
    try { sessionStorage.removeItem(PENDING); } catch (e2) {}
  }

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }

  function mix(body) {
    var h = 2166136261;
    var s = "w911crew|" + body;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function code() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var body = "";
    for (var i = 0; i < 4; i++) body += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    var h = mix(body);
    return body + alphabet.charAt(h % 32) + alphabet.charAt((h >>> 5) % 32);
  }

  function crewOk(token) {
    if (!/^CREW-[A-Z0-9]{6}$/.test(token)) return false;
    var c = token.slice(5);
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var h = mix(c.slice(0, 4));
    return c.slice(4) === alphabet.charAt(h % 32) + alphabet.charAt((h >>> 5) % 32);
  }

  function write(sku, crewCode) {
    var now = Date.now();
    var prev = read();
    var crew = crewCode || (prev && prev.crewCode) || "";
    if (sku === "pack" && !crew) crew = code();
    var lic = {
      code: "STRIPE",
      plan: "pro",
      unlockedAt: now,
      expiresAt: now + (sku === "field" ? 31 * 86400000 : YEAR),
      source: "stripe-payment-link",
      sku: sku,
      seats: sku === "pack" ? 5 : 1,
      crewCode: sku === "pack" ? crew : ""
    };
    localStorage.setItem(KEY, JSON.stringify(lic));
    return lic;
  }

  function strip(name) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.delete(name);
      var q = url.searchParams.toString();
      history.replaceState({}, "", url.pathname + (q ? "?" + q : "") + url.hash);
    } catch (e) {}
  }

  function defaultSku() {
    var def = (window.WRAP911_CONFIG && window.WRAP911_CONFIG.defaultSku) || "W911-PACK";
    return /SEAT/i.test(def) ? "seat" : "pack";
  }

  var missed = false;
  var params;
  try { params = new URLSearchParams(window.location.search); } catch (e) { params = new URLSearchParams(); }
  var buy = (params.get("buy") || "").toLowerCase();
  if (buy === "seat" || buy === "pack" || buy === "field") {
    remember(buy);
    var target = buy === "pack" ? PACK_URL : (buy === "field" ? FIELD_URL : SEAT_URL);
    if (target) {
      window.location.replace(target);
      return;
    }
    /* Sandbox with no test link: stay here and say so. */
    window.WRAP911_SANDBOX_NO_CHECKOUT = buy;
    strip("buy");
  }

  function applyReturn() {
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { q = new URLSearchParams(); }
    var token = (q.get("license") || "").trim().toUpperCase();
    var plan = pending();
    var sessionId = q.get("session_id") || "";
    var redirectStatus = (q.get("redirect_status") || "").toLowerCase();
    var shopFlag = q.get("shop") === "1" || q.get("owner") === "1";

    /* Audit 2026-09-26: ?shop=1 / ?owner=1 used to write a full Pack license for anyone. Now they are just removed. */
    if (shopFlag) {
      strip("shop");
      strip("owner");
    }

    /* Honor system (no server check yet): only a Stripe-shaped id counts. Fake ?session_id=1 does nothing. */
    if (/^cs_(live|test)_[A-Za-z0-9]{10,}$/.test(sessionId) && !token) {
      var sku = (plan === "seat" || plan === "pack" || plan === "field") ? plan : defaultSku();
      write(sku, "");
      clearPending();
      missed = false;
      strip("session_id");
      strip("redirect_status");
    }
    if (token === "STRIPE-SEAT" || token === "STRIPE-PACK") {
      write(token === "STRIPE-PACK" ? "pack" : "seat", "");
      clearPending();
      strip("license");
    } else if (token === "STRIPE" || token.indexOf("STRIPE-") === 0) {
      var sku2 = (plan === "seat" || plan === "pack" || plan === "field") ? plan : defaultSku();
      write(sku2, "");
      clearPending();
      strip("license");
    } else if (crewOk(token)) {
      write("pack", token.slice(5));
      strip("license");
    }
  }

  function daysLeft(lic) {
    if (!lic || !lic.expiresAt) return "";
    var d = Math.max(0, Math.ceil((lic.expiresAt - Date.now()) / 86400000));
    return d + " days left";
  }

  function crewLink(lic) {
    var origin = window.location.origin + window.location.pathname.replace(/index\.html$/, "");
    if (origin.slice(-1) !== "/") origin += "/";
    return origin + "?license=CREW-" + lic.crewCode;
  }

  /* Hotfix 2.6.4: one plan label for every chip. app-core planMeta() calls this too, so the header chip
     no longer flips between PACK (painted here) and PRO (painted by app-core on other screens). */
  function planLabel(lic) {
    if (!lic || lic.expired || (lic.sku !== "seat" && lic.sku !== "pack" && lic.sku !== "field")) return null;
    if (lic.expiresAt && Date.now() > Number(lic.expiresAt)) return null;
    var left = daysLeft(lic);
    return {
      badge: lic.sku === "pack" ? "PACK" : (lic.sku === "field" ? "FIELD" : "SEAT"),
      detail: lic.sku === "pack"
        ? "Shop pack · 5 phones · " + left
        : (lic.sku === "field" ? "Field monthly · this phone · " + left : "1 seat · this phone · " + left)
    };
  }
  window.WRAP911_PLAN_LABEL = planLabel;

  function paint() {
    var lic = read();
    var label = planLabel(lic);
    if (!label) return;
    var badge = label.badge;
    var detail = label.detail;
    var chip = document.getElementById("plan-chip");
    if (chip) {
      if (chip.textContent !== badge) chip.textContent = badge;
      chip.className = "plan-chip pro";
    }
    var homeBadge = document.getElementById("home-plan-badge");
    if (homeBadge && homeBadge.textContent !== badge) homeBadge.textContent = badge;
    var homeDetail = document.getElementById("home-plan-detail");
    if (homeDetail && homeDetail.textContent !== detail) homeDetail.textContent = detail;

    var home = document.getElementById("screen-home");
    if (!home) return;
    var card = document.getElementById("seat-plan-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "seat-plan-card";
      card.className = "passion-note";
      var anchor = document.getElementById("home-primary-actions");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor);
      else home.appendChild(card);
    }
    if (lic.sku === "pack") {
      var link = crewLink(lic);
      card.innerHTML = "<strong>Shop pack · 5 phones</strong><p>This phone is in. Send this link to the other four. Each phone that opens it gets the same 12 months.</p><p><a href=\"" + link + "\">" + link + "</a></p>";
    } else if (lic.sku === "field") {
      card.innerHTML = "<strong>Field monthly</strong><p>This phone is unlocked month to month. A shop pack is $149 one-time for five phones, 12 months.</p>";
    } else {
      card.innerHTML = "<strong>1 seat</strong><p>This phone is unlocked for 12 months. It does not cover a second phone. A shop pack is $149 for five.</p>";
    }
  }

  function payCard() {
    var home = document.getElementById("screen-home");
    if (!home) return;
    var card = document.getElementById("seat-plan-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "seat-plan-card";
      card.className = "passion-note";
      var anchor = document.getElementById("home-primary-actions");
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor);
      else home.appendChild(card);
    }
    var lic = read();
    if (lic && !lic.expired && (lic.sku === "seat" || lic.sku === "pack" || lic.sku === "field")) return;
    if (lic && !lic.expired && lic.plan === "free" && !lic.expiresAt) { if (card.parentNode) card.parentNode.removeChild(card); return; }
    if (window.WRAP911_SANDBOX_NO_CHECKOUT) {
      card.innerHTML = "<strong>Sandbox: checkout is off</strong><p>This is the local test copy. Add a Stripe test-mode link in config.js (stripeTestPackLink / stripeTestSeatLink) to test checkout. No live charge was started.</p>";
      return;
    }
    if (missed) {
      card.innerHTML = "<strong>Checkout did not stick to this phone</strong><p>Start again from the buy button on this same phone. A shared return link does not open the trainer by itself.</p><p><a href=\"?buy=seat\">Buy 1 seat · $49</a> · <a href=\"?buy=pack\">Buy shop pack · $149</a></p>";
      return;
    }
    card.innerHTML = "<strong>Two different buys</strong><p>$49 unlocks this phone only. $149 unlocks this phone and gives you a link for four more.</p><p><a href=\"?buy=seat\">Buy 1 seat · $49</a> · <a href=\"?buy=pack\">Buy shop pack · $149</a></p>";
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("#btn-stripe-pay")) remember("pack");
    var a = t.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/buy=pack/i.test(href) || /3cI6oI3ML8WU2ZjdzP9ws03/.test(href)) remember("pack");
    if (/buy=seat/i.test(href) || /eVq8wQ1EDc9643nanD9ws04/.test(href)) remember("seat");
  }, true);

  function arm() {
    applyReturn();
    paint();
    payCard();
    var n = 0;
    var timer = setInterval(function () {
      paint();
      payCard();
      if (++n > 24) clearInterval(timer);
    }, 400);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else setTimeout(arm, 0);
})();
