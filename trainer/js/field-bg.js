/* WRAP 911 — field imagery backgrounds. Swaps a fixed backdrop by screen
   and vehicle module. Does not touch pricing, IAP, or unlock flow. */
(function () {
  var DEFAULT_SRC = "media/bg/home.webp";
  var BY_SCREEN = {
    home: "media/bg/home.webp",
    rules: "media/bg/home.webp",
    pricing: "media/bg/fleet.webp",
    about: "media/bg/fleet.webp",
    "problem-doctor": "media/bg/doctor.webp",
    practice: "media/bg/practice.webp",
    "practice-hub": "media/bg/practice.webp",
    drills: "media/bg/practice.webp",
    "drill-spot": "media/bg/practice.webp",
    "drill-checklist": "media/bg/practice.webp",
    "drill-checklist-pick": "media/bg/practice.webp",
    "drill-scenarios": "media/bg/practice.webp",
    "drill-scenario": "media/bg/practice.webp",
    "drill-flash": "media/bg/practice.webp"
  };
  var BY_VEHICLE = {
    "box-truck": "media/bg/box-truck.webp",
    van: "media/bg/van.webp",
    trailer: "media/bg/trailer.webp",
    storefront: "media/bg/storefront.webp",
    fleet: "media/bg/fleet.webp",
    "rv-bus": "media/bg/rv-bus.webp"
  };
  var VEHICLE_SCREENS = {
    vehicle: true,
    lesson: true,
    "job-edit": true
  };

  function vehicleId() {
    var c = window.WRAP911_APP && window.WRAP911_APP.core;
    return (c && c.state && c.state.vehicleId) || "";
  }

  function srcFor(name) {
    if (VEHICLE_SCREENS[name]) {
      return BY_VEHICLE[vehicleId()] || DEFAULT_SRC;
    }
    return BY_SCREEN[name] || DEFAULT_SRC;
  }

  function apply(name) {
    var layer = document.getElementById("field-bg");
    if (!layer) return;
    var src = srcFor(name || "home");
    layer.style.backgroundImage = "url('" + src + "')";
    document.body.setAttribute("data-field-bg", name || "home");
  }

  function hook() {
    var c = window.WRAP911_APP && window.WRAP911_APP.core;
    if (!c || typeof c.showScreen !== "function" || c._fieldBgHooked) return !!c && c._fieldBgHooked;
    var orig = c.showScreen;
    c.showScreen = function (name) {
      var out = orig.apply(this, arguments);
      try { apply(name); } catch (e) {}
      return out;
    };
    c._fieldBgHooked = true;
    var active = document.querySelector(".screen.active");
    var name = "home";
    if (active && active.id && active.id.indexOf("screen-") === 0) {
      name = active.id.slice("screen-".length);
    }
    apply(name);
    return true;
  }

  function boot() {
    if (hook()) return;
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (hook() || n > 40) clearInterval(t);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
