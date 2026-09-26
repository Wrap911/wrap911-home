/* One still = one card. Local bay files only. No Drive thumbnail URLs. */
(function () {
  var EXTRA = [
    {
      id: "prob-airstream-nose",
      title: "Airstream nose, film not seated",
      image: "media/photos/gallery/airstream-nose.jpg",
      module: "squeegee",
      jobType: "Problems",
      visual: "Cream Airstream nose. Film is on the crown but the center seam is open and the lower edge is still loose. Rivets run the panel. A ladder is in the way.",
      narration: "Problem: the nose panel is hung and not glassed. The seam at the crown is open. Heat will not close that.\n\nSolution: move the ladder. Glass from the center out. Feed the radius. Do not bridge the rivet row. Seat the loose lower edge before you trim.",
      checklist: ["Move the ladder off the panel", "Glass from the center out", "Close the crown seam before heat", "Feed rivets, do not bridge them"],
      quiz: { q: "The crown seam is still open. First move?", correct: "Glass it shut from the center. Do not torch an open seam.", wrong: "Heat the crown until the seam disappears." }
    },
    {
      id: "prob-airstream-light",
      title: "Airstream marker light still covered",
      image: "media/photos/gallery/airstream-corner.jpg",
      module: "cutting",
      jobType: "Problems",
      visual: "Cream film over an oval amber marker light. Fingers bunch above and below the light. Rivets on the right post.",
      narration: "Problem: the marker light is still under film and the corner is fingered.\n\nSolution: lift the fingers, glass toward the housing, then cut the light out. Leave a small tuck. Do not call those rivets a tent close-up from this wide shot.",
      checklist: ["Lift the fingers first", "Glass toward the housing", "Cut the light out", "Do not bridge the rivets"],
      quiz: { q: "What is under the cream film in the oval?", correct: "A marker light that still needs to be cut out.", wrong: "A rivet dome to mash flat." }
    },
    {
      id: "bay-airstream-graphic",
      title: "Airstream mountain graphic",
      image: "media/photos/gallery/airstream-graphic.jpg",
      module: "post-heat",
      jobType: "Vehicles",
      visual: "Blue and cream Airstream. Mountain and pine graphic is down. Blue tape is still on the nose curve. Rear wheels and a Toyota badge are in frame.",
      narration: "The graphic is seated. Tape is still on the nose curve. Pull that tape low and slow after the panel is glassed. Check the rivet line and the wheel-well edge before you call it done.",
      checklist: ["Confirm the graphic is glassed", "Pull the blue tape low and slow", "Check rivets and the wheel-well edge", "Do not heat a panel that is already down just to look busy"],
      quiz: { q: "Tape is still on the nose. Move?", correct: "Squeegee it, then pull low and slow.", wrong: "Leave the tape. It holds the edge." }
    },
    {
      id: "prob-pickup-quarter",
      title: "Pickup quarter, fingers at the lamp",
      image: "media/photos/gallery/pickup-bottle-quarter.jpg",
      module: "squeegee",
      jobType: "Problems",
      visual: "Sage bottle-print film on a pickup quarter. Fingers stack at the taillight and the cap seam. A spray bottle is on the floor. LEER badge on the cap.",
      narration: "Problem: film is bridged into the lamp pocket and fingered along the bed seam.\n\nSolution: glass the door flat first. Stop at the lamp. Relief-cut and feed the pocket. Do not stretch the bottle print across the opening.",
      checklist: ["Glass the flat before the lamp", "Relief-cut the taillight pocket", "Do not stretch the print across the gap", "Keep the spray bottle off the film"],
      quiz: { q: "Fingers at the taillight. First fix?", correct: "Lift, glass the flat, then feed the pocket.", wrong: "Torch the pocket and mash the fingers flat." }
    },
    {
      id: "prob-rv-pink",
      title: "RV side, pink film still loose",
      image: "media/photos/gallery/rv-pink-side.jpg",
      module: "squeegee",
      jobType: "Problems",
      visual: "Tall RV or box side. Pink and red film is on the panel but wrinkled and not glassed. A ladder stands in front. The next bay section is still bare.",
      narration: "Problem: the sheet is stuck at the top and the field is still loose. A ladder in front is not a squeegee.\n\nSolution: hinge from the glassed top. Overlap strokes down the panel. Do not heat the loose field to hide wrinkles.",
      checklist: ["Work from the glassed top down", "Overlap every stroke", "No heat on a loose field", "Move the ladder when it blocks the panel"],
      quiz: { q: "The pink field is still wrinkled. Move?", correct: "Squeegee from the glassed area down. Do not heat it first.", wrong: "Heat the whole sheet so the wrinkles fall out." }
    },
    {
      id: "int-magenta-run",
      title: "Interior panels, clips still on",
      image: "media/photos/gallery/panels-6222.jpg",
      module: "architectural",
      jobType: "Interior",
      visual: "A run of magenta and red wall panels. Small metal clips and black pads are still on the faces.",
      narration: "Clips and pads on a finished face will read as defects under shop lights. Pop them after the film is glassed. Do not squeegee over hardware.",
      checklist: ["Glass the face first", "Remove clips and pads", "Check seams between panels", "Raking light before you walk"],
      quiz: { q: "A clip is still on the show face. Move?", correct: "Take it off after the film is seated.", wrong: "Squeegee over it so the face stays smooth." }
    },
    {
      id: "int-panel-corner",
      title: "Interior corner, two red faces",
      image: "media/photos/gallery/panel-6220.jpg",
      module: "architectural",
      jobType: "Interior",
      visual: "Inside corner of two red panels. The faces meet at a sharp edge. No knife is in the frame.",
      narration: "An inside corner gets a relief cut, then one face, then the other. Do not stretch one sheet around the corner.",
      checklist: ["Read the corner before you commit", "Relief cut off the show face", "Seat one face, then the other", "Do not bridge the edge"],
      quiz: { q: "How do you wrap this inside corner?", correct: "Relief cut, then one face at a time.", wrong: "Stretch one sheet around the corner." }
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
      var key = base(it.image || it.still || "");
      if (!key) key = String(it.id || i);
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(it);
    }
    return out;
  }

  function apply() {
    var d = window.WRAP911_DATA;
    if (!d || !d.photoLessons) return;
    var i;
    for (i = 0; i < d.photoLessons.length; i++) {
      var img = String(d.photoLessons[i].image || "");
      if (img.indexOf("drive.google.com") !== -1 || img.indexOf("thumbnail?id=") !== -1) {
        d.photoLessons[i].image = "";
      }
    }
    var haveId = {};
    var haveImg = {};
    for (i = 0; i < d.photoLessons.length; i++) {
      haveId[d.photoLessons[i].id] = 1;
      var b = base(d.photoLessons[i].image);
      if (b) haveImg[b] = 1;
    }
    for (i = 0; i < EXTRA.length; i++) {
      var ex = EXTRA[i];
      if (haveId[ex.id] || haveImg[base(ex.image)]) continue;
      d.photoLessons.unshift(ex);
      haveId[ex.id] = 1;
      haveImg[base(ex.image)] = 1;
    }
    d.photoLessons = dedupe(d.photoLessons);
  }

  apply();
  document.addEventListener("DOMContentLoaded", apply);
  setTimeout(apply, 60);
  setTimeout(apply, 500);
  setTimeout(apply, 1600);
  setTimeout(apply, 2800);
})();
