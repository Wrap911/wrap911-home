/* Photo Fix — paid diagnosis from a photo. Off unless config.photoFix or ?photoFix=1.
   The photo is resized in the browser and is not saved. POST /coach/photo is not live yet;
   a missing route shows a coming-soon message. */
(function () {
  "use strict";

  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var pending = null;
  var MAX_EDGE = 1280;
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

  function licenseCode() {
    var c = core();
    var lic = null;
    try { lic = c && c.loadLicense ? c.loadLicense() : null; } catch (e) {}
    return lic && lic.code ? String(lic.code) : "";
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
  }

  function setCardVisible(on) {
    var card = $("goto-photo-fix");
    if (!card) return;
    card.classList.toggle("hidden", !on);
    card.hidden = !on;
  }

  function compressFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type || "")) { reject(new Error("Choose a photo.")); return; }
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
        "Warm the film only as the current 3M, Avery Dennison, or Arlon TDS allows for that SKU.",
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
      "<p>" + escapeHtml(data.disclaimer || "AI suggestion, verify on the job.") + " Check the current TDS for that 3M, Avery Dennison, or Arlon film before you heat or chemical anything.</p></div>" +
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
      "<p>Photo Fix reads a vinyl problem from a photo and suggests a fix. It is in the Shop Pack ($149, 5 phones, 12 months) and the Seat ($49, this phone, 12 months).</p></div>" +
      '<button type="button" id="photo-fix-pricing">See Pack and Seat</button>'
    );
  }

  function formHtml() {
    return (
      '<p class="lead">Take or choose a photo of the problem. Add a note if you know the film, the surface, or what it is doing. The photo is resized on this phone and is not saved.</p>' +
      '<form id="photo-fix-form" class="job-form" onsubmit="return false;">' +
      '<div class="quiz-nav"><button type="button" id="photo-fix-take">Take photo</button> <button type="button" class="secondary" id="photo-fix-pick">Choose photo</button></div>' +
      '<input type="file" id="photo-fix-cam" accept="image/*" capture="environment" hidden>' +
      '<input type="file" id="photo-fix-file" accept="image/*" hidden>' +
      '<img id="photo-fix-preview" class="photo-hero" alt="" hidden>' +
      '<p class="muted" id="photo-fix-size"></p>' +
      '<label>Material<input type="text" id="photo-fix-material" placeholder="Optional. 3M, Avery Dennison, or Arlon film"></label>' +
      '<label>Surface<input type="text" id="photo-fix-surface" placeholder="Optional. Rivets, recess, door edge, wall"></label>' +
      '<label>Symptom<textarea id="photo-fix-symptom" rows="2" placeholder="Optional. Lifting, bubbles, tenting, silvering"></textarea></label>' +
      '<div class="accept-row"><input type="checkbox" id="photo-fix-consent"><label for="photo-fix-consent">Send this photo for an AI suggestion. It is not stored.</label></div>' +
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
    compressFile(file).then(function (out) {
      pending = out.dataUrl;
      var img = $("photo-fix-preview");
      if (img) { img.src = out.dataUrl; img.hidden = false; }
      var size = $("photo-fix-size");
      if (size) size.textContent = "Resized to " + out.width + "×" + out.height + " JPEG. Not saved on this phone.";
      syncSubmit();
    }).catch(function (err) {
      pending = null;
      syncSubmit();
      say("bad", err && err.message ? err.message : "Could not read that photo.");
    });
  }

  function submit() {
    if (!pending) { say("bad", "Add a photo first."); return; }
    var consent = $("photo-fix-consent");
    if (!consent || !consent.checked) { say("bad", "Confirm that the photo can be sent. It is not stored."); return; }
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
    var body = {
      consent: true,
      image: pending,
      code: licenseCode(),
      device: deviceId(),
      material: field("photo-fix-material"),
      surface: field("photo-fix-surface"),
      symptom: field("photo-fix-symptom")
    };
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
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
      if (resultOk) resultOk.innerHTML = renderAnswer(out.data);
      say("ok", "AI suggestion, verify on the job. The photo was not saved.");
    }).catch(function () {
      pending = null;
      syncSubmit();
      var result = $("photo-fix-result");
      if (result) result.innerHTML = '<div class="passion-note"><strong>Coming soon</strong><p>Photo Fix could not reach the server. Your photo was not saved.</p></div>';
      say("", "Nothing was stored.");
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
