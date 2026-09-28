/* WRAP 911 — iPhone "code only" mode (App Review fallback for Guideline 3.1.1).
   Runs only inside the iOS app AND only when WRAP911_CONFIG.iosHideBuy is true.
   Hides every buy button, price and Stripe link. Users with a plan enter their unlock code.
   The website keeps selling with Stripe. Set iosHideBuy: false to go back to US link-out. */
(function () {
  var CFG = window.WRAP911_CONFIG || {};
  var native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (!native || !CFG.iosHideBuy) return;
  window.WRAP911_IOS_CODE_ONLY = true;

  /* Drop ?buy= before plan-fix.js reads it, so nothing redirects to Stripe. */
  try {
    var u = new URL(window.location.href);
    if (u.searchParams.has("buy")) { u.searchParams.delete("buy"); history.replaceState({}, "", u.pathname + (u.search || "") + u.hash); }
  } catch (e) {}
  CFG.stripePaymentLink = ""; CFG.stripeSeatLink = ""; CFG.stripeFieldLink = ""; CFG.fieldSkuLive = false;

  var NOTE = "Have a WRAP 911 plan? Enter your unlock code to open the full trainer.";
  var LOCKED = "This part needs a WRAP 911 plan. Enter your unlock code.";

  function isBuy(el) {
    if (!el || !el.closest) return false;
    if (el.closest("#btn-stripe-pay, #stripe-link-wrap, #pricing-plans button, .plan-row a, .plan-row button")) return true;
    var a = el.closest("a");
    var h = a ? (a.getAttribute("href") || "") : "";
    return /[?&]buy=|buy\.stripe\.com|checkout/i.test(h);
  }
  window.addEventListener("click", function (e) {
    if (isBuy(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  var css = document.createElement("style");
  css.textContent = "#stripe-link-wrap,#pricing-plans,#pricing-mode-banner,.plan-row,.w911-ios-note," +
    "#screen-pricing .lead,a[href*='buy='],a[href*='buy.stripe.com'],[data-about-tab='pricing']{display:none!important}" +
    ".w911-code-note{margin:.6rem 0 1rem}";
  (document.head || document.documentElement).appendChild(css);

  var PRICE = /\$\s?\d{2}|stripe|buy (on this|with stripe|the shop|1 seat)|payment link/i;
  function paint() {
    var p = document.getElementById("screen-pricing");
    if (p) {
      var h = p.querySelector("h1"); if (h && h.textContent !== "Unlock") h.textContent = "Unlock";
      if (!p.querySelector(".w911-code-note")) {
        var n = document.createElement("p"); n.className = "lead w911-code-note"; n.textContent = NOTE;
        var box = p.querySelector(".unlock-box"); p.insertBefore(n, box || p.firstChild);
      }
    }
    var fb = document.getElementById("unlock-feedback");
    if (fb && PRICE.test(fb.textContent || "")) fb.textContent = LOCKED;
    /* Any other price / checkout sentence on screen (About FAQ, license text, gate cards). */
    var nodes = document.querySelectorAll("#screen-pricing p, #screen-about p, #screen-about li, #screen-about summary, #screen-home p, .license-card p, .gate-card p, .gate-card strong, .card-sub");
    for (var i = 0; i < nodes.length; i++) {
      var t = nodes[i];
      if (t.closest(".w911-code-note") || t.getAttribute("data-w911-clean")) continue;
      if (PRICE.test(t.textContent || "")) {
        var d = t.closest("details"); if (d) { d.style.display = "none"; continue; }
        t.textContent = LOCKED; t.setAttribute("data-w911-clean", "1");
      }
    }
  }
  function start() {
    paint();
    var pending = false;
    new MutationObserver(function () {
      if (pending) return; pending = true;
      setTimeout(function () { pending = false; paint(); }, 60);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
