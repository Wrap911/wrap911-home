/* WRAP 911 — Problems database
   Common wrap defects + the shop fix. Uses real bay stills.
   jobType filter chip: Problems
*/
(function () {
  if (!window.WRAP911_DATA) window.WRAP911_DATA = {};
  var d = window.WRAP911_DATA;
  if (!d.photoLessons) d.photoLessons = [];

  var DB = [
    {
      id: "prob-rivet-tent",
      title: "Problem: reading the wrong job — Solution: name the trailer in frame",
      image: "../assets/sales/trailer-rivets.jpg",
      module: "post-heat",
      jobType: "Problems",
      visual: "Black dual-axle enclosed trailer. White slash graphic already on the side. Salmon panel still under grey transfer tape on the nose, with orange tape. Blue and yellow ladder and a torch on the concrete. This wide shot is not a rivet-tent close-up and it is not a pickup.",
      narration: "Problem: the caption names rivet tents and marker lights this frame does not show. The photo is the black enclosed trailer. White slash graphic is already down on the side. The salmon nose panel is still under transfer tape.\n\nSolution: describe what is in the picture. Register the taped panel, squeegee it, pull the tape low and slow. Fastener heads on the upper skin are not a tent close-up, so do not teach a rivet mash from this still. Heat only after the panel is aligned, and only per the 3M, Avery Dennison, or Arlon TDS.",
      checklist: [
        "Glass the panel flats before any rivet head",
        "Heat only to the film TDS — no chat-room numbers",
        "Seat the ring around the head, then the dome",
        "If it already tented, lift / warm / reseat — do not mash",
        "Post-heat the field after the row is down"
      ],
      quiz: {
        q: "A rivet already tented after the panel cooled. First move?",
        correct: "Lift locally, warm to TDS, reseat the ring then the dome.",
        wrong: "Hard-squeegee the tent flat so the gloss matches the rest of the panel."
      }
    },
    {
      id: "prob-short-lamp",
      title: "Problem: short lamp trim — Solution: 1–2 mm tuck",
      image: "media/photos/gallery/front-bumper-wrap.jpg",
      module: "cutting",
      jobType: "Problems",
      visual: "Dusty-rose bumper at the LED pocket. This cut either hides or shows OEM color by week two.",
      narration: "Problem: flush-cut at the headlight housing. Film retracts in the cold. A hairline of paint shows at eye level.\n\nSolution: set film into the pocket with a tucking tool first. Cut into the void, blade angled off the paint. Leave 1–2 mm to tuck behind the black housing. Heat-set the tuck per TDS. Clean the pocket before you wrap it — dirt in here becomes a lift line.",
      checklist: [
        "Clean the lamp pocket before film goes in",
        "Tuck first, then cut",
        "Leave 1–2 mm behind the housing",
        "Do not score paint",
        "Heat-set the tucked edge per TDS"
      ],
      quiz: {
        q: "Why leave a small overlap at a headlight pocket?",
        correct: "So the edge can tuck behind the housing and survive cold shrink.",
        wrong: "So you can stretch the film tighter across the lamp lens."
      }
    },
    {
      id: "prob-sensor-dirt",
      title: "Problem: lift at sensor / grille — Solution: clean, relief, no stretch",
      image: "media/photos/gallery/pink-caddy-bumper-close-up.jpg",
      module: "prep",
      jobType: "Problems",
      visual: "Pink caddy lower bumper, grille slats, sensor hole, hose on the floor.",
      narration: "Problem: film lifts at a sensor hole or slat end. Cause is almost always dirt in the hole, a dry cut, or film stretched across the opening.\n\nSolution: pick the hole clean. IPA the ring. Relief-cut to the opening, do not bridge it. Seat the slat faces one at a time. Keep plasticizer and wax off that edge. If it already lifted, pull back, reclean, reseat — do not glue over contamination.",
      checklist: [
        "Pick and IPA the sensor ring before film",
        "Relief-cut to the hole — do not bridge",
        "Seat slats one face at a time",
        "No stretch across an opening",
        "If it lifted, reclean — do not glue dirt in"
      ],
      quiz: {
        q: "Film lifted at a bumper sensor the next day. First fix?",
        correct: "Pull back, reclean the ring, relief-cut and reseat. Do not glue over dirt.",
        wrong: "Weld the edge down with extra heat until it sticks."
      }
    },
    {
      id: "prob-bridge-intake",
      title: "Problem: bridged intake — Solution: feed the recess",
      image: "media/photos/gallery/front-bumper-wrap-caddy.jpg",
      module: "squeegee",
      jobType: "Problems",
      visual: "Lower intake on the pink caddy. Roller and hose on the concrete.",
      narration: "Problem: film spans the lower intake like a drum. Looks clean until a wash or a cold night. Then it pops and traps water.\n\nSolution: glass the bumper face. Stop at the intake lip. Relief-cut, then feed film into the recess with a soft edge. Do not stretch across the void. Tools on the floor stay on the floor — do not set a knifeless roll on fresh film.",
      checklist: [
        "Glass the face, stop at the intake lip",
        "Relief-cut before the void",
        "Feed film in — do not bridge",
        "Soft edge, not a hard pull",
        "Keep floor tools off fresh film"
      ],
      quiz: {
        q: "How do you wrap a lower intake opening?",
        correct: "Relief-cut and feed film into the recess. Do not stretch across it.",
        wrong: "Pull the panel tight over the opening so the face stays glossy."
      }
    },
    {
      id: "prob-fingers-wall",
      title: "Problem: wall finger — Solution: lift it, do not mash it",
      image: "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.jpg",
      module: "squeegee",
      jobType: "Problems",
      visual: "Grey wood-grain wall film. A hand with a ring lifts a vertical seam so a finger stands off the panel. A small metal tool lies on the film. No heat gun is in this frame.",
      narration: "Problem: a finger is standing in the wood-grain. A hard squeegee will crease the grain.\n\nSolution: do what the hand is doing. Lift the finger, chase the air out to the side, then squeegee from the glassed area back into the seam. There is no torch in this still, so do not invent a temperature. If the film still will not relax, use heat only per the 3M, Avery Dennison, or Arlon TDS after the lift.",
      checklist: [
        "Do not smash a finger flat",
        "Lift, warm to TDS, pull tension sideways",
        "Squeegee from glassed film into the finger",
        "Keep the heat source moving",
        "Check the field in raking light before you walk"
      ],
      quiz: {
        q: "A finger is standing on a wall panel. Correct move?",
        correct: "Lift, warm to TDS, redistribute tension, then squeegee.",
        wrong: "Hold the torch on the wrinkle until it shrinks into the wall."
      }
    },
    {
      id: "prob-dull-blade",
      title: "Problem: chewed cut — Solution: fresh blade, light pass",
      image: "media/videos/prep/dull-blade-cut.jpg",
      module: "cutting",
      jobType: "Problems",
      visual: "Close cut on film. A dull blade chews the edge and drags adhesive.",
      narration: "Problem: ragged edge, dragged adhesive, or a scored substrate. Dull blade or too much pressure.\n\nSolution: new blade for finish cuts. Light pass, film only. Change blades when the cut starts to skip. Never ride a dull blade around a lamp or a glass gasket.",
      checklist: [
        "Fresh blade for finish cuts",
        "Light pressure — film only",
        "Change the blade when it skips",
        "Do not score paint, glass, or gaskets",
        "Bag used blades. Do not leave them on the bumper"
      ],
      quiz: {
        q: "The cut edge looks chewed. Cause?",
        correct: "Dull blade or too much pressure. Swap the blade and recut light.",
        wrong: "Not enough heat on the cut line. Torch it and cut again deeper."
      }
    },
    {
      id: "prob-tape-left",
      title: "Problem: tape still on the graphic — Solution: pull low and slow",
      image: "media/photos/gallery/trailer-spot-graphics.jpg",
      module: "post-heat",
      jobType: "Problems",
      visual: "Spot graphic under transfer tape at a hinge.",
      narration: "Problem: transfer tape left on a graphic, or yanked straight up. Lifts the print, leaves haze, or pulls an edge at the hinge.\n\nSolution: squeegee the tape down once more. Pull low and slow, 180 degrees, back over itself. If a corner lifts, stop, reseat, warm slightly, then finish the pull. Trim hinge gaps after the tape is off, not before.",
      checklist: [
        "Squeegee tape down before the pull",
        "Low and slow, 180 degrees",
        "Stop if a corner lifts — reseat, then continue",
        "Trim hinges after tape is off",
        "Bag the tape. Do not stick it to the next panel"
      ],
      quiz: {
        q: "How do you pull transfer tape off a graphic?",
        correct: "Low and slow, back over itself. Stop and reseat if an edge lifts.",
        wrong: "Snap it straight up so the adhesive breaks clean."
      }
    },
    {
      id: "prob-half-moon",
      title: "Problem: corner bunch — Solution: half-moon relief",
      image: "media/photos/gallery/demonstration-of-a-half-moon.jpg",
      module: "cutting",
      jobType: "Problems",
      visual: "Half-moon relief on architectural / wood-grain film at a corner.",
      narration: "Problem: film bunches at an inside corner or box edge. You either crease it or tear it.\n\nSolution: half-moon relief. Cut a small arc so the two faces can close without a dart. Do not cut to the visible face. Seat one face, then the other. Same idea on cabinet boxes and kiosk corners.",
      checklist: [
        "Read the corner before you commit",
        "Half-moon relief, not a stab to the face",
        "Seat one face, then the other",
        "Keep the cut off the show surface",
        "Post-check the corner in raking light"
      ],
      quiz: {
        q: "Film is bunching at an inside corner. Best cut?",
        correct: "A small half-moon relief so each face can close without a dart.",
        wrong: "A straight slice all the way to the visible face so the wrinkle falls out."
      }
    }
  ];

  d.problemLessons = DB;
  window.WRAP911_PROBLEMS = DB;

  var have = {};
  for (var i = 0; i < d.photoLessons.length; i++) have[d.photoLessons[i].id] = 1;
  for (var j = 0; j < DB.length; j++) {
    if (!have[DB[j].id]) d.photoLessons.push(DB[j]);
  }
})();
