/* Problem Doctor. Photo or short video in, shop read out. Frames stay in memory for this visit only. */
(function () {
  "use strict";

  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var MAX_EDGE = 1024;
  var JPEG_Q = 0.82;
  var FRAMES = 5;
  var MAX_CLIP_S = 60;
  var QUOTA_KEY = "wrap911_doctor_quota";
  var pending = null;
  var pendingMeta = null;
  var returnTo = "home";
  var prefill = "";
  var session = null;

  function core() { return APP.core || null; }
  function $(id) { return document.getElementById(id); }
  function cfg() { return window.WRAP911_CONFIG || {}; }

  function escapeHtml(s) {
    var c = core();
    if (c && c.escapeHtml) return c.escapeHtml(s);
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* HOME and CREW are not paid for the rest of the trainer. Problem Doctor still gives them the paid daily cap. */
  function ownerCodePaid() {
    var lic = null;
    var c = core();
    try { lic = c && c.loadLicense ? c.loadLicense() : null; } catch (e) {}
    if (!lic) {
      try { lic = JSON.parse(localStorage.getItem("wrap911_license") || "null"); } catch (e2) { lic = null; }
    }
    if (!lic || lic.expired) return false;
    if (lic.expiresAt && Date.now() > Number(lic.expiresAt)) return false;
    var code = String(lic.code || "").toUpperCase();
    return code === "HOME" || code === "CREW";
  }

  function isPaid() {
    if (ownerCodePaid()) return true;
    try {
      if (window.WRAP911_GATE && window.WRAP911_GATE.paid && window.WRAP911_GATE.paid()) return true;
    } catch (e) {}
    var c = core();
    try { return !!(c && c.hasFullAccess && c.hasFullAccess()); } catch (e2) { return false; }
  }

  function dayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  function limits() {
    var c = cfg();
    var freeN = Number(c.doctorFreePerDay);
    var paidN = Number(c.doctorPaidPerDay);
    return {
      free: freeN > 0 ? freeN : 1,
      paid: paidN > 0 ? paidN : 15
    };
  }

  function quota() {
    var paid = isPaid();
    var cap = paid ? limits().paid : limits().free;
    var used = 0;
    try {
      var raw = JSON.parse(localStorage.getItem(QUOTA_KEY) || "null");
      if (raw && raw.day === dayKey()) used = Number(raw.used) || 0;
    } catch (e) {}
    return { paid: paid, limit: cap, used: used, left: Math.max(0, cap - used) };
  }

  function bumpQuota() {
    var q = quota();
    try {
      localStorage.setItem(QUOTA_KEY, JSON.stringify({ day: dayKey(), used: q.used + 1 }));
    } catch (e) {}
  }

  function sampleMode() {
    try { return new URLSearchParams(window.location.search).get("doctor") === "sample"; } catch (e) { return false; }
  }

  function endpoint() {
    try {
      var ls = localStorage.getItem("wrap911_ai_endpoint");
      if (ls && String(ls).trim()) return String(ls).trim().replace(/\/$/, "") + "/coach/doctor";
    } catch (e) {}
    var base = String(cfg().aiEndpoint || "").trim();
    return base ? base.replace(/\/$/, "") + "/coach/doctor" : "";
  }

  function scrub(value) {
    var t = String(value || "");
    t = t.replace(/\b(arlon|oracal|orafol|hexis|vvivid|inozetek|kpmf|teckwrap|tinybot)\b/gi, "that film");
    t = t.replace(/\b-?\d+(?:\.\d+)?\s*(?:°|degrees?)\s*[fFcC]?\b/g, "the range on the film TDS");
    t = t.replace(/\b(?:to|at|about|around)\s+\d{2,3}\s*(?:°\s*)?(?:f|c|fahrenheit|celsius)\b/gi, "within the film TDS");
    t = t.replace(/\b\d{2,3}\s*(?:°\s*)?(?:f|c|fahrenheit|celsius)\b/gi, "the film TDS");
    t = t.replace(/\bcertifications?\b/gi, "shop training");
    t = t.replace(/\bcertified\b/gi, "trained");
    return t.replace(/[ \t]{2,}/g, " ").trim();
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

  function isVideo(file) {
    if (!file) return false;
    var type = file.type || "";
    var name = file.name || "";
    return /^video\//.test(type) || (!type && /\.(mov|mp4|m4v|webm)$/i.test(name));
  }

  function compressFile(file) {
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

  function videoFrames(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var v = document.createElement("video");
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      v.setAttribute("muted", "");
      v.preload = "auto";
      var frames = [];
      var times = [];
      var idx = 0;
      var started = false;
      var finished = false;
      var dur = 0;
      var w = 0;
      var h = 0;
      var guard = setTimeout(function () { fail("That video took too long to read. Try a shorter clip or a photo."); }, 30000);
      function cleanup() {
        clearTimeout(guard);
        try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {}
        URL.revokeObjectURL(url);
      }
      function fail(msg) {
        if (finished) return;
        finished = true;
        cleanup();
        reject(new Error(msg));
      }
      function grab() {
        try {
          var scale = Math.min(1, MAX_EDGE / Math.max(w, h, 1));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement("canvas");
          canvas.width = cw;
          canvas.height = ch;
          canvas.getContext("2d").drawImage(v, 0, 0, cw, ch);
          frames.push(canvas.toDataURL("image/jpeg", JPEG_Q));
        } catch (e) {
          fail("Could not read frames from that video.");
          return;
        }
        idx++;
        if (idx >= times.length) {
          finished = true;
          cleanup();
          var edge = Math.min(1, MAX_EDGE / Math.max(w, h, 1));
          resolve({
            frames: frames,
            width: Math.round(w * edge),
            height: Math.round(h * edge),
            duration: dur
          });
          return;
        }
        seek();
      }
      function seek() {
        var done = false;
        function onSeeked() {
          if (done) return;
          done = true;
          v.removeEventListener("seeked", onSeeked);
          setTimeout(grab, 60);
        }
        v.addEventListener("seeked", onSeeked);
        try { v.currentTime = times[idx]; } catch (e2) { fail("Could not read frames from that video."); }
      }
      v.addEventListener("error", function () { fail("This browser cannot open that video. Try a photo instead."); });
      v.addEventListener("loadedmetadata", function () {
        dur = v.duration;
        w = v.videoWidth;
        h = v.videoHeight;
        if (!isFinite(dur) || dur <= 0 || !w || !h) { fail("Could not read that video."); return; }
        if (dur > MAX_CLIP_S + 1) { fail("Keep the clip to " + MAX_CLIP_S + " seconds or less."); return; }
        var n = FRAMES;
        var i;
        for (i = 0; i < n; i++) times.push(Math.min(dur - 0.05, Math.max(0.05, dur * (i + 0.5) / n)));
        arm();
      });
      function arm() {
        if (finished || started || !times.length || v.readyState < 2) return;
        started = true;
        var pr = null;
        try { pr = v.play(); } catch (e3) {}
        var go = function () { try { v.pause(); } catch (e4) {} seek(); };
        if (pr && pr.then) pr.then(go, go);
        else go();
      }
      v.addEventListener("loadeddata", arm);
      v.src = url;
      try { v.load(); } catch (e5) {}
    });
  }

  function readMedia(file) {
    if (isVideo(file)) return videoFrames(file);
    return compressFile(file);
  }

  function say(kind, text) {
    var fb = $("problem-doctor-fb");
    if (!fb) return;
    fb.className = "quiz-feedback" + (text ? " show " + (kind || "") : "");
    fb.textContent = text || "";
  }

  function quotaLine() {
    var q = quota();
    if (q.paid) return q.left + " of " + q.limit + " reads left today.";
    if (q.left > 0) return "Free look: 1 read left today. Pack or Seat includes " + limits().paid + " a day.";
    return "Free look: no reads left today. Pack or Seat includes " + limits().paid + " a day.";
  }

  function showThumbs(frames, meta) {
    var thumbs = $("problem-doctor-thumbs");
    var size = $("problem-doctor-size");
    if (!thumbs) return;
    var html = "";
    var i;
    for (i = 0; i < frames.length; i++) {
      html += '<img src="' + frames[i] + '" alt="Frame ' + (i + 1) + '">';
    }
    thumbs.innerHTML = html;
    thumbs.hidden = !frames.length;
    if (size) {
      if (meta && meta.duration) {
        size.textContent = frames.length + " frames from a " + Math.round(meta.duration) + " s clip, " + meta.width + "×" + meta.height + " JPEG. The video is not uploaded.";
      } else if (meta) {
        size.textContent = "Resized to " + meta.width + "×" + meta.height + " JPEG. Not saved on this phone.";
      } else size.textContent = "";
    }
  }

  function items(list, tag) {
    if (!list || !list.length) return "";
    var h = "<" + tag + ' class="' + (tag === "ol" ? "steps-list" : "checklist") + '">';
    var i;
    for (i = 0; i < list.length; i++) h += "<li>" + escapeHtml(scrub(list[i])) + "</li>";
    return h + "</" + tag + ">";
  }

  function watchHtml(result) {
    var match = window.WRAP911_DOCTOR_MATCH && window.WRAP911_DOCTOR_MATCH.matchCatalog;
    if (!match) return "";
    var hit = match(result.lesson_keywords || [], window.WRAP911_DATA || {}, 3);
    var lessons = hit.lessons || [];
    var videos = hit.videos || [];
    if (!lessons.length && !videos.length) return "";
    var html = "<h3>Watch this</h3><div class=\"doctor-watch\">";
    var i;
    for (i = 0; i < lessons.length; i++) {
      html += '<button type="button" class="secondary" data-doctor-lesson="' + escapeHtml(lessons[i].id) + '">' + escapeHtml(lessons[i].title) + "</button>";
    }
    for (i = 0; i < videos.length; i++) {
      html += '<button type="button" class="secondary" data-doctor-video="' + escapeHtml(videos[i].id) + '">' + escapeHtml(videos[i].title) + "</button>";
    }
    return html + "</div>";
  }

  function resultHtml(data) {
    var conf = String(data.confidence || "low").toLowerCase();
    if (conf !== "low" && conf !== "medium" && conf !== "high") conf = "low";
    var low = conf === "low"
      ? "<p>If this does not match the panel, send a closer photo.</p>"
      : "";
    return (
      '<div class="card doctor-card">' +
      '<p class="doctor-conf">Confidence: ' + escapeHtml(conf) + "</p>" +
      '<div class="passion-note"><strong>AI suggestion</strong><p>' + escapeHtml(data.disclaimer || "AI suggestion. Check the film TDS before you heat anything.") + "</p></div>" +
      "<h3>What it shows</h3><p>" + escapeHtml(scrub(data.observations || "")) + "</p>" + low +
      "<h3>Likely cause</h3>" + (items(data.likely_causes, "ul") || "<p class=\"muted\">No cause until the photo is clearer.</p>") +
      "<h3>Fix</h3>" + (items(data.fix_steps, "ol") || "<p class=\"muted\">No fix until the photo is clearer.</p>") +
      "<h3>Next time</h3>" + (items(data.prevention, "ul") || "<p class=\"muted\">No prevention note yet.</p>") +
      watchHtml(data) +
      "</div>"
    );
  }

  function paint(data) {
    var box = $("problem-doctor-result");
    if (box) box.innerHTML = resultHtml(data);
  }

  function formHtml() {
    var q = quota();
    var locked = q.left < 1 && !sampleMode();
    return (
      '<p class="lead">Photo or short video of the vinyl problem. Up to 60 seconds. Add a note if you know the film, the surface, or what happened.</p>' +
      '<p class="muted doctor-note" id="problem-doctor-quota">' + escapeHtml(quotaLine()) + "</p>" +
      '<p class="muted doctor-note">Photos and video frames are sent to an AI service for this read. They are not stored.</p>' +
      (locked ? '<div class="passion-note"><strong>' + (q.paid ? "Daily limit" : "Free look") + "</strong><p>" +
        escapeHtml(q.paid
          ? "You have used today's " + q.limit + " reads. Try again tomorrow."
          : "You have used today's free read. Pack or Seat includes " + limits().paid + " a day.") +
        "</p></div>" + (q.paid ? "" : '<button type="button" id="problem-doctor-pricing">See Pack and Seat</button>') : "") +
      '<form id="problem-doctor-form" class="job-form" onsubmit="return false;">' +
      '<div class="quiz-nav"><button type="button" id="problem-doctor-take">Take photo or video</button> <button type="button" class="secondary" id="problem-doctor-pick">Choose photo or video</button></div>' +
      '<input type="file" id="problem-doctor-cam" accept="image/*,video/*" capture="environment" hidden>' +
      '<input type="file" id="problem-doctor-file" accept="image/*,video/*" hidden>' +
      '<div id="problem-doctor-thumbs" class="doctor-thumbs" hidden></div>' +
      '<p class="muted" id="problem-doctor-size"></p>' +
      '<label>Note<textarea id="problem-doctor-note" rows="2" maxlength="500" placeholder="Optional. Which film, which surface, what happened."></textarea></label>' +
      '<div class="accept-row"><input type="checkbox" id="problem-doctor-consent"><label for="problem-doctor-consent">I agree to send this photo or these frames for a read. They are not stored.</label></div>' +
      '<button type="button" id="problem-doctor-submit"' + (locked ? " disabled" : "") + ">Read this problem</button>" +
      "</form>" +
      '<div id="problem-doctor-result"></div>' +
      '<div class="quiz-feedback" id="problem-doctor-fb"></div>'
    );
  }

  function syncSubmit() {
    var btn = $("problem-doctor-submit");
    var consent = $("problem-doctor-consent");
    if (!btn || btn.getAttribute("data-busy") === "1") return;
    var q = quota();
    btn.disabled = !(pending && pending.length && consent && consent.checked) || (q.left < 1 && !sampleMode());
  }

  function onFile(file) {
    say("", "");
    var box = $("problem-doctor-result");
    if (box) box.innerHTML = "";
    pending = null;
    pendingMeta = null;
    syncSubmit();
    if (isVideo(file)) say("", "Pulling frames from the video.");
    readMedia(file).then(function (out) {
      pending = out.frames.slice(0, 6);
      pendingMeta = out;
      showThumbs(pending, out);
      say("", "");
      syncSubmit();
    }).catch(function (err) {
      pending = null;
      pendingMeta = null;
      syncSubmit();
      say("bad", err && err.message ? err.message : "Could not read that file.");
    });
  }

  function goPricing() {
    var c = core();
    if (c && c.showScreen) c.showScreen("pricing");
  }

  function findVideo(id) {
    var list = (window.WRAP911_DATA && window.WRAP911_DATA.VIDEO_CATALOG) || [];
    var i;
    for (i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
    return null;
  }

  function openClip(item) {
    var c = core();
    if (!item || !c || !c.showScreen) return;
    var free = item.access === "free";
    if (!isPaid() && !free) {
      var fb = $("unlock-feedback");
      if (fb) {
        fb.className = "quiz-feedback bad";
        fb.textContent = "That clip is in the pack. Pack $149 or seat $49.";
      }
      c.showScreen("pricing");
      return;
    }
    var sel = $("video-filter-cat");
    if (sel) sel.value = "";
    if (APP.renderVideos) APP.renderVideos();
    c.showScreen("videos");
    setTimeout(function () {
      if (APP.renderVideos) APP.renderVideos();
      var src = String(item.src || "").replace(/^\.\//, "");
      var host = document.querySelector('[data-video-src="' + src.replace(/"/g, "") + '"]');
      if (!host) return;
      try { host.scrollIntoView({ block: "center" }); } catch (e) {}
      var btn = host.querySelector(".video-play-btn");
      if (btn) btn.click();
    }, 60);
  }

  function bindResult() {
    var box = $("problem-doctor-result");
    if (!box || box.getAttribute("data-bound")) return;
    box.setAttribute("data-bound", "1");
    box.addEventListener("click", function (ev) {
      var lessonBtn = ev.target.closest("[data-doctor-lesson]");
      var videoBtn = ev.target.closest("[data-doctor-video]");
      if (lessonBtn && APP.openLesson) {
        APP.openLesson(lessonBtn.getAttribute("data-doctor-lesson"));
        return;
      }
      if (videoBtn) openClip(findVideo(videoBtn.getAttribute("data-doctor-video")));
    });
  }

  function submit() {
    if (!pending || !pending.length) { say("bad", "Add a photo or a short video first."); return; }
    var consent = $("problem-doctor-consent");
    if (!consent || !consent.checked) { say("bad", "Confirm that the photo or frames can be sent. Nothing is stored."); return; }
    var q = quota();
    if (q.left < 1 && !sampleMode()) {
      say("bad", q.paid ? "You have used today's reads." : "You have used today's free read.");
      return;
    }
    var btn = $("problem-doctor-submit");
    if (btn) { btn.disabled = true; btn.setAttribute("data-busy", "1"); }
    var noteEl = $("problem-doctor-note");
    var note = noteEl ? String(noteEl.value || "").trim().slice(0, 500) : "";
    if (sampleMode()) {
      var sample = sampleResult();
      session = { frames: pending.slice(), meta: pendingMeta, result: sample };
      paint(sample);
      say("ok", "Sample read. Nothing was sent or saved.");
      if (btn) btn.removeAttribute("data-busy");
      syncSubmit();
      return;
    }
    var url = endpoint();
    if (!url) {
      say("bad", "Problem Doctor is not connected on this phone yet.");
      if (btn) btn.removeAttribute("data-busy");
      syncSubmit();
      return;
    }
    var started = Date.now();
    var frames = pending.slice();
    var meta = pendingMeta;
    say("", "Reading the photo. Keep this screen open.");
    var ticker = setInterval(function () {
      say("", "Reading the photo. " + Math.round((Date.now() - started) / 1000) + " s. Keep this screen open.");
    }, 1000);
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var killer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 90000);
    function done() { clearInterval(ticker); clearTimeout(killer); if (btn) btn.removeAttribute("data-busy"); }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true, images: frames, note: note }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        return { status: res.status, data: data };
      });
    }).then(function (out) {
      done();
      var data = out.data || {};
      if (out.status === 429) {
        var cap = quota().limit;
        var used = cap;
        if (data && data.remaining != null && isFinite(Number(data.remaining))) {
          used = Math.max(0, cap - Number(data.remaining));
        } else if (data && data.used != null && isFinite(Number(data.used))) {
          used = Math.max(0, Number(data.used));
        }
        try { localStorage.setItem(QUOTA_KEY, JSON.stringify({ day: dayKey(), used: used })); } catch (eQ) {}
        say("bad", data.error || "Too many reads. Wait and try again.");
        var line429 = $("problem-doctor-quota");
        if (line429) line429.textContent = quotaLine();
        syncSubmit();
        return;
      }
      if (!data.ok) { say("bad", data.error || "Problem Doctor could not read that photo."); syncSubmit(); return; }
      bumpQuota();
      var line = $("problem-doctor-quota");
      if (line) line.textContent = quotaLine();
      session = { frames: frames, meta: meta, result: data };
      paint(data);
      say("ok", "AI suggestion. The photo was not saved.");
      syncSubmit();
    }).catch(function (err) {
      done();
      var timedOut = err && err.name === "AbortError";
      say("bad", timedOut ? "The read took too long. Try again." : "The phone lost the connection. Try again.");
      syncSubmit();
    });
  }

  function bind() {
    var pricing = $("problem-doctor-pricing");
    if (pricing) pricing.addEventListener("click", goPricing);
    var take = $("problem-doctor-take");
    var pick = $("problem-doctor-pick");
    var cam = $("problem-doctor-cam");
    var file = $("problem-doctor-file");
    if (take && cam) take.addEventListener("click", function () { cam.click(); });
    if (pick && file) pick.addEventListener("click", function () { file.click(); });
    if (cam) cam.addEventListener("change", function () { if (cam.files && cam.files[0]) onFile(cam.files[0]); cam.value = ""; });
    if (file) file.addEventListener("change", function () { if (file.files && file.files[0]) onFile(file.files[0]); file.value = ""; });
    var consent = $("problem-doctor-consent");
    if (consent) consent.addEventListener("change", syncSubmit);
    var submitBtn = $("problem-doctor-submit");
    if (submitBtn) submitBtn.addEventListener("click", submit);
    var note = $("problem-doctor-note");
    if (note && prefill && !note.value) note.value = prefill;
    bindResult();
    if (session && session.frames) {
      pending = session.frames.slice();
      pendingMeta = session.meta;
      showThumbs(pending, pendingMeta);
      if (session.result) paint(session.result);
      syncSubmit();
    }
  }

  function backLabel() {
    if (returnTo === "coach") return "← Back to Coach";
    if (returnTo === "problem-upload") return "← Back";
    return "← Back to home";
  }

  function render() {
    var wrap = $("problem-doctor-wrap");
    if (!wrap) return;
    wrap.innerHTML = formHtml();
    var back = $("btn-back-problem-doctor");
    if (back) back.textContent = backLabel();
    bind();
  }

  function openScreen(from, note) {
    returnTo = from || "home";
    if (typeof note === "string" && note.trim()) prefill = note.trim().slice(0, 500);
    var c = core();
    if (!c || !c.showScreen) return;
    c.showScreen("problem-doctor");
    render();
  }

  function goBack() {
    var c = core();
    if (!c || !c.showScreen) return;
    if (returnTo === "coach") {
      if (window.WRAP911_COACH && window.WRAP911_COACH.renderCoach) window.WRAP911_COACH.renderCoach();
      c.showScreen("coach");
      return;
    }
    if (returnTo === "problem-upload") {
      if (APP.renderProblemUpload) APP.renderProblemUpload();
      c.showScreen("problem-upload");
      return;
    }
    c.showScreen("home");
  }

  function hookUpload() {
    if (APP.renderProblemUpload && APP.renderProblemUpload._doctor) return;
    var orig = APP.renderProblemUpload;
    function wrapped() {
      if (orig) orig();
      var wrap = $("problem-upload-wrap");
      if (!wrap || wrap.querySelector("#goto-problem-doctor-upload")) return;
      var row = document.createElement("p");
      row.className = "doctor-entry";
      row.innerHTML = '<button type="button" class="secondary" id="goto-problem-doctor-upload">Ask Problem Doctor</button> Get a read on the photo before you file it.';
      wrap.insertBefore(row, wrap.firstChild);
      var btn = $("goto-problem-doctor-upload");
      if (btn) btn.addEventListener("click", function () {
        var what = $("pu-what");
        var area = $("pu-area");
        var bits = [];
        if (what && what.value.trim()) bits.push(what.value.trim());
        if (area && area.value.trim()) bits.push(area.value.trim());
        openScreen("problem-upload", bits.join(". "));
      });
    }
    wrapped._doctor = true;
    APP.renderProblemUpload = wrapped;
  }

  function boot() {
    hookUpload();
    var card = $("goto-problem-doctor");
    if (card) {
      card.addEventListener("click", function () { openScreen("home", ""); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openScreen("home", ""); }
      });
    }
    var fromCoach = $("goto-problem-doctor-coach");
    if (fromCoach) fromCoach.addEventListener("click", function () {
      var input = $("coach-input");
      openScreen("coach", input ? input.value : "");
    });
    var back = $("btn-back-problem-doctor");
    if (back) back.addEventListener("click", goBack);
    document.documentElement.setAttribute("data-problem-doctor", "1");
  }

  APP.openProblemDoctor = openScreen;

  function whenReady(cb) {
    var n = 0;
    var t = setInterval(function () {
      n++;
      if ((core() && core().showScreen) || n > 80) { clearInterval(t); cb(); }
    }, 50);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { whenReady(boot); });
  else whenReady(boot);
})();
