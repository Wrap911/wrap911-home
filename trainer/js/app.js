/* WRAP 911 Trainer — boot. Loads the local core, then honors ?lesson= deep links.
   Audit 2026-09-26: removed the jsDelivr fallback that pulled a stale pinned commit of old app code. */
(function () {
  var lessonDone = false;
  function after() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core) return;
    try {
      if (localStorage.getItem("wrap911_rules_accepted") === "1") {
        var active = document.querySelector(".screen.active");
        var onRules = !active || active.id === "screen-rules";
        if (onRules) {
          try { core.renderHome(); } catch (e) {}
          core.showScreen("home");
        }
        if (!lessonDone && window.WRAP911_APP.applyUrlLesson) {
          lessonDone = true;
          try { window.WRAP911_APP.applyUrlLesson(); } catch (e1) {}
        }
      }
    } catch (e2) {}
    var btn = document.getElementById("btn-accept-rules");
    var cb = document.getElementById("rules-checkbox");
    if (btn && !btn.getAttribute("data-home-fix")) {
      btn.setAttribute("data-home-fix", "1");
      btn.addEventListener("click", function () {
        if (cb && !cb.checked) return;
        try { localStorage.setItem("wrap911_rules_accepted", "1"); } catch (e3) {}
        try { core.renderHome(); } catch (e4) {}
        try { core.showScreen("home"); } catch (e5) {}
        if (window.WRAP911_APP.applyUrlLesson) {
          try { window.WRAP911_APP.applyUrlLesson(); } catch (e6) {}
        }
      });
    }
  }

  function loadLocal() {
    var s = document.createElement("script");
    s.src = "js/app-core.js?v=260";
    s.onload = function () { after(); setTimeout(after, 200); };
    s.onerror = function () {
      var key = "wrap911_core_retry";
      try {
        if (sessionStorage.getItem(key) !== "1") {
          sessionStorage.setItem(key, "1");
          location.reload();
          return;
        }
      } catch (e) {}
      document.body.insertAdjacentHTML("afterbegin", '<p class="quiz-feedback bad" style="margin:12px">Trainer did not load. Check your signal and reload.</p>');
    };
    document.head.appendChild(s);
  }

  if (window.WRAP911_APP && window.WRAP911_APP.core) {
    after();
    setTimeout(after, 200);
  } else {
    loadLocal();
  }
})();
