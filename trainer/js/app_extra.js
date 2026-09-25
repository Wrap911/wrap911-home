/* WRAP 911 — full-spec screens (vehicles, lessons, workflows, practice, jobs, badges, videos, calc) */
(function () {
  "use strict";

  var APP = window.WRAP911_APP = window.WRAP911_APP || {};

  function core() { return APP.core || null; }

  function $(id) {
    var c = core();
    return c ? c.$(id) : document.getElementById(id);
  }

  function escapeHtml(s) {
    var c = core();
    if (c) return c.escapeHtml(s);
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function data() { return window.WRAP911_DATA || {}; }

  function findVehicle(id) {
    var vs = data().vehicles || [];
    for (var i = 0; i < vs.length; i++) if (vs[i].id === id) return vs[i];
    return null;
  }

  function lessonsForVehicle(vid) {
    var all = data().trainingLessons || [];
    var out = [];
    for (var i = 0; i < all.length; i++) if (all[i].vehicleId === vid) out.push(all[i]);
    return out;
  }

  function findLesson(id) {
    var all = data().trainingLessons || [];
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function findPractice(id) {
    var all = data().practiceScenarios || [];
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function findBadge(id) {
    var all = data().badges || [];
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function loadJobs() {
    try {
      var raw = localStorage.getItem("wrap911_jobs");
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveJobs(arr) {
    localStorage.setItem("wrap911_jobs", JSON.stringify(arr));
  }

  function earnBadge(badgeId) {
    var c = core();
    if (!c || !badgeId) return;
    var p = c.loadProgress();
    if (!p.badges) p.badges = {};
    if (!p.badges[badgeId]) {
      p.badges[badgeId] = { earned: true, at: Date.now() };
      p.drills.xp = (p.drills.xp || 0) + 15;
      c.saveProgress(p);
      c.updateXpChip();
      return true;
    }
    return false;
  }

  function listHtml(items, ordered) {
    var tag = ordered ? "ol" : "ul";
    var cls = ordered ? "steps-list" : "checklist";
    var html = "<" + tag + ' class="' + cls + '">';
    for (var i = 0; i < items.length; i++) html += "<li>" + escapeHtml(items[i]) + "</li>";
    html += "</" + tag + ">";
    return html;
  }

  /* ---------- Home nav cards ---------- */
  APP.renderJobTypeGrid = function () {
    var grid = $("job-type-grid");
    if (!grid) return;
    var vs = data().vehicles || [];
    grid.innerHTML = "";
    for (var i = 0; i < vs.length; i++) {
      (function (v) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "job-type-card";
        btn.innerHTML =
          '<span class="jt-icon">' + (v.icon || "📦") + "</span>" +
          '<span class="jt-title">' + escapeHtml(v.title) + "</span>" +
          '<span class="jt-sub">' + escapeHtml(v.summary || "") + "</span>";
        btn.addEventListener("click", function () { openVehicle(v.id); });
        grid.appendChild(btn);
      })(vs[i]);
    }
    if (!vs.length) {
      grid.innerHTML = '<p class="muted">No job types loaded.</p>';
    }
  };

  APP.renderHomeNav = function () {
    var wrap = $("home-nav-cards");
    if (!wrap) return;
    var c = core();
    var p = c ? c.loadProgress() : { lessons: {}, practice: {} };
    var cards = [];
    var vs = data().vehicles || [];
    for (var i = 0; i < vs.length; i++) {
      var v = vs[i];
      var ls = lessonsForVehicle(v.id);
      var done = 0;
      for (var j = 0; j < ls.length; j++) {
        if (p.lessons && p.lessons[ls[j].id] && p.lessons[ls[j].id].passed) done++;
      }
      cards.push({
        kind: "vehicle", id: v.id, icon: v.icon, title: v.title, sub: v.summary,
        badge: done + "/" + ls.length + " lessons"
      });
    }
    cards.push({ kind: "library", id: "library", icon: "📚", title: "Training Library", sub: "All lessons + internal cert levels", badge: "Browse" });
    cards.push({ kind: "practice", id: "practice-hub", icon: "🏋️", title: "Practice Mode", sub: "Rivet · Seam · Alignment · Recess", badge: "Train" });
    cards.push({ kind: "jobs", id: "jobs", icon: "📋", title: "Job Manager", sub: "Create jobs, checklist, before/after", badge: "Jobs" });
    cards.push({ kind: "badges", id: "badges", icon: "🏅", title: "Progress & Badges", sub: "Badges, modules, next lesson", badge: "Progress" });
    var draftN = (window.WRAP911_COACH && window.WRAP911_COACH.draftCount) ? window.WRAP911_COACH.draftCount() : 0;
    cards.push({
      kind: "coach", id: "coach", icon: "🤖",
      title: "AI Coach — ask + auto-sort media",
      sub: "Install Q&A offline · categorize clips into library categories",
      badge: draftN ? (draftN + " draft" + (draftN === 1 ? "" : "s")) : "Open Coach"
    });
    cards.push({
      kind: "problem-upload", id: "problem-upload", icon: "📸",
      title: "Report a problem", sub: "Show the mistake the before/after hides",
      badge: "Contribute"
    });

    wrap.innerHTML = "";
    for (var n = 0; n < cards.length; n++) {
      (function (card) {
        var el = document.createElement("div");
        el.className = "card tap home-nav-card";
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.innerHTML =
          '<div class="card-icon">' + card.icon + "</div>" +
          '<div class="card-body">' +
          '<div class="card-title">' + escapeHtml(card.title) + "</div>" +
          '<div class="card-sub">' + escapeHtml(card.sub) + "</div>" +
          '<span class="badge">' + escapeHtml(card.badge) + "</span></div>";
        function go() {
          if (card.kind === "vehicle") openVehicle(card.id);
          else if (card.kind === "library") { renderLibrary(); c.showScreen("library"); }
          else if (card.kind === "practice") { renderPracticeHub(); c.showScreen("practice-hub"); }
          else if (card.kind === "jobs") { renderJobs(); c.showScreen("jobs"); }
          else if (card.kind === "badges") { renderBadges(); c.showScreen("badges"); }
          else if (card.kind === "coach") {
            if (window.WRAP911_COACH && window.WRAP911_COACH.renderCoach) window.WRAP911_COACH.renderCoach();
            c.showScreen("coach");
          }
          else if (card.kind === "problem-upload") {
            if (window.WRAP911_APP && window.WRAP911_APP.renderProblemUpload) window.WRAP911_APP.renderProblemUpload();
            c.showScreen("problem-upload");
          }
        }
        el.addEventListener("click", go);
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
        });
        wrap.appendChild(el);
      })(cards[n]);
    }
  };

  /* ---------- Vehicle + workflow ---------- */
  function openVehicle(id) {
    var c = core();
    var v = findVehicle(id);
    if (!v || !c) return;
    c.state.vehicleId = id;
    c.state.vehicleTab = "lessons";
    $("vehicle-tag").textContent = "Vehicle module";
    $("vehicle-title").textContent = v.icon + " " + v.title;
    $("vehicle-summary").textContent = v.summary;
    var tabs = $("vehicle-tabs");
    if (tabs) {
      var btns = tabs.querySelectorAll(".mode-tab");
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("active", btns[i].getAttribute("data-vtab") === "lessons");
      }
    }
    renderVehicleLessons();
    $("vehicle-lessons").classList.remove("hidden");
    $("vehicle-workflow").classList.add("hidden");
    c.showScreen("vehicle");
  }

  function renderVehicleLessons() {
    var c = core();
    var wrap = $("vehicle-lessons");
    var p = c.loadProgress();
    var ls = lessonsForVehicle(c.state.vehicleId);
    wrap.innerHTML = '<p class="muted">Tap a lesson card. Each includes techniques, tools, mistakes, steps, 3Q quiz, badge, and practice link.</p>';
    for (var i = 0; i < ls.length; i++) {
      (function (lesson) {
        var done = p.lessons && p.lessons[lesson.id] && p.lessons[lesson.id].passed;
        var card = document.createElement("div");
        card.className = "card tap";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("data-lesson", lesson.id);
        card.innerHTML =
          '<img class="thumb" src="' + escapeHtml(lesson.media) + '" alt="" loading="lazy" style="width:72px;height:72px;object-fit:cover;border-radius:8px;flex-shrink:0">' +
          '<div class="card-body"><div class="card-title">' + escapeHtml(lesson.title) + "</div>" +
          '<div class="card-sub">3-question quiz · badge on pass</div>' +
          (done ? '<span class="badge done">Passed</span>' : '<span class="badge">Open lesson</span>') +
          "</div>";
        card.addEventListener("click", function () { openLesson(lesson.id); });
        wrap.appendChild(card);
      })(ls[i]);
    }
    var shortcut = document.createElement("div");
    shortcut.className = "card tap";
    shortcut.id = "goto-vehicle-workflow-shortcut";
    shortcut.setAttribute("role", "button");
    shortcut.setAttribute("tabindex", "0");
    shortcut.innerHTML =
      '<div class="card-icon">✅</div><div class="card-body"><div class="card-title">Open workflow assistant</div>' +
      '<div class="card-sub">Step checkboxes + progress for this vehicle</div><span class="badge">Workflow</span></div>';
    shortcut.addEventListener("click", function () { setVehicleTab("workflow"); });
    wrap.appendChild(shortcut);
  }

  function renderVehicleWorkflow() {
    var c = core();
    var wrap = $("vehicle-workflow");
    var vid = c.state.vehicleId;
    var steps = (data().workflowSteps || {})[vid] || [];
    var p = c.loadProgress();
    if (!p.workflows) p.workflows = {};
    if (!p.workflows[vid]) p.workflows[vid] = {};
    var doneMap = p.workflows[vid];
    var doneCount = 0;
    for (var i = 0; i < steps.length; i++) if (doneMap[steps[i].id]) doneCount++;
    var pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

    var html = '<div class="progress-wrap"><div class="progress-label"><span>Workflow progress</span><span>' +
      doneCount + "/" + steps.length + " (" + pct + "%)</span></div>" +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div></div>';

    for (var s = 0; s < steps.length; s++) {
      var st = steps[s];
      var checked = !!doneMap[st.id];
      html += '<div class="workflow-card' + (checked ? " done" : "") + '" data-step="' + escapeHtml(st.id) + '">';
      html += '<label class="wf-check"><input type="checkbox" data-wfid="' + escapeHtml(st.id) + '"' + (checked ? " checked" : "") + "> ";
      html += "<strong>" + escapeHtml(st.title) + '</strong> <span class="type-pill">' + escapeHtml(st.type) + "</span></label>";
      if (st.media) html += '<img class="photo-hero" src="' + escapeHtml(st.media) + '" alt="" loading="lazy">';
      else html += '<div class="video-placeholder">Video placeholder — add offline MOV later</div>';
      html += "<p>" + escapeHtml(st.instructions) + "</p>";
      html += "<p><strong>Tools:</strong> " + escapeHtml((st.tools || []).join(" · ")) + "</p>";
      html += "<p><strong>Safety:</strong> " + escapeHtml((st.safety || []).join(" · ")) + "</p>";
      html += "<p><strong>Technique:</strong> " + escapeHtml(st.technique || "") + "</p>";
      html += "<p class=\"muted\"><strong>Watch for:</strong> " + escapeHtml((st.mistakes || []).join(" · ")) + "</p>";
      html += "</div>";
    }
    wrap.innerHTML = html;

    var boxes = wrap.querySelectorAll('input[type="checkbox"][data-wfid]');
    for (var b = 0; b < boxes.length; b++) {
      boxes[b].addEventListener("change", function (ev) {
        var id = ev.target.getAttribute("data-wfid");
        var prog = c.loadProgress();
        if (!prog.workflows) prog.workflows = {};
        if (!prog.workflows[vid]) prog.workflows[vid] = {};
        prog.workflows[vid][id] = !!ev.target.checked;
        c.saveProgress(prog);
        renderVehicleWorkflow();
      });
    }
  }

  function setVehicleTab(tab) {
    var c = core();
    c.state.vehicleTab = tab;
    var tabs = $("vehicle-tabs");
    if (tabs) {
      var btns = tabs.querySelectorAll(".mode-tab");
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("active", btns[i].getAttribute("data-vtab") === tab);
      }
    }
    if (tab === "lessons") {
      $("vehicle-lessons").classList.remove("hidden");
      $("vehicle-workflow").classList.add("hidden");
      renderVehicleLessons();
    } else {
      $("vehicle-lessons").classList.add("hidden");
      $("vehicle-workflow").classList.remove("hidden");
      renderVehicleWorkflow();
    }
  }

  /* ---------- Lesson detail + 3Q quiz ---------- */
  function openLesson(id) {
    var c = core();
    var lesson = findLesson(id);
    if (!lesson || !c) return;
    c.state.lessonId = id;
    if (lesson.vehicleId) c.state.vehicleId = lesson.vehicleId;
    c.state.lessonQuizIndex = 0;
    c.state.lessonQuizLocked = false;
    c.state.lessonQuizCorrect = 0;
    var v = findVehicle(lesson.vehicleId);
    var tag = $("lesson-vehicle-tag");
    if (tag) tag.textContent = (v ? v.title : lesson.vehicleId) + " lesson";
    var titleEl = $("lesson-title");
    if (titleEl) titleEl.textContent = lesson.title;
    c.showScreen("lesson");
    var media = $("lesson-media");
    var youtubeSrc = lesson.youtube || "";
    if (!youtubeSrc) {
      var catalog = data().VIDEO_CATALOG || [];
      for (var vi = 0; vi < catalog.length; vi++) {
        var clipItem = catalog[vi];
        if (clipItem.recommendedModule === lesson.id && (clipItem.youtube || youtubeIdFrom(clipItem.src))) {
          youtubeSrc = clipItem.youtube || clipItem.src;
          break;
        }
      }
    }
    var youtubePlayId = youtubeIdFrom(youtubeSrc);
    if (media && youtubePlayId) {
      media.innerHTML = "";
      mountYoutubePlayer(media, youtubePlayId);
    } else if (media && lesson.media) {
      media.innerHTML = '<img class="photo-hero" src="' + escapeHtml(lesson.media) + '" alt="' + escapeHtml(lesson.title) + '">' +
        '<p class="muted">Photo reference (video placeholder if no MOV yet). Follow TDS for heat — never invent temperatures.</p>';
    } else {
      media.innerHTML = '<div class="video-placeholder">Video placeholder</div>';
    }
    $("lesson-techniques").innerHTML = (lesson.keyTechniques || []).map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("");
    $("lesson-tools").innerHTML = (lesson.tools || []).map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("");
    $("lesson-mistakes").innerHTML = (lesson.commonMistakes || []).map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("");
    $("lesson-steps").innerHTML = (lesson.steps || []).map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("");
    var badgeMsg = $("lesson-badge-msg");
    badgeMsg.className = "quiz-feedback hidden";
    badgeMsg.textContent = "";
    renderLessonQuiz(lesson);
  }

  function renderLessonQuiz(lesson) {
    var c = core();
    var box = $("lesson-quiz");
    var qi = c.state.lessonQuizIndex;
    var total = (lesson.quiz || []).length;
    if (qi >= total) {
      var prog = c.loadProgress();
      if (!prog.lessons) prog.lessons = {};
      prog.lessons[lesson.id] = { passed: true, at: Date.now(), score: c.state.lessonQuizCorrect + "/" + total };
      c.saveProgress(prog);
      var earned = earnBadge(lesson.badgeId);
      var b = findBadge(lesson.badgeId);
      box.innerHTML = '<div class="quiz-q">Lesson quiz complete</div><p class="lead">Score: ' +
        c.state.lessonQuizCorrect + "/" + total + ". Progress saved.</p>";
      var bm = $("lesson-badge-msg");
      bm.className = "quiz-feedback show ok";
      bm.textContent = (b ? ("Badge: " + b.icon + " " + b.title + (earned ? " earned!" : " already earned.")) : "Lesson complete.") +
        " Internal shop training only — not a brand certification.";
      return;
    }
    var item = lesson.quiz[qi];
    c.state.lessonQuizLocked = false;
    var html = '<div class="quiz-q">Question ' + (qi + 1) + " of " + total + "</div>";
    html += '<p class="quiz-q">' + escapeHtml(item.q) + "</p>";
    for (var i = 0; i < item.choices.length; i++) {
      html += '<button type="button" class="quiz-choice" data-choice="' + i + '">' + escapeHtml(item.choices[i]) + "</button>";
    }
    html += '<div class="quiz-feedback" id="lesson-quiz-fb"></div>';
    html += '<div class="quiz-nav"><button type="button" class="secondary" id="lesson-quiz-next" disabled>Next</button></div>';
    box.innerHTML = html;
    var choices = box.querySelectorAll(".quiz-choice");
    for (var j = 0; j < choices.length; j++) {
      choices[j].addEventListener("click", function () {
        if (c.state.lessonQuizLocked) return;
        c.state.lessonQuizLocked = true;
        var idx = +this.getAttribute("data-choice");
        var ok = idx === item.correctIndex;
        if (ok) c.state.lessonQuizCorrect++;
        var fb = $("lesson-quiz-fb");
        fb.className = "quiz-feedback show " + (ok ? "ok" : "bad");
        fb.textContent = ok ? "Correct." : ("Not quite. " + (item.explain || ""));
        var next = $("lesson-quiz-next");
        if (next) next.disabled = false;
      });
    }
    var nextBtn = $("lesson-quiz-next");
    if (nextBtn) {
      nextBtn.onclick = function () {
        c.state.lessonQuizIndex++;
        renderLessonQuiz(lesson);
      };
    }
  }

  /* ---------- Bind ---------- */

  function renderPracticeHub() {
    var wrap = $("practice-hub-list");
    if (!wrap) return;
    var all = data().practiceScenarios || [];
    if (!all.length) {
      wrap.innerHTML = '<p class="muted">No practice scenarios loaded.</p>';
      return;
    }
    wrap.innerHTML = "";
    all.forEach(function (prac) {
      var card = document.createElement("div");
      card.className = "card tap";
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.innerHTML = '<div class="card-body"><div class="card-title">' + escapeHtml((prac.icon ? prac.icon + " " : "") + (prac.title || prac.id)) + '</div><div class="card-sub">' + escapeHtml(prac.panelDesc || "Practice drill") + '</div></div>';
      card.addEventListener("click", function () { openPractice(prac.id); });
      wrap.appendChild(card);
    });
  }

  function openPractice(id) {
    var c = core();
    var prac = findPractice(id);
    if (!prac) {
      renderPracticeHub();
      if (c && c.showScreen) c.showScreen("practice-hub");
      return;
    }
    if (c) c.state.practiceId = id;
    var title = $("prac-title");
    if (title) title.textContent = prac.title || "Practice";
    var img = $("prac-image");
    if (img) {
      if (prac.media) {
        img.src = prac.media;
        img.alt = prac.title || "";
        img.hidden = false;
      } else {
        img.removeAttribute("src");
        img.hidden = true;
      }
    }
    var desc = $("prac-desc");
    if (desc) desc.textContent = prac.panelDesc || "";
    var scoreLbl = $("prac-score-label");
    var scoreFill = $("prac-score-fill");
    if (scoreLbl) scoreLbl.textContent = "0%";
    if (scoreFill) scoreFill.style.width = "0%";
    var cl = $("prac-checklist");
    if (cl) {
      cl.innerHTML = (prac.checklist || []).map(function (step, i) {
        return '<label class="check-inline"><input type="checkbox" data-cl="' + i + '"> ' + escapeHtml(step) + "</label>";
      }).join("");
    }
    var ms = $("prac-mistakes");
    if (ms) {
      ms.innerHTML = (prac.mistakes || []).map(function (m) {
        return '<label class="check-inline"><input type="checkbox" data-mistake="' + escapeHtml(m.id || "") + '" data-bad="' + (m.bad ? "1" : "0") + '"> ' + escapeHtml(m.label || "") + "</label>";
      }).join("");
    }
    var box = $("prac-quiz");
    if (box) {
      box.innerHTML = (prac.quiz || []).map(function (q, qi) {
        var choices = (q.choices || []).map(function (ch, ci) {
          return '<button type="button" class="choice" data-q="' + qi + '" data-c="' + ci + '">' + escapeHtml(ch) + "</button>";
        }).join("");
        return '<div class="quiz-item" data-qi="' + qi + '"><p>' + escapeHtml(q.q || "") + "</p>" + choices + "</div>";
      }).join("");
      box.onclick = function (e) {
        var btn = e.target.closest("[data-q]");
        if (!btn) return;
        var item = btn.closest(".quiz-item");
        if (!item || item.getAttribute("data-locked") === "1") return;
        var qi = parseInt(btn.getAttribute("data-q"), 10);
        var ci = parseInt(btn.getAttribute("data-c"), 10);
        var answer = ((prac.quiz || [])[qi] || {}).answer;
        item.setAttribute("data-locked", "1");
        item.setAttribute("data-pick", String(ci));
        var buttons = item.querySelectorAll("[data-c]");
        for (var b = 0; b < buttons.length; b++) {
          buttons[b].classList.toggle("selected", b === ci);
          if (b === answer) buttons[b].classList.add("correct");
          if (b === ci && ci !== answer) buttons[b].classList.add("wrong");
        }
      };
    }
    var fb = $("prac-fb");
    if (fb) { fb.textContent = ""; fb.className = "quiz-feedback"; }
    if (c && c.showScreen) c.showScreen("practice");
  }

  function finishPractice() {
    var c = core();
    var id = c && c.state ? c.state.practiceId : null;
    var prac = findPractice(id);
    if (!prac) return;
    var checks = document.querySelectorAll("#prac-checklist input[type=checkbox]");
    var checkScore = 0;
    for (var i = 0; i < checks.length; i++) if (checks[i].checked) checkScore++;
    var checkTotal = checks.length || 1;
    var mistakes = document.querySelectorAll("#prac-mistakes input[type=checkbox]");
    var mistakeScore = 0, mistakeTotal = mistakes.length || 1;
    for (var m = 0; m < mistakes.length; m++) {
      var bad = mistakes[m].getAttribute("data-bad") === "1";
      var on = mistakes[m].checked;
      if (bad ? !on : on) mistakeScore++;
    }
    var items = document.querySelectorAll("#prac-quiz .quiz-item");
    var quizScore = 0, quizTotal = (prac.quiz || []).length || 1;
    for (var q = 0; q < items.length; q++) {
      var pick = items[q].getAttribute("data-pick");
      var answer = ((prac.quiz || [])[q] || {}).answer;
      if (pick !== null && Number(pick) === answer) quizScore++;
    }
    var pct = Math.round(100 * ((checkScore / checkTotal) + (mistakeScore / mistakeTotal) + (quizScore / quizTotal)) / 3);
    var scoreLbl = $("prac-score-label");
    var scoreFill = $("prac-score-fill");
    if (scoreLbl) scoreLbl.textContent = pct + "%";
    if (scoreFill) scoreFill.style.width = pct + "%";
    var fb = $("prac-fb");
    if (fb) {
      fb.className = "quiz-feedback " + (pct >= 70 ? "good" : "bad");
      fb.textContent = pct >= 70
        ? ("Saved. " + pct + "% — pass. Back to the bay checklist, not a lecture.")
        : ("Saved. " + pct + "% — redo. Tick the real steps, leave the bad moves unchecked, answer the quiz.");
    }
    if (c && c.loadProgress && c.saveProgress) {
      var prog = c.loadProgress();
      if (!prog.practice) prog.practice = {};
      prog.practice[id] = { score: pct, at: Date.now(), passed: pct >= 70 };
      c.saveProgress(prog);
    }
    if (pct >= 70 && prac.id) earnBadge("badge-" + prac.id);
  }

  APP.renderPracticeHub = renderPracticeHub;
  APP.openPractice = openPractice;
  APP.finishPractice = finishPractice;

  APP.bindExtra = function () {
    var c = core();
    if (!c) return;

    function backHome() { c.renderHome(); c.showScreen("home"); }

    var pairs = [
      ["btn-back-vehicle", backHome],
      ["btn-back-library", backHome],
      ["btn-back-practice-hub", backHome],
      ["btn-back-jobs", backHome],
      ["btn-back-badges", backHome],
      ["btn-back-videos", backHome],
      ["btn-back-coach", backHome],
      ["btn-back-calc", backHome],
      ["btn-back-problem-upload", backHome],
      ["btn-back-lesson", function () {
        if (c.state.vehicleId) openVehicle(c.state.vehicleId);
        else { renderLibrary(); c.showScreen("library"); }
      }],
      ["btn-back-practice", function () { renderPracticeHub(); c.showScreen("practice-hub"); }],
      ["btn-back-job-edit", function () { renderJobs(); c.showScreen("jobs"); }]
    ];
    for (var i = 0; i < pairs.length; i++) {
      var el = $(pairs[i][0]);
      if (el) el.addEventListener("click", pairs[i][1]);
    }

    var gotoPU = $("goto-problem-upload");
    if (gotoPU) {
      gotoPU.addEventListener("click", function () {
        if (window.WRAP911_APP && window.WRAP911_APP.renderProblemUpload) window.WRAP911_APP.renderProblemUpload();
        c.showScreen("problem-upload");
      });
    }

    var vtabs = $("vehicle-tabs");
    if (vtabs) {
      vtabs.addEventListener("click", function (e) {
        var btn = e.target.closest(".mode-tab");
        if (!btn) return;
        setVehicleTab(btn.getAttribute("data-vtab"));
      });
    }

    var toPrac = $("lesson-to-practice");
    if (toPrac) {
      toPrac.addEventListener("click", function () {
        var lesson = findLesson(c.state.lessonId);
        if (lesson && lesson.practiceId) openPractice(lesson.practiceId);
        else { renderPracticeHub(); c.showScreen("practice-hub"); }
      });
    }

    var vfilter = $("video-filter-cat");
    if (vfilter && !vfilter.getAttribute("data-bound")) {
      vfilter.setAttribute("data-bound", "1");
      vfilter.addEventListener("change", function () { renderVideos(); });
    }
    var vchips = $("video-filter-chips");
    if (vchips && !vchips.getAttribute("data-bound")) {
      vchips.setAttribute("data-bound", "1");
      vchips.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-video-cat]");
        if (!btn) return;
        var cat = btn.getAttribute("data-video-cat") || "";
        if ($("video-filter-cat")) $("video-filter-cat").value = cat;
        renderVideos();
      });
    }

    if ($("btn-new-job")) $("btn-new-job").addEventListener("click", function () { openJobEdit(null); });
    if ($("btn-save-job") && typeof saveJob === "function") $("btn-save-job").addEventListener("click", saveJob);
    if ($("btn-delete-job") && typeof deleteJob === "function") $("btn-delete-job").addEventListener("click", deleteJob);
    if ($("job-type")) {
      $("job-type").addEventListener("change", function () {
        renderJobWorkflowChecks($("job-type").value, {});
      });
    }

    if ($("prac-redo")) $("prac-redo").addEventListener("click", function () {
      if (c.state.practiceId) openPractice(c.state.practiceId);
    });
    if ($("prac-finish") && typeof finishPractice === "function") $("prac-finish").addEventListener("click", finishPractice);

    if ($("btn-calc") && typeof runCalc === "function") $("btn-calc").addEventListener("click", runCalc);
  };

  /* Fix new job: openJobEdit when id null */
  if (typeof openJobEdit === "function") {
  var _openJobEdit = openJobEdit;
  openJobEdit = function (id) {
    if (!id) {
      var c = core();
      var job = Object.assign({}, data().defaultJob || {}, {
        id: "job-" + Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        workflowDone: {},
        materialBrand: "3M",
        jobType: "box-truck",
        coverage: "Partial sides + rear"
      });
      c.state.jobId = job.id;
      $("job-edit-title").textContent = "New job";
      var typeSel = $("job-type");
      typeSel.innerHTML = (data().vehicles || []).map(function (v) {
        return '<option value="' + v.id + '"' + (v.id === job.jobType ? " selected" : "") + ">" + escapeHtml(v.title) + "</option>";
      }).join("");
      $("job-coverage").value = job.coverage;
      $("job-brand").value = "3M";
      $("job-vehicle-photo").value = "";
      $("job-before").value = "";
      $("job-after").value = "";
      $("job-notes").value = "";
      $("job-completed").checked = false;
      $("job-fb").className = "quiz-feedback";
      $("job-fb").textContent = "";
      renderJobWorkflowChecks(job.jobType, {});
      c.showScreen("job-edit");
      return;
    }
    _openJobEdit(id);
  };

}
})();
