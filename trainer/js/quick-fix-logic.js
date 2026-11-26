/* WRAP 911 — offline Quick Fix lookup (build 32).
   Local only. No checkout, no network, no temperatures, no Arlon.
   Brands named only when needed: 3M, Avery Dennison, BriteLine. Follow the film's TDS. */
(function (root) {
  var BRANDS = "3M, Avery Dennison, or BriteLine";
  var TDS = "Follow that film's TDS. Do not guess a temperature.";

  var CARDS = [
    {
      id: "bubbles",
      title: "Bubbles will not go away",
      phrases: ["bubbles won't go away", "bubbles will not go away", "air bubbles", "trapped air", "bubble under the film", "bubbles under vinyl"],
      stop: "If the bubble is full of dirt, or the film has gone pale from a stretch, stop. Pull the panel and start clean. Do not chase a dirty bubble.",
      steps: [
        "Look close. Is it air, water, or dirt? Dirt looks like a speck or a gray spot in the bubble.",
        "If it is air and the film is still fresh, work the air to the nearest open edge or to a rivet you have not seated yet, with a squeegee or a soft finger.",
        "Do not puncture a bubble on a finished face just to let air out. That cut can lift later.",
        "If the bubble is water from a wet install, give it time and keep pressure with a squeegee toward the open edge.",
        TDS
      ]
    },
    {
      id: "edge",
      title: "It will not stick by the edge",
      phrases: ["it won't stick by the edge", "it will not stick by the edge", "edge lifting", "edge won't stay down", "edge peel", "open edge", "film lifting at the edge"],
      stop: "If the edge is dirty, oily, or the film was stretched into place, do not keep heating and pressing. Clean or recut. A stretched edge will lift again.",
      steps: [
        "Clean the edge again. Soap, oil, wax, and silicone are why film will not stay down.",
        "Dry it fully. A wet edge will not bond.",
        "Lay the film onto the edge without stretching it into place. Feed slack, then squeegee out.",
        "If you already stretched it to make it reach, pull that edge back and recut or reset with slack.",
        TDS + " Post-heat only if that film's sheet calls for it, and only after the edge is seated."
      ]
    },
    {
      id: "rivets",
      title: "Film is lifting around rivets",
      phrases: ["film lifting around rivets", "rivet tents", "tents over rivets", "rivets won't sit", "bridged rivets", "film over rivet heads"],
      stop: "Do not slit or cut on a rivet head to make the film drop. That is a fail that lifts later.",
      steps: [
        "Squeegee the flat field first. Leave the rivet row relaxed. Do not stretch the film across the heads.",
        "Work each rivet head one at a time with a rivet brush or a felt-edge tool. Seat the film around the head, not over it as a tent.",
        "If the film is already tented and cold, warm it only as the film's TDS allows, then work the head again.",
        "If the film has gone pale or thinned over the head, stop and replace that area. Thin film will fail.",
        TDS
      ]
    },
    {
      id: "recess",
      title: "Wrinkles in a recess",
      phrases: ["wrinkles in a recess", "wrinkle in a pocket", "film wrinkled in the pocket", "recess wrinkles", "liftgate tuck wrinkles", "it wrinkled in the corner"],
      stop: "If the wrinkle is a hard crease or the color has changed, stop and redo that area. Do not bury a crease in the pocket.",
      steps: [
        "Glass the flat field first. Do not start in the recess.",
        "Feed slack into the pocket. Do not stretch the face to make the pocket drop in.",
        "Work the recess with soft tools, a little at a time. Keep the film relaxed on the way in.",
        "If a finger or wrinkle forms, pull the film back out of the pocket and reset with more slack.",
        TDS
      ]
    },
    {
      id: "silvering",
      title: "The film looks cloudy or silvered",
      phrases: ["silvering", "cloudy film", "haze under the film", "silver under vinyl", "it looks milky", "white haze"],
      stop: "If the haze is from a dry, dusty, or dirty panel, pulling and recleaning is better than pressing it in.",
      steps: [
        "Silvering is often trapped air or a dry bond on a textured or dirty surface.",
        "On a fresh install, firm, even squeegee pressure toward an open edge can clear light silvering.",
        "Do not flood the face with chemicals to hide it.",
        "If it is a window or a wet install, some haze is water and can clear as it dries. Dirt haze will not.",
        "Use only " + BRANDS + " films as the trainer describes, and " + TDS.toLowerCase()
      ]
    },
    {
      id: "dirt",
      title: "Dirt is under the film",
      phrases: ["dirt under the film", "grit under the vinyl", "speck under the film", "something under the wrap", "lint under the film", "hair under the vinyl"],
      stop: "A hard speck will read as a bump forever. Stop, lift that area if the film will still release, and remove the dirt. If the film has set, redo the panel.",
      steps: [
        "Do not squeegee harder to hide it. That can mash the dirt into a bigger mark.",
        "If the film is still liftable, pull back to the speck, pick it out with a clean tack or a gloved finger, and reset the film without a stretch.",
        "If you cannot reach it cleanly, pull the panel and start over on a clean surface.",
        "Next time, tack the panel, blow or wipe it off one last time, and keep the liner side clean.",
        "Clean with the method in that film's TDS."
      ]
    },
    {
      id: "overstretch",
      title: "I overstretched the film",
      phrases: ["i overstretched", "overstretched the film", "color changed", "film went pale", "film thinned out", "it changed color when I stretched"],
      stop: "Pale, shiny, or thinned film is already damaged. Do not heat it to try to bring the color back. Pull that area and replace it.",
      steps: [
        "Look at the color and gloss next to a relaxed area. If it went light or glassy, that film was stretched too far.",
        "Stop working that face. More stretch or more heat will make it worse.",
        "Pull the damaged film and recut. Feed slack instead of pulling the film to the edge.",
        "On deep recesses and corners, use relief cuts only where a lesson shows them, and keep the face relaxed.",
        TDS
      ]
    },
    {
      id: "seam",
      title: "The seam will not meet",
      phrases: ["seam gap", "seams won't meet", "seam will not meet", "overlap too big", "gap in the seam", "panel gap", "the seam opened"],
      stop: "Do not stretch a short panel to close a gap. That edge will creep back and open later.",
      steps: [
        "Measure again. A short panel needs a recut, not a stretch.",
        "If you have overlap, set a consistent overlap per the job and the film TDS. Do not leave a raw gap on a vertical seam.",
        "On a wall or a tall side, hang a plumb line and work from that. Do not trust the last panel's drifted edge.",
        "If the seam already stretched, pull it back and reset or recut.",
        TDS
      ]
    },
    {
      id: "prep",
      title: "How do I clean before I wrap",
      phrases: ["how do I clean before I wrap", "how do i clean before i wrap", "prep the panel", "won't stick after wash", "what do I clean with", "surface prep", "the film won't stick at all"],
      stop: "If the panel still feels slick or smells like wax or silicone, do not hang film yet.",
      steps: [
        "Wash first, then do a dedicated surface prep. A car-wash alone is not enough.",
        "Remove wax, oil, and silicone. Pay extra attention to edges, badges, and rubber.",
        "Wipe dry with a clean cloth. Dirt left in a seam will end up under the film.",
        "Do a last tack or wipe right before the liner comes off.",
        "Use the cleaners and wait times in that " + BRANDS + " film's TDS. Do not invent a mix."
      ]
    },
    {
      id: "tear",
      title: "The film tore at the corner",
      phrases: ["film tore at the corner", "ripped the corner", "film split at the corner", "it tore when I tucked", "cut through the corner"],
      stop: "A torn corner will wick water and lift. Do not hide the tear with a small patch on a visible face if you can recut.",
      steps: [
        "Stop pulling. More tension will run the tear.",
        "If you are still in the install and the tear is small and in a tuck, you may be able to recut that corner from slack film. Do not stretch to close it.",
        "On a visible face, pull the panel and recut. A patched corner usually shows.",
        "Use a fresh, sharp blade on the next cut. A dull blade chews and starts tears.",
        "Feed slack into corners. Do not drag the film around a sharp point."
      ]
    },
    {
      id: "redo",
      title: "When do I stop and redo",
      phrases: ["when do I stop and redo", "should I pull it off", "do I start over", "is this ruined", "can I save this panel", "when to redo"],
      stop: "If you are guessing, stop. A bad panel costs less than a callback.",
      steps: [
        "Redo if the film is pale or thinned, if dirt is trapped on a face you cannot lift cleanly, if an edge was stretched into place, or if you cut on a rivet or a visible face.",
        "You can usually keep going if the film is still relaxed, the dirt is reachable, and the wrinkle is a soft finger you can pull out.",
        "If you have already post-heated and the problem is still there, the bond is set. Pull and replace.",
        "When in doubt, pull it while the film will still release.",
        TDS
      ]
    },
    {
      id: "fingers",
      title: "Creases that will not glass out",
      phrases: ["fingers that won't glass", "crease that won't go away", "wrinkle on the face", "film fingers", "soft wrinkle", "it will not lay flat"],
      stop: "A hard, white crease is a kink in the film. Do not keep heating it on a visible face. Redo that area.",
      steps: [
        "A soft finger can often be pulled out if the film is still movable. Lift, add slack, and squeegee from the center out.",
        "Do not smash a finger flat with a hard card. That can mark the face.",
        "If it is a hard crease or the color has changed, stop and replace that area.",
        "Keep the face relaxed. Fingers come from stretch and from starting at an edge instead of the middle.",
        TDS
      ]
    },
    {
      id: "wet",
      title: "Bubbles after a wet install",
      phrases: ["water bubbles", "wet install bubbles", "window bubbles", "storefront bubbles", "wet method bubbles", "squeegee water out"],
      stop: "If the bubbles are dirty or the graphic has slipped off register, stop and reset. Do not wait those out.",
      steps: [
        "On a wet window or storefront install, some water under the film is normal at first.",
        "Squeegee from the center out, in overlapping strokes, and chase water to the open edges.",
        "Do not pierce clear window film to drain water.",
        "Give clean water time to clear. Dirt or trapped lint will not clear.",
        "Use the wet method and solutions in that " + BRANDS + " film's TDS."
      ]
    },
    {
      id: "liner",
      title: "I cannot start the panel",
      phrases: ["liner stuck", "can't start the panel", "cannot start the panel", "liner will not peel", "hinge the panel", "how do I start a big panel"],
      stop: "If you have already stretched the first edge trying to get it on, pull it off and start again.",
      steps: [
        "Hinge the panel first. Tack a straight edge or a center hinge so the graphic cannot drift.",
        "Pull the liner as you go. Do not strip a big sheet all at once unless the lesson says to.",
        "Squeegee as you pull the liner, from the hinge out.",
        "Keep the exposed adhesive off the floor and off your clothes.",
        "If the liner tears, pick it up and keep going from the same hinge. Do not lift the whole job off register."
      ]
    }
  ];

  function norm(s) {
    return String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function scoreCard(card, q) {
    var n = norm(q);
    if (!n) return 0;
    var score = 0, i, p, pn, words, w;
    for (i = 0; i < card.phrases.length; i++) {
      pn = norm(card.phrases[i]);
      if (!pn) continue;
      if (n === pn) score = Math.max(score, 100);
      else if (n.indexOf(pn) !== -1 || pn.indexOf(n) !== -1) score = Math.max(score, 80);
    }
    words = n.split(" ").filter(function (x) { return x.length > 2; });
    var hay = norm(card.title + " " + card.phrases.join(" "));
    var hits = 0;
    for (i = 0; i < words.length; i++) {
      w = words[i];
      if (hay.indexOf(w) !== -1) hits++;
    }
    if (words.length) score = Math.max(score, Math.round(50 * hits / words.length));
    return score;
  }

  function lookup(query) {
    var q = String(query || "").trim();
    var ranked = CARDS.map(function (c) { return { card: c, score: scoreCard(c, q) }; })
      .filter(function (r) { return r.score >= 25; })
      .sort(function (a, b) { return b.score - a.score; });
    return {
      query: q,
      matches: ranked.map(function (r) { return r.card; }),
      top: ranked.length ? ranked[0].card : null
    };
  }

  function allCards() { return CARDS.slice(); }

  var api = { CARDS: CARDS, lookup: lookup, allCards: allCards, norm: norm, scoreCard: scoreCard };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WRAP911_QUICK_FIX_LOGIC = api;
})(typeof window !== "undefined" ? window : globalThis);
