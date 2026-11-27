/* Job manager extras for WRAP 911 1.4: material result, time estimate, photos,
   film lot, practice timer, PDF share, Fix a Problem, and photo check. */
(function () {
  "use strict";
  var Logic = window.WRAP911_JOB_LOGIC;
  var Pdf = window.WRAP911_JOB_PDF;
  var APP = window.WRAP911_APP = window.WRAP911_APP || {};
  var current = null;
  var running = null;
  var tickTimer = null;
  var memoryPhotos = {};
  var MAX_PHOTOS = 6;

  function $(id) { return document.getElementById(id); }
  function core() { return APP.core || null; }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function val(id) {
    var el = $(id);
    return el ? el.value : "";
  }
  function setVal(id, value) {
    var el = $(id);
    if (el) el.value = value == null ? "" : value;
  }
  function license() {
    try { return JSON.parse(localStorage.getItem("wrap911_license") || "null"); } catch (e) { return null; }
  }
  function seatOrPack() {
    return !!(Logic && Logic.seatOrPack(license(), Date.now()));
  }
  function deviceId() {
    var key = "wrap911_device";
    var id = "";
    try { id = localStorage.getItem(key) || ""; } catch (e) {}
    if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      var bytes = new Uint8Array(16);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
      id = Array.prototype.map.call(bytes, function (n) { return ("0" + n.toString(16)).slice(-2); }).join("");
      try { localStorage.setItem(key, id); } catch (e2) {}
    }
    return id;
  }
  function jobId() {
    var c = core();
    return (c && c.state && c.state.jobId) || (current && current.id) || "";
  }
  function vehicleTitle(id) {
    var list = (window.WRAP911_DATA && window.WRAP911_DATA.vehicles) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].title || id;
    return id || "Job";
  }
  function stepsFor(type) {
    var map = (window.WRAP911_DATA && window.WRAP911_DATA.workflowSteps) || {};
    return map[type] || [];
  }
  function setFb(id, kind, text) {
    var el = $(id);
    if (!el) return;
    el.className = "quiz-feedback" + (text ? " show " + (kind || "") : "");
    el.textContent = text || "";
  }
  function photoKey(id, slot, photoId) { return id + ":" + slot + ":" + photoId; }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("no idb")); return; }
      var req = indexedDB.open("wrap911-job-photos", 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains("photos")) req.result.createObjectStore("photos");
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbPut(key, value) {
    memoryPhotos[key] = value;
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").put(value, key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    }).catch(function () { return false; });
  }
  function idbGet(key) {
    if (memoryPhotos[key]) return Promise.resolve(memoryPhotos[key]);
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction("photos", "readonly");
        var req = tx.objectStore("photos").get(key);
        req.onsuccess = function () {
          if (req.result) memoryPhotos[key] = req.result;
          resolve(req.result || null);
        };
        req.onerror = function () { resolve(null); };
      });
    }).catch(function () { return null; });
  }
  function idbDel(key) {
    delete memoryPhotos[key];
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction("photos", "readwrite");
        tx.objectStore("photos").delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      });
    }).catch(function () {});
  }

  function blankFrom(job) {
    job = job || {};
    var photos = job.photos || {};
    return {
      id: job.id || "",
      material: job.material || null,
      timeEstimate: job.timeEstimate || null,
      photos: {
        before: Array.isArray(photos.before) ? photos.before.slice() : [],
        after: Array.isArray(photos.after) ? photos.after.slice() : []
      },
      filmLine: job.filmLine || "",
      filmLot: job.filmLot || "",
      stepTimes: job.stepTimes || {},
      lastCheck: job.lastCheck || null
    };
  }

  function readHours() {
    if (!current) return;
    var el = $("job-hours");
    if (!el) return;
    var n = parseFloat(el.value);
    if (isNaN(n) || n < 0) n = 0;
    if (n > 24) n = 24;
    if (!current.timeEstimate) current.timeEstimate = { hours: n, starter: n, edited: false };
    if (String(n) !== String(current.timeEstimate.starter)) current.timeEstimate.edited = true;
    current.timeEstimate.hours = n;
  }

  function readInputs() {
    if (!current) return;
    current.filmLine = val("job-film-line").trim().slice(0, 80);
    current.filmLot = val("job-film-lot").trim().slice(0, 40);
    readHours();
  }

  function starterNow() {
    var type = val("job-type") || "box-truck";
    var sq = current && current.material ? current.material.adjusted : 0;
    return Logic.starterHours({ jobType: type, adjustedSqft: sq, coverage: val("job-coverage") });
  }

  function paintHours(resetEdited) {
    if (!current || !Logic) return;
    var note = $("job-hours-note");
    var starter = starterNow();
    if (!current.timeEstimate || resetEdited) {
      current.timeEstimate = { hours: starter, starter: starter, edited: false };
    } else if (!current.timeEstimate.edited) {
      current.timeEstimate.hours = starter;
      current.timeEstimate.starter = starter;
    } else {
      current.timeEstimate.starter = starter;
    }
    var hours = $("job-hours");
    if (hours && document.activeElement !== hours) hours.value = String(current.timeEstimate.hours);
    if (note) {
      note.textContent = Logic.timeLabel() + (current.timeEstimate.edited ? " You changed this estimate." : "");
    }
  }

  function materialLines(result) {
    if (!result) return ["No material estimate yet. " + (Logic ? Logic.estimateNote() : "")];
    return [
      "Sq ft with rivet, recess, and waste (" + result.waste + "%): " + result.adjusted.toFixed(2),
      "Linear feet on a " + result.roll + " inch roll: " + result.linearFt.toFixed(1),
      Logic.estimateNote()
    ];
  }

  function paintMaterial() {
    var box = $("job-calc-results");
    if (!box || !current) return;
    var lines = materialLines(current.material);
    box.className = "calc-results";
    box.innerHTML = "<ul class=\"checklist\">" + lines.map(function (line) {
      return "<li>" + esc(line) + "</li>";
    }).join("") + "</ul>";
  }

  function fillCalcInputs() {
    var saved = current && current.material && current.material.inputs;
    var input = saved || { w: 96, h: 48, n: 1, roll: 54, rivet: 1.15, recess: 1.1, waste: 15 };
    setVal("job-calc-w", input.w);
    setVal("job-calc-h", input.h);
    setVal("job-calc-n", input.n);
    setVal("job-calc-roll", String(input.roll) === "60" ? "60" : "54");
    setVal("job-calc-rivet", input.rivet);
    setVal("job-calc-recess", input.recess);
    setVal("job-calc-waste", input.waste);
  }

  function paintBrandNote() {
    var note = $("job-briteline-note");
    if (!note) return;
    note.hidden = val("job-brand") !== "BriteLine";
  }

  function runJobCalc() {
    if (!current || !Logic) return;
    var input = {
      w: val("job-calc-w"),
      h: val("job-calc-h"),
      n: val("job-calc-n"),
      roll: val("job-calc-roll"),
      rivet: val("job-calc-rivet"),
      recess: val("job-calc-recess"),
      waste: val("job-calc-waste")
    };
    var result = Logic.calcMaterial(input);
    result.inputs = {
      w: input.w, h: input.h, n: input.n, roll: result.roll,
      rivet: input.rivet, recess: input.recess, waste: result.waste
    };
    current.material = result;
    paintMaterial();
    paintHours(false);
    setFb("job-fb", "ok", "Material estimate is ready. Tap Save job to keep it on this phone. " + Logic.estimateNote());
  }

  function listSlot(slot) {
    return (current && current.photos && current.photos[slot]) || [];
  }

  function paintSlot(slot) {
    var box = $(slot === "before" ? "job-before-list" : "job-after-list");
    if (!box || !current) return;
    var items = listSlot(slot);
    if (!items.length) {
      box.innerHTML = '<p class="muted">No ' + slot + " photos yet.</p>";
      return;
    }
    var id = jobId();
    box.innerHTML = items.map(function (photo) {
      var key = photoKey(id, slot, photo.id);
      var src = memoryPhotos[key] || "";
      return '<figure data-photo="' + esc(photo.id) + '" data-slot="' + slot + '">' +
        (src ? '<img src="' + src + '" alt="' + slot + ' photo">' : '<span class="muted">Photo</span>') +
        '<button type="button" class="secondary" data-remove-photo="' + esc(photo.id) + '" data-slot="' + slot + '">Remove</button></figure>';
    }).join("");
    items.forEach(function (photo) {
      var key = photoKey(id, slot, photo.id);
      if (memoryPhotos[key]) return;
      idbGet(key).then(function () { paintSlot(slot); paintPicker(); });
    });
  }

  function paintPhotos() {
    paintSlot("before");
    paintSlot("after");
    paintPicker();
  }

  function resizeFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("read")); };
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var maxEdge = 1280;
          var scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.onerror = function () { reject(new Error("image")); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function addPhoto(slot, file) {
    if (!current || !file) return;
    if (!/^image\//.test(file.type || "") && !/\.(jpe?g|png|heic|webp)$/i.test(file.name || "")) {
      setFb("job-fb", "bad", "Choose a photo.");
      return;
    }
    if (listSlot(slot).length >= MAX_PHOTOS) {
      setFb("job-fb", "bad", "This job already has " + MAX_PHOTOS + " " + slot + " photos. Remove one to add another.");
      return;
    }
    resizeFile(file).then(function (dataUrl) {
      var photo = { id: "p" + Date.now() + "-" + Math.floor(Math.random() * 1000), at: Date.now() };
      current.photos[slot].push(photo);
      return idbPut(photoKey(jobId(), slot, photo.id), dataUrl).then(function () {
        paintPhotos();
        setFb("job-fb", "ok", "Photo saved on this phone. Tap Save job so the job keeps it.");
      });
    }).catch(function () {
      setFb("job-fb", "bad", "That photo could not be saved on this phone.");
    });
  }

  function removePhoto(slot, photoId) {
    if (!current) return;
    current.photos[slot] = listSlot(slot).filter(function (photo) { return photo.id !== photoId; });
    idbDel(photoKey(jobId(), slot, photoId));
    paintPhotos();
  }

  function timesFor(stepId) {
    if (!current || !current.stepTimes || !current.stepTimes[stepId]) return [];
    return current.stepTimes[stepId];
  }

  function stopTick() {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
  }

  function paintRunning() {
    var buttons = document.querySelectorAll("#job-workflow [data-timer]");
    for (var i = 0; i < buttons.length; i++) {
      var id = buttons[i].getAttribute("data-timer");
      var live = running && running.stepId === id;
      buttons[i].textContent = live ? "Stop timer" : "Start timer";
      var readout = document.querySelector('[data-timer-readout="' + id + '"]');
      if (readout) readout.textContent = live ? Logic.formatClock(Date.now() - running.started) : "";
    }
  }

  function refreshPast(stepId) {
    var el = document.querySelector('[data-timer-past="' + stepId + '"]');
    if (!el || !Logic) return;
    var past = timesFor(stepId);
    el.textContent = past.length ? "Past times: " + past.slice(-5).map(Logic.formatClock).join(", ") : "";
  }

  function stopRunning() {
    if (!running || !current) { running = null; stopTick(); return; }
    var ms = Date.now() - running.started;
    var stepId = running.stepId;
    if (ms >= 1000) {
      if (!current.stepTimes[stepId]) current.stepTimes[stepId] = [];
      current.stepTimes[stepId].push(ms);
      refreshPast(stepId);
    }
    running = null;
    stopTick();
    paintRunning();
  }

  function startTimer(stepId) {
    if (running && running.stepId === stepId) {
      stopRunning();
      return;
    }
    stopRunning();
    running = { stepId: stepId, started: Date.now() };
    paintRunning();
    tickTimer = setInterval(paintRunning, 250);
  }

  function rerenderSteps(doneMap) {
    if (APP.renderJobWorkflowChecks) APP.renderJobWorkflowChecks(val("job-type"), doneMap || {});
    paintRunning();
  }

  function checkedMap() {
    var map = {};
    var boxes = document.querySelectorAll("#job-workflow input[data-jwf]");
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) map[boxes[i].getAttribute("data-jwf")] = true;
    }
    return map;
  }

  function endpoint() {
    var cfg = window.WRAP911_CONFIG || {};
    if (cfg.jobPhotoEndpoint) return String(cfg.jobPhotoEndpoint);
    var base = String(cfg.aiEndpoint || "").trim();
    return base ? base.replace(/\/$/, "") + "/job/photo-check" : "";
  }

  function sampleMode() {
    try { return new URLSearchParams(window.location.search).get("jobcheck") === "sample"; } catch (e) { return false; }
  }

  function allPhotos() {
    var out = [];
    ["before", "after"].forEach(function (slot) {
      listSlot(slot).forEach(function (photo) {
        out.push({ slot: slot, id: photo.id, key: photoKey(jobId(), slot, photo.id) });
      });
    });
    return out;
  }

  function paintPicker() {
    var box = $("job-check-picker");
    if (!box) return;
    var photos = allPhotos();
    if (!photos.length) {
      box.innerHTML = '<p class="muted">Add a before or after photo, then pick it here.</p>';
      return;
    }
    var currentPick = "";
    var picked = box.querySelector("input[name='job-check-photo']:checked");
    if (picked) currentPick = picked.value;
    box.innerHTML = photos.map(function (photo, index) {
      var key = photo.key;
      var src = memoryPhotos[key] || "";
      var id = "job-check-photo-" + index;
      var checked = currentPick ? currentPick === photo.id : index === 0;
      return '<label class="job-check-choice"><input type="radio" name="job-check-photo" id="' + id + '" value="' + esc(photo.id) + '"' + (checked ? " checked" : "") + "> " +
        esc(photo.slot === "before" ? "Before" : "After") +
        (src ? '<img src="' + src + '" alt="">' : "") + "</label>";
    }).join("");
  }

  function paintGate() {
    var gate = $("job-check-gate");
    var go = $("job-check-go");
    var paid = seatOrPack();
    if (gate) {
      gate.hidden = paid;
      gate.textContent = paid ? "" : "Photo check is included with a Seat or a Shop Pack.";
    }
    if (go) go.hidden = !paid;
    var pricing = $("job-check-pricing");
    if (!paid && gate && !pricing) {
      pricing = document.createElement("button");
      pricing.type = "button";
      pricing.className = "secondary";
      pricing.id = "job-check-pricing";
      pricing.textContent = "Open Pricing";
      gate.insertAdjacentElement("afterend", pricing);
      pricing.addEventListener("click", function () {
        var c = core();
        if (c && c.showScreen) c.showScreen("pricing");
      });
    }
    if (pricing) pricing.hidden = paid;
  }

  function sampleResult() {
    return {
      ok: true,
      likely_cause: "Likely cause: the edge was stretched, so it is lifting.",
      likely_causes: ["Likely cause: the edge was stretched, so it is lifting."],
      fix_steps: ["Lift the loose edge back to sound adhesive.", "Lay it down with slack. Do not pull it to make it reach.", "Follow the film TDS."],
      lesson_keywords: ["edge", "lift", "seam"],
      disclaimer: "This is a likely cause, not a guaranteed diagnosis. Follow the film TDS."
    };
  }

  function paintCheckResult(result) {
    var box = $("job-check-result");
    if (!box || !result) return;
    var causes = result.likely_causes || [];
    var steps = result.fix_steps || [];
    var html = '<div class="card"><p><strong>' + esc(result.likely_cause || causes[0] || "Likely cause: the photo needs a closer shot.") + "</strong></p>";
    html += "<p>" + esc(result.disclaimer || "This is a likely cause, not a guaranteed diagnosis. Follow the film TDS.") + "</p>";
    if (steps.length) {
      html += "<h3>Fix</h3><ol class=\"steps-list\">" + steps.map(function (step) {
        return "<li>" + esc(Logic.scrubPhotoText(step)) + "</li>";
      }).join("") + "</ol>";
    }
    var query = causes.concat(result.lesson_keywords || []).join(" ");
    var card = window.WRAP911_QUICK_FIX_LOGIC && window.WRAP911_QUICK_FIX_LOGIC.lookup(query).top;
    if (card) {
      html += '<button type="button" class="secondary" data-job-qf="' + esc(card.phrases[0]) + '">Open the matching Fix a Problem lesson</button>';
    }
    var match = window.WRAP911_DOCTOR_MATCH && window.WRAP911_DOCTOR_MATCH.matchCatalog;
    if (match) {
      var found = match(result.lesson_keywords || [], window.WRAP911_DATA || {}, 1);
      var lesson = found && found.lessons && found.lessons[0];
      if (lesson) html += '<button type="button" class="secondary" data-job-lesson="' + esc(lesson.id) + '">Open lesson: ' + esc(lesson.title) + "</button>";
    }
    html += "</div>";
    box.innerHTML = html;
    current.lastCheck = {
      at: Date.now(),
      likely_cause: result.likely_cause || "",
      fix_steps: steps.slice(),
      lesson_keywords: (result.lesson_keywords || []).slice()
    };
  }

  function selectedPhoto() {
    var picked = document.querySelector("input[name='job-check-photo']:checked");
    if (!picked) return null;
    var photos = allPhotos();
    for (var i = 0; i < photos.length; i++) if (photos[i].id === picked.value) return photos[i];
    return null;
  }

  function checkPhoto() {
    if (!seatOrPack()) {
      paintGate();
      setFb("job-check-fb", "bad", "Photo check is included with a Seat or a Shop Pack.");
      return;
    }
    var photo = selectedPhoto();
    if (!photo) { setFb("job-check-fb", "bad", "Pick a job photo first."); return; }
    var consent = $("job-check-consent");
    if (!consent || !consent.checked) {
      setFb("job-check-fb", "bad", "Confirm the photo can be sent. It is not stored.");
      return;
    }
    var dataUrl = memoryPhotos[photo.key] || "";
    if (!dataUrl) { setFb("job-check-fb", "bad", "That photo is still loading on this phone."); return; }
    if (sampleMode()) {
      paintCheckResult(sampleResult());
      setFb("job-check-fb", "ok", "Sample check. Nothing was sent. This is a likely cause, not a guaranteed diagnosis.");
      return;
    }
    var url = endpoint();
    if (!url) {
      setFb("job-check-fb", "bad", "Photo check is not available right now. Nothing was stored. You can still use Fix a Problem.");
      return;
    }
    var btn = $("job-check-go");
    if (btn) btn.disabled = true;
    setFb("job-check-fb", "", "Checking the photo. Keep this screen open.");
    var credPromise = window.WRAP911_APPLE_RECEIPT ? window.WRAP911_APPLE_RECEIPT() : Promise.resolve(null);
    credPromise.then(function (cred) {
      var lic = license();
      var body = { consent: true, image: dataUrl, device: (cred && cred.device) || deviceId() };
      if (cred && cred.jws) body.jws = cred.jws;
      else if (lic && (lic.sku === "seat" || lic.sku === "pack") && lic.code) body.code = lic.code;
      var note = ["Film: " + val("job-brand"), current.filmLine ? "Product line: " + current.filmLine : ""].filter(Boolean).join(". ");
      if (note) body.note = note;
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { status: res.status, data: data || {} };
        });
      });
    }).then(function (res) {
      if (btn) btn.disabled = false;
      var data = res.data || {};
      if (res.status === 503) {
        setFb("job-check-fb", "bad", "Photo check is not available right now. Nothing was stored. You can still use Fix a Problem.");
        return;
      }
      if (res.status === 403) {
        setFb("job-check-fb", "bad", "Photo check is included with a Seat or a Shop Pack.");
        return;
      }
      if (res.status === 429) {
        setFb("job-check-fb", "bad", data.error || "You have used today's photo checks. Try again tomorrow.");
        return;
      }
      if (!data.ok) {
        setFb("job-check-fb", "bad", data.error || "Photo check could not read that photo. Try a closer shot, or open Fix a Problem.");
        return;
      }
      if (Logic && data.likely_cause) data.likely_cause = Logic.asLikelyCause(data.likely_cause);
      paintCheckResult(data);
      setFb("job-check-fb", "ok", "Likely cause ready. The photo was not stored.");
    }).catch(function () {
      if (btn) btn.disabled = false;
      setFb("job-check-fb", "bad", "The phone lost the connection. The photo was not stored. Try again.");
    });
  }

  function dataUrlBytes(url) {
    var comma = String(url || "").indexOf(",");
    var b64 = comma >= 0 ? String(url).slice(comma + 1) : "";
    if (!b64) return new Uint8Array();
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function exportPdf() {
    if (!current || !Pdf) return;
    readInputs();
    var done = $("job-completed");
    if (!done || !done.checked) {
      setFb("job-fb", "bad", "Mark the job finished, then share the checklist, notes, and photos.");
      return;
    }
    var type = val("job-type");
    var doneMap = checkedMap();
    var steps = stepsFor(type).map(function (step) {
      return {
        title: step.title,
        done: !!doneMap[step.id],
        times: (timesFor(step.id) || []).map(function (ms) { return Logic.formatClock(ms); })
      };
    });
    var hours = current.timeEstimate ? current.timeEstimate.hours : "";
    var photos = allPhotos();
    Promise.all(photos.map(function (photo) {
      var src = memoryPhotos[photo.key];
      if (src) return Promise.resolve(src);
      return idbGet(photo.key);
    })).then(function (urls) {
      var images = [];
      for (var i = 0; i < photos.length; i++) {
        if (!urls[i]) continue;
        images.push({ slot: photos[i].slot === "before" ? "Before" : "After", bytes: dataUrlBytes(urls[i]) });
      }
      var bytes = Pdf.buildJobPdf({
        finished: true,
        jobType: vehicleTitle(type),
        coverage: val("job-coverage"),
        brand: val("job-brand"),
        filmLine: current.filmLine,
        filmLot: current.filmLot,
        hoursLabel: "Time estimate: " + hours + " hours. " + Logic.estimateNote(),
        materialLines: materialLines(current.material),
        steps: steps,
        notes: val("job-notes"),
        photos: images
      });
      var blob = new Blob([bytes], { type: "application/pdf" });
      var name = "wrap911-job.pdf";
      var file = null;
      try { file = new File([blob], name, { type: "application/pdf" }); } catch (eFile) { file = null; }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: "WRAP 911 job" }).then(function () {
          setFb("job-fb", "ok", "Share sheet opened.");
        });
      }
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setFb("job-fb", "ok", "PDF saved. This is an estimate, not a quote.");
    }).catch(function () {
      setFb("job-fb", "bad", "The PDF could not be shared. Tap Save job and try again.");
    });
  }

  function goFix() {
    readInputs();
    var save = $("btn-save-job");
    if (save) save.click();
    var note = ["Job: " + vehicleTitle(val("job-type")), val("job-coverage"), "Film: " + val("job-brand"), current && current.filmLine ? current.filmLine : ""].filter(Boolean).join(". ");
    if (APP.openProblemDoctor) APP.openProblemDoctor("job", note);
  }

  function onOpen(job) {
    stopRunning();
    current = blankFrom(job);
    current.id = job.id;
    setVal("job-film-line", current.filmLine);
    setVal("job-film-lot", current.filmLot);
    fillCalcInputs();
    paintMaterial();
    paintHours(false);
    paintBrandNote();
    paintPhotos();
    paintGate();
    if (current.lastCheck) paintCheckResult(current.lastCheck);
    else {
      var box = $("job-check-result");
      if (box) box.innerHTML = "";
      setFb("job-check-fb", "", "");
    }
    rerenderSteps(job.workflowDone || {});
  }

  function collectExtras() {
    if (!current) return null;
    readInputs();
    return {
      material: current.material,
      timeEstimate: current.timeEstimate,
      photos: current.photos,
      filmLine: current.filmLine,
      filmLot: current.filmLot,
      stepTimes: current.stepTimes,
      lastCheck: current.lastCheck
    };
  }

  function onDelete(id) {
    var jobs = [];
    try { jobs = JSON.parse(localStorage.getItem("wrap911_jobs") || "[]"); } catch (e) {}
    var job = null;
    for (var i = 0; i < jobs.length; i++) if (jobs[i].id === id) job = jobs[i];
    var photos = (job && job.photos) || {};
    ["before", "after"].forEach(function (slot) {
      (photos[slot] || []).forEach(function (photo) { idbDel(photoKey(id, slot, photo.id)); });
    });
    if (current && current.id === id) current = null;
  }

  function onTypeChange() {
    paintHours(false);
    paintBrandNote();
  }

  function bindFiles(buttonId, inputId, slot) {
    var button = $(buttonId);
    var input = $(inputId);
    if (button && input) button.addEventListener("click", function () { input.click(); });
    if (input) input.addEventListener("change", function () {
      if (input.files && input.files[0]) addPhoto(slot, input.files[0]);
      input.value = "";
    });
  }

  function init() {
    if (!Logic) return;
    var hours = $("job-hours");
    if (hours) hours.addEventListener("input", function () { readHours(); paintHours(false); });
    var calc = $("job-calc-go");
    if (calc) calc.addEventListener("click", runJobCalc);
    var brand = $("job-brand");
    if (brand) brand.addEventListener("change", paintBrandNote);
    var coverage = $("job-coverage");
    if (coverage) coverage.addEventListener("change", function () { paintHours(false); });
    bindFiles("job-before-cam", "job-before-cam-file", "before");
    bindFiles("job-before-lib", "job-before-lib-file", "before");
    bindFiles("job-after-cam", "job-after-cam-file", "after");
    bindFiles("job-after-lib", "job-after-lib-file", "after");
    var photos = $("job-photos");
    if (photos) photos.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest("[data-remove-photo]");
      if (!btn) return;
      removePhoto(btn.getAttribute("data-slot"), btn.getAttribute("data-remove-photo"));
    });
    var workflow = $("job-workflow");
    if (workflow) workflow.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest("[data-timer]");
      if (!btn) return;
      ev.preventDefault();
      startTimer(btn.getAttribute("data-timer"));
    });
    var fix = $("job-fix");
    if (fix) fix.addEventListener("click", goFix);
    var exp = $("job-export");
    if (exp) exp.addEventListener("click", exportPdf);
    var check = $("job-check-go");
    if (check) check.addEventListener("click", checkPhoto);
    var result = $("job-check-result");
    if (result) result.addEventListener("click", function (ev) {
      var lesson = ev.target.closest && ev.target.closest("[data-job-lesson]");
      var card = ev.target.closest && ev.target.closest("[data-job-qf]");
      if (lesson && APP.openLesson) APP.openLesson(lesson.getAttribute("data-job-lesson"));
      else if (card && window.WRAP911_QUICK_FIX && window.WRAP911_QUICK_FIX.open) {
        window.WRAP911_QUICK_FIX.open(card.getAttribute("data-job-qf"), "job");
      }
    });
    paintGate();
  }

  window.WRAP911_JOBS = {
    onOpen: onOpen,
    collectExtras: collectExtras,
    onDelete: onDelete,
    onTypeChange: onTypeChange,
    timesFor: timesFor
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
