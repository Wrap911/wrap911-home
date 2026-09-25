/* WRAP 911 Coach — live LLM via config.aiEndpoint (Cloudflare Worker proxy; no key in Pages JS).
   Offline SOP library is fallback when aiEndpoint is empty or the proxy fails.
   Optional override: localStorage wrap911_ai_endpoint. */
(function () {
  "use strict";

  var TDS_FOOTER =
    "Confirm application temp, post-heat, and film-specific steps on the film maker’s current TDS / Application Guide for that SKU.";
  var DRAFTS_KEY = "wrap911_media_drafts";
  var ENDPOINT_KEY = "wrap911_ai_endpoint";

  var CATEGORIES = ["Box Truck", "Van", "Trailer", "Storefront", "Fleet", "Prep", "QC"];
  var SUBCATEGORIES = [
    "Rivets", "Recesses", "Doors", "Panels", "Trim", "Prep", "QC",
    "Walkaround", "Layout", "Seams", "Post-Heat", "Material Prep"
  ];

  var MODULE_MAP = {
    rivet: "bt-rivet-mastery",
    rivets: "bt-rivet-mastery",
    "box truck": "bt-rivet-mastery",
    "box-truck": "bt-rivet-mastery",
    recess: "van-deep-recess",
    recesses: "van-deep-recess",
    corrugat: "van-deep-recess",
    van: "van-deep-recess",
    trailer: "tr-rivet-rows",
    "trailer rivet": "tr-rivet-rows",
    storefront: "sf-multipane",
    multipane: "sf-multipane",
    architectural: "sf-multipane",
    fleet: "fl-qc",
    qc: "fl-qc",
    walkaround: "fl-qc",
    prep: "bt-prep-cleaning",
    cleaning: "bt-prep-cleaning",
    door: "bt-rollup-door",
    doors: "bt-rollup-door",
    rollup: "bt-rollup-door",
    "roll-up": "bt-rollup-door",
    roof: "tr-roofline",
    seam: "tr-rivet-rows",
    seams: "tr-rivet-rows",
    "post-heat": "tr-rivet-rows",
    postheat: "tr-rivet-rows",
    wet: "sf-wet-install",
    "wet install": "sf-wet-install",
    dry: "sf-multipane",
    alignment: "fl-alignment",
    panel: "bt-oversized-panels",
    panels: "bt-oversized-panels",
    layout: "bt-oversized-panels",
    trim: "bt-swing-door",
    edge: "bt-swing-door",
    weather: "sf-weather",
    outdoor: "sf-weather",
    perf: "sf-perf-film",
    perforated: "sf-perf-film",
    acm: "sf-multipane",
    glass: "sf-multipane",
    bumper: "bt-swing-door",
    fascia: "bt-swing-door",
    chrome: "bt-swing-door",
    knifeless: "bt-swing-door",
    removal: "bt-prep-cleaning",
    remove: "bt-prep-cleaning",
    marine: "sf-weather",
    boat: "sf-weather",
    mirror: "bt-swing-door",
    handle: "bt-swing-door",
    stretch: "van-deep-recess",
    curve: "van-deep-recess",
    wall: "sf-multipane",
    weather: "sf-weather",
    cold: "sf-weather",
    hot: "sf-weather"
  };

  /* Structured SOP knowledge — process language only; no invented temps / stretch % / dwell / solvent recipes. */
  var SOP = [
    {
      id: "prep-clean",
      keys: ["prep", "clean", "cleaning", "dirt", "degrease", "ipa", "contaminat", "residue", "soap", "silicone", "wash"],
      topic: "Commercial prep / cleaning",
      answer:
        "Prep (commercial vehicle): wash the panel, degrease, then detail dirt traps before any film — seams, rivet bases, door bottoms, wheel-well lips, light pockets, awning rails. Work top to bottom so runoff does not re-contaminate lower paint. Finish with a two-cloth IPA wipe (wet then dry) until microfiber comes away clean. If silicone seals leave an oily feel, stop and address silicone with an appropriate remover before layout. Contaminants under wrap become lift lines and dirt nibs. Confirm cleaner compatibility with your 3M / Avery Dennison / Arlon film TDS."
    },
    {
      id: "layout",
      keys: ["layout", "hinge", "dry fit", "dry-fit", "register", "registration", "measure", "pattern", "hang panel", "stage panel"],
      topic: "Layout & panel hang",
      answer:
        "Layout: dry-fit or hinge large graphics with masking tape before committing adhesive. Mark centerlines and key landmarks (door gaps, body lines, rivet rows). Stage oversized panels from the ground when you can; two-person hang on tall sides with the ladder locked before you squeegee. Glass the main field first, then work excess toward edges and hardware. Plan seam placement for water shed on vertical overlaps. Brands: 3M · Avery Dennison · Arlon — match construction to the job substrate."
    },
    {
      id: "glass-first",
      keys: ["glass", "glassing", "flat first", "glass the", "main field", "bridge high", "high points"],
      topic: "Glass flats first",
      answer:
        "Glass flats first: lay film across high points / open flats and seat that field with overlapping felt strokes before you chase recesses, rivets, or deep steps. Bridging highs gives you a stable reference and keeps air paths open. Do not dive into channels or weld lines while the flat is still loose — that traps fingers and creates tents. Walk long air fingers to an open edge; never smash them flat into a crease."
    },
    {
      id: "rivets",
      keys: ["rivet", "rivets", "tent", "tenting", "weld", "weld line", "nugget", "articulate"],
      topic: "Rivets & weld texture (no tenting)",
      answer:
        "Rivets / weld texture: glass the flat first, then warm per the film maker’s TDS and set each head — press and purge air around the rivet. Bridging tents over rivets and weld texture; tents trap dirt and moisture and lift later. Soften, work from the flat into the seam, set individually — do not force a whole row in one stretch. Soft pad or rivet brush helps. Brands: 3M · Avery Dennison · Arlon."
    },
    {
      id: "rivet-wrinkle",
      keys: [
        "wrinkle", "crease", "pressed wrinkle", "rivet wrinkle", "locked crease", "mash",
        "pressed crease", "wrinkle on rivet", "crease on rivet", "rivet crease",
        "pressed rivet", "mash the wrinkle", "locked wrinkle"
      ],
      topic: "Pressed wrinkle / locked crease on a rivet",
      answer:
        "Pressed wrinkle on a rivet (process): a hard crease over a rivet head is usually a locked crease from bridging — film stretched across the head instead of set around it. Do not mash harder; that sets the crease and can stress or whiten the face. If adhesive will still release, lift a small area, re-lay on and around the head, purge air, and seat with a soft pad or rivet brush. Post-heat only as the film maker’s TDS / Application Guide allows for that SKU — never invent a temperature or dwell. If the film shows white stress marks, a sharp permanent crease, or stretched-thin face, stop fighting it: patch or replace that panel/section. Brands: 3M · Avery Dennison · Arlon — open the exact TDS for heat and stretch limits."
    },
    {
      id: "corrugation",
      keys: ["corrugat", "channel", "rib", "ridges", "foam roller", "tunnel"],
      topic: "Corrugation / channels",
      answer:
        "Corrugation / channels: glass across the ridges first, walk fingers out, then feed film into each recess with a foam roller or soft pad. Do not hard-squeegee tunnels flat or bridge-and-stretch across deep corrugation — pop-back and tenting follow. Keep channel paint clean before you lock film. Overlap roller strokes so air always has an escape path. Heat only as allowed by the product TDS."
    },
    {
      id: "recesses",
      keys: ["recess", "recesses", "deep recess", "pocket", "step", "compound", "inset"],
      topic: "Deep recesses",
      answer:
        "Deep recesses: bridge across high points, then feed film into the pocket with foam roller / soft pad / fingers — redistribute excess before you commit. Do not yank the film thin across a deep step. Soften only as the TDS allows; scorching to “melt it in” wrecks gloss and memory. After the recess is seated, post-heat that geometry so the film remembers the shape (still per TDS)."
    },
    {
      id: "seams",
      keys: ["seam", "seams", "overlap", "butt", "butt seam", "joint", "panel joint", "overlap seam", "panel seam", "long seam"],
      topic: "Seams",
      answer:
        "Seams: keep registration true across panels and doors. Manage overlaps per shop standard and the film TDS (direction for water shed on verticals). Avoid thin stretches at joints — redistribute before you lock. Post-heat seam edges so they stay put. On multipane or segmented commercial sides, dry-fit overlaps before you peel liner past the hinge point."
    },
    {
      id: "postheat",
      keys: ["post-heat", "post heat", "postheat", "lock", "lock-down", "memory", "heat set", "torch", "heat gun"],
      topic: "Post-heat discipline",
      answer:
        "Post-heat locks film into the new shape after the field is down — squeegee alone is not the finish line. Focus edges, rivets, corrugations, deep recesses, and seam lips with controlled heat. Never invent a target temperature or dwell time; open the exact 3M, Avery Dennison, or Arlon TDS / Application Guide for that SKU. Keep the torch or gun on a stable base when idle. After post-heat, re-check tents and edge lift before release."
    },
    {
      id: "edges-trim",
      keys: ["edge", "edges", "trim", "tuck", "cutout", "blade", "knifeless", "finish edge", "edge lift", "wrapping edge"],
      topic: "Edges & trim",
      answer:
        "Edges / trim: seat film into gaps and body lines before you cut. Cut into voids — not across finished paint without a plan. Leave a small tuck margin behind trim where the design allows; flush face-only cuts look neat until weather peels them. Fresh blades; knifeless tape where it protects paint. Post-heat folded edges so they remember the wrap. Soft tools on print faces."
    },
    {
      id: "rollup",
      keys: ["rollup", "roll-up", "roll up", "door", "doors", "swing door", "hinge", "latch", "hardware"],
      topic: "Doors (roll-up & swing)",
      answer:
        "Doors: plan reliefs at hinges, latches, and hardware. Dry-fit graphics across gaps; hinge with masking tape when needed, then commit adhesive in sections. On roll-up doors, respect panel segmentation and moving edges — do not bridge film across sections that open. Trim after film is seated. Post-heat door edges and hardware pockets. Confirm any film-over-hardware guidance on the product TDS."
    },
    {
      id: "qc",
      keys: ["qc", "inspect", "walkaround", "walk around", "quality", "release", "checklist", "photo document"],
      topic: "QC walkaround",
      answer:
        "QC walkaround: circle the vehicle (or storefront bay) in good light. Check tenting over rivets/channels, dirt nibs, silvering, edge lift, seam registration, trim quality, and door/hardware clearances. On fleets, compare alignment across units before release. Photo-document problem areas and fixes. Consistency across vehicles is the fleet deliverable — not a single heroic panel."
    },
    {
      id: "failures",
      keys: ["fail", "failure", "tenting", "lifting", "lift", "dirt nib", "nib", "solvent pop", "pop", "silvering", "bubble", "fish eye", "fisheye", "edge lift", "peel"],
      topic: "Failure modes",
      answer:
        "Common failure modes (process view): tenting = film bridged over rivets/corrugation instead of set; edge lift = dirty or dry edges, thin stretch, or skipped post-heat; dirt nibs = prep miss under adhesive; solvent pop / fish-eyes = incompatible residue or fresh paint outgas — stop and revisit prep / substrate readiness; silvering = trapped air or contamination reflecting under film. Fix root cause (prep, glass-first, set geometry, post-heat per TDS) — do not just poke holes and hope."
    },
    {
      id: "arch-multipane",
      keys: ["storefront", "multipane", "multi-pane", "multi pane", "pane", "window graphic", "bay", "mullion", "architectural", "architecture"],
      topic: "Architectural / multipane",
      answer:
        "Architectural / storefront multipane: survey lighting, mullions, and substrate before you cut. Align graphics across panes so logos and copy read continuous from the curb — dry-fit registration marks on each lite. Work one pane at a time; do not stretch a single sheet across mullions unless the design and film TDS support it. Plan cutouts and reliefs at hardware. Outdoor exposures need weather-minded edge finishing and product choice from 3M / Avery Dennison / Arlon architectural or window lines."
    },
    {
      id: "wet-dry",
      keys: ["wet", "wet install", "wet application", "dry install", "dry application", "slip", "application fluid", "soap solution"],
      topic: "Wet vs dry install (concepts)",
      answer:
        "Wet vs dry (process concepts only): dry install is the default for most vehicle cast wraps with air-egress adhesives — glass, squeegee, set geometry. Wet / slip methods appear on some glass and architectural applications where the product Application Guide calls for an application fluid so you can position large panes before seating. Do not invent fluid recipes, solvent ratios, or dwell times — use only what the film maker’s current TDS / Application Guide lists for that SKU, and confirm wet vs dry for that exact product."
    },
    {
      id: "arch-edge",
      keys: ["edge finish", "architectural edge", "window edge", "mullion edge", "gasket", "frame"],
      topic: "Architectural edge finishing",
      answer:
        "Architectural edge finishing: seat to frames, gaskets, and mullions cleanly; avoid raw cuts that sit on porous or high-touch edges. Star-cut and tuck tabs into openings on fixtures/kiosks where design requires. Outdoor glass sees wind, wash, and thermal movement — post-finish edges per the product guide and re-check adhesion after install. Fresh blades; protect adjacent paint and sealants."
    },
    {
      id: "outdoor",
      keys: ["outdoor", "weather", "exposure", "sun", "uv", "rain", "wash bay", "fleet wash"],
      topic: "Outdoor exposure",
      answer:
        "Outdoor exposure: choose film construction rated for the duty cycle (vehicle side vs storefront glass vs façade). Edge quality and post-heat discipline matter more outdoors — wind and wash attack weak edges first. Avoid tenting anywhere water can pool. Confirm outdoor / vertical / glass ratings on the 3M, Avery Dennison, or Arlon TDS for that SKU — never assume one product’s outdoor rating transfers to another."
    },
    {
      id: "substrates",
      keys: ["substrate", "substrates", "painted metal", "acm", "aluminum composite", "powder coat", "laminate", "drywall", "fixture", "glass substrate"],
      topic: "Substrates (process level)",
      answer:
        "Substrates (process level): glass — clean, inspect for sealant/silicone contamination, follow wet or dry rules from the product guide. Painted metal / commercial vehicle paint — full degrease + IPA; beware fresh paint outgas. ACM / aluminum composite — check coating type and edge condition; do not assume vehicle-wrap technique equals façade technique. Powder coat / laminate / fixtures — test adhesion in a small area and match to architectural-rated products in the 3M / Avery Dennison / Arlon lines. Always confirm film-to-substrate approval on the current TDS."
    },
    {
      id: "tooling",
      keys: ["squeegee", "roller", "finger", "air", "felt", "soft tool", "tooling", "magnet"],
      topic: "Tooling",
      answer:
        "Tooling: felt-edge on print faces, foam roller / soft pad in deep channels and corrugation. Walk fingers to an open edge — never smash air into a crease. Overlap strokes so air always escapes. Magnets and hinge tape help stage large panels. Heat tools stay on a stable base when idle."
    },
    {
      id: "temp",
      keys: ["temp", "temperature", "degree", "fahrenheit", "celsius", "°f", "°c", "how hot", "what temp", "dwell", "stretch percent", "stretch %"],
      topic: "Temperatures & numbers",
      answer:
        "Never invent install temperatures, post-heat targets, stretch percentages, dwell times, or solvent ratios. Open the exact 3M, Avery Dennison, or Arlon TDS / Application Guide for the film on the roll and follow that product’s guidance for the SKU and substrate."
    },
    {
      id: "film-choice",
      keys: ["controltac", "control tac", "ij180", "cast", "calendared", "film type", "vinyl type", "air egress", "reposition"],
      topic: "Film choice",
      answer:
        "Film choice belongs to the maker’s line (3M, Avery Dennison, Arlon). Match product to substrate and job lifespan — cast for deep compound curves and long-term vehicle graphics; calendared where geometry and duty cycle allow; architectural products for walls, glass, and fixtures when specified. Confirm air-egress / repositionability and wet/dry method from the TDS — do not assume one brand’s behavior on another’s film."
    },
    {
      id: "fleet",
      keys: ["fleet", "multi vehicle", "multi-vehicle", "unit to unit", "alignment row", "brand consistency"],
      topic: "Fleet consistency",
      answer:
        "Fleet work: lock a layout standard (heights, overlaps, door treatments) before the second unit. Align graphics unit-to-unit; photo the first as the reference. Same prep and post-heat discipline on every truck. QC walkaround each unit before release — fleets fail on inconsistency, not on one missed rivet."
    },
    {
      id: "categorize",
      keys: ["categorize", "category", "sort media", "auto-categor", "auto categor", "library draft"],
      topic: "Media categorize",
      answer:
        "Drop a clip or photo in the Media categorize panel (or pick a catalog item) and tap Auto-categorize. The local coach uses filename, title, notes, and duration heuristics — then you can save a library draft. VIDEO_CATALOG on disk is not mutated from the browser."
    },
    {
      id: "commercial-overview",
      keys: ["commercial", "box truck", "boxtruck", "vehicle wrap", "wrap a truck", "van wrap", "trailer wrap"],
      topic: "Commercial vehicle overview",
      answer:
        "Commercial vehicle flow: (1) prep/clean dirt traps, (2) layout & hinge large panels, (3) glass flats first, (4) set rivets/corrugation without tenting, (5) feed deep recesses, (6) manage seams, (7) finish edges/trim, (8) doors & hardware reliefs, (9) post-heat discipline, (10) QC walkaround. Use 3M · Avery Dennison · Arlon only. Ask the coach about any step by name."
    },
    {
      id: "getting-started",
      keys: [
        "where to start", "where do i start", "dont know where", "don't know where", "getting started",
        "beginner", "new to wrap", "how do i start", "first wrap", "i dont know", "i don't know",
        "what should i do", "start here", "overview", "basics", "help me start", "no idea"
      ],
      topic: "Getting started",
      answer:
        "Where to begin: pick the job type first — Box truck, Van, Trailer, or Storefront — then work the process in order: prep/clean → layout/hinge → glass flats → set rivets/channels → feed recesses → seams → edges/trim → doors & hardware → post-heat → QC walkaround. Tap Coach chips (Rivets, Prep, QC, Post-heat…) for focused answers, or ask about a vehicle part (bumper, door handle, recess, seam). This trainer covers commercial + architectural process with 3M · Avery Dennison · Arlon only — open the film maker’s TDS for any number (temp, dwell, stretch)."
    },
    {
      id: "bumper-fascia",
      keys: [
        "bumper", "bumpers", "fascia", "plastic bumper", "plastic part", "plastic parts",
        "tpo", "pp bumper", "flex plastic", "front bumper", "rear bumper", "bumper wrap"
      ],
      topic: "Bumper / fascia / plastic parts",
      answer:
        "Bumper / fascia / plastic: treat plastic bumpers as a different substrate than painted metal — clean thoroughly (dirt traps at vents, fog-light pockets, sensor holes, lower lips), then follow the film maker’s plastic / flexible-substrate guidance on the TDS. Glass the flatter face first; feed compound curves without yanking film thin. Plan reliefs at sensors, tow hooks, and parking aids. Soft tools on painted and textured plastic. Post-heat only as the product guide allows for that SKU on plastic — never invent a plastic-part temperature. Confirm adhesion promoters or primers only if the current TDS calls for them on that plastic."
    },
    {
      id: "vinyl-removal",
      /* Do NOT match bare "remove" / "how to remove" alone — those fire on wrinkle/rivet questions.
         Require strip / old-wrap context (prefer multi-word keys). */
      keys: [
        "strip", "stripping", "old vinyl", "old wrap", "old film",
        "take off wrap", "peel off", "decal removal", "unwrap", "remove wrap", "remove old",
        "strip vinyl", "strip film", "strip old", "removing old wrap", "removing old vinyl",
        "peel off wrap", "peel off vinyl"
      ],
      topic: "Vinyl removal / strip old film",
      answer:
        "Vinyl removal (process): warm the film gently per the remover product / film maker guidance so adhesive softens — do not scorch paint. Peel at a low angle; keep a consistent pull so adhesive stays with the film when possible. Detail residue from seams, rivet bases, door jambs, and recess bottoms before any new prep. Watch fragile edges, fresh paint, and plastic trim. After strip, full wash + degrease + IPA as a new-install prep — contaminants left from old adhesive become dirt nibs and lift under the new wrap. Confirm heat and solvent limits on the film maker’s care / removal notes and the new film’s TDS before re-wrap."
    },
    {
      id: "knifeless",
      keys: [
        "knifeless", "knife less", "knife-less", "cut line", "cutline", "cutting tape",
        "finish line tape", "bridge line", "no knife", "paint protection cut"
      ],
      topic: "Knifeless tape / cut line",
      answer:
        "Knifeless / cut-line tape: lay the filament tape on the intended finish line before or as you wrap so you cut film — not paint. Seat film over the tape, then pull the filament to sever the vinyl cleanly. Useful on bumpers, pillars, door edges, and anywhere a blade risks OEM paint. Keep the tape path smooth and registered to body lines; burnish so it does not wander. After the cut, remove waste, tuck or finish the kept edge, then post-heat the finished edge per the film TDS. Fresh blades still matter for relief cuts where knifeless does not reach."
    },
    {
      id: "chrome-delete",
      keys: [
        "chrome delete", "chrome", "window trim", "window surround", "pillar", "pillars",
        "a pillar", "b pillar", "c pillar", "beltline", "belt line", "blackout trim",
        "trim delete", "mirror cap", "chrome trim"
      ],
      topic: "Chrome delete / window trim / pillars",
      answer:
        "Chrome delete / pillars / window trim (process): clean chrome or plastic trim thoroughly — release agents and polish residue kill adhesion. Dry-fit strips; hinge long runs. Seat film to the trim face, relieve corners and ends without thin stretch, and finish edges so wash water cannot pry them. Pillars and surrounds often mix metal, plastic, and textured finishes — match film and any adhesion steps to each substrate on the product TDS (especially plastic). Soft tools; knifeless where a blade would mark adjacent paint or glass. Post-heat finished edges only as the TDS allows. This is process guidance — not a certification path."
    },
    {
      id: "post-wash-cure",
      keys: [
        "wash after", "after install", "aftercare", "after care", "when can i wash",
        "car wash", "pressure wash", "cure", "curing", "wait to wash", "wash wait",
        "care guide", "maintenance wash", "how long before wash"
      ],
      topic: "Wash / cure wait after install",
      answer:
        "Wash / cure after install: do not invent a wait time in hours or days. Follow the film maker’s care guide / Application Guide for that SKU — it sets when automated washes, pressure washing, and harsh cleaners are allowed. Until then, keep edges dry and avoid high-pressure nozzles aimed at seams, recessed channels, and tucked edges. Hand-wash guidance and approved cleaners also come from the maker’s care sheet, not shop folklore. If the customer needs a release note, quote the care guide for the film on the vehicle."
    },
    {
      id: "weather-install",
      keys: [
        "cold", "cold weather", "hot weather", "heat wave", "winter install", "summer install",
        "ambient", "shop temp", "too cold", "too hot", "weather install", "temperature outside",
        "garage cold", "freezing", "humid"
      ],
      topic: "Cold / hot weather install",
      answer:
        "Cold / hot weather install (process): bring film and substrate into the application temperature range published on the film maker’s TDS / Application Guide for that SKU — do not invent °F/°C targets. Cold substrate and cold film fight adhesion and conformability; hot panels can make adhesive grab early and trap fingers. Stage rolls and vehicle in a controlled space when you can; avoid installing over frost, condensation, or sun-baked sheet metal. Soften and post-heat only within the product guide. If conditions are outside the TDS window, pause the job rather than forcing film."
    },
    {
      id: "boat-marine",
      keys: [
        "boat", "boats", "marine", "yacht", "hull", "gunwale", "pontoon", "watercraft",
        "ship", "marine wrap", "boat wrap"
      ],
      topic: "Boat / marine (high-level)",
      answer:
        "Boat / marine (high-level only): marine duty needs film construction rated for the exposure — confirm marine / exterior suitability on the 3M, Avery Dennison, or Arlon TDS for that SKU. Expect gelcoat, fiberglass, and hardware that differ from fleet paint; prep and adhesion rules come from the maker’s guide for that substrate, not from vehicle-wrap shortcuts. Plan reliefs at fittings, rails, and through-hulls; edge finish matters where water and wash flow constantly. This coach is not a full marine course — use marine-grade product selection + the current TDS, and escalate complex hull geometry to experienced marine installers."
    },
    {
      id: "handles-mirrors",
      keys: [
        "door handle", "handles", "mirror", "mirrors", "side mirror", "mirror cap",
        "hardware relief", "relief cut", "sensor", "camera", "emblem", "badge",
        "fuel door", "gas cap", "charger port"
      ],
      topic: "Door handles / mirrors / hardware reliefs",
      answer:
        "Handles / mirrors / hardware reliefs: dry-fit and mark cut lines before you commit. Bridge or hinge around the part, seat the surrounding field, then relieve film at handles, mirror sails, cameras, emblems, and charge ports so the part operates freely — do not stretch film thin to “cover” moving hardware. Soft tools near painted faces; knifeless where it protects OEM paint. Tuck or finish edges so they are not pry points. Post-heat relieved edges per the film TDS. Confirm any wrap-over-hardware notes on the product guide."
    },
    {
      id: "compound-curves",
      keys: [
        "compound curve", "compound curves", "stretch", "stretching", "overstretch",
        "conform", "conformability", "memory", "convex", "concave", "complex curve",
        "deep draw", "stretch discipline"
      ],
      topic: "Compound curves / stretch discipline",
      answer:
        "Compound curves / stretch discipline: glass highs first, then redistribute film into the curve — heat to soften only as the TDS allows, and avoid yanking local thin spots. Over-stretch shows as gloss change, color shift on prints, and later pop-back or edge lift. Prefer multiple small feeds and roller/soft-pad work over one hard pull. Cast films are chosen for deep geometry; still stay inside the maker’s stretch and heat guidance — never invent a stretch percentage. After the shape is seated, post-heat so the film remembers the geometry (per TDS), then re-check for bridging."
    },
    {
      id: "long-box-seams",
      keys: [
        "long box", "long panel", "panel seam", "panel seams", "side seam", "horizontal seam",
        "vertical overlap", "overlap direction", "box side", "full side", "oversized panel",
        "panel join", "long seam"
      ],
      topic: "Overlaps / panel seams on long boxes",
      answer:
        "Overlaps / long-box seams: plan seam placement on the layout — prefer body lines and water-shed direction on vertical overlaps per shop standard and the film TDS. Dry-fit registration across doors and panel breaks before peeling liner past the hinge. Keep overlaps consistent in width; avoid thin stretch at the joint. Glass each panel field, set texture, then lock the seam edge and post-heat the lip. On multi-panel box sides, match height and leading-edge direction unit-wide so the fleet reads clean. Confirm overlap recommendations on the product Application Guide."
    },
    {
      id: "arch-walls",
      keys: [
        "wall wrap", "wall graphic", "interior wall", "painted wall", "painted metal wall",
        "acm wall", "facade", "façade", "cladding", "architectural wall", "office wall",
        "lobby wall", "partition", "sign band"
      ],
      topic: "Architectural wall / ACM / painted metal",
      answer:
        "Architectural walls / ACM / painted metal (beyond glass): survey substrate (painted drywall, painted metal, ACM / aluminum composite, cladding) and confirm the film is approved for that surface on the current TDS — vehicle-wrap habits do not automatically transfer. Prep: remove dust, silicone, and loose paint; follow maker cleaning notes for that substrate. Panel large graphics with registration marks; manage seams for sight lines from the entry. Edges at corners, base, and trim need clean finishes against wash and traffic. Outdoor façades need weather-rated construction and edge discipline. Test adhesion in a discreet area when the substrate is unknown."
    }
  ];

  /* Backward-compatible FAQ alias used by older references */
  var FAQ = SOP;

  function data() {
    return window.WRAP911_DATA || {};
  }

  function cfg() {
    return window.WRAP911_CONFIG || {};
  }

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getEndpoint() {
    try {
      var ls = localStorage.getItem(ENDPOINT_KEY);
      if (ls && String(ls).trim()) return String(ls).trim();
    } catch (e) {}
    var c = cfg().aiEndpoint;
    if (c && String(c).trim()) return String(c).trim();
    return "";
  }

  function scoreText(hay, keys) {
    var h = norm(hay);
    var score = 0;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!k) continue;
      if (h.indexOf(k) !== -1) {
        score += 2 + Math.min(4, k.length / 3);
        /* phrase bonus for multi-word keys */
        if (k.indexOf(" ") !== -1) score += 2;
      }
    }
    return score;
  }

  /* Light synonym expansion so shop phrasing still hits SOP keys */
  var QUERY_SYNONYMS = {
    bumper: ["bumper", "fascia", "plastic"],
    fascia: ["fascia", "bumper", "plastic"],
    /* Bare remove/removal must NOT expand to old-vinyl — that hijacked wrinkle/rivet questions.
       Vinyl-strip synonyms are added only in expandQuery when strip/old-wrap context is clear. */
    remove: ["remove", "removal"],
    removal: ["removal", "remove"],
    strip: ["strip", "stripping"],
    chrome: ["chrome", "chrome delete", "pillar", "window trim"],
    delete: ["chrome delete", "trim"],
    boat: ["boat", "marine", "hull"],
    marine: ["marine", "boat"],
    knifeless: ["knifeless", "cut line"],
    aftercare: ["wash after", "aftercare", "care guide", "cure"],
    curing: ["wash after", "cure", "care guide"],
    cold: ["cold", "cold weather", "ambient", "weather install"],
    hot: ["hot", "hot weather", "ambient", "weather install"],
    start: ["where to start", "getting started", "beginner"],
    begin: ["where to start", "getting started"],
    beginner: ["getting started", "where to start"],
    mirror: ["mirror", "handles", "hardware relief"],
    handle: ["door handle", "handles", "hardware relief"],
    stretch: ["stretch", "compound curve", "conform"],
    curve: ["compound curve", "stretch"],
    wall: ["wall wrap", "architectural wall", "acm", "painted metal"],
    acm: ["acm", "architectural wall", "painted metal", "substrate"],
    seam: ["seam", "overlap", "panel seam", "long box"],
    overlap: ["overlap", "seam", "panel seam"],
    vinyl: ["vinyl", "film", "wrap"],
    plastic: ["plastic", "bumper", "fascia"]
  };

  function expandQuery(nq) {
    var words = nq.split(" ").filter(function (w) { return w.length > 1; });
    var extra = [];
    /* Install-defect context: never expand remove/removal toward vinyl strip */
    var defectCtx =
      /\bwrinkle\b/.test(nq) || /\bcrease\b/.test(nq) || /\btent\b/.test(nq) ||
      /\brivet\b/.test(nq) || /\bbubble\b/.test(nq) || /\bfinger\b/.test(nq) ||
      /\bmash\b/.test(nq);
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (defectCtx && (w === "remove" || w === "removal")) continue;
      var syns = QUERY_SYNONYMS[w];
      if (syns) {
        for (var s = 0; s < syns.length; s++) extra.push(syns[s]);
      }
    }
    /* wash → aftercare only when query implies post-install care */
    if (
      /\bwash\b/.test(nq) &&
      (/\bafter\b/.test(nq) || /\bcure\b/.test(nq) || /\bwhen\b/.test(nq) ||
        /\bcare\b/.test(nq) || /\bpressure\b/.test(nq) || /\bwait\b/.test(nq))
    ) {
      extra.push("wash after", "aftercare", "care guide", "cure");
    }
    /* remove/strip → vinyl-removal only with explicit old-wrap / strip context (and not defect) */
    if (
      !defectCtx &&
      (/\bstrip\b/.test(nq) || /\bold vinyl\b/.test(nq) || /\bold wrap\b/.test(nq) ||
        /\bold film\b/.test(nq) || /\bpeel off\b/.test(nq) || /\bunwrap\b/.test(nq) ||
        /\bdecal removal\b/.test(nq) || /\bremove wrap\b/.test(nq) || /\bremove old\b/.test(nq))
    ) {
      extra.push("old vinyl", "old wrap", "strip", "stripping", "remove wrap");
    }
    if (!extra.length) return nq;
    return nq + " " + extra.join(" ");
  }

  function scoreQueryAgainstKeys(nq, keys) {
    var score = 0;
    var expanded = expandQuery(nq);
    var words = expanded.split(" ").filter(function (w) { return w.length > 1; });
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!k) continue;
      if (expanded.indexOf(k) !== -1 || nq.indexOf(k) !== -1) {
        score += 3 + Math.min(5, k.length / 3);
        if (k.indexOf(" ") !== -1) score += 3;
      } else {
        /* synonym / partial: key word appears as whole token */
        var keyParts = k.split(" ");
        for (var w = 0; w < words.length; w++) {
          if (k === words[w] || (k.length > 3 && words[w].indexOf(k) === 0)) {
            score += 2;
          } else if (k.length > 4 && words[w].length > 4 && (k.indexOf(words[w]) === 0 || words[w].indexOf(k) === 0)) {
            score += 1.5;
          } else if (keyParts.length > 1 && keyParts.indexOf(words[w]) !== -1 && words[w].length > 3) {
            score += 1.25;
          }
        }
      }
    }
    return score;
  }

  function searchCatalog(q) {
    var hits = [];
    var query = norm(q);
    if (!query) return hits;
    var words = query.split(" ").filter(function (w) { return w.length > 2; });
    var catalog = data().VIDEO_CATALOG || [];
    for (var i = 0; i < catalog.length; i++) {
      var v = catalog[i];
      var blob = [v.title, v.category, v.subcategory, v.note, v.id].join(" ");
      var sc = scoreText(blob, words);
      if (sc > 0) hits.push({ kind: "video", score: sc, item: v });
    }
    var lessons = data().lessons || data().trainingLessons || [];
    for (var j = 0; j < lessons.length; j++) {
      var L = lessons[j];
      var blobL = [
        L.title,
        L.id,
        L.summary,
        L.vehicleId,
        (L.steps || []).join(" "),
        (L.keyTechniques || []).join(" "),
        (L.commonMistakes || []).join(" ")
      ].join(" ");
      var scL = scoreText(blobL, words);
      if (scL > 0) hits.push({ kind: "lesson", score: scL, item: L });
    }
    var photos = data().photoLessons || [];
    for (var k = 0; k < photos.length; k++) {
      var p = photos[k];
      var blobP = [p.title, p.narration, p.visual, p.module, (p.checklist || []).join(" ")].join(" ");
      var scP = scoreText(blobP, words);
      if (scP > 0) hits.push({ kind: "photo", score: scP, item: p });
    }
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, 4);
  }

  function searchModules(q) {
    var tips = [];
    var query = norm(q);
    if (!query) return tips;
    var words = query.split(" ").filter(function (w) { return w.length > 2; });
    var modules = data().modules || [];
    for (var i = 0; i < modules.length; i++) {
      var m = modules[i];
      var lessonText = Array.isArray(m.lesson) ? m.lesson.join(" ") : String(m.lesson || "");
      var blob = [m.id, m.title, m.summary, lessonText].join(" ");
      var sc = scoreText(blob, words);
      if (sc > 0) {
        var tip = m.summary || (Array.isArray(m.lesson) && m.lesson[0]) || m.title;
        tips.push({ score: sc, title: m.title, id: m.id, tip: tip });
      }
    }
    var tl = data().trainingLessons || [];
    for (var j = 0; j < tl.length; j++) {
      var T = tl[j];
      var kt = (T.keyTechniques || []).join(" ");
      var blobT = [T.id, T.title, kt, (T.steps || []).join(" ")].join(" ");
      var scT = scoreText(blobT, words);
      if (scT > 0) {
        tips.push({
          score: scT,
          title: T.title,
          id: T.id,
          tip: (T.keyTechniques && T.keyTechniques[0]) || (T.steps && T.steps[0]) || T.title
        });
      }
    }
    tips.sort(function (a, b) { return b.score - a.score; });
    return tips.slice(0, 3);
  }

  function sopMatches(q) {
    var nq = norm(q);
    var scored = [];
    var defectCtx =
      /\bwrinkle\b/.test(nq) || /\bcrease\b/.test(nq) || /\btent\b/.test(nq) ||
      /\bbubble\b/.test(nq) || /\bfinger\b/.test(nq) || /\bmash\b/.test(nq);
    var rivetCtx = /\brivet\b/.test(nq);
    for (var i = 0; i < SOP.length; i++) {
      var sc = scoreQueryAgainstKeys(nq, SOP[i].keys);
      var id = SOP[i].id;
      /* Soften: rivet + wrinkle/crease must beat vinyl-removal */
      if (id === "rivet-wrinkle" && defectCtx) {
        sc += 8;
        if (rivetCtx) sc += 6;
      }
      if (id === "rivets" && rivetCtx && defectCtx) sc += 3;
      if (id === "vinyl-removal" && defectCtx) sc *= 0.25;
      /* Lower empty-fallback: keep any positive signal so best-effort SOP can still answer */
      if (sc >= 1) scored.push({ score: sc, entry: SOP[i] });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored;
  }

  function faqMatch(q) {
    var matches = sopMatches(q);
    if (matches.length && matches[0].score >= 1) return matches[0].entry.answer;
    return null;
  }

  function appendTds(text) {
    var t = String(text || "").trim();
    if (t.indexOf("TDS") !== -1 && t.indexOf("Application Guide") !== -1) return t;
    if (t.indexOf(TDS_FOOTER) !== -1) return t;
    return t + "\n\n" + TDS_FOOTER;
  }

  function relatedJobTypesBlurb() {
    return (
      "Related job types: Box truck · Van · Trailer · Storefront / architectural. " +
      "Rephrase with a vehicle part or step (bumper, rivets, recess, seam, post-heat, prep) or tap a Coach chip."
    );
  }

  function helpfulMiniMenu() {
    return (
      "Pick a path:\n" +
      "• Box truck — rivets, roll-up doors, long-panel seams\n" +
      "• Van — deep recesses, corrugation, sliding doors\n" +
      "• Trailer — rivet rows, roofline, seams\n" +
      "• Storefront — multipane glass, wet vs dry, walls / ACM\n" +
      "• Or ask about prep · rivets · recess · post-heat · removal · chrome delete · bumpers\n" +
      "Name the vehicle part or job type and I’ll give a process answer + TDS reminder."
    );
  }

  function answer(question) {
    var q = String(question || "").trim();
    if (!q) {
      return appendTds(helpfulMiniMenu());
    }
    var parts = [];
    var matches = sopMatches(q);
    /* Multi-topic: include top distinct SOP answers while scores stay strong */
    var used = {};
    var included = 0;
    var weakBestEffort = false;
    if (matches.length) {
      /* Never shrug if ANY SOP scored — prefer best-effort answer + TDS */
      if (matches[0].score < 3) weakBestEffort = true;
      for (var i = 0; i < matches.length && included < 3; i++) {
        var m = matches[i];
        if (included > 0 && m.score < 4) break;
        if (included > 0 && m.score < matches[0].score * 0.45) break;
        if (used[m.entry.id]) continue;
        used[m.entry.id] = true;
        var label = m.entry.topic ? m.entry.topic + ": " : "";
        parts.push(label + m.entry.answer);
        included++;
      }
      if (weakBestEffort) {
        parts.push(
          "Best-effort match from the local SOP library — if this isn’t your topic, " +
            "rephrase with the vehicle part (bumper, door, recess…) or job type."
        );
        parts.push(relatedJobTypesBlurb());
      }
    }

    var hits = searchCatalog(q);
    if (hits.length) {
      var lines = ["Related in your trainer:"];
      for (var h = 0; h < hits.length; h++) {
        var hit = hits[h];
        if (hit.kind === "video") {
          lines.push("• Video: " + hit.item.title + " (" + hit.item.category + " / " + hit.item.subcategory + ")");
        } else if (hit.kind === "lesson") {
          lines.push("• Lesson: " + hit.item.title + (hit.item.id ? " [" + hit.item.id + "]" : ""));
        } else {
          lines.push("• Photo lesson: " + hit.item.title);
        }
      }
      parts.push(lines.join("\n"));
    }

    if (!matches.length || matches[0].score < 3) {
      var modTips = searchModules(q);
      if (modTips.length) {
        var tlines = ["Module tips:"];
        for (var t = 0; t < modTips.length; t++) {
          tlines.push("• " + modTips[t].title + ": " + modTips[t].tip);
        }
        parts.push(tlines.join("\n"));
      }
    }

    if (!parts.length) {
      /* True empty only when nothing scored — helpful mini-menu, not keyword shrug */
      parts.push(helpfulMiniMenu());
    }
    parts.push("Brands in this trainer: 3M · Avery Dennison · Arlon only.");
    return appendTds(parts.join("\n\n"));
  }

  function pickModule(blob) {
    var n = norm(blob);
    var bestId = "";
    var bestLen = 0;
    for (var key in MODULE_MAP) {
      if (!Object.prototype.hasOwnProperty.call(MODULE_MAP, key)) continue;
      if (n.indexOf(key) !== -1 && key.length >= bestLen) {
        bestLen = key.length;
        bestId = MODULE_MAP[key];
      }
    }
    return bestId || "";
  }

  function inferCategory(blob, duration) {
    var n = norm(blob);
    var category = "Fleet";
    var subcategory = "Walkaround";
    var confidence = 0.45;
    var titleBits = [];
    var narration = "Heuristic sort from filename/title/notes.";

    if (/\bbox\b|\bboxtruck\b|box truck|commercial panel|rollup|swing door/.test(n)) {
      category = "Box Truck";
      confidence = 0.72;
      titleBits.push("Box truck");
    } else if (/\bvan\b|transit|promaster|sprinter|sliding door/.test(n)) {
      category = "Van";
      confidence = 0.72;
      titleBits.push("Van");
    } else if (/\btrailer\b|reefer|enclosed trailer/.test(n)) {
      category = "Trailer";
      confidence = 0.72;
      titleBits.push("Trailer");
    } else if (/\bstorefront\b|window|glass|architectural|multipane|wet install/.test(n)) {
      category = "Storefront";
      confidence = 0.7;
      titleBits.push("Storefront");
    } else if (/\bfleet\b|multi.?vehicle|alignment row|qc walk/.test(n)) {
      category = "Fleet";
      confidence = 0.68;
      titleBits.push("Fleet");
    } else if (/\bprep\b|clean|degrease|dirt trap|ipa|material prep/.test(n)) {
      category = "Prep";
      confidence = 0.7;
      titleBits.push("Prep");
    } else if (/\bqc\b|inspect|walkaround|quality/.test(n)) {
      category = "QC";
      confidence = 0.68;
      titleBits.push("QC");
    }

    if (/\brivet/.test(n)) {
      subcategory = "Rivets";
      confidence = Math.min(0.95, confidence + 0.15);
      titleBits.push("rivets");
      narration = "Rivet / weld-line cues in the name or notes.";
      if (category === "Fleet" && !/\bfleet\b|multi.?vehicle/.test(n)) {
        category = "Box Truck";
        confidence = Math.min(0.95, confidence + 0.08);
        titleBits.unshift("Box truck");
      }
    } else if (/\brecess|channel|corrugat|tunnel/.test(n)) {
      subcategory = "Recesses";
      confidence = Math.min(0.95, confidence + 0.15);
      titleBits.push("recesses");
      narration = "Recess / channel cues detected.";
    } else if (/\bdoor|rollup|hinge|swing/.test(n)) {
      subcategory = "Doors";
      confidence = Math.min(0.92, confidence + 0.12);
      titleBits.push("doors");
      narration = "Door / hinge cues detected.";
    } else if (/\btrim|edge|cutout/.test(n)) {
      subcategory = "Trim";
      confidence = Math.min(0.9, confidence + 0.1);
      titleBits.push("trim");
    } else if (/\bseam|overlap|butt/.test(n)) {
      subcategory = "Seams";
      confidence = Math.min(0.9, confidence + 0.1);
      titleBits.push("seams");
    } else if (/\bpost.?heat|postheat|torch|heat gun/.test(n)) {
      subcategory = "Post-Heat";
      confidence = Math.min(0.92, confidence + 0.12);
      titleBits.push("post-heat");
      narration = "Post-heat / torch cues — still follow TDS, no guessed temps.";
    } else if (/\bprep|clean|degrease|squeegee|controltac/.test(n)) {
      if (category === "Prep" || /\bmaterial/.test(n)) subcategory = "Material Prep";
      else subcategory = "Prep";
      confidence = Math.min(0.9, confidence + 0.1);
      titleBits.push("prep");
    } else if (/\blayout|pattern|align/.test(n)) {
      subcategory = "Layout";
      confidence = Math.min(0.88, confidence + 0.08);
    } else if (/\bqc|inspect|walkaround/.test(n)) {
      subcategory = "QC";
      confidence = Math.min(0.88, confidence + 0.08);
    } else if (/\bpanel/.test(n)) {
      subcategory = "Panels";
      confidence = Math.min(0.85, confidence + 0.08);
      titleBits.push("panels");
    } else if (/\bladder|tall|roof/.test(n)) {
      subcategory = "Panels";
      confidence = Math.min(0.82, confidence + 0.06);
      narration = "Height / ladder / roof cues — treat as panel work with safety first.";
    }

    if (/^img[_\s]?\d+/i.test(String(blob || "")) || /\bimg_\d+/i.test(n)) {
      confidence = Math.max(0.4, confidence - 0.05);
      if (!titleBits.length) titleBits.push("Phone still/clip");
      narration = (narration || "Camera roll filename.") + " IMG_ pattern — lean on keywords in the name.";
    }

    if (/\bmagenta|pink wrap|cast vinyl/.test(n)) {
      confidence = Math.min(0.95, confidence + 0.05);
      narration += " Magenta/cast-film cue (shop still).";
    }
    if (/\bcontroltac|control tac/.test(n)) {
      confidence = Math.min(0.95, confidence + 0.05);
      if (subcategory === "Walkaround") subcategory = "Material Prep";
    }
    if (/\bsqueegee|roller|foam/.test(n) && subcategory === "Walkaround") {
      subcategory = "Prep";
    }

    var dur = parseFloat(duration);
    if (!isNaN(dur) && dur > 0) {
      if (dur < 15) {
        confidence = Math.min(0.95, confidence + 0.05);
        narration += " Short clip — likely a technique close-up.";
      } else if (dur >= 15 && dur <= 90) {
        confidence = Math.min(0.95, confidence + 0.03);
        narration += " Mid-length clip — workflow segment.";
      } else if (dur > 90) {
        if (subcategory === "Walkaround" || category === "Fleet" || category === "QC") {
          subcategory = "Walkaround";
        }
        narration += " Longer clip — possible walkaround / full panel.";
      }
    }

    if (CATEGORIES.indexOf(category) === -1) category = "Fleet";
    if (SUBCATEGORIES.indexOf(subcategory) === -1) subcategory = "Walkaround";

    var title = titleBits.length
      ? titleBits.map(function (t) { return t.charAt(0).toUpperCase() + t.slice(1); }).join(" · ")
      : "Untitled media";

    var moduleId = pickModule(n + " " + category + " " + subcategory);
    if (!moduleId) {
      if (category === "Box Truck" && subcategory === "Rivets") moduleId = "bt-rivet-mastery";
      else if (category === "Van" && subcategory === "Recesses") moduleId = "van-deep-recess";
      else if (category === "Trailer") moduleId = "tr-rivet-rows";
      else if (category === "Storefront") moduleId = "sf-multipane";
      else if (category === "Fleet" || category === "QC") moduleId = "fl-qc";
      else if (category === "Prep" || subcategory === "Prep") moduleId = "bt-prep-cleaning";
    }

    return {
      category: category,
      subcategory: subcategory,
      recommendedModule: moduleId,
      title: title,
      confidence: Math.round(confidence * 100) / 100,
      narration: String(narration).trim() + " " + TDS_FOOTER,
      sourceMeta: blob
    };
  }

  function categorizeFromMeta(meta) {
    meta = meta || {};
    var blob = [meta.filename, meta.title, meta.note, meta.id, meta.category, meta.subcategory]
      .filter(Boolean)
      .join(" ");
    var suggestion = inferCategory(blob, meta.duration);
    if (meta.title && String(meta.title).trim()) {
      suggestion.title = String(meta.title).trim();
    } else if (meta.filename) {
      suggestion.title = String(meta.filename)
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[_-]+/g, " ")
        .trim() || suggestion.title;
    }
    if (meta.id) suggestion.sourceId = meta.id;
    if (meta.still) suggestion.still = meta.still;
    if (meta.src) suggestion.src = meta.src;
    if (meta.type) suggestion.type = meta.type;
    return suggestion;
  }

  function categorizeFromImageBitmap(bitmap, meta) {
    /* Optional hook: no pixel ML offline — fall back to meta heuristics. */
    void bitmap;
    return categorizeFromMeta(meta || {});
  }

  function loadDrafts() {
    try {
      var raw = localStorage.getItem(DRAFTS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveDrafts(arr) {
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(arr || []));
    } catch (e) {}
  }

  function draftToCatalog(suggestion) {
    if (!suggestion) return null;
    var drafts = loadDrafts();
    var id =
      "draft-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7);
    var entry = {
      id: id,
      title: suggestion.title || "Untitled draft",
      category: suggestion.category || "Fleet",
      subcategory: suggestion.subcategory || "Walkaround",
      type: suggestion.type || "placeholder",
      src: suggestion.src || "",
      still: suggestion.still || "",
      recommendedModule: suggestion.recommendedModule || "",
      recommendedWorkflow: suggestion.recommendedWorkflow || "",
      recommendedPractice: suggestion.recommendedPractice || "",
      note: suggestion.narration || suggestion.note || "Coach draft — review before promoting to VIDEO_CATALOG.",
      confidence: suggestion.confidence,
      draftedAt: new Date().toISOString()
    };
    drafts.unshift(entry);
    saveDrafts(drafts);
    return entry;
  }

  function draftCount() {
    return loadDrafts().length;
  }

  /* ---------- UI ---------- */
  var lastSuggestion = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureChatLog() {
    var log = $("coach-chat-log");
    if (log) return log;
    var screen = $("screen-coach") || document.querySelector(".screen.active") || document.body;
    log = document.createElement("div");
    log.className = "coach-chat";
    log.id = "coach-chat-log";
    log.setAttribute("aria-live", "polite");
    if (screen) {
      var compose = screen.querySelector(".coach-compose");
      if (compose && compose.parentNode) compose.parentNode.insertBefore(log, compose);
      else screen.appendChild(log);
    } else {
      try {
        alert("Coach chat area missing — reload the trainer page.");
      } catch (e) {}
      return null;
    }
    return log;
  }

  function appendChat(role, text) {
    var log = ensureChatLog();
    if (!log) {
      try {
        alert((role === "user" ? "You: " : "Coach: ") + String(text || ""));
      } catch (e) {}
      return;
    }
    var row = document.createElement("div");
    row.className = "coach-msg coach-msg-" + role;
    row.innerHTML =
      '<div class="coach-msg-role">' +
      (role === "user" ? "You" : "Coach") +
      "</div>" +
      '<div class="coach-msg-body">' +
      escapeHtml(text).replace(/\n/g, "<br>") +
      "</div>";
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function renderResult(s) {
    lastSuggestion = s;
    var card = $("coach-result-card");
    if (!card || !s) return;
    card.classList.remove("hidden");
    card.innerHTML =
      '<div class="card-title">' +
      escapeHtml(s.title) +
      "</div>" +
      '<div class="card-sub">' +
      escapeHtml(s.category + " · " + s.subcategory) +
      " · confidence " +
      escapeHtml(String(Math.round((s.confidence || 0) * 100))) +
      "%</div>" +
      '<p class="muted">' +
      escapeHtml(s.narration || "") +
      "</p>" +
      (s.recommendedModule
        ? '<p class="muted">Module: <code>' + escapeHtml(s.recommendedModule) + "</code></p>"
        : "") +
      '<div class="coach-result-actions">' +
      '<button type="button" id="coach-add-draft">Add to library draft</button>' +
      (s.recommendedModule
        ? '<button type="button" class="secondary" id="coach-open-module" data-open-lesson="' +
          escapeHtml(s.recommendedModule) +
          '">Open module</button>'
        : "") +
      "</div>";
    var addBtn = $("coach-add-draft");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        var entry = draftToCatalog(lastSuggestion);
        updateDraftBadge();
        appendChat(
          "coach",
          entry
            ? "Saved draft “" + entry.title + "” to localStorage (" + DRAFTS_KEY + "). VIDEO_CATALOG file unchanged."
            : "Could not save draft."
        );
      });
    }
    var openBtn = $("coach-open-module");
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        var id = openBtn.getAttribute("data-open-lesson");
        if (window.WRAP911_APP && window.WRAP911_APP.openLesson) {
          window.WRAP911_APP.openLesson(id);
        }
      });
    }
  }

  function fillCatalogSelect() {
    var sel = $("coach-catalog-pick");
    if (!sel) return;
    var items = data().VIDEO_CATALOG || [];
    var html = '<option value="">— Pick catalog item —</option>';
    for (var i = 0; i < items.length; i++) {
      var v = items[i];
      html +=
        '<option value="' +
        escapeHtml(v.id) +
        '">' +
        escapeHtml(v.title + " (" + v.category + ")") +
        "</option>";
    }
    sel.innerHTML = html;
  }

  function updateDraftBadge() {
    var n = draftCount();
    var badges = document.querySelectorAll("[data-coach-draft-badge]");
    for (var i = 0; i < badges.length; i++) {
      if (n > 0) {
        badges[i].textContent = String(n);
        badges[i].classList.remove("hidden");
      } else {
        badges[i].textContent = "";
        badges[i].classList.add("hidden");
      }
    }
  }

  /* Short client-side history for multi-turn cloud chat (not persisted) */
  var chatHistory = [];

  function pushHistory(role, content) {
    chatHistory.push({ role: role, content: String(content || "").slice(0, 6000) });
    if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);
  }

  function extractCloudText(data) {
    try {
      if (!data) return "";
      if (typeof data === "string") return data;
      if (data.reply) return String(data.reply);
      if (data.content) return String(data.content);
      var choices = data.choices;
      if (choices && choices[0]) {
        var msg = choices[0].message || choices[0].delta || choices[0];
        if (msg && msg.content) return String(msg.content);
        if (typeof choices[0].text === "string") return choices[0].text;
      }
    } catch (e) {}
    return "";
  }

  /**
   * Call OpenAI-compatible proxy at config.aiEndpoint / localStorage wrap911_ai_endpoint.
   * NEVER send an API key from the browser — the Cloudflare Worker holds the key.
   */
  function answerCloud(question) {
    var endpoint = getEndpoint();
    if (!endpoint) return Promise.resolve(null);
    var url = String(endpoint).replace(/\/$/, "");
    var messages = chatHistory
      .filter(function (m) {
        return m.role === "user" || m.role === "assistant";
      })
      .concat([{ role: "user", content: String(question || "") }]);
    /* Do not send a browser system prompt — Worker injects WRAP 911 rules */
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    }).then(function (res) {
      return res.text().then(function (raw) {
        var data = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch (e) {
          data = null;
        }
        if (!res.ok) {
          var detail =
            (data && (data.error || data.detail)) || raw.slice(0, 200) || res.status;
          var err = new Error("Cloud coach HTTP " + res.status + ": " + detail);
          err.status = res.status;
          throw err;
        }
        var text = extractCloudText(data).trim();
        if (!text) throw new Error("Cloud coach returned an empty reply");
        return appendTds(text);
      });
    });
  }

  function setThinkingRow(row, text) {
    if (!row) return;
    var body = row.querySelector(".coach-msg-body");
    if (body) body.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
    else row.textContent = text;
  }

  function sendQuestion(q) {
    try {
      q = String(q || "").trim();
      if (!q) return false;
      appendChat("user", q);
      pushHistory("user", q);

      var endpoint = getEndpoint();
      var thinkingRow = null;
      var log = ensureChatLog();
      if (endpoint && log) {
        appendChat(
          "coach",
          endpoint
            ? "Thinking… (live AI coach)"
            : "Thinking…"
        );
        thinkingRow = log.querySelector(".coach-msg-coach:last-child");
      }

      /* Prefer live cloud when endpoint is set. On cloud error/empty, keep a visible
         fallback prefix so the tech knows they are on local SOP — do not silently swap. */
      function finishLocal(reason) {
        var localReply = answer(q);
        var header = "— Local SOP fallback —";
        var prefix = reason
          ? reason + "\n\n" + header + "\n\n"
          : header + "\n\n";
        var reply = prefix + localReply;
        if (thinkingRow) setThinkingRow(thinkingRow, reply);
        else appendChat("coach", reply);
        pushHistory("assistant", localReply);
        return true;
      }

      if (!endpoint) {
        return finishLocal("");
      }

      answerCloud(q)
        .then(function (cloudReply) {
          if (!cloudReply) {
            finishLocal("Cloud coach returned nothing.");
            return;
          }
          var liveReply = "Live Grok:\n\n" + cloudReply;
          if (thinkingRow) setThinkingRow(thinkingRow, liveReply);
          else appendChat("coach", liveReply);
          pushHistory("assistant", cloudReply);
        })
        .catch(function (err) {
          var msg =
            "Live AI unreachable (" +
            (err && err.message ? err.message : String(err)) +
            "). Using local SOP library.";
          finishLocal(msg);
        });
      return true;
    } catch (err2) {
      appendChat(
        "coach",
        "Coach could not send that question. Reload the page if this keeps happening. (" +
          (err2 && err2.message ? err2.message : String(err2)) +
          ")"
      );
      return false;
    }
  }

  function runCategorize() {
    var fileInput = $("coach-file-input");
    var sel = $("coach-catalog-pick");
    var meta = {};
    if (fileInput && fileInput.files && fileInput.files[0]) {
      var f = fileInput.files[0];
      meta.filename = f.name;
      meta.title = f.name;
      meta.note = f.type || "";
      meta.duration = "";
      meta.type = (f.type || "").indexOf("video") === 0 ? "clip" : "still";
      var suggestion = categorizeFromMeta(meta);
      renderResult(suggestion);
      appendChat(
        "coach",
        "Suggested " +
          suggestion.category +
          " / " +
          suggestion.subcategory +
          " for “" +
          (meta.filename || "") +
          "” (" +
          Math.round(suggestion.confidence * 100) +
          "%). " +
          TDS_FOOTER
      );
      return;
    }
    if (sel && sel.value) {
      var items = data().VIDEO_CATALOG || [];
      var found = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === sel.value) {
          found = items[i];
          break;
        }
      }
      if (found) {
        meta = {
          id: found.id,
          filename: (found.still || found.src || found.id || "").split("/").pop(),
          title: found.title,
          note: found.note,
          category: found.category,
          subcategory: found.subcategory,
          still: found.still,
          src: found.src,
          type: found.type
        };
        var s2 = categorizeFromMeta(meta);
        /* Prefer existing catalog labels when already rich */
        if (found.category) s2.category = found.category;
        if (found.subcategory) s2.subcategory = found.subcategory;
        if (found.recommendedModule) s2.recommendedModule = found.recommendedModule;
        if (found.title) s2.title = found.title;
        s2.confidence = Math.max(s2.confidence || 0, 0.85);
        s2.narration =
          "Matched existing VIDEO_CATALOG entry. " + (found.note || "") + " " + TDS_FOOTER;
        renderResult(s2);
        appendChat(
          "coach",
          "Catalog item “" +
            found.title +
            "” → " +
            s2.category +
            " / " +
            s2.subcategory +
            (s2.recommendedModule ? " → module " + s2.recommendedModule : "") +
            "."
        );
        return;
      }
    }
    appendChat("coach", "Choose a file or a VIDEO_CATALOG item, then tap Auto-categorize.");
  }

  var COACH_GREETING =
    "Ask anything about commercial or architectural wrap installs. " +
    "When live AI is configured, answers come from the WRAP 911 cloud coach; otherwise the local SOP library answers instantly. " +
    "Tap a chip (Rivets, Prep, QC…) or name a vehicle part. Brands: 3M · Avery Dennison · Arlon only. " +
    TDS_FOOTER;

  function renderCoach() {
    fillCatalogSelect();
    updateDraftBadge();
    var log = ensureChatLog();
    if (!log) return;
    log.classList.add("coach-chat");
    log.style.minHeight = "220px";
    /* Always ensure a greeting is visible when Coach opens — never leave an empty panel */
    var hasMsg = log.querySelector(".coach-msg");
    if (!hasMsg) {
      log.setAttribute("data-ready", "1");
      appendChat("coach", COACH_GREETING);
    } else if (!log.getAttribute("data-ready")) {
      log.setAttribute("data-ready", "1");
    }
    try {
      log.scrollTop = 0;
    } catch (e) {}
  }

  function flashEmptyInput(input) {
    if (!input) return;
    var prev = input.getAttribute("placeholder") || "";
    input.setAttribute("placeholder", "Type a question first…");
    input.classList.add("coach-input-flash");
    setTimeout(function () {
      input.setAttribute("placeholder", prev || "Ask the WRAP 911 coach…");
      input.classList.remove("coach-input-flash");
    }, 900);
  }

  function bindUI() {
    var send = $("coach-send");
    var input = $("coach-input");
    if (send && input) {
      send.addEventListener("click", function () {
        var q = String(input.value || "").trim();
        if (!q) {
          flashEmptyInput(input);
          return;
        }
        var ok = sendQuestion(q);
        if (ok) input.value = "";
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          send.click();
        }
      });
    }
    var promptWrap = document.querySelector(".coach-prompts");
    if (promptWrap && !promptWrap.getAttribute("data-bound")) {
      promptWrap.setAttribute("data-bound", "1");
      promptWrap.addEventListener("click", function (ev) {
        var btn = ev.target.closest("[data-coach-prompt]");
        if (!btn) return;
        ev.preventDefault();
        var chips = promptWrap.querySelectorAll("[data-coach-prompt]");
        for (var c = 0; c < chips.length; c++) chips[c].classList.remove("active");
        btn.classList.add("active");
        var q = btn.getAttribute("data-coach-prompt");
        if (!q) return;
        if (q === "Categorize this media") {
          appendChat("user", q);
          try {
            runCategorize();
          } catch (err) {
            appendChat(
              "coach",
              "Auto-categorize failed. (" +
                (err && err.message ? err.message : String(err)) +
                ") " +
                TDS_FOOTER
            );
          }
          return;
        }
        sendQuestion(q);
      });
    }
    var autoBtn = $("coach-auto-cat");
    if (autoBtn) autoBtn.addEventListener("click", runCategorize);
    updateDraftBadge();
  }

  window.WRAP911_COACH = {
    CATEGORIES: CATEGORIES,
    SUBCATEGORIES: SUBCATEGORIES,
    TDS_FOOTER: TDS_FOOTER,
    DRAFTS_KEY: DRAFTS_KEY,
    SOP: SOP,
    FAQ: FAQ,
    sopMatches: sopMatches,
    answer: answer,
    answerCloud: answerCloud,
    categorizeFromMeta: categorizeFromMeta,
    categorizeFromImageBitmap: categorizeFromImageBitmap,
    draftToCatalog: draftToCatalog,
    getDrafts: loadDrafts,
    draftCount: draftCount,
    getEndpoint: getEndpoint,
    renderCoach: renderCoach,
    bindUI: bindUI,
    updateDraftBadge: updateDraftBadge,
    sendQuestion: sendQuestion
  };
})();
