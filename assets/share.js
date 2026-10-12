/* WRAP 911 share: navigator.share first, then a sheet of plain text links. Never shares a photo. */
(function () {
  "use strict";
  var URL0 = "https://wrap911.com";
  var TITLE = "WRAP 911";
  var PITCH = "WRAP 911: commercial vinyl wrap installer training from real bay jobs. Lessons, drills, and a shop Coach.";
  function enc(s) { return encodeURIComponent(s); }
  function links(text, url) {
    var t = enc(text), u = enc(url), tu = enc(text + " " + url);
    return [
      ["Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + u],
      ["X", "https://twitter.com/intent/tweet?text=" + t + "&url=" + u],
      ["LinkedIn", "https://www.linkedin.com/sharing/share-offsite/?url=" + u],
      ["WhatsApp", "https://wa.me/?text=" + tu],
      ["Text message", "sms:?&body=" + tu],
      ["Email", "mailto:?subject=" + enc(TITLE) + "&body=" + tu]
    ];
  }
  function css() {
    if (document.getElementById("w911-share-css")) return;
    var s = document.createElement("style"); s.id = "w911-share-css";
    s.textContent = ".w911-share-back{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center}" +
      ".w911-share-sheet{background:#161018;color:#fff6ee;border:1px solid #5a304c;border-radius:16px 16px 0 0;padding:16px;width:100%;max-width:480px;box-sizing:border-box;font-family:inherit}" +
      ".w911-share-sheet h3{margin:0 0 10px;font-size:1rem}.w911-share-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
      ".w911-share-grid a,.w911-share-grid button{display:block;text-align:center;padding:12px 8px;border-radius:10px;border:1px solid #5a304c;background:#221822;color:#fff6ee;text-decoration:none;font:inherit;font-size:.95rem;cursor:pointer;width:100%;box-sizing:border-box;text-transform:none;letter-spacing:0;box-shadow:none}" +
      ".w911-share-close{margin-top:10px;width:100%;padding:10px;border-radius:10px;border:0;background:#ff2d8c;color:#fff;font:inherit;cursor:pointer}" +
      ".w911-share-btn{display:inline-flex;align-items:center;gap:6px}";
    document.head.appendChild(s);
  }
  function sheet(text, url) {
    css();
    var back = document.createElement("div"); back.className = "w911-share-back";
    var box = document.createElement("div"); box.className = "w911-share-sheet"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Share WRAP 911");
    var h = '<h3>Share WRAP 911</h3><div class="w911-share-grid">';
    links(text, url).forEach(function (l) { h += '<a href="' + l[1] + '" target="_blank" rel="noopener">' + l[0] + "</a>"; });
    h += '<button type="button" class="secondary" data-copy>Copy link</button></div><button type="button" class="w911-share-close">Close</button>';
    box.innerHTML = h; back.appendChild(box); document.body.appendChild(back);
    function close() { back.remove(); }
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    box.querySelector(".w911-share-close").addEventListener("click", close);
    box.querySelector("[data-copy]").addEventListener("click", function (e) {
      var b = e.currentTarget, done = function () { b.textContent = "Link copied"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("Copy this link", url); });
      else prompt("Copy this link", url);
    });
  }
  function share(opts) {
    opts = opts || {};
    var text = String(opts.text || PITCH), url = opts.url || URL0;
    if (navigator.share && !opts.sheet) {
      navigator.share({ title: TITLE, text: text, url: url }).catch(function (err) {
        if (!err || err.name !== "AbortError") sheet(text, url);
      });
      return;
    }
    sheet(text, url);
  }
  window.WRAP911_SHARE = { share: share, sheet: sheet, PITCH: PITCH, URL: URL0 };
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-w911-share]");
    if (!b) return;
    e.preventDefault();
    share({});
  });
})();
