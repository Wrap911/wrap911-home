/* WRAP 911 — bind Open linked practice on every lesson, even if core/bindExtra miss it. */
(function () {
  "use strict";
  var APP = window.WRAP911_APP = window.WRAP911_APP || {};

  function $(id) { return document.getElementById(id); }

  function show(name) {
    var core = APP.core;
    if (core && typeof core.showScreen === "function") {
      core.showScreen(name);
      return;
    }
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle("active", screens[i].id === "screen-" + name);
    }
    window.scrollTo(0, 0);
  }

  function currentLesson() {
    var core = APP.core;
    var id = core && core.state && core.state.lessonId;
    if (!id) {
      var title = $("lesson-title");
      var t = title ? title.textContent : "";
      var lessons = (window.WRAP911_DATA && window.WRAP911_DATA.trainingLessons) || [];
      for (var i = 0; i < lessons.length; i++) {
        if (lessons[i].title === t) return lessons[i];
      }
      return null;
    }
    var all = (window.WRAP911_DATA && window.WRAP911_DATA.trainingLessons) || [];
    for (var j = 0; j < all.length; j++) if (all[j].id === id) return all[j];
    return null;
  }

  function goPractice() {
    var lesson = currentLesson();
    var pid = lesson && lesson.practiceId;
    if (pid && typeof APP.openPractice === "function") {
      APP.openPractice(pid);
      return;
    }
    if (typeof APP.renderPracticeHub === "function") APP.renderPracticeHub();
    show("practice-hub");
  }

  function bind() {
    var btn = $("lesson-to-practice");
    if (btn && !btn.getAttribute("data-practice-bound")) {
      btn.setAttribute("data-practice-bound", "1");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        goPractice();
      });
    }
    var nav = document.querySelector("nav.tabbar, nav.app-nav, #tabbar");
    if (!nav) nav = document.querySelector("nav");
    if (nav && !nav.getAttribute("data-practice-bound")) {
      nav.setAttribute("data-practice-bound", "1");
      nav.addEventListener("click", function (e) {
        var b = e.target.closest("[data-nav]");
        if (!b) return;
        if (b.getAttribute("data-nav") === "practice-hub") {
          if (typeof APP.renderPracticeHub === "function") APP.renderPracticeHub();
        }
      });
    }
    if (typeof APP.bindExtra === "function" && !APP._extraBound) {
      try { APP.bindExtra(); APP._extraBound = true; } catch (err) {}
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setTimeout(bind, 300);
  setTimeout(bind, 1200);
})();
