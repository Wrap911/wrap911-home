/* WRAP 911 1.4 job math and copy. Shared by the job screen and the material calculator.
   No temperatures, no other film brands, no quotes. */
(function (root) {
  "use strict";

  var FILM_BRANDS = ["3M", "Avery Dennison", "BriteLine"];
  var BASE_HOURS = {
    "box-truck": 8,
    van: 6,
    trailer: 7,
    storefront: 4,
    "rv-bus": 10,
    fleet: 5
  };

  function num(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  function clampWaste(waste) {
    var n = num(waste, 15);
    if (n < 10) n = 10;
    if (n > 20) n = 20;
    return n;
  }

  function calcMaterial(input) {
    input = input || {};
    var w = num(input.w, 0);
    var h = num(input.h, 0);
    var panels = num(input.n, 1);
    if (panels < 1) panels = 1;
    var roll = num(input.roll, 54);
    if (roll !== 60) roll = 54;
    var rivet = num(input.rivet, 1);
    var recess = num(input.recess, 1);
    if (rivet < 0) rivet = 0;
    if (recess < 0) recess = 0;
    var waste = clampWaste(input.waste);
    var mat = num(input.mat, 0);
    var laborRate = num(input.labor, 0);
    var hours = num(input.hours, 0);
    var sqftPanel = (w * h) / 144;
    var totalSqft = sqftPanel * panels;
    var adjusted = totalSqft * rivet * recess * (1 + waste / 100);
    var linearFt = roll > 0 ? (adjusted / (roll / 12)) : 0;
    var matCost = adjusted * mat;
    var laborHours = hours * rivet * recess;
    var laborCost = laborHours * laborRate;
    return {
      roll: roll,
      waste: waste,
      rivet: rivet,
      recess: recess,
      sqftPanel: sqftPanel,
      totalSqft: totalSqft,
      adjusted: adjusted,
      linearFt: linearFt,
      matCost: matCost,
      laborHours: laborHours,
      laborCost: laborCost,
      total: matCost + laborCost
    };
  }

  function sizeFactor(adjustedSqft, coverage) {
    var sq = num(adjustedSqft, 0);
    if (sq > 0) {
      if (sq < 40) return 0.5;
      if (sq < 100) return 0.8;
      if (sq < 200) return 1;
      if (sq < 400) return 1.5;
      return 2;
    }
    var text = String(coverage || "").toLowerCase();
    if (text.indexOf("partial") >= 0) return 0.65;
    if (text.indexOf("full") >= 0) return 1.25;
    return 1;
  }

  function starterHours(input) {
    input = input || {};
    var base = BASE_HOURS[input.jobType] || 6;
    var hours = Math.round(base * sizeFactor(input.adjustedSqft, input.coverage) * 2) / 2;
    if (hours < 1) hours = 1;
    if (hours > 24) hours = 24;
    return hours;
  }

  function estimateNote() {
    return "This is an estimate, not a quote.";
  }

  function timeLabel() {
    return "Time estimate. A starting estimate for this job type and size. You can change the hours. This is an estimate, not a quote.";
  }

  function seatOrPack(lic, now) {
    if (!lic || lic.expired) return false;
    var when = now == null ? Date.now() : now;
    if (lic.expiresAt && when > Number(lic.expiresAt)) return false;
    return lic.sku === "seat" || lic.sku === "pack";
  }

  function scrubPhotoText(value) {
    var t = String(value || "");
    t = t.replace(/\b(arlon|oracal|orafol|hexis|vvivid|inozetek|kpmf|teckwrap|tinybot|cheetahwrap|xpel|stek|suntek|llumar|geoshield)\b/gi, "that film");
    t = t.replace(/\bAvery(?!\s+Dennison)\b/g, "Avery Dennison");
    t = t.replace(/\bavery(?!\s+dennison)\b/g, "Avery Dennison");
    t = t.replace(/\b-?\d+(?:\.\d+)?\s*(?:°|degrees?)\s*[fFcC]?\b/g, "the range on the film TDS");
    t = t.replace(/\b(?:to|at|about|around)\s+\d{2,3}\s*(?:°\s*)?(?:f|c|fahrenheit|celsius)\b/gi, "within the film TDS");
    t = t.replace(/\b\d{2,3}\s*(?:°\s*)?(?:f|c|fahrenheit|celsius)\b/gi, "the film TDS");
    t = t.replace(/\bguaranteed diagnosis\b/gi, "likely cause");
    t = t.replace(/\bdefinite diagnosis\b/gi, "likely cause");
    t = t.replace(/\bdefinitely\b/gi, "likely");
    t = t.replace(/\bcertified\b/gi, "trained");
    t = t.replace(/\bcertifications?\b/gi, "shop training");
    t = t.replace(/\u2014/g, ", ").replace(/\u2013/g, "-");
    t = t.replace(/BriteLine[^.!\n]{0,40}\bPPF\b/gi, "BriteLine does not make PPF");
    return t.replace(/[ \t]{2,}/g, " ").trim();
  }

  function asLikelyCause(text) {
    var s = scrubPhotoText(text);
    if (!s) return "";
    if (/^likely cause\b/i.test(s)) return s;
    return "Likely cause: " + s.charAt(0).toLowerCase() + s.slice(1);
  }

  function formatClock(ms) {
    var n = Math.max(0, Math.round(num(ms, 0) / 1000));
    var m = Math.floor(n / 60);
    var s = n % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  var api = {
    FILM_BRANDS: FILM_BRANDS,
    BASE_HOURS: BASE_HOURS,
    calcMaterial: calcMaterial,
    clampWaste: clampWaste,
    starterHours: starterHours,
    estimateNote: estimateNote,
    timeLabel: timeLabel,
    seatOrPack: seatOrPack,
    scrubPhotoText: scrubPhotoText,
    asLikelyCause: asLikelyCause,
    formatClock: formatClock
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WRAP911_JOB_LOGIC = api;
})(typeof window !== "undefined" ? window : globalThis);
