/* Seat $49 is one phone. Shop pack $149 is five phones and a crew link. */
(function () {
  var KEY = "wrap911_license";
  var PENDING = "wrap911_pending_plan";
  var SEAT_URL = "https://buy.stripe.com/eVq8wQ1EDc9643nanD9ws04";
  var PACK_URL = "https://buy.stripe.com/3cI6oI3ML8WU2ZjdzP9ws03";
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
      expiresAt: now + YEAR,
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

  var params;
  try { params = new URLSearchParams(window.location.search); } catch (e) { params = new URLSearchParams(); }
  var buy = (params.get("buy") || "").toLowerCase();
  if (buy === "seat" || buy === "pack") {
    remember(buy);
    window.location.replace(buy === "pack" ? PACK_URL : SEAT_URL);
    return;
  }

  var token = (params.get("license") || "").trim().toUpperCase();
  var plan = pending();
  var missed = false;
  if (token === "STRIPE-SEAT" || token === "STRIPE-PACK") {
    write(token === "STRIPE-PACK" ? "pack" : "seat", "");
    clearPending();
    strip("license");
  } else if (token === "STRIPE" || token.indexOf("STRIPE-") === 0) {
    if (plan === "seat" || plan === "pack") {
      write(plan, "");
      clearPending();
    } else {
      missed = true;
    }
    strip("license");
  } else if (crewOk(token)) {
    write("pack", token.slice(5));
    strip("license");
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

  function paint() {
    var lic = read();
    if (!lic || lic.expired || (lic.sku !== "seat" && lic.sku !== "pack")) return;
    var badge = lic.sku === "pack" ? "PACK" : "SEAT";
    var left = daysLeft(lic);
    var detail = lic.sku === "pack"
      ? "Shop pack · 5 phones · " + left
      : "1 seat · this phone · " + left;
    var chip = document.getElementById("plan-chip");
    if (chip && chip.textContent !== badge) chip.textContent = badge;
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
    } else {
      card.innerHTML = "<strong>1 seat</strong><p>This phone is unlocked for 12 months. It does not cover a second phone. A shop pack is $149 for five.</p>";
    }
    return;
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
    if (missed) {
      card.innerHTML = "<strong>Checkout did not stick to this phone</strong><p>Start again from the buy button on this same phone. A shared return link does not open the trainer by itself.</p><p><a href=\"?buy=seat\">Buy 1 seat · $49</a> · <a href=\"?buy=pack\">Buy shop pack · $149</a></p>";
      return;
    }
    var lic = read();
    if (lic && !lic.expired && (lic.sku === "seat" || lic.sku === "pack")) return;
    card.innerHTML = "<strong>Two different buys</strong><p>$49 unlocks this phone only. $149 unlocks this phone and gives you a link for four more.</p><p><a href=\"?buy=seat\">Buy 1 seat · $49</a> · <a href=\"?buy=pack\">Buy shop pack · $149</a></p>";
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("#btn-stripe-pay")) remember("pack");
  }, true);

  function arm() {
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
  else arm();
})();
