/* WRAP 911 — About / Pricing / For shops / FAQ / Samples screen.
   Honest copy only: no stats, no testimonials, no cert claims, no heat numbers. */
(function () {
  "use strict";
  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var CFG = window.WRAP911_CONFIG || {};
  var D = window.WRAP911_DATA || {};
  var tab = "why";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function core() { return APP.core || {}; }
  function show(name) { if (core().showScreen) core().showScreen(name); }
  function n(a) { return Array.isArray(a) ? a.length : 0; }
  function brands() { return (CFG.brands || ["3M", "Avery Dennison", "Arlon"]).join(", "); }
  function email() { return (CFG.contactEmail || "").trim(); }
  function contactLine() {
    var e = email();
    return e ? '<a href="mailto:' + esc(e) + '">' + esc(e) + '</a>' : "the contact screen";
  }
  function freeLessons() {
    var ids = CFG.freeLessonIds || [];
    return (D.trainingLessons || []).filter(function (l) { return ids.indexOf(l.id) !== -1; });
  }
  function freeVideos() {
    var cap = CFG.freeVideoSamples || 8;
    return (D.VIDEO_CATALOG || []).filter(function (v) { return v.access === "free"; }).slice(0, cap);
  }

  function why() {
    return '' +
      '<h2>Built by an installer</h2>' +
      '<p>WRAP 911 is built by ' + esc(CFG.contactName || "Gerry") + ', a commercial vinyl installer with 8 years on the tools in Worcester, MA. Not a marketing team. Not a film maker.</p>' +
      '<h2>Trains the jobs that walk in</h2>' +
      '<ul><li>Box trucks and trailers: rivets, seams, rollup doors.</li>' +
      '<li>Vans and fleet: deep recesses, handles, lights.</li>' +
      '<li>Walls, storefront glass, cabinets.</li></ul>' +
      '<h2>Real bay footage</h2>' +
      '<p>Photos and clips from real jobs. The mistake stays in, and you watch it get fixed.</p>' +
      '<h2>Shop rules baked in</h2>' +
      '<ul><li>Brands: ' + esc(brands()) + '.</li><li>Follow the TDS. The trainer never gives you a heat number.</li></ul>' +
      '<h2>On the phone</h2>' +
      '<p>Add it to the home screen. Lesson text and photos you already opened work offline. Videos need signal.</p>' +
      '<p><button type="button" data-about-go="samples">See the free samples</button></p>';
  }

  function pricing() {
    var field = CFG.fieldSkuLive ? '<div class="card"><strong>W911-FIELD · $29/mo</strong><p>One tech, month to month. To cancel, contact us.</p><p><a href="?buy=field">Start Field</a></p></div>' : "";
    return '' +
      '<div class="plan-row">' +
      '<div class="card default"><strong>W911-PACK · $149 one-time</strong><p>5 seats. 12 months. For a crew. Best value.</p><p><a href="?buy=pack"><button type="button">Buy the Shop Pack</button></a></p></div>' +
      '<div class="card"><strong>W911-SEAT · $49 one-time</strong><p>1 tech. 12 months. One phone.</p><p><a href="?buy=seat">Buy 1 seat</a></p></div>' +
      field +
      '</div>' +
      '<p class="muted">One-time plans do not auto-renew. Pay with Stripe on the phone you will train on.</p>' +
      (CFG.stripeTestMode ? '<p class="example-banner">Sandbox copy: checkout is off unless a Stripe test link is set.</p>' : "") +
      '<p><button type="button" class="secondary" data-about-go="pricing-screen">Enter an unlock code</button></p>';
  }

  function shops() {
    return '' +
      '<h2>For shop owners and crew leads</h2>' +
      '<ul><li>One Shop Pack covers 5 phones for 12 months.</li>' +
      '<li>Buy on the lead phone. Send the crew link to up to 4 more phones.</li>' +
      '<li>New hire path: shop rules, a sample lesson, practice, then Coach questions.</li>' +
      '<li>Job manager: pick a job type, tick the workflow steps.</li>' +
      '<li>Same rules for everyone: ' + esc(brands()) + ', follow the TDS, no guessing.</li></ul>' +
      '<h2>What it is not</h2>' +
      '<ul><li>Not a certification.</li><li>No admin dashboard. Progress lives on each phone.</li><li>Does not replace the lead watching the first jobs.</li></ul>';
  }

  function faq() {
    var L = n(D.trainingLessons), W = n(D.vehicles), P = n(D.practiceScenarios), PH = n(D.photoLessons), V = (D.VIDEO_CATALOG || []).length;
    var q = [
      ["What do I get?", "About " + L + " lessons, " + W + " job workflows, " + P + " practice runs, " + PH + " photo lessons, " + V + " video clips, drills, Coach and a material calculator. Everything opens after unlock."],
      ["How does unlock work?", "Buy with Stripe on the phone you train on. Stripe sends you back and that phone unlocks. A Shop Pack also gives a crew link for 4 more phones."],
      ["How long does it last?", "Seat and Pack: 12 months from unlock, one payment, no auto-renew. Field: monthly while you pay."],
      ["Refunds?", "Ask first: " + contactLine() + ". Send your Stripe receipt."],
      ["I cleared my browser and lost access.", "The unlock lives on the phone. Contact " + contactLine() + " with your receipt."],
      ["Is this a certification?", "No. It is shop training. It is not a 3M, Avery Dennison or Arlon certification, and it does not replace one."],
      ["Are you affiliated with anyone?", "No. Not affiliated with Wrap Technologies, Wrap Campus or The Wrap Institute. Not endorsed by 3M, Avery Dennison or Arlon."],
      ["Does it give heat or temperature numbers?", "No. Heat, post-heat and cleaning come from the film's TDS. Read the sheet for the film on the job."],
      ["Does it work offline?", "Lesson text and photos you already opened work offline. Videos need signal."]
    ];
    return q.map(function (x) { return '<details><summary>' + esc(x[0]) + '</summary><p>' + x[1] + '</p></details>'; }).join("");
  }

  function samples() {
    var ls = freeLessons().map(function (l) {
      return '<li><a href="#" data-about-lesson="' + esc(l.id) + '">' + esc(l.title) + '</a></li>';
    }).join("");
    var vs = freeVideos().map(function (v) { return '<li>' + esc(v.title) + '</li>'; }).join("");
    return '' +
      '<h2>Free lessons</h2><ul>' + (ls || '<li>None set.</li>') + '</ul>' +
      '<h2>Free video clips</h2><ul>' + (vs || '<li>None set.</li>') + '</ul>' +
      '<p><button type="button" data-about-go="videos">Open videos</button> <button type="button" class="secondary" data-about-go="photos">Browse photos</button></p>' +
      '<p class="muted">Everything else opens with a Seat, Pack or Field plan.</p>';
  }

  var PANELS = { why: why, pricing: pricing, shops: shops, faq: faq, samples: samples };

  function render(t) {
    tab = PANELS[t] ? t : "why";
    var panel = document.getElementById("about-panel");
    if (!panel) return;
    panel.innerHTML = PANELS[tab]();
    var btns = document.querySelectorAll("[data-about-tab]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("active", btns[i].getAttribute("data-about-tab") === tab);
      btns[i].setAttribute("aria-selected", btns[i].getAttribute("data-about-tab") === tab ? "true" : "false");
    }
  }

  function open(t) { render(t || tab); show("about"); window.scrollTo(0, 0); }

  function bind() {
    var home = document.getElementById("goto-about");
    if (home) {
      home.addEventListener("click", function () { open("why"); });
      home.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open("why"); } });
    }
    var back = document.getElementById("btn-back-about");
    if (back) back.addEventListener("click", function () { if (core().renderHome) core().renderHome(); show("home"); });
    var backC = document.getElementById("btn-back-contact");
    if (backC) backC.addEventListener("click", function () { if (core().renderHome) core().renderHome(); show("home"); });
    var tabs = document.getElementById("about-tabs");
    if (tabs) tabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-about-tab]");
      if (b) render(b.getAttribute("data-about-tab"));
    });
    var panel = document.getElementById("about-panel");
    if (panel) panel.addEventListener("click", function (e) {
      var go = e.target.closest("[data-about-go]");
      var les = e.target.closest("[data-about-lesson]");
      if (les) {
        e.preventDefault();
        if (APP.openLesson) APP.openLesson(les.getAttribute("data-about-lesson"));
        return;
      }
      if (!go) return;
      var where = go.getAttribute("data-about-go");
      if (where === "samples") render("samples");
      else if (where === "pricing-screen") { if (core().renderPricing) core().renderPricing(); show("pricing"); }
      else if (where === "videos") { if (APP.renderVideos) APP.renderVideos(); show("videos"); }
      else if (where === "photos") { if (core().renderPhotosList) core().renderPhotosList(); show("photos"); }
    });
    var q = new URLSearchParams(location.search).get("about");
    if (q && PANELS[q]) setTimeout(function () { open(q); }, 400);
  }

  APP.openAbout = open;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
