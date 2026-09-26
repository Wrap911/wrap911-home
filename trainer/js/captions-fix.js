/* One caption per still. The filename is not trusted. Every copy of a file gets the same read. */
(function () {
  var BY = {
    "pink-wrap-caddy-1.jpg": {
      title: "Escalade front fender",
      jobType: "Vehicles",
      visual: "Glossy pink Cadillac Escalade front fender. Chrome multi-spoke wheel and black tire fill the lower frame. The cowl is open, with paper and tape on the ledge. A white, yellow, and blue heat gun with its cord sits on the concrete by the tire. The fender panel is smooth.",
      narration: "This is the front fender of a pink Escalade. The film is glassed on a smooth panel. The wheel arch and the open cowl are the edges. The heat gun is on the floor and is not on the film.\n\nGlass the fender, then feed the arch. Do not bridge the opening. Leave the gun down until that arch actually needs heat, and then only at the film TDS.",
      check: ["Name the panel: Escalade front fender", "Glass the smooth fender before the wheel arch", "Leave the heat gun on the floor until the arch needs it", "Keep the paper on the open cowl off fresh film"],
      q: "What panel is this, and where is the heat gun?",
      correct: "Pink Escalade front fender. The heat gun is on the concrete by the tire.",
      wrong: "A trailer rivet row with a roller in a channel."
    },
    "pink-caddy-wrap3.jpg": {
      title: "Escalade door and fender",
      jobType: "Vehicles",
      visual: "Close side of the pink Escalade. A vertical shut line splits the fender from the door. A character line runs through the door. A small black latch sits high, just under the glass. Chrome rocker trim runs along the bottom, and a bit of the wheel shows at the lower left. The gloss is smooth.",
      narration: "This is the Escalade door and fender. You can see the shut line, the character line, the high black latch, and the chrome rocker. Shop lights are only a reflection in the gloss.\n\nGlass the flat, then lay film into the shut line. Do not stretch a bridge across the gap. Protect the chrome when you trim the bottom.",
      check: ["Name the shut line, character line, latch, and chrome rocker", "Glass the flat before the door gap", "Do not bridge the shut line", "Protect the chrome rocker while trimming"],
      q: "What is this pink panel?",
      correct: "An Escalade door and fender: shut line, character line, latch, and chrome rocker.",
      wrong: "Rivet crowns on a commercial panel."
    },
    "pink-caddy-wrap4.jpg": {
      title: "Escalade rear door handle",
      jobType: "Vehicles",
      visual: "Rear door of the pink Escalade. Glossy pink film follows the recessed handle. The scoop has two open black cavities, and a chrome key cylinder sits at the back of the handle. The door edge and jamb are on the right.",
      narration: "The subject is the rear door handle on the Escalade. Film is already over the scoop. The key cylinder is still chrome. The black openings are the handle voids.\n\nSeat the scoop before you cut. Cut into the voids, off the paint, and leave a tuck the housing can hide. Finish the jamb after the pocket is down.",
      check: ["Name it: Escalade rear door handle", "Seat the scoop before cutting", "Keep the key cylinder free", "Cut into the black openings, not across the face"],
      q: "What detail is the film following on this door?",
      correct: "The recessed handle scoop and the chrome key cylinder.",
      wrong: "A bottle-print on a black pickup with a camper shell."
    },
    "pink-caddy-wrap5.jpg": {
      title: "Escalade side with white hexes",
      jobType: "Vehicles",
      visual: "Side of the pink Escalade in the bay. White outlined hexagons sit on the rear door and on the rear side glass. Chrome door handles and a black running board are visible. The hood is open. The rear wheel and the shop ceiling show at the right.",
      narration: "This is the Escalade side with a white hex graphic over the pink film. The same outline is on the rear door and on the glass. The hood is open, so the job is still in the bay. There is no torch in this frame.\n\nCheck that the hexes keep the same size and angle from door to glass. Leave the chrome handles alone. Glass the door before you decide any edge needs heat.",
      check: ["Call it an Escalade side, hood open", "Compare hex size on the door and the glass", "Leave the chrome handles uncut", "No torch is in this frame"],
      q: "What graphic is on this Escalade, and what is open?",
      correct: "White outlined hexagons on the rear door and rear glass. The hood is open.",
      wrong: "Green bottle film on a silver pickup with a torch on the floor."
    },
    "satin-wrap-cherokee.jpg": {
      title: "Jeep hood vents and chrome grille",
      jobType: "Vehicles",
      visual: "Nose of a satin grey Jeep. The hood has a wide rectangular mesh vent and a smaller swept mesh vent. A chrome seven-slot grille fills the bottom of the frame, with the edge of a headlight at the right. Tires, a red cart, and a green wall are in the shop behind it.",
      narration: "This is a satin Jeep nose. The film has to stop at two mesh hood vents and at the chrome seven-slot grille. Satin shows every finger because it does not hide them in a gloss reflection.\n\nDo not stretch film across the mesh. Relief the vent openings and trim to the mesh edge. Bring the hood film down to the chrome and stop.",
      check: ["Name the satin Jeep hood and the seven-slot grille", "Relief both mesh vents", "Stop the film at the chrome grille", "Check satin in raking light for fingers"],
      q: "Where does the film have to stop on this hood?",
      correct: "At the mesh hood vents and at the chrome seven-slot grille.",
      wrong: "On a tall RV side with ladders and a pink graphic."
    },
    "graphic-installation-1.jpg": {
      title: "Just Ice Tea graphic on the bench",
      jobType: "Vehicles",
      visual: "Shop bench. A white gloss sheet carries a black printed panel that reads JUST ICE TEA. A row of small color cards lines the top. Hands in a blue sleeve, one with a ring, work the left edge. A plotter is at the left, a red ladder and pallet jack are in the bay, and a blurred red-orange fruit sits in the foreground.",
      narration: "The words on the film are JUST ICE TEA. This is the bench, not a vehicle. The color cards are the graphic reference. Hands are on the left edge of the sheet. The round blur in front is fruit, not part of the job.\n\nKeep the print flat so the type does not crease. Square the panel here before it ever goes on a vehicle.",
      check: ["Read the print: JUST ICE TEA", "This is the bench, not a vehicle", "Keep the sheet flat so the type does not kink", "Use the color cards as the reference"],
      q: "What does this still show?",
      correct: "A JUST ICE TEA graphic on white film, on the shop bench.",
      wrong: "An outdoor walkaround of a Ford E-350 motorhome."
    },
    "squeegee-strokes.jpg": {
      title: "Squeegee on the Just Ice Tea sheet",
      jobType: "Vehicles",
      visual: "Same bench job. A person in a blue sleeve squeegees the white gloss sheet with a small white tool and a green felt edge. Color cards and the black JUST ICE TEA print are at the top. A peach with a green leaf is in the foreground. The sheet sits in a wood frame.",
      narration: "The hand is squeegeeing the JUST ICE TEA sheet on the bench. The black print is already on the film. A peach sits in the foreground and is not part of the graphic.\n\nOverlap the strokes so air moves ahead of the felt. Do not crease the type. This is still the table, not a vehicle panel.",
      check: ["See the squeegee on the white sheet", "Read the JUST ICE TEA print at the top", "Overlap strokes so air moves out", "Ignore the fruit in the foreground"],
      q: "What is the hand doing?",
      correct: "Squeegeeing the white JUST ICE TEA sheet on the bench.",
      wrong: "Installing a graphic on the side of a motorhome."
    },
    "architectural-wall-wrap-squeegee-sequence.jpg": {
      title: "Squeegee on grey wood-grain",
      jobType: "Interior",
      visual: "A hand presses a white squeegee with a yellow felt edge onto vertical grey wood-grain panels. Knots and grain lines are in the film. A black sleeve shows at the lower right.",
      narration: "The tool is a white squeegee with a yellow felt edge, and the film is grey wood-grain. The stroke runs along the seam between boards.\n\nOverlap the passes so air moves out ahead of the felt. The felt keeps the printed grain from getting scratched. A hard dry blade will crease the print.",
      check: ["Name the film: grey wood-grain", "Use the felt edge on the printed face", "Overlap strokes along the seam", "Do not scratch the grain with a hard blade"],
      q: "What is the hand doing?",
      correct: "Seating grey wood-grain wall film with a white squeegee and a yellow felt edge.",
      wrong: "Knife-trimming glossy magenta film in a corner."
    },
    "architectural-wall-vinyl-panel-using-heat-to-remove-fingers.jpg": {
      title: "Hand lifts a wood-grain seam",
      jobType: "Interior",
      visual: "Vertical grey wood-grain panels. A hand with a ring lifts a vertical edge so a finger of film stands off the wall. A small metal tool lies on the panel. A blurred grey sleeve fills the foreground.",
      narration: "The film is grey wood-grain. The hand is lifting a finger along a vertical seam instead of mashing it. A small metal tool rests on the panel. The grey blur in front is a sleeve. No heat gun is in this frame.\n\nLift the finger, chase the air out to an open edge, then squeegee from the glassed area back into the seam.",
      check: ["See the lifted wood-grain seam", "Lift the finger; do not squeegee it flat", "Chase air out to an open edge", "No heat gun is in this frame"],
      q: "What is the hand doing?",
      correct: "Lifting a wood-grain finger off the wall. A sleeve fills the foreground.",
      wrong: "Hanging brick film on stainless panels in a conference room."
    },
    "architectural-wall-wrap.jpg": {
      title: "Long wood-grain wall",
      jobType: "Interior",
      visual: "A long run of vertical grey wood-grain panels. A seam runs down the wall. Ceiling beams are overhead. The floor is bare concrete with a few film scraps near the base.",
      narration: "Grey wood-grain panels run down a long wall. The vertical seam has to stay straight or the boards will stair-step as the wall recedes. Scraps on the concrete are leftover film.\n\nRegister each panel to the last one before you glass it. Sight the seam from the far end. Pick the scraps up before the next sheet goes down.",
      check: ["Read it as a long wood-grain wall", "Keep the vertical seam straight", "Sight the run from the far end", "Pick scraps off the floor before the next panel"],
      q: "What does this wide still show?",
      correct: "A long wall of vertical grey wood-grain panels, with scraps on the concrete.",
      wrong: "A conference room with a red wall and a swatch rack."
    },
    "pickup-panels.jpg": {
      title: "Pickup with sage bottle print",
      jobType: "Vehicles",
      visual: "Crew-cab pickup in the bay. Sage-green film with repeating bottle silhouettes is on the doors and the bed side. Grey liner still hangs off the front door, the cab-bed gap, and the rear door. Black door handle, black step bar, blue propane torch on the concrete, white van behind.",
      narration: "This is the pickup. Sage film carries a bottle silhouette across the doors and the bedside. Grey liner is still hanging, so the panel is hinged, not finished. The torch is standing on the floor.\n\nLine the bottle rows up across the door, the gap, and the bed before you pull the rest of the liner. Leave the torch down until the pattern is true.",
      check: ["Name the crew-cab pickup and the bottle print", "Keep the bottle rows level across the gap", "Treat the hanging liner as a hinge", "Leave the torch on the floor until registration is true"],
      q: "Which vehicle is this, and what is still hanging?",
      correct: "A crew-cab pickup in sage bottle-print film, with grey liner still hanging.",
      wrong: "A black enclosed trailer with a tire-tread graphic."
    },
    "rear-vehicle-gate-wrap.jpg": {
      title: "White SUV rear hatch",
      jobType: "Vehicles",
      visual: "An installer in a black shirt and dark cap works the rear hatch of a white SUV. Both hands are at a horizontal chrome trim bar. White film is on the hatch and still wrinkled along the top, under the rear glass. A red high-mount lamp sits above the glass.",
      narration: "The hands are on the chrome bar of a white SUV hatch. Film above that bar is still loose under the glass. The red lamp at the top is the high-mount stop lamp.\n\nGlass the broad hatch, then feed up to the chrome. Do not stretch a bridge over the bar. Keep the blade off the chrome and off the glass gasket.",
      check: ["Name the white SUV hatch and the chrome bar", "See the loose film under the glass", "Glass the hatch before the chrome", "Keep the blade off the chrome and the glass"],
      q: "Where are the hands, and what is still loose?",
      correct: "On the chrome bar of a white SUV hatch. Film is still loose under the glass.",
      wrong: "On rivets of a black trailer."
    },
    "edge-detail.jpg": {
      title: "Escalade headlight",
      jobType: "Vehicles",
      visual: "Close-up of the pink Escalade headlight. Glossy pink film follows the lamp. You can see the thin upper light, the main lens with horizontal bars, and the lower bumper lamp. A small round mark sits on the bumper below the lamp. Chrome shows at the right edge.",
      narration: "This is the Escalade headlight, not a bumper intake. Pink film follows the black housing instead of bridging it. The upper light, the main lens, and the lower lamp are all edges.\n\nSeat the pocket before you cut. Cut into the void and leave a small tuck behind the housing. No heat tool is in this frame.",
      check: ["Name the Escalade headlight", "See the upper light, main lens, and lower lamp", "Seat the pocket before the finish cut", "Leave a tuck behind the housing"],
      q: "What lamp is in this close-up?",
      correct: "The front headlight of the pink Escalade, with film seated around the housing.",
      wrong: "A van taillight with an alcohol bottle in the frame."
    },
    "front-bumper-wrap.jpg": {
      title: "Escalade fog lamp and sensor",
      jobType: "Vehicles",
      visual: "Same pink Escalade front corner, read low. At the bottom of the frame, pink film wraps into the black fog lamp pocket. A small round parking sensor sits on the bumper above it. The headlight housing fills the top, and chrome shows at the right edge.",
      narration: "Read the lower half of this frame. Pink film wraps into the fog lamp pocket, and a round parking sensor sits in the bumper face above it.\n\nFeed the film into the pocket before you cut, and leave a small tuck. Cut the sensor opening clean, and do not bury the sensor under film.",
      check: ["Name the fog lamp pocket and the parking sensor", "Feed the pocket before the finish cut", "Leave a small tuck inside the pocket", "Keep the sensor face clear of film"],
      q: "What sits low on this pink bumper, under the headlight?",
      correct: "A fog lamp pocket, with a round parking sensor on the bumper just above it.",
      wrong: "A trailer marker light under gold film."
    },
    "office-wallpaper-wrap.jpg": {
      title: "Conference room walls",
      jobType: "Interior",
      visual: "A conference room. Charcoal wall on the left, white wall in the middle, patterned red wall on the right. An orange A-frame ladder stands against the white wall. A color-swatch board hangs on the red wall. A wood table and blue chairs fill the room. The ceiling is foil-faced insulation. A window looks into the bay.",
      narration: "This frame really is the conference room. Three wall finishes are up: charcoal, white, and patterned red. The ladder, the swatch board, the table, and the chairs are all in the picture.\n\nCompare color on the wall that will stay, not only under shop lights. Note the ladder path and the furniture before the next panel goes up.",
      check: ["Read the three walls: charcoal, white, and patterned red", "See the ladder and the swatch board", "Compare color in this room's light", "Keep the ladder path clear of the chairs"],
      q: "What room is this, and what is on the red wall?",
      correct: "A conference room. A color-swatch board hangs on the patterned red wall.",
      wrong: "A wood-grain hallway with a lifted seam and no furniture."
    },
    "measuring-bleed2.jpg": {
      title: "Tape and pencil on wood-grain film",
      jobType: "Interior",
      visual: "A yellow DeWalt tape is hooked on the top edge of dark wood-grain film. The blade shows the 2, 3, and 4 inch marks. A hand holds a white pencil on the white sheet beside the wood-grain, lined up near the 2-inch mark.",
      narration: "The tape is hooked on the wood-grain sheet. The pencil is marking the white sheet next to it, near the 2-inch line. That is a bleed mark, not a heat setting.\n\nHook the tape on a true edge, mark once, and cut to the mark. Keep grit off the face while you measure.",
      check: ["See the tape hooked on the wood-grain edge", "See the pencil on the white sheet beside it", "Read the mark near 2 inches as bleed", "Mark once; do not guess the overlap"],
      q: "What is the pencil doing?",
      correct: "Marking bleed on the white sheet beside the wood-grain film, near the 2-inch line.",
      wrong: "Setting a heat-soak time in minutes."
    },
    "demonstration-of-a-half-moon.jpg": {
      title: "Half-moon cut in white film",
      jobType: "Interior",
      visual: "A hand lifts white film. A half-moon cut at the lifted edge shows the grey adhesive face. Dark wood-grain shows underneath. A grey panel is on the right.",
      narration: "The white film is lifted so you can see a half-moon relief. The grey face in the cut is the adhesive side. Wood-grain is the surface underneath.\n\nA half-moon releases a bunch so you can seat the film without a straight slash across the face. Keep the cut only as deep as the bunch. Reseat with a soft tool.",
      check: ["See the half-moon in the lifted white film", "See wood-grain under the sheet", "Cut only as deep as the bunch", "Reseat with a soft tool"],
      q: "What cut is in this white film?",
      correct: "A half-moon relief, with the grey adhesive showing in the cut.",
      wrong: "A straight slash across a vehicle door."
    },
    "cabinet-pic-sides.jpg": {
      title: "Magenta box interior",
      jobType: "Interior",
      visual: "Looking down into a box corner. Glossy magenta film covers both vertical walls. The floor is white. Raw plywood edges show along the top. A yellow tool tip sits at the bottom of the frame.",
      narration: "Two magenta walls meet a white floor. The plywood edge on top is still bare. The corner is the lesson: film stops at the joint instead of bridging it.\n\nGlass each wall, then tuck the corner. Do not stretch one sheet across the inside angle.",
      check: ["See two magenta walls and a white floor", "See the bare plywood edge on top", "Do not bridge the inside corner", "Tuck the joint after the walls are glassed"],
      q: "What meets in this corner?",
      correct: "Two glossy magenta walls and a white floor, with bare plywood on the top edge.",
      wrong: "A vehicle door handle pocket."
    },
    "vinyl-cabinet-installed.jpg": {
      title: "Magenta box corner",
      jobType: "Interior",
      visual: "Inside a box. Glossy magenta walls meet at a corner over a white floor. Plywood edges are still bare along the top. More magenta panels sit on the table behind.",
      narration: "This is the same kind of box corner: magenta walls, white floor, bare plywood on the top edge. The seam at the corner is tight.\n\nKeep that joint a joint. Do not bridge the two walls with one stretched sheet.",
      check: ["See the magenta walls meeting the white floor", "See the bare plywood edge", "Keep the corner seam tight", "Do not bridge the inside angle"],
      q: "What is the finish in this corner?",
      correct: "Glossy magenta walls meeting a white floor, with plywood still bare on top.",
      wrong: "A finished vehicle quarter panel."
    },
    "cabinet-measure.jpg": {
      title: "Tape in a magenta box corner",
      jobType: "Interior",
      visual: "A yellow DeWalt tape is hooked in the inside corner where a glossy magenta floor meets a white side. A thumb holds the tape up the white panel, past the 7-inch mark. Magenta sheets, a spray bottle with a yellow cap, and a red lighter sit on the table behind. A plywood edge is on the right.",
      narration: "The tape starts in the corner of the magenta floor and reads up the white side. That height is the cut for the next panel. Magenta offcuts and a spray bottle are on the table, not on the box.\n\nWrite the number down before you leave the box. The side and the floor are different colors, so do not assume the box is square.",
      check: ["See the tape hooked in the magenta floor corner", "Read up the white side", "Write the measurement before you cut", "Do not treat the offcuts on the table as the panel"],
      q: "What is being measured?",
      correct: "The white side of a box, from the magenta floor corner upward.",
      wrong: "A heat-soak time on a vehicle door."
    },
    "pink-caddy-bumper-close-up.jpg": {
      title: "Escalade lower bumper slats",
      jobType: "Vehicles",
      visual: "Lower front corner of the pink Escalade. Horizontal slats are wrapped pink over black openings. Chrome trim runs beside the lamp at the right. A small circle is marked on the pink fascia. A blue hose lies on the concrete. The tire is at the right. Black honeycomb shows at the top left.",
      narration: "This is the Escalade lower bumper, not the headlight close-up. The pink slats sit over black gaps. Chrome is still bright beside the lamp. A blue hose is on the floor.\n\nWork each slat on its own. Do not stretch one sheet across the openings. Keep the chrome unscored.",
      check: ["Name the pink bumper slats", "See the black gaps behind the slats", "Keep the chrome trim clean", "Do not bridge the openings"],
      q: "What is wrapped in this bumper close-up?",
      correct: "Horizontal pink slats over black openings, with chrome trim beside the lamp.",
      wrong: "A trailer rivet row."
    },
    "front-bumper-wrap-caddy.jpg": {
      title: "Escalade bumper from the floor",
      jobType: "Vehicles",
      visual: "Low view of the pink Escalade nose. Black honeycomb grille has blue tape on the left edge. Pink scraps are taped to the wall. Horizontal pink slats and a lower intake with vertical slots are wrapped. Small circular marks sit on the fascia. On the concrete: a blue hose, a seam roller with a blue handle, and a red tuck tool.",
      narration: "You are looking up at the Escalade bumper. The grille is taped. The slats and the lower intake are wrapped pink. The roller and the red tool are on the floor, not in a hand.\n\nThe intake slots need a feed, not a bridge. Pick the hose and tools up before they end up under the fascia.",
      check: ["See the honeycomb grille with blue tape", "See the wrapped slats and the lower intake", "See the roller and red tool on the floor", "Feed the intake slots; do not bridge them"],
      q: "What tools are on the floor in front of this bumper?",
      correct: "A seam roller, a red tuck tool, and a blue hose.",
      wrong: "A propane torch heating rivets."
    },
    "trailer-spot-graphics.jpg": {
      title: "Black trailer, nose still taped",
      jobType: "Vehicles",
      visual: "Black dual-axle enclosed trailer in the shop. A white slash graphic is already on the side, across the door and the rear panel. On the nose, a salmon panel is still under grey transfer tape with orange tape tabs. Diamond plate runs the lower rail. A blue and yellow step ladder, a spray bottle, and a propane torch stand on the concrete. White liner scraps are on the floor.",
      narration: "This is the black trailer. The white slash graphic on the side is already down. The salmon piece on the nose is still under transfer tape. That is a dry-fit, not a finished panel. The torch and the ladder are on the floor.\n\nRegister the salmon panel before you pull the liner. Pull the tape low and slow after the film is squeegeed. This wide shot does not show a rivet-tent close-up.",
      check: ["Name the black enclosed trailer", "See the white slash already on the side", "See the salmon nose still under transfer tape", "Leave the torch on the floor until the panel is down"],
      q: "Which graphic is finished, and which is still taped?",
      correct: "The white slash on the side is down. The salmon nose panel is still under transfer tape.",
      wrong: "A bottle-print pickup with the liner hanging off the doors."
    },
    "trailer-rivets.jpg": null,
    "kiosk-box.jpg": {
      title: "Purple kiosk with cutouts",
      jobType: "Interior",
      visual: "A purple rounded kiosk sits on a concrete post. The front face is light blue with white lines, stars, clouds, flowers, and hearts, plus an orange band and a QR code. Round holes show raw plywood. A pink Volkswagen bus with a chrome emblem is behind it.",
      narration: "The kiosk face is a printed panel with holes already cut. The plywood edge inside each hole is bare. The pink bus behind it is not the substrate.\n\nWrap or tuck each hole edge after the face is glassed. Do not leave the raw plywood flashing. Keep the print lined up with the rounded purple border.",
      check: ["See the printed face, the orange band, and the QR code", "See raw plywood inside the round holes", "Tuck or wrap each hole edge", "Do not treat the bus behind it as the job"],
      q: "What do the round holes show?",
      correct: "Raw plywood edges in a printed kiosk face.",
      wrong: "Marker lights on a trailer."
    },
    "trailer-rivets-and-marker-lights.jpg": {
      title: "Gold film peeled off its liner",
      jobType: "Vehicles",
      visual: "Close-up of a hand holding the edge of a sheet of gold film, peeled back from a white printed liner. Soft creases and air marks show in the film. No light, rivet, or panel is in the frame.",
      narration: "This frame is film handling, not an install. A hand holds gold film by its edge, just off the liner.\n\nHold the sheet by the edge so the adhesive stays clean. Do not let it fold onto itself or touch the floor. Keep the liner on the part you are not hanging yet.",
      check: ["See gold film peeled back from its liner", "Hold the sheet by the edge", "Keep adhesive off fingers and the floor", "Do not let the film fold onto itself"],
      q: "What is the hand doing in this frame?",
      correct: "Holding gold film by its edge, peeled back off the liner.",
      wrong: "Cutting a marker light out of seated film."
    },
    "wrapping-around-trailer-marking-light.jpg": {
      title: "Squeegee on gold Controltac film",
      jobType: "Vehicles",
      visual: "A hand uses a white squeegee with a green edge on gold film. The white liner being pulled reads 3M Controltac Graphic Marking System. A lighter round shape in the gold is a reflection, not a lamp.",
      narration: "The tool is a squeegee and the liner says 3M Controltac. The film is gold. Nothing in this frame is a trailer marker light.\n\nSqueegee as you pull the liner so air does not get trapped behind the sheet. Read the round highlight as a reflection, not as a lamp to cut around.",
      check: ["Read the liner: 3M Controltac", "See the squeegee on gold film", "Pull the liner as you squeegee", "Do not cut around a reflection"],
      q: "What does the liner say, and what tool is in the hand?",
      correct: "3M Controltac. A white squeegee is on gold film.",
      wrong: "Film being tucked around a trailer marker lamp."
    },
    "fleet-rv.jpg": {
      title: "RV side with a pink panel",
      jobType: "Vehicles",
      visual: "A long white RV inside a high-bay shop. A large pink and red graphic is tacked on the rear side, wrinkled, with a vertical seam. A silver multi-position ladder stands at the panel. An orange ladder is farther down the aisle. A forklift sits in the background.",
      narration: "This is the RV, inside the shop. The pink graphic is tacked and still wrinkled. Two ladders are in the aisle, and the silver one is at the work face.\n\nSet the ladder on the concrete and move it instead of overreaching. Hinge the panel, then glass it. Do not climb with the full sheet in your hands.",
      check: ["Name the white RV and the pink graphic", "See the wrinkles and the vertical seam", "See the silver ladder at the panel and the orange ladder down the aisle", "Move the ladder; do not overreach"],
      q: "Where is this RV, and what is tacked on the side?",
      correct: "Inside the shop. A wrinkled pink graphic with a vertical seam.",
      wrong: "A Jeep grille in a tight close-up."
    },
    "architectural.jpg": {
      title: "Finished office hall",
      jobType: "Interior",
      visual: "A long finished office hall. Dark blue walls, a glass corridor, a wood shelf with a teal bench, and a black kitchen with a refrigerator on the right. The floor is light grey. Ceiling lights run the length of the hall. No tools, no ladder, and no loose film are in the frame.",
      narration: "This is a finished interior, not a bay install. You can see the hall, the glass, the shelf, and the kitchen. You cannot see a seam, a squeegee, or a liner.\n\nUse it as the end look: straight lines, clean faces, nothing bridged. Do not invent a technique step that this still does not show.",
      check: ["Read it as a finished hall, not a mid-install", "See the blue wall, glass, shelf, and black kitchen", "No tools are in the frame", "Do not add a step the photo does not show"],
      q: "What stage is this interior photo?",
      correct: "A finished office hall. No tools and no loose film are visible.",
      wrong: "A wood-grain wall being squeegeed in the shop."
    },
    "cutting-vinyl-4.jpg": {
      title: "Knife in a magenta box corner",
      jobType: "Interior",
      visual: "A hand runs a knife along the inside bottom corner where glossy magenta film meets a white wall. A printed eye graphic is on the left panel. The cut is in the corner, not on an open table.",
      narration: "The blade is in the corner of a box, along the magenta film. The white wall is the guide. A graphic is already on the side panel.\n\nKeep the knife in the corner and off the show face. A fresh blade, light pressure, one pass.",
      check: ["See the knife in the magenta corner", "Use the white wall as the guide", "Keep the blade off the show face", "One light pass with a sharp blade"],
      q: "Where is the knife cutting?",
      correct: "Along the inside bottom corner of glossy magenta film in a white box.",
      wrong: "A relief cut in the middle of a flat sheet on the table."
    },
    "cutting-vinyl-5.jpg": {
      title: "Knife over white film",
      jobType: "Interior",
      visual: "A utility knife is held above a white glossy surface. A round drop of clear liquid and a few dark specks sit on the film. The blade is not in a cut.",
      narration: "The knife is hovering. The only marks on the white film are a liquid drop and specks. No relief cut is in this frame.\n\nClean the drop and the grit before the blade touches the film. A cut through dirt chews the edge.",
      check: ["See the knife above the film, not in a cut", "See the drop and the specks", "Clean the face before you cut", "Do not call this a relief cut"],
      q: "Has the blade cut the film in this still?",
      correct: "No. The knife is above white film that has a drop and specks on it.",
      wrong: "Yes. A half-moon relief is already cut."
    },
    "grey-overlay-peel-magenta-base-stack.jpg": {
      title: "Grey film lifted off pink",
      jobType: "Interior",
      visual: "A sheet of glossy grey film is lifted in a curve. Pink shows behind it. A white surface is on the right, and a fingertip is at the bottom. A thin magenta edge shows at the left.",
      narration: "Grey film is being lifted, and pink is the surface behind it. This is a peel, not a squeegee stroke.\n\nKeep the peel low so the grey sheet does not yank the layer under it. Stop if a corner of the base starts to lift.",
      check: ["See grey film lifted over pink", "Keep the peel low", "Stop if the layer under it lifts", "This is a peel, not a glass-out"],
      q: "What two colors are in this peel?",
      correct: "Glossy grey film being lifted, with pink behind it.",
      wrong: "Wood-grain film on a hallway wall."
    },
    "corngraphic.jpg": {
      title: "Printed corn close-up",
      jobType: "Vehicles",
      visual: "Extreme close-up of a printed corn-kernel graphic under a gloss surface. Two bright rectangular reflections sit on the print. A dark frame runs along the bottom.",
      narration: "The frame is filled with printed kernels. The bright rectangles are light reflections on the gloss, not holes in the print.\n\nQC this the way you QC any print: look for a lifted edge, a dirt speck, or a smear in the image. Do not read a reflection as damage.",
      check: ["See the printed corn filling the frame", "Read the bright rectangles as reflections", "Check the print for a real edge lift or speck", "Do not treat a reflection as a hole"],
      q: "What are the two bright rectangles?",
      correct: "Shop-light reflections on the gloss over the corn.",
      wrong: "Holes cut for marker lights."
    },
    "architectural-panel-cutting-excess-vinyl-after-install-1.jpg": {
      title: "Trimming wood-grain excess",
      jobType: "Interior",
      visual: "A hand holds a yellow and black knife at the edge of grey wood-grain film. A strip of excess film is lifting off the cut. The grain panels fill the background.",
      narration: "The knife is trimming leftover wood-grain film at the edge. The waste strip is already lifting.\n\nCut along the edge, not back into the finished face. Pull the waste away as you cut so the blade does not wander.",
      check: ["See the knife at the wood-grain edge", "See the excess strip lifting", "Cut the waste, not the finished face", "Pull the strip away as you cut"],
      q: "What is being cut off?",
      correct: "Excess grey wood-grain film at the edge of the panel.",
      wrong: "A rivet crown on a trailer."
    },
    "cabinet-done.jpg": {
      title: "Magenta panel with trapped air",
      jobType: "Interior",
      visual: "Inside a box, a glossy magenta panel. The surface has an orange-peel texture, a long mark, and two raised bubbles. Plywood edges frame the top and bottom. An orange edge and cardboard boxes are below.",
      narration: "The magenta face is on, but it is not clean. You can see texture and two trapped bubbles. The plywood edge is still bare.\n\nThose bubbles have to come out before this face is called done. Lift and chase them. Do not heat a bubble you have not opened a path for.",
      check: ["See the magenta face and the two bubbles", "Do not call a bubbled face finished", "Lift and chase the air", "The plywood edge is still bare"],
      q: "What is wrong with this magenta face?",
      correct: "Trapped bubbles and texture are still in the film.",
      wrong: "The face is a finished, glassed panel with nothing left to do."
    },
    "vinyl-oncabinet8.jpg": {
      title: "Magenta sheet in a plywood box",
      jobType: "Interior",
      visual: "A glossy magenta sheet lies inside a plywood box. The wood edge around it is still bare. A black can sits on the top edge. Shop light reflects on the film.",
      narration: "The magenta film is in the box, and the plywood rim is not wrapped yet. The can on the edge is in the way of the next pass.\n\nMove the can. Glass the sheet to the walls, then wrap or trim the bare wood edge so plywood does not flash.",
      check: ["See magenta film inside the plywood box", "See the bare wood rim", "Move the can off the edge", "Wrap or trim the rim after the face is down"],
      q: "What is still bare?",
      correct: "The plywood rim around the magenta sheet.",
      wrong: "A chrome door handle on an Escalade."
    },
    "torch-on-vinyl1.jpg": {
      title: "Fingers in beige film",
      jobType: "Vehicles",
      visual: "Beige film with rows of finger wrinkles down the middle. The liner is folded at the bottom and shows a 3M mark. Sky reflects at the right edge. No torch and no heat gun are in the frame.",
      narration: "The marks in this beige film are fingers. The liner is still at the bottom. There is no torch in the picture, so do not invent a temperature.\n\nLift a finger and chase it out. Do not squeegee it flat. Heat only if the film TDS calls for it, and only when a heat tool is actually in your hand.",
      check: ["See the finger rows in the beige film", "See the liner at the bottom", "No torch is in this frame", "Lift the fingers; do not mash them"],
      q: "What is in the beige film, and what tool is missing?",
      correct: "Rows of fingers. No torch is in the frame.",
      wrong: "A torch is post-heating a flat, glassed panel."
    },
    "vinyl-removal.jpg": {
      title: "Pink brick panel being peeled",
      jobType: "Interior",
      visual: "A man with a grey bun, beard, black shirt, and jeans crouches beside a pink panel printed with white brick lines. Torn film and colored scraps hang off the right edge. A dark brick column is on the left. Social-media buttons and the line “Then it's much harder to remove” are printed on the image.",
      narration: "The person is at a pink brick-pattern panel, and the film on the right is already torn into scraps. The follow buttons and the caption are part of this screenshot.\n\nThe torn edge is the lesson. Pull in a sheet, low and slow. Once it shreds into strips, the peel takes longer. Do not treat the on-screen buttons as part of the job.",
      check: ["See the pink brick-pattern panel", "See the torn scraps on the right", "Pull in a sheet instead of shredding it", "Ignore the social buttons printed on the image"],
      q: "What is happening to the pink panel?",
      correct: "Film is torn and hanging off a pink brick-pattern panel.",
      wrong: "A squeegee is glassing a new graphic onto a van."
    },
    "dull-blade-cut.jpg": {
      title: "Knife in bunched gold film",
      jobType: "Vehicles",
      visual: "Fingers pinch bunched gold film while a white-handled knife tip is buried in the gather. The sheet behind the hand is the same gold film. No clean cut line is visible.",
      narration: "The film is bunched, and the knife is stuck in the gather. That is how a dull or buried blade chews an edge.\n\nRelax the bunch, then cut with the tip on a flat path. If the blade drags, snap to a fresh one before you continue.",
      check: ["See the knife buried in bunched gold film", "Flatten the bunch before you cut", "Snap the blade if it drags", "Do not saw through a gather"],
      q: "Why is this cut in trouble?",
      correct: "The knife is buried in bunched gold film instead of a flat edge.",
      wrong: "The blade is making a clean relief on a flat white sheet."
    }
  };

  BY["trailer-rivets.jpg"] = BY["trailer-spot-graphics.jpg"];

  function baseName(p) {
    if (!p) return "";
    var s = String(p).split("?")[0];
    var i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\"));
    return (i >= 0 ? s.slice(i + 1) : s).toLowerCase();
  }

  function applyOne(it) {
    if (!it) return;
    var key = baseName(it.image || it.still || it.thumb || it.media || "");
    var row = BY[key];
    if (!row) return;
    it.title = row.title;
    it.jobType = row.jobType;
    it.visual = row.visual;
    it.narration = row.narration;
    it.checklist = row.check.slice();
    it.quiz = { q: row.q, correct: row.correct, wrong: row.wrong };
  }

  function apply() {
    var d = window.WRAP911_DATA;
    if (!d || !d.photoLessons) return;
    for (var i = 0; i < d.photoLessons.length; i++) applyOne(d.photoLessons[i]);
  }

  /* 2.6.4: license-gate calls this once more after photos-pack/boost land, so late items get their caption on every load. */
  window.WRAP911_CAPTIONS_APPLY = apply;
  apply();
  document.addEventListener("DOMContentLoaded", apply);
  setTimeout(apply, 0);
  setTimeout(apply, 300);
  setTimeout(apply, 900);
  setTimeout(apply, 1800);
})();
