/* Hide owner codes. Free teaser with a real photo sample. */
(function () {
  var HOME = "ba0536d462bb84661ab622471863e9137b2e0fad23d9b6367d40e39399bc1108";
  var CREW = "ca397ba52c6efbd986f5cbd43f173cd3fd88a97e54cd4ae1fb723e6454479916";
  var TEASER_SCREENS = {
    rules: 1, home: 1, pricing: 1, contact: 1, coach: 1,
    photos: 1, photo: 1, videos: 1,
    lesson: 1, vehicle: 1, library: 1,
    practice: 1, "practice-hub": 1, module: 1, drills: 1,
    "drill-spot": 1, "drill-checklist": 1
  };
  var TEASER_PHOTO_MAX = 14;
  var TEASER_VIDEO_MAX = 2;
  var CODE_RE = /WRAP911[- ]?(HOME|CREW|DEMO|PRO)|W911-(PACK|SEAT|FIELD)|enter `WRAP911|Codes \(shop/gi;

  var cfg = window.WRAP911_CONFIG || {};
  cfg.demoCodes = {};

  function shopOpen() {
    return !!(cfg && cfg.shopPhoneOpen);
  }

  function paid() {
    if (shopOpen()) return true;
    try {
      if (localStorage.getItem("wrap911_owner") === "1") return true;
      var raw = localStorage.getItem("wrap911_license");
      if (!raw) return false;
      var lic = JSON.parse(raw);
      if (!lic || lic.expired) return false;
      if (lic.expiresAt && Date.now() > Number(lic.expiresAt)) return false;
      if (lic.plan === "free" || lic.plan === "pro" || lic.plan === "trial" || lic.plan === "pack" || lic.plan === "seat") return true;
      if (lic.sku === "pack" || lic.sku === "seat") return true;
      if (lic.code === "SHOP" || lic.code === "STRIPE") return true;
    } catch (e) {}
    return false;
  }

  function hex(buf) {
    var v = new Uint8Array(buf), s = "", i;
    for (i = 0; i < v.length; i++) s += ("0" + v[i].toString(16)).slice(-2);
    return s;
  }
  function digest(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text || "").trim().toUpperCase())).then(hex);
  }

  function applyOwner() {
    try {
      localStorage.setItem("wrap911_owner", "1");
      var now = Date.now();
      localStorage.setItem("wrap911_license", JSON.stringify({
        code: "SHOP", plan: "pro", sku: "pack", seats: 5,
        crewCode: "SHOPCS", unlockedAt: now, expiresAt: now + 365 * 86400000
      }));
    } catch (e) {}
    var fb = document.getElementById("unlock-feedback");
    if (fb) {
      fb.className = "quiz-feedback ok";
      fb.textContent = "Shop license accepted. Full trainer is open.";
    }
    goHome();
  }

  function goHome() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (core && core.renderHome) {
      try { core.renderHome(); } catch (e2) {}
      try { core.showScreen("home"); } catch (e3) {}
    }
  }

  function goPay() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (core && core.showScreen) core.showScreen("pricing");
  }

  var mediaReady = false;
  function afterMedia() {
    if (mediaReady) return;
    mediaReady = true;
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (core && core.renderPhotosList) {
      try { core.renderPhotosList(); } catch (e) {}
    }
    setTimeout(limitPhotos, 50);
  }

  function loadBoost() {
    if (window.WRAP911_BOOST) { afterMedia(); return; }
    var s = document.createElement("script");
    s.src = "js/photos-boost.js?v=293";
    s.onload = afterMedia;
    s.onerror = afterMedia;
    document.head.appendChild(s);
  }

  function loadPack() {
    if (window.WRAP911_PACK) { loadBoost(); return; }
    var s = document.createElement("script");
    s.src = "js/photos-pack.js?v=306";
    s.onload = loadBoost;
    s.onerror = loadBoost;
    document.head.appendChild(s);
  }

  function wipePayCopy() {
    var locked = "That section is locked. Shop pack $149 or seat $49. Buy on this phone.";
    var none = "No license. Shop pack $149 (5 phones, 12 months) or seat $49 (this phone). Buy on this same phone.";
    var el = document.getElementById("license-status-text");
    if (el && /forever|WRAP911-HOME|No license|\\?license=STRIPE/i.test(el.textContent || "")) el.textContent = none;
    var fb = document.getElementById("unlock-feedback");
    if (fb && /forever|WRAP911-HOME|That section is locked/i.test(fb.textContent || "")) fb.textContent = locked;
    var detail = document.getElementById("home-plan-detail");
    if (detail && /forever|WRAP911-HOME/i.test(detail.textContent || "")) detail.textContent = "Training is locked. Shop pack $149 or seat $49.";
    var nodes = document.querySelectorAll(".plan-status-detail, #unlock-feedback, #license-status-text, #home-plan-detail");
    for (var i = 0; i < nodes.length; i++) {
      var txt = nodes[i].textContent || "";
      if (/free forever/i.test(txt)) nodes[i].textContent = txt.replace(/[^.]*free forever[^.]*\.?/gi, " Paid pack or seat.").trim();
    }
  }

  function hideCodeBlocks() {
    var nodes = document.querySelectorAll("h3, h2, p, li, .lead, .example-banner, .plan-status-detail");
    for (var i = 0; i < nodes.length; i++) {
      var t = nodes[i].textContent || "";
      if (/Codes \(shop|WRAP911-HOME|WRAP911-DEMO|WRAP911-PRO|WRAP911-CREW|enter `WRAP911/i.test(t)) {
        var block = nodes[i].closest("ul, ol, .card, .license-card") || nodes[i];
        if (/Codes \(shop/i.test(t) && nodes[i].nextElementSibling) {
          var sib = nodes[i].nextElementSibling;
          if (sib.tagName === "UL" || sib.tagName === "OL") sib.remove();
        }
        if (nodes[i].tagName === "H3" || nodes[i].tagName === "H2") nodes[i].remove();
        else nodes[i].textContent = t.replace(CODE_RE, "license").replace(/shop license \u2014[^.]+/gi, "Buyers use checkout.");
      }
    }
  }

  function scrub(root) {
    if (!root) return;
    hideCodeBlocks();
    wipePayCopy();
    var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, t;
    while ((n = walk.nextNode())) {
      t = n.nodeValue;
      if (!t) continue;
      if (CODE_RE.test(t) || /free forever/i.test(t) || /That section is locked/i.test(t) || /No license/i.test(t)) {
        CODE_RE.lastIndex = 0;
        n.nodeValue = t
          .replace(/WRAP911-HOME \(free forever\)/gi, "buy on this phone")
          .replace(/free forever[^.\n]*/gi, "paid pack or seat")
          .replace(/WRAP911-HOME/gi, "shop pack")
          .replace(/WRAP911-CREW/gi, "shop pack")
          .replace(/WRAP911-DEMO/gi, "trial")
          .replace(/WRAP911-PRO/gi, "pro")
          .replace(/enter `WRAP911[^`]*`/gi, "buy on this phone")
          .replace(/Codes \(shop \+ test\)/gi, "Unlock")
          .replace(/That section is locked\. WRAP 911 shop:[^.]*\. Other shops:[^.]*\.?/gi, "That section is locked. Shop pack $149 or seat $49.")
          .replace(/No license — training is locked\. WRAP 911 shop:[^.]*\. Other shops:[^.]*\.?/gi, "No license. Shop pack $149 or seat $49. Buy on this phone.");
      }
    }
    var inp = document.getElementById("unlock-code");
    if (inp) {
      inp.placeholder = "Unlock code";
      inp.removeAttribute("value");
      if (/WRAP911|W911-/i.test(inp.value || "")) inp.value = "";
    }
  }

  async function tryUnlock(raw) {
    var code = String(raw || "").trim();
    if (!code) return false;
    if (/^STRIPE/i.test(code) || /^\?license=/i.test(code) || /^CREW-/i.test(code)) {
      var fb = document.getElementById("unlock-feedback");
      if (fb) {
        fb.className = "quiz-feedback bad";
        fb.textContent = "That is not a typed code. Use Buy 1 seat or Buy shop pack on this phone.";
      }
      return false;
    }
    var h = await digest(code);
    if (h === HOME || h === CREW) { applyOwner(); return true; }
    var fb = document.getElementById("unlock-feedback");
    if (fb) {
      fb.className = "quiz-feedback bad";
      fb.textContent = "License not recognized. Buyers use checkout.";
    }
    return false;
  }

  function limitPhotos() {
    var list = document.getElementById("photo-list");
    if (!list) return;
    var cards = list.querySelectorAll(".thumb-card");
    if (paid()) {
      for (var a = 0; a < cards.length; a++) cards[a].style.display = "";
      return;
    }
    var kept = 0;
    for (var i = 0; i < cards.length; i++) {
      if (kept < TEASER_PHOTO_MAX) {
        cards[i].style.display = "";
        kept++;
      } else {
        cards[i].style.display = "none";
      }
    }
    if (!list.querySelector(".teaser-paywall")) {
      var pay = document.createElement("div");
      pay.className = "card tap teaser-paywall";
      pay.innerHTML = '<div class="photo-caption">More bay photos in the pack</div><div class="photo-meta">$149 pack · $49 seat · Tap to unlock</div>';
      pay.addEventListener("click", goPay);
      list.appendChild(pay);
    }
  }

  function limitVideos() {
    if (paid()) return;
    var list = document.getElementById("video-list");
    if (!list) return;
    var cards = list.children;
    var shown = 0;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].classList && cards[i].classList.contains("teaser-paywall")) continue;
      shown++;
      if (shown > TEASER_VIDEO_MAX) cards[i].style.display = "none";
    }
    if (!list.querySelector(".teaser-paywall")) {
      var pay = document.createElement("div");
      pay.className = "card tap teaser-paywall";
      pay.innerHTML = '<div class="card-title">Rest of the bay videos</div><div class="card-sub">Pack $149 · Seat $49 · Tap to unlock</div>';
      pay.addEventListener("click", goPay);
      list.appendChild(pay);
    }
  }

  function activateScreen(name) {
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle("active", screens[i].id === "screen-" + name);
    }
    var nav = document.getElementById("bottom-nav");
    if (nav) {
      nav.classList.toggle("hidden", name === "rules");
      var buttons = nav.querySelectorAll("button");
      for (var j = 0; j < buttons.length; j++) {
        var target = buttons[j].getAttribute("data-nav");
        buttons[j].classList.toggle("active", target === name || (name === "photo" && target === "photos"));
      }
    }
  }

  function wrapCore() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core || core._teaserWrapped) return;
    core._teaserWrapped = true;
    var orig = core.showScreen;
    if (shopOpen()) {
      core.hasFullAccess = function () { return true; };
    }
    if (typeof orig === "function") {
      core.showScreen = function (name) {
        var wanted = name;
        if (!paid() && name && !TEASER_SCREENS[name]) name = "pricing";
        var r;
        try { r = orig.call(this, name); } catch (e) {}
        if (paid() && wanted && wanted !== "pricing") {
          var active = document.querySelector(".screen.active");
          if (!active || active.id !== "screen-" + wanted) activateScreen(wanted);
        } else if (!paid() && TEASER_SCREENS[name]) {
          var active2 = document.querySelector(".screen.active");
          if (!active2 || active2.id !== "screen-" + name) {
            if (name === "photos" && typeof core.renderPhotosList === "function") {
              try { core.renderPhotosList(); } catch (e2) {}
            }
            activateScreen(name);
          }
        }
        setTimeout(function () { scrub(document.body); limitPhotos(); limitVideos(); }, 0);
        return r;
      };
    }
    var rp = core.renderPhotosList;
    if (typeof rp === "function") {
      core.renderPhotosList = function () {
        var r = rp.apply(this, arguments);
        setTimeout(limitPhotos, 0);
        return r;
      };
    }
  }

  function homePitch() {
    var home = document.getElementById("screen-home");
    if (!home || paid() || home.querySelector(".teaser-pitch")) return;
    var lead = home.querySelector(".lead");
    var p = document.createElement("p");
    p.className = "lead teaser-pitch";
    p.textContent = "Free look: shop rules, Coach, 14 photos, plus the trailer rivets clip and the van gate clip. Pack $149 unlocks the other movies.";
    if (lead && lead.parentNode) lead.parentNode.insertBefore(p, lead.nextSibling);
  }

  function bind() {
    loadPack();
    scrub(document.body);
    wrapCore();
    homePitch();
    limitPhotos();
    limitVideos();
    var btn = document.getElementById("btn-unlock");
    var inp = document.getElementById("unlock-code");
    if (btn && !btn.getAttribute("data-gate")) {
      btn.setAttribute("data-gate", "1");
      btn.addEventListener("click", function (e) {
        e.stopImmediatePropagation();
        tryUnlock(inp && inp.value);
      }, true);
    }
    if (inp && !inp.getAttribute("data-gate")) {
      inp.setAttribute("data-gate", "1");
      inp.placeholder = "Unlock code";
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopImmediatePropagation();
          tryUnlock(inp.value);
        }
      }, true);
    }
  }

  function showVideos() {
    setTimeout(function () {
      var screen = document.getElementById("screen-videos");
      if (!screen) return;
      activateScreen("videos");
      if (window.WRAP911_APP && window.WRAP911_APP.renderVideos) {
        try { window.WRAP911_APP.renderVideos(); } catch (e) {}
      }
      limitVideos();
    }, 0);
  }
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest("#goto-videos, #goto-videos-primary");
    if (!t) return;
    showVideos();
  }, true);

  function ownerFromUrl() {
    try {
      var q = new URLSearchParams(window.location.search);
      if (q.get("owner") === "1" || q.get("shop") === "1") {
        applyOwner();
        q.delete("owner"); q.delete("shop");
        var qs = q.toString();
        history.replaceState({}, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
      }
    } catch (e) {}
  }

  function boot() {
    if (shopOpen()) applyOwner();
    ownerFromUrl();
    bind();
    setTimeout(function () {
      scrub(document.body);
      wipePayCopy();
      limitPhotos();
      limitVideos();
    }, 300);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 1200);
})();
