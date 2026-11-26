/* Problem Doctor. One photo, or up to five frames from a clip of 60 seconds
   or less, goes to the coach worker only after a separate consent checkbox.
   The video file is never uploaded. The website keeps its current body
   (consent, images, note). The iOS app also sends a device id and, when this
   phone has one, the latest StoreKit signed transaction. */
(function () {
  "use strict";
  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var MAX_EDGE = 1024;
  var JPEG_Q = 0.82;
  var MAX_FRAMES = 5;
  var MAX_SECONDS = 60;
  var QUOTA_KEY = "wrap911_doctor_quota";
  var frames = null;
  var meta = null;
  var from = "home";
  var carriedNote = "";
  var saved = null;

  function $(id) { return document.getElementById(id); }
  function core() { return APP.core || null; }
  function cfg() { return window.WRAP911_CONFIG || {}; }
  function nativeApp() {
    return !!(window.WRAP911_NATIVE && window.WRAP911_NATIVE());
  }
  function esc(s) {
    var c = core();
    if (c && c.escapeHtml) return c.escapeHtml(s);
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function paid() {
    try { if (window.WRAP911_GATE && window.WRAP911_GATE.paid && window.WRAP911_GATE.paid()) return true; } catch (e) {}
    var c = core();
    try { return !!(c && c.hasFullAccess && c.hasFullAccess()); } catch (e2) { return false; }
  }
  function limits() {
    var logic = window.WRAP911_IAP_LOGIC;
    var free = logic && logic.DOCTOR_FREE_PER_DAY ? logic.DOCTOR_FREE_PER_DAY : 1;
    var full = logic && logic.DOCTOR_PAID_PER_DAY ? logic.DOCTOR_PAID_PER_DAY : 15;
    var c = cfg();
    if (Number(c.doctorFreePerDay) > 0) free = Number(c.doctorFreePerDay);
    if (Number(c.doctorPaidPerDay) > 0) full = Number(c.doctorPaidPerDay);
    return { free: free, paid: full };
  }
  function quota() {
    var cap = paid() ? limits().paid : limits().free;
    var used = 0;
    try {
      var row = JSON.parse(localStorage.getItem(QUOTA_KEY) || "null");
      if (row && row.day === today()) used = Number(row.used) || 0;
    } catch (e) {}
    return { paid: paid(), limit: cap, used: used, left: Math.max(0, cap - used) };
  }
  function bumpQuota() {
    var q = quota();
    try { localStorage.setItem(QUOTA_KEY, JSON.stringify({ day: today(), used: q.used + 1 })); } catch (e) {}
  }
  function sampleMode() {
    try { return new URLSearchParams(window.location.search).get("doctor") === "sample"; } catch (e) { return false; }
  }
  function quotaText() {
    var q = quota();
    var full = limits().paid;
    if (q.paid) return q.left + " of " + q.limit + " reads left today.";
    if (q.left > 0) return "Free look: 1 read left today. A Shop Pack, Seat, or 7-Day Pass includes " + full + " a day.";
    return "Free look: no reads left today. A Shop Pack, Seat, or 7-Day Pass includes " + full + " a day.";
  }
  function setFb(kind, text) {
    var el = $("problem-doctor-fb");
    if (!el) return;
    el.className = "quiz-feedback" + (text ? " show " + (kind || "") : "");
    el.textContent = text || "";
  }
  function scrub(s) {
    return String(s || "")
      .replace(/\b(arlon|oracal|orafol|hexis|vvivid|inozetek|kpmf|teckwrap|tinybot)\b/gi, "that film")
      .replace(/\b-?\d+(?:\.\d+)?\s*(?:°|degrees?)\s*[fFcC]?\b/g, "the range on the film TDS")
      .replace(/\b(?:to|at|about|around)\s+\d{2,3}\s*(?:°\s*)?(?:f|c|fahrenheit|celsius)\b/gi, "within the film TDS")
      .replace(/\b\d{2,3}\s*(?:°\s*)?(?:f|c|fahrenheit|celsius)\b/gi, "the film TDS")
      .replace(/\s+/g, " ")
      .trim();
  }
  function isVideo(file) {
    if (!file) return false;
    return /^video\//.test(file.type || "") || (!file.type && /\.(mov|mp4|m4v|webm)$/i.test(file.name || ""));
  }
  function endpoint() {
    try {
      var override = localStorage.getItem("wrap911_ai_endpoint");
      if (override && String(override).trim()) return String(override).trim().replace(/\/$/, "") + "/coach/doctor";
    } catch (e) {}
    var base = String(cfg().aiEndpoint || "").trim();
    return base ? base.replace(/\/$/, "") + "/coach/doctor" : "";
  }
  function goPricing() {
    var c = core();
    if (c && c.showScreen) c.showScreen("pricing");
  }
  function paintThumbs() {
    var box = $("problem-doctor-thumbs");
    var size = $("problem-doctor-size");
    if (!box) return;
    var html = "";
    var list = frames || [];
    for (var i = 0; i < list.length; i++) html += '<img src="' + list[i] + '" alt="Frame ' + (i + 1) + '">';
    box.innerHTML = html;
    box.hidden = !list.length;
    if (!size) return;
    if (meta && meta.duration) size.textContent = list.length + " frames from a " + Math.round(meta.duration) + " s clip, " + meta.width + "×" + meta.height + " JPEG. The video is not uploaded.";
    else if (meta) size.textContent = "Resized to " + meta.width + "×" + meta.height + " JPEG. Not saved on this phone.";
    else size.textContent = "";
  }
  function listHtml(items, tag) {
    if (!items || !items.length) return "";
    var html = "<" + tag + ' class="' + (tag === "ol" ? "steps-list" : "checklist") + '">';
    for (var i = 0; i < items.length; i++) html += "<li>" + esc(scrub(items[i])) + "</li>";
    return html + "</" + tag + ">";
  }
  function watchHtml(result) {
    var match = window.WRAP911_DOCTOR_MATCH && window.WRAP911_DOCTOR_MATCH.matchCatalog;
    if (!match) return "";
    var found = match(result.lesson_keywords || [], window.WRAP911_DATA || {}, 3);
    var lessons = found.lessons || [];
    var videos = found.videos || [];
    if (!lessons.length && !videos.length) return "";
    var html = '<h3>Watch this</h3><div class="doctor-watch">';
    var i;
    for (i = 0; i < lessons.length; i++) html += '<button type="button" class="secondary" data-doctor-lesson="' + esc(lessons[i].id) + '">' + esc(lessons[i].title) + "</button>";
    for (i = 0; i < videos.length; i++) html += '<button type="button" class="secondary" data-doctor-video="' + esc(videos[i].id) + '">' + esc(videos[i].title) + "</button>";
    return html + "</div>";
  }
  function paintResult(result) {
    var box = $("problem-doctor-result");
    if (!box || !result) return;
    var confidence = String(result.confidence || "low").toLowerCase();
    if (confidence !== "low" && confidence !== "medium" && confidence !== "high") confidence = "low";
    var unsure = confidence === "low" ? "<p>If this does not match the panel, send a closer photo.</p>" : "";
    box.innerHTML = '<div class="card doctor-card"><p class="doctor-conf">Confidence: ' + esc(confidence) + "</p>" +
      '<div class="passion-note"><strong>AI suggestion</strong><p>' + esc(result.disclaimer || "AI suggestion. Check the film TDS before you heat anything.") + "</p></div>" +
      "<h3>What it shows</h3><p>" + esc(scrub(result.observations || "")) + "</p>" + unsure +
      "<h3>Likely cause</h3>" + (listHtml(result.likely_causes, "ul") || '<p class="muted">No cause until the photo is clearer.</p>') +
      "<h3>Fix</h3>" + (listHtml(result.fix_steps, "ol") || '<p class="muted">No fix until the photo is clearer.</p>') +
      "<h3>Next time</h3>" + (listHtml(result.prevention, "ul") || '<p class="muted">No prevention note yet.</p>') +
      watchHtml(result) + "</div>";
  }
  function syncSubmit() {
    var btn = $("problem-doctor-submit");
    var box = $("problem-doctor-consent");
    if (!btn || btn.getAttribute("data-busy") === "1") return;
    var q = quota();
    btn.disabled = !(frames && frames.length && box && box.checked) || (q.left < 1 && !sampleMode());
  }
  function readFile(file) {
    setFb("", "");
    var result = $("problem-doctor-result");
    if (result) result.innerHTML = "";
    frames = null;
    meta = null;
    syncSubmit();
    if (isVideo(file)) setFb("", "Pulling frames from the video.");
    return (isVideo(file) ? framesFromVideo(file) : frameFromImage(file)).then(function (got) {
      frames = (got.frames || []).slice(0, MAX_FRAMES);
      meta = got;
      paintThumbs();
      setFb("", "");
      syncSubmit();
    }).catch(function (err) {
      frames = null;
      meta = null;
      syncSubmit();
      setFb("bad", err && err.message ? err.message : "Could not read that file.");
    });
  }
  function frameFromImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || (!/^image\//.test(file.type || "") && !/\.(jpe?g|png|webp|gif|heic)$/i.test(file.name || ""))) {
        reject(new Error("Choose a photo or a short video."));
        return;
      }
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
        canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        resolve({ frames: [canvas.toDataURL("image/jpeg", JPEG_Q)], width: cw, height: ch });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("This browser cannot read that photo. Use a JPEG or a short video."));
      };
      img.src = url;
    });
  }
  function framesFromVideo(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var video = document.createElement("video");
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("muted", "");
      video.preload = "auto";
      var out = [];
      var times = [];
      var index = 0;
      var started = false;
      var done = false;
      var duration = 0;
      var width = 0;
      var height = 0;
      var timer = setTimeout(function () { fail("That video took too long to read. Try a shorter clip or a photo."); }, 30000);
      function cleanup() {
        clearTimeout(timer);
        try { video.pause(); video.removeAttribute("src"); video.load(); } catch (e) {}
        URL.revokeObjectURL(url);
      }
      function fail(message) {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error(message));
      }
      function capture() {
        try {
          var scale = Math.min(1, MAX_EDGE / Math.max(width, height, 1));
          var cw = Math.max(1, Math.round(width * scale));
          var ch = Math.max(1, Math.round(height * scale));
          var canvas = document.createElement("canvas");
          canvas.width = cw;
          canvas.height = ch;
          canvas.getContext("2d").drawImage(video, 0, 0, cw, ch);
          out.push(canvas.toDataURL("image/jpeg", JPEG_Q));
        } catch (e) {
          fail("Could not read frames from that video.");
          return;
        }
        index += 1;
        if (index >= times.length) {
          done = true;
          cleanup();
          var scaleDone = Math.min(1, MAX_EDGE / Math.max(width, height, 1));
          resolve({ frames: out, width: Math.round(width * scaleDone), height: Math.round(height * scaleDone), duration: duration });
        } else seek();
      }
      function seek() {
        var heard = false;
        video.addEventListener("seeked", function onSeeked() {
          if (heard) return;
          heard = true;
          video.removeEventListener("seeked", onSeeked);
          setTimeout(capture, 60);
        });
        try { video.currentTime = times[index]; } catch (e) { fail("Could not read frames from that video."); }
      }
      function arm() {
        if (done || started || !times.length || video.readyState < 2) return;
        started = true;
        var play;
        try { play = video.play(); } catch (e) { play = null; }
        var pause = function () { try { video.pause(); } catch (e2) {} seek(); };
        if (play && play.then) play.then(pause, pause);
        else pause();
      }
      video.addEventListener("error", function () { fail("This browser cannot open that video. Try a photo instead."); });
      video.addEventListener("loadedmetadata", function () {
        duration = video.duration;
        width = video.videoWidth;
        height = video.videoHeight;
        if (!isFinite(duration) || duration <= 0 || !width || !height) { fail("Could not read that video."); return; }
        if (duration > MAX_SECONDS + 1) { fail("Keep the clip to " + MAX_SECONDS + " seconds or less."); return; }
        for (var i = 0; i < MAX_FRAMES; i++) times.push(Math.min(duration - 0.05, Math.max(0.05, duration * (i + 0.5) / MAX_FRAMES)));
        arm();
      });
      video.addEventListener("loadeddata", arm);
      video.src = url;
      try { video.load(); } catch (e) {}
    });
  }
  function sampleResult() {
    return {
      ok: true,
      observations: "The film is bridged over a rivet row. The heads show as tents, and the sheet is not seated into the rings.",
      likely_causes: [
        "The sheet was stretched over the rivet heads instead of seated into each ring.",
        "The panel was still dirty, or the adhesive never wet out.",
        "Post-heat was skipped, or it did not follow the film TDS."
      ],
      fix_steps: [
        "Warm the film only the way the current 3M, Avery Dennison, or BriteLine TDS allows for that SKU.",
        "Lift the loose film back to sound adhesive. Do not pull a tear through a rivet.",
        "Seat the ring first, then the dome, one rivet at a time.",
        "Post-heat the way that TDS describes, then check the row in raking light."
      ],
      prevention: [
        "Clean and dry the panel before the film goes down.",
        "Glass the flat field first. Do not stretch the sheet over rivet heads.",
        "Post-heat each rivet edge before you leave the panel. Follow the TDS."
      ],
      lesson_keywords: ["rivet", "tenting", "edge lift", "post-heat"],
      confidence: "high",
      disclaimer: "AI suggestion. Check the current TDS for that 3M, Avery Dennison, or BriteLine film before you heat anything."
    };
  }
  function credentials() {
    if (!nativeApp()) return Promise.resolve(null);
    if (window.WRAP911_APPLE_RECEIPT) return window.WRAP911_APPLE_RECEIPT();
    return Promise.resolve({ jws: "", device: "" });
  }
  function send() {
    if (!frames || !frames.length) { setFb("bad", "Add a photo or a short video first."); return; }
    var box = $("problem-doctor-consent");
    if (!box || !box.checked) { setFb("bad", "Confirm that the photo or frames can be sent. Nothing is stored."); return; }
    var q = quota();
    if (q.left < 1 && !sampleMode()) {
      setFb("bad", q.paid ? "You have used today's reads." : "You have used today's free read.");
      return;
    }
    var btn = $("problem-doctor-submit");
    if (btn) { btn.disabled = true; btn.setAttribute("data-busy", "1"); }
    var noteEl = $("problem-doctor-note");
    var note = noteEl ? String(noteEl.value || "").trim().slice(0, 500) : "";
    if (sampleMode()) {
      var canned = sampleResult();
      saved = { frames: frames.slice(), meta: meta, result: canned };
      paintResult(canned);
      setFb("ok", "Sample read. Nothing was sent or saved.");
      if (btn) btn.removeAttribute("data-busy");
      syncSubmit();
      return;
    }
    var url = endpoint();
    if (!url) {
      setFb("bad", "Problem Doctor is not connected on this phone yet.");
      if (btn) btn.removeAttribute("data-busy");
      syncSubmit();
      return;
    }
    var images = frames.slice();
    var shot = meta;
    var started = Date.now();
    setFb("", "Reading the photo. Keep this screen open.");
    var tick = setInterval(function () {
      setFb("", "Reading the photo. " + Math.round((Date.now() - started) / 1000) + " s. Keep this screen open.");
    }, 1000);
    var abort = typeof AbortController === "function" ? new AbortController() : null;
    var killer = setTimeout(function () { if (abort) abort.abort(); }, 90000);
    function finishBusy() {
      clearInterval(tick);
      clearTimeout(killer);
      if (btn) btn.removeAttribute("data-busy");
    }
    function applyServerQuota(data) {
      var cap = quota().limit;
      var used = cap;
      if (data && data.remaining != null && isFinite(Number(data.remaining))) {
        used = Math.max(0, cap - Number(data.remaining));
      } else if (data && data.used != null && isFinite(Number(data.used))) {
        used = Math.max(0, Number(data.used));
      }
      try { localStorage.setItem(QUOTA_KEY, JSON.stringify({ day: today(), used: used })); } catch (eQ) {}
    }
    function paintQuota() {
      var label = $("problem-doctor-quota");
      if (label) label.textContent = quotaText();
    }
    credentials().then(function (cred) {
      var body = { consent: true, images: images, note: note };
      var sentJws = !!(cred && cred.jws);
      if (cred) {
        if (cred.device) body.device = cred.device;
        if (cred.jws) body.jws = cred.jws;
      }
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abort ? abort.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return null; }).then(function (data) {
          return { status: res.status, data: data, sentJws: sentJws };
        });
      });
    }).then(function (res) {
      finishBusy();
      var data = res.data || {};
      if (res.status === 429) {
        applyServerQuota(data);
        var msg = data.error || "Too many reads. Wait and try again.";
        if (nativeApp() && paid() && !res.sentJws) {
          msg = "The shop could not confirm a purchase on this phone, so this read used the free cap. Open Pricing, tap Restore purchases, then try again.";
        }
        setFb("bad", msg);
        paintQuota();
        syncSubmit();
        return;
      }
      if (!data.ok) { setFb("bad", data.error || "Problem Doctor could not read that photo."); syncSubmit(); return; }
      bumpQuota();
      paintQuota();
      saved = { frames: images, meta: shot, result: data };
      paintResult(data);
      setFb("ok", "AI suggestion. The photo was not saved.");
      syncSubmit();
    }).catch(function (err) {
      finishBusy();
      setFb("bad", err && err.name === "AbortError" ? "The read took too long. Try again." : "The phone lost the connection. Try again.");
      syncSubmit();
    });
  }
  function openVideo(id) {
    var catalog = (window.WRAP911_DATA && window.WRAP911_DATA.VIDEO_CATALOG) || [];
    var item = null;
    for (var i = 0; i < catalog.length; i++) if (catalog[i] && catalog[i].id === id) item = catalog[i];
    var c = core();
    if (!item || !c || !c.showScreen) return;
    if (!paid() && item.access !== "free") {
      var fb = $("unlock-feedback");
      if (fb) { fb.className = "quiz-feedback bad"; fb.textContent = "That clip is in the pack. Open Pricing."; }
      c.showScreen("pricing");
      return;
    }
    var filter = $("video-filter-cat");
    if (filter) filter.value = "";
    if (APP.renderVideos) APP.renderVideos();
    c.showScreen("videos");
    setTimeout(function () {
      if (APP.renderVideos) APP.renderVideos();
      var src = String(item.src || "").replace(/^\.\//, "");
      var card = document.querySelector('[data-video-src="' + src.replace(/"/g, "") + '"]');
      if (!card) return;
      try { card.scrollIntoView({ block: "center" }); } catch (e) {}
      var play = card.querySelector(".video-play-btn");
      if (play) play.click();
    }, 60);
  }
  function render() {
    var wrap = $("problem-doctor-wrap");
    if (!wrap) return;
    var q = quota();
    var blocked = q.left < 1 && !sampleMode();
    wrap.innerHTML =
      '<p class="lead">Photo or short video of the vinyl problem. Up to 60 seconds. Add a note if you know the film, the surface, or what happened.</p>' +
      '<p class="muted doctor-note" id="problem-doctor-quota">' + esc(quotaText()) + "</p>" +
      '<p class="muted doctor-note">Photos and video frames are sent to xAI (Grok) for this read. They are not stored. Do not include customer names or job-site details.</p>' +
      (blocked
        ? '<div class="passion-note"><strong>' + (q.paid ? "Daily limit" : "Free look") + "</strong><p>" +
          esc(q.paid ? "You have used today's " + q.limit + " reads. Try again tomorrow." : "You have used today's free read. A Shop Pack, Seat, or 7-Day Pass includes " + limits().paid + " a day.") +
          "</p></div>" + (q.paid ? "" : '<button type="button" id="problem-doctor-pricing">Open Pricing</button>')
        : "") +
      '<form id="problem-doctor-form" class="job-form" onsubmit="return false;">' +
      '<div class="quiz-nav"><button type="button" id="problem-doctor-take">Take photo or video</button> <button type="button" class="secondary" id="problem-doctor-pick">Choose photo or video</button></div>' +
      '<input type="file" id="problem-doctor-cam" accept="image/*,video/*" capture="environment" hidden>' +
      '<input type="file" id="problem-doctor-file" accept="image/*,video/*" hidden>' +
      '<div id="problem-doctor-thumbs" class="doctor-thumbs" hidden></div>' +
      '<p class="muted" id="problem-doctor-size"></p>' +
      '<label>Note<textarea id="problem-doctor-note" rows="2" maxlength="500" placeholder="Optional. Which film, which surface, what happened."></textarea></label>' +
      '<div class="accept-row"><input type="checkbox" id="problem-doctor-consent"><label for="problem-doctor-consent">I agree to send this photo or these frames to xAI (Grok). They are not stored. I will not include customer names or job-site details.</label></div>' +
      '<button type="button" id="problem-doctor-submit"' + (blocked ? " disabled" : "") + ">Read this problem</button></form>" +
      '<div id="problem-doctor-result"></div><div class="quiz-feedback" id="problem-doctor-fb"></div>';
    var back = $("btn-back-problem-doctor");
    if (back) back.textContent = from === "coach" ? "← Back to Coach" : (from === "problem-upload" ? "← Back" : "← Back to home");
    var pricing = $("problem-doctor-pricing");
    if (pricing) pricing.addEventListener("click", goPricing);
    var take = $("problem-doctor-take");
    var pick = $("problem-doctor-pick");
    var cam = $("problem-doctor-cam");
    var file = $("problem-doctor-file");
    if (take && cam) take.addEventListener("click", function () { cam.click(); });
    if (pick && file) pick.addEventListener("click", function () { file.click(); });
    if (cam) cam.addEventListener("change", function () { if (cam.files && cam.files[0]) readFile(cam.files[0]); cam.value = ""; });
    if (file) file.addEventListener("change", function () { if (file.files && file.files[0]) readFile(file.files[0]); file.value = ""; });
    var consent = $("problem-doctor-consent");
    if (consent) consent.addEventListener("change", syncSubmit);
    var submit = $("problem-doctor-submit");
    if (submit) submit.addEventListener("click", send);
    var note = $("problem-doctor-note");
    if (note && carriedNote && !note.value) note.value = carriedNote;
    var result = $("problem-doctor-result");
    if (result && !result.getAttribute("data-bound")) {
      result.setAttribute("data-bound", "1");
      result.addEventListener("click", function (ev) {
        var lesson = ev.target.closest && ev.target.closest("[data-doctor-lesson]");
        var video = ev.target.closest && ev.target.closest("[data-doctor-video]");
        if (lesson && APP.openLesson) APP.openLesson(lesson.getAttribute("data-doctor-lesson"));
        else if (video) openVideo(video.getAttribute("data-doctor-video"));
      });
    }
    if (saved && saved.frames) {
      frames = saved.frames.slice();
      meta = saved.meta;
      paintThumbs();
      if (saved.result) paintResult(saved.result);
    }
    syncSubmit();
  }
  function open(source, note) {
    from = source || "home";
    if (typeof note === "string" && note.trim()) carriedNote = note.trim().slice(0, 500);
    var c = core();
    if (c && c.showScreen) c.showScreen("problem-doctor");
    render();
  }
  function back() {
    var c = core();
    if (!c || !c.showScreen) return;
    if (from === "coach") {
      if (window.WRAP911_COACH && window.WRAP911_COACH.renderCoach) window.WRAP911_COACH.renderCoach();
      c.showScreen("coach");
      return;
    }
    if (from === "problem-upload") {
      if (APP.renderProblemUpload) APP.renderProblemUpload();
      c.showScreen("problem-upload");
      return;
    }
    if (from === "job" && c.state && c.state.jobId && APP.openJobEdit) {
      APP.openJobEdit(c.state.jobId);
      return;
    }
    c.showScreen("home");
  }
  function injectReportButton() {
    if (!APP.renderProblemUpload || APP.renderProblemUpload._doctor) return;
    var inner = APP.renderProblemUpload;
    function wrapped() {
      inner.apply(this, arguments);
      var host = $("problem-upload-wrap");
      if (!host || host.querySelector("#goto-problem-doctor-upload")) return;
      var row = document.createElement("p");
      row.className = "doctor-entry";
      row.innerHTML = '<button type="button" class="secondary" id="goto-problem-doctor-upload">Ask Problem Doctor</button> Get a read on the photo before you file it.';
      host.insertBefore(row, host.firstChild);
      var btn = $("goto-problem-doctor-upload");
      if (btn) btn.addEventListener("click", function () {
        var what = $("pu-what");
        var area = $("pu-area");
        var bits = [];
        if (what && what.value.trim()) bits.push(what.value.trim());
        if (area && area.value.trim()) bits.push(area.value.trim());
        open("problem-upload", bits.join(". "));
      });
    }
    wrapped._doctor = true;
    APP.renderProblemUpload = wrapped;
  }
  function bind() {
    injectReportButton();
    var home = $("goto-problem-doctor");
    if (home && !home.getAttribute("data-bound")) {
      home.setAttribute("data-bound", "1");
      home.addEventListener("click", function () { open("home", ""); });
      home.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open("home", ""); }
      });
    }
    var coach = $("goto-problem-doctor-coach");
    if (coach && !coach.getAttribute("data-bound")) {
      coach.setAttribute("data-bound", "1");
      coach.addEventListener("click", function () {
        var input = $("coach-input");
        open("coach", input ? input.value : "");
      });
    }
    var backBtn = $("btn-back-problem-doctor");
    if (backBtn && !backBtn.getAttribute("data-bound")) {
      backBtn.setAttribute("data-bound", "1");
      backBtn.addEventListener("click", back);
    }
    document.documentElement.setAttribute("data-problem-doctor", "1");
  }
  function css() {
    if (document.getElementById("w911-doctor-css")) return;
    var style = document.createElement("style");
    style.id = "w911-doctor-css";
    style.textContent = ".doctor-entry{margin:1rem 0 .8rem}.doctor-entry button{margin:0 .4rem .4rem 0}" +
      ".doctor-thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}" +
      ".doctor-thumbs img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#1a1520}" +
      ".doctor-card h3{margin:.85rem 0 .3rem;font-size:1rem}.doctor-conf{margin:0 0 .4rem;color:#ffb000;font-size:.82rem;letter-spacing:.04em;text-transform:uppercase}" +
      ".doctor-watch button{margin:.15rem .35rem .15rem 0}.doctor-note{font-size:.82rem}";
    document.head.appendChild(style);
  }
  APP.openProblemDoctor = open;
  function boot() {
    css();
    installMatch();
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if ((core() && core().showScreen) || tries > 80) { clearInterval(timer); bind(); }
    }, 50);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  function installMatch() {
    var stop = { the: 1, and: 1, for: 1, with: 1, this: 1, that: 1, from: 1, your: 1, into: 1, over: 1, film: 1, vinyl: 1, wrap: 1, problem: 1 };
    var weak = { edge: 1, heat: 1, post: 1, lift: 1, panel: 1, door: 1, side: 1, area: 1, head: 1, line: 1, tool: 1 };
    var extra = {
      bubble: ["silvering", "air"], bubbles: ["silvering", "air"], tent: ["rivet", "bridge"], tenting: ["rivet", "bridge", "tent"],
      tents: ["rivet", "bridge"], lift: ["edge", "lifting"], lifting: ["edge", "lift"], lifted: ["edge", "lift"],
      wrinkle: ["recess", "finger"], wrinkles: ["recess", "finger"], seam: ["overlap"], gap: ["seam", "overlap"], gaps: ["seam", "overlap"],
      discolor: ["stretch"], discolored: ["stretch"], overstretched: ["stretch"], stretch: ["thin"], rivet: ["rivets"], rivets: ["rivet"]
    };
    function norm(s) { return String(s || "").toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim(); }
    function packKeys(list) {
      var phrases = [], words = [], extras = [];
      function add(arr, value) {
        var text = norm(value);
        if (text && !stop[text] && arr.indexOf(text) === -1) arr.push(text);
      }
      var items = Array.isArray(list) ? list : [];
      for (var i = 0; i < items.length; i++) {
        var phrase = norm(items[i]);
        if (!phrase) continue;
        add(phrases, phrase);
        var parts = phrase.split(" ");
        for (var p = 0; p < parts.length; p++) if (parts[p].length > 2 && !weak[parts[p]]) add(words, parts[p]);
      }
      for (var w = 0; w < words.length; w++) {
        var more = extra[words[w]] || [];
        for (var m = 0; m < more.length; m++) {
          var bit = norm(more[m]);
          if (bit && !weak[bit] && words.indexOf(bit) === -1) add(extras, bit);
        }
      }
      return { phrases: phrases, words: words, extras: extras };
    }
    function hits(text, keys, weight) {
      var hay = " " + norm(text) + " ";
      var score = 0;
      for (var i = 0; i < keys.length; i++) if (hay.indexOf(keys[i]) !== -1) score += weight;
      return score;
    }
    function scoreText(title, body, keys) {
      return hits(title, keys.phrases, 12) + hits(body, keys.phrases, 4) + hits(title, keys.words, 8) + hits(body, keys.words, 3) + hits(title, keys.extras, 5) + hits(body, keys.extras, 2);
    }
    /* Surface words (bumper, recess, rivet...) decide what fits. A clip that only shares a process word
       (post-heat, seam, panel) with the answer is a weak match and is dropped. */
    var SURFACE = /bumper|fascia|recess|pocket|taillight|liftgate|plate|rivet|channel|corrugat|roll ?up|door|hinge|mirror|handle|glass|window|storefront|wall|cabinet|cubby|trailer|box truck|van|hood|roof|fender|pillar|marker|emblem|tailgate/;
    var MIN_SCORE = 20;
    function surfaceKeys(keys) {
      var out = [];
      var all = keys.phrases.concat(keys.words);
      for (var i = 0; i < all.length; i++) if (SURFACE.test(all[i]) && out.indexOf(all[i]) === -1) out.push(all[i]);
      return out;
    }
    /* Architectural clips (walls, cubbies, glass) never fill in for a vehicle answer, and the other way round. */
    var ARCH = /wall|cabinet|cubby|glass|window|storefront/;
    function domainOf(key) { return !key ? "" : ARCH.test(key) ? "arch" : "vehicle"; }
    function itemDomain(item) {
      var tag = norm([item.category, item.id].join(" "));
      if (/storefront|architectural|^sf /.test(tag)) return "arch";
      if (/^prep|^qc/.test(norm(item.category || ""))) return "";
      return "vehicle";
    }
    function fits(item, domain) {
      var d = itemDomain(item);
      return !domain || !d || d === domain;
    }
    function hasAny(text, list) {
      var hay = " " + norm(text) + " ";
      for (var i = 0; i < list.length; i++) if (hay.indexOf(list[i]) !== -1) return true;
      return false;
    }
    function top(rows, n) {
      rows.sort(function (a, b) { return b.score - a.score || String(a.title).localeCompare(String(b.title)); });
      var out = [];
      var best = rows.length ? rows[0].score : 0;
      for (var i = 0; i < rows.length && out.length < n; i++) if (rows[i].score >= MIN_SCORE && rows[i].score >= best / 2) out.push(rows[i]);
      return out;
    }
    window.WRAP911_DOCTOR_MATCH = {
      matchCatalog: function (keywords, data, count) {
        var keys = packKeys(keywords);
        var surf = surfaceKeys(keys);
        var max = count || 3;
        var domain = domainOf(surf[0]);
        var lessons = (data && data.trainingLessons) || [];
        var videos = (data && data.VIDEO_CATALOG) || [];
        var lessonRows = [];
        var videoRows = [];
        var i, item, score;
        for (i = 0; i < lessons.length; i++) {
          item = lessons[i];
          if (!item || !item.id) continue;
          var body = [item.goal, item.id, (item.keyTechniques || []).join(" "), (item.commonMistakes || []).join(" "), (item.steps || []).join(" ")].join(" ");
          score = scoreText(item.title, body, keys);
          if (surf.length && !hasAny(item.title + " " + body, surf)) score = 0;
          if (!fits(item, domain)) score = 0;
          if (score) lessonRows.push({ id: item.id, title: item.title || item.id, score: score });
        }
        var picked = top(lessonRows, max);
        var seen = {};
        for (i = 0; i < picked.length; i++) seen[picked[i].id] = 1;
        for (i = 0; i < videos.length; i++) {
          item = videos[i];
          if (!item || !item.id) continue;
          var vbody = [item.category, item.subcategory, item.note, item.id, item.recommendedModule, item.src].join(" ");
          score = scoreText(item.title, vbody, keys);
          if (surf.length && !hasAny(item.title + " " + vbody, surf)) score = 0;
          if (!fits(item, domain)) score = 0;
          if (score && item.recommendedModule && seen[item.recommendedModule]) score += 6;
          if (score) videoRows.push({ id: item.id, title: item.title || item.id, score: score, src: item.src || "", access: item.access || "" });
        }
        /* At most `max` chips in total, best first across lessons and videos. Zero is fine. */
        var pool = picked.map(function (r) { r.kind = "lesson"; return r; }).concat(top(videoRows, max).map(function (r) { r.kind = "video"; return r; }));
        pool.sort(function (a, b) { return b.score - a.score; });
        var poolBest = pool.length ? pool[0].score : 0;
        pool = pool.filter(function (r) { return r.score >= poolBest / 2; }).slice(0, max);
        return {
          lessons: pool.filter(function (r) { return r.kind === "lesson"; }),
          videos: pool.filter(function (r) { return r.kind === "video"; })
        };
      }
    };
  }
})();
