/* WRAP 911 — Shop Pack crew codes by email (iOS, build 32).
   No code entry and no code list in the app. The worker verifies the Apple
   purchase and emails four codes. Mailto to info@wrap911.com is the fallback. */
(function () {
  var API = "https://wrap911-coach-proxy.wrap911.workers.dev";
  var MAIL = "info@wrap911.com";
  var JWS_KEY = "wrap911_apple_jws";
  var TXN_KEY = "wrap911_apple_txn";

  function iosApp() {
    return !!(window.WRAP911_NATIVE && window.WRAP911_NATIVE());
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function readJws() {
    try { return localStorage.getItem(JWS_KEY) || ""; } catch (e) { return ""; }
  }
  function readTxn() {
    try { return localStorage.getItem(TXN_KEY) || ""; } catch (e) { return ""; }
  }
  function rememberAppleReceipt(jws, txn) {
    if (jws) try { localStorage.setItem(JWS_KEY, String(jws)); } catch (e) {}
    if (txn) try { localStorage.setItem(TXN_KEY, String(txn)); } catch (e2) {}
  }
  function txnFromJws(jws) {
    try {
      var part = String(jws || "").split(".")[1] || "";
      var b64 = part.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var json = JSON.parse(atob(b64));
      return String(json.originalTransactionId || json.transactionId || "");
    } catch (e) { return ""; }
  }
  function mailtoHref(txn) {
    var sub = encodeURIComponent("WRAP 911 Shop Pack crew codes");
    var body = encodeURIComponent(
      "Please email the four Shop Pack crew codes for this Apple purchase.\n\n" +
      "Original transaction ID: " + (txn || "(open Pricing, tap Restore Purchases, then send this again)") + "\n\n" +
      "I bought the Shop Pack in the WRAP 911 iPhone app. The other phones will use the website trainer. Do not send me a website buy link.\n"
    );
    return "mailto:" + MAIL + "?subject=" + sub + "&body=" + body;
  }

  function formHtml(status) {
    var txn = readTxn() || txnFromJws(readJws());
    var note = status || "";
    return "<strong>Shop Pack</strong>" +
      "<p>This phone is unlocked for 12 months. The other four seats are sent to your email. They are redeemed on the website trainer, not in this app. This app stays on Apple purchases and Restore Purchases.</p>" +
      '<form id="crew-email-form" class="crew-email-form">' +
      '<label for="crew-email-address">Email my crew codes to</label>' +
      '<input type="email" id="crew-email-address" name="crew-email" autocomplete="email" inputmode="email" required placeholder="you@example.com">' +
      '<button type="submit" class="secondary" id="crew-email-send">Email my crew codes</button>' +
      "</form>" +
      (note ? '<p id="crew-email-status" class="muted">' + esc(note) + "</p>" : '<p id="crew-email-status" class="muted"></p>') +
      '<p class="muted">If that does not send, <a id="crew-email-mailto" href="' + esc(mailtoHref(txn)) + '">ask us to email the codes</a>. The message includes your transaction ID, not a buy link.</p>';
  }

  function setStatus(text) {
    var el = document.getElementById("crew-email-status");
    if (el) el.textContent = text || "";
  }

  function paint(card) {
    if (!card || !iosApp()) return;
    card.innerHTML = formHtml("");
    var form = document.getElementById("crew-email-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("crew-email-address");
      var email = input ? String(input.value || "").trim() : "";
      var jws = readJws();
      if (!email || email.indexOf("@") < 1) {
        setStatus("Enter the email where the four codes should go.");
        return;
      }
      if (!jws) {
        setStatus("Open Pricing and tap Restore Purchases first, then send again. Or use the link below to ask us.");
        return;
      }
      setStatus("Sending…");
      var btn = document.getElementById("crew-email-send");
      if (btn) btn.disabled = true;
      fetch(API + "/license/apple/crew-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, jws: jws })
      }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, d: d || {} }; }); }).then(function (res) {
        if (btn) btn.disabled = false;
        if (res.d && res.d.ok) {
          setStatus("We emailed the four crew codes. Check that inbox. Redeem them on the website trainer, not in this app.");
          return;
        }
        if (res.status === 503 || (res.d && res.d.code === "EMAIL_NOT_CONFIGURED")) {
          setStatus("Email is not sending from the server right now. Use the link below and we will send the codes.");
          return;
        }
        setStatus((res.d && res.d.error) || "Could not send. Use the link below and we will send the codes.");
      }).catch(function () {
        if (btn) btn.disabled = false;
        setStatus("Could not reach the server. Use the link below and we will send the codes.");
      });
    });
  }

  window.WRAP911_CREW_EMAIL = {
    paint: paint,
    rememberAppleReceipt: rememberAppleReceipt,
    txnFromJws: txnFromJws,
    mailtoHref: mailtoHref,
    formHtml: formHtml
  };
})();
