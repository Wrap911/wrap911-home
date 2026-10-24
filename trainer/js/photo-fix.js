/* Photo Fix — paid diagnosis from a photo or a short video (4 frames, client-side).
   Off unless config.photoFix or ?photoFix=1. Nothing is stored.
   iOS: the form is for a StoreKit Shop Pack or Seat. The request sends appleJws
   (the signed transaction) plus a W911 code only when this phone actually has one.
   No unlock field and no website checkout. */
(function () {
  "use strict";

  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var pending = null;
  var MAX_EDGE = 1024; /* 2.7.9: smaller upload for phones on cell data */
  var JPEG_Q = 0.82;

  function core() { return APP.core || null; }
  function $(id) { return document.getElementById(id); }
  function cfg() { return window.WRAP911_CONFIG || {}; }

  function escapeHtml(s) {
    var c = core();
    if (c && c.escapeHtml) return c.escapeHtml(s);
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function flagMode() {
    var q = "";
    try { q = new URLSearchParams(window.location.search).get("photoFix") || ""; } catch (e) {}
    if (q === "mock" || q === "1" || q === "soon") return q;
    if (cfg().photoFix === true) return "1";
    return "";
  }

  function paid() {
    var c = core();
    try { return !!(c && c.hasFullAccess && c.hasFullAccess()); } catch (e) { return false; }
  }

  function deviceId() {
    var k = "wrap911_device", id = "";
    try { id = localStorage.getItem(k) || ""; } catch (e) {}
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      var b = new Uint8Array(16);
      crypto.getRandomValues(b);
      id = Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
      try { localStorage.setItem(k, id); } catch (e2) {}
    }
    return id;
  }

  function loadLic() {
    var c = core();
    try { return c && c.loadLicense ? c.loadLicense() : null; } catch (e) { return null; }
  }

  function licenseCode() {
    var Logic = window.WRAP911_PHOTO_FIX_LOGIC;
    var lic = loadLic();
    var code = lic && lic.code ? String(lic.code) : "";
    return Logic ? Logic.seatCode(code) : "";
  }

  function appleJws() {
    var Logic = window.WRAP911_PHOTO_FIX_LOGIC;
    var lic = loadLic();
    var fromLic = lic && lic.source === "apple" ? String(lic.jws || "") : "";
    var stored = "";
    try { stored = localStorage.getItem("wrap911_apple_jws") || ""; } catch (e) {}
    var jws = fromLic || stored;
    if (!Logic) return "";
    if (lic && lic.source && lic.source !== "apple") return "";
    return Logic.signedJws(jws);
  }

  function nativeApp() {
    try { return !!(window.WRAP911_NATIVE && window.WRAP911_NATIVE()); } catch (e) { return false; }
  }

  function showHome() {
    var c = core();
    if (c && c.showScreen) c.showScreen("home");
  }

  function openScreen() {
    var c = core();
    if (!c || !c.showScreen) return;
    c.showScreen("photo-fix");
    render();
    var iap = window.WRAP911_IAP;
    if (iap && iap.sync) {
      iap.sync().then(function () { if (!pending) render(); }).catch(function () {});
    }
  }

  function setCardVisible(on) {
    var card = $("goto-photo-fix");
    if (!card) return;
    card.classList.toggle("hidden", !on);
    card.hidden = !on;
  }

  function compressFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type || "")) { reject(new Error("Choose a photo or a short video.")); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var scale = Math.min(1, MAX_EDGE / Math.max(w, h, 1));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        var dataUrl = canvas.toDataURL("image/jpeg", JPEG_Q);
        resolve({ dataUrl: dataUrl, width: cw, height: ch });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("That file is not a photo the browser can read."));
      };
      img.src = url;
    });
  }

  /* 2.8.0: short video. Pull 4 evenly spaced frames on the phone, 1024px JPEG each. The video is not uploaded. */
  var FRAMES = 4, MAX_CLIP_S = 60;
  function videoFrames(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var v = document.createElement("video");
      v.muted = true; v.defaultMuted = true; v.playsInline = true;
      v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", ""); v.setAttribute("muted", "");
      v.preload = "auto";
      var frames = [], times = [], idx = 0, finished = false, dur = 0, w = 0, h = 0;
      var guard = setTimeout(function () { fail("That video took too long to read. Try a shorter clip or a photo."); }, 30000);
      function cleanup() { clearTimeout(guard); try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {} URL.revokeObjectURL(url); }
      function fail(msg) { if (finished) return; finished = true; cleanup(); reject(new Error(msg)); }
      function grab() {
        try {
          var scale = Math.min(1, MAX_EDGE / Math.max(w, h, 1));
          var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          var c = document.createElement("canvas"); c.width = cw; c.height = ch;
          c.getContext("2d").drawImage(v, 0, 0, cw, ch);
          frames.push(c.toDataURL("image/jpeg", JPEG_Q));
        } catch (e) { fail("Could not read frames from that video."); return; }
        idx++;
        if (idx >= times.length) { finished = true; cleanup(); resolve({ frames: frames, width: Math.round(w * Math.min(1, MAX_EDGE / Math.max(w, h, 1))), height: Math.round(h * Math.min(1, MAX_EDGE / Math.max(w, h, 1))), duration: dur }); return; }
        seek();
      }
      function seek() {
        var done = false;
        function onSeeked() { if (done) return; done = true; v.removeEventListener("seeked", onSeeked); setTimeout(grab, 60); }
        v.addEventListener("seeked", onSeeked);
        try { v.currentTime = times[idx]; } catch (e) { fail("Could not read frames from that video."); }
      }
      v.addEventListener("error", function () { fail("This browser cannot open that video. Try a photo instead."); });
      v.addEventListener("loadedmetadata", function () {
        dur = v.duration; w = v.videoWidth; h = v.videoHeight;
        if (!isFinite(dur) || dur <= 0 || !w || !h) { fail("Could not read that video."); return; }
        if (dur > MAX_CLIP_S + 1) { fail("Keep the clip to " + MAX_CLIP_S + " seconds or less."); return; }
        for (var i = 0; i < FRAMES; i++) times.push(Math.min(dur - 0.05, Math.max(0.05, dur * (i + 0.5) / FRAMES)));
      });
      v.addEventListener("loadeddata", function () {
        if (!times.length || idx || finished) return;
        /* iOS Safari needs a play/pause before seeks paint a frame. */
        var pr = null; try { pr = v.play(); } catch (e) {}
        var go = function () { try { v.pause(); } catch (e) {} seek(); };
        if (pr && pr.then) pr.then(go, go); else go();
      });
      v.src = url;
      try { v.load(); } catch (e) {}
    });
  }

  function readMedia(file) {
    if (file && /^video\//.test(file.type || "")) return videoFrames(file);
    if (file && !file.type && /\.(mov|mp4|m4v)$/i.test(file.name || "")) return videoFrames(file);
    return compressFile(file).then(function (o) { return { frames: [o.dataUrl], width: o.width, height: o.height }; });
  }

  function field(id) {
    var el = $(id);
    return el ? String(el.value || "").trim().slice(0, 400) : "";
  }

  function mockAnswer() {
    return {
      ok: true,
      disclaimer: "AI suggestion, verify on the job.",
      shows: "Edge lift along a rivet row. The film is bridged over the rivet heads instead of seated into the ring.",
      causes: [
        "The rivet was bridged instead of tucked into the ring.",
        "Post-heat was skipped, or it was not the step in the film TDS.",
        "The panel was still dirty or the adhesive never wet out."
      ],
      fix: [
        "Warm the film only as the current 3M, Avery Dennison, or BriteLine TDS allows for that SKU.",
        "Lift the loose film back to sound adhesive. Do not pull a tear through the rivet.",
        "Seat the ring first, then the dome, with a rivet tool. Work one rivet at a time.",
        "Post-heat the edge the way that TDS describes, then look at it in raking light."
      ],
      prevention: [
        "Clean and dry the panel before the film goes down.",
        "Do not stretch the sheet over rivet heads.",
        "Post-heat every rivet edge before you walk the panel."
      ],
      strip: "Strip and redo that panel when the film is torn at the rivet, the adhesive is cooked, or dirt is already under the lift. A bridge you can still lift cleanly can be reseated."
    };
  }

  function endpointMissing(status, data) {
    var err = String((data && (data.error || data.detail)) || "");
    if (/messages array required/i.test(err)) return true;
    if (/No user\/assistant messages/i.test(err)) return true;
    if (status === 404 && !data) return true;
    if (status === 404 && !err) return true;
    return false;
  }

  function renderAnswer(data) {
    var causes = Array.isArray(data.causes) ? data.causes : [];
    var fix = Array.isArray(data.fix) ? data.fix : [];
    var prevention = Array.isArray(data.prevention) ? data.prevention : [];
    function items(list, tag) {
      if (!list.length) return "";
      var h = "<" + tag + ' class="' + (tag === "ol" ? "steps-list" : "checklist") + '">';
      for (var i = 0; i < list.length; i++) h += "<li>" + escapeHtml(list[i]) + "</li>";
      return h + "</" + tag + ">";
    }
    return (
      '<div class="passion-note"><strong>AI suggestion, verify on the job</strong>' +
      "<p>" + escapeHtml(data.disclaimer || "AI suggestion, verify on the job.") + " Check the current TDS for that 3M, Avery Dennison, or BriteLine film before you heat or chemical anything.</p></div>" +
      "<h3>What the photo likely shows</h3><p>" + escapeHtml(data.shows || "") + "</p>" +
      "<h3>Likely causes</h3>" + items(causes, "ul") +
      "<h3>Fix</h3>" + items(fix, "ol") +
      "<h3>Prevention</h3>" + items(prevention, "ul") +
      "<h3>When to strip and redo</h3><p>" + escapeHtml(data.strip || "") + "</p>"
    );
  }

  function teaserHtml() {
    return (
      '<div class="passion-note"><strong>Pack or Seat</strong>' +
      "<p>Photo Fix reads a vinyl problem from a photo or short video and suggests a fix. It comes with the Shop Pack and the Seat.</p></div>" +
      '<button type="button" id="photo-fix-pricing">See Pack and Seat</button>'
    );
  }

  function formHtml() {
    return (
      '<p class="lead">Photo or short video of the problem (video up to 60 seconds). Add a note if you know the film, the surface, or what it is doing. The phone resizes the photo or pulls 4 still frames from the video. Nothing is saved, and the video itself is never uploaded.</p>' +
      '<form id="photo-fix-form" class="job-form" onsubmit="return false;">' +
      '<div class="quiz-nav"><button type="button" id="photo-fix-take">Take photo or video</button> <button type="button" class="secondary" id="photo-fix-pick">Choose photo or video</button></div>' +
      '<input type="file" id="photo-fix-cam" accept="image/*,video/*" capture="environment" hidden>' +
      '<input type="file" id="photo-fix-file" accept="image/*,video/*" hidden>' +
      '<img id="photo-fix-preview" class="photo-hero" alt="" hidden><div id="photo-fix-thumbs" style="display:none;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0"></div>' +
      '<p class="muted" id="photo-fix-size"></p>' +
      '<label>Material<input type="text" id="photo-fix-material" placeholder="Optional. 3M, Avery Dennison, or BriteLine film"></label>' +
      '<label>Surface<input type="text" id="photo-fix-surface" placeholder="Optional. Rivets, recess, door edge, wall"></label>' +
      '<label>Symptom<textarea id="photo-fix-symptom" rows="2" placeholder="Optional. Lifting, bubbles, tenting, silvering"></textarea></label>' +
      '<div class="accept-row"><input type="checkbox" id="photo-fix-consent"><label for="photo-fix-consent">Send this photo or the video frames for an AI suggestion. Nothing is stored.</label></div>' +
      '<button type="button" id="photo-fix-submit" disabled>Get a fix</button>' +
      '</form>' +
      '<div id="photo-fix-result"></div>' +
      '<div class="quiz-feedback" id="photo-fix-fb"></div>'
    );
  }

  function render() {
    var wrap = $("photo-fix-wrap");
    if (!wrap) return;
    pending = null;
    wrap.innerHTML = paid() ? formHtml() : teaserHtml();
    bind();
  }

  function say(kind, text) {
    var fb = $("photo-fix-fb");
    if (!fb) return;
    fb.className = "quiz-feedback show " + (kind || "");
    fb.textContent = text;
  }

  function syncSubmit() {
    var btn = $("photo-fix-submit");
    var consent = $("photo-fix-consent");
    if (!btn) return;
    btn.disabled = !(pending && consent && consent.checked);
  }

  function onFile(file) {
    say("", "");
    var result = $("photo-fix-result");
    if (result) result.innerHTML = "";
    pending = null; syncSubmit();
    var isVid = file && (/^video\//.test(file.type || "") || /\.(mov|mp4|m4v)$/i.test(file.name || ""));
    if (isVid) say("", "Pulling frames from the video…");
    readMedia(file).then(function (out) {
      pending = out.frames.length > 1 ? out.frames : out.frames[0];
      var img = $("photo-fix-preview"), thumbs = $("photo-fix-thumbs");
      if (out.frames.length > 1) {
        if (img) img.hidden = true;
        if (thumbs) {
          thumbs.innerHTML = out.frames.map(function (f, i) { return '<img src="' + f + '" alt="Frame ' + (i + 1) + '" style="width:100%;border-radius:6px">'; }).join("");
          thumbs.style.display = "grid";
        }
      } else {
        if (thumbs) { thumbs.innerHTML = ""; thumbs.style.display = "none"; }
        if (img) { img.src = out.frames[0]; img.hidden = false; }
      }
      var size = $("photo-fix-size");
      if (size) size.textContent = out.frames.length > 1
        ? out.frames.length + " frames from a " + Math.round(out.duration) + " s clip, " + out.width + "×" + out.height + " JPEG. The video is not uploaded or saved."
        : "Resized to " + out.width + "×" + out.height + " JPEG. Not saved on this phone.";
      say("", "");
      syncSubmit();
    }).catch(function (err) {
      pending = null;
      syncSubmit();
      say("bad", err && err.message ? err.message : "Could not read that file.");
    });
  }

  function shareText(txt) {
    if (navigator.share) {
      navigator.share({ text: txt }).catch(function () {});
      return;
    }
    try {
      var ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      say("ok", "Copied. The photo was not included.");
    } catch (e) {}
  }

  function submit() {
    if (!pending) { say("bad", "Add a photo or a short video first."); return; }
    var consent = $("photo-fix-consent");
    if (!consent || !consent.checked) { say("bad", "Confirm that the photo or frames can be sent. Nothing is stored."); return; }
    var btn = $("photo-fix-submit");
    if (btn) btn.disabled = true;
    say("", "Reading the photo…");
    var mode = flagMode();
    if (mode === "mock") {
      var box = $("photo-fix-result");
      if (box) box.innerHTML = renderAnswer(mockAnswer());
      say("ok", "Sample answer. The photo was not sent or saved.");
      if (btn) btn.disabled = true;
      return;
    }
    var endpoint = String(cfg().aiEndpoint || "").replace(/\/$/, "") + "/coach/photo";
    var sentClip = Array.isArray(pending);
    var Logic = window.WRAP911_PHOTO_FIX_LOGIC;
    var frames = Array.isArray(pending) ? pending : [pending];
    var body = Logic ? Logic.photoRequestBody({
      frames: frames,
      code: licenseCode(),
      device: deviceId(),
      appleJws: appleJws(),
      material: field("photo-fix-material"),
      surface: field("photo-fix-surface"),
      symptom: field("photo-fix-symptom")
    }) : { consent: true };
    var licNow = loadLic();
    var nativeApple = nativeApp() && paid() && licNow && licNow.source === "apple";
    if (Logic && Logic.needsAppleRestore(body, nativeApple)) {
      if (btn) btn.disabled = false;
      syncSubmit();
      say("bad", "Open Pricing and tap Restore Purchases so this phone can send the App Store receipt. Then try again.");
      return;
    }
    /* 2.7.9: the AI read takes 30-60 s. Show a timer, keep the request alive up to 100 s,
       and say what really went wrong instead of "could not reach the server". */
    var started = Date.now();
    var ticker = setInterval(function () {
      say("", (Array.isArray(pending) ? "Reading the video frames… " : "Reading the photo… ") + Math.round((Date.now() - started) / 1000) + " s. This takes up to a minute. Keep this screen open.");
    }, 1000);
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var killer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 100000);
    function done() { clearInterval(ticker); clearTimeout(killer); }
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      done();
      return res.json().catch(function () { return null; }).then(function (data) {
        return { status: res.status, data: data };
      });
    }).then(function (out) {
      pending = null;
      syncSubmit();
      if (endpointMissing(out.status, out.data)) {
        var result = $("photo-fix-result");
        if (result) result.innerHTML = '<div class="passion-note"><strong>Coming soon</strong><p>Photo Fix is not on the server yet. Your photo was not saved.</p></div>';
        say("", "Nothing was stored.");
        return;
      }
      if (!out.data || out.status === 403 || out.status === 404 || out.status === 410) {
        say("bad", (out.data && out.data.error) || "A Pack or Seat on this phone is required.");
        return;
      }
      if (out.status === 429) {
        say("bad", (out.data && out.data.error) || "Too many photos from this code. Wait and try again.");
        return;
      }
      if (!out.data.ok) {
        say("bad", (out.data && out.data.error) || "Photo Fix could not read that photo.");
        return;
      }
      var resultOk = $("photo-fix-result");
      if (resultOk) {
        resultOk.innerHTML = renderAnswer(out.data) + '<p><button type="button" class="secondary" id="photo-fix-share">Share this fix (text only)</button></p>';
        var shareBtn = $("photo-fix-share"), ans = out.data;
        if (shareBtn) shareBtn.addEventListener("click", function () {
          /* Text only. The photo and video frames are never shared, and the text has no checkout link. */
          var steps = (Array.isArray(ans.fix) ? ans.fix : []).slice(0, 4).map(function (x, i) { return (i + 1) + ". " + x; }).join("\n");
          var txt = "WRAP 911 Photo Fix (AI suggestion, verify on the job):\n" + String(ans.shows || "").slice(0, 300) + (steps ? "\nFix:\n" + steps : "");
          shareText(txt.slice(0, 1200));
        });
      }
      say("ok", "AI suggestion, verify on the job. " + (sentClip ? "The video frames were not saved." : "The photo was not saved."));
    }).catch(function (err) {
      done();
      /* keep the resized photo so Get a fix can be tapped again */
      syncSubmit();
      var timedOut = err && err.name === "AbortError";
      var hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      var result = $("photo-fix-result");
      if (result) result.innerHTML = '<div class="passion-note"><strong>' + (timedOut ? "Took too long" : "Connection dropped") + '</strong><p>' +
        (timedOut ? "The AI did not answer in time." : "The phone lost the connection before the answer came back" + (hidden ? " (the screen was locked or you left this screen)." : ".")) +
        " Keep this screen open and tap Get a fix again. Your photo was not saved.</p></div>";
      say("bad", "No answer yet. Try again.");
      try { console.warn("photo-fix", err && (err.name + ": " + err.message)); } catch (e) {}
    });
  }

  function bind() {
    var pricing = $("photo-fix-pricing");
    if (pricing) pricing.addEventListener("click", function () {
      var c = core();
      if (c && c.showScreen) c.showScreen("pricing");
    });
    var take = $("photo-fix-take");
    var pick = $("photo-fix-pick");
    var cam = $("photo-fix-cam");
    var file = $("photo-fix-file");
    if (take && cam) take.addEventListener("click", function () { cam.click(); });
    if (pick && file) pick.addEventListener("click", function () { file.click(); });
    if (cam) cam.addEventListener("change", function () { if (cam.files && cam.files[0]) onFile(cam.files[0]); });
    if (file) file.addEventListener("change", function () { if (file.files && file.files[0]) onFile(file.files[0]); });
    var consent = $("photo-fix-consent");
    if (consent) consent.addEventListener("change", syncSubmit);
    var submitBtn = $("photo-fix-submit");
    if (submitBtn) submitBtn.addEventListener("click", submit);
  }

  function boot() {
    if (!flagMode()) { setCardVisible(false); return; }
    setCardVisible(true);
    var card = $("goto-photo-fix");
    if (card) {
      card.addEventListener("click", openScreen);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openScreen(); }
      });
    }
    var back = $("btn-back-photo-fix");
    if (back) back.addEventListener("click", showHome);
  }

  function whenReady(cb) {
    var n = 0;
    var t = setInterval(function () {
      n++;
      if (core() && core().showScreen) { clearInterval(t); cb(); }
      else if (n > 80) { clearInterval(t); cb(); }
    }, 50);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { whenReady(boot); });
  else whenReady(boot);
})();
