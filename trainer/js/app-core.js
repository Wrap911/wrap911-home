/* WRAP 911 Trainer — app logic (offline SPA) + interactive drills */
(function () {
  "use strict";

  var RULES_KEY = "wrap911_rules_accepted";
  var PROGRESS_KEY = "wrap911_progress";
  var LICENSE_KEY = "wrap911_license";

  var cfg = window.WRAP911_CONFIG || {};
  var data = window.WRAP911_DATA || { modules: [], photoLessons: [], drills: {} };
  var drills = data.drills || {};

  var state = {
    view: "rules",
    moduleId: null,
    photoId: null,
    quizIndex: 0,
    quizLocked: false,
    moduleMode: "quiz",
    spotIndex: 0,
    spotLocked: false,
    checklistId: null,
    checklistNext: 0,
    scenarioId: null,
    scenarioLocked: false,
    flashIndex: 0,
    flashFlipped: false,
    flashTouchX: null,
    vehicleId: null,
    lessonId: null,
    lessonQuizIndex: 0,
    lessonQuizLocked: false,
    lessonQuizCorrect: 0,
    practiceId: null,
    practiceChecks: {},
    practiceMistakePicks: {},
    practiceQuizIndex: 0,
    practiceQuizLocked: false,
    practiceQuizCorrect: 0,
    jobId: null,
    vehicleTab: "lessons"
  };

  var JOBS_KEY = "wrap911_jobs";

  /* expose helpers for app_extra.js */
  window.WRAP911_APP = window.WRAP911_APP || {};

  function $(id) { return document.getElementById(id); }

  function defaultProgress() {
    return {
      modules: {},
      photos: {},
      lessons: {},
      badges: {},
      workflows: {},
      practice: {},
      drills: {
        spotMistake: {},
        checklist: {},
        scenarios: {},
        flashcards: {},
        xp: 0,
        streak: 0,
        lastDay: ""
      }
    };
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      var p = raw ? JSON.parse(raw) : defaultProgress();
      if (!p.modules) p.modules = {};
      if (!p.photos) p.photos = {};
      if (!p.lessons) p.lessons = {};
      if (!p.badges) p.badges = {};
      if (!p.workflows) p.workflows = {};
      if (!p.practice) p.practice = {};
      if (!p.drills) p.drills = defaultProgress().drills;
      if (!p.drills.spotMistake) p.drills.spotMistake = {};
      if (!p.drills.checklist) p.drills.checklist = {};
      if (!p.drills.scenarios) p.drills.scenarios = {};
      if (!p.drills.flashcards) p.drills.flashcards = {};
      if (typeof p.drills.xp !== "number") p.drills.xp = 0;
      if (typeof p.drills.streak !== "number") p.drills.streak = 0;
      if (typeof p.drills.lastDay !== "string") p.drills.lastDay = "";
      return p;
    } catch (e) {
      return defaultProgress();
    }
  }

  function saveProgress(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function bumpStreak(p) {
    var today = todayKey();
    if (p.drills.lastDay === today) return;
    var y = new Date();
    y.setDate(y.getDate() - 1);
    var yKey = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
    if (p.drills.lastDay === yKey) p.drills.streak = (p.drills.streak || 0) + 1;
    else p.drills.streak = 1;
    p.drills.lastDay = today;
  }

  function awardDrillXp(kind, id, amount) {
    var p = loadProgress();
    var bucket = p.drills[kind];
    if (!bucket) {
      p.drills[kind] = {};
      bucket = p.drills[kind];
    }
    var already = bucket[id] && bucket[id].passed;
    if (!already) {
      bucket[id] = { passed: true, at: Date.now() };
      p.drills.xp = (p.drills.xp || 0) + (amount || drills.xpPerDrill || 25);
      bumpStreak(p);
      saveProgress(p);
      updateXpChip();
      showXpModal(amount || drills.xpPerDrill || 25, kind);
      return true;
    }
    bumpStreak(p);
    saveProgress(p);
    updateXpChip();
    return false;
  }

  function updateXpChip() {
    var p = loadProgress();
    var chip = $("xp-chip");
    if (chip) chip.textContent = (p.drills.xp || 0) + " XP";
  }

  function showXpModal(xp, kind) {
    var modal = $("xp-modal");
    if (!modal) return;
    var labels = {
      spotMistake: "Spot the mistake cleared!",
      checklist: "Checklist drill complete!",
      scenarios: "Scenario nailed!",
      flashcards: "Flashcard set done!"
    };
    $("xp-modal-title").textContent = labels[kind] || "Drill complete!";
    $("xp-modal-msg").textContent = "+" + xp + " XP";
    $("xp-modal-emoji").textContent = "🎉";
    modal.classList.remove("hidden");
  }

  function hideXpModal() {
    var modal = $("xp-modal");
    if (modal) modal.classList.add("hidden");
  }

  function countDrillPasses(p) {
    var n = 0;
    var kinds = ["spotMistake", "checklist", "scenarios"];
    for (var k = 0; k < kinds.length; k++) {
      var bag = p.drills[kinds[k]] || {};
      for (var id in bag) {
        if (bag[id] && bag[id].passed) n++;
      }
    }
    return n;
  }

  function rulesAccepted() {
    return localStorage.getItem(RULES_KEY) === "1";
  }

  function acceptRules() {
    localStorage.setItem(RULES_KEY, "1");
  }

  function defaultLicense() {
    return null;
  }

  function loadLicense() {
    try {
      var raw = localStorage.getItem(LICENSE_KEY);
      if (!raw) return defaultLicense();
      var lic = JSON.parse(raw);
      if (!lic || !lic.code || !lic.plan) return defaultLicense();
      if (lic.expiresAt && Date.now() > lic.expiresAt) {
        lic.expired = true;
      }
      return lic;
    } catch (e) {
      return defaultLicense();
    }
  }

  /* Paid pack/seat or unexpired trial/pro — including Stripe Payment Link. */
  function hasFullAccess() {
    var lic = loadLicense();
    if (!lic || lic.expired) return false;
    if (lic.plan === "free") return true;
    if (lic.plan === "pro" || lic.plan === "trial") return true;
    return false;
  }

  var OPEN_SCREENS = { rules: true, home: true, pricing: true, contact: true, coach: true, about: true };
  /* Hotfix 2.6.1: free screens come from cfg.freeScreens (same list license-gate.js reads). */
  (function () {
    var fs = cfg && cfg.freeScreens;
    if (fs && fs.length) {
      OPEN_SCREENS = {};
      for (var i = 0; i < fs.length; i++) OPEN_SCREENS[fs[i]] = true;
    }
  })();
  function isOpenScreen(name) { return !!OPEN_SCREENS[name]; }
  function paidNow() {
    var ok = hasFullAccess();
    try { if (!ok && window.WRAP911_GATE && window.WRAP911_GATE.paid) ok = !!window.WRAP911_GATE.paid(); } catch (e) {}
    return ok;
  }
  /* Hotfix 2.6.1: free photo set = first cfg.freePhotoSamples photos of the full list, whatever filter chip is on. */
  function freePhotoIds() {
    if (paidNow()) return null;
    var n = cfg.freePhotoSamples || 14;
    var ids = {};
    var all = (data && data.photoLessons) || [];
    for (var i = 0; i < all.length && i < n; i++) ids[all[i].id] = true;
    return ids;
  }

  function applyStripeLicense(days) {
    var n = days && days > 0 ? days : (cfg.proPeriodDays || 365);
    var unlockedAt = Date.now();
    var lic = {
      code: "STRIPE",
      plan: "pro",
      unlockedAt: unlockedAt,
      expiresAt: unlockedAt + n * 86400000,
      source: "stripe-payment-link"
    };
    saveLicense(lic);
    return lic;
  }

  function applyUrlLicenseToken() {
    var token = "";
    try {
      token = new URLSearchParams(window.location.search).get("license") || "";
    } catch (e) {
      token = "";
    }
    if (!token) return false;
    var ok = unlockWithCode(token, { fromUrl: true });
    try {
      var url = new URL(window.location.href);
      url.searchParams.delete("license");
      var q = url.searchParams.toString();
      history.replaceState({}, "", url.pathname + (q ? "?" + q : "") + url.hash);
    } catch (e2) {}
    return ok;
  }

  function saveLicense(lic) {
    if (!lic) {
      localStorage.removeItem(LICENSE_KEY);
      return;
    }
    localStorage.setItem(LICENSE_KEY, JSON.stringify(lic));
  }

  function demoCodesMap() {
    return (cfg.demoCodes) || {};
  }

  function normalizeCode(raw) {
    return String(raw || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function planMeta(lic) {
    if (!lic || lic.expired) {
      return {
        plan: "locked",
        badge: "FREE",
        chipClass: "",
        detail: "Free look is open. Pack $149 or seat $49 unlocks the rest on this phone."
      };
    }
    if (lic.plan === "free") {
      return {
        plan: "free",
        badge: "HOME",
        chipClass: "",
        detail: "WRAP 911 shop. Full trainer, no expiry."
      };
    }
    if (lic.plan === "trial") {
      var left = "";
      if (lic.expiresAt) {
        var days = Math.max(0, Math.ceil((lic.expiresAt - Date.now()) / 86400000));
        left = " · ~" + days + " day(s) left";
      }
      return {
        plan: "trial",
        badge: "TRIAL",
        chipClass: "trial",
        detail: "Trial seat" + left + ". Then pack-first: W911-PACK $149 (or SEAT / FIELD)."
      };
    }
    if (lic.plan === "pro") {
      var proLeft = "";
      if (lic.expiresAt) {
        var d2 = Math.max(0, Math.ceil((lic.expiresAt - Date.now()) / 86400000));
        proLeft = " · ~" + d2 + " day(s) left this period";
      }
      var src = lic.code === "STRIPE" ? "Stripe Pro" : "Pro";
      return {
        plan: "pro",
        badge: "PRO",
        chipClass: "pro",
        detail: src + " — pack-first pricing (PACK $149 default)" + proLeft + "."
      };
    }
    return {
      plan: lic.plan,
      badge: String(lic.plan).toUpperCase(),
      chipClass: "",
      detail: "Code " + lic.code + " active."
    };
  }

  function updatePlanChip() {
    var meta = planMeta(loadLicense());
    var chip = $("plan-chip");
    if (chip) {
      chip.textContent = meta.badge;
      chip.className = "plan-chip" + (meta.chipClass ? " " + meta.chipClass : "");
    }
    var homeBadge = $("home-plan-badge");
    if (homeBadge) {
      homeBadge.textContent = meta.badge;
      homeBadge.className = "plan-badge" + (meta.chipClass ? " " + meta.chipClass : "");
    }
    var homeDetail = $("home-plan-detail");
    if (homeDetail) homeDetail.textContent = meta.detail;
  }

  function unlockWithCode(rawCode, opts) {
    opts = opts || {};
    var code = normalizeCode(rawCode);
    var map = demoCodesMap();
    var def = map[code];
    var fb = $("unlock-feedback");
    if (!code) {
      if (fb) {
        fb.className = "quiz-feedback bad";
        fb.textContent = "Buy on this phone. Pack $149 or seat $49.";
      }
      return false;
    }
    var lic;
    var unlockedAt = Date.now();
    var stripeDays = cfg.proPeriodDays || 365;
    var stripeMatch = code.match(/^STRIPE(?:-(\d+))?$/);
    if (stripeMatch) {
      if (stripeMatch[1]) stripeDays = parseInt(stripeMatch[1], 10) || stripeDays;
      lic = applyStripeLicense(stripeDays);
    } else if (def) {
      lic = {
        code: code,
        plan: def.plan,
        unlockedAt: unlockedAt
      };
      if (def.days) lic.expiresAt = unlockedAt + def.days * 86400000;
      saveLicense(lic);
    } else {
      if (fb) {
        fb.className = "quiz-feedback bad";
        fb.textContent = "License not recognized. Use Buy 1 seat or Buy shop pack on this phone.";
      }
      return false;
    }
    if (fb) {
      fb.className = "quiz-feedback ok";
      fb.textContent = lic.code === "STRIPE"
        ? "Stripe Pro unlocked for " + Math.round((lic.expiresAt - lic.unlockedAt) / 86400000) + " days. Full trainer is open."
        : "Unlocked: " + ((def && def.label) || lic.plan) + ". Full trainer is open.";
    }
    updatePlanChip();
    renderPricingStatus();
    if (hasFullAccess() && window.WRAP911_APP && window.WRAP911_APP.applyUrlLesson && window.WRAP911_APP.applyUrlLesson()) {
      return true;
    }
    if (!opts.fromUrl && hasFullAccess()) {
      renderHome();
      showScreen("home");
    }
    return true;
  }

  function clearLicense() {
    saveLicense(null);
    var fb = $("unlock-feedback");
    if (fb) {
      fb.className = "quiz-feedback ok";
      fb.textContent = "License cleared. Training is locked until HOME or a Pro/pack license.";
    }
    var input = $("unlock-code");
    if (input) input.value = "";
    updatePlanChip();
    renderPricingStatus();
  }

  function statusLabel(status) {
    if (status === "available") return "Available";
    if (status === "coming-soon") return "Coming soon";
    if (status === "later") return "Later";
    if (status === "building") return "Building";
    if (status === "locked-price") return "Locked price";
    if (status === "test") return "TEST";
    return status || "";
  }

  function renderPricingPlans() {
    var wrap = $("pricing-plans");
    if (!wrap) return;
    var plans = cfg.plans || [];
    var html = "";
    for (var i = 0; i < plans.length; i++) {
      var p = plans[i];
      var st = p.status || "";
      html +=
        '<div class="price-card ' + escapeHtml(st) + '">' +
        '<div class="price-card-top">' +
        "<h3>" + escapeHtml(p.name || "") + "</h3>" +
        '<span class="price-status ' + escapeHtml(st) + '">' + escapeHtml(statusLabel(st)) + "</span>" +
        "</div>" +
        '<div class="price-example"><span class="ex-tag">' + (p.status === "test" ? "TEST" : (p.status === "locked-price" ? "PRICE" : (p.id === "free-shop" ? "HOME" : "PLAN"))) + "</span> " + escapeHtml(p.priceExample || "") + "</div>" +
        "<p>" + escapeHtml(p.blurb || "") + "</p>" +
        "</div>";
    }
    wrap.innerHTML = html;
  }

  function renderPricingStatus() {
    var lic = loadLicense();
    var meta = planMeta(lic);
    var el = $("license-status-text");
    var clearBtn = $("btn-clear-license");
    if (el) {
      if (!lic) {
        el.textContent = "No license — training is locked. Shop pack $149 (5 phones, 12 months) or seat $49 (this phone, 12 months). Buy on this same phone.";
      } else if (lic.expired) {
        el.textContent = "License expired (" + lic.code + "). Buy again on this phone.";
      } else {
        var extra = "";
        if (lic.expiresAt) {
          extra = " Expires: " + new Date(lic.expiresAt).toLocaleDateString() + ".";
        }
        el.textContent = "Active: " + (lic.sku === "pack" ? "Shop pack" : lic.sku === "seat" ? "Seat" : lic.code) + "." + extra + " " + meta.detail;
      }
    }
    if (clearBtn) {
      if (lic) clearBtn.classList.remove("hidden");
      else clearBtn.classList.add("hidden");
    }
  }

  function renderPricing() {
    renderPricingPlans();
    renderPricingStatus();
    updatePlanChip();
    var modeBanner = $("pricing-mode-banner");
    if (modeBanner) {
      if (cfg.stripeTestMode) {
        modeBanner.innerHTML = "<strong>SANDBOX / TEST MODE</strong> — live checkout is off here. Pack $149 (5 seats, 12 months) · Seat $49 (1 tech, 12 months) · Field $29/mo.";
      } else {
        modeBanner.innerHTML = "<strong>Checkout</strong> — Pack $149 (5 seats, 12 months) · Seat $49 (1 tech, 12 months)" + (cfg.fieldSkuLive ? " · Field $29/mo" : "") + ". One-time for Pack and Seat.";
      }
    }
    var input = $("unlock-code");
    var lic = loadLicense();
    if (input && lic && lic.code && !lic.expired && !input.value) input.value = lic.code;
    var stripeWrap = $("stripe-link-wrap");
    var stripeBtn = $("btn-stripe-pay");
    var link = (cfg.stripeTestMode ? (cfg.stripeTestPackLink || "") : (cfg.stripePaymentLink || "")).trim();
    if (stripeWrap) {
      stripeWrap.classList.toggle("hidden", !link);
    }
    if (stripeBtn) {
      var test = cfg.stripeTestMode === true;
      stripeBtn.textContent = test ? "Open configured payment link (TEST)" : "Open configured payment link";
      stripeBtn.onclick = function () {
        if (link) window.location.href = link;
      };
    }
    var note = $("stripe-link-note");
    if (note && link) {
      note.textContent = (cfg.stripeTestMode ? "TEST checkout — sandbox cards only, no live charges. " : "") +
        "After Stripe, you land back here and this phone unlocks for 12 months (365 days).";
    }
  }


  var DRILL_VIEWS = {
    "drill-spot": "home",
    "drill-checklist": "home",
    "drill-checklist-pick": "home",
    "drill-scenarios": "home",
    "drill-scenario": "home",
    "drill-flash": "home",
    module: "home",
    photo: "photos",
    vehicle: "home",
    lesson: "home",
    library: "home",
    videos: "home",
    calc: "home",
    pricing: "home",
    contact: "home",
    drills: "home",
    "practice-hub": "practice-hub",
    practice: "practice-hub",
    jobs: "jobs",
    "job-edit": "jobs",
    badges: "badges",
    coach: "coach"
  };

  function showScreen(name) {
    if (!isOpenScreen(name) && !hasFullAccess()) {
      var fb = $("unlock-feedback");
      if (fb) {
        fb.className = "quiz-feedback bad";
        fb.textContent = "That part is paid. Shop pack $149 or seat $49. Buy on this phone.";
      }
      name = "pricing";
      renderPricingPlans();
      renderPricingStatus();
      updatePlanChip();
    }
    /* Hotfix 2.6.1: photo list depends on plan (free = 14), so rebuild it whenever Photos opens. */
    if (name === "photos") { try { renderPhotosList(); } catch (eR) {} }
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle("active", screens[i].id === "screen-" + name);
    }
    state.view = name;
    var nav = $("bottom-nav");
    if (nav) {
      nav.classList.toggle("hidden", name === "rules");
      var activeNav = DRILL_VIEWS[name] || name;
      var buttons = nav.querySelectorAll("button");
      for (var j = 0; j < buttons.length; j++) {
        var target = buttons[j].getAttribute("data-nav");
        buttons[j].classList.toggle("active", target === activeNav);
      }
    }
    /* Hotfix 2.6.1: re-apply the free caps (14 photos + pack card, 8 videos + paywall) after any screen change. */
    try { if (window.WRAP911_GATE && window.WRAP911_GATE.afterScreen) window.WRAP911_GATE.afterScreen(name); } catch (eG) {}
    window.scrollTo(0, 0);
  }

  function progressStats() {
    var p = loadProgress();
    var modDone = 0;
    var modTotal = data.modules.length;
    for (var i = 0; i < data.modules.length; i++) {
      var m = data.modules[i];
      if (p.modules[m.id] && p.modules[m.id].passed) modDone++;
    }
    var photoDone = 0;
    var photoTotal = data.photoLessons.length;
    for (var j = 0; j < data.photoLessons.length; j++) {
      var pl = data.photoLessons[j];
      if (p.photos[pl.id] && p.photos[pl.id].passed) photoDone++;
    }
    return { modDone: modDone, modTotal: modTotal, photoDone: photoDone, photoTotal: photoTotal };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findModule(id) {
    for (var i = 0; i < data.modules.length; i++) {
      if (data.modules[i].id === id) return data.modules[i];
    }
    return null;
  }

  function findPhoto(id) {
    for (var i = 0; i < data.photoLessons.length; i++) {
      if (data.photoLessons[i].id === id) return data.photoLessons[i];
    }
    return null;
  }

  function renderHome() {
    updateXpChip();
    updatePlanChip();
    var stats = progressStats();
    var p = loadProgress();
    var pct = Math.round(((stats.modDone + stats.photoDone) / (stats.modTotal + stats.photoTotal)) * 100) || 0;
    var detail = "Modules " + stats.modDone + "/" + stats.modTotal +
      " · Photos " + stats.photoDone + "/" + stats.photoTotal;
    var isPaid = paidNow();
    if (!isPaid) {
      /* Hotfix 2.6.1: free phones see the photos they can open, not the full pack count. */
      var freeTotal = Math.min(cfg.freePhotoSamples || 14, stats.photoTotal) || 0;
      var freeDone = Math.min(stats.photoDone, freeTotal);
      pct = freeTotal ? Math.round((freeDone / freeTotal) * 100) : 0;
      detail = "Free photos " + freeDone + "/" + freeTotal + " · Modules unlock with a seat or the pack";
    }
    $("home-progress-fill").style.width = pct + "%";
    $("home-progress-label").textContent = pct + "% " + (isPaid ? "overall" : "of free look");
    $("home-progress-detail").textContent = detail;

    $("home-xp").textContent = String(p.drills.xp || 0);
    $("home-streak").textContent = String(p.drills.streak || 0);
    $("home-drills-done").textContent = String(countDrillPasses(p));

    if (window.WRAP911_APP && window.WRAP911_APP.renderHomeNav) {
      window.WRAP911_APP.renderHomeNav();
    }

    var list = $("module-list");
    list.innerHTML = "";
    for (var i = 0; i < data.modules.length; i++) {
      var m = data.modules[i];
      var done = p.modules[m.id] && p.modules[m.id].passed;
      var card = document.createElement("div");
      card.className = "card tap";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.innerHTML =
        '<div class="card-icon">' + m.icon + '</div>' +
        '<div class="card-body">' +
        '<div class="card-title">' + escapeHtml(m.title) + '</div>' +
        '<div class="card-sub">' + escapeHtml(m.summary) + '</div>' +
        (done ? '<span class="badge done">Quiz passed</span>' : '<span class="badge">2Q + practice</span>') +
        '</div>';
      (function (id) {
        card.addEventListener("click", function () { openModule(id); });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModule(id); }
        });
      })(m.id);
      list.appendChild(card);
    }
  }

  function openModule(id) {
    var m = findModule(id);
    if (!m) return;
    state.moduleId = id;
    state.quizIndex = 0;
    state.quizLocked = false;
    state.moduleMode = "quiz";

    $("module-title").textContent = m.icon + " " + m.title;
    var body = $("module-lesson");
    body.innerHTML = "";
    for (var i = 0; i < m.lesson.length; i++) {
      var para = document.createElement("p");
      para.textContent = m.lesson[i];
      body.appendChild(para);
    }

    var tabs = $("module-mode-tabs");
    if (tabs) {
      var tabBtns = tabs.querySelectorAll(".mode-tab");
      for (var t = 0; t < tabBtns.length; t++) {
        tabBtns[t].classList.toggle("active", tabBtns[t].getAttribute("data-mode") === "quiz");
      }
    }
    $("module-quiz").classList.remove("hidden");
    $("module-practice").classList.add("hidden");

    renderModuleQuiz(m);
    showScreen("module");
  }

  function setModuleMode(mode) {
    state.moduleMode = mode;
    var tabs = $("module-mode-tabs");
    if (tabs) {
      var tabBtns = tabs.querySelectorAll(".mode-tab");
      for (var t = 0; t < tabBtns.length; t++) {
        tabBtns[t].classList.toggle("active", tabBtns[t].getAttribute("data-mode") === mode);
      }
    }
    if (mode === "quiz") {
      $("module-quiz").classList.remove("hidden");
      $("module-practice").classList.add("hidden");
      var m = findModule(state.moduleId);
      if (m) renderModuleQuiz(m);
    } else {
      $("module-quiz").classList.add("hidden");
      $("module-practice").classList.remove("hidden");
      renderModulePractice();
    }
  }

  function cardsForModule(moduleId) {
    var all = drills.flashcards || [];
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].moduleId === moduleId) out.push(all[i]);
    }
    if (out.length === 0) {
      for (var j = 0; j < all.length; j++) out.push(all[j]);
    }
    return out;
  }

  function renderModulePractice() {
    var wrap = $("module-practice");
    var cards = cardsForModule(state.moduleId);
    if (!cards.length) {
      wrap.innerHTML = '<p class="muted">No flashcards for this module yet. Try the Drills hub Practice deck.</p>';
      return;
    }
    var idx = 0;
    var flipped = false;

    function paint() {
      var c = cards[idx];
      wrap.innerHTML =
        '<div class="flash-progress">Card ' + (idx + 1) + ' of ' + cards.length + '</div>' +
        '<div class="flash-card' + (flipped ? ' flipped' : '') + '" id="mod-flash-card" role="button" tabindex="0">' +
        '<div class="flash-face flash-front">' + escapeHtml(c.front) + '</div>' +
        '<div class="flash-face flash-back">' + escapeHtml(c.back) + '</div>' +
        '</div>' +
        '<p class="muted center">' + (flipped ? 'Technique tip' : 'Tap to reveal technique tip') + '</p>' +
        '<div class="quiz-nav flash-nav">' +
        '<button type="button" class="secondary" id="mod-flash-prev">Prev</button>' +
        '<button type="button" id="mod-flash-next">Next</button>' +
        '</div>';

      var cardEl = $("mod-flash-card");
      function flip() {
        flipped = !flipped;
        cardEl.classList.toggle("flipped", flipped);
        paint();
      }
      cardEl.addEventListener("click", function () {
        flipped = !flipped;
        paint();
      });
      cardEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flipped = !flipped; paint(); }
      });

      var touchX = null;
      cardEl.addEventListener("touchstart", function (e) {
        if (e.changedTouches && e.changedTouches[0]) touchX = e.changedTouches[0].clientX;
      }, { passive: true });
      cardEl.addEventListener("touchend", function (e) {
        if (touchX == null || !e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) {
          if (dx < 0) { idx = (idx + 1) % cards.length; flipped = false; paint(); }
          else { idx = (idx - 1 + cards.length) % cards.length; flipped = false; paint(); }
        }
      }, { passive: true });

      $("mod-flash-prev").addEventListener("click", function () {
        idx = (idx - 1 + cards.length) % cards.length;
        flipped = false;
        paint();
      });
      $("mod-flash-next").addEventListener("click", function () {
        idx = (idx + 1) % cards.length;
        flipped = false;
        paint();
      });
    }
    paint();
  }

  function renderModuleQuiz(m) {
    var box = $("module-quiz");
    var qi = state.quizIndex;
    var total = m.quiz.length;
    if (qi >= total) {
      var prog = loadProgress();
      if (!prog.modules[m.id]) prog.modules[m.id] = {};
      prog.modules[m.id].passed = true;
      prog.modules[m.id].at = Date.now();
      saveProgress(prog);
      box.innerHTML =
        '<div class="quiz-q">Module quiz complete</div>' +
        '<p class="lead">Nice work. Progress saved on this device.</p>' +
        '<div class="quiz-nav">' +
        '<button type="button" id="mod-quiz-home">Back to home</button>' +
        '<button type="button" class="secondary" id="mod-quiz-practice">Practice mode</button>' +
        '</div>';
      $("mod-quiz-home").addEventListener("click", function () {
        renderHome();
        showScreen("home");
      });
      $("mod-quiz-practice").addEventListener("click", function () {
        setModuleMode("practice");
      });
      return;
    }

    var item = m.quiz[qi];
    state.quizLocked = false;
    var html = '<div class="quiz-q">Question ' + (qi + 1) + ' of ' + total + '</div>';
    html += '<p class="quiz-q">' + escapeHtml(item.q) + '</p>';
    for (var c = 0; c < item.choices.length; c++) {
      html += '<button type="button" class="quiz-choice" data-choice="' + c + '">' +
        escapeHtml(item.choices[c]) + '</button>';
    }
    html += '<div class="quiz-feedback" id="mod-quiz-fb"></div>';
    html += '<div class="quiz-nav"><button type="button" class="secondary" id="mod-quiz-next" disabled>Next</button></div>';
    box.innerHTML = html;

    var choices = box.querySelectorAll(".quiz-choice");
    for (var i = 0; i < choices.length; i++) {
      choices[i].addEventListener("click", function (ev) {
        if (state.quizLocked) return;
        state.quizLocked = true;
        var picked = parseInt(ev.currentTarget.getAttribute("data-choice"), 10);
        var correct = item.answer;
        for (var j = 0; j < choices.length; j++) {
          choices[j].disabled = true;
          var idx = parseInt(choices[j].getAttribute("data-choice"), 10);
          if (idx === correct) choices[j].classList.add("correct");
          if (idx === picked && picked !== correct) choices[j].classList.add("wrong");
        }
        var fb = $("mod-quiz-fb");
        if (picked === correct) {
          fb.className = "quiz-feedback show ok";
          fb.textContent = "Correct.";
        } else {
          fb.className = "quiz-feedback show bad";
          fb.textContent = "Not quite — review the highlighted answer.";
        }
        $("mod-quiz-next").disabled = false;
      });
    }
    $("mod-quiz-next").addEventListener("click", function () {
      state.quizIndex++;
      renderModuleQuiz(m);
    });
  }

  /* ---------- Drills hub ---------- */
  function renderDrillsHub() {
    updateXpChip();
    var p = loadProgress();
    var list = $("drills-hub-list");
    var spotTotal = (drills.spotMistake || []).length;
    var spotDone = 0;
    for (var i = 0; i < spotTotal; i++) {
      var sid = drills.spotMistake[i].id;
      if (p.drills.spotMistake[sid] && p.drills.spotMistake[sid].passed) spotDone++;
    }
    var clTotal = (drills.checklistDrills || []).length;
    var clDone = 0;
    for (var c = 0; c < clTotal; c++) {
      var cid = drills.checklistDrills[c].id;
      if (p.drills.checklist[cid] && p.drills.checklist[cid].passed) clDone++;
    }
    var scTotal = (drills.scenarios || []).length;
    var scDone = 0;
    for (var s = 0; s < scTotal; s++) {
      var scid = drills.scenarios[s].id;
      if (p.drills.scenarios[scid] && p.drills.scenarios[scid].passed) scDone++;
    }

    var items = [
      {
        id: "spot",
        screen: "drill-spot",
        icon: "🔍",
        title: "Spot the mistake",
        sub: spotDone + "/" + spotTotal + " photo drills · tap what's wrong / what next",
        done: spotDone === spotTotal && spotTotal > 0
      },
      {
        id: "checklist",
        screen: "drill-checklist-pick",
        icon: "✅",
        title: "Tap-through checklist",
        sub: clDone + "/" + clTotal + " sequences · tap steps in order",
        done: clDone === clTotal && clTotal > 0
      },
      {
        id: "scenarios",
        screen: "drill-scenarios",
        icon: "🎬",
        title: "Scenario picker",
        sub: scDone + "/" + scTotal + " job setups · best first move",
        done: scDone === scTotal && scTotal > 0
      },
      {
        id: "flash",
        screen: "drill-flash",
        icon: "🃏",
        title: "Practice flashcards",
        sub: (drills.flashcards || []).length + " technique tips · flip & next",
        done: false
      }
    ];

    list.innerHTML = "";
    for (var n = 0; n < items.length; n++) {
      var it = items[n];
      var card = document.createElement("div");
      card.className = "card tap";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.innerHTML =
        '<div class="card-icon">' + it.icon + '</div>' +
        '<div class="card-body">' +
        '<div class="card-title">' + escapeHtml(it.title) + '</div>' +
        '<div class="card-sub">' + escapeHtml(it.sub) + '</div>' +
        (it.done ? '<span class="badge done">Complete</span>' : (!hasFullAccess() && !isOpenScreen(it.screen) ? '<span class="badge">Pack</span>' : '<span class="badge">+' + (drills.xpPerDrill || 25) + ' XP</span>')) +
        '</div>';
      (function (drillId) {
        function go() {
          if (drillId === "spot") startSpotDrill();
          else if (drillId === "checklist") renderChecklistPick();
          else if (drillId === "scenarios") renderScenarioList();
          else if (drillId === "flash") startFlashDeck();
        }
        card.addEventListener("click", go);
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
        });
      })(it.id);
      list.appendChild(card);
    }
  }

  /* ---------- Spot the mistake ---------- */
  function startSpotDrill() {
    state.spotIndex = 0;
    state.spotLocked = false;
    renderSpotItem();
    showScreen("drill-spot");
  }

  function renderSpotItem() {
    var items = drills.spotMistake || [];
    if (!items.length) return;
    if (state.spotIndex >= items.length) {
      $("spot-title").textContent = "All photos done";
      $("spot-progress").textContent = items.length + "/" + items.length;
      $("spot-image").removeAttribute("src");
      $("spot-image").alt = "";
      $("spot-question").textContent = "You've worked through every Spot the mistake card.";
      $("spot-choices").innerHTML = "";
      var fb = $("spot-fb");
      fb.className = "quiz-feedback show ok";
      fb.textContent = "Progress saved under wrap911_progress.drills.";
      var next = $("spot-next");
      next.disabled = false;
      next.textContent = "Back to drills";
      next.onclick = function () {
        renderDrillsHub();
        showScreen("drills");
      };
      return;
    }

    var item = items[state.spotIndex];
    state.spotLocked = false;
    $("spot-title").textContent = item.prompt || "What's wrong / what next?";
    $("spot-progress").textContent = "Photo " + (state.spotIndex + 1) + " of " + items.length;
    var img = $("spot-image");
    img.src = item.image;
    img.alt = item.question;
    $("spot-question").textContent = item.question;

    var box = $("spot-choices");
    box.innerHTML = "";
    for (var c = 0; c < item.choices.length; c++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-choice";
      btn.setAttribute("data-choice", String(c));
      btn.textContent = item.choices[c];
      box.appendChild(btn);
    }
    var fb2 = $("spot-fb");
    fb2.className = "quiz-feedback";
    fb2.textContent = "";
    var nextBtn = $("spot-next");
    nextBtn.disabled = true;
    nextBtn.textContent = state.spotIndex + 1 >= items.length ? "Finish" : "Next";
    nextBtn.onclick = function () {
      state.spotIndex++;
      renderSpotItem();
    };

    var choices = box.querySelectorAll(".quiz-choice");
    for (var i = 0; i < choices.length; i++) {
      choices[i].addEventListener("click", function (ev) {
        if (state.spotLocked) return;
        state.spotLocked = true;
        var picked = parseInt(ev.currentTarget.getAttribute("data-choice"), 10);
        for (var j = 0; j < choices.length; j++) {
          choices[j].disabled = true;
          var idx = parseInt(choices[j].getAttribute("data-choice"), 10);
          if (idx === item.answer) choices[j].classList.add("correct");
          if (idx === picked && picked !== item.answer) choices[j].classList.add("wrong");
        }
        var ok = picked === item.answer;
        fb2.className = "quiz-feedback show " + (ok ? "ok" : "bad");
        fb2.textContent = ok ? item.feedback.correct : item.feedback.wrong;
        nextBtn.disabled = false;
        if (ok) {
          awardDrillXp("spotMistake", item.id, drills.xpPerDrill || 25);
        }
      });
    }
  }

  /* ---------- Checklist drills ---------- */
  function renderChecklistPick() {
    var list = $("cl-pick-list");
    var p = loadProgress();
    var items = drills.checklistDrills || [];
    list.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var done = p.drills.checklist[it.id] && p.drills.checklist[it.id].passed;
      var card = document.createElement("div");
      card.className = "card tap";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.innerHTML =
        '<img class="thumb" src="' + escapeHtml(it.image) + '" alt="" loading="lazy" decoding="async" width="72" height="72" style="width:72px;height:72px;object-fit:cover;border-radius:8px;flex-shrink:0">' +
        '<div class="card-body">' +
        '<div class="card-title">' + escapeHtml(it.title) + '</div>' +
        '<div class="card-sub">' + escapeHtml(it.subtitle) + '</div>' +
        (done ? '<span class="badge done">Passed</span>' : '<span class="badge">In order</span>') +
        '</div>';
      (function (id) {
        card.addEventListener("click", function () { startChecklist(id); });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startChecklist(id); }
        });
      })(it.id);
      list.appendChild(card);
    }
    showScreen("drill-checklist-pick");
  }

  function findChecklist(id) {
    var items = drills.checklistDrills || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function startChecklist(id) {
    var cl = findChecklist(id);
    if (!cl) return;
    state.checklistId = id;
    state.checklistNext = 0;
    $("cl-title").textContent = cl.title;
    $("cl-intro").textContent = cl.intro;
    var img = $("cl-image");
    img.src = cl.image;
    img.alt = cl.title;
    $("cl-hint").textContent = "Tap steps in the correct order.";
    $("cl-fb").className = "quiz-feedback";
    $("cl-fb").textContent = "";
    $("cl-done").classList.add("hidden");

    var wrap = $("cl-steps");
    wrap.innerHTML = "";
    /* shuffle display order but keep correct sequence by index */
    var order = [];
    for (var i = 0; i < cl.steps.length; i++) order.push(i);
    for (var a = order.length - 1; a > 0; a--) {
      var b = Math.floor(Math.random() * (a + 1));
      var tmp = order[a];
      order[a] = order[b];
      order[b] = tmp;
    }
    for (var j = 0; j < order.length; j++) {
      var stepIdx = order[j];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cl-step";
      btn.setAttribute("data-step", String(stepIdx));
      btn.innerHTML = '<span class="cl-num">' + (stepIdx + 1) + '</span><span>' + escapeHtml(cl.steps[stepIdx]) + '</span>';
      btn.addEventListener("click", onChecklistTap);
      wrap.appendChild(btn);
    }
    showScreen("drill-checklist");
  }

  function onChecklistTap(ev) {
    var cl = findChecklist(state.checklistId);
    if (!cl) return;
    var btn = ev.currentTarget;
    if (btn.classList.contains("done")) return;
    var stepIdx = parseInt(btn.getAttribute("data-step"), 10);
    if (stepIdx === state.checklistNext) {
      btn.classList.remove("shake");
      btn.classList.add("done");
      btn.querySelector(".cl-num").textContent = "✓";
      state.checklistNext++;
      if (state.checklistNext >= cl.steps.length) {
        $("cl-hint").textContent = "Sequence complete.";
        var fb = $("cl-fb");
        fb.className = "quiz-feedback show ok";
        fb.textContent = "Correct order — glass → walk fingers → foam feed → lock (or the job sequence for this drill).";
        $("cl-done").classList.remove("hidden");
        awardDrillXp("checklist", cl.id, cl.xp || drills.xpPerDrill || 25);
      }
    } else {
      btn.classList.remove("shake");
      void btn.offsetWidth;
      btn.classList.add("shake");
      var fb2 = $("cl-fb");
      fb2.className = "quiz-feedback show bad";
      fb2.textContent = "Wrong order — tap the next step in sequence (look for step " + (state.checklistNext + 1) + ").";
      setTimeout(function () { btn.classList.remove("shake"); }, 450);
    }
  }

  function resetChecklist() {
    if (state.checklistId) startChecklist(state.checklistId);
  }

  /* ---------- Scenarios ---------- */
  function renderScenarioList() {
    var list = $("scenario-list");
    var p = loadProgress();
    var items = drills.scenarios || [];
    list.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var done = p.drills.scenarios[it.id] && p.drills.scenarios[it.id].passed;
      var card = document.createElement("div");
      card.className = "card tap";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.innerHTML =
        '<div class="card-icon">' + it.icon + '</div>' +
        '<div class="card-body">' +
        '<div class="card-title">' + escapeHtml(it.title) + '</div>' +
        '<div class="card-sub">' + escapeHtml(it.setup.slice(0, 90)) + (it.setup.length > 90 ? "…" : "") + '</div>' +
        (done ? '<span class="badge done">Passed</span>' : '<span class="badge">Pick first move</span>') +
        '</div>';
      (function (id) {
        card.addEventListener("click", function () { openScenario(id); });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openScenario(id); }
        });
      })(it.id);
      list.appendChild(card);
    }
    showScreen("drill-scenarios");
  }

  function findScenario(id) {
    var items = drills.scenarios || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function openScenario(id) {
    var sc = findScenario(id);
    if (!sc) return;
    state.scenarioId = id;
    state.scenarioLocked = false;
    $("sc-icon-title").textContent = sc.icon + " Scenario";
    $("sc-title").textContent = sc.title;
    $("sc-setup").textContent = sc.setup;
    $("sc-question").textContent = sc.question;
    var box = $("sc-choices");
    box.innerHTML = "";
    for (var c = 0; c < sc.choices.length; c++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-choice";
      btn.setAttribute("data-choice", String(c));
      btn.textContent = sc.choices[c];
      box.appendChild(btn);
    }
    var fb = $("sc-fb");
    fb.className = "quiz-feedback";
    fb.textContent = "";
    var again = $("sc-again");
    again.disabled = true;
    again.textContent = "Back to scenarios";

    var choices = box.querySelectorAll(".quiz-choice");
    for (var i = 0; i < choices.length; i++) {
      choices[i].addEventListener("click", function (ev) {
        if (state.scenarioLocked) return;
        state.scenarioLocked = true;
        var picked = parseInt(ev.currentTarget.getAttribute("data-choice"), 10);
        for (var j = 0; j < choices.length; j++) {
          choices[j].disabled = true;
          var idx = parseInt(choices[j].getAttribute("data-choice"), 10);
          if (idx === sc.answer) choices[j].classList.add("correct");
          if (idx === picked && picked !== sc.answer) choices[j].classList.add("wrong");
        }
        var ok = picked === sc.answer;
        fb.className = "quiz-feedback show " + (ok ? "ok" : "bad");
        fb.textContent = (ok ? "Correct. " : "Not the best first move. ") + sc.why;
        again.disabled = false;
        if (ok) awardDrillXp("scenarios", sc.id, drills.xpPerDrill || 25);
      });
    }
    showScreen("drill-scenario");
  }

  /* ---------- Flashcards (hub deck) ---------- */
  function startFlashDeck() {
    state.flashIndex = 0;
    state.flashFlipped = false;
    renderFlashCard();
    showScreen("drill-flash");
  }

  function renderFlashCard() {
    var cards = drills.flashcards || [];
    if (!cards.length) return;
    var c = cards[state.flashIndex];
    $("flash-progress").textContent = "Card " + (state.flashIndex + 1) + " of " + cards.length;
    $("flash-front").textContent = c.front;
    $("flash-back").textContent = c.back;
    var card = $("flash-card");
    card.classList.toggle("flipped", state.flashFlipped);
    var hint = $("flash-hint"); /* Hotfix 2.6.1: #flash-hint was missing from the markup; flashcards threw. */
    if (hint) hint.textContent = state.flashFlipped ? "Technique tip" : "Tap to reveal technique tip";
  }

  function flipFlash() {
    state.flashFlipped = !state.flashFlipped;
    renderFlashCard();
  }

  function nextFlash(dir) {
    var cards = drills.flashcards || [];
    if (!cards.length) return;
    state.flashIndex = (state.flashIndex + dir + cards.length) % cards.length;
    state.flashFlipped = false;
    renderFlashCard();
    if (state.flashIndex === 0 && dir > 0) {
      /* completed a full loop once — light XP once */
      awardDrillXp("flashcards", "deck-loop", 10);
    }
  }

  /* ---------- Photos ---------- */
  var photoJobFilter = "";

  function renderPhotosList() {
    var list = $("photo-list");
    var empty = $("photos-empty");
    if (!list) return;
    list.innerHTML = "";
    var p = loadProgress();
    var shown = 0;
    var freeIds = freePhotoIds();
    for (var i = 0; i < data.photoLessons.length; i++) {
      var pl = data.photoLessons[i];
      var jt = pl.jobType || "";
      if (photoJobFilter && jt !== photoJobFilter) continue;
      if (freeIds && !freeIds[pl.id]) continue;
      shown++;
      var done = p.photos[pl.id] && p.photos[pl.id].passed;
      var card = document.createElement("div");
      card.className = "card tap thumb-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.innerHTML =
        '<img class="thumb" src="' + escapeHtml(pl.image) + '" alt="' + escapeHtml(pl.title) + '" loading="lazy" decoding="async">' +
        '<div class="photo-caption">' + escapeHtml(pl.title) + '</div>' +
        '<div class="photo-meta">' + escapeHtml(jt || "Shop photo") +
        (done ? " · Quiz passed" : " · Tap to open") + '</div>';
      (function (id) {
        card.addEventListener("click", function () { openPhoto(id); });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPhoto(id); }
        });
      })(pl.id);
      list.appendChild(card);
    }
    if (empty) {
      empty.classList.toggle("hidden", shown > 0);
      if (!shown) {
        empty.innerHTML = freeIds ?
          "<strong>" + escapeHtml(photoJobFilter || "These") + " photos are in the pack</strong>" +
          "Tap <em>All</em> for the free photos, or unlock with the pack or a seat." :
          "<strong>No photos for " + escapeHtml(photoJobFilter || "this filter") + "</strong>" +
          "Tap <em>All</em> or another job type chip — or Home → Browse photos.";
      }
    }
    var chips = document.querySelectorAll("#photo-filter-chips [data-photo-job]");
    for (var c = 0; c < chips.length; c++) {
      var v = chips[c].getAttribute("data-photo-job") || "";
      chips[c].classList.toggle("active", v === photoJobFilter);
    }
    try { if (window.WRAP911_GATE && window.WRAP911_GATE.limitNow) window.WRAP911_GATE.limitNow(); } catch (eL) {}
  }

  function bindPhotoFilters() {
    var wrap = $("photo-filter-chips");
    if (!wrap || wrap.getAttribute("data-bound")) return;
    wrap.setAttribute("data-bound", "1");
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-photo-job]");
      if (!btn) return;
      photoJobFilter = btn.getAttribute("data-photo-job") || "";
      renderPhotosList();
    });
  }

  function openPhoto(id) {
    var pl = findPhoto(id);
    if (!pl) return;
    var freeIds = freePhotoIds();
    if (freeIds && !freeIds[id]) { showScreen("pricing"); return; }
    state.photoId = id;
    state.quizLocked = false;

    $("photo-title").textContent = pl.title;
    var plMod = findModule(pl.module);
    var plLabels = { "commercial-sides": "Vehicle sides", architectural: "Interior / architectural" };
    $("photo-module-tag").textContent = (plMod && plMod.title) || plLabels[pl.module] || pl.jobType || "Photo lesson";
    var img = $("photo-image");
    img.src = pl.image;
    img.alt = pl.title;
    $("photo-visual").textContent = pl.visual;
    $("photo-narration").textContent = pl.narration;

    var cl = $("photo-checklist");
    cl.innerHTML = "";
    for (var i = 0; i < pl.checklist.length; i++) {
      var li = document.createElement("li");
      li.textContent = pl.checklist[i];
      cl.appendChild(li);
    }

    renderPhotoQuiz(pl);
    showScreen("photo");
  }

  function shuffleTwo(correct, wrong) {
    if (Math.random() < 0.5) {
      return { choices: [correct, wrong], answer: 0 };
    }
    return { choices: [wrong, correct], answer: 1 };
  }

  function renderPhotoQuiz(pl) {
    var box = $("photo-quiz");
    var shuffled = shuffleTwo(pl.quiz.correct, pl.quiz.wrong);
    state.quizLocked = false;

    var html = '<div class="quiz-q">Photo quiz</div>';
    html += '<p class="quiz-q">' + escapeHtml(pl.quiz.q) + '</p>';
    for (var c = 0; c < shuffled.choices.length; c++) {
      html += '<button type="button" class="quiz-choice" data-choice="' + c + '">' +
        escapeHtml(shuffled.choices[c]) + '</button>';
    }
    html += '<div class="quiz-feedback" id="photo-quiz-fb"></div>';
    html += '<div class="quiz-nav"><button type="button" class="secondary" id="photo-quiz-done" disabled>Mark complete</button></div>';
    box.innerHTML = html;

    var choices = box.querySelectorAll(".quiz-choice");
    for (var i = 0; i < choices.length; i++) {
      choices[i].addEventListener("click", function (ev) {
        if (state.quizLocked) return;
        state.quizLocked = true;
        var picked = parseInt(ev.currentTarget.getAttribute("data-choice"), 10);
        for (var j = 0; j < choices.length; j++) {
          choices[j].disabled = true;
          var idx = parseInt(choices[j].getAttribute("data-choice"), 10);
          if (idx === shuffled.answer) choices[j].classList.add("correct");
          if (idx === picked && picked !== shuffled.answer) choices[j].classList.add("wrong");
        }
        var fb = $("photo-quiz-fb");
        var passed = picked === shuffled.answer;
        if (passed) {
          fb.className = "quiz-feedback show ok";
          fb.textContent = "Correct.";
          var prog = loadProgress();
          if (!prog.photos[pl.id]) prog.photos[pl.id] = {};
          prog.photos[pl.id].passed = true;
          prog.photos[pl.id].at = Date.now();
          saveProgress(prog);
        } else {
          fb.className = "quiz-feedback show bad";
          fb.textContent = "Review the narration and checklist, then try again next time.";
        }
        $("photo-quiz-done").disabled = false;
        $("photo-quiz-done").textContent = "Back to library";
      });
    }
    $("photo-quiz-done").addEventListener("click", function () {
      renderPhotosList();
      showScreen("photos");
    });
  }

  function renderContact() {
    var name = cfg.contactName || "Gerry";
    var email = (cfg.contactEmail || "").trim();
    $("contact-name").textContent = name;
    var emailEl = $("contact-email");
    if (email) {
      emailEl.innerHTML = '<a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + '</a>';
    } else {
      emailEl.innerHTML = '<span class="muted">Contact email coming soon.</span>';
    }
    var brandsEl = $("contact-brands");
    if (brandsEl) brandsEl.textContent = (cfg.brands || ["3M", "Avery Dennison", "Arlon"]).join(", ");
  }

  function bindNav() {
    var nav = $("bottom-nav");
    if (!nav) return;
    nav.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-nav]");
      if (!btn) return;
      var target = btn.getAttribute("data-nav");
      if (target === "home") { renderHome(); showScreen("home"); }
      else if (target === "practice-hub") { if (window.WRAP911_APP.renderPracticeHub) window.WRAP911_APP.renderPracticeHub(); showScreen("practice-hub"); }
      else if (target === "jobs") { if (window.WRAP911_APP.renderJobs) window.WRAP911_APP.renderJobs(); showScreen("jobs"); }
      else if (target === "badges") { if (window.WRAP911_APP.renderBadges) window.WRAP911_APP.renderBadges(); showScreen("badges"); }
      else if (target === "photos") { renderPhotosList(); showScreen("photos"); }
      else if (target === "coach") {
        if (window.WRAP911_COACH && window.WRAP911_COACH.renderCoach) window.WRAP911_COACH.renderCoach();
        showScreen("coach");
      }
      else if (target === "drills") { renderDrillsHub(); showScreen("drills"); }
      else if (target === "pricing") { renderPricing(); showScreen("pricing"); }
      else if (target === "contact") { renderContact(); showScreen("contact"); }
    });
  }

  function bindHomeShortcuts() {
    function wire(id, fn) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("click", fn);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
      });
    }
    wire("goto-photos", function () { renderPhotosList(); showScreen("photos"); });
    wire("goto-drills", function () { renderDrillsHub(); showScreen("drills"); });
    wire("goto-pricing", function () { renderPricing(); showScreen("pricing"); });
    wire("goto-videos", function () { if (window.WRAP911_APP.renderVideos) window.WRAP911_APP.renderVideos(); showScreen("videos"); });
    wire("goto-videos-primary", function () { if (window.WRAP911_APP.renderVideos) window.WRAP911_APP.renderVideos(); showScreen("videos"); });
    wire("goto-calc", function () { if (window.WRAP911_APP.renderCalc) window.WRAP911_APP.renderCalc(); showScreen("calc"); });
    wire("goto-coach", function () {
      if (window.WRAP911_COACH && window.WRAP911_COACH.renderCoach) window.WRAP911_COACH.renderCoach();
      showScreen("coach");
    });
    wire("goto-learn-job", function () {
      var panel = $("home-job-types");
      if (panel) panel.classList.remove("hidden");
      if (window.WRAP911_APP && window.WRAP911_APP.renderJobTypeGrid) {
        window.WRAP911_APP.renderJobTypeGrid();
      }
      try { panel && panel.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
    });
    var hideJt = $("btn-hide-job-types");
    if (hideJt) {
      hideJt.addEventListener("click", function () {
        var panel = $("home-job-types");
        if (panel) panel.classList.add("hidden");
      });
    }
  }

  function initRules() {
    var cb = $("rules-checkbox");
    var btn = $("btn-accept-rules");
    function sync() { btn.disabled = !cb.checked; }
    cb.addEventListener("change", sync);
    sync();
    btn.addEventListener("click", function () {
      if (!cb.checked) return;
      acceptRules();
      if (window.WRAP911_APP && window.WRAP911_APP.applyUrlLesson && window.WRAP911_APP.applyUrlLesson()) {
        return;
      }
      renderHome();
      showScreen("home");
    });
  }

  function init() {
    document.title = (cfg.shopName || "WRAP 911") + " Trainer";
    var brandEls = document.querySelectorAll(".brand-name");
    for (var i = 0; i < brandEls.length; i++) {
      brandEls[i].innerHTML = 'WRAP <span>911</span>';
    }

    $("btn-back-module").addEventListener("click", function () {
      renderHome();
      showScreen("home");
    });
    $("btn-back-photo").addEventListener("click", function () {
      renderPhotosList();
      showScreen("photos");
    });
    $("btn-back-spot").addEventListener("click", function () {
      renderDrillsHub();
      showScreen("drills");
    });
    $("btn-back-checklist").addEventListener("click", function () {
      renderChecklistPick();
    });
    $("btn-back-cl-pick").addEventListener("click", function () {
      renderDrillsHub();
      showScreen("drills");
    });
    $("btn-back-scenarios").addEventListener("click", function () {
      renderDrillsHub();
      showScreen("drills");
    });
    $("btn-back-scenario").addEventListener("click", function () {
      renderScenarioList();
    });
    $("btn-back-flash").addEventListener("click", function () {
      renderDrillsHub();
      showScreen("drills");
    });

    $("cl-reset").addEventListener("click", resetChecklist);
    $("cl-done").addEventListener("click", function () {
      renderChecklistPick();
    });
    $("sc-again").addEventListener("click", function () {
      renderScenarioList();
    });

    $("flash-card").addEventListener("click", flipFlash);
    $("flash-card").addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flipFlash(); }
    });
    $("flash-prev").addEventListener("click", function () { nextFlash(-1); });
    $("flash-next").addEventListener("click", function () { nextFlash(1); });
    $("flash-card").addEventListener("touchstart", function (e) {
      if (e.changedTouches && e.changedTouches[0]) state.flashTouchX = e.changedTouches[0].clientX;
    }, { passive: true });
    $("flash-card").addEventListener("touchend", function (e) {
      if (state.flashTouchX == null || !e.changedTouches || !e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - state.flashTouchX;
      state.flashTouchX = null;
      if (Math.abs(dx) > 50) nextFlash(dx < 0 ? 1 : -1);
    }, { passive: true });

    $("xp-modal-ok").addEventListener("click", hideXpModal);
    $("xp-modal").addEventListener("click", function (e) {
      if (e.target === $("xp-modal")) hideXpModal();
    });

    var tabs = $("module-mode-tabs");
    if (tabs) {
      tabs.addEventListener("click", function (e) {
        var btn = e.target.closest(".mode-tab");
        if (!btn) return;
        setModuleMode(btn.getAttribute("data-mode"));
      });
    }

    var unlockBtn = $("btn-unlock");
    if (unlockBtn) {
      unlockBtn.addEventListener("click", function () {
        unlockWithCode(($("unlock-code") && $("unlock-code").value) || "");
      });
    }
    var unlockInput = $("unlock-code");
    if (unlockInput) {
      unlockInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          unlockWithCode(unlockInput.value);
        }
      });
    }
    var clearLic = $("btn-clear-license");
    if (clearLic) {
      clearLic.addEventListener("click", clearLicense);
    }

    bindNav();
    bindHomeShortcuts();
    bindPhotoFilters();
    initRules();
    updateXpChip();
    updatePlanChip();

    if (window.WRAP911_APP && window.WRAP911_APP.bindExtra) {
      window.WRAP911_APP.bindExtra();
    }
    if (window.WRAP911_COACH && window.WRAP911_COACH.bindUI) {
      window.WRAP911_COACH.bindUI();
      window.WRAP911_COACH.updateDraftBadge();
      if (window.WRAP911_COACH.renderCoach) window.WRAP911_COACH.renderCoach();
    }

    applyUrlLicenseToken();

    /* PWA SW — https/localhost only; skip file:// */
    if ("serviceWorker" in navigator) {
      var proto = location.protocol;
      if (proto === "https:" || proto === "http:") {
        window.addEventListener("load", function () {
          var reloadKey = "wrap911_sw_reload_" + (cfg.version || "unknown");
          var reloadStarted = false;

          function reloadOnce() {
            if (reloadStarted) return;
            reloadStarted = true;
            try {
              if (sessionStorage.getItem(reloadKey) === "1") return;
              sessionStorage.setItem(reloadKey, "1");
            } catch (e) { /* in-memory guard still prevents repeats */ }
            location.reload();
          }

          /* Hard cache bust: version mismatch → unregister ALL SWs, wipe caches, reload once. */
          try {
            var seen = localStorage.getItem("wrap911_seen_version");
            /* Audit 2026-09-26: brand-new visitors (seen === null) used to get a purge + reload on first open. */
            if (seen === null) {
              localStorage.setItem("wrap911_seen_version", cfg.version || "");
            } else if (seen !== cfg.version) {
              var purgeKey = "wrap911_purge_" + (cfg.version || "unknown");
              if (sessionStorage.getItem(purgeKey) !== "1") {
                sessionStorage.setItem(purgeKey, "1");
                localStorage.setItem("wrap911_seen_version", cfg.version || "");
                Promise.all([
                  navigator.serviceWorker.getRegistrations().then(function (regs) {
                    return Promise.all(regs.map(function (r) { return r.unregister(); }));
                  }),
                  caches.keys().then(function (keys) {
                    return Promise.all(keys.map(function (k) { return caches.delete(k); }));
                  })
                ]).then(function () {
                  reloadOnce();
                }).catch(function () {
                  reloadOnce();
                });
                return; /* skip register until after reload */
              }
              localStorage.setItem("wrap911_seen_version", cfg.version || "");
            }
          } catch (e) { /* storage may be unavailable in private mode */ }

          navigator.serviceWorker.register("./sw.js").then(function (reg) {
            /* skipWaiting + clients.claim should lead to controllerchange. */
            /* Only reload on controller swap when a previous worker controlled the page (update, not first install). */
            var hadController = !!navigator.serviceWorker.controller;
            navigator.serviceWorker.addEventListener("controllerchange", function () { if (hadController) reloadOnce(); });
            reg.addEventListener("updatefound", function () {
              var worker = reg.installing;
              if (!worker) return;
              worker.addEventListener("statechange", function () {
                if (worker.state === "installed" && navigator.serviceWorker.controller) {
                  reloadOnce();
                }
              });
            });

            /* Keep Safari from waiting for its normal periodic update check. */
            reg.update().catch(function () {});
          }).catch(function () {});
        });
      }
    }

    if (rulesAccepted()) {
      renderHome();
      showScreen("home");
      if (window.WRAP911_APP && window.WRAP911_APP.applyUrlLesson) {
        window.WRAP911_APP.applyUrlLesson();
      }
    } else {
      showScreen("rules");
    }
  }


  /* Public API for app_extra.js */
  window.WRAP911_APP.core = {
    $, escapeHtml: escapeHtml, showScreen: showScreen, loadProgress: loadProgress, saveProgress: saveProgress,
    renderHome: renderHome, findModule: findModule, findPhoto: findPhoto, updateXpChip: updateXpChip,
    awardDrillXp: awardDrillXp, state: state, data: data, cfg: cfg, JOBS_KEY: JOBS_KEY,
    renderPhotosList: renderPhotosList, renderDrillsHub: renderDrillsHub, renderPricing: renderPricing,
    renderContact: renderContact, hasFullAccess: hasFullAccess, loadLicense: loadLicense,
    unlockWithCode: unlockWithCode
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
