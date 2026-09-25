/* WRAP 911 — full system spec data (vehicles, lessons, workflows, practice, badges, VIDEO_CATALOG) */
(function () {
  if (!window.WRAP911_DATA) window.WRAP911_DATA = {};
window.WRAP911_DATA.vehicles = [
  {
    "id": "box-truck",
    "title": "Box Truck",
    "icon": "🚛",
    "summary": "Rivet fields, oversized panels, roll-up and swing doors."
  },
  {
    "id": "van",
    "title": "Van",
    "icon": "🚐",
    "summary": "Deep recesses, sliding doors, roof safety, rear hinges."
  },
  {
    "id": "trailer",
    "title": "Trailer",
    "icon": "🚚",
    "summary": "Rivet rows, roofline, door hinges, panel segmentation."
  },
  {
    "id": "storefront",
    "title": "Storefront/Architectural",
    "icon": "🏪",
    "summary": "Wet install, architectural panels, multi-pane, interior wraps."
  },
  {
    "id": "rv-bus",
    "title": "RV/Bus",
    "icon": "🚌",
    "summary": "Tall sides, awnings, ladders, large-panel hang."
  },
  {
    "id": "fleet",
    "title": "Fleet",
    "icon": "🅿️",
    "summary": "Pickups, SUVs, multi-vehicle alignment & QC."
  }
];
window.WRAP911_DATA.certLevels = [
  {
    "id": "l1",
    "title": "L1 Installer Basics",
    "note": "Internal WRAP 911 shop level only — not a brand certification."
  },
  {
    "id": "l2",
    "title": "L2 Commercial Installer",
    "note": "Internal WRAP 911 shop level only — not a brand certification."
  },
  {
    "id": "l3",
    "title": "L3 Fleet Specialist",
    "note": "Internal WRAP 911 shop level only — not a brand certification."
  }
];
window.WRAP911_DATA.brands = [
  "3M",
  "Avery Dennison",
  "Arlon"
];
window.WRAP911_DATA.trainingLessons = [
  {
    "id": "bt-rivet-mastery",
    "vehicleId": "box-truck",
    "title": "Rivet Mastery",
    "badgeId": "badge-bt-rivet",
    "media": "media/videos/trailer/magenta-rivet-field-tented-heads.jpg",
    "mediaType": "photo",
    "practiceId": "prac-rivet",
    "keyTechniques": [
      "Identify rivet/weld lines before final commitment",
      "Warm film per product TDS — never invent a temperature",
      "Set each rivet individually: press and purge air around the head",
      "Work from the flat into the seam; do not force a whole row in one stretch"
    ],
    "tools": [
      "Felt/soft squeegee",
      "Foam pad or rivet brush",
      "Heat gun or torch (stable base)",
      "Knifeless tape / fresh blades",
      "IPA & microfiber"
    ],
    "commonMistakes": [
      "Leaving film bridged over rivets (tents that lift)",
      "Scorching film with held heat instead of following TDS",
      "Stretching the entire rivet field in one heroic pull"
    ],
    "steps": [
      "Prep and mark rivet rows; confirm film is 3M, Avery Dennison, or Arlon cast suitable for commercial sides.",
      "Glass the flat field first; leave rivet lines staged, not crushed.",
      "Soften film per the exact product TDS, then set rivets one by one.",
      "Post-heat edges and rivets so the film remembers the shape.",
      "QC: walk the row for tents, silvering, and dirty bases."
    ],
    "quiz": [
      {
        "q": "Why articulate film around each rivet instead of bridging?",
        "choices": [
          "Bridging tents over rivet heads, trapping air and raising lift risk.",
          "Bridging uses less film and hides the rivet completely.",
          "Rivets never need attention on box trucks."
        ],
        "answer": 0
      },
      {
        "q": "What heat guidance should you follow for rivet work?",
        "choices": [
          "Always 250F for every brand.",
          "Follow the film maker's TDS for the exact 3M, Avery Dennison, or Arlon product.",
          "Hold the torch until the film looks melted and glossy."
        ],
        "answer": 1
      },
      {
        "q": "Correct rivet-setting approach?",
        "choices": [
          "Stretch the whole row once, then ignore individual heads.",
          "Warm, press, and purge air around each rivet head individually.",
          "Pierce every rivet with the knife so air escapes through holes."
        ],
        "answer": 1
      }
    ],
    "relatedVideoId": "v-mid-6788"
  },
  {
    "id": "bt-oversized-panels",
    "vehicleId": "box-truck",
    "title": "Oversized Panel Handling",
    "badgeId": "badge-bt-panels",
    "media": "media/videos/rv-bus/rv-side-hang-3m-controltac.jpg",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Stage/hinge large panels from the ground when possible",
      "Two-person hang on tall sides; ladder stable before squeegee",
      "Glass the main field, then work excess to edges",
      "Plan seams for water shed on vertical overlaps"
    ],
    "tools": [
      "Extension ladder (locked)",
      "Hingemate / masking tape",
      "Magnet holders",
      "Wide soft squeegee",
      "Second installer"
    ],
    "commonMistakes": [
      "Climbing while wrestling a full loose sheet",
      "Overreaching instead of moving the ladder",
      "Crooked horizontal registration on tall graphics"
    ],
    "steps": [
      "Measure and dry-fit; mark hinge line.",
      "Stage panel with hinge tape; clear floor of liner.",
      "Climb only to squeegee — platform first.",
      "Glass field, manage fingers laterally, set overlaps for water shed.",
      "QC level lines from a distance before committing recesses."
    ],
    "quiz": [
      {
        "q": "Safest way to handle a full-height box-side panel?",
        "choices": [
          "Stage/hinge the panel, keep ladder stable, avoid climbing while wrestling loose film.",
          "Stand on the top cap to stretch the seam in one pass.",
          "Climb with the full panel in both hands to save a trip."
        ],
        "answer": 0
      },
      {
        "q": "When do you glass the main field on an oversized panel?",
        "choices": [
          "After all recesses and rivets are finished.",
          "First — secure the main plane, then feed edges and hardware.",
          "Never — only wet-install oversized panels."
        ],
        "answer": 1
      },
      {
        "q": "Vertical panel overlaps should generally shed water which way?",
        "choices": [
          "Upper panel over lower (water sheds down).",
          "Lower over upper so wind cannot lift.",
          "Overlaps are optional on box trucks."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-8959"
  },
  {
    "id": "bt-rollup-door",
    "vehicleId": "rv-bus",
    "title": "Class C RV Panel Walkaround",
    "badgeId": "badge-bt-rollup",
    "media": "media/videos/rv-bus/class-c-rv-stripe-walkaround-ford-e-350.jpg",
    "mediaType": "photo",
    "practiceId": "prac-seam",
    "keyTechniques": [
      "Walk the finished Class C for panel continuity and stripe registration",
      "Check over-cab, hood, and fender transitions for lift or silvering",
      "Confirm door/hinge cycles before release",
      "Photo QC against shop standard — follow film TDS for any rework heat"
    ],
    "tools": [
      "Soft squeegee",
      "Tucking tool",
      "Fresh 30-degree blades",
      "Heat per TDS",
      "IPA"
    ],
    "commonMistakes": [
      "Calling architectural cubby trim an RV rear",
      "Skipping distance QC on tall Class C sides",
      "Inventing post-heat temps instead of reading TDS"
    ],
    "steps": [
      "Park Class C with safe egress.",
      "Walk front → side → rear for stripe/panel continuity.",
      "Cycle doors; check edges at trim.",
      "Document QC photos for the ticket.",
      "Note any rework per TDS only."
    ],
    "quiz": [
      {
        "q": "At a recessed license-plate area, what should you do?",
        "choices": [
          "Bridge, then feed and tuck with controlled tension (heat only as the film requires).",
          "Stretch drum-tight so plate bolts pierce for alignment.",
          "Leave a permanent bridge for airflow."
        ],
        "answer": 0
      },
      {
        "q": "When should you trim roll-up door film?",
        "choices": [
          "Before any squeegee work.",
          "After the film is seated — not before.",
          "Only after post-heat melts the edge."
        ],
        "answer": 1
      },
      {
        "q": "Why cycle the roll-up door during QC?",
        "choices": [
          "To check for pinch, binding, and edge peel at seals.",
          "To stretch the vinyl tighter.",
          "Doors never need a cycle check."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-1039"
  },
  {
    "id": "bt-swing-door",
    "vehicleId": "box-truck",
    "title": "Swing Door Workflow",
    "badgeId": "badge-bt-swing",
    "media": "media/videos/box-truck/blue-panel-hang-ford-e-450-cab-door.jpg",
    "mediaType": "photo",
    "practiceId": "prac-seam",
    "keyTechniques": [
      "Map hinges and latch before layout",
      "Keep graphic continuous across paired doors when design requires",
      "Cut hinge lines intentionally — don't tear at knuckles",
      "Post-heat edges that see slam cycles"
    ],
    "tools": [
      "Hinge marks / tape",
      "Knifeless or sharp blade",
      "Soft squeegee",
      "Heat per TDS"
    ],
    "commonMistakes": [
      "Wrapping through hinges without planned cuts",
      "Misaligned left/right door graphics",
      "Skipping edge lock on latch side"
    ],
    "steps": [
      "Open doors; clean hinge barrels and latch faces.",
      "Dry-fit for graphic continuity across both doors.",
      "Install field, then cut and tuck at hinge line.",
      "Feed recesses; heat-set edges per TDS.",
      "Slam-cycle QC both doors."
    ],
    "quiz": [
      {
        "q": "Before committing swing-door film, what should you map?",
        "choices": [
          "Hinges, latch, and whether graphics must read across both doors.",
          "Only the tire brand.",
          "Nothing — swing doors are always solid color."
        ],
        "answer": 0
      },
      {
        "q": "Best approach at hinge knuckles?",
        "choices": [
          "Planned cut and tuck — do not tear film through the hinge.",
          "Stretch film continuously through the hinge forever.",
          "Glue hinge shut so it never moves."
        ],
        "answer": 0
      },
      {
        "q": "Why post-heat swing-door edges?",
        "choices": [
          "Slam cycles stress edges — lock film per TDS to reduce peel.",
          "To change the pantone of the print.",
          "Post-heat is never used on doors."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-5342"
  },
  {
    "id": "bt-prep-cleaning",
    "vehicleId": "rv-bus",
    "title": "Prep stack — magenta base & grey overlay peel",
    "badgeId": "badge-bt-prep",
    "media": "media/videos/prep/grey-overlay-peel-magenta-base-stack.jpg",
    "mediaType": "photo",
    "practiceId": "prac-recess",
    "keyTechniques": [
      "Degrease top-to-bottom; chase dirt traps at rivets and hardware",
      "Two-cloth 70% IPA finish until wipe is clean",
      "Hunt silicone near seals and prior graphics",
      "Do not lay film on wet or oily residue"
    ],
    "tools": [
      "Degreaser approved for paint",
      "70% IPA",
      "Microfiber (wet + dry)",
      "Detail brushes",
      "Plastic razors if needed"
    ],
    "commonMistakes": [
      "Skipping rivet bases and bracket traps",
      "Laying film over awning/seal runoff streaks",
      "Using oily glide products under adhesive"
    ],
    "steps": [
      "Wash/degrease commercial sides and rear.",
      "Detail rivets, channels, door seals, plate pocket.",
      "IPA two-cloth finish; resolve silicone if wipe beads.",
      "Dry fully; then layout.",
      "Spot-check with clean microfiber before hang."
    ],
    "quiz": [
      {
        "q": "Most immediate risk from runoff streaks under hardware?",
        "choices": [
          "Residue that blocks adhesive bond on 3M / Avery Dennison / Arlon film.",
          "Proof paint needs a 30-day outgas wait.",
          "You must switch to calendared film only."
        ],
        "answer": 0
      },
      {
        "q": "Preferred final wipe?",
        "choices": [
          "Two-cloth 70% IPA: wet then dry until clean.",
          "Dish soap left to air-dry.",
          "Light WD-40 for squeegee glide."
        ],
        "answer": 0
      },
      {
        "q": "When may you apply film?",
        "choices": [
          "When surface is dry and residue-free.",
          "While IPA is still pooling.",
          "Over visible silicone streaks if you heat harder."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-7694"
  },
  {
    "id": "van-deep-recess",
    "vehicleId": "van",
    "title": "Deep Recess / Liftgate Tuck",
    "badgeId": "badge-van-recess",
    "media": "media/videos/van/white-liftgate-recess-tuck.jpg",
    "mediaType": "photo",
    "practiceId": "prac-recess",
    "keyTechniques": [
      "Hang the liftgate field before committing the plate recess",
      "Feed film into the license-plate / deep recess — don't leave a permanent bridge",
      "Use soft tools and controlled tension at the pocket",
      "Heat only to pliable per product TDS"
    ],
    "tools": [
      "Foam roller",
      "Padded applicator",
      "Heat gun/torch (TDS)",
      "Soft squeegee"
    ],
    "commonMistakes": [
      "Stretching drum-tight across the plate pocket",
      "Trimming before the recess is seated",
      "Using trailer rivet stills to teach van liftgate recesses"
    ],
    "steps": [
      "Clean liftgate and plate recess.",
      "Hang/glass main rear field.",
      "Feed and tuck the deep recess.",
      "Trim into voids; heat-set per TDS.",
      "Cycle liftgate for QC."
    ],
    "quiz": [
      {
        "q": "Correct next move with bridged film over deep channels?",
        "choices": [
          "Feed into each recess with foam roller/soft pad, air escaping.",
          "Heat until vinyl melts into the channel.",
          "Hard-squeegee tunnels flat in one center stroke."
        ],
        "answer": 0
      },
      {
        "q": "Why avoid bridge-and-stretch across deep corrugations?",
        "choices": [
          "Film recovers later leading to pop-back and lift.",
          "It uses too much heat gun fuel.",
          "Corrugations never need film contact."
        ],
        "answer": 0
      },
      {
        "q": "Heat rule for recesses?",
        "choices": [
          "Follow TDS for the exact film; soften, don't melt.",
          "Always max torch until shiny-melted.",
          "Never use heat on vans."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-0020"
  },
  {
    "id": "van-sliding-door",
    "vehicleId": "van",
    "title": "Sliding Door Alignment",
    "badgeId": "badge-van-slide",
    "media": "media/videos/fleet/fleet-van-seam-tuck.jpg",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Keep horizontal bands continuous from fixed panel to slider",
      "Account for door travel gap and seals",
      "Glass flat, redistribute fingers — don't crush print",
      "Cycle door before final edge lock"
    ],
    "tools": [
      "Level / sight line",
      "Hinge tape",
      "Soft squeegee",
      "Knifeless tape"
    ],
    "commonMistakes": [
      "Crooked pattern across slider gap",
      "Film binding in track or weatherstrip",
      "Hard-squeegeeing printed wrinkles into creases"
    ],
    "steps": [
      "Mark horizontal reference across body and door.",
      "Dry-fit graphic; confirm band level with door closed and open.",
      "Install field; manage gap and seal cuts.",
      "Cycle slider; adjust before post-heat.",
      "QC alignment from 10+ feet."
    ],
    "quiz": [
      {
        "q": "Why check horizontal bands across fixed panel and slider?",
        "choices": [
          "Printed graphics broadcast every misalignment across the gap.",
          "Bands only matter on storefronts.",
          "Sliders never get patterned film."
        ],
        "answer": 0
      },
      {
        "q": "How to handle large fingers on patterned film?",
        "choices": [
          "Lift and redistribute tension, then squeegee.",
          "Smash wrinkles flat immediately.",
          "Shrink bottles smaller with aggressive torch heat."
        ],
        "answer": 0
      },
      {
        "q": "When should you cycle the sliding door?",
        "choices": [
          "Before final edge lock / post-heat.",
          "Never — cycling damages adhesive.",
          "Only after the customer drives away."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-697405"
  },
  {
    "id": "van-roof-safety",
    "vehicleId": "rv-bus",
    "title": "RV/Bus Roof & Ladder Safety",
    "badgeId": "badge-van-roof",
    "media": "media/videos/rv-bus/rv-side-panel-hang-roofline-view.jpg",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Stable platform / locked ladder; three points of contact",
      "Clear liner from foot zone",
      "Stage panels from ground when possible",
      "Coordinate around bay traffic"
    ],
    "tools": [
      "Locked ladder or scaffold",
      "Harness per shop policy",
      "Magnets/tape",
      "Second person"
    ],
    "commonMistakes": [
      "Top-cap standing",
      "Climbing with full loose sheet",
      "Ignoring forklift/bay movement"
    ],
    "steps": [
      "Set platform on level ground; clear scraps.",
      "Stage film; climb only to install.",
      "Glass roof flats; feed channels with soft tools.",
      "Keep heat tool base stable at height.",
      "QC footing and film before teardown."
    ],
    "quiz": [
      {
        "q": "On roof-height work, what comes first?",
        "choices": [
          "Stable platform and clear foot zone — then film craft.",
          "Maximum heat before climbing.",
          "Standing on the A-frame top cap."
        ],
        "answer": 0
      },
      {
        "q": "How should large roof panels be handled?",
        "choices": [
          "Stage/hinge from ground; don't climb wrestling loose film.",
          "Carry full panel up the ladder alone every time.",
          "Throw film onto roof and climb after."
        ],
        "answer": 0
      },
      {
        "q": "Where does idle torch/heat gun sit?",
        "choices": [
          "Stable base, clear of liner scraps.",
          "On its side on the roof panel.",
          "Hanging from a ladder rung by the hose."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-8956"
  },
  {
    "id": "van-rear-hinge",
    "vehicleId": "van",
    "title": "Rear Hinge Mapping",
    "badgeId": "badge-van-hinge",
    "media": "media/videos/van/d-pillar-taillight-mid-install.jpg",
    "mediaType": "photo",
    "practiceId": "prac-seam",
    "keyTechniques": [
      "Dry-fit / hinge complex graphics before full liner peel",
      "Map hinge knuckles and light pockets",
      "Relief cuts early to release bunching",
      "Post-heat edges that see door slam"
    ],
    "tools": [
      "Masking/hinge tape",
      "Fresh blades",
      "Tucking tool",
      "Heat per TDS"
    ],
    "commonMistakes": [
      "Full liner peel before registration confirmed",
      "Cutting after film tears at hinge",
      "Skipping post-heat on hinge-side edges"
    ],
    "steps": [
      "Hinge dry-fit rear doors; confirm registration.",
      "Peel liner in sections; squeegee field.",
      "Cut/tuck hinge line intentionally.",
      "Feed light/plate recesses.",
      "Post-heat and slam-cycle QC."
    ],
    "quiz": [
      {
        "q": "When should you hinge/dry-fit a complex rear graphic?",
        "choices": [
          "Before full liner removal, to confirm registration.",
          "Never — always peel full liner first.",
          "Only after post-heat has locked the film."
        ],
        "answer": 0
      },
      {
        "q": "Why map hinges before cutting?",
        "choices": [
          "So cuts land in knuckles intentionally instead of tearing.",
          "Hinges never affect vinyl.",
          "Mapping replaces the need for IPA prep."
        ],
        "answer": 0
      },
      {
        "q": "After the field is down on hinged doors, why post-heat?",
        "choices": [
          "Helps film stay seated on edges/rivets through slam cycles.",
          "Only to change print color.",
          "Post-heat replaces squeegee work."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-3886"
  },
  {
    "id": "sf-wet-install",
    "vehicleId": "storefront",
    "title": "Wet Soft-Seat Recess",
    "badgeId": "badge-sf-wet",
    "media": "media/videos/architectural/gloss-recess-glass-out-yellow-squeegee.jpg",
    "mediaType": "photo",
    "practiceId": "prac-recess",
    "keyTechniques": [
      "Mist application fluid per the exact film TDS \u2014 don't invent a mix",
      "Soft-seat magenta film into the architectural recess/cubby with a felt squeegee",
      "Chase fluid and air to open edges; don't trap puddles in corners",
      "This is fixture/cubby wet seating \u2014 not storefront glass or silicone removal"
    ],
    "tools": [
      "Application fluid / spray bottle",
      "Felt/soft squeegee",
      "Lint-free towels",
      "Detail brush",
      "Fresh blades for later trim"
    ],
    "commonMistakes": [
      "Writing glass/silicone steps onto a wood cubby photo",
      "Too little fluid causes snags; trapped excess causes corner bubbles",
      "Hard-carding wet film into a crease before soft-seating"
    ],
    "steps": [
      "Clean the recess/cubby substrate; wipe dry.",
      "Mist application fluid per film TDS.",
      "Stage and soft-seat the panel into the recess.",
      "Squeegee fluid out on overlapping strokes toward open edges.",
      "QC for trapped grit, corner puddles, and edge lift."
    ],
    "quiz": [
      {
        "q": "What does this wet soft-seat recess lesson actually cover?",
        "choices": [
          "Application-fluid soft-seat into an architectural cubby/recess \u2014 not storefront glass.",
          "Silicone removal from plate glass only.",
          "Outdoor wind staging for tall curtainwall."
        ],
        "answer": 0
      },
      {
        "q": "Squeegee goal on a wet recess seat?",
        "choices": [
          "Evacuate fluid/air to open edges so adhesive can bond per TDS.",
          "Leave standing fluid in every corner overnight.",
          "Never squeegee wet architectural seats."
        ],
        "answer": 0
      },
      {
        "q": "Where do wet-apply limits come from?",
        "choices": [
          "The exact film's TDS (3M, Avery Dennison, or Arlon).",
          "A memorized shop myth temperature.",
          "Social media comments."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-7696"
  },
  {
    "id": "sf-perf-film",
    "vehicleId": "storefront",
    "title": "Architectural Panel Hang",
    "badgeId": "badge-sf-perf",
    "media": "media/videos/architectural/architectural-brick-film-stainless-panel-hang.jpg",
    "mediaType": "photo",
    "practiceId": "prac-seam",
    "keyTechniques": [
      "Stage large architectural sheets; peel liner in controlled sections",
      "Register brick/pattern lines across panel seams before glassing",
      "Glass the field, then seat corners and returns with soft tools",
      "Knife-trim edges into reveals — never invent stretch percentages"
    ],
    "tools": [
      "Soft squeegee",
      "Application fluid if TDS allows",
      "Sharp blades",
      "Straightedge / magnets"
    ],
    "commonMistakes": [
      "Letting pattern drift across adjacent panels",
      "Bridging sharp returns instead of seating",
      "Trimming before the field is glassed"
    ],
    "steps": [
      "Survey panel layout and pattern direction.",
      "Clean substrate; stage sheet.",
      "Hang and glass main field.",
      "Seat corners/returns; knife-trim to reveal.",
      "QC pattern continuity and edge adhesion."
    ],
    "quiz": [
      {
        "q": "Why register brick/pattern lines before final glassing?",
        "choices": [
          "So seams and repeats stay continuous across panels",
          "Because heat sets the pattern permanently on contact",
          "Pattern never matters on architectural film"
        ],
        "answer": 0
      },
      {
        "q": "When should you knife-trim architectural edges?",
        "choices": [
          "After the field is seated/glassed into the reveal",
          "While the liner is still fully on",
          "Only after overnight cure regardless of TDS"
        ],
        "answer": 0
      },
      {
        "q": "Best practice for sharp architectural returns?",
        "choices": [
          "Seat film into the return with soft tools — don't leave a bridge",
          "Stretch drum-tight across the corner in one pull",
          "Skip returns; only wrap flat faces"
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-1876"
  },
  {
    "id": "sf-multipane",
    "vehicleId": "storefront",
    "title": "Cubby / Recess Registration",
    "badgeId": "badge-sf-multipane",
    "media": "media/videos/architectural/cubbies-compare-magenta-vs-white-liners.jpg",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Compare adjacent cubby bays for liner color and edge consistency",
      "Register floor-to-wall returns bay-to-bay before final lock",
      "Measure each recess \u2014 don't assume identical openings",
      "Step-back QC for continuity across the fixture run"
    ],
    "tools": [
      "Tape measure",
      "Straightedge / level",
      "Low-tack tape",
      "Soft squeegee"
    ],
    "commonMistakes": [
      "Calling cubbies storefront panes or mullions",
      "Assuming every bay is the same width/depth",
      "Skipping bay-to-bay edge and color compare"
    ],
    "steps": [
      "Survey every cubby/recess opening; note differences.",
      "Mark shared baselines on returns and floors.",
      "Install bay-by-bay to registration marks.",
      "Trim edges consistently; keep reveals even.",
      "Step-back QC across the fixture \u2014 not sidewalk pane claims."
    ],
    "quiz": [
      {
        "q": "Why measure each cubby/recess individually?",
        "choices": [
          "Bay sizes often differ \u2014 assumptions skew registration.",
          "All fixture cubbies are always identical.",
          "Measuring replaces cleaning."
        ],
        "answer": 0
      },
      {
        "q": "Best QC for multi-bay cubby lining?",
        "choices": [
          "Step-back compare of liner color, returns, and edge trim across bays.",
          "Only nose-to-vinyl inspection of one bay.",
          "No QC needed on architectural fixtures."
        ],
        "answer": 0
      },
      {
        "q": "What should this lesson NOT claim?",
        "choices": [
          "That the photo shows storefront window panes and mullions.",
          "That bay-to-bay registration matters.",
          "That returns should match across adjacent cubbies."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-7701"
  },
  {
    "id": "sf-weather",
    "vehicleId": "storefront",
    "title": "Corner Trim / Edge Finish",
    "badgeId": "badge-sf-weather",
    "media": "media/videos/architectural/hand-seat-corner-knife-trim.jpg",
    "mediaType": "photo",
    "practiceId": "prac-recess",
    "keyTechniques": [
      "Hand-seat film fully into the interior corner before any knife work",
      "Knife-trim in the crease; remove curled scrap cleanly",
      "Fresh blades \u2014 dull blades tear magenta film at corners",
      "Follow product TDS for any post-trim heat lock \u2014 never invent temps"
    ],
    "tools": [
      "Fresh snap-off blades",
      "Soft squeegee / hand pressure",
      "TDS sheet",
      "Scrap bin"
    ],
    "commonMistakes": [
      "Trimming before the corner is seated",
      "Writing outdoor weather/cold-glass copy onto a knife-trim photo",
      "Dragging a dull blade that chews the edge"
    ],
    "steps": [
      "Confirm the corner is fully seated by hand/squeegee.",
      "Snap a fresh blade; cut in the crease away from your body.",
      "Remove the curled scrap; inspect for jagged edge.",
      "Touch up seat; heat-lock only per TDS if required.",
      "QC the corner from multiple angles under shop light."
    ],
    "quiz": [
      {
        "q": "What does this corner-trim lesson teach?",
        "choices": [
          "Seat the corner, then knife-trim the crease for a clean edge finish.",
          "How ambient wind changes wet-out on tall glass.",
          "Cold-glass temperature windows from a weather app."
        ],
        "answer": 0
      },
      {
        "q": "When do you knife-trim the interior corner?",
        "choices": [
          "After the film is fully seated into the corner.",
          "While the liner is still fully on.",
          "Before any seating so the scrap falls free."
        ],
        "answer": 0
      },
      {
        "q": "Heat after corner trim?",
        "choices": [
          "Only if the film TDS calls for edge lock \u2014 never invent a temperature.",
          "Always max torch until the corner glosses.",
          "Heat replaces the need for a sharp blade."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-7699"
  },
  {
    "id": "tr-rivet-rows",
    "vehicleId": "trailer",
    "title": "Trailer Rivet Rows",
    "badgeId": "badge-tr-rivets",
    "media": "media/videos/trailer/magenta-trailer-rivet-row-channel-detail.jpg",
    "mediaType": "photo",
    "practiceId": "prac-rivet",
    "keyTechniques": [
      "Hinge dry-fit graphics across riveted panels",
      "Squeegee field, then post-heat/set each rivet",
      "Keep torch off film until alignment is done",
      "Clear liner piles before post-heat passes"
    ],
    "tools": [
      "Hinge tape",
      "Soft squeegee",
      "Heat per TDS",
      "Rivet brush/pad"
    ],
    "commonMistakes": [
      "Scorching transfer tape while still aligning",
      "Skipping post-heat on rivet fields",
      "Bridging entire rivet rows"
    ],
    "steps": [
      "Dry-fit/hinge graphic to existing art.",
      "Peel in sections; squeegee thoroughly.",
      "Remove tape; post-heat and set rivets.",
      "Walk rows for tents.",
      "Final edge QC."
    ],
    "quiz": [
      {
        "q": "After squeegeeing over trailer rivet rows, why post-heat?",
        "choices": [
          "Helps film conform and stay seated around rivets, reducing tenting.",
          "Only to change pantone color.",
          "Post-heat replaces all squeegee work."
        ],
        "answer": 0
      },
      {
        "q": "When is hinge/dry-fit used on trailer graphics?",
        "choices": [
          "Before full liner removal to confirm registration.",
          "After melting the film in place.",
          "Never on trailers."
        ],
        "answer": 0
      },
      {
        "q": "Torch use while transfer tape is still aligning?",
        "choices": [
          "Keep heat off until alignment is done.",
          "Max heat to shrink tape into rivets.",
          "Torch replaces hinge tape."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-6789"
  },
  {
    "id": "tr-roofline",
    "vehicleId": "trailer",
    "title": "Trailer Tall-Side Roofline",
    "badgeId": "badge-tr-roof",
    "media": "",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Establish a straight roofline reference before hang",
      "Ladder/platform safety on tall trailers",
      "Keep upper seams intentional for water shed",
      "Don't overreach along the eave"
    ],
    "tools": [
      "Level/chalk",
      "Locked ladder",
      "Magnets",
      "Soft squeegee"
    ],
    "commonMistakes": [
      "Drooping top edge along a long trailer",
      "Unsafe ladder stretch",
      "Seams that catch water at the roofline"
    ],
    "steps": [
      "Mark roofline reference.",
      "Stage panels safely.",
      "Hang to the line; glass upper field.",
      "Set overlaps to shed water.",
      "Distance QC of the top edge."
    ],
    "quiz": [
      {
        "q": "Why mark a roofline reference on long trailers?",
        "choices": [
          "Prevents drooping/crooked top edges across long runs.",
          "Rooflines are always laser-perfect from the factory.",
          "Marks replace rivet setting."
        ],
        "answer": 0
      },
      {
        "q": "Tall trailer sides require...",
        "choices": [
          "Locked ladder/platform and no overreaching.",
          "Standing on the top cap.",
          "No safety gear ever."
        ],
        "answer": 0
      },
      {
        "q": "Upper seam planning?",
        "choices": [
          "Orient overlaps to shed water.",
          "Orient to catch water for cleaning.",
          "Seams don't matter on trailers."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-8971"
  },
  {
    "id": "tr-door-hinge",
    "vehicleId": "trailer",
    "title": "Door Hinge Cutting",
    "badgeId": "badge-tr-hinge",
    "media": "media/videos/trailer/orange-side-door-recess-ladder-trim.jpg",
    "mediaType": "photo",
    "practiceId": "prac-seam",
    "keyTechniques": [
      "Seat film before cutting",
      "Cut into hinge voids; fresh blade",
      "Leave tuck margin where trim allows",
      "Heat-set cuts per TDS"
    ],
    "tools": [
      "30-degree blades",
      "Tucking tool",
      "Knifeless tape option",
      "Heat per TDS"
    ],
    "commonMistakes": [
      "Scoring paint across hinge faces",
      "Flush-short cuts that expose substrate after shrink",
      "Cutting before film is seated"
    ],
    "steps": [
      "Seat film into hinge area.",
      "Cut into void with sharp blade.",
      "Tuck margin; avoid paint scores.",
      "Heat-set per TDS.",
      "Cycle door QC."
    ],
    "quiz": [
      {
        "q": "Why seat film before hinge cutting?",
        "choices": [
          "So the cut follows the real void and tension is controlled.",
          "Seating is optional on trailers.",
          "Cutting first always looks cleaner."
        ],
        "answer": 0
      },
      {
        "q": "Why leave a small tuck margin when trim allows?",
        "choices": [
          "Hide edge, cover substrate, reduce lift.",
          "So vinyl can expand wildly without cracking.",
          "Margins are only for storefront glass."
        ],
        "answer": 0
      },
      {
        "q": "Blade discipline at hinges?",
        "choices": [
          "Fresh blade; cut into void — not across unprotected paint.",
          "Dull blade so it cannot cut paint.",
          "Always cut toward your body for control."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-8974"
  },
  {
    "id": "tr-panel-seg",
    "vehicleId": "trailer",
    "title": "Panel Segmentation",
    "badgeId": "badge-tr-seg",
    "media": "",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Break long trailers into manageable panel segments",
      "Match print continuity across segment seams",
      "Plan seams on natural breaks when design allows",
      "QC alignment after each segment before next hang"
    ],
    "tools": [
      "Tape measure",
      "Registration marks",
      "Hinge tape",
      "Soft squeegee"
    ],
    "commonMistakes": [
      "Trying one impossible full-length sheet",
      "Seams that cut through critical logos",
      "Skipping mid-job alignment checks"
    ],
    "steps": [
      "Plan segment map on paper/photos.",
      "Hang first segment; lock registration.",
      "Overlap/butt per design; keep continuity.",
      "Repeat with QC between segments.",
      "Final walk-around alignment."
    ],
    "quiz": [
      {
        "q": "Why segment long trailer graphics?",
        "choices": [
          "Manageable handling, better registration, safer installs.",
          "Segmentation is only for glass.",
          "One sheet is always easier on 53-foot trailers."
        ],
        "answer": 0
      },
      {
        "q": "When should you QC alignment on segmented jobs?",
        "choices": [
          "After each segment before hanging the next.",
          "Only after the truck leaves.",
          "Never — printers guarantee alignment."
        ],
        "answer": 0
      },
      {
        "q": "Seam placement preference when design allows?",
        "choices": [
          "On natural body breaks / less critical art areas.",
          "Directly through the middle of every logo.",
          "Randomly for artistic effect."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-6795"
  },
  {
    "id": "fl-alignment",
    "vehicleId": "fleet",
    "title": "Fleet Alignment Rules",
    "badgeId": "badge-fl-align",
    "media": "media/videos/fleet/dusty-rose-gmc-rear-quarter-hang.jpg",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Same reference heights across every vehicle in the fleet",
      "Photo documentation of first unit as the standard",
      "Measure from fixed OEM points, not eyeball",
      "Keep brand marks (3M / Avery Dennison / Arlon) consistent per spec"
    ],
    "tools": [
      "Master measurement sheet",
      "Level",
      "Camera",
      "Shared marks kit"
    ],
    "commonMistakes": [
      "Each installer inventing their own height",
      "No photo standard from unit #1",
      "Mixing film brands mid-fleet without approval"
    ],
    "steps": [
      "Build a fleet measurement card from unit #1.",
      "Photograph standard views.",
      "Apply same references on every unit.",
      "Audit alignment before release.",
      "Log deviations."
    ],
    "quiz": [
      {
        "q": "What should define logo height across a fleet?",
        "choices": [
          "A shared measurement card from fixed OEM points.",
          "Each tech's personal preference.",
          "Whatever fits the leftover scrap."
        ],
        "answer": 0
      },
      {
        "q": "Why photograph the first finished unit?",
        "choices": [
          "It becomes the visual standard for the rest of the fleet.",
          "Photos replace measurements.",
          "Only for social media."
        ],
        "answer": 0
      },
      {
        "q": "Brand consistency on fleet jobs?",
        "choices": [
          "Stay on the specified 3M, Avery Dennison, or Arlon product.",
          "Mix any vinyl to use up scraps.",
          "Brand doesn't matter for fleets."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-3880"
  },
  {
    "id": "fl-multi-vehicle",
    "vehicleId": "fleet",
    "title": "Multi-Vehicle Workflow",
    "badgeId": "badge-fl-multi",
    "media": "",
    "mediaType": "photo",
    "practiceId": "prac-panel-align",
    "keyTechniques": [
      "Batch prep, install, QC when shop flow allows",
      "Stagger crews so one vehicle isn't starved of tools",
      "Label panels by unit number",
      "Keep TDS sheets for the film lot on the cart"
    ],
    "tools": [
      "Unit labels",
      "Shared tool cart",
      "Job tickets",
      "Progress board"
    ],
    "commonMistakes": [
      "Panels mixed between units",
      "No TDS on the floor for the film lot",
      "Finishing unit 5 before QC on unit 1"
    ],
    "steps": [
      "Intake and label every vehicle/panel kit.",
      "Prep bay sequence.",
      "Install to fleet standard.",
      "QC and photo each unit.",
      "Release only after checklist sign-off."
    ],
    "quiz": [
      {
        "q": "Why label panels by unit number?",
        "choices": [
          "Prevents mixing kits across vehicles.",
          "Labels replace cleaning.",
          "Only needed for storefronts."
        ],
        "answer": 0
      },
      {
        "q": "Smart fleet shop flow?",
        "choices": [
          "Batch prep/install/QC with clear unit tickets.",
          "Ignore order and grab random vans.",
          "Skip QC until the whole fleet is wrapped."
        ],
        "answer": 0
      },
      {
        "q": "TDS on a multi-vehicle job?",
        "choices": [
          "Keep the correct product TDS with the film lot on the cart.",
          "Invent one temperature for all lots.",
          "TDS is only for architectural walls."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-1871"
  },
  {
    "id": "fl-qc",
    "vehicleId": "fleet",
    "title": "Fleet Quality Control",
    "badgeId": "badge-fl-qc",
    "media": "media/videos/fleet/jolly-time-news-van-fleet-side-qc.jpg",
    "mediaType": "photo",
    "practiceId": "prac-rivet",
    "keyTechniques": [
      "Same QC checklist on every unit",
      "Distance view + close rivet/edge inspection",
      "Door cycle checks",
      "Photo archive before release"
    ],
    "tools": [
      "QC checklist",
      "Camera",
      "Microfiber",
      "Notebook/job app"
    ],
    "commonMistakes": [
      "Different standards per installer",
      "Releasing without door cycle",
      "No photo record for callbacks"
    ],
    "steps": [
      "Run shared QC checklist.",
      "Fix defects before next unit.",
      "Photograph standards views.",
      "Get lead sign-off.",
      "Archive with job ticket."
    ],
    "quiz": [
      {
        "q": "Fleet QC should be...",
        "choices": [
          "The same checklist on every unit.",
          "Optional for experienced techs.",
          "Different rules per installer for creativity."
        ],
        "answer": 0
      },
      {
        "q": "Why archive photos before release?",
        "choices": [
          "Documents standard and protects against callback disputes.",
          "Photos weaken adhesive.",
          "Only marketing needs photos."
        ],
        "answer": 0
      },
      {
        "q": "Door cycle on fleet units?",
        "choices": [
          "Required QC for swing/slide/roll doors.",
          "Never cycle doors after wrap.",
          "Only on storefront glass."
        ],
        "answer": 0
      }
    ],
    "relatedVideoId": "v-mid-8752"
  }
];
window.WRAP911_DATA.workflowSteps = {
  "box-truck": [
    {
      "id": "btw-prep",
      "title": "Prep & Cleaning",
      "type": "Prep",
      "media": "media/videos/prep/magenta-strip-prep-alcohol-wipe-ready.jpg",
      "instructions": "Degrease box sides and rear top-to-bottom. Detail rivets, channels, door seals, and plate pocket. Finish with two-cloth 70% IPA. Do not hang film on residue or wet surfaces.",
      "tools": [
        "Degreaser",
        "IPA",
        "Microfiber",
        "Detail brushes"
      ],
      "safety": [
        "Keep ladder clear of wet floors",
        "PPE for cleaners per label"
      ],
      "technique": "Chase dirt traps at every rivet base and hardware edge before any 3M / Avery Dennison / Arlon film goes down.",
      "mistakes": [
        "Skipping rivet bases",
        "Wrapping over awning/seal runoff"
      ]
    },
    {
      "id": "btw-measure",
      "title": "Panel Measurement",
      "type": "Layout",
      "media": "media/videos/box-truck/panel-measurement-3134-in.jpg",
      "instructions": "Measure panel heights/widths, note rivet rows and door type. Mark hinge lines and seam plan for water shed. Confirm roll width (54 or 60) vs panel.",
      "tools": [
        "Tape",
        "Notepad",
        "Level",
        "Hinge tape"
      ],
      "safety": [
        "Three points of contact if measuring high"
      ],
      "technique": "Write measurements on the job ticket; don't trust memory on oversized sides.",
      "mistakes": [
        "Assuming factory sides are square",
        "No seam plan"
      ]
    },
    {
      "id": "btw-side",
      "title": "Side Panel Install",
      "type": "Install",
      "media": "media/videos/box-truck/blue-panel-hang-ford-e-450-cab-door.jpg",
      "instructions": "Stage/hinge oversized panel. Glass main field. Walk fingers out. Set vertical overlaps to shed water. Keep horizontal graphics level.",
      "tools": [
        "Soft squeegee",
        "Magnets",
        "Ladder",
        "Second installer"
      ],
      "safety": [
        "Stage from ground; don't climb wrestling loose film",
        "Clear liner under ladder"
      ],
      "technique": "Platform first, then glass, then edges — never reverse that order on tall sides.",
      "mistakes": [
        "Overreaching",
        "Crooked band lines"
      ]
    },
    {
      "id": "btw-rivets",
      "title": "Rivet Row Install",
      "type": "Heat",
      "media": "media/videos/trailer/magenta-rivet-field-tented-heads.jpg",
      "instructions": "Soften per product TDS. Set each rivet: press and purge air. Work flat into seam. Soft tools around texture.",
      "tools": [
        "Heat gun/torch",
        "Foam pad",
        "Soft squeegee"
      ],
      "safety": [
        "Torch on stable base when idle",
        "Liner away from flame"
      ],
      "technique": "Follow TDS — never invent temperatures. Individual rivets beat one heroic stretch.",
      "mistakes": [
        "Bridging rivet rows",
        "Held heat scorching film"
      ]
    },
    {
      "id": "btw-rear",
      "title": "Rear Door Workflow",
      "type": "Cut",
      "media": "media/videos/van/white-liftgate-recess-tuck.jpg",
      "instructions": "Glass rear field. Feed plate recess and channels. Planned cuts at roll-up slats or swing hinges. Trim after seating.",
      "tools": [
        "Tucking tool",
        "Fresh blades",
        "Soft squeegee"
      ],
      "safety": [
        "Cut into voids",
        "Watch door springs/struts"
      ],
      "technique": "Bridge then feed recesses; cycle door before final lock.",
      "mistakes": [
        "Drum-tight stretch over plate pocket",
        "Trim before seat"
      ]
    },
    {
      "id": "btw-qc",
      "title": "Post-Heat & QC",
      "type": "Post-Heat",
      "media": "media/videos/fleet/jolly-time-news-van-fleet-side-qc.jpg",
      "instructions": "Post-heat edges and rivets per TDS. Walk for tents/silvering. Door cycle. Photo for job ticket.",
      "tools": [
        "Heat tool",
        "Checklist",
        "Camera"
      ],
      "safety": [
        "Clear scraps before heat pass"
      ],
      "technique": "Post-heat is memory and adhesion — not color change or melting.",
      "mistakes": [
        "Skipping rivet lock-down",
        "No door cycle"
      ]
    }
  ],
  "van": [
    {
      "id": "vw-recess",
      "title": "Deep Recess Heating",
      "type": "Heat",
      "media": "media/videos/van/white-liftgate-recess-tuck.jpg",
      "instructions": "Glass ridges first. Foam-roll channels. Heat only to pliable per TDS. Feed, don't bridge-and-stretch.",
      "tools": [
        "Foam roller",
        "Heat tool",
        "Soft pad"
      ],
      "safety": [
        "Stable heat base",
        "Ventilation"
      ],
      "technique": "Soft tools win in corrugations — hard center strokes crease and trap air.",
      "mistakes": [
        "Melting film into channels",
        "Hard squeegee down tunnel centers"
      ]
    },
    {
      "id": "vw-slide",
      "title": "Sliding Door Alignment",
      "type": "Layout",
      "media": "media/videos/fleet/fleet-van-seam-tuck.jpg",
      "instructions": "Mark horizontal references across body and slider. Dry-fit. Install; manage seals. Cycle before final lock.",
      "tools": [
        "Level",
        "Hinge tape",
        "Knifeless"
      ],
      "safety": [
        "Keep hands clear of track pinch points"
      ],
      "technique": "Pattern continuity across the gap sells the wrap — measure twice.",
      "mistakes": [
        "Binding in weatherstrip",
        "Crooked bands"
      ]
    },
    {
      "id": "vw-roof",
      "title": "Roof Wrap Safety",
      "type": "Prep",
      "media": "media/videos/rv-bus/rv-side-panel-hang-roofline-view.jpg",
      "instructions": "Set locked platform. Clear liner. Stage film from ground. Install with soft tools in channels.",
      "tools": [
        "Ladder/scaffold",
        "Magnets",
        "Second person"
      ],
      "safety": [
        "Three points of contact",
        "No top-cap standing",
        "Bay traffic awareness"
      ],
      "technique": "Height work fails first on footing, then on technique.",
      "mistakes": [
        "Climbing with full loose sheet",
        "Ignoring bay traffic"
      ]
    },
    {
      "id": "vw-hinge",
      "title": "Rear Hinge Workflow",
      "type": "Cut",
      "media": "media/videos/van/d-pillar-taillight-mid-install.jpg",
      "instructions": "Hinge dry-fit. Peel in sections. Cut/tuck hinge line. Post-heat edges. Slam-cycle QC.",
      "tools": [
        "Hinge tape",
        "Blades",
        "Heat per TDS"
      ],
      "safety": [
        "Fresh blades; cut into voids"
      ],
      "technique": "Confirm registration before full liner peel.",
      "mistakes": [
        "Full peel before dry-fit",
        "Tearing through knuckles"
      ]
    }
  ],
  "storefront": [
    {
      "id": "sw-wet",
      "title": "Wet Soft-Seat Recess",
      "type": "Prep",
      "media": "media/videos/architectural/gloss-recess-glass-out-yellow-squeegee.jpg",
      "instructions": "Clean the architectural recess/cubby. Mist application fluid per film TDS. Stage the magenta panel, soft-seat into the recess with a felt squeegee, and chase fluid/air to open edges. No glass or silicone claims \u2014 this is fixture/cubby wet seating.",
      "tools": [
        "Application fluid",
        "Felt/soft squeegee",
        "Towels",
        "Detail brush"
      ],
      "safety": [
        "Wet floor slip awareness",
        "Keep blades clear while seating"
      ],
      "technique": "Wet soft-seat buys slide time in deep recesses \u2014 evacuate fluid before the adhesive grabs.",
      "mistakes": [
        "Claiming glass/silicone prep on a wood cubby job",
        "Trapping fluid in the recess corner"
      ]
    },
    {
      "id": "sw-pane",
      "title": "Cubby / Recess Registration",
      "type": "Layout",
      "media": "media/videos/architectural/cubbies-compare-magenta-vs-white-liners.jpg",
      "instructions": "Compare adjacent cubby/recess bays for liner color, edge trim, and registration. Match returns and floor-to-wall seams bay-to-bay. Step-back QC for continuity \u2014 this is fixture lining, not storefront window panes.",
      "tools": [
        "Tape measure",
        "Straightedge",
        "Soft squeegee",
        "Low-tack tape"
      ],
      "safety": [
        "Watch blade tips near plywood edges"
      ],
      "technique": "Bay-to-bay registration sells the install \u2014 measure returns, don't assume identical cubbies.",
      "mistakes": [
        "Calling cubbies window panes/mullions",
        "Skipping bay-to-bay edge compare"
      ]
    },
    {
      "id": "sw-perf",
      "title": "Architectural Panel Hang",
      "type": "Install",
      "media": "media/videos/architectural/architectural-brick-film-stainless-panel-hang.jpg",
      "instructions": "Stage architectural sheet. Register pattern across panels. Glass field then seat returns. Trim to reveal.",
      "tools": [
        "Soft squeegee",
        "Blades",
        "Straightedge"
      ],
      "safety": [
        "Blade away from body"
      ],
      "technique": "Pattern continuity and soft seating beat forced stretch on architectural panels.",
      "mistakes": [
        "Pattern drift across panels",
        "Trimming before the field is seated"
      ]
    },
    {
      "id": "sw-weather",
      "title": "Corner Trim / Edge Finish",
      "type": "Cut",
      "media": "media/videos/architectural/hand-seat-corner-knife-trim.jpg",
      "instructions": "Hand-seat film into the interior corner, then knife-trim the crease clean. Remove curled scrap. Lock the edge per film TDS. This is corner/edge finish craft \u2014 not ambient weather or outdoor glass conditions.",
      "tools": [
        "Fresh blades",
        "Soft squeegee / hand pressure",
        "TDS sheet"
      ],
      "safety": [
        "Cut away from hands; snap blades often"
      ],
      "technique": "Seat first, trim second \u2014 a clean corner cut only works after the film is fully seated.",
      "mistakes": [
        "Trimming before the corner is seated",
        "Inventing weather/TDS excuses for a knife-trim lesson"
      ]
    }
  ],
  "trailer": [
    {
      "id": "tw-rivets",
      "title": "Rivet Row Workflow",
      "type": "Heat",
      "media": "media/videos/trailer/magenta-rivet-field-tented-heads.jpg",
      "instructions": "Hinge dry-fit. Squeegee field. Post-heat and set rivets individually per TDS.",
      "tools": [
        "Hinge tape",
        "Heat",
        "Soft tools"
      ],
      "safety": [
        "Torch stable; clear liner"
      ],
      "technique": "Alignment first, heat second.",
      "mistakes": [
        "Heating through transfer tape while aligning"
      ]
    },
    {
      "id": "tw-roof",
      "title": "Roofline Alignment",
      "type": "Layout",
      "media": "",
      "instructions": "Mark roofline reference. Hang upper edge true. Plan water-shed seams. Distance QC.",
      "tools": [
        "Level",
        "Ladder",
        "Magnets"
      ],
      "safety": [
        "Locked ladder; no overreach"
      ],
      "technique": "Long trailers expose every droop — use a reference line.",
      "mistakes": [
        "Eyeballing a 20-foot top edge"
      ]
    },
    {
      "id": "tw-hinge",
      "title": "Door Hinge Workflow",
      "type": "Cut",
      "media": "media/videos/trailer/orange-side-door-recess-ladder-trim.jpg",
      "instructions": "Seat film. Cut into hinge void. Tuck margin. Heat-set per TDS. Cycle door.",
      "tools": [
        "Blades",
        "Tuck tool",
        "Heat"
      ],
      "safety": [
        "Cut into voids, not across paint"
      ],
      "technique": "Seat before cut — always.",
      "mistakes": [
        "Flush-short edges that open after shrink"
      ]
    },
    {
      "id": "tw-seg",
      "title": "Panel Segmentation",
      "type": "Install",
      "media": "",
      "instructions": "Map segments. Hang and QC each before the next. Maintain print continuity.",
      "tools": [
        "Segment map",
        "Registration marks"
      ],
      "safety": [
        "Manage large sheets with two people"
      ],
      "technique": "Segment long jobs for control and safety.",
      "mistakes": [
        "One impossible full-length sheet"
      ]
    }
  ],

  "rv-bus": [
    {
      "id": "rw-prep",
      "title": "IPA wipe & strip staging",
      "media": "media/videos/prep/magenta-strip-prep-alcohol-wipe-ready.jpg",
      "steps": [
        "Clear dust/oil from the next face under shop light",
        "Stage magenta strip, felt squeegee, and liner path",
        "Two-cloth 70% IPA wipe until clean and dry",
        "Soft-seat the strip; chase air to open edges"
      ]
    },
    {
      "id": "rw-ladder",
      "title": "Height & ladder safety",
      "media": "media/videos/rv-bus/rv-side-panel-hang-roofline-view.jpg",
      "steps": [
        "Level locked ladder; three points of contact",
        "Stage or hinge large panels from the ground when possible",
        "Keep liner scraps off ladder feet",
        "Move the ladder — do not overreach"
      ]
    },
    {
      "id": "rw-side",
      "title": "Tall side hang",
      "media": "media/videos/rv-bus/rv-side-panel-hang-roofline-view.jpg",
      "steps": [
        "Glass the large print field before recesses",
        "Manage vertical seam overlaps for water shed",
        "Feed channels and awning interfaces without bridging",
        "QC from ground and ladder for tents and dirt nibs"
      ]
    },
    {
      "id": "rw-rear",
      "title": "Rear panel & recesses",
      "media": "media/videos/rv-bus/class-c-rv-stripe-walkaround-ford-e-350.jpg",
      "steps": [
        "Glass the main rear field first",
        "Feed plate pocket and side channels",
        "Plan relief cuts before corners tear",
        "Stage heat tools safely; clear floor scraps"
      ]
    }
  ],

  "fleet": [
    {
      "id": "fw-brand",
      "title": "Brand Alignment",
      "type": "Layout",
      "media": "media/videos/fleet/dusty-rose-gmc-rear-quarter-hang.jpg",
      "instructions": "Build measurement card from unit #1. Same OEM reference points on every vehicle. Photo the standard.",
      "tools": [
        "Measurement card",
        "Camera",
        "Level"
      ],
      "safety": [
        "Standard shop safety per unit"
      ],
      "technique": "Fleet looks expensive when every unit matches — measure, don't eyeball.",
      "mistakes": [
        "Each tech inventing logo height"
      ]
    },
    {
      "id": "fw-multi",
      "title": "Multi-Vehicle Workflow",
      "type": "Install",
      "media": "",
      "instructions": "Label kits by unit. Batch prep/install when possible. Keep film-lot TDS on the cart.",
      "tools": [
        "Labels",
        "Tickets",
        "Tool cart"
      ],
      "safety": [
        "Don't block egress with staged vehicles"
      ],
      "technique": "Process discipline beats hero installs on fleets.",
      "mistakes": [
        "Mixed panels between units"
      ]
    },
    {
      "id": "fw-qc",
      "title": "Fleet QC",
      "type": "QC",
      "media": "media/videos/fleet/jolly-time-news-van-fleet-side-qc.jpg",
      "instructions": "Same checklist every unit. Distance + close inspection. Door cycles. Photo archive + lead sign-off.",
      "tools": [
        "Checklist",
        "Camera"
      ],
      "safety": [
        "Chock wheels if needed during door cycles"
      ],
      "technique": "Release only after shared QC — not vibes.",
      "mistakes": [
        "Skipping photos",
        "Inconsistent standards"
      ]
    }
  ]
};
window.WRAP911_DATA.practiceScenarios = [
  {
    "id": "prac-rivet",
    "title": "Rivet Practice",
    "icon": "🔩",
    "media": "media/videos/trailer/magenta-rivet-field-tented-heads.jpg",
    "panelDesc": "Virtual panel: commercial side with a vertical weld/rivet seam and horizontal step. Film is glassed on the flat but tented over the rivet line.",
    "skills": [
      "Identify tents",
      "TDS heat discipline",
      "Individual rivet set"
    ],
    "checklist": [
      "Confirm film brand is 3M, Avery Dennison, or Arlon specified for the job",
      "Note bridged rivets before crushing anything",
      "Warm per TDS (no invented temperatures)",
      "Press and purge air at each rivet head",
      "Re-check for remaining tents"
    ],
    "mistakes": [
      {
        "id": "m1",
        "label": "Leave rivets bridged",
        "bad": true
      },
      {
        "id": "m2",
        "label": "Set each rivet after TDS warm-up",
        "bad": false
      },
      {
        "id": "m3",
        "label": "Melt film until glossy-wet",
        "bad": true
      },
      {
        "id": "m4",
        "label": "Stretch entire row in one pull",
        "bad": true
      }
    ],
    "quiz": [
      {
        "q": "Best action on tented rivets?",
        "choices": [
          "Warm per TDS, then set each rivet individually.",
          "Leave bridged to hide the weld.",
          "Pierce every rivet with a knife."
        ],
        "answer": 0
      },
      {
        "q": "Heat source of truth?",
        "choices": [
          "Product TDS for that exact film.",
          "A single shop rumor number.",
          "Maximum torch always."
        ],
        "answer": 0
      },
      {
        "q": "What indicates a remaining problem after setting?",
        "choices": [
          "Visible tents or air rings at rivet heads.",
          "Slight gloss matching OEM.",
          "Clean microfiber wipe."
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "prac-seam",
    "title": "Seam Cutting",
    "icon": "✂️",
    "media": "media/videos/fleet/seam-peel-rework-zest-life.jpg",
    "panelDesc": "Virtual panel: door hinge line and trim pocket. Film is seated; you must cut into the void and leave a tuck margin.",
    "skills": [
      "Seat before cut",
      "Cut into void",
      "Tuck margin"
    ],
    "checklist": [
      "Seat film into the gap first",
      "Snap a fresh blade",
      "Cut into the void — not across paint",
      "Leave about 1–2 mm tuck margin when trim allows",
      "Heat-set edge only within TDS guidance"
    ],
    "mistakes": [
      {
        "id": "m1",
        "label": "Cut before seating",
        "bad": true
      },
      {
        "id": "m2",
        "label": "Cut into void with fresh blade",
        "bad": false
      },
      {
        "id": "m3",
        "label": "Flush-short face cut",
        "bad": true
      },
      {
        "id": "m4",
        "label": "Tuck behind trim",
        "bad": false
      }
    ],
    "quiz": [
      {
        "q": "Why leave a small tuck margin?",
        "choices": [
          "Hide edge, cover substrate, reduce lift.",
          "So vinyl expands wildly without cracking.",
          "Margins are never used."
        ],
        "answer": 0
      },
      {
        "q": "When do you cut?",
        "choices": [
          "After film is seated into the pocket/gap.",
          "Before any squeegee work.",
          "Only after melting the edge."
        ],
        "answer": 0
      },
      {
        "q": "Blade path?",
        "choices": [
          "Into the void/gap, angled off paint.",
          "Across unprotected paint freely.",
          "Toward your body for leverage."
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "prac-panel-align",
    "title": "Panel Alignment",
    "icon": "📐",
    "media": "media/videos/fleet/dusty-rose-gmc-rear-quarter-hang.jpg",
    "panelDesc": "Virtual multi-panel side: grey upper band and patterned lower must read continuous across door and body gaps.",
    "skills": [
      "Horizontal registration",
      "Dry-fit",
      "Distance QC"
    ],
    "checklist": [
      "Mark shared horizontal reference",
      "Dry-fit / hinge before full peel",
      "Check band continuity across gaps",
      "Redistribute fingers — don't crush print",
      "Step-back QC before final heat lock"
    ],
    "mistakes": [
      {
        "id": "m1",
        "label": "Eyeball only, no marks",
        "bad": true
      },
      {
        "id": "m2",
        "label": "Dry-fit to shared reference",
        "bad": false
      },
      {
        "id": "m3",
        "label": "Crush printed wrinkles flat",
        "bad": true
      },
      {
        "id": "m4",
        "label": "Step-back alignment check",
        "bad": false
      }
    ],
    "quiz": [
      {
        "q": "Why check horizontal bands before heat-lock?",
        "choices": [
          "Printed graphics must stay continuous across panels.",
          "To confirm propane tank fuel only.",
          "Heat freezes alignment forever with no lift possible."
        ],
        "answer": 0
      },
      {
        "q": "Fingers on patterned film?",
        "choices": [
          "Lift and redistribute, then squeegee.",
          "Smash flat immediately.",
          "Ignore — post-heat fixes creases."
        ],
        "answer": 0
      },
      {
        "q": "Fleet/multi-panel truth?",
        "choices": [
          "Shared measurement beats eyeballing.",
          "Each door can have its own logo height.",
          "Alignment only matters on glass."
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": "prac-recess",
    "title": "Recess Practice",
    "icon": "🌀",
    "media": "media/videos/architectural/gloss-recess-glass-out-yellow-squeegee.jpg",
    "panelDesc": "Virtual corrugated roof/upper panel: film glassed on ridges with long air tunnels over channels. Foam roller staged.",
    "skills": [
      "Glass first",
      "Soft-tool feed",
      "Air escape path"
    ],
    "checklist": [
      "Glass high points before committing recesses",
      "Walk fingers to an open edge",
      "Choose foam roller/soft pad over hard blade",
      "Feed one channel at a time",
      "Overlap strokes for air escape"
    ],
    "mistakes": [
      {
        "id": "m1",
        "label": "Hard-squeegee tunnel centers",
        "bad": true
      },
      {
        "id": "m2",
        "label": "Foam-roll feed into channel",
        "bad": false
      },
      {
        "id": "m3",
        "label": "Bridge-and-stretch deep corrugation",
        "bad": true
      },
      {
        "id": "m4",
        "label": "Melt vinyl into channel",
        "bad": true
      }
    ],
    "quiz": [
      {
        "q": "Correct tool move on bridged channels?",
        "choices": [
          "Feed with foam roller/soft pad; let air escape.",
          "Hard center stroke flat.",
          "Melt film into the recess."
        ],
        "answer": 0
      },
      {
        "q": "Why not bridge-and-stretch deep recesses?",
        "choices": [
          "Pop-back and stress when film recovers.",
          "It always looks glossier.",
          "Corrugations should stay bridged forever."
        ],
        "answer": 0
      },
      {
        "q": "Sequence?",
        "choices": [
          "Glass highs, manage fingers, then feed recesses.",
          "Recesses first, glass later.",
          "Trim first, install second."
        ],
        "answer": 0
      }
    ]
  }
];
window.WRAP911_DATA.badges = [
  {
    "id": "badge-bt-rivet",
    "title": "Rivet Master",
    "icon": "🔩",
    "lessonId": "bt-rivet-mastery"
  },
  {
    "id": "badge-bt-panels",
    "title": "Panel Handler",
    "icon": "📦",
    "lessonId": "bt-oversized-panels"
  },
  {
    "id": "badge-bt-rollup",
    "title": "Class C Walkaround",
    "icon": "🚪",
    "lessonId": "bt-rollup-door"
  },
  {
    "id": "badge-bt-swing",
    "title": "Swing Door Pro",
    "icon": "🔄",
    "lessonId": "bt-swing-door"
  },
  {
    "id": "badge-bt-prep",
    "title": "Prep Surgeon",
    "icon": "🧽",
    "lessonId": "bt-prep-cleaning"
  },
  {
    "id": "badge-van-recess",
    "title": "Recess Feeder",
    "icon": "🌀",
    "lessonId": "van-deep-recess"
  },
  {
    "id": "badge-van-slide",
    "title": "Slider Aligned",
    "icon": "↔️",
    "lessonId": "van-sliding-door"
  },
  {
    "id": "badge-van-roof",
    "title": "Roof Safe",
    "icon": "🪜",
    "lessonId": "van-roof-safety"
  },
  {
    "id": "badge-van-hinge",
    "title": "Hinge Mapper",
    "icon": "🔗",
    "lessonId": "van-rear-hinge"
  },
  {
    "id": "badge-sf-wet",
    "title": "Wet Soft-Seat",
    "icon": "💧",
    "lessonId": "sf-wet-install"
  },
  {
    "id": "badge-sf-perf",
    "title": "Architectural Panel",
    "icon": "🪟",
    "lessonId": "sf-perf-film"
  },
  {
    "id": "badge-sf-multipane",
    "title": "Cubby Registration",
    "icon": "▦",
    "lessonId": "sf-multipane"
  },
  {
    "id": "badge-sf-weather",
    "title": "Corner Trim",
    "icon": "🌦️",
    "lessonId": "sf-weather"
  },
  {
    "id": "badge-tr-rivets",
    "title": "Trailer Rivets",
    "icon": "⛓️",
    "lessonId": "tr-rivet-rows"
  },
  {
    "id": "badge-tr-roof",
    "title": "Roofline True",
    "icon": "📏",
    "lessonId": "tr-roofline"
  },
  {
    "id": "badge-tr-hinge",
    "title": "Hinge Cutter",
    "icon": "✂️",
    "lessonId": "tr-door-hinge"
  },
  {
    "id": "badge-tr-seg",
    "title": "Segment Planner",
    "icon": "🧩",
    "lessonId": "tr-panel-seg"
  },
  {
    "id": "badge-fl-align",
    "title": "Fleet Aligner",
    "icon": "📐",
    "lessonId": "fl-alignment"
  },
  {
    "id": "badge-fl-multi",
    "title": "Multi-Unit Flow",
    "icon": "🅿️",
    "lessonId": "fl-multi-vehicle"
  },
  {
    "id": "badge-fl-qc",
    "title": "Fleet QC",
    "icon": "✅",
    "lessonId": "fl-qc"
  },
  {
    "id": "badge-prac-rivet",
    "title": "Rivet Drilled",
    "icon": "🎯",
    "practiceId": "prac-rivet"
  },
  {
    "id": "badge-prac-seam",
    "title": "Seam Sharp",
    "icon": "🎯",
    "practiceId": "prac-seam"
  },
  {
    "id": "badge-prac-align",
    "title": "Alignment Drilled",
    "icon": "🎯",
    "practiceId": "prac-panel-align"
  },
  {
    "id": "badge-prac-recess",
    "title": "Recess Drilled",
    "icon": "🎯",
    "practiceId": "prac-recess"
  }
];
window.WRAP911_DATA.VIDEO_CATALOG = [
{
    "id": "v-mid-3886",
    "access": "paid",
    "title": "Pink caddy wrap 9",
    "category": "Van",
    "subcategory": "Doors",
    "type": "clip",
    "src": "media/videos/van/d-pillar-taillight-mid-install.mp4",
    "still": "media/videos/van/d-pillar-taillight-mid-install.jpg",
    "driveId": "1V1MktyAZKFfoGLar8pmhhVuHR0or2aCx",
    "recommendedModule": "van-rear-hinge",
    "recommendedWorkflow": "vw-hinge",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~3.5s). Dusty-rose film around D-pillar / taillight; alcohol + microfiber on the bumper. Edge/light install. Follow product TDS for any heat."
  },
{
    "id": "v-mid-697405",
    "access": "paid",
    "title": "Van recess",
    "category": "Fleet",
    "subcategory": "Seams",
    "type": "clip",
    "src": "media/videos/fleet/fleet-van-seam-tuck.mp4",
    "still": "media/videos/fleet/fleet-van-seam-tuck.jpg",
    "driveId": "1w4unGpH5qhXNpGUGFXYFbe0rtW1k_Lfq",
    "recommendedModule": "fl-alignment",
    "recommendedWorkflow": "fw-brand",
    "recommendedPractice": "prac-seam",
    "note": "Shop clip (~17s). Blue fleet van graphics; tuck a stripe/edge into the body line. Side-panel finish / seam tuck."
  },
{
    "id": "v-mid-7685",
    "access": "paid",
    "title": "Vinyl oncabinet1",
    "category": "Storefront/Architectural",
    "subcategory": "Trim",
    "type": "clip",
    "src": "media/videos/architectural/pink-box-interior-edge-knife-trim.mp4",
    "still": "media/videos/architectural/pink-box-interior-edge-knife-trim.jpg",
    "driveId": "1dF15MSsV-cJZBVghBQzoVs8YI59vc34O",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "sw-pane",
    "recommendedPractice": "prac-seam",
    "note": "Shop clip (~14s). Shop POV of lining a plywood display/fixture box with glossy magenta (hot-pink) film. Installer knives excess at the top rim after the floor and one wall are already covered. Pre-cut magenta rectangles sit on the bench. 3M Controltac liner appears later in the same job series. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7688",
    "access": "paid",
    "title": "Vinyl oncabinet2",
    "category": "Prep",
    "subcategory": "Material Prep",
    "type": "clip",
    "src": "media/videos/prep/magenta-strip-prep-alcohol-wipe-ready.mp4",
    "still": "media/videos/prep/magenta-strip-prep-alcohol-wipe-ready.jpg",
    "driveId": "1Bpo2VGD9RNCpBtSNibz73UFbbEbfr5j2",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "sw-pane",
    "recommendedPractice": "",
    "note": "Shop clip (~12s). Installer handles a long glossy magenta strip over the bench with IPA spray bottle and white/yellow felt squeegee visible. Same plywood box job — preparing wall strips after floor work. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7689",
    "access": "paid",
    "title": "Vinyl oncabinet2",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/controltac-liner-peel-box-floor-hang.mp4",
    "still": "media/videos/architectural/controltac-liner-peel-box-floor-hang.jpg",
    "driveId": "1BTZTwmd1vGody0rFOEzwwDaUVLKOxPNj",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "sw-pane",
    "recommendedPractice": "prac-panel-align",
    "note": "Shop clip (~26s). Close-up liner peel of glossy magenta film into the plywood box floor/channel. White liner shows 3M Controltac Graphic Marking System branding. Yellow knife on the blue bench; pre-cuts staged. Clock shows shop time ~1:54. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7690",
    "access": "paid",
    "title": "Vinyl oncabinet3",
    "category": "Storefront/Architectural",
    "subcategory": "Recesses",
    "type": "clip",
    "src": "media/videos/architectural/deep-corner-tuck-felt-squeegee.mp4",
    "still": "media/videos/architectural/deep-corner-tuck-felt-squeegee.jpg",
    "driveId": "1ailT4zp3UJNXfVuw98dgtkf9P3U7FDZO",
    "recommendedModule": "van-deep-recess",
    "recommendedWorkflow": "vw-recess",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~32s). Installer tucks glossy magenta film into a deep three-way interior corner of the fixture box using a white squeegee with yellow/tan felt buffer. Manages bridging/fingers at the vertex. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7692",
    "access": "paid",
    "title": "Vinyl oncabinet4",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/inner-wall-squeegee-3m-controltac-scraps.mp4",
    "still": "media/videos/architectural/inner-wall-squeegee-3m-controltac-scraps.jpg",
    "driveId": "1_vTv8TBdX-xJya8HqWO07L1lLQARkTCy",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "sw-pane",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~18s). Squeegeeing magenta film up an interior wall/corner. Discarded liner clearly shows 3M Controltac. Yellow detail tool rests on the floor panel; plotter and vinyl racks in background. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7694",
    "access": "free",
    "title": "Vinyl oncabinet5",
    "category": "Prep",
    "subcategory": "Material Prep",
    "type": "clip",
    "src": "media/videos/prep/grey-overlay-peel-magenta-base-stack.mp4",
    "still": "media/videos/prep/grey-overlay-peel-magenta-base-stack.jpg",
    "driveId": "1PWLm_cTNjuGmMWRCHOSRnn2UohGRG64_",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "sw-pane",
    "recommendedPractice": "",
    "note": "Shop clip (~3s). Very short clip: hand peels a matte/satin grey film piece relative to glossy magenta sheets on the bench — accent/stack prep for the same fixture job. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7695",
    "access": "paid",
    "title": "Vinyl oncabinet6",
    "category": "Prep",
    "subcategory": "Material Prep",
    "type": "clip",
    "src": "media/videos/prep/strip-handling-weeding-stage.mp4",
    "still": "media/videos/prep/strip-handling-weeding-stage.jpg",
    "driveId": "1CmM6RjkyqdUMAWCEugLdRS5vyfqxzKnV",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "sw-pane",
    "recommendedPractice": "",
    "note": "Shop clip (~7s). Handling long glossy magenta strips and staging pre-cuts near the wide-format cutter. Mix of liner peel into the box and bench weeding/organization. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7696",
    "access": "paid",
    "title": "Vinyl oncabinet6",
    "category": "Storefront/Architectural",
    "subcategory": "Recesses",
    "type": "clip",
    "src": "media/videos/architectural/gloss-recess-glass-out-yellow-squeegee.mp4",
    "still": "media/videos/architectural/gloss-recess-glass-out-yellow-squeegee.jpg",
    "driveId": "1Szl_weYXa9OCYBku-7iSa6IQSAjmvMBG",
    "recommendedModule": "van-deep-recess",
    "recommendedWorkflow": "vw-recess",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~63s). Longer (~63s) detail of tensioning/glassing magenta film and seating it into deep box recesses with a yellow squeegee under bright shop LEDs. High-gloss reflections make dirt and fingers obvious. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7697",
    "access": "paid",
    "title": "Vinyl oncabinet7",
    "category": "Storefront/Architectural",
    "subcategory": "Trim",
    "type": "clip",
    "src": "media/videos/architectural/corner-tuck-relief-knife.mp4",
    "still": "media/videos/architectural/corner-tuck-relief-knife.jpg",
    "driveId": "1YypDVQ4thFuJF8pXOoCuepm3TtYOqphG",
    "recommendedModule": "van-deep-recess",
    "recommendedWorkflow": "vw-recess",
    "recommendedPractice": "prac-seam",
    "note": "Shop clip (~35s). Yellow corner tool seats film, then a slim knife trims/relieves the interior corner. Later frame shows rim trim on the plywood edge with alcohol bottle and printer in background. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7699",
    "access": "paid",
    "title": "Vinyl oncabinet8",
    "category": "Storefront/Architectural",
    "subcategory": "Trim",
    "type": "clip",
    "src": "media/videos/architectural/hand-seat-corner-knife-trim.mp4",
    "still": "media/videos/architectural/hand-seat-corner-knife-trim.jpg",
    "driveId": "1fMmraoQk710YJ57tyyoM4SpAkuAXS8cJ",
    "recommendedModule": "van-deep-recess",
    "recommendedWorkflow": "vw-recess",
    "recommendedPractice": "prac-seam",
    "note": "Shop clip (~43s). Hand presses magenta film into a vertical interior corner, then knives a clean cut in the crease, removing a curled scrap. Shop cans and broom in background. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-7701",
    "access": "paid",
    "title": "Vinyl oncabinet9 finalized",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/cubbies-compare-magenta-vs-white-liners.mp4",
    "still": "media/videos/architectural/cubbies-compare-magenta-vs-white-liners.jpg",
    "driveId": "1ltdkeM-WAlMdL469OFlORp-5xo2sw6_N",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "sw-pane",
    "recommendedPractice": "prac-panel-align",
    "note": "Shop clip (~6s). Plywood cubby fixture on orange-edged bench: one bay lined glossy magenta, adjacent bay white/satin. Training/demo of multi-bay fixture lining consistency. Follow product TDS for any heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-6788",
    "access": "paid",
    "title": "Magenta Rivet Field — Tented Heads",
    "category": "Trailer",
    "subcategory": "Rivets",
    "type": "clip",
    "src": "media/videos/trailer/magenta-rivet-field-tented-heads.mp4",
    "still": "media/videos/trailer/magenta-rivet-field-tented-heads.jpg",
    "driveId": "1kl1IJtrS_u21qfn8E1GevF0rtrMOBq1T",
    "recommendedModule": "bt-rivet-mastery",
    "recommendedWorkflow": "tw-rivets",
    "recommendedPractice": "prac-rivet",
    "note": "Shop clip (~8s). Close-up of glossy magenta film over seated/tented hardware heads on a commercial panel; neon-yellow accents nearby. Still replaced to show real rivet/hardware heads (prior still was a flat Music Den graphic). Use for rivet-field teaching. Follow product TDS for heat/post-heat — do not invent temperatures."
  },
{
    "id": "v-mid-0020",
    "access": "paid",
    "title": "Rear vehicle rear wrap2",
    "category": "Van",
    "subcategory": "Doors",
    "type": "clip",
    "src": "media/videos/van/white-liftgate-recess-tuck.mp4",
    "still": "media/videos/van/white-liftgate-recess-tuck.jpg",
    "driveId": "13B_2gyGkHI9AHAHlea6XwyipLhRQ1tf8",
    "recommendedModule": "van-rear-hinge",
    "recommendedWorkflow": "vw-hinge",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~34s). Installer tucks white film into the rear liftgate license-plate recess and around chrome trim on a white SUV. Shows mid-install finger work with loose edges still hanging. Follow product TDS for any heat — no invented temperatures."
  },
{
    "id": "v-mid-3884",
    "access": "paid",
    "title": "Pink caddy wrap 7",
    "category": "Fleet",
    "subcategory": "Doors",
    "type": "clip",
    "src": "media/videos/fleet/dusty-rose-gmc-c-pillar-ladder-tuck.mp4",
    "still": "media/videos/fleet/dusty-rose-gmc-c-pillar-ladder-tuck.jpg",
    "driveId": "1bFtjkKr3iGsnReQXsjgq6Pvgjf8gcnlD",
    "recommendedModule": "van-rear-hinge",
    "recommendedWorkflow": "vw-hinge",
    "recommendedPractice": "prac-seam",
    "note": "Shop clip (~38s). Installer on step stool tucks dusty-rose film into upper C-pillar / roof-rail trim on black GMC SUV; liner scrap on floor. Height + edge tuck lesson. Same series as IMG_3886. Follow product TDS — no invented temperatures."
  },
{
    "id": "v-mid-3885",
    "access": "paid",
    "title": "Pink caddy wrap 8",
    "category": "Fleet",
    "subcategory": "QC",
    "type": "clip",
    "src": "media/videos/fleet/dusty-rose-gmc-chrome-trim-finish.mp4",
    "still": "media/videos/fleet/dusty-rose-gmc-chrome-trim-finish.jpg",
    "driveId": "1nQxaU--wDlpyK4OpmziUhOeo1w96NjKV",
    "recommendedModule": "fl-qc",
    "recommendedWorkflow": "fw-qc",
    "recommendedPractice": "",
    "note": "Shop clip (~26s). Close finish look at dusty-rose panels meeting horizontal/vertical chrome trim on GMC SUV. QC for tuck quality and reflection cleanliness. Same dusty-rose series. Follow product TDS — no invented temperatures."
  },
{
    "id": "v-mid-5540",
    "access": "paid",
    "title": "Contour wrapping",
    "category": "Van",
    "subcategory": "Recesses",
    "type": "clip",
    "src": "media/videos/van/carbon-fiber-pattern-bumper-recess-seat.mp4",
    "still": "media/videos/van/carbon-fiber-pattern-bumper-recess-seat.jpg",
    "driveId": "1_QfEua--lFYmYsdwDQIBfvqczwNj79Km",
    "recommendedModule": "van-deep-recess",
    "recommendedWorkflow": "vw-recess",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~31s). Gloss carbon-fiber–pattern vinyl seating into a rear bumper recess beside mesh vent; excess film still bunched. Texture film in a pocket/recess. Follow product TDS — no invented temperatures."
  },
{
    "id": "v-mid-6790",
    "access": "paid",
    "title": "Vinyl remove2",
    "category": "Trailer",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/trailer/donuts-trailer-side-graphic-hang-stage.mp4",
    "still": "media/videos/trailer/donuts-trailer-side-graphic-hang-stage.jpg",
    "driveId": "1bI7vgCEz4yt7vfcGUz8s5BkrTqYAJlBe",
    "recommendedModule": "tr-panel-seg",
    "recommendedWorkflow": "tw-seg",
    "recommendedPractice": "prac-panel-align",
    "note": "Shop clip (~15s). Wider white trailer side with magenta/orange DONUTS graphic mid-hang; transfer-tape/liner bunched at top edge; rivets visible under film and on white upper. Same job as IMG_6788. Follow product TDS — no invented temperatures."
  },
{
    "id": "v-mid-8962",
    "access": "paid",
    "title": "Rv orange",
    "category": "Trailer",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/trailer/orange-99-month-ladder-tall-side-hang.mp4",
    "still": "media/videos/trailer/orange-99-month-ladder-tall-side-hang.jpg",
    "driveId": "17GSt98CbB22u6IXx3SW15OA4OMYdf_sX",
    "recommendedModule": "tr-roofline",
    "recommendedWorkflow": "tw-roof",
    "recommendedPractice": "prac-panel-align",
    "note": "Shop clip (~26s). Installer on A-frame ladder works tall orange graphic with white '99' / MONTH lettering; 3M liner/roll visible nearby. Tall-side ladder safety + large panel hang. Follow 3M product TDS — no invented temperatures."
  },
{
    "id": "v-mid-8974",
    "access": "paid",
    "title": "Rv vinyl3",
    "category": "Trailer",
    "subcategory": "Doors",
    "type": "clip",
    "src": "media/videos/trailer/orange-side-door-recess-ladder-trim.mp4",
    "still": "media/videos/trailer/orange-side-door-recess-ladder-trim.jpg",
    "driveId": "1K9efD7TOOoJQKv4-974pAe0XrjpvhfiF",
    "recommendedModule": "tr-door-hinge",
    "recommendedWorkflow": "tw-hinge",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~24s). Installer on ladder seats/trims orange/red film into a side door recess; heat gun staged on ladder; cart with tape/sealant nearby. Tall commercial door detail. Related to IMG_8962/8965 series. Follow film TDS — no invented temperatures."
  },
{
    "id": "v-mid-1039",
    "access": "paid",
    "title": "Rv wrap walk around",
    "category": "RV/Bus",
    "subcategory": "QC",
    "type": "clip",
    "src": "media/videos/rv-bus/class-c-rv-stripe-walkaround-ford-e-350.mp4",
    "still": "media/videos/rv-bus/class-c-rv-stripe-walkaround-ford-e-350.jpg",
    "driveId": "1j729uUuKImAECzbpusZpYGY-qT7UcYO7",
    "recommendedModule": "tr-panel-seg",
    "recommendedWorkflow": "tw-seg",
    "recommendedPractice": "prac-panel-align",
    "note": "Shop clip (~33s). Outdoor walkaround of a finished Ford E-350 Class C motorhome with multi-color horizontal stripe graphics (blue / yellow / orange) aligned across door gaps and body sections. Stripe continuity / finished-job QC. Follow film TDS — no invented temperatures."
  },
{
    "id": "v-mid-6796",
    "access": "paid",
    "title": "Signs of a bad install",
    "category": "Trailer",
    "subcategory": "Trim",
    "type": "clip",
    "src": "media/videos/trailer/magenta-series-hardware-cutout-edge-tuck.mp4",
    "still": "media/videos/trailer/magenta-series-hardware-cutout-edge-tuck.jpg",
    "driveId": "13sqysxygzWtiBkIdo4KyUqpWptPeY24x",
    "recommendedModule": "tr-door-hinge",
    "recommendedWorkflow": "tw-hinge",
    "recommendedPractice": "prac-recess",
    "note": "Shop clip (~13s). Tight detail on glossy magenta/red film around a hardware cutout and brushed-metal trim; finger work at the recessed edge. Same magenta trailer series as IMG_6788–6797. Follow product TDS — no invented temperatures."
  },
{
    "id": "v-mid-8971",
    "access": "paid",
    "title": "Rv vinyl2",
    "category": "Trailer",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/trailer/orange-99-month-ladder-roofline-seat.mp4",
    "still": "media/videos/trailer/orange-99-month-ladder-roofline-seat.jpg",
    "driveId": "1yRVtPu5rYxpbs54zQxCmpFeltJsSapnL",
    "recommendedModule": "tr-roofline",
    "recommendedWorkflow": "tw-roof",
    "recommendedPractice": "prac-panel-align",
    "note": "Shop clip (~37s). Installer on step ladder seats the upper edge of the orange '99 MONTH' tall-side graphic; geometric black/grey graphics remain on the adjacent panel. Ladder height + upper-edge hang. Same series as IMG_8962. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-translucent-vinyl-1bidzr",
    "access": "paid",
    "title": "Translucent vinyl",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/translucent-vinyl.mp4",
    "still": "media/videos/prep/translucent-vinyl.jpg",
    "driveId": "1bidzrzK1-2jZkEy55ZnpvBS2tko4wv2Q",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~25s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-vinyl-removal-1Wvo1G",
    "access": "paid",
    "title": "Vinyl Removal",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/vinyl-removal.mp4",
    "still": "media/videos/prep/vinyl-removal.jpg",
    "driveId": "1Wvo1GloDBsZHicdzeZiJtd5KLS4j2Xnr",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~44s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-rear-vehicle-gate-wrap-11EhrJ",
    "access": "free",
    "title": "Rear vehicle gate wrap",
    "category": "Van",
    "subcategory": "Doors",
    "type": "clip",
    "src": "media/videos/van/rear-vehicle-gate-wrap.mp4",
    "still": "media/videos/van/rear-vehicle-gate-wrap.jpg",
    "driveId": "11EhrJDu6tEYAPVFgt9F-VKivcVDh1nN9",
    "recommendedModule": "van-rear-hinge",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~34s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-handling-vinyl-1riO1q",
    "access": "paid",
    "title": "Handling vinyl",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/handling-vinyl.mp4",
    "still": "media/videos/prep/handling-vinyl.jpg",
    "driveId": "1riO1qZAibX3kG_KRJ04qe2X4FvHIfNl0",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~44s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-corngraphic-1_ycBu",
    "access": "free",
    "title": "Corngraphic",
    "category": "QC",
    "subcategory": "Inspection",
    "type": "clip",
    "src": "media/videos/qc/corngraphic.mp4",
    "still": "media/videos/qc/corngraphic.jpg",
    "driveId": "1_ycBuzOVP1JsR9K8C3MKsI8kzJYw2BbT",
    "recommendedModule": "fl-qc",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~14s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-showing-rivets-1r6aYA",
    "access": "paid",
    "title": "Showing rivets",
    "category": "Trailer",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/trailer/showing-rivets.mp4",
    "still": "media/videos/trailer/showing-rivets.jpg",
    "driveId": "1r6aYArm88fTRRBjUuYKddXp1XAQnETWA",
    "recommendedModule": "tr-panel-seg",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~47s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-smith-field-food-truck-12d1m0",
    "access": "paid",
    "title": "Smith field food truck",
    "category": "RV/Bus",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/rv-bus/smith-field-food-truck.mp4",
    "still": "media/videos/rv-bus/smith-field-food-truck.jpg",
    "driveId": "12d1m0bWje4zwlutN7oJ0SWTNPV1PiXQF",
    "recommendedModule": "tr-panel-seg",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~54s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-blue-rv-wrap-1Ckzyv",
    "access": "paid",
    "title": "BlueRV. Wrap",
    "category": "RV/Bus",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/rv-bus/blue-rv-wrap.mp4",
    "still": "media/videos/rv-bus/blue-rv-wrap.jpg",
    "driveId": "1CkzyvCjuVVYlp8ZYRdv8F5tkz2ATPMnP",
    "recommendedModule": "tr-panel-seg",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~33s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-satin-wrap-cherokee-1y2x7R",
    "access": "paid",
    "title": "Satin wrap Cherokee",
    "category": "Fleet",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/fleet/satin-wrap-cherokee.mp4",
    "still": "media/videos/fleet/satin-wrap-cherokee.jpg",
    "driveId": "1y2-7RUBxWyZ0lO6ftxSthNrVz_AW3jtK",
    "recommendedModule": "fl-alignment",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~36s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-cutting-vinyl-4-12OuH3",
    "access": "free",
    "title": "Cutting vinyl 4",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/cutting-vinyl-4.mp4",
    "still": "media/videos/prep/cutting-vinyl-4.jpg",
    "driveId": "12OuH3Nv5LORdkmLJumDua3dDvOSi6JnC",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~16s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-cabinet-done-1Shu3T",
    "access": "free",
    "title": "Cabinet done",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/cabinet-done.mp4",
    "still": "media/videos/architectural/cabinet-done.jpg",
    "driveId": "1Shu3TZfBBYeKiIdqtzY9FbqsbmuEF5yZ",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~6s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-cutting-vinyl-6-1WQRED",
    "access": "free",
    "title": "Cutting vinyl 6",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/cutting-vinyl-6.mp4",
    "still": "media/videos/prep/cutting-vinyl-6.jpg",
    "driveId": "1WQREDWolBMkJaN9Mb1DIWbJ9za-ifWGw",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~23s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-vinyl-cabinet-installed-1kTrGV",
    "access": "free",
    "title": "Vinyl cabinet installed",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/vinyl-cabinet-installed.mp4",
    "still": "media/videos/architectural/vinyl-cabinet-installed.jpg",
    "driveId": "1kTrGVvsjpsjffwr2ZdS8ECRtYlh0vB8N",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~1s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-vinyl-oncabinet8-18oCVi",
    "access": "free",
    "title": "Vinyl oncabinet8",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/vinyl-oncabinet8.mp4",
    "still": "media/videos/architectural/vinyl-oncabinet8.jpg",
    "driveId": "18oCVik7pOCeyoq1iEFnobbsHVGjDuyPk",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~5s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-torch-in-vinyl-3-1uAbFN",
    "access": "free",
    "title": "Torch in vinyl 3",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/torch-in-vinyl-3.mp4",
    "still": "media/videos/prep/torch-in-vinyl-3.jpg",
    "driveId": "1uAbFNTKY1PaLVU9z5uei4byw6BRd-gWO",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~10s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-vinyl-cutting1-1SZrR5",
    "access": "free",
    "title": "Vinyl cutting1",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/vinyl-cutting1.mp4",
    "still": "media/videos/prep/vinyl-cutting1.jpg",
    "driveId": "1SZrR5XeJH-o84DBfr8XoOHnzYGH639ud",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~9s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-stroke-of-the-squeegee-1xetub",
    "access": "free",
    "title": "Stroke of the squeegee",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/stroke-of-the-squeegee.mp4",
    "still": "media/videos/prep/stroke-of-the-squeegee.jpg",
    "driveId": "1-etubtqMFwgZZ8EtycZ7fTcXXTnlj2IN",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~14s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-trailer-rivets-and-marker-li-1WwwZf",
    "access": "free",
    "title": "Marker light, cut it out",
    "category": "Trailer",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/trailer/trailer-rivets-and-marker-lights.mp4",
    "still": "media/videos/trailer/trailer-rivets-and-marker-lights.jpg",
    "driveId": "1WwwZfoYjEvKYfeMQ8Knic-Aj6f7A2xaC",
    "recommendedModule": "tr-panel-seg",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip. Gold Controltac over a round marker light. The light gets cut out. Not a rivet row. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-torch-on-vinyl1-1NfBta",
    "access": "paid",
    "title": "Torch on vinyl1",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/torch-on-vinyl1.mp4",
    "still": "media/videos/prep/torch-on-vinyl1.jpg",
    "driveId": "1NfBtalqEf9--ZYZ_FpVcxqFQsnV33wdn",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~41s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-torch-on-vinyl2-1Tk1xt",
    "access": "paid",
    "title": "Torch on vinyl2",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/torch-on-vinyl2.mp4",
    "still": "media/videos/prep/torch-on-vinyl2.jpg",
    "driveId": "1Tk1xt2ToQ_z5kZSwvSnVh0oSf6VbvWEN",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~36s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-vinyl-squeegee-sequence-1j5VJF",
    "access": "paid",
    "title": "Vinyl squeegee sequence",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/vinyl-squeegee-sequence.mp4",
    "still": "media/videos/prep/vinyl-squeegee-sequence.jpg",
    "driveId": "1j5VJFrWS8IgulGu_UuS4HNmMj0xEzxiJ",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~45s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-wrapping-around-trailer-mark-1Y3WJb",
    "access": "paid",
    "title": "Wrapping around trailer marking light",
    "category": "Trailer",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/trailer/wrapping-around-trailer-marking-light.mp4",
    "still": "media/videos/trailer/wrapping-around-trailer-marking-light.jpg",
    "driveId": "1Y3WJbr2bYH_FfYJM423zPnSchMcnZJoU",
    "recommendedModule": "tr-panel-seg",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~52s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-graphic-installation-1-1gNZhI",
    "access": "paid",
    "title": "Graphic installation 1",
    "category": "Fleet",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/fleet/graphic-installation-1.mp4",
    "still": "media/videos/fleet/graphic-installation-1.jpg",
    "driveId": "1gNZhIF4PxyFy5Y5hIMi-j1-budREb386",
    "recommendedModule": "fl-alignment",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~67s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-squeegee-strokes-1NBAg_",
    "access": "paid",
    "title": "Squeegee strokes",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/squeegee-strokes.mp4",
    "still": "media/videos/prep/squeegee-strokes.jpg",
    "driveId": "1NBAg_uLvUcbfrqn3RTrZ0nuuYByfp0kd",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~47s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-pink-wrap-caddy-1-1G1W_l",
    "access": "free",
    "title": "Pink wrap caddy 1",
    "category": "Fleet",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/fleet/pink-wrap-caddy-1.mp4",
    "still": "media/videos/fleet/pink-wrap-caddy-1.jpg",
    "driveId": "1G1W_lClht6BEoak33x2mONxj77fIg0ol",
    "recommendedModule": "fl-alignment",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~0s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-pink-caddy-wrap5-1CBWZ0",
    "access": "free",
    "title": "Pink caddy wrap5",
    "category": "Fleet",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/fleet/pink-caddy-wrap5.mp4",
    "still": "media/videos/fleet/pink-caddy-wrap5.jpg",
    "driveId": "1CBWZ073UfRIwlu20meT7dqrSx-t_-V7M",
    "recommendedModule": "fl-alignment",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~14s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-dull-blade-cut-1RslTS",
    "access": "free",
    "title": "Dull blade cut",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/dull-blade-cut.mp4",
    "still": "media/videos/prep/dull-blade-cut.jpg",
    "driveId": "1RslTSyDywRj-rDdVGLoR5g_JF0fMSuhZ",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~3s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-cutting-vinyl3-1GT3fB",
    "access": "free",
    "title": "Cutting vinyl3",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/cutting-vinyl3.mp4",
    "still": "media/videos/prep/cutting-vinyl3.jpg",
    "driveId": "1GT3fBkCOkL5j38Y-3Dw7MZgROmLJGuDJ",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~9s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-cutting-vinyl-5-15wD6M",
    "access": "free",
    "title": "Cutting vinyl 5",
    "category": "Prep",
    "subcategory": "Technique",
    "type": "clip",
    "src": "media/videos/prep/cutting-vinyl-5.mp4",
    "still": "media/videos/prep/cutting-vinyl-5.jpg",
    "driveId": "15wD6MzFfSABBvctCCWGxec6C-0B71clA",
    "recommendedModule": "bt-prep-cleaning",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~3s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-pink-caddy-wrap3-1bs6tn",
    "access": "free",
    "title": "Pink caddy wrap3",
    "category": "Fleet",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/fleet/pink-caddy-wrap3.mp4",
    "still": "media/videos/fleet/pink-caddy-wrap3.jpg",
    "driveId": "1bs6tnkd4WBq53cERmZf2Xcvs9fNsqfD7",
    "recommendedModule": "fl-alignment",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~11s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-pink-caddy-wrap4-1A3qMJ",
    "access": "free",
    "title": "Pink caddy wrap4",
    "category": "Fleet",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/fleet/pink-caddy-wrap4.mp4",
    "still": "media/videos/fleet/pink-caddy-wrap4.jpg",
    "driveId": "1A3qMJnkCAoNh2IgkZatTAOJfDfjXpY8g",
    "recommendedModule": "fl-alignment",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~13s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-wall-wrap-sque-14Wtby",
    "access": "free",
    "title": "Architectural wall wrap squeegee sequence",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-wall-wrap-squeegee-sequence.mp4",
    "still": "media/videos/architectural/architectural-wall-wrap-squeegee-sequence.jpg",
    "driveId": "14WtbyH_BsFy7oe-j0B4DF-JKpwaSynF6",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~19s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-vinyl-panel-pr-13pihm",
    "access": "paid",
    "title": "Architectural vinyl panel pre install prep",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-vinyl-panel-pre-install-prep.mp4",
    "still": "media/videos/architectural/architectural-vinyl-panel-pre-install-prep.jpg",
    "driveId": "13pihmIzFSlmdKA3wVOjBfXOmQVF3MEY8",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~31s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-panel-cutting--1bucxT",
    "access": "paid",
    "title": "Architectural panel cutting excess vinyl after install 1",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-1.mp4",
    "still": "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-1.jpg",
    "driveId": "1bucxT6ih_xT2KGmL6cCqAN9UKD36bdnn",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~24s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-panel-cutting--1qn3lV",
    "access": "free",
    "title": "Architectural panel cutting excess vinyl after install 2",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-2.mp4",
    "still": "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-2.jpg",
    "driveId": "1qn3lVw7fKZt_0jGJJAjU6pZ00ngoGjKE",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~12s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-wall-vinyl-pan-1_jsQ7",
    "access": "paid",
    "title": "Architectural wall vinyl panel using heat to remove fingers",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.mp4",
    "still": "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.jpg",
    "driveId": "1_jsQ7dAkea2VfMiK1WAljhmLAo0fNHZ_",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~40s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-wrap-cutting-a-1otK4E",
    "access": "paid",
    "title": "Architectural wrap cutting around hinges",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-wrap-cutting-around-hinges.mp4",
    "still": "media/videos/architectural/architectural-wrap-cutting-around-hinges.jpg",
    "driveId": "1otK4E0_yIUhe5dvSZ03mpXjhhuhlc5vY",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~36s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-wall-panel-wra-1mdavr",
    "access": "paid",
    "title": "Architectural wall panel wrap post heat 2",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-wall-panel-wrap-post-heat-2.mp4",
    "still": "media/videos/architectural/architectural-wall-panel-wrap-post-heat-2.jpg",
    "driveId": "1mdavrLKPxaPII3KpiKVpa3cPDsfO-uw8",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~45s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-wall-wrap-18yx_q",
    "access": "free",
    "title": "Architectural wall wrap",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-wall-wrap.mp4",
    "still": "media/videos/architectural/architectural-wall-wrap.jpg",
    "driveId": "18yx_qjVv6yohIrq_Q2I0uYBcUUGD9zqk",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~20s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-post-heating-v-1FFpMa",
    "access": "paid",
    "title": "Architectural post heating vinyl 2",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-post-heating-vinyl-2.mp4",
    "still": "media/videos/architectural/architectural-post-heating-vinyl-2.jpg",
    "driveId": "1FFpMabcX9LxxSkJjhKdgy2SwE_46Wsqt",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~57s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-post-heat-panel-1-10LIlU",
    "access": "paid",
    "title": "Post heat panel 1",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/post-heat-panel-1.mp4",
    "still": "media/videos/architectural/post-heat-panel-1.jpg",
    "driveId": "10LIlU-xcVB5j3FqBuxBPF4lmXZoxnk9O",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~30s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-cutting-vinyl--1NXkcT",
    "access": "paid",
    "title": "Architectural cutting vinyl around hinges",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-cutting-vinyl-around-hinges.mp4",
    "still": "media/videos/architectural/architectural-cutting-vinyl-around-hinges.jpg",
    "driveId": "1NXkcT7HqQeJB7VlNK_81S2TtPp2Dtz57",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~38s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-wall-wrap-pane-1dNBb4",
    "access": "paid",
    "title": "Architectural wall wrap panel squeegeeing styles",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-wall-wrap-panel-squeegeeing-styles.mp4",
    "still": "media/videos/architectural/architectural-wall-wrap-panel-squeegeeing-styles.jpg",
    "driveId": "1dNBb49FDPg34i5ppfEy_22VwhV1EYTRp",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~91s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  },
  {
    "id": "v-named-architectural-wall-panel-ins-1V50KW",
    "access": "paid",
    "title": "Architectural wall panel install dust tack",
    "category": "Storefront/Architectural",
    "subcategory": "Panels",
    "type": "clip",
    "src": "media/videos/architectural/architectural-wall-panel-install-dust-tack.mp4",
    "still": "media/videos/architectural/architectural-wall-panel-install-dust-tack.jpg",
    "driveId": "1V50KW_CC1gt5mwJ2COcEh2rvJXqHW8qt",
    "recommendedModule": "sf-multipane",
    "recommendedWorkflow": "",
    "recommendedPractice": "",
    "note": "Shop clip (~113s). Named Drive ingest 2026-09-22. Follow film TDS — no invented temperatures."
  }
];

window.WRAP911_DATA.panels = [
  {
    "id": "panel-side",
    "name": "Side panel",
    "defaultWidthIn": 192,
    "defaultHeightIn": 96
  },
  {
    "id": "panel-rear",
    "name": "Rear panel",
    "defaultWidthIn": 96,
    "defaultHeightIn": 84
  },
  {
    "id": "panel-door",
    "name": "Door panel",
    "defaultWidthIn": 48,
    "defaultHeightIn": 72
  },
  {
    "id": "panel-glass",
    "name": "Storefront pane",
    "defaultWidthIn": 48,
    "defaultHeightIn": 72
  }
];
window.WRAP911_DATA.defaultJob = {
  "id": "",
  "vehiclePhoto": "",
  "jobType": "box-truck",
  "coverage": "Partial sides + rear",
  "materialBrand": "3M",
  "notes": "",
  "beforePhoto": "",
  "afterPhoto": "",
  "completed": false,
  "workflowDone": {},
  "createdAt": 0,
  "updatedAt": 0
};
})();

/* Drive photo gallery index — coach/media reference; user-facing gallery is photoLessons */
window.WRAP911_DATA.PHOTO_GALLERY = [
  { id: "pg13", title: "Office wallpaper wrap", src: "media/photos/gallery/office-wallpaper-wrap.jpg", category: "Storefront/Architectural", driveId: "1lEK7B3umxyQ6ECe_VxucEQi5TvFPZ5nS", photoLessonId: "pl13" },
  { id: "pg14", title: "Measuring bleed", src: "media/photos/gallery/measuring-bleed2.jpg", category: "Storefront/Architectural", driveId: "1Qgvzs4NX3E_Lc_s5Cy4MXf6jogZZqF__", photoLessonId: "pl14" },
  { id: "pg15", title: "Half-moon relief", src: "media/photos/gallery/demonstration-of-a-half-moon.jpg", category: "Storefront/Architectural", driveId: "1Odq6r2tsLDrDmklDQygebD2F8HRbZLdr", photoLessonId: "pl15" },
  { id: "pg16", title: "Cabinet pic sides", src: "media/photos/gallery/cabinet-pic-sides.jpg", category: "Storefront/Architectural", driveId: "1WM6e7kXSH38rbPkfoxvM0bdw7CIryl1X", photoLessonId: "pl16" },
  { id: "pg17", title: "Cabinet measure", src: "media/photos/gallery/cabinet-measure.jpg", category: "Storefront/Architectural", driveId: "1DjfwyrNCV84nbblO4bcZaiaXLxxSGY_4", photoLessonId: "pl17" },
  { id: "pg18", title: "Front bumper wrap", src: "media/photos/gallery/front-bumper-wrap.jpg", category: "Fleet", driveId: "1LXKPxgPCquWKbYZXlQFBrfL9Kn7Fbryy", photoLessonId: "pl18" },
  { id: "pg19", title: "Pink caddy bumper close-up", src: "media/photos/gallery/pink-caddy-bumper-close-up.jpg", category: "Fleet", driveId: "15_Rj2xH_QllC30ixdFQQcRVUOuQcUKNP", photoLessonId: "pl19" },
  { id: "pg20", title: "Front bumper wrap caddy", src: "media/photos/gallery/front-bumper-wrap-caddy.jpg", category: "Fleet", driveId: "12eOxYGaNrxoGOITdr9j8D5qBuxTqG-iS", photoLessonId: "pl20" },
  { id: "pg21", title: "Trailer spot graphics", src: "media/photos/gallery/trailer-spot-graphics.jpg", category: "Trailer", driveId: "1omAzjz3VPoOSu7rAGxBrry0zofUDUvpK", photoLessonId: "pl21" },
  { id: "pg22", title: "Kiosk box", src: "media/photos/gallery/kiosk-box.jpg", category: "Storefront/Architectural", driveId: "1O7xfBZTJ82bZQlILBQlr_wzxnLkWUisA", photoLessonId: "pl22" }
];


window.WRAP911_DATA.VIDEO_ON_PAGE = {
  "media/videos/prep/grey-overlay-peel-magenta-base-stack.mp4": true,
  "media/videos/prep/translucent-vinyl.mp4": true,
  "media/videos/prep/vinyl-removal.mp4": true,
  "media/videos/van/rear-vehicle-gate-wrap.mp4": true,
  "media/videos/qc/corngraphic.mp4": true,
  "media/videos/fleet/satin-wrap-cherokee.mp4": true,
  "media/videos/prep/cutting-vinyl-4.mp4": true,
  "media/videos/architectural/cabinet-done.mp4": true,
  "media/videos/prep/cutting-vinyl-6.mp4": true,
  "media/videos/architectural/vinyl-cabinet-installed.mp4": true,
  "media/videos/architectural/vinyl-oncabinet8.mp4": true,
  "media/videos/prep/torch-in-vinyl-3.mp4": true,
  "media/videos/prep/vinyl-cutting1.mp4": true,
  "media/videos/prep/stroke-of-the-squeegee.mp4": true,
  "media/videos/trailer/trailer-rivets-and-marker-lights.mp4": true,
  "media/videos/prep/torch-on-vinyl1.mp4": true,
  "media/videos/prep/torch-on-vinyl2.mp4": true,
  "media/videos/prep/vinyl-squeegee-sequence.mp4": true,
  "media/videos/trailer/wrapping-around-trailer-marking-light.mp4": true,
  "media/videos/fleet/graphic-installation-1.mp4": true,
  "media/videos/prep/squeegee-strokes.mp4": true,
  "media/videos/fleet/pink-wrap-caddy-1.mp4": true,
  "media/videos/fleet/pink-caddy-wrap5.mp4": true,
  "media/videos/prep/dull-blade-cut.mp4": true,
  "media/videos/prep/cutting-vinyl3.mp4": true,
  "media/videos/prep/cutting-vinyl-5.mp4": true,
  "media/videos/fleet/pink-caddy-wrap3.mp4": true,
  "media/videos/fleet/pink-caddy-wrap4.mp4": true,
  "media/videos/architectural/architectural-wall-wrap-squeegee-sequence.mp4": true,
  "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-1.mp4": true,
  "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-2.mp4": true,
  "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.mp4": true,
  "media/videos/architectural/architectural-wall-wrap.mp4": true,
};
