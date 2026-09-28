/* WRAP 911 — Weekly Challenge + Rank levels (v1.1)
   Challenges load from the live site first, so new weeks ship without an App Store update.
   Falls back to the copy bundled in the app when offline. Free for every phone. */
(function () {
  var LIVE_URL = "https://wrap911.github.io/wrap911-home/trainer/data/challenges.json";
  var LOCAL_URL = "data/challenges.json";
  var KEY = "wrap911_challenges";
  var RANKS = [
    { min: 0, title: "Apprentice" },
    { min: 150, title: "Installer" },
    { min: 500, title: "Pro" },
    { min: 1200, title: "Master" }
  ];
  var data = null, cur = null, st = null, timer = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function core() { return (window.WRAP911_APP && window.WRAP911_APP.core) || null; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { results: {}, weekStreak: 0, lastWeek: "" }; } catch (e) { return { results: {}, weekStreak: 0, lastWeek: "" }; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function totalXp() {
    try { var p = JSON.parse(localStorage.getItem("wrap911_progress") || "{}"); return ((p.drills && p.drills.xp) || 0) + (load().bonusXp || 0); } catch (e) { return load().bonusXp || 0; }
  }
  function rankFor(xp) {
    var r = RANKS[0], next = null;
    for (var i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i].min) { r = RANKS[i]; next = RANKS[i + 1] || null; } }
    return { title: r.title, next: next, xp: xp };
  }
  function currentWeek() {
    if (!data || !data.weeks) return null;
    var today = new Date().toISOString().slice(0, 10), pick = null;
    for (var i = 0; i < data.weeks.length; i++) { if (data.weeks[i].start <= today) pick = data.weeks[i]; }
    return pick || data.weeks[0];
  }
  function fetchJson(url) { return fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }

  function injectUi() {
    if ($("screen-challenge")) return;
    var css = document.createElement("style");
    css.textContent = ".wc-card{border:2px solid var(--accent);border-radius:14px;padding:.9rem 1rem;margin:.8rem 0;background:var(--bg-card);cursor:pointer}" +
      ".wc-card .wc-tag{color:var(--accent);font-weight:800;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase}" +
      ".wc-card .wc-title{font-size:1.15rem;font-weight:800;margin:.2rem 0}.wc-rank{display:inline-block;padding:.2rem .6rem;border-radius:999px;background:var(--accent);color:#fff;font-weight:800;font-size:.8rem}" +
      ".wc-bar{height:8px;background:var(--border);border-radius:6px;overflow:hidden;margin:.4rem 0}.wc-bar>div{height:100%;background:var(--accent)}" +
      ".wc-timer{font-weight:800;color:var(--accent-dim)}";
    document.head.appendChild(css);
    var home = $("screen-home"), anchor = $("home-primary-actions");
    if (home && anchor) {
      var card = document.createElement("div");
      card.className = "wc-card"; card.id = "wc-home-card"; card.setAttribute("role", "button"); card.tabIndex = 0;
      card.onclick = openChallenge;
      home.insertBefore(card, anchor);
    }
    var sec = document.createElement("section");
    sec.id = "screen-challenge"; sec.className = "screen";
    sec.innerHTML = '<button type="button" class="back-link" id="wc-back">← Back to home</button><div id="wc-body"></div>';
    var main = home ? home.parentNode : document.body;
    main.appendChild(sec);
    $("wc-back").onclick = function () { stopTimer(); go("home"); };
  }
  function go(name) { var c = core(); if (c && c.showScreen) c.showScreen(name); else { var s = document.querySelectorAll(".screen"); for (var i = 0; i < s.length; i++) s[i].classList.toggle("active", s[i].id === "screen-" + name); } }

  function renderHome() {
    var card = $("wc-home-card"); if (!card) return;
    var w = currentWeek(), s = load(), r = rankFor(totalXp());
    var rankHtml = '<span class="wc-rank">' + esc(r.title) + "</span> " + (r.next ? '<span class="muted">' + (r.next.min - r.xp) + " XP to " + esc(r.next.title) + "</span>" : '<span class="muted">Top rank</span>');
    if (!w) { card.innerHTML = rankHtml; return; }
    var res = s.results[w.id];
    card.innerHTML = '<div class="wc-tag">Weekly challenge</div><div class="wc-title">' + esc(w.title) + "</div>" +
      '<div class="muted">' + w.questions.length + " questions · " + w.timeLimitSec + " seconds · " + (res ? "Your best: " + res.best + "%" : "Not played yet") +
      " · Week streak " + (s.weekStreak || 0) + "</div><div style=\"margin-top:.5rem\">" + rankHtml + "</div>";
  }
  function renderRankOnProgress() {
    var host = $("screen-badges"); if (!host) return;
    var box = $("wc-rank-box");
    if (!box) { box = document.createElement("div"); box.id = "wc-rank-box"; box.className = "wc-card"; var sum = $("badges-summary"); host.insertBefore(box, sum ? sum.nextSibling : null); }
    var r = rankFor(totalXp()), pct = r.next ? Math.round(100 * (r.xp - (RANKS[RANKS.map(function (x) { return x.title; }).indexOf(r.title)].min)) / (r.next.min - RANKS[RANKS.map(function (x) { return x.title; }).indexOf(r.title)].min)) : 100;
    box.innerHTML = '<div class="wc-tag">Your rank</div><div class="wc-title">' + esc(r.title) + '</div><div class="wc-bar"><div style="width:' + pct + '%"></div></div><div class="muted">' +
      (r.next ? r.xp + " / " + r.next.min + " XP to " + esc(r.next.title) : r.xp + " XP. Top rank reached.") + "</div>";
  }

  function openChallenge() {
    cur = currentWeek(); if (!cur) return;
    st = { i: 0, right: 0, left: cur.timeLimitSec };
    go("challenge"); showQ(); stopTimer();
    timer = setInterval(function () { st.left--; var t = $("wc-time"); if (t) t.textContent = st.left + "s"; if (st.left <= 0) finish(); }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function showQ() {
    var q = cur.questions[st.i], body = $("wc-body");
    body.innerHTML = '<h1>' + esc(cur.title) + '</h1><p class="muted">Question ' + (st.i + 1) + " of " + cur.questions.length + ' · <span class="wc-timer" id="wc-time">' + st.left + 's</span></p>' +
      '<p class="lead">' + esc(q.q) + "</p>" + q.choices.map(function (c, k) { return '<button type="button" class="quiz-choice" data-k="' + k + '">' + esc(c) + "</button>"; }).join("") + '<p id="wc-fb" class="quiz-feedback"></p>';
    var btns = body.querySelectorAll(".quiz-choice");
    for (var b = 0; b < btns.length; b++) btns[b].onclick = function () { answer(+this.getAttribute("data-k"), this); };
  }
  function answer(k, el) {
    var q = cur.questions[st.i], ok = k === q.answer, fb = $("wc-fb");
    var all = $("wc-body").querySelectorAll(".quiz-choice"); for (var i = 0; i < all.length; i++) all[i].disabled = true;
    if (ok) st.right++;
    fb.className = "quiz-feedback show " + (ok ? "ok" : "bad");
    fb.textContent = ok ? "Right." : "Not quite. Right answer: " + q.choices[q.answer];
    setTimeout(function () { st.i++; if (st.i >= cur.questions.length) finish(); else showQ(); }, ok ? 700 : 1600);
  }
  function prevWeekId(id) { var d = new Date(id.slice(1) + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 7); return "w" + d.toISOString().slice(0, 10); }
  function finish() {
    if (!st || st.done) return; st.done = true; stopTimer();
    var pct = Math.round(100 * st.right / cur.questions.length), s = load(), prev = s.results[cur.id], first = !prev;
    var bonus = first ? st.right * 10 + (pct === 100 ? 25 : 0) : 0;
    s.results[cur.id] = { best: Math.max(pct, prev ? prev.best : 0), plays: (prev ? prev.plays : 0) + 1, at: Date.now() };
    if (first) { s.weekStreak = s.lastWeek === prevWeekId(cur.id) ? (s.weekStreak || 0) + 1 : 1; s.lastWeek = cur.id; s.bonusXp = (s.bonusXp || 0) + bonus; }
    save(s);
    var r = rankFor(totalXp());
    $("wc-body").innerHTML = "<h1>" + esc(cur.title) + '</h1><p class="lead">You scored ' + pct + "% (" + st.right + "/" + cur.questions.length + ")</p>" +
      (first ? "<p>+" + bonus + " XP earned. Week streak: " + s.weekStreak + "</p>" : '<p class="muted">Replay. XP counts on your first run each week.</p>') +
      '<p>Rank: <span class="wc-rank">' + esc(r.title) + "</span></p>" +
      '<button type="button" class="quiz-choice" id="wc-again">Play again</button><button type="button" class="quiz-choice" id="wc-home">Back to home</button>';
    $("wc-again").onclick = openChallenge; $("wc-home").onclick = function () { go("home"); };
    renderHome();
  }

  function init() {
    var cfg = window.WRAP911_CONFIG;
    if (cfg && cfg.freeScreens && cfg.freeScreens.indexOf("challenge") === -1) cfg.freeScreens.push("challenge");
    injectUi();
    fetchJson(LIVE_URL).catch(function () { return fetchJson(LOCAL_URL); }).then(function (d) { data = d; renderHome(); }).catch(function () { renderHome(); });
    document.addEventListener("click", function () { setTimeout(function () { renderHome(); if ($("screen-badges") && $("screen-badges").classList.contains("active")) renderRankOnProgress(); }, 50); }, true);
    renderRankOnProgress();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
