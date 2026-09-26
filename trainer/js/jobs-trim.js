/* Simple categories only: Problems, Vehicles, Interior. */
(function () {
  var KEEP = { Problems: 1, Vehicles: 1, Interior: 1 };

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

  /* Hotfix 2.6.5: labels-fix.js now keeps one card per vehicle with a complete workflow
     (window.WRAP911_OPEN_VEHICLES). This file used to cut the list back to "Vehicles" + "Interior"
     and delete every other job-type card; it now only keeps the storefront card titled "Interior". */
  function trimVehicles() {
    var d = window.WRAP911_DATA;
    if (!d || !d.vehicles) return;
    for (var i = 0; i < d.vehicles.length; i++) {
      var v = d.vehicles[i];
      if (v.id === "storefront") {
        v.title = "Interior";
        v.name = "Interior";
        v.summary = "Walls, cabinets, glass, fixtures.";
      }
    }
  }

  function paintGrid() {
    /* The grid is rendered from WRAP911_DATA.vehicles (app_extra.js renderJobTypeGrid); nothing to remove. */
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
    var d = window.WRAP911_DATA;
    if (sub && d && d.vehicles && d.vehicles.length) {
      sub.textContent = d.vehicles.map(function (v) { return v.title; }).join(" · ");
    }
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
