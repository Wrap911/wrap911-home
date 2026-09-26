/* WRAP 911 Trainer — Games & exercises (2.6.3; 2.6.4 adds the extra Fix It Fast / Spot It sets in data/games/;
   2.6.5 hub badges show the real question pool per plan instead of the round-card count)
   Four touch games built ONLY from content already in the app:
   Step Order (lesson steps + vehicle workflow order), Fix It Fast (lesson / practice / scenario quizzes
   + Problems photo quizzes), Tool Match (workflow step tools, lesson tools), Spot It (photoLessons quiz text).
   No new temperatures, dwell times, stretch numbers, or recipes. Free look: one sample round per game.
   Screens "games" and "game" are listed in config.js freeScreens; full rounds route to Pricing. */
(function () {
  "use strict";
  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var STORE = "wrap911_games";
  var FIX_SECONDS = 60;
  var SPOT_SAMPLE = 5;
  /* Same trailer scene as pl21 and, after captions-fix, the same question. Asked once, as pl21. */
  var SPOT_SKIP = { "prob-rivet-tent": 1,
    /* 2.6.4 QA M6/M7: photo does not show what the question asks about */ "prob-tape-left": 1, "prob-short-lamp": 1,
    /* QA S12: swapped stills in 2.6.3 (2.6.4 dedupe drops these ids; kept so they can never come back). pb-cab-on stays: in 2.6.4 it always carries its own still. */
    "pb-caddy-5": 1, "pb-caddy-1": 1, "pb-cherokee": 1, "pb-cut-ex1": 1, "pb-office": 1, "pb-wall": 1, "pb-cab-done": 1,
    /* QA S13-S16: pl18 = same frame as pl12; stock photo; social-media screenshot (pb-caddy-4 in 2.6.3, pb-removal in 2.6.4); bubbles vs reflections */
    "pl18": 1, "pk-interior-sales": 1, "pb-caddy-4": 1, "pb-removal": 1, "prob-half-moon": 1 };
  var LOCK_MSG = "Full game rounds are in the pack. Free look has one sample round of each game. Pack $149 (5 seats) or seat $49.";
  var S = { game: null, round: null, timer: null, play: null };

  function $(id) { return document.getElementById(id); }
  function data() { return window.WRAP911_DATA || {}; }
  function cfg() { return window.WRAP911_CONFIG || {}; }
  function core() { return APP.core || null; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function shuffle(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = b[i]; b[i] = b[j]; b[j] = t;
    }
    return b;
  }
  function paid() {
    try { if (window.WRAP911_GATE && window.WRAP911_GATE.paid && window.WRAP911_GATE.paid()) return true; } catch (e) {}
    var c = core();
    try { return !!(c && c.hasFullAccess && c.hasFullAccess()); } catch (e2) { return false; }
  }
  function show(name) {
    var c = core();
    if (c && c.showScreen) { c.showScreen(name); return; }
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) screens[i].classList.toggle("active", screens[i].id === "screen-" + name);
    window.scrollTo(0, 0);
  }
  function goPricing() {
    var fb = $("unlock-feedback");
    if (fb) { fb.className = "quiz-feedback bad"; fb.textContent = LOCK_MSG; }
    var c = core();
    try { if (c && c.renderPricing) c.renderPricing(); } catch (e) {}
    show("pricing");
  }
  function loadStore() {
    try {
      var o = JSON.parse(localStorage.getItem(STORE) || "{}") || {};
      if (!o.best) o.best = {};
      if (!o.plays) o.plays = {};
      return o;
    } catch (e) { return { best: {}, plays: {} }; }
  }
  function saveStore(o) { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) {} }
  function bump(key) { var o = loadStore(); o.plays[key] = (o.plays[key] || 0) + 1; saveStore(o); }
  /* Existing XP system: once per round id, same modal as the drills. */
  function award(key, amount) {
    var c = core();
    if (!c || !c.awardDrillXp) return null;
    try { return c.awardDrillXp("games", key, amount); } catch (e) { return null; }
  }
  function xpLine(got, amount, earnedHint) {
    if (got === true) return "+" + amount + " XP";
    if (got === false) return "XP for this round is already banked.";
    return earnedHint || "";
  }

  /* ---------- content from the app's data ---------- */
  function lessons() { return (data().trainingLessons || []).filter(function (l) { return l && l.id; }); }
  function freeLessonList() { return cfg().freeLessonIds || []; }
  function lessonFree(id) { var l = freeLessonList(); return !l.length || l.indexOf(id) >= 0; }
  function findLesson(id) { var a = lessons(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function vehicles() { return data().vehicles || []; }
  function vehicleTitle(id) {
    var v = vehicles();
    for (var i = 0; i < v.length; i++) if (v[i].id === id) return v[i].title || v[i].name || "";
    return "";
  }
  function workflow(vid) { var w = data().workflowSteps || {}; return w[vid] || []; }
  function quizOk(q) {
    return q && q.q && q.choices && q.choices.length >= 2 && typeof q.answer === "number" && q.answer >= 0 && q.answer < q.choices.length;
  }
  function photoQuizOk(p) { return p && p.id && p.image && p.quiz && p.quiz.q && p.quiz.correct && p.quiz.wrong; }
  function freePhotoIdSet() {
    var n = cfg().freePhotoSamples || 14;
    var all = data().photoLessons || [];
    var ids = {};
    for (var i = 0; i < all.length && i < n; i++) ids[all[i].id] = true;
    return ids;
  }
  function firstFreeLessonId() {
    var l = freeLessonList();
    if (l.length && findLesson(l[0])) return l[0];
    return (lessons()[0] || {}).id;
  }
  function practiceFree(pid) {
    var all = lessons();
    for (var i = 0; i < all.length; i++) if (all[i].practiceId === pid && lessonFree(all[i].id)) return true;
    return !freeLessonList().length;
  }

  /* ---------- 2.6.4: extra sets (data/games/*.json) ----------
     Fix It Fast {q, choices, answer, sourceId, free} · Spot It {photoId, q, right, wrong, free} (right = quiz.correct).
     Rounds are built only after this settles. A failed fetch leaves the runtime-only rounds, with no error. */
  var EXTRA = { fix: [], spot: [], state: "idle", p: null };
  function getJson(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : []; }).then(function (a) { return Array.isArray(a) ? a : []; }, function () { return []; });
  }
  function loadExtras() {
    if (EXTRA.p) return EXTRA.p;
    if (typeof fetch !== "function" || typeof Promise === "undefined") { EXTRA.state = "none"; return { then: function (f) { f(); } }; }
    EXTRA.state = "loading";
    /* QA S21: Spot/Fix rounds read photoLessons, so also wait for the final photo pass (license-gate sets WRAP911_PHOTOS_READY). */
    var photos = new Promise(function (ok) {
      if (window.WRAP911_PHOTOS_READY) { ok(); return; }
      document.addEventListener("wrap911:photos-ready", function () { ok(); });
    });
    var all = Promise.all([getJson("data/games/fix-it-fast.json"), getJson("data/games/spot-it.json"), photos]).then(function (res) {
      EXTRA.fix = res[0]; EXTRA.spot = res[1]; EXTRA.state = "ready";
    }, function () { EXTRA.state = "failed"; });
    /* Never hold a game hostage to a stalled network: after 8 s, play the runtime rounds. */
    var cap = new Promise(function (ok) { setTimeout(function () { if (EXTRA.state === "loading") EXTRA.state = "timeout"; ok(); }, 8000); });
    EXTRA.p = Promise.race([all, cap]);
    return EXTRA.p;
  }
  function findPhoto(id) { var a = data().photoLessons || []; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function findIn(list, id) { list = list || []; for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i]; return null; }
  /* sourceId → {src, tag, freeOk}. Checklist drills (cl03, cl04) open the drills hub. */
  function extraSource(id) {
    var d = data(), l = findLesson(id), p, c, pr;
    if (l) return { src: { type: "lesson", id: l.id, title: l.title }, tag: "Lesson · " + l.title, freeOk: lessonFree(l.id) };
    if ((p = findPhoto(id))) return { src: { type: "photo", id: p.id, title: p.title }, tag: "Photo · " + p.title, freeOk: !!freePhotoIdSet()[p.id] };
    if ((c = findIn(d.drills && d.drills.checklistDrills, id))) return { src: { type: "drills", title: "Checklist drill" }, tag: "Checklist · " + (c.title || id), freeOk: true };
    if ((pr = findIn(d.practiceScenarios, id))) return { src: { type: "practice", id: pr.id, title: pr.title || pr.id }, tag: "Practice · " + (pr.title || pr.id), freeOk: practiceFree(pr.id) };
    return null;
  }
  function extraFix(full) {
    var out = [];
    EXTRA.fix.forEach(function (x) {
      if (!quizOk(x)) return;
      var s = extraSource(x.sourceId);
      if (!s || (!full && !(x.free === true && s.freeOk))) return;
      out.push({ q: x.q, choices: x.choices.slice(), answer: x.answer, tag: s.tag, src: s.src, extra: true });
    });
    return out;
  }
  /* Spot extras = a second question on a photo that is already in the app. Free sample: free items on free photos only. */
  function extraSpot(freeOnly) {
    var freeIds = freePhotoIdSet();
    var out = [];
    EXTRA.spot.forEach(function (x) {
      var p = x && findPhoto(x.photoId);
      if (!p || !p.image || SPOT_SKIP[p.id] || !x.q || !x.right || !x.wrong) return;
      if (freeOnly && !(x.free === true && freeIds[p.id])) return;
      var o = {};
      for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) o[k] = p[k];
      o.quiz = { q: x.q, correct: x.right, wrong: x.wrong };
      o.extra = true;
      out.push(o);
    });
    return out;
  }
  
  /* ---------- rounds ---------- */
  function orderRounds() {
    var out = [];
    var first = firstFreeLessonId();
    lessons().forEach(function (l) {
      if ((l.steps || []).length < 3) return;
      out.push({ id: "lesson:" + l.id, title: l.title, sub: (vehicleTitle(l.vehicleId) ? vehicleTitle(l.vehicleId) + " lesson" : "Lesson") + " · " + l.steps.length + " steps",
        items: l.steps.slice(), src: { type: "lesson", id: l.id, title: l.title }, free: l.id === first });
    });
    vehicles().forEach(function (v) {
      var w = workflow(v.id);
      if (w.length < 3 || v.id === "storefront") return; /* storefront steps are 4 separate lessons, not one job sequence */
      out.push({ id: "wf:" + v.id, title: (v.title || v.id) + " workflow", sub: "Job workflow · " + w.length + " steps",
        items: w.map(function (s) { return s.title; }), src: { type: "workflow", id: v.id, title: (v.title || v.id) + " workflow" }, free: false });
    });
    out.sort(function (a, b) { return (b.free ? 1 : 0) - (a.free ? 1 : 0); });
    return out;
  }

  var STOP = { tool: 1, tools: 1, per: 1, tds: 1, soft: 1, fresh: 1, or: 1, and: 1, the: 1, a: 1, of: 1, with: 1 };
  function toolTokens(t) {
    return String(t).toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w && !STOP[w]; })
      .map(function (w) { return w.length > 3 ? w.replace(/(es|s)$/, "") : w; });
  }
  /* entries: [{label, sub, tools, src}] → pairs whose tool shares no word with any other entry's tools. */
  function buildPairs(entries, max) {
    var tokSets = entries.map(function (e) {
      var set = {};
      (e.tools || []).forEach(function (t) { toolTokens(t).forEach(function (w) { set[w] = 1; }); });
      return set;
    });
    var pairs = [];
    entries.forEach(function (e, i) {
      var cands = (e.tools || []).filter(function (t) {
        if (/\btds\b/i.test(t)) return false; /* "TDS sheet", "Heat per TDS", "Application fluid if TDS allows" fit every step */
        var toks = toolTokens(t);
        if (!toks.length) return false;
        for (var j = 0; j < entries.length; j++) {
          if (j === i) continue;
          for (var k = 0; k < toks.length; k++) if (tokSets[j][toks[k]]) return false;
        }
        return true;
      });
      if (cands.length) pairs.push({ tool: cands[Math.floor(Math.random() * cands.length)], label: e.label, sub: e.sub, src: e.src, options: cands });
    });
    if (max && pairs.length > max) pairs = shuffle(pairs).slice(0, max);
    return pairs;
  }
  function toolRounds() {
    var out = [];
    var firstDone = false;
    vehicles().forEach(function (v) {
      var steps = workflow(v.id);
      var entries = steps.map(function (s) {
        return { label: s.title, sub: s.type || "", tools: s.tools || [], src: { type: "workflow", id: v.id, title: (v.title || v.id) + " workflow" } };
      });
      if (buildPairs(entries).length >= 3) {
        out.push({ id: "wf:" + v.id, title: (v.title || v.id) + " workflow", sub: "Match tools to job steps", entries: entries, free: !firstDone });
        firstDone = true;
      }
    });
    /* Lesson tool lists, five lessons per round (in library order); a round needs 3+ unambiguous tools. */
    var all = lessons();
    for (var i = 0, n = 1; i < all.length; i += 5) {
      var chunk = all.slice(i, i + 5);
      var entries = chunk.map(function (l) {
        return { label: l.title, sub: "Lesson", tools: l.tools || [], src: { type: "lesson", id: l.id, title: l.title } };
      });
      if (buildPairs(entries).length >= 3) {
        out.push({ id: "lessons:" + n, title: "Lesson tools · set " + n, sub: chunk.map(function (l) { return l.title; }).join(" · "), entries: entries, free: false });
        n++;
      }
    }
    return out;
  }
  function fixRounds() {
    return [
      { id: "sample", title: "Sample round", sub: FIX_SECONDS + " s · the 3 sample lessons and their practice drills", full: false, free: true },
      { id: "full", title: "Full round", sub: FIX_SECONDS + " s · every lesson quiz, practice drill, and job scenario", full: true, free: false }
    ];
  }
  function spotPhotos() {
    return (data().photoLessons || []).filter(function (p) { return photoQuizOk(p) && !SPOT_SKIP[p.id]; });
  }
  function spotRounds() {
    var all = spotPhotos();
    var freeIds = freePhotoIdSet();
    var sample = all.filter(function (p) { return freeIds[p.id]; }).slice(0, SPOT_SAMPLE).concat(extraSpot(true));
    var out = [{ id: "sample", title: "Sample round", sub: sample.length + " questions on free shop photos", photos: sample, free: true }];
    all = all.concat(extraSpot(false));
    var groups = {};
    var order = [];
    all.forEach(function (p) {
      var g = p.jobType || "Shop";
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(p);
    });
    order.forEach(function (g) {
      if (groups[g].length >= 3) out.push({ id: "type:" + g, title: g + " photos", sub: groups[g].length + " questions", photos: groups[g], free: false });
    });
    out.push({ id: "all", title: "All photos", sub: all.length + " questions", photos: all, free: false });
    return out;
  }

  var GAMES = [
    { id: "order", icon: "🔢", title: "Step Order", sub: "Put a real lesson's steps back in order",
      how: "The steps of a real lesson or job workflow are shuffled. Tap a step, then tap another to swap them, or use the arrows. Then check your order.",
      rounds: orderRounds, play: function (r) { playOrder(r); } },
    { id: "fix", icon: "⏱️", title: "Fix It Fast", sub: FIX_SECONDS + "-second quick fire · pick the right fix",
      how: "A job problem or question from a lesson, practice drill, or scenario. Tap the right fix. Keep the streak going before the clock runs out.",
      rounds: fixRounds, play: function (r) { playFix(r); } },
    { id: "tools", icon: "🧰", title: "Tool Match", sub: "Match each tool to its job step",
      how: "Tap a tool, then tap the job step or lesson it is listed under. Tools come from the workflow and lesson tool lists.",
      rounds: toolRounds, play: function (r) { playTools(r); } },
    { id: "spot", icon: "📸", title: "Spot It on the Photo", sub: "Read a real bay photo · answer what it shows",
      how: "A real shop photo with a question from its own lesson text. Pick the answer the photo supports.",
      rounds: spotRounds, play: function (r) { playSpot(r); } }
  ];
  function findGame(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; return null; }
  function roundOpen(r) { return paid() || !!r.free; }

  /* ---------- screens ---------- */
  function injectStyle() {
    if ($("gm-style")) return;
    var st = document.createElement("style");
    st.id = "gm-style";
    st.textContent = [
      "#screen-games,#screen-game{max-width:720px}",
      "#screen-games *,#screen-game *{overflow-wrap:anywhere}",
      ".gm-entry{border-left:3px solid #2ee6ff}",
      ".gm-entry .card-sub,.gm-card .card-sub{margin-top:.1rem}",
      ".gm-tagline{display:block;margin-top:.25rem;font-size:.8rem;color:#ffb000;font-weight:700}",
      "#screen-game .gm-how{color:var(--text-muted,#d7c4cc);margin:.2rem 0 .8rem;font-size:.92rem}",
      "#screen-game .gm-sec{margin:1rem 0 .4rem;font-size:1rem;color:#ffb000;letter-spacing:.06em;text-transform:uppercase}",
      "#screen-game .gm-hud{display:flex;gap:.4rem;margin:.3rem 0 .5rem}",
      "#screen-game .gm-pill{flex:1 1 0;min-width:0;text-align:center;background:#161018;border:1px solid #5a304c;border-radius:10px;padding:.3rem .2rem;font-size:.72rem;color:#d7c4cc;letter-spacing:.04em;text-transform:uppercase}",
      "#screen-game .gm-pill b{display:block;font-size:1.2rem;color:#ffb000;letter-spacing:0}",
      "#screen-game .gm-timebar{height:6px;background:#24182a;border-radius:4px;overflow:hidden;margin:0 0 .7rem}",
      "#screen-game .gm-timebar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ff2d8c,#ffb000);transition:width .25s linear}",
      "#screen-game .gm-q{background:#161018;border:1px solid #5a304c;border-radius:14px;padding:.75rem .85rem;margin:.2rem 0 .5rem}",
      "#screen-game .gm-q .gm-src{display:block;font-size:.72rem;color:#2ee6ff;letter-spacing:.05em;text-transform:uppercase;margin-bottom:.3rem}",
      "#screen-game .gm-q .gm-setup{display:block;color:#d7c4cc;font-size:.88rem;margin-bottom:.35rem}",
      "#screen-game .gm-q strong{display:block;font-size:1.02rem;line-height:1.35}",
      "#screen-game button.quiz-choice{min-height:48px;touch-action:manipulation}",
      "#screen-game .gm-fb{min-height:1.4rem;margin:.4rem 0;font-weight:700;font-size:.92rem}",
      "#screen-game .gm-fb.ok{color:#3dffb0}#screen-game .gm-fb.bad{color:#ff5d73}",
      "#screen-game .gm-note{color:#d7c4cc;font-size:.86rem;margin:.3rem 0 .6rem}",
      "#screen-game .gm-order{list-style:none;margin:.4rem 0 .6rem;padding:0}",
      "#screen-game .gm-row{display:flex;align-items:stretch;gap:.35rem;margin:.4rem 0}",
      "#screen-game .gm-num{flex:0 0 1.7rem;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ffb000;font-size:1.05rem}",
      "#screen-game button.gm-step{flex:1 1 auto;min-width:0;width:auto;text-align:left;font-family:var(--font);font-weight:600;letter-spacing:0;text-transform:none;font-size:.9rem;line-height:1.35;padding:.6rem .65rem;background:#1c121c;color:#fff6ee;border:1px solid #5a304c;border-radius:10px;box-shadow:inset 4px 0 0 #2ee6ff;touch-action:manipulation}",
      "#screen-game .gm-arrows{flex:0 0 44px;display:flex;flex-direction:column;gap:.3rem}",
      "#screen-game .gm-arrows button{flex:1 1 0;width:44px;min-height:40px;padding:0;font-family:var(--font);font-size:1rem;letter-spacing:0;background:#24182a;color:#ffb000;border:1px solid #5a304c;border-radius:10px;box-shadow:none;touch-action:manipulation}",
      "#screen-game .gm-arrows button:disabled{opacity:.3}",
      "#screen-game .gm-row.sel button.gm-step{border-color:#2ee6ff;box-shadow:inset 4px 0 0 #2ee6ff,0 0 0 2px #2ee6ff;background:#10262c}",
      "#screen-game .gm-row.ok button.gm-step{border-color:#3dff9a;box-shadow:inset 4px 0 0 #3dff9a;background:#123d28}",
      "#screen-game .gm-row.bad button.gm-step{border-color:#ff4d6a;box-shadow:inset 4px 0 0 #ff4d6a;background:#3d1218}",
      "#screen-game .gm-row .gm-flag{display:block;font-size:.72rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;margin-top:.2rem}",
      "#screen-game .gm-row.ok .gm-flag{color:#3dff9a}#screen-game .gm-row.bad .gm-flag{color:#ff4d6a}",
      "#screen-game .gm-actions{display:flex;flex-direction:column;gap:.5rem;margin:.7rem 0}",
      "#screen-game .gm-actions button.secondary{width:100%;padding:.7rem .8rem;min-height:44px}",
      "#screen-game .gm-match{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.5rem;margin:.4rem 0}",
      "#screen-game .gm-col{display:flex;flex-direction:column;gap:.45rem;min-width:0}",
      "#screen-game .gm-colh{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#d7c4cc;font-weight:700}",
      "#screen-game button.gm-tile{width:100%;min-height:52px;text-align:left;font-family:var(--font);font-weight:650;letter-spacing:0;text-transform:none;font-size:.86rem;line-height:1.3;padding:.5rem .55rem;background:#1c121c;color:#fff6ee;border:1px solid #5a304c;border-radius:10px;box-shadow:inset 4px 0 0 #ffb000;touch-action:manipulation}",
      "#screen-game button.gm-tile.step{box-shadow:inset 4px 0 0 #2ee6ff}",
      "#screen-game button.gm-tile small{display:block;font-weight:500;color:#d7c4cc;font-size:.72rem}",
      "#screen-game button.gm-tile.sel{border-color:#2ee6ff;box-shadow:0 0 0 2px #2ee6ff;background:#10262c}",
      "#screen-game button.gm-tile.done{border-color:#3dff9a;background:#123d28;box-shadow:inset 4px 0 0 #3dff9a;opacity:.85}",
      "#screen-game button.gm-tile.miss{border-color:#ff4d6a;background:#3d1218}",
      "#screen-game button.gm-tile .gm-pair{display:inline-block;min-width:1.3rem;margin-right:.3rem;padding:0 .25rem;border-radius:6px;background:#3dff9a;color:#09070d;font-weight:800;text-align:center}",
      "#screen-game .gm-photo{width:100%;height:auto;border-radius:14px;box-shadow:0 0 0 3px #ff2d8c,8px 8px 0 #ffb000;margin:.3rem 0 .9rem;display:block;background:#161018}",
      "#screen-game .gm-visual{font-size:.85rem;color:#d7c4cc;background:#161018;border:1px solid #5a304c;border-radius:12px;padding:.55rem .7rem;margin:.3rem 0}",
      "#screen-game .gm-score{text-align:center;background:#161018;border:1px solid #5a304c;border-radius:16px;padding:1rem .8rem;margin:.3rem 0 .8rem;box-shadow:0 0 0 2px #ff2d8c}",
      "#screen-game .gm-score .gm-big{display:block;font-family:var(--display);font-size:2.6rem;line-height:1;color:#ffb000;letter-spacing:.04em}",
      "#screen-game .gm-score .gm-lbl{display:block;color:#d7c4cc;font-size:.85rem;margin-top:.3rem}",
      "#screen-game .gm-score .gm-xp{display:block;margin-top:.45rem;color:#3dffb0;font-weight:800}",
      "#screen-game .gm-miss{list-style:none;margin:.3rem 0;padding:0}",
      "#screen-game .gm-miss li{background:#161018;border:1px solid #5a304c;border-left:3px solid #ff4d6a;border-radius:12px;padding:.6rem .7rem;margin:.45rem 0;font-size:.88rem}",
      "#screen-game .gm-miss li .gm-right{display:block;color:#3dffb0;margin-top:.25rem}",
      "#screen-game .gm-miss li button.secondary{margin-top:.45rem;width:auto;min-height:40px;font-size:.82rem}",
      "#screen-game .gm-allgood{color:#3dffb0;font-weight:700;margin:.4rem 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function injectScreens() {
    if ($("screen-games")) return;
    var nav = $("bottom-nav") || $("xp-modal");
    var hub = document.createElement("section");
    hub.id = "screen-games";
    hub.className = "screen";
    hub.setAttribute("aria-label", "Games & exercises");
    hub.innerHTML = '<button type="button" class="back-link" id="btn-back-games">← Back to home</button>' +
      '<h1>Games &amp; exercises</h1><p class="lead" id="games-lead">Quick shop games built from the lessons, workflows, and bay photos in this trainer.</p>' +
      '<div id="games-list"></div>';
    var play = document.createElement("section");
    play.id = "screen-game";
    play.className = "screen";
    play.setAttribute("aria-label", "Game");
    play.innerHTML = '<button type="button" class="back-link" id="btn-back-game">← Games</button>' +
      '<p class="module-tag" id="game-tag">Games &amp; exercises</p><h1 id="game-title">Game</h1><div id="game-body"></div>';
    if (nav && nav.parentNode) { nav.parentNode.insertBefore(hub, nav); nav.parentNode.insertBefore(play, nav); }
    else { document.body.appendChild(hub); document.body.appendChild(play); }
    $("btn-back-games").addEventListener("click", function () {
      stopTimer();
      var c = core();
      try { if (c && c.renderHome) c.renderHome(); } catch (e) {}
      show("home");
    });
    $("btn-back-game").addEventListener("click", function () {
      stopTimer();
      if (S.game && S.view !== "setup") openGame(S.game.id);
      else openHub();
    });
  }

  function entryCard(id, extra) {
    var el = document.createElement("div");
    el.className = "card tap gm-entry" + (extra ? " " + extra : "");
    el.id = id;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.innerHTML = '<div class="card-icon">🎮</div><div class="card-body"><div class="card-title">Games &amp; exercises</div>' +
      '<div class="card-sub">Step order · Fix it fast · Tool match · Spot it on the photo</div>' +
      '<span class="gm-tagline" data-gm-tag="1"></span></div>';
    el.addEventListener("click", openHub);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openHub(); } });
    return el;
  }
  function refreshTaglines() {
    var t = paid() ? "4 games · all rounds open" : "4 games · free sample round of each";
    var tags = document.querySelectorAll("[data-gm-tag]");
    for (var i = 0; i < tags.length; i++) tags[i].textContent = t;
  }
  function injectEntries() {
    var prim = $("home-primary-actions");
    if (prim && !$("goto-games")) prim.parentNode.insertBefore(entryCard("goto-games", "gm-home"), prim.nextSibling);
    var dl = $("drills-hub-list");
    if (dl && !$("goto-games-drills")) dl.parentNode.insertBefore(entryCard("goto-games-drills"), dl);
    var pl = $("practice-hub-list");
    if (pl && !$("goto-games-practice")) pl.parentNode.insertBefore(entryCard("goto-games-practice"), pl);
    refreshTaglines();
  }

  function openHub() {
    stopTimer();
    S.game = null; S.view = "hub";
    renderHub();
    show("games");
    if (EXTRA.state !== "ready") loadExtras().then(function () { if (S.view === "hub") renderHub(); });
  }
  /* 2.6.5: question pool per game for the current plan. null until the extra sets have settled, so the hub
     never shows a pre-extras number. One question = one sequence (Step Order), one quiz (Fix It Fast),
     one tool-to-step pair (Tool Match), one photo question (Spot It). Only rounds this plan can open count. */
  function poolSize(g, rounds, isPaid) {
    if (EXTRA.state === "idle" || EXTRA.state === "loading") return null;
    if (g.id === "fix") return fixPool(isPaid).length;
    var open = rounds.filter(function (r) { return isPaid || !!r.free; });
    if (g.id === "spot") {
      var pick = open.filter(function (r) { return r.id === (isPaid ? "all" : "sample"); })[0];
      return pick ? pick.photos.length : 0;
    }
    if (g.id === "tools") return open.reduce(function (t, r) { return t + buildPairs(r.entries).length; }, 0);
    return open.length;
  }
  function renderHub() {
    var list = $("games-list");
    if (!list) return;
    var isPaid = paid();
    var st = loadStore();
    list.innerHTML = "";
    GAMES.forEach(function (g) {
      var rounds = g.rounds();
      var best = g.id === "fix" ? (st.best["fix:full"] || st.best["fix:sample"] || 0) : 0;
      /* 2.6.5: the badge is the real question pool for this plan (it said "N rounds": the number of round
         cards, e.g. Fix It Fast "2 rounds" = Sample + Full, while the full pool is 100+ questions). */
      var n = poolSize(g, rounds, isPaid);
      var qs = n === null ? "" : n + (n === 1 ? " question" : " questions");
      var badge = isPaid ? (qs || "All rounds open") : "Free sample · " + (qs ? qs + " · " : "") + "more in Pack";
      var card = document.createElement("div");
      card.className = "card tap gm-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("data-game", g.id);
      card.innerHTML = '<div class="card-icon">' + g.icon + '</div><div class="card-body"><div class="card-title">' + esc(g.title) +
        '</div><div class="card-sub">' + esc(g.sub) + (best ? " · Best " + best : "") + '</div><span class="badge">' + esc(badge) + '</span></div>';
      card.addEventListener("click", function () { openGame(g.id); });
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGame(g.id); } });
      list.appendChild(card);
    });
    if (!isPaid) {
      var pay = document.createElement("div");
      pay.className = "card tap gm-pay";
      pay.setAttribute("role", "button");
      pay.innerHTML = '<div class="card-body"><div class="card-title">Every round, every lesson</div><div class="card-sub">Pack $149 (5 seats) · Seat $49 · Tap to unlock</div></div>';
      pay.addEventListener("click", goPricing);
      list.appendChild(pay);
    }
  }

  function setHeader(g, sub) {
    $("game-tag").textContent = sub ? g.title + " · " + sub : "Games & exercises";
    $("game-title").textContent = g.title;
  }
  function openGame(id) {
    stopTimer();
    loadExtras().then(function () { openGameNow(id); });
  }
  function openGameNow(id) {
    var g = findGame(id);
    if (!g) { openHub(); return; }
    S.game = g; S.view = "setup";
    setHeader(g, "");
    var rounds = g.rounds();
    var isPaid = paid();
    var st = loadStore();
    var body = $("game-body");
    body.innerHTML = '<p class="gm-how">' + esc(g.how) + '</p><h2 class="gm-sec">' + (isPaid ? "Pick a round" : "Rounds") + '</h2><div id="gm-rounds"></div>';
    var wrap = $("gm-rounds");
    rounds.forEach(function (r) {
      var open = roundOpen(r);
      var best = st.best[g.id + ":" + r.id];
      var badge = !open ? "Pack" : (!isPaid && r.free ? "Free sample" : (best != null ? "Best " + best : "Play"));
      var card = document.createElement("div");
      card.className = "card tap gm-round";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("data-round", r.id);
      card.setAttribute("data-locked", open ? "0" : "1");
      card.innerHTML = '<div class="card-body"><div class="card-title">' + esc(r.title) + '</div><div class="card-sub">' + esc(r.sub) +
        '</div><span class="badge">' + esc(badge) + '</span></div>';
      card.addEventListener("click", function () { startRound(g, r); });
      card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startRound(g, r); } });
      wrap.appendChild(card);
    });
    show("game");
  }
  function startRound(g, r) {
    stopTimer();
    if (!roundOpen(r)) { goPricing(); return; }
    if (EXTRA.state === "loading") { loadExtras().then(function () { startRound(g, r); }); return; }
    S.game = g; S.round = r; S.view = "play";
    bump(g.id + ":" + r.id);
    setHeader(g, r.title);
    g.play(r);
    show("game");
  }

  /* ---------- source links ---------- */
  function openPhotoLesson(id) {
    var c = core();
    if (c && typeof c.openPhoto === "function") { c.openPhoto(id); return; }
    var p = null;
    (data().photoLessons || []).forEach(function (x) { if (x.id === id) p = x; });
    if (!p) { show("photos"); return; }
    try { if (c && c.renderPhotosList) c.renderPhotosList(); } catch (e) {}
    var caps = document.querySelectorAll("#photo-list .photo-caption");
    for (var i = 0; i < caps.length; i++) {
      if ((caps[i].textContent || "").trim() === String(p.title).trim()) {
        var card = caps[i].closest(".card");
        if (card && card.style.display !== "none") { card.click(); return; }
      }
    }
    goPricing();
  }
  function openSource(src) {
    stopTimer();
    if (!src) return;
    if (src.type === "lesson" && APP.openLesson) { APP.openLesson(src.id); return; }
    if (src.type === "practice" && APP.openPractice) { APP.openPractice(src.id); return; }
    if (src.type === "photo") { openPhotoLesson(src.id); return; }
    if (src.type === "workflow" && APP.openVehicle) {
      APP.openVehicle(src.id);
      var tab = document.querySelector('#vehicle-tabs [data-vtab="workflow"]');
      if (tab) tab.click();
      return;
    }
    if (src.type === "drills") {
      var c = core();
      try { if (c && c.renderDrillsHub) c.renderDrillsHub(); } catch (e) {}
      show("drills");
    }
  }
  function srcLabel(src) {
    if (!src) return "";
    if (src.type === "lesson") return "Open lesson: " + src.title;
    if (src.type === "practice") return "Open practice: " + src.title;
    if (src.type === "photo") return "Open photo lesson";
    if (src.type === "workflow") return "Open " + src.title;
    if (src.type === "drills") return "Open drills";
    return "Open";
  }

  /* ---------- results ---------- */
  function renderResults(o) {
    stopTimer();
    S.view = "results";
    var body = $("game-body");
    var h = '<div class="gm-score" id="gm-results"><span class="gm-big">' + esc(o.big) + '</span><span class="gm-lbl">' + esc(o.label) + '</span>' +
      (o.extra ? '<span class="gm-lbl">' + esc(o.extra) + '</span>' : "") +
      (o.xp ? '<span class="gm-xp">' + esc(o.xp) + '</span>' : "") + '</div>';
    if (o.missed && o.missed.length) {
      h += '<h2 class="gm-sec">What you missed</h2><ul class="gm-miss">';
      o.missed.forEach(function (m, i) {
        h += '<li><span>' + esc(m.text) + '</span>' + (m.right ? '<span class="gm-right">' + esc(m.right) + '</span>' : "") +
          (m.src ? '<button type="button" class="secondary gm-src-link" data-miss="' + i + '">' + esc(srcLabel(m.src)) + ' →</button>' : "") + '</li>';
      });
      h += '</ul>';
    } else {
      h += '<p class="gm-allgood">Nothing missed. Clean round.</p>';
    }
    if (o.srcAll) h += '<div class="gm-actions"><button type="button" class="secondary" id="gm-open-src">' + esc(srcLabel(o.srcAll)) + ' →</button></div>';
    h += '<div class="gm-actions"><button type="button" id="gm-again">Play again</button>' +
      '<button type="button" class="secondary" id="gm-more">More rounds</button></div>';
    if (!paid()) h += '<div class="card tap gm-pay" id="gm-results-pay" role="button"><div class="card-body"><div class="card-title">Want every round?</div><div class="card-sub">Pack $149 (5 seats) · Seat $49 · Tap to unlock</div></div></div>';
    body.innerHTML = h;
    var links = body.querySelectorAll(".gm-src-link");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () { openSource(o.missed[Number(this.getAttribute("data-miss"))].src); });
    }
    if ($("gm-open-src")) $("gm-open-src").addEventListener("click", function () { openSource(o.srcAll); });
    $("gm-again").addEventListener("click", function () { startRound(S.game, S.round); });
    $("gm-more").addEventListener("click", function () { openGame(S.game.id); });
    if ($("gm-results-pay")) $("gm-results-pay").addEventListener("click", goPricing);
    window.scrollTo(0, 0);
  }
  function saveBest(key, score) {
    var st = loadStore();
    var prev = st.best[key];
    var isNew = prev == null || score > prev;
    if (isNew) { st.best[key] = score; saveStore(st); }
    return { best: isNew ? score : prev, isNew: isNew && score > 0 };
  }

  /* ---------- 1. Step Order ---------- */
  function playOrder(r) {
    var n = r.items.length;
    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    var order = shuffle(idx);
    var tries = 0;
    while (tries++ < 20 && order.every(function (v, k) { return v === k; })) order = shuffle(idx);
    S.play = { order: order, sel: -1, checks: 0, firstWrong: null, marks: null };
    renderOrder();
  }
  function renderOrder() {
    var r = S.round, P = S.play;
    var n = P.order.length;
    var h = '<p class="gm-note">' + esc(r.src.title) + ' — tap a step, then tap another to swap. ▲ ▼ move one place.</p><ol class="gm-order" id="gm-order">';
    P.order.forEach(function (itemIdx, pos) {
      var cls = "gm-row" + (P.sel === pos ? " sel" : "") + (P.marks ? (P.marks[pos] ? " ok" : " bad") : "");
      var flag = P.marks ? '<span class="gm-flag">' + (P.marks[pos] ? "In place" : "Out of place") + '</span>' : "";
      h += '<li class="' + cls + '" data-pos="' + pos + '"><span class="gm-num">' + (pos + 1) + '</span>' +
        '<button type="button" class="gm-step" data-act="pick" data-pos="' + pos + '">' + esc(r.items[itemIdx]) + flag + '</button>' +
        '<span class="gm-arrows"><button type="button" data-act="up" data-pos="' + pos + '" aria-label="Move up"' + (pos === 0 ? " disabled" : "") + '>▲</button>' +
        '<button type="button" data-act="down" data-pos="' + pos + '" aria-label="Move down"' + (pos === n - 1 ? " disabled" : "") + '>▼</button></span></li>';
    });
    h += '</ol><div class="gm-fb" id="gm-order-fb"></div><div class="gm-actions"><button type="button" id="gm-check">Check order</button>' +
      '<button type="button" class="secondary" id="gm-giveup">Show answer &amp; results</button></div>';
    $("game-body").innerHTML = h;
    if (P.fb) { var fb = $("gm-order-fb"); fb.className = "gm-fb " + P.fb.cls; fb.textContent = P.fb.text; }
    $("gm-order").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-act]");
      if (!b) return;
      var pos = Number(b.getAttribute("data-pos"));
      var act = b.getAttribute("data-act");
      var o = P.order;
      if (act === "up" && pos > 0) { var t = o[pos - 1]; o[pos - 1] = o[pos]; o[pos] = t; P.sel = -1; }
      else if (act === "down" && pos < o.length - 1) { var t2 = o[pos + 1]; o[pos + 1] = o[pos]; o[pos] = t2; P.sel = -1; }
      else if (act === "pick") {
        if (P.sel === -1) P.sel = pos;
        else if (P.sel === pos) P.sel = -1;
        else { var t3 = o[P.sel]; o[P.sel] = o[pos]; o[pos] = t3; P.sel = -1; }
      }
      P.marks = null; P.fb = null;
      renderOrder();
    });
    $("gm-check").addEventListener("click", checkOrder);
    $("gm-giveup").addEventListener("click", function () { finishOrder(false); });
  }
  function checkOrder() {
    var P = S.play;
    P.checks++;
    var marks = P.order.map(function (v, k) { return v === k; });
    var good = marks.filter(Boolean).length;
    if (P.firstWrong === null) {
      P.firstWrong = [];
      P.order.forEach(function (v, k) { if (v !== k) P.firstWrong.push(v); });
      P.firstGood = good;
    }
    P.marks = marks; P.sel = -1;
    if (good === marks.length) { finishOrder(true); return; }
    P.fb = { cls: "bad", text: good + " of " + marks.length + " in place. Red steps are out of place. Swap and check again." };
    renderOrder();
  }
  function finishOrder(solved) {
    var r = S.round, P = S.play;
    var n = r.items.length;
    if (P.firstWrong === null) {
      P.firstWrong = [];
      P.order.forEach(function (v, k) { if (v !== k) P.firstWrong.push(v); });
      P.firstGood = n - P.firstWrong.length;
    }
    var got = solved ? award("order:" + r.id, 15) : null;
    var best = saveBest("order:" + r.id, P.firstGood);
    var missed = P.firstWrong.sort(function (a, b) { return a - b; }).map(function (v) {
      return { text: "Step " + (v + 1) + ": " + r.items[v], right: "", src: null };
    });
    renderResults({
      big: P.firstGood + "/" + n,
      label: solved ? "In place on the first check · solved in " + P.checks + (P.checks === 1 ? " check" : " checks") : "In place on the first check · answer shown",
      extra: "Best first check: " + best.best + "/" + n,
      xp: xpLine(got, 15, solved ? "" : "Solve the order to earn XP."),
      missed: missed.length ? missed : null,
      srcAll: r.src
    });
    if (missed.length) {
      var ul = document.querySelector("#game-body .gm-miss");
      if (ul) {
        var li = document.createElement("li");
        li.style.borderLeftColor = "#3dff9a";
        li.innerHTML = "<span>Correct order:</span><span class=\"gm-right\">" + r.items.map(function (s, i) { return esc((i + 1) + ". " + s); }).join("<br>") + "</span>";
        ul.appendChild(li);
      }
    }
  }

  /* ---------- 2. Fix It Fast ---------- */
  /* Questions that only make sense on the lesson page (they point at "this lesson/photo"). */
  var CONTEXT_Q = /\bthis\b(?:\s+[\w\/-]+){0,4}\s+(lesson|photo|still|picture)\b|\bnot claim\b/i;
  function fixPool(full) {
    var items = [];
    var d = data();
    lessons().forEach(function (l) {
      if (!full && !lessonFree(l.id)) return;
      (l.quiz || []).forEach(function (q) {
        if (!quizOk(q) || CONTEXT_Q.test(q.q)) return;
        items.push({ q: q.q, choices: q.choices.slice(), answer: q.answer, tag: "Lesson · " + l.title, src: { type: "lesson", id: l.id, title: l.title } });
      });
    });
    (d.practiceScenarios || []).forEach(function (p) {
      if (!full && !practiceFree(p.id)) return;
      var src = { type: "practice", id: p.id, title: p.title || p.id };
      (p.quiz || []).forEach(function (q) {
        if (!quizOk(q) || CONTEXT_Q.test(q.q)) return;
        items.push({ q: q.q, choices: q.choices.slice(), answer: q.answer, tag: "Practice · " + src.title, src: src });
      });
      /* The practice panel problem + its own right/wrong moves (mistakes[].bad). */
      var good = (p.mistakes || []).filter(function (m) { return m && m.label && m.bad === false; });
      var bad = (p.mistakes || []).filter(function (m) { return m && m.label && m.bad === true; });
      if (p.panelDesc && bad.length >= 2) {
        good.forEach(function (g) {
          var ch = [g.label].concat(shuffle(bad).slice(0, 2).map(function (m) { return m.label; }));
          items.push({ setup: p.panelDesc, q: "Which move is right?", choices: ch, answer: 0, tag: "Practice · " + src.title, src: src });
        });
      }
    });
    if (full) {
      ((d.drills && d.drills.scenarios) || []).forEach(function (sc) {
        if (!quizOk({ q: sc.question, choices: sc.choices, answer: sc.answer })) return;
        items.push({ setup: sc.setup, q: sc.question, choices: sc.choices.slice(), answer: sc.answer, tag: "Scenario · " + (sc.title || ""), why: sc.why, src: { type: "drills", title: "Scenario picker" } });
      });
    }
    items = items.concat(extraFix(full));
    return shuffle(items);
  }
  function playFix(r) {
    var pool = fixPool(!!r.full);
    S.play = { pool: pool, i: 0, score: 0, streak: 0, bestStreak: 0, answered: 0, missed: [], ends: Date.now() + FIX_SECONDS * 1000, locked: false, over: false };
    renderFixShell();
    nextFix();
    stopTimer();
    S.timer = setInterval(tickFix, 250);
  }
  function renderFixShell() {
    $("game-body").innerHTML =
      '<div class="gm-hud"><div class="gm-pill">Time<b id="gm-time">' + FIX_SECONDS + '</b></div><div class="gm-pill">Score<b id="gm-score">0</b></div>' +
      '<div class="gm-pill">Streak<b id="gm-streak">0</b></div></div><div class="gm-timebar"><i id="gm-timebar"></i></div>' +
      '<div id="gm-fix-q"></div><div class="gm-fb" id="gm-fix-fb"></div>' +
      '<div class="gm-actions"><button type="button" class="secondary" id="gm-fix-stop">End round</button></div>';
    $("gm-fix-stop").addEventListener("click", function () { endFix("stopped"); });
  }
  function tickFix() {
    var P = S.play;
    var scr = $("screen-game");
    if (!P || P.over || !scr || !scr.classList.contains("active") || !$("gm-time")) { stopTimer(); return; }
    var left = Math.max(0, P.ends - Date.now());
    $("gm-time").textContent = String(Math.ceil(left / 1000));
    $("gm-timebar").style.width = (left / (FIX_SECONDS * 10)) + "%";
    if (left <= 0) endFix("time");
  }
  function nextFix() {
    var P = S.play;
    if (P.over) return;
    if (P.i >= P.pool.length) { endFix("deck"); return; }
    var it = P.pool[P.i];
    var order = shuffle(it.choices.map(function (c, k) { return k; }));
    P.cur = { it: it, order: order };
    P.locked = false;
    var h = '<div class="gm-q"><span class="gm-src">' + esc(it.tag) + '</span>' + (it.setup ? '<span class="gm-setup">' + esc(it.setup) + '</span>' : "") +
      '<strong>' + esc(it.q) + '</strong></div><div id="gm-fix-choices">';
    order.forEach(function (k) { h += '<button type="button" class="quiz-choice" data-k="' + k + '">' + esc(it.choices[k]) + '</button>'; });
    h += '</div>';
    $("gm-fix-q").innerHTML = h;
    var fb = $("gm-fix-fb"); fb.className = "gm-fb"; fb.textContent = "";
    $("gm-fix-choices").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-k]");
      if (!b || P.locked || P.over) return;
      P.locked = true;
      var k = Number(b.getAttribute("data-k"));
      var ok = k === it.answer;
      P.answered++;
      var btns = this.querySelectorAll("button[data-k]");
      for (var j = 0; j < btns.length; j++) {
        if (Number(btns[j].getAttribute("data-k")) === it.answer) btns[j].classList.add("correct");
      }
      if (ok) {
        P.score++; P.streak++; if (P.streak > P.bestStreak) P.bestStreak = P.streak;
        fb.className = "gm-fb ok"; fb.textContent = P.streak >= 3 ? "Right · streak " + P.streak + " 🔥" : "Right";
      } else {
        b.classList.add("wrong");
        P.streak = 0;
        P.missed.push({ text: it.q, right: "Fix: " + it.choices[it.answer], src: it.src });
        fb.className = "gm-fb bad"; fb.textContent = "Not that one. Right fix is marked.";
      }
      $("gm-score").textContent = String(P.score);
      $("gm-streak").textContent = String(P.streak);
      P.i++;
      setTimeout(nextFix, ok ? 550 : 1300);
    });
  }
  function endFix(why) {
    var P = S.play;
    if (!P || P.over) return;
    P.over = true;
    stopTimer();
    var r = S.round;
    var key = "fix:" + r.id;
    var best = saveBest(key, P.score);
    var got = P.score >= 5 ? award(key + ":5", 25) : null;
    var reason = why === "deck" ? "You cleared every question in this round." : (why === "time" ? "Time." : "Round ended.");
    renderResults({
      big: String(P.score),
      label: reason + " " + P.score + " right of " + P.answered + " answered · best streak " + P.bestStreak,
      extra: best.isNew ? "New best score!" : "Best score: " + best.best,
      xp: xpLine(got, 25, "Score 5 or more to earn XP."),
      missed: P.missed
    });
  }

  /* ---------- 3. Tool Match ---------- */
  function playTools(r) {
    var pairs = buildPairs(r.entries, 6);
    S.play = { pairs: pairs, tools: shuffle(pairs.map(function (p, i) { return i; })), steps: shuffle(pairs.map(function (p, i) { return i; })),
      done: {}, selTool: -1, selStep: -1, tries: 0, missCount: {}, missed: [] };
    renderTools();
  }
  function renderTools() {
    var P = S.play;
    var n = P.pairs.length;
    var doneN = Object.keys(P.done).length;
    var h = '<div class="gm-hud"><div class="gm-pill">Matched<b id="gm-matched">' + doneN + '/' + n + '</b></div><div class="gm-pill">Misses<b id="gm-misses">' +
      P.missed.length + '</b></div></div><p class="gm-note">Tap a tool, then the job step it belongs to.</p>' +
      '<div class="gm-match" id="gm-match"><div class="gm-col"><span class="gm-colh">Tool</span>';
    P.tools.forEach(function (i) {
      var d = P.done[i];
      h += '<button type="button" class="gm-tile tool' + (d ? " done" : "") + (P.selTool === i ? " sel" : "") + '" data-tool="' + i + '"' + (d ? " disabled" : "") + '>' +
        (d ? '<span class="gm-pair">' + d + '</span>' : "") + esc(P.pairs[i].tool) + '</button>';
    });
    h += '</div><div class="gm-col"><span class="gm-colh">Job step</span>';
    P.steps.forEach(function (i) {
      var d = P.done[i];
      h += '<button type="button" class="gm-tile step' + (d ? " done" : "") + (P.selStep === i ? " sel" : "") + '" data-step="' + i + '"' + (d ? " disabled" : "") + '>' +
        (d ? '<span class="gm-pair">' + d + '</span>' : "") + esc(P.pairs[i].label) + (P.pairs[i].sub ? '<small>' + esc(P.pairs[i].sub) + '</small>' : "") + '</button>';
    });
    h += '</div></div><div class="gm-fb" id="gm-tools-fb"></div>' +
      '<div class="gm-actions"><button type="button" class="secondary" id="gm-tools-giveup">Show answers &amp; results</button></div>';
    $("game-body").innerHTML = h;
    if (P.fb) { var fb = $("gm-tools-fb"); fb.className = "gm-fb " + P.fb.cls; fb.textContent = P.fb.text; }
    $("gm-match").addEventListener("click", function (e) {
      var b = e.target.closest("button.gm-tile");
      if (!b || b.disabled) return;
      if (b.hasAttribute("data-tool")) {
        var t = Number(b.getAttribute("data-tool"));
        P.selTool = P.selTool === t ? -1 : t;
      } else {
        var s = Number(b.getAttribute("data-step"));
        P.selStep = P.selStep === s ? -1 : s;
      }
      P.fb = null;
      if (P.selTool >= 0 && P.selStep >= 0) {
        P.tries++;
        if (P.selTool === P.selStep) {
          P.done[P.selTool] = Object.keys(P.done).length + 1;
          P.fb = { cls: "ok", text: "Match: " + P.pairs[P.selTool].tool + " → " + P.pairs[P.selTool].label };
        } else {
          var tool = P.pairs[P.selTool];
          if (!P.missCount[P.selTool]) {
            P.missed.push({ text: tool.tool + " is not for " + P.pairs[P.selStep].label + ".", right: "It is listed under: " + tool.label, src: tool.src });
          }
          P.missCount[P.selTool] = (P.missCount[P.selTool] || 0) + 1;
          P.fb = { cls: "bad", text: "Not a match. " + tool.tool + " is not listed under " + P.pairs[P.selStep].label + "." };
        }
        P.selTool = -1; P.selStep = -1;
      }
      renderTools();
      if (Object.keys(P.done).length === P.pairs.length) setTimeout(function () { finishTools(true); }, 450);
    });
    $("gm-tools-giveup").addEventListener("click", function () { finishTools(false); });
  }
  function finishTools(complete) {
    var P = S.play, r = S.round;
    if (P.finished) return;
    P.finished = true;
    var n = P.pairs.length;
    var first = 0;
    for (var i = 0; i < n; i++) if (P.done[i] && !P.missCount[i]) first++;
    if (!complete) {
      P.pairs.forEach(function (p, k) {
        if (!P.done[k] && !P.missCount[k]) P.missed.push({ text: p.tool + " was not matched.", right: "It is listed under: " + p.label, src: p.src });
      });
    }
    var got = complete ? award("tools:" + r.id, 15) : null;
    var best = saveBest("tools:" + r.id, first);
    renderResults({
      big: first + "/" + n,
      label: complete ? "Matched on the first try · " + P.tries + " taps to finish" : "Matched on the first try · answers shown",
      extra: "Best: " + best.best + "/" + n,
      xp: xpLine(got, 15, complete ? "" : "Match every tool to earn XP."),
      missed: P.missed
    });
    var ul = document.querySelector("#game-body .gm-miss") || null;
    var host = ul || document.querySelector("#game-body .gm-allgood");
    if (host) {
      var box = document.createElement(ul ? "li" : "div");
      if (!ul) box.className = "gm-note";
      else box.style.borderLeftColor = "#3dff9a";
      box.innerHTML = "<span>All pairs:</span><span class=\"gm-right\">" + P.pairs.map(function (p) { return esc(p.tool + " → " + p.label); }).join("<br>") + "</span>";
      if (ul) ul.appendChild(box); else host.parentNode.insertBefore(box, host.nextSibling);
    }
  }

  /* ---------- 4. Spot It on the Photo ---------- */
  var SPOT_STOP = { with: 1, that: 1, this: 1, film: 1, still: 1, into: 1, from: 1, there: 1, their: 1, what: 1, have: 1, does: 1,
    then: 1, only: 1, your: 1, when: 1, where: 1, which: 1, after: 1, before: 1, they: 1, them: 1, just: 1, like: 1, over: 1, onto: 1 };
  function spotTokens(t) {
    return String(t || "").toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && !SPOT_STOP[w]; })
      .map(function (w) { return w.replace(/(es|s)$/, ""); });
  }
  /* Third choice = another photo's WRONG answer that shares no content word with anything this photo's
     own text mentions (title, visual, narration, checklist, quiz). If none qualifies, the photo gets 2 choices. */
  var spotQuestionOf = {};
  function spotDistractors(p) {
    var bag = {};
    [p.title, p.visual, p.narration, (p.checklist || []).join(" "), p.quiz.q, p.quiz.correct, p.quiz.wrong].forEach(function (t) {
      spotTokens(t).forEach(function (w) { bag[w] = 1; });
    });
    var seen = {};
    return spotPhotos().filter(function (o) {
      if (o.id === p.id || o.image === p.image) return false;
      var w = o.quiz.wrong;
      if (!w || w === p.quiz.wrong || w === p.quiz.correct || seen[w]) return false;
      var toks = spotTokens(w);
      if (!toks.length) return false;
      for (var i = 0; i < toks.length; i++) if (bag[toks[i]]) return false;
      seen[w] = 1;
      spotQuestionOf[w] = o.quiz.q;
      return true;
    }).map(function (o) { return o.quiz.wrong; });
  }
  function firstWord(t) { return String(t || "").trim().split(/\s+/)[0].toLowerCase(); }
  function spotChoices(p) {
    var ch = [p.quiz.correct, p.quiz.wrong];
    var d = spotDistractors(p);
    /* Prefer a wrong answer written for the same kind of question (What… / Where… / Why…). */
    var fw = firstWord(p.quiz.q);
    var same = d.filter(function (w) { return spotQuestionOf[w] && firstWord(spotQuestionOf[w]) === fw; });
    var pick = same.length ? same : d;
    if (pick.length) ch.push(pick[Math.floor(Math.random() * pick.length)]);
    return ch;
  }
  function playSpot(r) {
    S.play = { photos: shuffle(r.photos), i: 0, score: 0, missed: [] };
    renderSpot();
  }
  function renderSpot() {
    var P = S.play;
    if (P.i >= P.photos.length) { finishSpot(); return; }
    var p = P.photos[P.i];
    var ch = spotChoices(p);
    var order = shuffle(ch.map(function (c, k) { return k; }));
    var h = '<div class="gm-hud"><div class="gm-pill">Photo<b>' + (P.i + 1) + '/' + P.photos.length + '</b></div><div class="gm-pill">Score<b id="gm-spot-score">' +
      P.score + '</b></div></div><img class="gm-photo" id="gm-spot-img" src="' + esc(p.image) + '" alt="' + esc(p.title) + '" decoding="async">' +
      '<div class="gm-q"><span class="gm-src">' + esc(p.jobType || "Shop photo") + '</span><strong>' + esc(p.quiz.q) + '</strong></div><div id="gm-spot-choices">';
    order.forEach(function (k) { h += '<button type="button" class="quiz-choice" data-k="' + k + '">' + esc(ch[k]) + '</button>'; });
    h += '</div><div class="gm-fb" id="gm-spot-fb"></div><div id="gm-spot-visual"></div>' +
      '<div class="gm-actions"><button type="button" id="gm-spot-next" disabled>' + (P.i === P.photos.length - 1 ? "See results" : "Next photo") + '</button></div>';
    $("game-body").innerHTML = h;
    var locked = false;
    $("gm-spot-choices").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-k]");
      if (!b || locked) return;
      locked = true;
      var ok = Number(b.getAttribute("data-k")) === 0;
      var btns = this.querySelectorAll("button[data-k]");
      for (var j = 0; j < btns.length; j++) if (btns[j].getAttribute("data-k") === "0") btns[j].classList.add("correct");
      var fb = $("gm-spot-fb");
      if (ok) { P.score++; fb.className = "gm-fb ok"; fb.textContent = "Right. That is what the photo shows."; }
      else {
        b.classList.add("wrong");
        fb.className = "gm-fb bad"; fb.textContent = "Not what this photo supports.";
        P.missed.push({ text: p.title + " — " + p.quiz.q, right: p.quiz.correct, src: { type: "photo", id: p.id, title: p.title } });
      }
      $("gm-spot-score").textContent = String(P.score);
      if (p.visual) $("gm-spot-visual").innerHTML = '<div class="gm-visual"><b>In the photo:</b> ' + esc(p.visual) + '</div>';
      $("gm-spot-next").disabled = false;
    });
    $("gm-spot-next").addEventListener("click", function () { P.i++; renderSpot(); window.scrollTo(0, 0); });
  }
  function finishSpot() {
    var P = S.play, r = S.round;
    var n = P.photos.length;
    var pass = P.score >= Math.ceil(n * 0.6);
    var got = pass ? award("spot:" + r.id, 20) : null;
    var best = saveBest("spot:" + r.id, P.score);
    renderResults({
      big: P.score + "/" + n,
      label: "Photos read right",
      extra: "Best: " + best.best + "/" + n,
      xp: xpLine(got, 20, "Get " + Math.ceil(n * 0.6) + " or more right to earn XP."),
      missed: P.missed
    });
  }

  function stopTimer() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }

  APP.openGames = openHub;
  APP.openGame = openGame;
  APP.games = { list: GAMES, rounds: function (id) { var g = findGame(id); return g ? g.rounds() : []; }, spotDistractors: spotDistractors, fixPool: fixPool,
    poolSize: function (id, isPaid) { var g = findGame(id); return g ? poolSize(g, g.rounds(), isPaid === undefined ? paid() : !!isPaid) : null; },
    extras: function () { return { state: EXTRA.state, fix: EXTRA.fix.length, spot: EXTRA.spot.length, fixFree: extraFix(false).length, fixAll: extraFix(true).length, spotFree: extraSpot(true).length, spotAll: extraSpot(false).length }; },
    loadExtras: loadExtras };

  function boot() {
    injectStyle();
    injectScreens();
    injectEntries();
  }
  boot();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  setTimeout(boot, 400);
  setTimeout(refreshTaglines, 1500);
  document.addEventListener("click", function () { setTimeout(refreshTaglines, 0); }, true);
})();
