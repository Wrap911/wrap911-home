/* App Store compliance: AI Coach consent (5.1.2), in-app privacy link (5.1.1),
   and iOS checkout notice (3.1.1(a) US link-out to web checkout). */
(function () {
  var KEY = "wrap911_ai_consent";
  var PRIVACY = "https://wrap911.com/privacy.html";
  var isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstChild; }
  function css() {
    if (document.getElementById("w911-as-css")) return;
    var s = document.createElement("style"); s.id = "w911-as-css";
    s.textContent = ".w911-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:18px}" +
      ".w911-modal .box{background:#15171c;color:#f2f2f2;max-width:420px;border-radius:14px;padding:20px;font:15px/1.45 system-ui,-apple-system,sans-serif}" +
      ".w911-modal h2{margin:0 0 10px;font-size:18px}.w911-modal a{color:#ffb020}" +
      ".w911-modal .row{display:flex;gap:10px;margin-top:16px}.w911-modal button{flex:1;padding:12px;border-radius:10px;border:0;font-weight:600;font-size:15px}" +
      ".w911-modal .yes{background:#ffb020;color:#111}.w911-modal .no{background:#2a2d35;color:#eee}" +
      ".w911-privacy-link{display:block;text-align:center;margin:24px 0 12px;font-size:13px;opacity:.8}" +
      ".w911-ios-note{font-size:13px;margin:10px 0;opacity:.85}";
    document.head.appendChild(s);
  }

  window.WRAP911_AI_CONSENT = function () {
    try { if (localStorage.getItem(KEY) === "yes") return Promise.resolve(true); } catch (e) {}
    css();
    return new Promise(function (resolve) {
      var m = el('<div class="w911-modal" role="dialog" aria-modal="true"><div class="box">' +
        '<h2>Send this question to the AI Coach?</h2>' +
        '<p>To answer, WRAP 911 sends your question and this chat to our server, which passes it to xAI (Grok), a third-party AI service. Do not include names, phone numbers, or customer details.</p>' +
        '<p>If you say no, you get the built-in offline answers instead. <a href="' + PRIVACY + '" target="_blank" rel="noopener">Privacy policy</a></p>' +
        '<div class="row"><button type="button" class="no">No thanks</button><button type="button" class="yes">Allow</button></div></div></div>');
      document.body.appendChild(m);
      m.querySelector(".yes").onclick = function () { try { localStorage.setItem(KEY, "yes"); } catch (e) {} m.remove(); resolve(true); };
      m.querySelector(".no").onclick = function () { m.remove(); resolve(false); };
    });
  };
  window.WRAP911_AI_CONSENT_RESET = function () { try { localStorage.removeItem(KEY); } catch (e) {} };

  function addPrivacyLink() {
    css();
    var main = document.querySelector("main") || document.body;
    if (document.querySelector(".w911-privacy-link")) return;
    var a = el('<a class="w911-privacy-link" href="' + PRIVACY + '" target="_blank" rel="noopener">Privacy policy</a>');
    main.appendChild(a);
    var coach = document.getElementById("screen-coach");
    if (coach) coach.appendChild(el('<p class="w911-privacy-link"><a href="' + PRIVACY + '" target="_blank" rel="noopener">Privacy policy</a> · <a href="#" id="w911-ai-reset">Reset AI permission</a></p>'));
    var r = document.getElementById("w911-ai-reset");
    if (r) r.onclick = function (e) { e.preventDefault(); window.WRAP911_AI_CONSENT_RESET(); r.textContent = "AI permission reset"; };
  }

  function iosCheckoutNote() {
    if (!isNative) return;
    var p = document.getElementById("screen-pricing");
    if (!p || p.querySelector(".w911-ios-note")) return;
    var note = el('<p class="w911-ios-note">Checkout opens in Safari on wrap911.com. After you pay, come back here and enter your unlock code.</p>');
    var box = p.querySelector(".unlock-box");
    p.insertBefore(note, box || null);
  }

  function run() { addPrivacyLink(); iosCheckoutNote(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
