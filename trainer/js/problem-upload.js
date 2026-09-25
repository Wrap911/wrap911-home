/* WRAP 911 — community problem uploads (local queue + optional Worker endpoint)
   Stores submissions in localStorage until a backend is wired.
   Endpoint: window.WRAP911_CONFIG.problemUploadEndpoint (optional).
*/
(function () {
  "use strict";

  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var STORE_KEY = "wrap911_problem_uploads";
  var MAX_BYTES = 6 * 1024 * 1024; // 6 MB per image

  function core() { return APP.core || null; }

  function $(id) {
    var c = core();
    return c ? c.$(id) : document.getElementById(id);
  }

  function escapeHtml(s) {
    var c = core();
    if (c) return c.escapeHtml(s);
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function loadQueue() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveQueue(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function fileToDataUrl(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(null, reader.result); };
    reader.onerror = function () { cb(reader.error || new Error("read failed")); };
    reader.readAsDataURL(file);
  }

  function getEndpoint() {
    var cfg = window.WRAP911_CONFIG || {};
    return (cfg.problemUploadEndpoint || "").trim();
  }

  function postToEndpoint(payload, cb) {
    var url = getEndpoint();
    if (!url) { cb(null, { queued: true }); return; }
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json().catch(function () { return {}; });
      }).then(function (data) { cb(null, data); })
        .catch(function (err) { cb(err); });
    } catch (e) { cb(e); }
  }

  /* ---------- Screen: render the upload form ---------- */
  APP.renderProblemUpload = function () {
    var wrap = $("problem-upload-wrap");
    if (!wrap) return;
    var fb = $("problem-upload-fb");
    if (fb) { fb.className = "quiz-feedback"; fb.textContent = ""; }

    wrap.innerHTML =
      '<div class="passion-note">' +
        '<strong>Show the mistake</strong>' +
        '<p>Shops post the perfect before-and-after. This is where the lifted edge, the cooked film, and the redo live — so the next hire learns from it.</p>' +
      '</div>' +
      '<form id="problem-upload-form" class="job-form" onsubmit="return false;">' +
        '<label>What failed<textarea id="pu-what" rows="2" placeholder="e.g. Rivet tented after heat, film lifted at sensor"></textarea></label>' +
        '<label>What you did to fix it<textarea id="pu-fix" rows="2" placeholder="e.g. Lifted, warmed to TDS, reseated ring then dome"></textarea></label>' +
        '<label>Vehicle / area (optional)<input type="text" id="pu-area" placeholder="e.g. Pickup rear bumper, headlight pocket"></label>' +
        '<label>Your name or shop (optional)<input type="text" id="pu-by" placeholder="e.g. Gerry / Rivera Wraps"></label>' +
        '<label>Photo<input type="file" id="pu-file" accept="image/*"></label>' +
        '<div id="pu-preview" class="pu-preview hidden"></div>' +
        '<p class="muted" style="font-size:0.82rem">Photos stay on this device until a backend is wired. Max 6 MB.</p>' +
        '<button type="button" id="pu-submit">Submit to the Problems queue</button>' +
      '</form>' +
      '<div class="card" style="margin-top:1rem"><h3 style="margin:0 0 .5rem">Queued submissions</h3><div id="pu-queue"></div></div>';

    var fileInput = $("pu-file");
    var preview = $("pu-preview");
    if (fileInput && preview) {
      fileInput.addEventListener("change", function () {
        var f = fileInput.files && fileInput.files[0];
        preview.classList.add("hidden");
        preview.innerHTML = "";
        if (!f) return;
        if (f.size > MAX_BYTES) {
          if (fb) { fb.className = "quiz-feedback show bad"; fb.textContent = "That photo is over 6 MB. Pick a smaller one."; }
          fileInput.value = "";
          return;
        }
        fileToDataUrl(f, function (err, dataUrl) {
          if (err) return;
          preview.innerHTML = '<img src="' + dataUrl + '" alt="preview" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px">';
          preview.classList.remove("hidden");
        });
      });
    }

    var submitBtn = $("pu-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", function () { APP.submitProblemUpload(); });
    }

    APP.renderProblemQueue();
  };

  APP.renderProblemQueue = function () {
    var box = $("pu-queue");
    if (!box) return;
    var q = loadQueue();
    if (!q.length) {
      box.innerHTML = '<p class="muted" style="margin:0">Nothing queued yet. Be the first to show a real bay mistake.</p>';
      return;
    }
    var html = "";
    for (var i = 0; i < q.length; i++) {
      var item = q[i];
      html += '<div class="card" style="margin-bottom:.6rem">' +
        (item.image ? '<img src="' + escapeHtml(item.image) + '" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:.5rem">' : "") +
        '<div class="card-title">' + escapeHtml(item.what || "Untitled problem") + "</div>" +
        (item.fix ? '<div class="card-sub"><strong>Fix:</strong> ' + escapeHtml(item.fix) + "</div>" : "") +
        (item.area ? '<div class="card-sub">' + escapeHtml(item.area) + "</div>" : "") +
        '<div class="muted" style="font-size:0.78rem;margin-top:.4rem">by ' + escapeHtml(item.by || "anonymous") +
          " · " + new Date(item.at || Date.now()).toLocaleDateString() + "</div>" +
        "</div>";
    }
    box.innerHTML = html;
  };

  APP.submitProblemUpload = function () {
    var fb = $("problem-upload-fb");
    var what = ($("pu-what") && $("pu-what").value || "").trim();
    var fix = ($("pu-fix") && $("pu-fix").value || "").trim();
    var area = ($("pu-area") && $("pu-area").value || "").trim();
    var by = ($("pu-by") && $("pu-by").value || "").trim();
    var fileInput = $("pu-file");
    var file = fileInput && fileInput.files && fileInput.files[0];

    if (!what) {
      if (fb) { fb.className = "quiz-feedback show bad"; fb.textContent = "Tell us what failed — even one line helps."; }
      return;
    }

    function finish(imageDataUrl) {
      var item = {
        id: "pu-" + Date.now(),
        what: what,
        fix: fix,
        area: area,
        by: by || "anonymous",
        image: imageDataUrl || "",
        at: Date.now(),
        status: "queued"
      };
      var payload = {
        type: "problem-upload",
        shop: (window.WRAP911_CONFIG && window.WRAP911_CONFIG.shopName) || "WRAP 911",
        item: item
      };

      postToEndpoint(payload, function (err, res) {
        var q = loadQueue();
        if (err) {
          q.unshift(item);
          saveQueue(q);
          if (fb) { fb.className = "quiz-feedback show ok"; fb.textContent = "Saved to your device queue. (Backend not reachable — will sync later.)"; }
        } else if (res && res.queued) {
          q.unshift(item);
          saveQueue(q);
          if (fb) { fb.className = "quiz-feedback show ok"; fb.textContent = "Queued locally. Connect a Worker endpoint in config to send it to the server."; }
        } else {
          if (fb) { fb.className = "quiz-feedback show ok"; fb.textContent = "Submitted. Thanks for showing the real mistake."; }
        }
        if ($("pu-what")) $("pu-what").value = "";
        if ($("pu-fix")) $("pu-fix").value = "";
        if ($("pu-area")) $("pu-area").value = "";
        if ($("pu-by")) $("pu-by").value = "";
        if (fileInput) fileInput.value = "";
        var preview = $("pu-preview");
        if (preview) { preview.classList.add("hidden"); preview.innerHTML = ""; }
        APP.renderProblemQueue();
      });
    }

    if (file) {
      if (file.size > MAX_BYTES) {
        if (fb) { fb.className = "quiz-feedback show bad"; fb.textContent = "Photo over 6 MB."; }
        return;
      }
      fileToDataUrl(file, function (err, dataUrl) {
        if (err) { if (fb) { fb.className = "quiz-feedback show bad"; fb.textContent = "Could not read that photo."; } return; }
        finish(dataUrl);
      });
    } else {
      finish("");
    }
  };

  APP.bindProblemUpload = function () {
    // listeners are wired inside renderProblemUpload
  };

})();
