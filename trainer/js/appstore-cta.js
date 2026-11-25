/* WRAP 911 web 2.9.4: App Store is the lead CTA on the web trainer.
   Web only: hidden inside the iOS app (native) and once this phone is paid.
   Stripe web checkout below it is unchanged. */
(function () {
  "use strict";
  var CFG = window.WRAP911_CONFIG || {};
  var URL = CFG.appStoreUrl || "";
  if (!URL || URL.indexOf("https://apps.apple.com/") !== 0) return;
  function isNative() {
    try {
      if (window.WRAP911_NATIVE && window.WRAP911_NATIVE()) return true;
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return true;
    } catch (e) {}
    return false;
  }
  function paid() {
    try { return !!(window.WRAP911_GATE && window.WRAP911_GATE.paid && window.WRAP911_GATE.paid()); } catch (e) { return false; }
  }
  if (isNative()) return;
  function card(id, title, sub) {
    var a = document.createElement("a");
    a.id = id;
    a.className = "card w9-appstore-cta";
    a.href = URL;
    a.rel = "noopener";
    a.setAttribute("data-w9-appstore", "1");
    a.innerHTML = '<div class="card-body"><div class="card-title">' + title + '</div><div class="card-sub">' + sub + "</div></div>";
    return a;
  }
  function place() {
    if (paid()) {
      var old = document.querySelectorAll("[data-w9-appstore]");
      for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
      return;
    }
    var pricing = document.getElementById("screen-pricing");
    if (pricing && !document.getElementById("w9-appstore-pricing")) {
      var c = card("w9-appstore-pricing", "Get WRAP 911 on the App Store", "iPhone: free download. Buy the Shop Pack (5 phones) or a Seat inside the app. Web checkout is below.");
      var lead = pricing.querySelector(".lead");
      if (lead && lead.nextSibling) pricing.insertBefore(c, lead.nextSibling); else pricing.appendChild(c);
    }
    var about = document.getElementById("goto-about");
    if (about && !document.getElementById("w9-appstore-home")) {
      about.parentNode.insertBefore(card("w9-appstore-home", "WRAP 911 is on the App Store", "Search WRAP 911 on the App Store. Free download for iPhone."), about);
    }
  }
  var css = document.createElement("style");
  css.textContent = ".w9-appstore-cta{display:block;text-decoration:none;border:2px solid #ffb000;margin:0.6rem 0}.w9-appstore-cta .card-title{color:#ffb000}";
  document.head.appendChild(css);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", place); else place();
  setTimeout(place, 1500);
})();
