/* Beginner search: everyday wording, stopwords, and vehicle-aware ranking.
   Used by polish.js. Safe to require() in node tests. */
(function (root) {
  var STOP = {
    a: 1, an: 1, the: 1, to: 1, of: 1, in: 1, on: 1, at: 1, for: 1, and: 1, or: 1, but: 1,
    is: 1, it: 1, its: 1, if: 1, as: 1, be: 1, by: 1, my: 1, me: 1, we: 1, you: 1, your: 1,
    i: 1, im: 1, ive: 1, this: 1, that: 1, those: 1, these: 1, with: 1, from: 1, into: 1,
    than: 1, then: 1, just: 1, like: 1, some: 1, any: 1, all: 1, can: 1, cant: 1, cannot: 1,
    wont: 1, dont: 1, doesnt: 1, does: 1, did: 1, didnt: 1, do: 1, how: 1, what: 1, when: 1,
    where: 1, why: 1, who: 1, will: 1, would: 1, should: 1, could: 1, keep: 1, keeps: 1,
    kept: 1, go: 1, goes: 1, going: 1, away: 1, still: 1, very: 1, too: 1, not: 1, no: 1,
    never: 1, really: 1, please: 1, help: 1, stuff: 1, thing: 1, things: 1, left: 1,
    there: 1, here: 1, they: 1, them: 1, their: 1, our: 1, so: 1, up: 1, out: 1, off: 1,
    about: 1, been: 1, being: 1, was: 1, were: 1, are: 1, am: 1, have: 1, has: 1, had: 1,
    get: 1, got: 1, getting: 1, come: 1, comes: 1, coming: 1, make: 1, makes: 1, made: 1,
    also: 1, back: 1, even: 1, only: 1, over: 1, after: 1, before: 1, down: 1, more: 1,
    been: 1, let: 1, lets: 1, need: 1, needs: 1, want: 1, wants: 1, try: 1, trying: 1
  };

  var SYN = {
    bubble: ["silvering", "air"], bubbles: ["silvering", "air"], air: ["silvering", "bubble"],
    tent: ["rivet", "tenting"], tents: ["rivet", "tenting"], tenting: ["rivet", "tent"],
    lift: ["lifting", "edge"], lifting: ["lift", "edge"], peel: ["lift", "lifting"], peeling: ["lift", "lifting"],
    wrinkle: ["wrinkles", "recess", "finger"], wrinkles: ["wrinkle", "recess", "finger"], fingers: ["finger", "wrinkle"],
    wrinkling: ["wrinkle", "recess", "finger"],
    seam: ["seams", "overlap"], seams: ["seam", "overlap"], gap: ["seam", "overlap"],
    heat: ["post-heat", "tds"], postheat: ["post-heat"],
    knife: ["knifeless", "cut", "blade"], cut: ["knifeless", "relief", "trim"],
    tore: ["tear", "corner", "relief"], torn: ["tear", "corner", "relief"], tear: ["torn", "relief", "corner"],
    sticky: ["adhesive", "residue", "prep"], residue: ["adhesive", "prep"], glue: ["adhesive", "residue"],
    dirt: ["prep", "cleaning"], dirty: ["prep", "cleaning"], cleaning: ["prep", "clean"],
    ppf: ["clear", "edge"], window: ["storefront", "glass"], glass: ["storefront", "window"],
    wall: ["storefront", "interior", "architectural"],
    truck: ["box truck"], camper: ["rv"], bus: ["rv"], suv: ["fleet"],
    price: ["pricing", "calculator"], quote: ["calculator", "pricing"], estimate: ["calculator"],
    restore: ["restore purchases"], purchase: ["pricing", "restore"]
  };

  var PHRASES = [
    { re: /bubbles?|silver\s*haze|air\s+under|won'?t go away|will not go away|keeps?\s+bubbl/i, add: "silvering bubbles", topics: ["silvering"] },
    { re: /tore|torn|ripped|tearing|tear(?:s|ing)? at the (?:corner|edge)|film tore/i, add: "tear corner relief", topics: ["tear", "corner"] },
    { re: /sticky stuff|adhesive (?:left|residue)|residue|glue left|gunk left|sticky (?:goo|mess)/i, add: "adhesive residue prep", topics: ["residue", "prep"] },
    { re: /wrinkl/i, add: "wrinkle recess finger", topics: ["wrinkle", "recess"] },
    { re: /won'?t stick (?:by|at|on|to) the edge|will not stick (?:by|at|on|to) the edge|edge (?:is |keeps? )?lift|lifting at the edge|edge lift|won'?t stay (?:by|at|on) the edge/i, add: "edge lift", topics: ["edge lift"] },
    { re: /clear film|paint protection|\bppf\b|clear bra|clear wrap/i, add: "ppf edge lift", topics: ["ppf", "edge lift"] },
    { re: /rivets?[\s\w-]{0,24}trailer|trailer[\s\w-]{0,24}rivets?/i, add: "trailer rivets", vehicle: "trailer", topics: ["rivet"] },
    { re: /rivets?[\s\w-]{0,24}(?:box\s*)?truck|(?:box\s*)?truck[\s\w-]{0,24}rivets?/i, add: "rivets box truck", vehicle: "box-truck", topics: ["rivet"] },
    { re: /dirt|won'?t come off|film won'?t stick|will not stick|won'?t stick after|prep|clean(?:ing)? the panel/i, add: "prep cleaning dirt", topics: ["prep", "cleaning"] },
    { re: /silvering[\s\w-]{0,24}(?:storefront|window)|(?:storefront|window)[\s\w-]{0,24}silvering/i, add: "silvering storefront", vehicle: "storefront", topics: ["silvering"] },
    { re: /storefront|window (?:film|wrap|install)|architectural/i, add: "storefront", vehicle: "storefront" },
    { re: /where do i start|first (?:install|wrap|time)|i'?m (?:new|stuck)|i am (?:new|stuck)|never wrapped|new to wrap/i, add: "first install start prep", topics: ["prep", "start"] }
  ];

  function detectVehicle(q) {
    var s = String(q || "").toLowerCase();
    if (/\btrailers?\b|\bsemi\b/.test(s)) return "trailer";
    if (/box\s*trucks?|straight trucks?/.test(s)) return "box-truck";
    if (/\brvs?\b|motorhome|class\s*c|\bcampers?\b|\bbus(?:es)?\b/.test(s)) return "rv-bus";
    if (/storefront|architectural|\bwindows?\b|\bglass\b|\bwalls?\b/.test(s)) return "storefront";
    if (/\bvans?\b|sprinter|transit/.test(s)) return "van";
    if (/\bfleet\b/.test(s)) return "fleet";
    return "";
  }

  function unique(list) {
    var out = [], i;
    for (i = 0; i < list.length; i++) if (list[i] && out.indexOf(list[i]) < 0) out.push(list[i]);
    return out;
  }

  function analyze(q) {
    var raw = String(q || "");
    var vehicle = detectVehicle(raw);
    var topics = [];
    var extras = [];
    var i;
    for (i = 0; i < PHRASES.length; i++) {
      var p = PHRASES[i];
      if (!p.re.test(raw)) continue;
      if (p.add) extras.push(p.add);
      if (p.vehicle && !vehicle) vehicle = p.vehicle;
      if (p.vehicle) vehicle = p.vehicle;
      if (p.topics) topics = topics.concat(p.topics);
    }
    var expanded = raw + (extras.length ? " " + extras.join(" ") : "");
    var toks = tokens(expanded);
    return {
      q: raw.toLowerCase().trim(),
      expanded: expanded.toLowerCase().trim(),
      toks: toks,
      vehicle: vehicle,
      topics: unique(topics)
    };
  }

  function tokens(q) {
    var raw = String(q || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var w = raw[i].replace(/^-+|-+$/g, "");
      if (w.length < 2) continue;
      if (STOP[w]) continue;
      if (out.indexOf(w) < 0) out.push(w);
    }
    return out;
  }

  function variants(tok) {
    var v = [tok];
    if (tok.length > 3 && /s$/.test(tok)) v.push(tok.slice(0, -1));
    if (tok.indexOf("-") >= 0) v.push(tok.replace(/-/g, " "), tok.replace(/-/g, ""));
    if (tok === "postheat") v.push("post-heat");
    if (tok === "box" ) { /* skip */ }
    (SYN[tok] || []).forEach(function (s) { v.push(s); });
    return unique(v);
  }

  function tokenHit(item, tok) {
    var vs = variants(tok), hit = 0, j, w;
    var tl = item.tl || "";
    var hay = item.hay || "";
    for (j = 0; j < vs.length; j++) {
      w = vs[j];
      if (!w) continue;
      if (tl.indexOf(w) >= 0) {
        hit = Math.max(hit, (j === 0 ? 10 : 6) + (tl.indexOf(w) === 0 || tl.indexOf(" " + w) >= 0 ? 4 : 0));
      } else if (hay.indexOf(" " + w) >= 0 || hay.indexOf(" " + w.replace(/-/g, " ")) >= 0) {
        hit = Math.max(hit, j === 0 ? 3 : 2);
      } else if (w.length >= 4 && hay.indexOf(w) >= 0) {
        hit = Math.max(hit, 1);
      }
    }
    return hit;
  }

  function score(item, ctx) {
    if (!item) return 0;
    var toks = (ctx && ctx.toks) || [];
    if (!toks.length) return 0;
    var s = 0, hits = 0, miss = 0, i;
    for (i = 0; i < toks.length; i++) {
      var h = tokenHit(item, toks[i]);
      if (h) { s += h; hits++; }
      else miss++;
    }
    if (!hits) return 0;
    s -= miss;
    var ql = (ctx && ctx.q) || "";
    if (ql && (item.tl || "").indexOf(ql) >= 0) s += 25;
    var vehicle = (ctx && ctx.vehicle) || "";
    var itemVid = item.vehicleId || "";
    if (vehicle) {
      if (itemVid === vehicle) s += 28;
      else if (itemVid && itemVid !== vehicle) s -= 16;
    }
    var topics = (ctx && ctx.topics) || [];
    for (i = 0; i < topics.length; i++) {
      var t = topics[i];
      if (!t) continue;
      if ((item.tl || "").indexOf(t) >= 0) s += 16;
      else if ((item.hay || "").indexOf(t) >= 0) s += 6;
    }
    if (item.type === "lesson") s += 6;
    if (item.type === "module") s += 4;
    if (item.type === "term") s += 5;
    if (item.type === "tool" || item.type === "job") s += 3;
    if (item.type === "mistake") {
      s -= 6;
      if (vehicle && itemVid && itemVid !== vehicle) s -= 16;
    }
    return s;
  }

  function search(items, q) {
    var ctx = analyze(q);
    var hits = [];
    if (!ctx.toks.length) return { ctx: ctx, hits: hits };
    for (var i = 0; i < items.length; i++) {
      var s = score(items[i], ctx);
      if (s) hits.push({ item: items[i], s: s });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    return { ctx: ctx, hits: hits };
  }

  var api = {
    STOP: STOP,
    SYN: SYN,
    tokens: tokens,
    variants: variants,
    analyze: analyze,
    score: score,
    search: search,
    detectVehicle: detectVehicle
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WRAP911_SEARCH_LOGIC = api;
})(typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : this));
