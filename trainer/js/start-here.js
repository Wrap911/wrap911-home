/* First-run Start here, a four-button home, and a short How to lesson.
   Shown once. Replay lives in More and in Settings. No prices, no codes. */
(function () {
  "use strict";
  var KEY = "wrap911_start_here_done";
  var CHOICE_KEY = "wrap911_start_here_choice";
  var CHOICES = [
    { id: "box-truck", label: "Box truck", lesson: "bt-rivet-mastery" },
    { id: "van", label: "Van", lesson: "van-deep-recess" },
    { id: "trailer", label: "Trailer", lesson: "tr-rivet-rows" },
    { id: "storefront", label: "Storefront", lesson: "sf-wet-install" },
    { id: "fleet", label: "Fleet", lesson: "fl-alignment" }
  ];
  var choice = null;
  var stepped = false;

  function $(id) { return document.getElementById(id); }
  function core() { return (window.WRAP911_APP && window.WRAP911_APP.core) || null; }
  function done() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function markDone() { try { localStorage.setItem(KEY, "1"); } catch (e) {} }
  function show(name) {
    var c = core();
    if (c && c.showScreen) c.showScreen(name);
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function lessonTitle(id) {
    var list = (window.WRAP911_DATA && window.WRAP911_DATA.trainingLessons) || [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i].title || id;
    return id;
  }
  function selected() {
    if (choice) return choice;
    try {
      var id = localStorage.getItem(CHOICE_KEY) || "";
      for (var i = 0; i < CHOICES.length; i++) if (CHOICES[i].id === id) return CHOICES[i];
    } catch (e) {}
    return CHOICES[0];
  }
  function remember(item) {
    choice = item;
    try { localStorage.setItem(CHOICE_KEY, item.id); } catch (e) {}
  }

  function css() {
    if (document.getElementById("w911-start-css")) return;
    var s = document.createElement("style");
    s.id = "w911-start-css";
    s.textContent = "" +
      "#screen-home .start-big{display:block;width:100%;margin:.55rem 0;padding:1.05rem 1rem;border-radius:16px}" +
      "#screen-home .start-big .card-title{font-size:1.35rem}" +
      "#screen-home .start-big .card-sub{font-size:1rem}" +
      "#screen-home .w9-search{display:none !important}" +
      ".start-choices{display:grid;gap:.55rem;margin:1rem 0}" +
      ".start-choices button{font-size:1.15rem;padding:.95rem}" +
      "#screen-learn .howto-pin{border:2px solid #ffb000;border-radius:16px;padding:1rem;margin:0 0 1rem}" +
      "#screen-more .card{margin:.45rem 0}";
    document.head.appendChild(s);
  }

  function ensureScreens() {
    if ($("screen-start-pick")) return;
    var parent = $("screen-home") && $("screen-home").parentNode;
    if (!parent) return;
    var html = "" +
      '<section id="screen-start-pick" class="screen" aria-label="Start here">' +
      '<h1>Start here</h1>' +
      '<p class="lead">What are you wrapping? Pick one. We will open the first lesson for that job.</p>' +
      '<div class="start-choices" id="start-choices"></div>' +
      '<button type="button" class="secondary" id="start-skip-pick">Skip</button>' +
      '</section>' +
      '<section id="screen-start-lesson" class="screen" aria-label="Your first lesson">' +
      '<h1>Your first lesson</h1>' +
      '<p class="lead" id="start-lesson-lead"></p>' +
      '<p>Read the steps, then come back. Heat only the way the film TDS says. Do not guess a number.</p>' +
      '<button type="button" id="start-open-lesson">Open this lesson</button>' +
      '<button type="button" class="secondary" id="start-lesson-next">Next: Problem Doctor</button>' +
      '<button type="button" class="secondary" id="start-skip-lesson">Skip</button>' +
      '</section>' +
      '<section id="screen-start-doctor" class="screen" aria-label="Where Problem Doctor is">' +
      '<h1>When something will not sit</h1>' +
      '<p class="lead">On Home, the button named Fix a Problem opens Problem Doctor.</p>' +
      '<p>Take a photo of the vinyl. Agree before it is sent. You get a likely cause and a fix. Follow the film TDS for 3M, Avery Dennison, or BriteLine.</p>' +
      '<button type="button" id="start-open-doctor">Open Problem Doctor</button>' +
      '<button type="button" id="start-finish">Go to Home</button>' +
      '<button type="button" class="secondary" id="start-skip-doctor">Skip</button>' +
      '</section>' +
      '<section id="screen-learn" class="screen" aria-label="Learn">' +
      '<button type="button" class="back-link" id="btn-back-learn">← Back to home</button>' +
      '<h1>Learn</h1>' +
      '<article class="howto-pin" id="howto-pin">' +
      '<p class="module-tag">Start with this</p>' +
      '<h2>How to use WRAP 911</h2>' +
      '<p>Home has four buttons.</p>' +
      '<p><strong>Learn.</strong> Pick the job you are wrapping. This lesson stays at the top.</p>' +
      '<p><strong>Fix a Problem.</strong> Opens Problem Doctor. Take a photo, agree, and read the fix. Follow the film TDS. Do not guess heat.</p>' +
      '<p><strong>Calculator.</strong> Estimate the film. The roll starts at 54 inches.</p>' +
      '<p><strong>My Jobs.</strong> Save the job type, the film brand, and notes on this phone.</p>' +
      '<p><strong>Start here.</strong> The first open asks what you are wrapping, opens one lesson, and shows Problem Doctor. Run it again from More, or from Settings, Replay Start here.</p>' +
      '<p><strong>Restore Purchases.</strong> If you already bought a Seat, Shop Pack, or 7-Day Pass with Apple, open Pricing and tap Restore Purchases. There is no code to type.</p>' +
      '<p>Films in this trainer: 3M, Avery Dennison, and BriteLine.</p>' +
      '</article>' +
      '<h2>Pick a job</h2>' +
      '<div id="learn-jobs"></div>' +
      '</section>' +
      '<section id="screen-more" class="screen" aria-label="More">' +
      '<button type="button" class="back-link" id="btn-back-more">← Back to home</button>' +
      '<h1>More</h1>' +
      '<button type="button" class="secondary" id="more-replay-start">Replay Start here</button>' +
      '<div id="screen-more-body"></div>' +
      '</section>';
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    while (wrap.firstChild) parent.appendChild(wrap.firstChild);
    var box = $("start-choices");
    CHOICES.forEach(function (item) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = item.label;
      b.addEventListener("click", function () { remember(item); showLessonStep(); });
      box.appendChild(b);
    });
    $("start-skip-pick").addEventListener("click", finish);
    $("start-skip-lesson").addEventListener("click", finish);
    $("start-skip-doctor").addEventListener("click", finish);
    $("start-open-lesson").addEventListener("click", function () {
      var item = selected();
      if (window.WRAP911_APP && window.WRAP911_APP.openLesson) window.WRAP911_APP.openLesson(item.lesson);
    });
    $("start-lesson-next").addEventListener("click", function () { show("start-doctor"); });
    $("start-open-doctor").addEventListener("click", function () {
      if (window.WRAP911_APP && window.WRAP911_APP.openProblemDoctor) window.WRAP911_APP.openProblemDoctor("home", "");
      else show("problem-doctor");
    });
    $("start-finish").addEventListener("click", finish);
    $("btn-back-learn").addEventListener("click", function () { show("home"); });
    $("btn-back-more").addEventListener("click", function () { show("home"); });
    $("more-replay-start").addEventListener("click", replay);
  }

  function showLessonStep() {
    var item = selected();
    var lead = $("start-lesson-lead");
    if (lead) lead.textContent = item.label + ": start with " + lessonTitle(item.lesson) + ".";
    show("start-lesson");
  }

  function finish() {
    markDone();
    show("home");
  }

  function replay() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    show("start-pick");
  }

  function openLearn() {
    var jobs = $("home-job-types");
    var host = $("learn-jobs");
    if (jobs && host && jobs.parentNode !== host) host.appendChild(jobs);
    if (jobs) jobs.classList.remove("hidden");
    if (window.WRAP911_APP && window.WRAP911_APP.renderJobTypeGrid) window.WRAP911_APP.renderJobTypeGrid();
    show("learn");
  }

  function openMore() { show("more"); }

  function move(id) {
    var node = $(id);
    var host = $("screen-more-body");
    if (node && host && node.parentNode !== host) host.appendChild(node);
  }

  function tidyHome() {
    ["goto-stuck", "goto-quick-fix", "goto-coach", "goto-photos", "goto-videos-primary", "goto-about",
      "goto-games", "goto-pricing", "home-gamify", "home-progress-wrap", "home-nav-cards", "home-more-tools", "home-pricing-collapse",
      "wc-home-card", "seat-plan-card"].forEach(move);
    var home = $("screen-home");
    if (!home) return;
    var notes = home.querySelectorAll(":scope > .passion-note");
    for (var i = 0; i < notes.length; i++) moveNode(notes[i]);
    var search = home.querySelector(".w9-search");
    if (search) moveNode(search);
    var pitch = home.querySelector(".teaser-pitch");
    if (pitch) moveNode(pitch);
    var learnSub = document.querySelector("#goto-learn-job .card-sub");
    if (learnSub) {
      learnSub.textContent = "Lessons for the job you are wrapping";
      learnSub.setAttribute("data-start-sub", "1");
    }
    var learn = $("goto-learn-job");
    if (learn && !$("goto-my-jobs")) {
      var title = learn.querySelector(".card-title");
      var sub = learn.querySelector(".card-sub");
      if (title) title.textContent = "Learn";
      if (sub) sub.textContent = "Lessons for the job you are wrapping";
      learn.classList.add("start-big");
      var doctor = $("goto-problem-doctor");
      if (doctor && doctor.parentNode !== learn.parentNode) learn.parentNode.appendChild(doctor);
      if (doctor) {
        var dt = doctor.querySelector(".card-title");
        var ds = doctor.querySelector(".card-sub");
        if (dt) dt.textContent = "Fix a Problem";
        if (ds) ds.textContent = "Opens Problem Doctor";
        doctor.classList.add("start-big");
      }
      var calc = $("goto-calc");
      if (calc && calc.parentNode !== learn.parentNode) learn.parentNode.appendChild(calc);
      if (calc) {
        var ct = calc.querySelector(".card-title");
        var cs = calc.querySelector(".card-sub");
        if (ct) ct.textContent = "Calculator";
        if (!cs) {
          cs = document.createElement("div");
          cs.className = "card-sub";
          calc.querySelector(".card-body").appendChild(cs);
        }
        cs.textContent = "How much film you need";
        calc.classList.add("start-big");
      }
      var jobs = document.createElement("div");
      jobs.className = "card tap start-big";
      jobs.id = "goto-my-jobs";
      jobs.setAttribute("role", "button");
      jobs.tabIndex = 0;
      jobs.innerHTML = '<div class="card-body"><div class="card-title">My Jobs</div><div class="card-sub">Notes for this phone</div></div>';
      jobs.addEventListener("click", function () { show("jobs"); });
      learn.parentNode.appendChild(jobs);
      var more = document.createElement("button");
      more.type = "button";
      more.className = "secondary";
      more.id = "goto-more";
      more.textContent = "More";
      more.addEventListener("click", openMore);
      learn.parentNode.appendChild(more);
    }
    var lead = home.querySelector(".lead");
    if (lead && !lead.getAttribute("data-start")) {
      lead.textContent = "Four places to start. Everything else is under More.";
      lead.setAttribute("data-start", "1");
    }
  }
  function moveNode(node) {
    var host = $("screen-more-body");
    if (node && host && node.parentNode !== host) host.appendChild(node);
  }

  function maybeAuto() {
    if (done() || stepped) return;
    var rules = $("screen-rules");
    var home = $("screen-home");
    if (rules && rules.classList.contains("active")) return;
    if (!home || !home.classList.contains("active")) return;
    stepped = true;
    show("start-pick");
  }

  function wireLearn() {
    var learn = $("goto-learn-job");
    if (!learn || learn.getAttribute("data-start-learn")) return;
    learn.setAttribute("data-start-learn", "1");
    learn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openLearn();
    }, true);
  }

  function boot() {
    css();
    ensureScreens();
    tidyHome();
    wireLearn();
    var home = $("screen-home");
    if (home) new MutationObserver(function () { tidyHome(); maybeAuto(); }).observe(home, { attributes: true, childList: true, subtree: false, attributeFilter: ["class"] });
    maybeAuto();
    setTimeout(tidyHome, 400);
    setTimeout(tidyHome, 1200);
  }

  window.WRAP911_START_HERE = { replay: replay, openLearn: openLearn, openMore: openMore };
  function start() {
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if ((core() && core().showScreen) || n > 40) { clearInterval(t); boot(); }
    }, 50);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
