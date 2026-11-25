/* WRAP 911 polish 2.9.2: global search, per-list filters, Settings, Help & FAQ,
   feedback, toasts, offline banner, empty states, missing back buttons, aria-current.
   Rules: no payment UI here. On the iOS app (Capacitor ios) "Restore purchases" only
   opens the existing Apple restore on Pricing; nothing here links to Stripe or shows a
   code field. Brands: 3M, Avery Dennison, BriteLine. Heat always "per the film's TDS". */
(function () {
  "use strict";
  var VERSION = "2.9.3";
  var RECENT_KEY = "wrap911_recent_searches";
  var TEXT_KEY = "wrap911_text_size";
  var PHOTOS_KEY = "wrap911_bg_photos";
  var PRIVACY = "https://wrap911.com/privacy.html";
  var EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

  function cfg() { return window.WRAP911_CONFIG || {}; }
  function APP() { return window.WRAP911_APP || {}; }
  function core() { return APP().core; }
  function D() { return window.WRAP911_DATA || {}; }
  function $(id) { return document.getElementById(id); }
  function isIOSApp() {
    try {
      var c = window.Capacitor;
      if (c && typeof c.getPlatform === "function" && c.getPlatform() === "ios") return true;
      if (window.WRAP911_IAP_LOGIC && window.WRAP911_IAP_LOGIC.isNativeApp && window.WRAP911_IAP_LOGIC.isNativeApp()) return true;
    } catch (e) {}
    return false;
  }
  function isNative() {
    try { var c = window.Capacitor; return !!(c && c.isNativePlatform && c.isNativePlatform()); } catch (e) { return false; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function paid() {
    try {
      if (window.WRAP911_GATE && window.WRAP911_GATE.paid) return !!window.WRAP911_GATE.paid();
      var c = core(); return !!(c && c.hasFullAccess && c.hasFullAccess());
    } catch (e) { return false; }
  }
  function screenOpenFree(name) {
    var fs = cfg().freeScreens || [];
    return fs.indexOf(name) >= 0;
  }
  function show(name) { var c = core(); if (c && c.showScreen) c.showScreen(name); }
  function goHome() { var c = core(); if (!c) return; try { c.renderHome(); } catch (e) {} c.showScreen("home"); }
  function click(id) { var el = $(id); if (el) { el.click(); return true; } return false; }
  function navTo(target) {
    var b = document.querySelector('#bottom-nav button[data-nav="' + target + '"]');
    if (b) b.click();
  }
  function activeScreen() {
    var a = document.querySelector(".screen.active");
    return a && a.id ? a.id.replace(/^screen-/, "") : "";
  }

  /* ---------- toast ---------- */
  var toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "w9-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }
  window.WRAP911_TOAST = toast;

  /* ---------- confirm sheet (native confirm() shows "localhost" as the title in the iOS app) ---------- */
  function confirmSheet(title, body, okLabel, onOk) {
    var wrap = document.createElement("div");
    wrap.className = "w9-sheet";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", title);
    wrap.innerHTML = '<div class="w9-sheet-card"><h2>' + esc(title) + "</h2><p>" + esc(body) + "</p>" +
      '<div class="w9-sheet-row"><button type="button" class="secondary" data-w9="cancel">Cancel</button>' +
      '<button type="button" class="w9-danger" data-w9="ok">' + esc(okLabel) + "</button></div></div>";
    function close() { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
    wrap.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-w9]") : null;
      if (e.target === wrap || (t && t.getAttribute("data-w9") === "cancel")) { close(); return; }
      if (t && t.getAttribute("data-w9") === "ok") { close(); onOk(); }
    });
    wrap.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    document.body.appendChild(wrap);
    var cancel = wrap.querySelector('[data-w9="cancel"]');
    if (cancel) cancel.focus();
  }

  var ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
  var ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

  /* ---------- glossary (shop terms; no temperatures, no brand claims) ---------- */
  var GLOSSARY = [
    ["TDS", "Technical data sheet. The film maker's spec: surfaces, stretch limits, heat and post-heat steps, cure time. Every heat step in WRAP 911 points here."],
    ["Glassing", "Laying the sheet over the panel with light, even tension so it floats flat like glass before you squeegee it down."],
    ["Post-heat", "Heating installed film so it keeps its new shape in recesses, around rivets, and on edges. How much and how long comes from the film's TDS."],
    ["Knifeless tape", "Filament tape laid under the film. Pull the filament to cut, so no blade touches the paint."],
    ["Inlay", "A separate piece laid into a deep pocket, recess, or light bucket first, with the main sheet lapped over it."],
    ["Relief cut", "A small cut that lets film relax around a tight curve or obstacle so it lies down without wrinkles or overstretch."],
    ["Tenting", "Film standing up over a rivet head, gap, or recess instead of seated down into it. It lifts later."],
    ["Bridging", "Film spanning across a recess or channel without touching the bottom. Seat it or plan an inlay."],
    ["Silvering", "Trapped air under the adhesive that shows as a silver haze, often around rivets and in recesses."],
    ["Overlap", "Where one panel laps over the next at a seam. Lap so water and wind run over the edge, not into it."],
    ["Seam", "Where two pieces meet. Put seams on body lines, panel gaps, or rivet lines when you can."],
    ["Cast film", "Film made from a liquid cast onto a sheet. It conforms to curves, rivets, and recesses better than calendered film."],
    ["Calendered film", "Film pressed out through rollers. Stiffer; best on flat, simple surfaces."],
    ["Air-release adhesive", "Adhesive with tiny channels so trapped air can be pushed out with the squeegee."],
    ["Liner", "The backing over the adhesive. On big panels pull it in stages, not all at once."],
    ["Hinge method", "Tape the panel across the middle or along one edge, pull the liner off one half, apply, then do the other half."],
    ["Overstretch", "Film pulled past its limit. It thins, changes color or gloss, and tends to lift."],
    ["Film memory", "Film wants to return to its flat shape. Post-heat per the TDS sets it in the new shape."],
    ["Edge lift", "Film edge coming up off the surface. Usually dirt, overstretch, or no post-heat at the edge."],
    ["Tuck", "Wrapping film around a panel edge into a gap so the cut edge is hidden."],
    ["Overlaminate", "Clear film over printed vinyl to protect the print. Use the laminate the film maker pairs with that film."],
    ["Dwell time", "Time the adhesive needs to build bond before washing or stress. It is on the TDS."],
    ["Wet application", "Applying with application fluid so the film can slide into place. Only when the film's TDS allows it."],
    ["IPA wipe", "Isopropyl alcohol and lint-free cloth for final cleaning, following the film maker's prep steps."],
    ["Rivet brush", "A stiff brush or foam tool used to press film down around rivet heads one at a time."]
  ];

  var SYN = {
    bubble: ["silvering", "air"], bubbles: ["silvering", "air"], air: ["silvering", "bubble"],
    tent: ["rivet", "tenting"], tents: ["rivet", "tenting"], tenting: ["rivet", "tent"],
    lift: ["lifting", "edge"], lifting: ["lift", "edge"], peel: ["lift", "lifting"], peeling: ["lift", "lifting"],
    wrinkle: ["wrinkles", "recess", "finger"], wrinkles: ["wrinkle", "recess", "finger"], fingers: ["finger", "wrinkle"],
    seam: ["seams", "overlap"], seams: ["seam", "overlap"], gap: ["seam", "overlap"],
    heat: ["post-heat", "tds"], postheat: ["post-heat"], "post heat": ["post-heat"],
    knife: ["knifeless", "cut", "blade"], cut: ["knifeless", "relief", "trim"],
    window: ["storefront", "glass"], glass: ["storefront", "window"], wall: ["storefront", "interior", "architectural"],
    truck: ["box truck"], camper: ["rv"], bus: ["rv"], suv: ["fleet"],
    price: ["pricing", "calculator"], quote: ["calculator", "pricing"], estimate: ["calculator"],
    restore: ["restore purchases"], purchase: ["pricing", "restore"]
  };

  /* ---------- index ---------- */
  var INDEX = null;
  function add(list, item) {
    item.hay = (" " + [item.title, item.keys || "", item.body || ""].join(" ") + " ").toLowerCase();
    item.tl = String(item.title).toLowerCase();
    list.push(item);
  }
  function lessonFree(id) {
    var A = APP();
    try { if (A.lessonIsFree) return !!A.lessonIsFree(id); } catch (e) {}
    var ids = cfg().freeLessonIds || [];
    return !ids.length || ids.indexOf(id) >= 0;
  }
  function vehicleTitle(id) {
    var vs = D().vehicles || [];
    for (var i = 0; i < vs.length; i++) if (vs[i].id === id) return vs[i].title;
    return "";
  }
  function buildIndex() {
    var d = D(), list = [], i;
    (d.vehicles || []).forEach(function (v) {
      add(list, { type: "job", icon: v.icon || "", title: v.title, sub: v.summary || "", body: v.summary,
        open: function () { if (APP().openVehicle) APP().openVehicle(v.id); } });
    });
    (d.trainingLessons || []).forEach(function (l) {
      var vt = vehicleTitle(l.vehicleId);
      add(list, { type: "lesson", icon: "\uD83D\uDCD8", title: l.title, sub: (vt ? vt + " lesson" : "Lesson") + (l.goal ? " \u00B7 " + l.goal : ""),
        keys: vt + " " + (l.keyTechniques || []).join(" ") + " " + (l.tools || []).join(" "),
        body: [l.goal || ""].concat(l.commonMistakes || [], l.steps || []).join(" "),
        fields: [l.goal || ""].concat(l.keyTechniques || [], l.commonMistakes || [], l.tools || [], l.steps || []),
        lockedFn: function () { return !paid() && !lessonFree(l.id); },
        open: function () { if (APP().openLesson) APP().openLesson(l.id); } });
      (l.commonMistakes || []).forEach(function (m) {
        add(list, { type: "mistake", icon: "\u26A0\uFE0F", title: m, sub: l.title + (vt ? " \u00B7 " + vt : ""), keys: l.title + " " + vt,
          lockedFn: function () { return !paid() && !lessonFree(l.id); },
          open: function () { if (APP().openLesson) APP().openLesson(l.id); } });
      });
      (l.keyTechniques || []).forEach(function (t) {
        add(list, { type: "technique", icon: "\uD83D\uDEE0\uFE0F", title: t, sub: l.title + (vt ? " \u00B7 " + vt : ""), keys: l.title + " " + vt,
          lockedFn: function () { return !paid() && !lessonFree(l.id); },
          open: function () { if (APP().openLesson) APP().openLesson(l.id); } });
      });
    });
    var real = window.WRAP911_VIDEO_REAL || null;
    (d.VIDEO_CATALOG || []).forEach(function (v) {
      var src = String(v.src || "").replace(/^\.\//, "");
      if (real && !real[src]) return;
      add(list, { type: "video", icon: "\u25B6\uFE0F", title: v.title, sub: (v.category || "Video") + (v.subcategory ? " \u00B7 " + v.subcategory : ""),
        keys: (v.category || "") + " " + (v.subcategory || ""), body: v.note || "",
        lockedFn: function () { return !paid() && v.access !== "free"; },
        open: function () { openVideo(v); } });
    });
    (d.photoLessons || []).forEach(function (p) {
      var prob = p.jobType === "Problems";
      add(list, { type: prob ? "doctor" : "photo", icon: prob ? "\uD83E\uDE7A" : "\uD83D\uDCF7", title: p.title,
        sub: prob ? "Problem and fix" : (p.jobType || "Shop photo"),
        keys: (p.module || "") + " " + (p.jobType || ""), body: (p.visual || "") + " " + (p.narration || ""),
        fields: [p.narration || "", p.visual || ""],
        open: function () { openPhoto(p); } });
    });
    (d.practiceScenarios || []).forEach(function (s) {
      add(list, { type: "practice", icon: s.icon || "\uD83C\uDFAF", title: s.title, sub: "Practice", keys: (s.skills || []).join(" "),
        body: (s.panelDesc || "") + " " + (s.checklist || []).join(" "),
        open: function () { if (APP().openPractice) APP().openPractice(s.id); else navTo("practice-hub"); } });
    });
    (d.modules || []).forEach(function (m) {
      add(list, { type: "module", icon: m.icon || "", title: m.title, sub: m.summary || "Module", body: (m.lesson || []).join(" "),
        fields: m.lesson || [],
        lockedFn: function () { return !paid() && !screenOpenFree("module"); },
        open: function () { openModule(m); } });
    });
    GLOSSARY.forEach(function (g) {
      add(list, { type: "term", icon: "\uD83D\uDCD6", title: g[0], sub: g[1], body: g[1], open: function () { openGlossary(g[0]); } });
    });
    toolEntries().forEach(function (t) { add(list, t); });
    INDEX = list;
    return list;
  }
  function toolEntries() {
    var ios = isIOSApp();
    function locked(name) { return function () { return !paid() && !screenOpenFree(name); }; }
    var t = [
      { title: "Problem Doctor", sub: "Photo or short video of a vinyl problem. A likely cause and a fix.", keys: "diagnose photo video defect fix help", icon: "\uD83E\uDE7A", open: function () { click("goto-problem-doctor"); } },
      { title: "Ask Coach", sub: "Ask about a wrap step or vehicle part.", keys: "coach question chat ask", icon: "\uD83D\uDCAC", open: function () { click("goto-coach"); } },
      { title: "Material calculator", sub: "Square feet, rolls, waste, and a job estimate.", keys: "calculator estimate quote square feet roll waste material labor", icon: "\uD83E\uDDEE", lockedFn: locked("calc"), open: function () { click("goto-calc"); } },
      { title: "Job manager", sub: "Save jobs with type, film brand, and notes.", keys: "jobs job manager notes", icon: "\uD83D\uDCCB", lockedFn: locked("jobs"), open: function () { navTo("jobs"); } },
      { title: "Training library", sub: "Every lesson by vehicle.", keys: "library lessons all", icon: "\uD83D\uDCDA", open: function () { if (APP().renderLibrary) APP().renderLibrary(); show("library"); } },
      { title: "Videos", sub: "Install clips from the bay.", keys: "videos clips watch", icon: "\u25B6\uFE0F", open: function () { click("goto-videos-primary"); } },
      { title: "Photos", sub: "Shop photos with what to look for.", keys: "photos gallery pictures", icon: "\uD83D\uDCF7", open: function () { click("goto-photos"); } },
      { title: "Practice", sub: "Practice scenarios with a checklist.", keys: "practice drill", icon: "\uD83C\uDFAF", open: function () { navTo("practice-hub"); } },
      { title: "Drills and games", sub: "Spot the mistake, checklists, flashcards.", keys: "drills games flashcards quiz spot", icon: "\uD83C\uDFAE", open: function () { click("goto-drills"); } },
      { title: "Progress and badges", sub: "XP, streak, and badges.", keys: "progress badges xp streak level", icon: "\uD83C\uDFC5", lockedFn: locked("badges"), open: function () { if (APP().renderBadges) APP().renderBadges(); show("badges"); } },
      { title: ios ? "Plans" : "Pricing and unlock", sub: ios ? "Shop Pack, Seat, and 7-Day Pass." : "Shop Pack (default) and Seat.", keys: "pricing price buy unlock plan pack seat purchase", icon: "\uD83D\uDD13", open: function () { click("goto-pricing"); } },
      { title: "Settings", sub: "Text size, background photos, reset progress, privacy.", keys: "settings preferences text size reset privacy version", icon: "\u2699\uFE0F", open: function () { openSettings(); } },
      { title: "Help and FAQ", sub: "How WRAP 911 works and common questions.", keys: "help faq support questions how", icon: "\u2753", open: function () { openHelp(); } },
      { title: "Send feedback", sub: "Tell WRAP 911 what to fix or add.", keys: "feedback contact email support bug", icon: "\u2709\uFE0F", open: function () { sendFeedback(); } },
      { title: "About WRAP 911", sub: "Why it exists and who it is for.", keys: "about story installer", icon: "\u2139\uFE0F", open: function () { click("goto-about"); } },
      { title: "Report a problem photo", sub: "Show the mistake the before and after hides.", keys: "report upload problem", icon: "\uD83D\uDCE4", open: function () { click("goto-problem-upload"); } }
    ];
    if (ios) t.push({ title: "Restore purchases", sub: "Bring a Shop Pack, Seat, or 7-Day Pass back on this phone.", keys: "restore purchase apple", icon: "\u21BB", open: function () { restorePurchases(); } });
    return t.map(function (x) { x.type = "tool"; return x; });
  }

  function openModule(m) {
    /* openModule is private in app-core; the module cards in More tools call it. */
    var cards = document.querySelectorAll("#module-list .card");
    for (var i = 0; i < cards.length; i++) {
      var t = cards[i].querySelector(".card-title");
      if (t && t.textContent.trim() === String(m.title).trim()) { cards[i].click(); return; }
    }
    goHome();
  }
  function openPhoto(p) {
    var c = core();
    if (c && typeof c.openPhoto === "function") { c.openPhoto(p.id); return; }
    try { if (c && c.renderPhotosList) c.renderPhotosList(); } catch (e) {}
    var caps = document.querySelectorAll("#photo-list .photo-caption");
    for (var i = 0; i < caps.length; i++) {
      if ((caps[i].textContent || "").trim() === String(p.title).trim()) {
        var card = caps[i].closest(".card");
        if (card && card.style.display !== "none") { card.click(); return; }
      }
    }
    if (!paid()) { click("goto-pricing"); toast("That photo is in the full library."); return; }
    click("goto-photos");
  }
  function openVideo(v) {
    if (!paid() && v.access !== "free") { click("goto-pricing"); toast("That clip is in the full library."); return; }
    var f = $("video-filter-cat"); if (f) f.value = "";
    click("goto-videos-primary");
    setTimeout(function () {
      var cards = document.querySelectorAll("#video-list .video-card");
      for (var i = 0; i < cards.length; i++) {
        var t = cards[i].querySelector(".card-title");
        if (t && t.textContent.trim() === String(v.title).trim()) {
          cards[i].scrollIntoView({ block: "center" });
          cards[i].style.boxShadow = "0 0 0 3px #ffb000";
          (function (el) { setTimeout(function () { el.style.boxShadow = ""; }, 2200); })(cards[i]);
          return;
        }
      }
      toast("That clip is not on this phone yet.");
    }, 120);
  }
  function openGlossary(term) {
    openHelp();
    setTimeout(function () {
      var el = document.querySelector('[data-w9-term="' + term.replace(/"/g, "") + '"]');
      if (el) { el.open = true; el.scrollIntoView({ block: "center" }); }
    }, 60);
  }

  /* ---------- matching ---------- */
  function tokens(q) {
    var raw = String(q || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
    var out = [];
    for (var i = 0; i < raw.length; i++) { var w = raw[i].replace(/^-+|-+$/g, ""); if (w.length >= 2 && out.indexOf(w) < 0) out.push(w); }
    return out;
  }
  function variants(tok) {
    var v = [tok];
    if (tok.length > 3 && /s$/.test(tok)) v.push(tok.slice(0, -1));
    if (tok.indexOf("-") >= 0) v.push(tok.replace(/-/g, " "), tok.replace(/-/g, ""));
    if (tok === "postheat") v.push("post-heat");
    (SYN[tok] || []).forEach(function (s) { v.push(s); });
    return v;
  }
  function score(item, toks, q) {
    var s = 0;
    for (var i = 0; i < toks.length; i++) {
      var vs = variants(toks[i]), hit = 0;
      for (var j = 0; j < vs.length; j++) {
        var w = vs[j];
        if (item.tl.indexOf(w) >= 0) { hit = Math.max(hit, (j === 0 ? 10 : 6) + (item.tl.indexOf(w) === 0 || item.tl.indexOf(" " + w) >= 0 ? 4 : 0)); }
        else if (item.hay.indexOf(" " + w) >= 0) hit = Math.max(hit, j === 0 ? 3 : 2);
        else if (w.length >= 4 && item.hay.indexOf(w) >= 0) hit = Math.max(hit, 1);
      }
      if (!hit) return 0;
      s += hit;
    }
    if (item.tl.indexOf(q) >= 0) s += 25;
    if (item.type === "tool" || item.type === "job") s += 3;
    if (item.type === "lesson") s += 2;
    return s;
  }
  var GROUPS = [
    ["tool", "Go to"], ["job", "Job types"], ["lesson", "Lessons"], ["doctor", "Problems and fixes"],
    ["technique", "Techniques"], ["mistake", "Common mistakes"], ["video", "Videos"], ["photo", "Photos"],
    ["practice", "Practice"], ["module", "Modules"], ["term", "Glossary"]
  ];
  function search(q) {
    var idx = INDEX || buildIndex();
    var toks = tokens(q);
    if (!toks.length) return { toks: toks, hits: [] };
    var ql = String(q).toLowerCase().trim();
    var hits = [];
    for (var i = 0; i < idx.length; i++) {
      var s = score(idx[i], toks, ql);
      if (s) hits.push({ item: idx[i], s: s });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    return { toks: toks, hits: hits };
  }
  function hlRe(toks) {
    var parts = [];
    toks.forEach(function (t) { variants(t).forEach(function (v) { if (v.length >= 2) parts.push(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); }); });
    parts.sort(function (a, b) { return b.length - a.length; });
    return parts.length ? new RegExp("(" + parts.join("|") + ")", "gi") : null;
  }
  function hl(text, re) {
    var e = esc(text);
    return re ? e.replace(re, "<mark>$1</mark>") : e;
  }
  function snippet(item, toks) {
    var fields = item.fields || [item.sub || ""];
    var vs = [];
    toks.forEach(function (t) { vs = vs.concat(variants(t)); });
    for (var i = 0; i < fields.length; i++) {
      var f = String(fields[i] || ""), fl = f.toLowerCase();
      for (var j = 0; j < vs.length; j++) {
        var at = fl.indexOf(vs[j]);
        if (at >= 0 && item.tl.indexOf(vs[j]) < 0) {
          var start = Math.max(0, at - 40);
          var cut = f.slice(start, start + 140);
          return (start > 0 ? "\u2026" : "") + cut + (start + 140 < f.length ? "\u2026" : "");
        }
      }
    }
    var sub = String(item.sub || "");
    return sub.length > 140 ? sub.slice(0, 138) + "\u2026" : sub;
  }

  /* ---------- recent searches ---------- */
  function recent() { try { var a = JSON.parse(lsGet(RECENT_KEY) || "[]"); return Array.isArray(a) ? a.slice(0, 6) : []; } catch (e) { return []; } }
  function remember(q) {
    q = String(q || "").trim();
    if (q.length < 2) return;
    var a = recent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); });
    a.unshift(q.slice(0, 60));
    lsSet(RECENT_KEY, JSON.stringify(a.slice(0, 6)));
  }
  var SUGGEST = ["Rivets", "Seams", "Deep recess", "Post-heat", "Edge lift", "Knifeless tape", "Storefront window", "Silvering"];

  /* ---------- search widget ---------- */
  var widgets = [];
  function makeSearch(host, opts) {
    var uid = "w9s" + widgets.length;
    var box = document.createElement("div");
    box.className = "w9-search";
    box.setAttribute("role", "search");
    box.innerHTML =
      '<label class="w9-search-box" for="' + uid + '">' + ICON_SEARCH +
      '<input type="search" id="' + uid + '" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ' +
      'placeholder="' + esc(opts.placeholder) + '" aria-label="' + esc(opts.label) + '" aria-controls="' + uid + '-r">' +
      '<button type="button" class="w9-clear" aria-label="Clear search" hidden>\u00D7</button></label>' +
      '<div class="w9-results" id="' + uid + '-r" aria-live="polite"></div>';
    host.appendChild(box);
    var input = box.querySelector("input"), clear = box.querySelector(".w9-clear"), out = box.querySelector(".w9-results");
    var w = { input: input, out: out, opts: opts, last: [] };
    widgets.push(w);
    var t = 0;
    input.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { render(w); }, 60); clear.hidden = !input.value; });
    input.addEventListener("focus", function () { if (!input.value) render(w); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        remember(input.value);
        if (opts.compact && input.value.trim()) { openSearch(input.value); return; }
        input.blur();
      } else if (e.key === "Escape") { input.value = ""; clear.hidden = true; render(w); }
    });
    clear.addEventListener("click", function () { input.value = ""; clear.hidden = true; render(w); input.focus(); });
    out.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-w9-hit],[data-w9-q],[data-w9-act]") : null;
      if (!b) return;
      if (b.hasAttribute("data-w9-q")) { input.value = b.getAttribute("data-w9-q"); clear.hidden = false; render(w); if (!opts.compact) input.focus(); return; }
      var act = b.getAttribute("data-w9-act");
      if (act === "clear-recent") { lsSet(RECENT_KEY, "[]"); render(w); toast("Recent searches cleared"); return; }
      if (act === "all") { remember(input.value); openSearch(input.value); return; }
      if (act === "coach") { remember(input.value); askCoach(input.value); return; }
      if (act === "doctor") { click("goto-problem-doctor"); return; }
      var hit = w.last[Number(b.getAttribute("data-w9-hit"))];
      if (hit) { remember(input.value); input.blur(); hit.open(); }
    });
    return w;
  }
  function render(w) {
    var q = w.input.value.trim(), out = w.out, opts = w.opts;
    if (!q) {
      if (opts.compact && document.activeElement !== w.input) { out.innerHTML = ""; return; }
      var rec = recent(), html = "";
      if (rec.length) {
        html += '<div class="w9-recent"><div class="w9-recent-head"><h3>Recent</h3><button type="button" class="w9-more" data-w9-act="clear-recent">Clear</button></div><div class="w9-chips">' +
          rec.map(function (r) { return '<button type="button" class="chip" data-w9-q="' + esc(r) + '">' + esc(r) + "</button>"; }).join("") + "</div></div>";
      }
      html += '<div class="w9-recent"><div class="w9-recent-head"><h3>Try</h3></div><div class="w9-chips">' +
        SUGGEST.map(function (r) { return '<button type="button" class="chip" data-w9-q="' + esc(r) + '">' + esc(r) + "</button>"; }).join("") + "</div></div>";
      out.innerHTML = html;
      return;
    }
    var res = search(q), re = hlRe(res.toks), per = opts.compact ? 2 : 6, maxTotal = opts.compact ? 6 : 200;
    w.last = [];
    if (!res.hits.length) {
      out.innerHTML = '<div class="w9-empty"><div class="w9-empty-icon" aria-hidden="true">\uD83D\uDD0D</div><h3>No match for \u201C' + esc(q) + '\u201D</h3>' +
        '<p>Try a shorter word or a part of the job.</p><div class="w9-chips">' +
        SUGGEST.slice(0, 5).map(function (r) { return '<button type="button" class="chip" data-w9-q="' + esc(r) + '">' + esc(r) + "</button>"; }).join("") +
        '</div><button type="button" class="secondary" data-w9-act="coach">Ask Coach about \u201C' + esc(q.slice(0, 40)) + '\u201D</button></div>';
      return;
    }
    var byType = {};
    res.hits.forEach(function (h) { (byType[h.item.type] = byType[h.item.type] || []).push(h.item); });
    var html2 = '<p class="w9-count">' + res.hits.length + (res.hits.length === 1 ? " result" : " results") + "</p>", shown = 0;
    if (opts.compact) {
      /* Home: best hits first, mixed, then "See all". */
      res.hits.slice(0, maxTotal).forEach(function (h) { html2 += hitHtml(w, h.item, res.toks, re); shown++; });
    } else {
      /* Groups in order of their best hit, so an exact glossary or video title is not buried under Lessons. */
      var best = {};
      res.hits.forEach(function (h) { if (!(h.item.type in best)) best[h.item.type] = h.s; });
      GROUPS.slice().sort(function (x, y) { return (best[y[0]] || 0) - (best[x[0]] || 0) || GROUPS.indexOf(x) - GROUPS.indexOf(y); }).forEach(function (g) {
        var items = byType[g[0]];
        if (!items || !items.length) return;
        html2 += '<div class="w9-group"><h3>' + esc(g[1]) + " \u00B7 " + items.length + "</h3>";
        var lim = w.expanded === g[0] ? items.length : per;
        items.slice(0, lim).forEach(function (it) { html2 += hitHtml(w, it, res.toks, re); shown++; });
        if (items.length > lim) html2 += '<button type="button" class="w9-more" data-w9-expand="' + g[0] + '">Show all ' + items.length + "</button>";
        html2 += "</div>";
      });
    }
    if (opts.compact && res.hits.length > shown) html2 += '<button type="button" class="w9-more" data-w9-act="all">See all ' + res.hits.length + " results \u2192</button>";
    if (!opts.compact) html2 += '<button type="button" class="w9-more" data-w9-act="coach">Not it? Ask Coach about \u201C' + esc(q.slice(0, 40)) + "\u201D</button>";
    out.innerHTML = html2;
    var ex = out.querySelectorAll("[data-w9-expand]");
    for (var i = 0; i < ex.length; i++) ex[i].addEventListener("click", function (e) { w.expanded = e.currentTarget.getAttribute("data-w9-expand"); render(w); });
  }
  function hitHtml(w, it, toks, re) {
    var n = w.last.length;
    w.last.push(it);
    var locked = it.lockedFn ? it.lockedFn() : false;
    return '<button type="button" class="w9-hit" data-w9-hit="' + n + '">' +
      '<span class="w9-hit-icon" aria-hidden="true">' + esc(it.icon || "\u2022") + "</span>" +
      '<span class="w9-hit-body"><span class="w9-hit-title">' + hl(it.title, re) + "</span>" +
      '<span class="w9-hit-snip">' + hl(snippet(it, toks), re) + "</span></span>" +
      (locked ? '<span class="w9-lock">Pack</span>' : "") + "</button>";
  }
  function askCoach(q) {
    click("goto-coach");
    setTimeout(function () {
      var inp = $("coach-input");
      if (inp) { inp.value = q; try { inp.focus(); } catch (e) {} }
    }, 80);
  }

  /* ---------- screens built here ---------- */
  function section(id, label, inner) {
    var s = $("screen-" + id);
    if (s) return s;
    s = document.createElement("section");
    s.id = "screen-" + id;
    s.className = "screen";
    s.setAttribute("aria-label", label);
    s.innerHTML = '<button type="button" class="back-link" data-w9-back>\u2190 Back</button>' + inner;
    var nav = $("bottom-nav");
    document.body.insertBefore(s, nav || null);
    return s;
  }
  var backTo = "home";
  function rememberFrom() { var a = activeScreen(); if (a && a !== "search" && a !== "settings" && a !== "help") backTo = a; }
  function goBack() {
    var c = core();
    if (!c) return;
    if (backTo === "home" || !backTo) { goHome(); return; }
    c.showScreen(backTo);
  }

  var searchW = null;
  function openSearch(q) {
    rememberFrom();
    var s = section("search", "Search", "<h1>Search</h1>");
    if (!searchW) searchW = makeSearch(s, { placeholder: "Lessons, fixes, videos, terms", label: "Search WRAP 911" });
    show("search");
    searchW.input.value = q || "";
    searchW.input.parentNode.querySelector(".w9-clear").hidden = !searchW.input.value;
    searchW.expanded = "";
    render(searchW);
    setTimeout(function () { try { searchW.input.focus(); } catch (e) {} }, 30);
  }

  function planLine() {
    var chip = $("plan-chip");
    var t = chip ? chip.textContent.trim() : "";
    return t || (paid() ? "Unlocked" : "Free look");
  }
  function appVersion() {
    return VERSION;
  }
  function openSettings() {
    rememberFrom();
    var s = section("settings", "Settings", '<h1>Settings</h1><div id="w9-settings-body"></div>');
    var ios = isIOSApp();
    var size = lsGet(TEXT_KEY) || "standard";
    var photosOn = lsGet(PHOTOS_KEY) !== "off";
    var email = cfg().contactEmail || "info@wrap911.com";
    var body = "" +
      '<div class="w9-list"><h2>Plan</h2>' +
      '<div class="w9-row"><span>Current plan</span><span class="w9-val">' + esc(planLine()) + "</span></div>" +
      '<button type="button" class="w9-row" data-w9-set="plans"><span>' + (ios ? "Plans" : "Pricing and unlock") + '</span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      (ios ? '<button type="button" class="w9-row" data-w9-set="restore"><span>Restore purchases<span class="w9-row-sub">Shop Pack, Seat, or 7-Day Pass bought with this Apple ID</span></span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' : "") +
      "</div>" +
      '<div class="w9-list"><h2>Display</h2>' +
      '<div class="w9-row"><span>Text size</span><span class="w9-seg" role="group" aria-label="Text size">' +
      [["standard", "A", "Standard text"], ["large", "A+", "Large text"], ["xl", "A++", "Largest text"]].map(function (o) {
        return '<button type="button" data-w9-size="' + o[0] + '" aria-label="' + o[2] + '" aria-pressed="' + (size === o[0]) + '">' + o[1] + "</button>";
      }).join("") + "</span></div>" +
      '<label class="w9-row" for="w9-photos-toggle"><span>Background photos<span class="w9-row-sub">Shop photos behind each screen</span></span>' +
      '<span class="w9-switch"><input type="checkbox" role="switch" id="w9-photos-toggle"' + (photosOn ? " checked" : "") + '><span></span></span></label>' +
      "</div>" +
      '<div class="w9-list"><h2>Help</h2>' +
      '<button type="button" class="w9-row" data-w9-set="help"><span>Help and FAQ</span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      '<button type="button" class="w9-row" data-w9-set="feedback"><span>Send feedback<span class="w9-row-sub">' + esc(email) + '</span></span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      '<button type="button" class="w9-row" data-w9-set="contact"><span>Contact</span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      '<button type="button" class="w9-row" data-w9-set="rules"><span>Shop rules</span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      "</div>" +
      '<div class="w9-list"><h2>Your data</h2>' +
      '<div class="w9-row"><span>Progress, jobs, and settings stay on this phone. Nothing here needs an account.</span></div>' +
      '<button type="button" class="w9-row" data-w9-set="clear-recent"><span>Clear recent searches</span></button>' +
      '<button type="button" class="w9-row danger" data-w9-set="reset"><span>Reset training progress<span class="w9-row-sub">XP, streak, quiz and drill results. Your plan stays.</span></span></button>' +
      '<button type="button" class="w9-row danger" data-w9-set="jobs"><span>Delete saved jobs</span></button>' +
      "</div>" +
      '<div class="w9-list"><h2>Legal</h2>' +
      '<a class="w9-row" href="' + PRIVACY + '" target="_blank" rel="noopener"><span>Privacy policy</span><span class="w9-chev" aria-hidden="true">\u2197</span></a>' +
      (ios ? '<a class="w9-row" href="' + EULA + '" target="_blank" rel="noopener"><span>Terms of Use (Apple EULA)</span><span class="w9-chev" aria-hidden="true">\u2197</span></a>' : "") +
      "</div>" +
      '<div class="w9-list"><h2>About</h2>' +
      '<div class="w9-row"><span>Version</span><span class="w9-val" id="w9-version">Trainer ' + esc(appVersion()) + "</span></div>" +
      '<div class="w9-row"><span>Films covered</span><span class="w9-val">' + esc((cfg().brands || ["3M", "Avery Dennison", "BriteLine"]).join(", ")) + "</span></div>" +
      "</div>" +
      '<p class="w9-fine">WRAP 911 is an independent trainer. Not affiliated with Wrap Technologies, Wrap Campus, or The Wrap Institute. Levels in the app are internal shop levels, not a brand certification.</p>';
    $("w9-settings-body").innerHTML = body;
    if (!s.getAttribute("data-w9-wired")) {
      s.setAttribute("data-w9-wired", "1");
      s.addEventListener("click", onSettingsClick);
      s.addEventListener("change", function (e) {
        if (e.target && e.target.id === "w9-photos-toggle") {
          lsSet(PHOTOS_KEY, e.target.checked ? "on" : "off");
          applyPrefs();
          toast(e.target.checked ? "Background photos on" : "Background photos off");
        }
      });
    }
    show("settings");
    nativeVersion();
  }
  function nativeVersion() {
    try {
      var A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (!A || !A.getInfo) return;
      A.getInfo().then(function (i) {
        var el = $("w9-version");
        if (el && i && i.version) el.textContent = "App " + i.version + (i.build ? " (" + i.build + ")" : "") + " \u00B7 Trainer " + VERSION;
      }).catch(function () {});
    } catch (e) {}
  }
  function onSettingsClick(e) {
    var b = e.target.closest ? e.target.closest("[data-w9-set],[data-w9-size]") : null;
    if (!b) return;
    if (b.hasAttribute("data-w9-size")) {
      lsSet(TEXT_KEY, b.getAttribute("data-w9-size"));
      applyPrefs();
      var all = b.parentNode.querySelectorAll("button");
      for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-pressed", String(all[i] === b));
      return;
    }
    var k = b.getAttribute("data-w9-set");
    if (k === "plans") click("goto-pricing");
    else if (k === "restore") restorePurchases();
    else if (k === "help") openHelp();
    else if (k === "feedback") sendFeedback();
    else if (k === "contact") { var c = core(); if (c) { c.renderContact(); c.showScreen("contact"); } }
    else if (k === "rules") show("rules");
    else if (k === "clear-recent") { lsSet(RECENT_KEY, "[]"); toast("Recent searches cleared"); }
    else if (k === "reset") {
      confirmSheet("Reset training progress?", "This clears XP, streak, and quiz, lesson, and drill results on this phone. Your plan and saved jobs stay.", "Reset", function () {
        try { localStorage.removeItem("wrap911_progress"); } catch (e2) {}
        var c2 = core();
        try { if (c2) { c2.updateXpChip(); c2.renderHome(); } } catch (e3) {}
        toast("Training progress reset");
      });
    } else if (k === "jobs") {
      confirmSheet("Delete saved jobs?", "This deletes every job saved on this phone. It cannot be undone.", "Delete", function () {
        var key = (core() && core().JOBS_KEY) || "wrap911_jobs";
        try { localStorage.removeItem(key); } catch (e4) {}
        toast("Saved jobs deleted");
      });
    }
  }
  function restorePurchases() {
    /* iOS only. Uses the Apple restore button that iap.js renders on Pricing. */
    click("goto-pricing");
    var n = 0;
    (function find() {
      var b = $("iap-restore");
      if (b) { b.scrollIntoView({ block: "center" }); b.click(); return; }
      if (++n < 20) setTimeout(find, 100);
      else toast("Open Plans and tap Restore.");
    })();
  }
  function sendFeedback() {
    var email = cfg().contactEmail || "info@wrap911.com";
    var where = isIOSApp() ? "iOS app" : (isNative() ? "app" : "web");
    var body = "\n\n\u2014\nWRAP 911 Trainer " + VERSION + " (" + where + ")\nPlan: " + planLine() + "\nScreen: " + (backTo || "home");
    var href = "mailto:" + email + "?subject=" + encodeURIComponent("WRAP 911 app feedback") + "&body=" + encodeURIComponent(body);
    try { window.location.href = href; } catch (e) {}
    setTimeout(function () { toast("Opening Mail. If nothing opens, email " + email); }, 400);
  }

  function faq(q, a, attr) {
    return "<details" + (attr || "") + "><summary>" + esc(q) + "</summary>" + a.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</details>";
  }
  function openHelp() {
    rememberFrom();
    var s = section("help", "Help and FAQ", '<h1>Help and FAQ</h1><div id="w9-help-body"></div>');
    var c = cfg(), ios = isIOSApp(), email = c.contactEmail || "info@wrap911.com";
    var fp = c.freePhotoSamples || 14, fv = c.freeVideoSamples || 8, fl = (c.freeLessonIds || []).length || 3;
    var df = c.doctorFreePerDay || 1, dp = c.doctorPaidPerDay || 15;
    var html = "" +
      '<div class="w9-list w9-faq"><h2>Get started</h2><ol class="w9-steps">' +
      "<li>Tap <strong>Learn a job</strong> and pick the vehicle or surface you are wrapping.</li>" +
      "<li>Open a lesson: techniques, tools, common mistakes, then the steps.</li>" +
      "<li>Stuck on a job? Send a photo to <strong>Problem Doctor</strong>, or search the problem.</li>" +
      "<li>Lock it in with <strong>Practice</strong> and drills.</li></ol></div>" +
      '<div class="w9-list w9-faq"><h2>Questions</h2>' +
      faq("What is WRAP 911?", ["A shop trainer for commercial vinyl installs: box trucks, vans, trailers, storefronts, fleet, and RVs. It is built by a commercial installer with 8 years on the tools, from real jobs, including the mistakes."]) +
      faq("What do I get for free?", ["Shop rules, Coach, " + fp + " shop photos, " + fv + " sample videos, " + fl + " sample lessons, and " + df + " Problem Doctor read a day."]) +
      faq("What does the full trainer unlock?", ["Every lesson, photo, and video, plus drills, the job manager, the material calculator, and up to " + dp + " Problem Doctor reads a day."]) +
      (ios
        ? faq("How do I buy or restore?", ["Open Plans and pick Shop Pack, Seat, or 7-Day Pass. Payment goes through your Apple ID.", "New phone or reinstalled the app? Settings, then Restore purchases."])
        : faq("How do I buy?", ["Open Pricing and unlock. Shop Pack covers five phones and is the default for a crew. Seat covers one tech.", "For the other phones on a Shop Pack, email " + email + " with your receipt and we send your crew code."])) +
      faq("How does Problem Doctor work?", ["Take a clear photo or a short video of the problem area, add a note about the film and the surface, and send it. You get the likely cause, the fix, and how to stop it next time.", "Keep faces, plates, and customer names out of the shot."]) +
      faq("Why are there no heat temperatures?", ["Every film is different. Heat and post-heat always follow the film's TDS from 3M, Avery Dennison, or BriteLine. Guessing a number is how films get burned or lift."]) +
      faq("Which films does it cover?", ["3M, Avery Dennison, and BriteLine. Use cast film for rivets, deep recesses, and compound curves."]) +
      faq("Does it work without a signal?", [ios
        ? "Lessons, photos, drills, and saved jobs work offline. Coach and Problem Doctor need a signal."
        : "Screens and photos you have opened work offline. Coach, Problem Doctor, and videos need a signal."]) +
      faq("Is this a certification?", ["No. The levels in the app are internal shop levels to track training. They are not a 3M, Avery Dennison, or BriteLine certification."]) +
      faq("Where is my progress saved?", ["On this phone only. Deleting the app" + (ios ? "" : " or clearing browser data") + " erases it. You can reset it any time in Settings."]) +
      faq("The text is too small.", ["Settings, then Text size. Pick A+ or A++."]) +
      faq("Something is wrong or missing.", ["Tap Send feedback below. Tell us the screen and what happened. A screenshot helps."]) +
      "</div>" +
      '<div class="w9-list w9-faq"><h2>Glossary</h2>' +
      GLOSSARY.map(function (g) { return faq(g[0], [g[1]], ' data-w9-term="' + esc(g[0]) + '"'); }).join("") +
      "</div>" +
      '<div class="w9-list"><h2>Still stuck?</h2>' +
      '<button type="button" class="w9-row" data-w9-help="feedback"><span>Send feedback<span class="w9-row-sub">' + esc(email) + '</span></span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      '<button type="button" class="w9-row" data-w9-help="coach"><span>Ask Coach</span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      '<button type="button" class="w9-row" data-w9-help="search"><span>Search WRAP 911</span><span class="w9-chev" aria-hidden="true">\u203A</span></button>' +
      "</div>";
    $("w9-help-body").innerHTML = html;
    if (!s.getAttribute("data-w9-wired")) {
      s.setAttribute("data-w9-wired", "1");
      s.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("[data-w9-help]") : null;
        if (!b) return;
        var k = b.getAttribute("data-w9-help");
        if (k === "feedback") sendFeedback();
        else if (k === "coach") click("goto-coach");
        else if (k === "search") openSearch("");
      });
    }
    show("help");
  }

  /* ---------- per-list filters ---------- */
  var FILTERS = [
    { list: "library-list", item: ".lib-card", heads: "h2", ph: "Filter lessons", what: "lessons" },
    { list: "video-list", item: ".video-card", ph: "Filter videos", what: "videos" },
    { list: "photo-list", item: ".card:not(.teaser-paywall)", ph: "Filter photos", what: "photos" },
    { list: "practice-hub-list", item: ".card", ph: "Filter practice", what: "practice" },
    { list: "jobs-list", item: ".card, .job-card, li", ph: "Filter jobs", what: "jobs", minItems: 4 }
  ];
  function setupFilters() {
    FILTERS.forEach(function (f) {
      var list = $(f.list);
      if (!list || list.getAttribute("data-w9-filter")) return;
      list.setAttribute("data-w9-filter", "1");
      var wrap = document.createElement("div");
      wrap.className = "w9-filter";
      wrap.innerHTML = '<label class="w9-search-box">' + ICON_SEARCH +
        '<input type="search" enterkeyhint="search" autocomplete="off" placeholder="' + esc(f.ph) + '" aria-label="' + esc(f.ph) + '">' +
        '<button type="button" class="w9-clear" aria-label="Clear filter" hidden>\u00D7</button></label>';
      list.parentNode.insertBefore(wrap, list);
      var empty = document.createElement("div");
      empty.className = "w9-empty w9-hide";
      list.parentNode.insertBefore(empty, list.nextSibling);
      var input = wrap.querySelector("input"), clear = wrap.querySelector(".w9-clear");
      f.input = input;
      function apply() {
        var q = input.value.trim().toLowerCase(), toks = tokens(q);
        var items = list.querySelectorAll(f.item), visible = 0, total = 0;
        if (f.minItems) wrap.classList.toggle("w9-hide", items.length < f.minItems && !q);
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          if (it.classList.contains("teaser-paywall")) continue;
          total++;
          var txt = " " + (it.textContent || "").toLowerCase() + " ";
          var ok = true;
          for (var j = 0; j < toks.length && ok; j++) {
            var vs = variants(toks[j]), any = false;
            for (var k = 0; k < vs.length; k++) if (txt.indexOf(vs[k]) >= 0) { any = true; break; }
            ok = any;
          }
          it.classList.toggle("w9-hide", !ok);
          if (ok && it.style.display !== "none") visible++;
        }
        if (f.heads) {
          var hs = list.querySelectorAll(f.heads);
          for (var h = 0; h < hs.length; h++) {
            var n = hs[h].nextElementSibling, any2 = false;
            while (n && !n.matches(f.heads)) { if (n.matches(f.item) && !n.classList.contains("w9-hide")) any2 = true; n = n.nextElementSibling; }
            hs[h].classList.toggle("w9-hide", !!q && !any2);
          }
        }
        if (q && total && !visible) {
          empty.innerHTML = '<div class="w9-empty-icon" aria-hidden="true">\uD83D\uDD0D</div><h3>No ' + esc(f.what) + " match \u201C" + esc(input.value.trim()) + '\u201D</h3>' +
            '<p>Clear the filter, or search everything.</p><button type="button" class="secondary" data-w9-f="clear">Clear filter</button> ' +
            '<button type="button" data-w9-f="all">Search everything</button>';
          empty.classList.remove("w9-hide");
        } else empty.classList.add("w9-hide");
      }
      f.apply = apply;
      input.addEventListener("input", function () { clear.hidden = !input.value; apply(); });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); input.blur(); } });
      clear.addEventListener("click", function () { input.value = ""; clear.hidden = true; apply(); });
      empty.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("[data-w9-f]") : null;
        if (!b) return;
        if (b.getAttribute("data-w9-f") === "clear") { input.value = ""; clear.hidden = true; apply(); }
        else openSearch(input.value);
      });
      new MutationObserver(function () { apply(); }).observe(list, { childList: true });
      apply();
    });
  }

  /* ---------- empty states for lists the app renders as one plain line ---------- */
  function upgradeEmpty() {
    var jl = $("jobs-list");
    if (jl && jl.children.length === 1 && /No jobs yet/i.test(jl.textContent || "") && !jl.querySelector(".w9-empty")) {
      jl.innerHTML = '<div class="w9-empty"><div class="w9-empty-icon" aria-hidden="true">\uD83D\uDCCB</div><h3>No jobs yet</h3>' +
        "<p>Tap + New job to keep the job type, film brand, coverage, and notes on this phone.</p></div>";
    }
    var vl = $("video-list");
    if (vl && vl.children.length === 1 && /No clips in this category/i.test(vl.textContent || "")) {
      vl.innerHTML = '<div class="w9-empty"><div class="w9-empty-icon" aria-hidden="true">\uD83C\uDFAC</div><h3>No clips here yet</h3><p>Pick another category, or check back after the next update.</p></div>';
    }
  }

  /* ---------- offline banner ---------- */
  var offEl = null;
  function setOnline(firstRun) {
    if (!offEl) {
      offEl = document.createElement("div");
      offEl.className = "w9-offline";
      offEl.setAttribute("role", "status");
      offEl.hidden = true;
      var h = document.querySelector(".app-header");
      if (h && h.parentNode) h.parentNode.insertBefore(offEl, h.nextSibling);
      else document.body.insertBefore(offEl, document.body.firstChild);
    }
    var on = navigator.onLine !== false;
    offEl.innerHTML = "<strong>Offline.</strong> Lessons, photos, and drills you have opened still work. Coach and Problem Doctor need a signal.";
    offEl.hidden = on;
    if (!firstRun) toast(on ? "Back online" : "You are offline");
  }

  /* ---------- header buttons, back buttons, aria ---------- */
  function setupHeader() {
    var h = document.querySelector(".app-header");
    if (!h || h.querySelector(".w9-header-actions")) return;
    var box = document.createElement("div");
    box.className = "w9-header-actions";
    box.innerHTML = '<button type="button" class="w9-icon-btn" id="w9-open-search" aria-label="Search">' + ICON_SEARCH + "</button>" +
      '<button type="button" class="w9-icon-btn" id="w9-open-settings" aria-label="Settings">' + ICON_GEAR + "</button>";
    var meta = h.querySelector(".header-meta");
    h.insertBefore(box, meta || null);
    $("w9-open-search").addEventListener("click", function () { openSearch(""); });
    $("w9-open-settings").addEventListener("click", openSettings);
    var nav = $("bottom-nav");
    if (nav) nav.setAttribute("aria-label", "Main");
  }
  function setupHome() {
    var home = $("screen-home");
    if (!home || home.querySelector(".w9-search")) return;
    var lead = home.querySelector(".lead");
    var host = document.createElement("div");
    if (lead && lead.nextSibling) home.insertBefore(host, lead.nextSibling); else home.insertBefore(host, home.firstChild);
    makeSearch(host, { compact: true, placeholder: "Search rivets, seams, recesses\u2026", label: "Search lessons, fixes, and videos" });
  }
  function addBack(id) {
    var s = $("screen-" + id);
    if (!s || s.querySelector(".back-link")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "back-link";
    b.textContent = "\u2190 Back to home";
    b.addEventListener("click", goHome);
    s.insertBefore(b, s.firstChild);
  }
  function syncNav() {
    var nav = $("bottom-nav");
    if (!nav) return;
    var bs = nav.querySelectorAll("button");
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].classList.contains("active")) bs[i].setAttribute("aria-current", "page");
      else bs[i].removeAttribute("aria-current");
    }
  }
  function onScreenChange() {
    syncNav();
    upgradeEmpty();
    var name = activeScreen();
    /* Close the home quick results when leaving home. */
    if (name !== "home") widgets.forEach(function (w) { if (w.opts.compact) { w.input.value = ""; var c = w.input.parentNode.querySelector(".w9-clear"); if (c) c.hidden = true; w.out.innerHTML = ""; } });
  }
  function applyPrefs() {
    var size = lsGet(TEXT_KEY) || "standard";
    if (size === "standard") document.documentElement.removeAttribute("data-w9-text");
    else document.documentElement.setAttribute("data-w9-text", size);
    document.body.classList.toggle("w9-no-photos", lsGet(PHOTOS_KEY) === "off");
  }

  function wireGlobal() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest("[data-w9-back]")) { goBack(); return; }
      if (t.closest("[data-w9-newjob]")) { click("btn-new-job"); return; }
      if (t.closest("#btn-save-job")) setTimeout(function () { var fb = $("job-fb"); if (fb && /saved/i.test(fb.textContent || "")) toast("Job saved"); }, 50);
    });
  }

  function cssLink() {
    if (document.querySelector('link[href*="css/polish.css"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "css/polish.css?v=" + VERSION;
    document.head.appendChild(l);
  }

  var booted = false;
  function boot() {
    if (booted) return true;
    var c = core();
    if (!c || !c.showScreen) return false;
    booted = true;
    applyPrefs();
    setupHeader();
    setupHome();
    addBack("pricing");
    addBack("drills");
    setupFilters();
    setOnline(true);
    window.addEventListener("online", function () { setOnline(false); });
    window.addEventListener("offline", function () { setOnline(false); });
    wireGlobal();
    var screens = document.querySelectorAll(".screen");
    var mo = new MutationObserver(onScreenChange);
    for (var i = 0; i < screens.length; i++) mo.observe(screens[i], { attributes: true, attributeFilter: ["class"] });
    var nav = $("bottom-nav");
    if (nav) new MutationObserver(syncNav).observe(nav, { subtree: true, attributes: true, attributeFilter: ["class"] });
    var jl = $("jobs-list"); if (jl) new MutationObserver(upgradeEmpty).observe(jl, { childList: true });
    var vl = $("video-list"); if (vl) new MutationObserver(upgradeEmpty).observe(vl, { childList: true });
    onScreenChange();
    /* Data files can finish after core; rebuild the index once they are all in. */
    setTimeout(function () { INDEX = null; }, 1500);
    return true;
  }

  window.WRAP911_POLISH = { openSearch: openSearch, openSettings: openSettings, openHelp: openHelp, search: search, toast: toast, version: VERSION };
  cssLink();
  function start() {
    if (boot()) return;
    var n = 0;
    var t = setInterval(function () { n++; if (boot() || n > 80) clearInterval(t); }, 100);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
