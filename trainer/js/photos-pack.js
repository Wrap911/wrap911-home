/* Remap deleted stills onto real bay files already in the repo. */
(function () {
  window.WRAP911_PACK = 1;
  var d = window.WRAP911_DATA;
  if (!d) return;

  var MAP = {
    "media/videos/trailer/magenta-trailer-rivet-row-channel-detail.jpg": "media/videos/trailer/trailer-rivets-and-marker-lights.jpg",
    "media/videos/trailer/magenta-rivet-field-tented-heads.jpg": "media/videos/trailer/wrapping-around-trailer-marking-light.jpg",
    "media/videos/fleet/finished-pickup-walkaround-red-sox-theme.jpg": "../assets/sales/pickup-panels.jpg",
    "media/videos/fleet/dusty-rose-gmc-rear-quarter-hang.jpg": "media/videos/fleet/pink-caddy-wrap4.jpg",
    "media/videos/prep/magenta-strip-prep-alcohol-wipe-ready.jpg": "media/videos/prep/translucent-vinyl.jpg",
    "media/videos/rv-bus/rv-side-panel-hang-roofline-view.jpg": "../assets/sales/fleet-rv.jpg",
    "media/videos/rv-bus/class-c-rv-stripe-walkaround-ford-e-350.jpg": "../assets/sales/architectural.jpg",
    "media/videos/architectural/hand-seat-corner-knife-trim.jpg": "media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.jpg",
    "media/videos/architectural/architectural-brick-film-stainless-panel-hang.jpg": "media/videos/architectural/architectural-wall-wrap.jpg",
    "media/videos/architectural/kiosk-brick-film-corner-knife-trim.jpg": "media/photos/gallery/kiosk-box.jpg",
    "media/videos/trailer/magenta-neon-corner-riveted-trim-finish.jpg": "media/photos/gallery/trailer-spot-graphics.jpg",
    "media/videos/van/d-pillar-taillight-mid-install.jpg": "media/videos/van/rear-vehicle-gate-wrap.jpg",
    "media/videos/trailer/showing-rivets.jpg": "media/videos/trailer/trailer-rivets-and-marker-lights.jpg",
    "media/videos/trailer/donuts-trailer-side-graphic-hang-stage.jpg": "../assets/sales/trailer-rivets.jpg",
    "media/videos/trailer/orange-99-month-ladder-tall-side-hang.jpg": "../assets/sales/fleet-rv.jpg",
    "media/videos/trailer/orange-99-month-ladder-roofline-seat.jpg": "../assets/sales/edge-detail.jpg",
    "media/videos/trailer/orange-side-door-recess-ladder-trim.jpg": "../assets/sales/fleet-rv.jpg",
    "media/videos/van/carbon-fiber-pattern-bumper-recess-seat.jpg": "media/photos/gallery/front-bumper-wrap-caddy.jpg",
    "media/videos/van/white-liftgate-recess-tuck.jpg": "media/videos/van/rear-vehicle-gate-wrap.jpg",
    "media/videos/fleet/jolly-time-news-van-fleet-side-qc.jpg": "media/videos/qc/corngraphic.jpg",
    "media/videos/fleet/seam-peel-rework-zest-life.jpg": "media/videos/fleet/graphic-installation-1.jpg",
    "media/videos/fleet/fleet-van-seam-tuck.jpg": "media/videos/van/rear-vehicle-gate-wrap.jpg",
    "media/videos/prep/handling-vinyl.jpg": "media/videos/prep/vinyl-cutting1.jpg",
    "media/videos/prep/strip-handling-weeding-stage.jpg": "media/videos/prep/grey-overlay-peel-magenta-base-stack.jpg",
    "media/videos/architectural/architectural-cutting-vinyl-around-hinges.jpg": "media/videos/architectural/architectural-panel-cutting-excess-vinyl-after-install-2.jpg",
    "media/videos/architectural/architectural-post-heating-vinyl-2.jpg": "media/videos/architectural/architectural-wall-wrap-squeegee-sequence.jpg",
    "media/videos/architectural/architectural-vinyl-panel-pre-install-prep.jpg": "media/videos/architectural/architectural-wall-wrap.jpg",
    "media/videos/architectural/architectural-wall-panel-install-dust-tack.jpg": "media/videos/architectural/vinyl-cabinet-installed.jpg",
    "media/videos/rv-bus/blue-rv-wrap.jpg": "../assets/sales/fleet-rv.jpg",
    "media/videos/rv-bus/rv-side-hang-3m-controltac.jpg": "../assets/sales/fleet-rv.jpg",
    "media/videos/rv-bus/smith-field-food-truck.jpg": "../assets/sales/pickup-panels.jpg"
  };

  var KEYS = ["still", "image", "poster", "thumb", "thumbnail", "photo", "hero", "media", "posterUrl", "imageUrl"];

  function remapOne(obj) {
    if (!obj) return;
    KEYS.forEach(function (k) {
      var v = obj[k];
      if (!v) return;
      if (MAP[v]) obj[k] = MAP[v];
    });
  }

  function remapList(list) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) remapOne(list[i]);
  }

  remapList(d.photoLessons);
  remapList(d.VIDEO_CATALOG);
  remapList(d.videos);
  remapList(d.trainingLessons);
  remapList(d.gallery);
  remapList(d.practiceScenarios);

  if (!d.photoLessons) d.photoLessons = [];
  var extra = [
    { id:"pk-rivet-row", title:"Marker light under gold film", image:"media/videos/trailer/trailer-rivets-and-marker-lights.jpg", module:"cutting", jobType:"Trailer",
      visual:"Gold Controltac over a round marker light. The light gets cut out.",
      narration:"Seat the film around the housing. Cut the light out. Do not bridge it, and do not call it a rivet.",
      checklist:["Name the marker light","Seat the film around it","Cut the light out","Do not bridge the housing"],
      quiz:{q:"What is the round piece under the gold film?",correct:"A marker light that gets cut out.",wrong:"A rivet head to press and purge."} },
    { id:"pk-lamp-wrap", title:"Wrapping around a trailer marker light", image:"media/videos/trailer/wrapping-around-trailer-marking-light.jpg", module:"cutting", jobType:"Trailer",
      visual:"Film working around a trailer marker lamp.",
      narration:"Tuck toward the housing. Fresh blade. Leave a hair to tuck, then heat-set per TDS.",
      checklist:["Tuck toward the housing","Fresh blade","Leave a small tuck","Heat-set per TDS"],
      quiz:{q:"Flush-cut at a marker lamp. Risk?",correct:"Cold shrink shows OEM color.",wrong:"The lamp gets brighter."} },
    { id:"pk-pickup", title:"Pickup side panels in the bay", image:"../assets/sales/pickup-panels.jpg", module:"squeegee", jobType:"Fleet",
      visual:"Pickup flanks mid-wrap.",
      narration:"Long side panels want layout and a level hang. Do not chase heat down the bed.",
      checklist:["Level the hang","Glass the door and bed","Watch the character line","Raking light at the end"],
      quiz:{q:"First read on a pickup side?",correct:"Level hang and the character line.",wrong:"Heat the whole bed so the film goes soft."} },
    { id:"pk-edge", title:"Edge and channel detail", image:"../assets/sales/edge-detail.jpg", module:"cutting", jobType:"Trailer",
      visual:"Channel and edge where film wants to bridge.",
      narration:"Feed the channel. Do not stretch across it. Finish-trim off the show face.",
      checklist:["Feed the channel","No bridge","Trim off the show face","Post-heat the edge"],
      quiz:{q:"Channel in the panel. Move?",correct:"Feed film in. Do not bridge.",wrong:"Pull tight so the channel disappears."} },
    { id:"pk-tall", title:"Tall side — height and long panel", image:"../assets/sales/fleet-rv.jpg", module:"squeegee", jobType:"Tall side",
      visual:"Tall commercial side in the yard.",
      narration:"Height is a layout problem. Stage the panel. Two people on a long hang. TDS heat only.",
      checklist:["Stage the panel","Two people on a long hang","Keep the graphic level","Heat only to TDS"],
      quiz:{q:"Who hangs a tall long panel?",correct:"Two people. One sets, one follows.",wrong:"One person with more heat."} },
    { id:"pk-interior-sales", title:"Interior wall — finished face", image:"../assets/sales/architectural.jpg", module:"architectural", jobType:"Interior",
      visual:"Finished interior face.",
      narration:"Same film rules as the bay. Layout, plumb, sequence. Dust is the enemy under lights.",
      checklist:["Dust the wall","Plumb the first sheet","Overlap squeegee strokes","Raking light"],
      quiz:{q:"What ruins an interior wall?",correct:"Dust under the film.",wrong:"Not enough torch on the field."} },
    { id:"pk-cut4", title:"Table cut — square the sheet", image:"media/videos/prep/cutting-vinyl-4.jpg", module:"cutting", jobType:"Fleet",
      visual:"Cutting vinyl on the table.",
      narration:"Square the sheet before it leaves the table. Fresh blade. Cut the liner side you planned.",
      checklist:["Fresh blade","Square the sheet","Cut once","Bag the scrap"],
      quiz:{q:"Why square on the table?",correct:"A crooked sheet becomes a crooked hang.",wrong:"So the torch heats even."} },
    { id:"pk-cut5", title:"Relief cut before the hang", image:"media/videos/prep/cutting-vinyl-5.jpg", module:"cutting", jobType:"Fleet",
      visual:"Relief cut in film.",
      narration:"Relief first on inside corners. Do not stretch a corner around a box.",
      checklist:["Mark the corner","Relief first","Seat one face","Then the next"],
      quiz:{q:"Inside corner. First cut?",correct:"Relief, then one face at a time.",wrong:"Stretch the sheet around the box."} },
    { id:"pk-grey", title:"Overlay peel — two-color stack", image:"media/videos/prep/grey-overlay-peel-magenta-base-stack.jpg", module:"film-types", jobType:"Fleet",
      visual:"Grey overlay peeling off a magenta base.",
      narration:"Peel low and slow. Stop if a corner lifts. Do not yank a stack and take the base with it.",
      checklist:["Low pull","Stop if a corner lifts","Keep the base seated","Bag the overlay"],
      quiz:{q:"Overlay starts to lift the base. Move?",correct:"Stop. Reseat the base. Then peel again.",wrong:"Rip faster so it comes off in one sheet."} },
    { id:"pk-corn", title:"Printed graphic QC", image:"media/videos/qc/corngraphic.jpg", module:"post-heat", jobType:"Fleet",
      visual:"Printed corn graphic on a panel.",
      narration:"QC is raking light and edge check. Look for tents, dirt specks, and a lifted print edge.",
      checklist:["Raking light","Check print edges","Look for tents","Note anything before the truck leaves"],
      quiz:{q:"When is QC?",correct:"Before the truck leaves the bay.",wrong:"After the first rain."} },
    { id:"pk-cab-inst", title:"Cabinet face installed", image:"media/videos/architectural/vinyl-cabinet-installed.jpg", module:"architectural", jobType:"Interior",
      visual:"Cabinet face after the hang.",
      narration:"Door gap stays a door gap. Do not bridge it. Hinge side last.",
      checklist:["No bridge on the door gap","Hinge side last","Clean the cut edge","Check the close"],
      quiz:{q:"Door gap. Rule?",correct:"Leave the gap. Do not bridge it.",wrong:"Stretch film across so the box looks sealed."} },
    { id:"pk-heat-fingers", title:"Heat fingers on an interior panel", image:"media/videos/architectural/architectural-wall-vinyl-panel-using-heat-to-remove-fingers.jpg", module:"heat", jobType:"Interior",
      visual:"Heat used to pull fingers out of wall film.",
      narration:"Fingers come out with TDS heat and a reset, not a hard mash. Keep the torch moving.",
      checklist:["Heat to TDS","Lift and reset","Keep the torch moving","Do not mash a dry finger"],
      quiz:{q:"Dry finger in wall film. Move?",correct:"Warm to TDS, lift, reset.",wrong:"Mash it flat so the gloss matches."} }
  ];

  var have = {};
  for (var i = 0; i < d.photoLessons.length; i++) have[d.photoLessons[i].id] = 1;
  for (var j = 0; j < extra.length; j++) {
    if (!have[extra[j].id]) d.photoLessons.push(extra[j]);
  }
})();
