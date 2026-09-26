/* One still = one card. Drop copy-paste trailer/caddy repeats. Pull Drive extras. */
(function () {
  var DRIVE = "https://drive.google.com/thumbnail?id=";

  var EXTRA = [
    {
      id: "drv-airstream-side",
      title: "Airstream side wrap",
      image: DRIVE + "1gX_mARfcjCV0Wzqg9Qw7dYbR-1-BW6zx&sz=w1600",
      module: "squeegee",
      jobType: "Vehicles",
      visual: "Airstream body mid-wrap from the Wrap 911 Drive folder.",
      narration: "Long compound curves. Glass the flats, then feed the radius. Do not stretch across a rivet row to hide a seam.",
      checklist: ["Read the curve before heat", "Glass flats first", "Feed the radius", "TDS heat only"],
      quiz: { q: "Airstream radius. First move?", correct: "Glass the flat, then feed the curve.", wrong: "Torch the whole side so the film goes soft." }
    },
    {
      id: "drv-airstream-top",
      title: "Airstream top wrap",
      image: DRIVE + "1YJEIaSTQXdHtLfOLuu6qvcWxkH1r4aps&sz=w1600",
      module: "squeegee",
      jobType: "Vehicles",
      visual: "Airstream roof / upper skin from the Drive folder.",
      narration: "Roof work is layout and two people. Do not walk film dirt into a wet panel.",
      checklist: ["Stage the panel", "Two people on a long hang", "Keep grit off the roof", "Post-check in raking light"],
      quiz: { q: "Who hangs a long Airstream roof panel?", correct: "Two people. One sets, one follows.", wrong: "One person with more heat." }
    },
    {
      id: "drv-bay-0806",
      title: "Bay still — IMG_0806",
      image: DRIVE + "13HsWzFqYbGPjabfiyV3ogYf7pX4ERHll&sz=w1600",
      module: "prep",
      jobType: "Problems",
      visual: "Shop still from the Wrap 911 Drive folder (IMG_0806).",
      narration: "Name what is in frame before you invent a defect. If the edge is dirty, reclean. Do not glue dirt in.",
      checklist: ["Name the panel", "Look for dirt at the edge", "Reclean before reseat", "TDS only"],
      quiz: { q: "Dirty edge. First fix?", correct: "Pull back, reclean, reseat.", wrong: "Weld it down with extra heat." }
    },
    {
      id: "drv-bay-6220",
      title: "Bay still — IMG_6220",
      image: DRIVE + "12hIgs4Qw1mBDS6xF2c2v7pZnB0mWKyRt&sz=w1600",
      module: "post-heat",
      jobType: "Vehicles",
      visual: "Shop still from the Wrap 911 Drive folder (IMG_6220).",
      narration: "QC the panel that is in the photo. Raking light. Edges first.",
      checklist: ["Raking light", "Check edges", "Note tents", "Do not leave a tick-up"],
      quiz: { q: "When is QC?", correct: "Before the vehicle leaves the bay.", wrong: "After the first rain." }
    },
    {
      id: "drv-bay-6222",
      title: "Bay still — IMG_6222",
      image: DRIVE + "1RWuh6dofp3X_3g87Zxa55VaMRlD1akbw&sz=w1600",
      module: "squeegee",
      jobType: "Vehicles",
      visual: "Shop still from the Wrap 911 Drive folder (IMG_6222).",
      narration: "Match the job in frame. Overlap squeegee strokes. No dry islands.",
      checklist: ["Name the job", "Overlap strokes", "No dry islands", "Keep tools off fresh film"],
      quiz: { q: "Squeegee rule?", correct: "Overlapped sequence. No dry islands.", wrong: "One hard pass down the center." }
    },
    {
      id: "drv-jpg-5918",
      title: "Bay still — 59189248600",
      image: DRIVE + "1TrBd4hU4aZtCWeuUZHRPswsGoVf62u1P&sz=w1600",
      module: "prep",
      jobType: "Problems",
      visual: "JPEG from the Wrap 911 Drive folder.",
      narration: "Describe the frame. If tape is still on a graphic, pull low and slow.",
      checklist: ["Describe the frame", "Tape low and slow", "Stop if a corner lifts", "Bag the tape"],
      quiz: { q: "Transfer tape pull?", correct: "Low and slow, 180 degrees.", wrong: "Snap it straight up." }
    },
    {
      id: "drv-jpg-5932",
      title: "Bay still — 59327138079",
      image: DRIVE + "1IJtyv7niB3hbl_nTkilUVm8wtJLlbtZs&sz=w1600",
      module: "cutting",
      jobType: "Problems",
      visual: "JPEG from the Wrap 911 Drive folder.",
      narration: "Finish cuts use a fresh blade and light pressure. Film only.",
      checklist: ["Fresh blade", "Light pass", "Film only", "Do not score paint"],
      quiz: { q: "Chewed cut. Cause?", correct: "Dull blade or too much pressure.", wrong: "Not enough heat on the cut line." }
    },
    {
      id: "local-glass-partitions",
      title: "Office glass partitions",
      image: "media/stock/multipane_office_glass_partitions.jpg",
      module: "architectural",
      jobType: "Interior",
      visual: "Multi-pane office glass. Layout seams off the sight line.",
      narration: "Glass film is layout first. Dust is a tent under lights. Do not stretch art across a mullion.",
      checklist: ["Clean the glass", "Layout off sight lines", "No stretch across a mullion", "Squeegee sequence"],
      quiz: { q: "Glass partition. First move?", correct: "Clean and layout. Do not stretch across a mullion.", wrong: "Heat the whole wall so the film goes soft." }
    },
    {
      id: "local-squeegee-table",
      title: "Squeegee strokes on the table",
      image: "media/videos/prep/squeegee-strokes.jpg",
      module: "squeegee",
      jobType: "Vehicles",
      visual: "Squeegee work on film at the table.",
      narration: "Stroke pattern on the table is the same on the vehicle. Overlap. Soft edge.",
      checklist: ["Overlap", "Soft edge", "Wipe the blade", "No grit"],
      quiz: { q: "Why wipe the squeegee?", correct: "Grit on the blade scratches film.", wrong: "So the heat transfers better." }
    },
    {
      id: "local-torch-1",
      title: "Heat on vinyl — keep it moving",
      image: "media/videos/prep/torch-on-vinyl1.jpg",
      module: "heat",
      jobType: "Problems",
      visual: "Torch over film.",
      narration: "Heat is a tool. Keep it moving. TDS only.",
      checklist: ["Keep heat moving", "TDS only", "Never hold one spot", "Stop if film goes shiny-melted"],
      quiz: { q: "Film looks shiny-melted. Meaning?", correct: "You passed the TDS window. Stop.", wrong: "It is ready for a harder squeegee." }
    },
    {
      id: "local-translucent",
      title: "Translucent film on the table",
      image: "media/videos/prep/translucent-vinyl.jpg",
      module: "film-types",
      jobType: "Interior",
      visual: "Translucent film staged for hang.",
      narration: "Translucent shows dirt and stretch. Prep is the job.",
      checklist: ["Clean first", "Light pressure", "Watch stretch marks", "Raking light"],
      quiz: { q: "Why go light on translucent?", correct: "It shows dirt and stretch that opaque hides.", wrong: "It needs more torch than gloss." }
    },
    {
      id: "local-cut6",
      title: "Table cut — long sheet",
      image: "media/videos/prep/cutting-vinyl-6.jpg",
      module: "cutting",
      jobType: "Vehicles",
      visual: "Cutting a long sheet on the table.",
      narration: "Square the sheet before it leaves the table. Fresh blade. Cut once.",
      checklist: ["Fresh blade", "Square the sheet", "Cut once", "Bag scrap"],
      quiz: { q: "Why square on the table?", correct: "A crooked sheet becomes a crooked hang.", wrong: "So the torch heats even." }
    }
  ];

  function base(path) {
    return String(path || "").split("?")[0].split("#")[0].replace(/^.*\//, "").toLowerCase();
  }

  function dedupe(list) {
    if (!list) return [];
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      var key = base(it.image || it.still || "") || String(it.id || i);
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(it);
    }
    return out;
  }

  function apply() {
    var d = window.WRAP911_DATA;
    if (!d) return;
    if (!d.photoLessons) d.photoLessons = [];
    var haveId = {};
    var haveImg = {};
    var i;
    for (i = 0; i < d.photoLessons.length; i++) {
      haveId[d.photoLessons[i].id] = 1;
      haveImg[base(d.photoLessons[i].image)] = 1;
    }
    for (i = 0; i < EXTRA.length; i++) {
      var ex = EXTRA[i];
      if (haveId[ex.id] || haveImg[base(ex.image)]) continue;
      d.photoLessons.push(ex);
      haveId[ex.id] = 1;
      haveImg[base(ex.image)] = 1;
    }
    d.photoLessons = dedupe(d.photoLessons);
    if (d.gallery) d.gallery = dedupe(d.gallery);
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  setTimeout(apply, 50);
  setTimeout(apply, 400);
  setTimeout(apply, 1200);
  setTimeout(apply, 2400);
})();
