/* Build 39: new stills, plain captions, one poster per clip, grouped Photos. */
(function () {
  var FREE = {
    "pl01": 1, "pl07": 1, "prob-airstream-nose": 1,
    "img-7290": 1, "img-7781": 1, "img-7795": 1, "img-7901": 1,
    "pl05": 1, "bay-trailer-door": 1, "prob-airstream-light": 1,
    "bay-mustang-hood-tac": 1, "int-panel-corner": 1, "pl02": 1, "pb-271-brick-corner": 1
  };
  var JOB_ORDER = ["Problems", "Vehicles", "Interior"];
  var SUB_ORDER = {
    Problems: ["Cuts and openings", "Seams and seating", "Fingers and heat", "Channels and recesses", "Emblems", "QC", "Interior"],
    Vehicles: ["Box trucks and vans", "Trailers", "RV and bus", "Passenger and fleet", "Graphics", "Vans and SUVs"],
    Interior: ["Walls", "Cabinets and kiosks", "Prep and cuts"]
  };
  var NEW_PHOTOS = [
    { id: "img-7290", title: "Walnut slat desk, finished outside corner", image: "media/photos/gallery/img-7290-walnut-desk.jpg", module: "architectural", jobType: "Interior", subgroup: "Walls", freeSample: true,
      visual: "A finished reception desk wrapped in walnut slat film. The outside corner is closed and the slat lines stay straight.",
      narration: "Keep the slat lines straight around the outside corner. Do not stretch the pattern out of square.",
      checklist: ["Sight the slat lines before you trim", "Wrap the outside corner without pulling the pattern", "Check the corner in raking light"],
      quiz: { q: "What has to stay straight on this desk?", correct: "The walnut slat lines, including around the outside corner.", wrong: "A rivet row on a trailer." } },
    { id: "img-7771", title: "Taupe cabinet, gap at the inside corner", image: "media/photos/gallery/img-7771-taupe-corner-gap.jpg", module: "seams-rivets", jobType: "Problems", subgroup: "Seams and seating", freeSample: false,
      visual: "Taupe gloss film on a cabinet corner with an open split where the film is not seated.",
      narration: "This split is an unseated inside corner. Lift it, feed the corner, and glass both faces. Do not heat the gap shut.",
      checklist: ["Name the open split", "Lift the loose film", "Feed the inside corner", "Glass both faces"],
      quiz: { q: "What is wrong at this taupe corner?", correct: "The film is not seated. The corner is split open.", wrong: "The corner is finished and only needs a wipe." } },
    { id: "img-7772", title: "Taupe gloss panel with a recessed rectangle", image: "media/photos/gallery/img-7772-taupe-recess.jpg", module: "architectural", jobType: "Interior", subgroup: "Cabinets and kiosks", freeSample: false,
      visual: "Taupe gloss film on a panel that has a recessed rectangle.",
      narration: "Seat the field first, then feed the recess. Do not bridge the opening.",
      checklist: ["Glass the field", "Stop at the recess lip", "Feed film into the recess", "Do not bridge it"],
      quiz: { q: "What is the first move on this recessed panel?", correct: "Seat the field, then feed the recess.", wrong: "Stretch one sheet across the recess." } },
    { id: "img-7781", title: "Finished taupe kiosk with a white top", image: "media/photos/gallery/img-7781-taupe-kiosk.jpg", module: "architectural", jobType: "Interior", subgroup: "Cabinets and kiosks", freeSample: true,
      visual: "A finished taupe kiosk with a white top and three cubbies.",
      narration: "Walk every cubby and the top edge in raking light before you call the kiosk done.",
      checklist: ["Check the white top edge", "Look into each cubby", "Confirm the corners are seated"],
      quiz: { q: "What should you check on this finished kiosk?", correct: "The top edge and each cubby, in raking light.", wrong: "Only the front face." } },
    { id: "img-7795", title: "Half-moon relief cut on barn-wood film", image: "media/photos/gallery/img-7795-barnwood-half-moon.jpg", module: "cutting", jobType: "Interior", subgroup: "Prep and cuts", freeSample: true,
      visual: "A half-moon relief cut in barn-wood film. A hand is in the frame.",
      narration: "Relief the corner before you try to lay the film around it. A half-moon lets the sheet sit without a bridge.",
      checklist: ["Mark the corner", "Cut the half-moon off the show face", "Seat one side, then the other"],
      quiz: { q: "Why is the half-moon there?", correct: "So the film can sit into the corner instead of bridging it.", wrong: "To decorate the wood grain." } },
    { id: "img-7796", title: "Measure and mark bleed on barn-wood film", image: "media/photos/gallery/img-7796-barnwood-bleed.jpg", module: "cutting", jobType: "Interior", subgroup: "Prep and cuts", freeSample: false,
      visual: "Barn-wood film with a measure and a mark for the bleed.",
      narration: "Mark the bleed before you cut. Do not guess the margin at the edge.",
      checklist: ["Measure the bleed", "Mark it on the film", "Cut to the mark"],
      quiz: { q: "When do you mark the bleed?", correct: "Before the cut.", wrong: "After the film is already trimmed short." } },
    { id: "img-7803", title: "Barn-wood corner, leftover lip", image: "media/photos/gallery/img-7803-barnwood-lip.jpg", module: "architectural", jobType: "Interior", subgroup: "Walls", freeSample: false,
      visual: "Barn-wood film at a corner, with the leftover lip still to be measured.",
      narration: "Measure the leftover lip before you trim it. Leave enough to tuck, not a flap on the face.",
      checklist: ["Measure the lip", "Trim off the show face", "Tuck what you leave"],
      quiz: { q: "What is left at this barn-wood corner?", correct: "A lip that still needs to be measured and trimmed.", wrong: "A finished edge with nothing left to cut." } },
    { id: "img-7804", title: "Barn-wood film, liner edge and measure", image: "media/photos/gallery/img-7804-barnwood-measure.jpg", module: "cutting", jobType: "Interior", subgroup: "Prep and cuts", freeSample: false,
      visual: "Barn-wood film with the liner edge and a measure in frame.",
      narration: "Measure from the liner edge you plan to keep. Do not start the hang on a guess.",
      checklist: ["Find the liner edge", "Measure before you peel", "Keep the sheet square"],
      quiz: { q: "What are you measuring here?", correct: "The barn-wood film from the liner edge.", wrong: "A vehicle door gap." } },
    { id: "img-7901", title: "Finished barn-wood wall, tape at the seam", image: "media/photos/gallery/img-7901-barnwood-wall.jpg", module: "architectural", jobType: "Interior", subgroup: "Walls", freeSample: true,
      visual: "A finished barn-wood wall on a shop structure, with blue tape still at a seam.",
      narration: "Leave the positioning tape until the field is glassed, then pull it and check the seam.",
      checklist: ["Read the plank lines", "Glass the field before you pull the tape", "Check the seam"],
      quiz: { q: "Why is the blue tape still on the seam?", correct: "The seam is still being held while the field is finished.", wrong: "Tape is the final edge treatment." } },
    { id: "img-7985", title: "Taupe gloss wrap around a vertical edge", image: "media/photos/gallery/img-7985-taupe-edge.jpg", module: "architectural", jobType: "Interior", subgroup: "Cabinets and kiosks", freeSample: false,
      visual: "Taupe gloss film wrapped around a vertical edge.",
      narration: "Glass the face, then feed the edge. Do not stretch the gloss around the corner in one pull.",
      checklist: ["Glass the face first", "Feed the vertical edge", "Check the gloss for a finger"],
      quiz: { q: "How do you take taupe gloss around this edge?", correct: "Glass the face, then feed the edge.", wrong: "Pull it tight around the corner in one stretch." } },
    { id: "img-8248", title: "Purple sparkle film in a recessed box", image: "media/photos/gallery/img-8248-purple-recess.jpg", module: "architectural", jobType: "Interior", subgroup: "Cabinets and kiosks", freeSample: false,
      visual: "Purple sparkle film in a recessed box, with fluid droplets still on the face.",
      narration: "Wipe the droplets and let the face dry before you glass. Do not trap wet film in the recess.",
      checklist: ["See the droplets on the face", "Wipe and let it dry", "Then glass the recess"],
      quiz: { q: "What has to happen before this purple film is glassed?", correct: "Wipe the droplets off and let the face dry.", wrong: "Squeegee the droplets into the film." } }
  ];

  function plain(s) {
    return String(s == null ? "" : s).replace(/\s+—\s+/g, ", ").replace(/—/g, ", ").replace(/\s+–\s+/g, ", ");
  }
  function walk(obj, depth) {
    if (!obj || typeof obj !== "object" || depth > 6) return;
    if (Array.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
        if (typeof obj[i] === "string") obj[i] = plain(obj[i]);
        else walk(obj[i], depth + 1);
      }
      return;
    }
    Object.keys(obj).forEach(function (k) {
      if (typeof obj[k] === "string") obj[k] = plain(obj[k]);
      else if (obj[k] && typeof obj[k] === "object") walk(obj[k], depth + 1);
    });
  }
  function base(p) {
    return String(p || "").split("?")[0].split("/").pop().toLowerCase();
  }
  function colorOf(p) {
    var s = ((p.title || "") + " " + (p.image || "") + " " + (p.subgroup || "")).toLowerCase();
    if (/walnut|barn|wood|plank/.test(s)) return "wood";
    if (/taupe|kiosk/.test(s)) return "taupe";
    if (/purple|sparkle|magenta/.test(s)) return "magenta";
    if (/pink|escalade|dusty|caddy|rose/.test(s)) return "pink";
    if (/orange/.test(s)) return "orange";
    if (/blue|airstream|cream|jeep|satin/.test(s)) return "cool";
    if (/gold|brick|black/.test(s)) return "dark";
    return "other";
  }
  function interleave(items) {
    var buckets = {};
    var keys = [];
    items.forEach(function (it) {
      var c = colorOf(it);
      if (!buckets[c]) { buckets[c] = []; keys.push(c); }
      buckets[c].push(it);
    });
    var out = [];
    var left = items.length;
    while (left) {
      for (var i = 0; i < keys.length; i++) {
        var b = buckets[keys[i]];
        if (b.length) { out.push(b.shift()); left--; }
      }
    }
    return out;
  }
  function rank(list, name) {
    var i = list.indexOf(name);
    return i < 0 ? 50 : i;
  }

  function applyCaptions(d) {
    var pack = window.WRAP911_CAPTION_DATA || { photos: [], videos: [], wins: {} };
    var photos = {};
    var videos = {};
    pack.photos.forEach(function (row) { photos[row.id] = row; });
    pack.videos.forEach(function (row) { videos[row.id] = row; });
    (d.photoLessons || []).forEach(function (p) {
      var row = photos[p.id];
      if (row) {
        p.title = row.title;
        p.visual = row.shows;
        p.narration = row.learn;
        if (row.job) p.jobType = row.job;
        if (row.sub) p.subgroup = row.sub;
      }
      var win = pack.wins[base(p.image)];
      if (win) p.title = win;
      if (!p.subgroup) p.subgroup = guessSub(p);
      p.freeSample = !!FREE[p.id];
    });
    (d.VIDEO_CATALOG || []).forEach(function (v) {
      var row = videos[v.id];
      if (row) {
        v.title = row.title;
        v.shows = row.shows;
        v.learn = row.learn;
        v.note = row.shows + " " + row.learn;
        if (row.job) v.category = row.job;
        if (row.sub) { v.subgroup = row.sub; v.subcategory = row.sub; }
      }
    });
  }
  function guessSub(p) {
    var s = ((p.title || "") + " " + (p.jobType || "") + " " + (p.image || "")).toLowerCase();
    if (p.jobType === "Problems") {
      if (/emblem|letter|badge/.test(s)) return "Emblems";
      if (/recess|channel|pinch/.test(s)) return "Channels and recesses";
      if (/finger|heat|torch|bubble|air/.test(s)) return "Fingers and heat";
      if (/seam|nose|seat/.test(s)) return "Seams and seating";
      return "Cuts and openings";
    }
    if (p.jobType === "Interior") {
      if (/cut|knife|bleed|measure|half-moon|prep/.test(s)) return "Prep and cuts";
      if (/cabinet|kiosk|box|cubb/.test(s)) return "Cabinets and kiosks";
      return "Walls";
    }
    if (/trailer|rivet|marker|orange side/.test(s)) return "Trailers";
    if (/rv|bus|entry|inlay/.test(s)) return "RV and bus";
    if (/graphic|print|hex|circle/.test(s)) return "Graphics";
    if (/box|cab|e-450|e450/.test(s)) return "Box trucks and vans";
    return "Passenger and fleet";
  }

  function addNew(d) {
    if (!d.photoLessons) d.photoLessons = [];
    var have = {};
    d.photoLessons.forEach(function (p) { have[p.id] = 1; });
    NEW_PHOTOS.forEach(function (p) {
      if (!have[p.id]) d.photoLessons.push(JSON.parse(JSON.stringify(p)));
    });
    if (!d.VIDEO_CATALOG) d.VIDEO_CATALOG = [];
    var vid = "v-8260-purple-wall";
    var exists = false;
    for (var i = 0; i < d.VIDEO_CATALOG.length; i++) if (d.VIDEO_CATALOG[i].id === vid) exists = true;
    if (!exists) {
      d.VIDEO_CATALOG.push({
        id: vid,
        access: "paid",
        title: "Purple wall panel, liner peel and squeegee",
        category: "Interior",
        subcategory: "Cabinets and kiosks",
        subgroup: "Cabinets and kiosks",
        type: "clip",
        src: "media/videos/architectural/purple-wall-liner-peel-squeegee.mp4",
        still: "media/videos/posters/purple-wall-liner-peel-squeegee.jpg",
        shows: "A large purple panel is on the bench. The installer peels the white liner and squeegees the film flat from the top down.",
        learn: "Peel the liner as you go and glass the field before you chase the bottom edge.",
        note: "Interior clip. Peel the liner as you go. The poster shows the installer from the side."
      });
    }
  }

  function posters(d) {
    var real = window.WRAP911_VIDEO_REAL || {};
    var list = d.VIDEO_CATALOG || [];
    for (var i = 0; i < list.length; i++) {
      var src = String(list[i].src || "").replace(/^\.\//, "");
      if (!src || !real[src]) {
        list[i].still = "";
        continue;
      }
      var name = src.split("/").pop().replace(/\.mp4$/i, "");
      list[i].still = "media/videos/posters/" + name + ".jpg";
    }
  }

  function orderPhotos(d) {
    var groups = {};
    (d.photoLessons || []).forEach(function (p) {
      var job = JOB_ORDER.indexOf(p.jobType) >= 0 ? p.jobType : "Vehicles";
      p.jobType = job;
      var key = job + "|" + (p.subgroup || "");
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    var out = [];
    JOB_ORDER.forEach(function (job) {
      var subs = (SUB_ORDER[job] || []).slice();
      Object.keys(groups).forEach(function (key) {
        if (key.indexOf(job + "|") === 0) {
          var sub = key.split("|")[1];
          if (subs.indexOf(sub) < 0) subs.push(sub);
        }
      });
      subs.sort(function (a, b) { return rank(SUB_ORDER[job] || [], a) - rank(SUB_ORDER[job] || [], b); });
      subs.forEach(function (sub) {
        var items = groups[job + "|" + sub];
        if (items) out = out.concat(interleave(items));
      });
    });
    d.photoLessons = out;
  }

  function bindVideoChips() {
    var wrap = document.getElementById("video-filter-chips");
    if (!wrap || wrap.getAttribute("data-bound-39")) return;
    wrap.setAttribute("data-bound-39", "1");
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-video-cat]");
      if (!btn) return;
      var sel = document.getElementById("video-filter-cat");
      if (sel) sel.value = btn.getAttribute("data-video-cat") || "";
      var chips = wrap.querySelectorAll("[data-video-cat]");
      for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("active", chips[i] === btn);
      if (window.WRAP911_APP && window.WRAP911_APP.renderVideos) window.WRAP911_APP.renderVideos();
    });
  }

  function pass() {
    var d = window.WRAP911_DATA;
    if (!d) return;
    addNew(d);
    applyCaptions(d);
    posters(d);
    walk(d.photoLessons, 0);
    walk(d.VIDEO_CATALOG, 0);
    orderPhotos(d);
    bindVideoChips();
    try {
      if (window.WRAP911_APP && window.WRAP911_APP.core && window.WRAP911_APP.core.renderPhotosList && window.WRAP911_PHOTOS_READY) {
        window.WRAP911_APP.core.renderPhotosList();
      }
    } catch (e) {}
    try { if (window.WRAP911_APP && window.WRAP911_APP.renderVideos) window.WRAP911_APP.renderVideos(); } catch (e2) {}
  }

  window.WRAP911_MEDIA_PASS = pass;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pass);
  else pass();
  setTimeout(pass, 400);
  setTimeout(pass, 1400);
  setTimeout(pass, 2200);
  setTimeout(pass, 3800);
  document.addEventListener("wrap911:photos-ready", pass);
})();
