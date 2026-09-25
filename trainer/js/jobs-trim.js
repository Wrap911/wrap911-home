/* Simple categories only: Problems, Vehicles, Interior. */
(function () {
  var KEEP = { Problems: 1, Vehicles: 1, Interior: 1 };
  var DROP = /box\s*truck|work\s*van|tall\s*side|\bfleet\b|\btrailer\b|\bvan\b|\brv\b/i;

  function jobOf(item) {
    var raw = String((item && (item.jobType || item.category || item.cat)) || "").toLowerCase();
    var img = String((item && (item.image || item.still || item.src || item.file)) || "").toLowerCase();
    var id = String((item && item.id) || "").toLowerCase();
    if (id.indexOf("prob-") === 0 || raw.indexOf("problem") !== -1) return "Problems";
    if (/architectural|cabinet|kiosk|office|bleed|half-moon|interior|storefront/.test(raw + " " + img + " " + id)) return "Interior";
    return "Vehicles";
  }

  function relabel(list) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      it.jobType = jobOf(it);
      if (it.category) it.category = it.jobType;
      if (it.cat && !KEEP[it.cat]) it.cat = it.jobType;
    }
  }

  function trimVehicles() {
    var d = window.WRAP911_DATA;
    if (!d || !d.vehicles) return;
    var vehicle, interior;
    for (var i = 0; i < d.vehicles.length; i++) {
      var v = d.vehicles[i];
      var t = String(v.title || v.id || v.name || "").toLowerCase();
      if (/interior|storefront|architect/.test(t)) interior = v;
      else if (!vehicle) vehicle = v;
    }
    if (vehicle) {
      vehicle.title = "Vehicles";
      vehicle.name = "Vehicles";
      vehicle.summary = "Cars, pickups, trailers, and fleet work from the bay.";
    }
    if (interior) {
      interior.title = "Interior";
      interior.name = "Interior";
      interior.summary = "Walls, cabinets, glass, fixtures.";
    }
    var next = [];
    if (vehicle) next.push(vehicle);
    if (interior && interior !== vehicle) next.push(interior);
    d.vehicles = next;
  }

  function paintGrid() {
    var grid = document.getElementById("job-type-grid");
    if (!grid) return;
    var kids = grid.children;
    var keep = [];
    var i;
    for (i = 0; i < kids.length; i++) {
      var el = kids[i];
      var t = (el.textContent || "").toLowerCase();
      if (/interior/.test(t) && !/vehicles/.test(t)) keep.push(el);
      else if (/vehicles/.test(t)) keep.push(el);
    }
    if (keep.length >= 2) {
      for (i = kids.length - 1; i >= 0; i--) {
        if (keep.indexOf(kids[i]) === -1) kids[i].parentNode.removeChild(kids[i]);
      }
      return;
    }
    for (i = kids.length - 1; i >= 0; i--) {
      if (DROP.test(kids[i].textContent || "")) kids[i].parentNode.removeChild(kids[i]);
    }
  }

  function chips() {
    var wrap = document.getElementById("photo-filter-chips");
    if (wrap) {
      wrap.setAttribute("data-problems-chips", "1");
      wrap.setAttribute("data-trim-chips", "1");
      wrap.innerHTML =
        '<button type="button" class="chip" data-photo-job="">All</button>' +
        '<button type="button" class="chip" data-photo-job="Problems">Problems</button>' +
        '<button type="button" class="chip" data-photo-job="Vehicles">Vehicles</button>' +
        '<button type="button" class="chip" data-photo-job="Interior">Interior</button>';
    }
    var vwrap = document.getElementById("video-filter-chips");
    if (vwrap) {
      vwrap.innerHTML =
        '<button type="button" class="chip" data-video-cat="">All</button>' +
        '<button type="button" class="chip" data-video-cat="Vehicles">Vehicles</button>' +
        '<button type="button" class="chip" data-video-cat="Interior">Interior</button>';
    }
  }

  function homeCopy() {
    var sub = document.querySelector("#goto-learn-job .card-sub");
    if (sub) sub.textContent = "Vehicles · Interior";
  }

  function apply() {
    var d = window.WRAP911_DATA;
    if (d) {
      relabel(d.photoLessons);
      relabel(d.VIDEO_CATALOG);
      relabel(d.videos);
      relabel(d.trainingLessons);
      relabel(d.gallery);
      trimVehicles();
    }
    chips();
    homeCopy();
    paintGrid();
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  setTimeout(apply, 200);
  setTimeout(apply, 800);
  setTimeout(apply, 1800);
  setTimeout(apply, 3200);

  var grid = document.getElementById("job-type-grid");
  var wrap = document.getElementById("home-job-types");
  if (window.MutationObserver && (grid || wrap)) {
    var mo = new MutationObserver(function () { paintGrid(); trimVehicles(); });
    if (grid) mo.observe(grid, { childList: true, subtree: true });
    if (wrap) mo.observe(wrap, { attributes: true, childList: true, subtree: true });
  }
})();
