/* WRAP 911 Trainer — boot. Prefer local app-core, else last known CDN build. */
(function () {
  function after() {
    var core = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!core) return;
    try {
      if (localStorage.getItem("wrap911_rules_accepted") === "1") {
        try { core.renderHome(); } catch (e) {}
        core.showScreen("home");
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
      });
    }
  }

  function loadCdn() {
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/gh/Wrap911/wrap911-home@4a6584a7c87d6624a73d9df6d59cf694e5d3d093/trainer/js/app.js";
    s.onload = function () { after(); setTimeout(after, 200); };
    document.head.appendChild(s);
  }

  if (window.WRAP911_APP && window.WRAP911_APP.core) {
    after();
    setTimeout(after, 200);
  } else {
    loadCdn();
  }
})();
