/* WRAP 911 — offline Quick Fix screen (build 32). Local cards only. */
(function () {
  var Logic = window.WRAP911_QUICK_FIX_LOGIC;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function show(name) {
    var c = window.WRAP911_APP && window.WRAP911_APP.core;
    if (c && c.showScreen) c.showScreen(name);
    else {
      var s = document.querySelectorAll(".screen");
      for (var i = 0; i < s.length; i++) s[i].classList.toggle("active", s[i].id === "screen-" + name);
    }
  }

  function renderList(query) {
    var host = $("qf-results");
    if (!host || !Logic) return;
    var q = String(query || "").trim();
    var cards = q ? Logic.lookup(q).matches : Logic.allCards();
    if (!cards.length) {
      host.innerHTML = '<p class="muted">No match for that wording. Try “bubbles won’t go away”, “it won’t stick by the edge”, or pick a problem below.</p>';
      paintChips();
      return;
    }
    host.innerHTML = cards.map(function (c) {
      return '<article class="qf-card" id="qf-card-' + esc(c.id) + '">' +
        "<h2>" + esc(c.title) + "</h2>" +
        (c.stop ? '<p class="qf-stop"><strong>When to stop:</strong> ' + esc(c.stop) + "</p>" : "") +
        "<ol>" + c.steps.map(function (st) { return "<li>" + esc(st) + "</li>"; }).join("") + "</ol>" +
        "</article>";
    }).join("");
    paintChips();
    if (q && cards[0]) {
      var el = $("qf-card-" + cards[0].id);
      if (el) try { el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
    }
  }

  function paintChips() {
    var row = $("qf-chips");
    if (!row || !Logic) return;
    row.innerHTML = Logic.allCards().map(function (c) {
      return '<button type="button" class="chip qf-chip" data-qf="' + esc(c.phrases[0]) + '">' + esc(c.title) + "</button>";
    }).join("");
  }

  function openWith(query) {
    show("quick-fix");
    var inp = $("qf-input");
    if (inp && query) inp.value = query;
    renderList(query || (inp && inp.value) || "");
    if (inp) try { inp.focus(); } catch (e) {}
  }

  function init() {
    var cfg = window.WRAP911_CONFIG;
    if (cfg && cfg.freeScreens && cfg.freeScreens.indexOf("quick-fix") === -1) cfg.freeScreens.push("quick-fix");
    var back = $("btn-back-quick-fix");
    if (back) back.onclick = function () { show("home"); };
    var form = $("qf-form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      renderList(($("qf-input") && $("qf-input").value) || "");
    });
    var inp = $("qf-input");
    if (inp) inp.addEventListener("input", function () { renderList(inp.value); });
    var chips = $("qf-chips");
    if (chips) chips.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest && e.target.closest("[data-qf]");
      if (!btn) return;
      var q = btn.getAttribute("data-qf") || "";
      if (inp) inp.value = q;
      renderList(q);
    });
    document.addEventListener("click", function (e) {
      var t = e.target && e.target.closest && e.target.closest("#goto-quick-fix, #stuck-goto-quick-fix");
      if (!t) return;
      e.preventDefault();
      openWith("");
    });
    renderList("");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.WRAP911_QUICK_FIX = { open: openWith, render: renderList };
})();
