/* WRAP 911 — labels + unique stills. */
(function () {
  var COVER = "../assets/sales/trailer-rivets.jpg";
  var REAL = {
    "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-1.mp4": 1,
    "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-2.mp4": 1,
    "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.mp4": 1,
    "media/videos/architectural/architectural-wall-wrap-squeegee-sequence.mp4": 1,
    "media/videos/architectural/architectural-wall-wrap.mp4": 1,
    "media/videos/architectural/cabinet-done.mp4": 1,
    "media/videos/architectural/vinyl-cabinet-installed.mp4": 1,
    "media/videos/architectural/vinyl-oncabinet8.mp4": 1,
    "media/videos/fleet/graphic-installation-1.mp4": 1,
    "media/videos/fleet/pink-caddy-wrap3.mp4": 1,
    "media/videos/fleet/pink-caddy-wrap4.mp4": 1,
    "media/videos/fleet/pink-caddy-wrap5.mp4": 1,
    "media/videos/fleet/pink-wrap-caddy-1.mp4": 1,
    "media/videos/fleet/satin-wrap-cherokee.mp4": 1,
    "media/videos/prep/cutting-vinyl-4.mp4": 1,
    "media/videos/prep/cutting-vinyl-5.mp4": 1,
    "media/videos/prep/cutting-vinyl-6.mp4": 1,
    "media/videos/prep/cutting-vinyl3.mp4": 1,
    "media/videos/prep/dull-blade-cut.mp4": 1,
    "media/videos/prep/grey-overlay-peel-magenta-base-stack.mp4": 1,
    "media/videos/prep/squeegee-strokes.mp4": 1,
    "media/videos/prep/stroke-of-the-squeegee.mp4": 1,
    "media/videos/prep/torch-in-vinyl-3.mp4": 1,
    "media/videos/prep/torch-on-vinyl1.mp4": 1,
    "media/videos/prep/torch-on-vinyl2.mp4": 1,
    "media/videos/prep/translucent-vinyl.mp4": 1,
    "media/videos/prep/vinyl-cutting1.mp4": 1,
    "media/videos/prep/vinyl-removal.mp4": 1,
    "media/videos/prep/vinyl-squeegee-sequence.mp4": 1,
    "media/videos/qc/corngraphic.mp4": 1,
    "media/videos/trailer/trailer-rivets-and-marker-lights.mp4": 1,
    "media/videos/trailer/wrapping-around-trailer-marking-light.mp4": 1,
    "media/videos/van/rear-vehicle-gate-wrap.mp4": 1
  };

  var POOL = {
    Vehicles: [
      "media/videos/fleet/pink-wrap-caddy-1.jpg",
      "media/videos/fleet/pink-caddy-wrap3.jpg",
      "media/videos/fleet/pink-caddy-wrap4.jpg",
      "media/videos/fleet/pink-caddy-wrap5.jpg",
      "media/videos/fleet/satin-wrap-cherokee.jpg",
      "media/videos/fleet/graphic-installation-1.jpg",
      "../assets/sales/pickup-panels.jpg",
      "media/photos/gallery/front-bumper-wrap.jpg",
      "media/photos/gallery/front-bumper-wrap-caddy.jpg",
      "media/photos/gallery/pink-caddy-bumper-close-up.jpg",
      "media/videos/trailer/trailer-rivets-and-marker-lights.jpg",
      "media/videos/trailer/wrapping-around-trailer-marking-light.jpg",
      "media/photos/gallery/trailer-spot-graphics.jpg",
      "../assets/sales/trailer-rivets.jpg",
      "../assets/sales/edge-detail.jpg",
      "../assets/sales/fleet-rv.jpg",
      "media/videos/van/rear-vehicle-gate-wrap.jpg"
    ],
    Interior: [
      "media/videos/architectural/architectural-wall-wrap.jpg",
      "media/videos/architectural/architectural-wall-wrap-squeegee-sequence.jpg",
      "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.jpg",
      "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-1.jpg",
      "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-2.jpg",
      "media/videos/architectural/cabinet-done.jpg",
      "media/videos/architectural/vinyl-cabinet-installed.jpg",
      "media/videos/architectural/vinyl-oncabinet8.jpg",
      "media/photos/gallery/office-wallpaper-wrap.jpg",
      "media/photos/gallery/cabinet-measure.jpg",
      "media/photos/gallery/cabinet-pic-sides.jpg",
      "media/photos/gallery/kiosk-box.jpg",
      "media/photos/gallery/measuring-bleed2.jpg",
      "media/photos/gallery/demonstration-of-a-half-moon.jpg",
      "../assets/sales/architectural.jpg"
    ],
    Problems: [
      "../assets/sales/edge-detail.jpg",
      "../assets/sales/trailer-rivets.jpg",
      "media/photos/gallery/pink-caddy-bumper-close-up.jpg",
      "media/photos/gallery/front-bumper-wrap.jpg",
      "media/videos/prep/dull-blade-cut.jpg",
      "media/videos/prep/vinyl-removal.jpg"
    ],
    Prep: [
      "media/videos/prep/cutting-vinyl-4.jpg",
      "media/videos/prep/cutting-vinyl-5.jpg",
      "media/videos/prep/cutting-vinyl-6.jpg",
      "media/videos/prep/cutting-vinyl3.jpg",
      "media/videos/prep/vinyl-cutting1.jpg",
      "media/videos/prep/squeegee-strokes.jpg",
      "media/videos/prep/stroke-of-the-squeegee.jpg",
      "media/videos/prep/torch-on-vinyl1.jpg",
      "media/videos/prep/torch-on-vinyl2.jpg",
      "media/videos/prep/torch-in-vinyl-3.jpg",
      "media/videos/prep/translucent-vinyl.jpg",
      "media/videos/prep/grey-overlay-peel-magenta-base-stack.jpg",
      "media/videos/prep/vinyl-removal.jpg",
      "media/videos/prep/dull-blade-cut.jpg",
      "media/videos/prep/vinyl-squeegee-sequence.jpg"
    ]
  };
  POOL.Fleet = POOL.Vehicles;
  POOL.Trailer = POOL.Vehicles;
  POOL["Box truck"] = POOL.Vehicles;
  POOL["Work van"] = POOL.Vehicles;
  POOL["Tall side"] = POOL.Vehicles;

  var ALL = [];
  Object.keys(POOL).forEach(function (k) {
    POOL[k].forEach(function (p) {
      if (ALL.indexOf(p) === -1) ALL.push(p);
    });
  });

  var VEH = {
    van: { title: "Vehicles", summary: "Cars, pickups, trailers, and fleet work from the bay." },
    storefront: { title: "Interior", summary: "Walls, cabinets, glass, fixtures." },
    "rv-bus": { title: "Vehicles", summary: "Cars, pickups, trailers, and fleet work from the bay." }
  };

  var CAT = {
    "Storefront/Architectural": "Interior",
    "Architectural": "Interior",
    "RV/Bus": "Vehicles",
    "Van": "Vehicles",
    "Box Truck": "Vehicles",
    "Box truck": "Vehicles",
    "Work van": "Vehicles",
    "Tall side": "Vehicles",
    "Fleet": "Vehicles",
    "Trailer": "Vehicles"
  };

  var KEYS = ["still", "image", "poster", "thumb", "thumbnail", "photo", "hero", "media", "posterUrl", "imageUrl"];

  function basename(path) {
    return String(path || "").split("?")[0].split("#")[0].replace(/^.*\//, "").toLowerCase();
  }

  function isCover(path) {
    return !path;
  }

  function missingStill(path) {
    if (!path) return true;
    path = String(path);
    if (path.indexOf("data:") === 0) return false;
    if (/^https?:/i.test(path)) return false;
    if (/media\/photos\//.test(path)) return false;
    if (/media\/stock\//.test(path)) return false;
    if (/assets\//.test(path)) return false;
    if (/media\/videos\//.test(path) && /\.(jpg|jpeg|png|webp)$/i.test(path)) {
      var stem = path.replace(/\.(jpg|jpeg|png|webp)$/i, ".mp4");
      return !REAL[stem];
    }
    if (/media\/videos\//.test(path) && /\.mp4$/i.test(path)) return !REAL[path];
    return false;
  }

  function pickByTitle(item, used) {
    var title = String((item && (item.title || item.name)) || "").toLowerCase();
    var job = String((item && item.jobType) || "").toLowerCase();
    var want = [];
    function add(list) {
      if (!list) return;
      for (var i = 0; i < list.length; i++) {
        if (want.indexOf(list[i]) === -1) want.push(list[i]);
      }
    }
    if (/cabinet|kiosk|wall|interior|bleed|half-moon/.test(title) || job === "interior") add(POOL.Interior);
    else add(POOL.Vehicles);
    if (/cut|torch|squeegee|prep|removal|blade/.test(title)) add(POOL.Prep);
    add(ALL);
    for (var j = 0; j < want.length; j++) {
      if (!used[basename(want[j])]) return want[j];
    }
    return want[0] || COVER;
  }

  function uniquePhotos() {
    var d = window.WRAP911_DATA;
    if (!d || !d.photoLessons) return;
    var used = {};
    var list = d.photoLessons;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var img = item.image || item.still || "";
      var bn = basename(img);
      var bad = missingStill(img) || isCover(img) || (bn && used[bn]);
      if (bad) {
        img = pickByTitle(item, used);
        item.image = img;
        item.still = img;
        item.thumb = img;
        item.poster = img;
      }
      used[basename(item.image)] = 1;
    }
  }

  function apply() {
    var d = window.WRAP911_DATA;
    if (!d) return;
    var i, v, src;
    if (d.vehicles) {
      for (i = 0; i < d.vehicles.length; i++) {
        v = VEH[d.vehicles[i].id];
        if (v) {
          d.vehicles[i].title = v.title;
          d.vehicles[i].summary = v.summary;
        } else {
          var raw = String(d.vehicles[i].title || d.vehicles[i].id || "").toLowerCase();
          if (/interior|storefront|architect/.test(raw)) {
            d.vehicles[i].title = "Interior";
            d.vehicles[i].summary = "Walls, cabinets, glass, fixtures.";
          } else {
            d.vehicles[i].title = "Vehicles";
            d.vehicles[i].summary = "Cars, pickups, trailers, and fleet work from the bay.";
          }
        }
      }
      var seen = {};
      var slim = [];
      for (i = 0; i < d.vehicles.length; i++) {
        var name = d.vehicles[i].title;
        if ((name === "Vehicles" || name === "Interior") && !seen[name]) {
          seen[name] = 1;
          slim.push(d.vehicles[i]);
        }
      }
      d.vehicles = slim;
    }
    function relabel(list, allowCover) {
      if (!list) return;
      for (i = 0; i < list.length; i++) {
        if (list[i].category && CAT[list[i].category]) list[i].category = CAT[list[i].category];
        if (list[i].jobType && CAT[list[i].jobType]) list[i].jobType = CAT[list[i].jobType];
        src = list[i].src || list[i].video || "";
        if (/\.mp4$/i.test(src) && !REAL[src]) {
          list[i].src = "";
          list[i].stillOnly = true;
        }
        if (allowCover) {
          KEYS.forEach(function (k) {
            if (missingStill(list[i][k])) list[i][k] = COVER;
          });
        }
      }
    }
    relabel(d.VIDEO_CATALOG, true);
    relabel(d.videos, true);
    relabel(d.trainingLessons, false);
    relabel(d.photoLessons, false);
    relabel(d.gallery, false);
    relabel(d.practiceScenarios, false);
    uniquePhotos();
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  setTimeout(apply, 0);
  setTimeout(apply, 250);
  setTimeout(apply, 900);
  setTimeout(apply, 1800);

  document.addEventListener("error", function (e) {
    var t = e.target;
    if (!t || t.tagName !== "IMG") return;
    var cur = String(t.src || "");
    if (cur.indexOf("trailer-rivets.jpg") !== -1) return;
    t.src = COVER;
  }, true);
})();
