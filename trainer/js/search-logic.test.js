/* Beginner search ranking tests. Run: node trainer/js/search-logic.test.js */
var assert = require("assert");
var path = require("path");
var Search = require("./search-logic.js");

function item(partial) {
  var title = partial.title || "";
  var keys = partial.keys || "";
  var body = partial.body || "";
  var hay = (" " + [title, keys, body].join(" ") + " ").toLowerCase();
  return {
    type: partial.type || "lesson",
    title: title,
    tl: title.toLowerCase(),
    hay: hay,
    vehicleId: partial.vehicleId || "",
    id: partial.id || ""
  };
}

var INDEX = [
  item({ id: "tr-rivet-rows", type: "lesson", title: "Trailer Rivet Rows", vehicleId: "trailer",
    keys: "Trailer rivet brush post-heat", body: "Rivet rows seated after alignment. No tents." }),
  item({ id: "bt-rivet-mastery", type: "lesson", title: "Rivet Mastery", vehicleId: "box-truck",
    keys: "Box truck rivet", body: "Set each rivet. No tents." }),
  item({ id: "van-mistake", type: "mistake", title: "Using trailer rivet slits on a van liftgate", vehicleId: "van",
    keys: "Deep Recess Van", body: "trailer rivet slits are a van liftgate mistake" }),
  item({ id: "van-deep-recess", type: "lesson", title: "Deep Recess / Liftgate Tuck", vehicleId: "van",
    keys: "Van recess finger wrinkle", body: "Tuck the liftgate recess. Work out finger wrinkles." }),
  item({ id: "bt-prep-cleaning", type: "lesson", title: "Prep & Cleaning — Dirt Traps", vehicleId: "rv-bus",
    keys: "Prep cleaning dirt", body: "Dirt traps keep film from sticking." }),
  item({ id: "sf-perf-film", type: "lesson", title: "Architectural Panel Hang", vehicleId: "storefront",
    keys: "Storefront architectural", body: "Hang the architectural panel." }),
  item({ id: "sf-weather", type: "lesson", title: "Corner Trim / Edge Finish", vehicleId: "storefront",
    keys: "Storefront corner trim edge", body: "Finish the corner and the edge." }),
  item({ id: "sf-wet-install", type: "lesson", title: "Dry Soft-Seat Recess", vehicleId: "storefront",
    keys: "Storefront window wet install glass", body: "Seat a storefront recess. Watch for silvering on glass." }),
  item({ type: "term", title: "Silvering", body: "Trapped air under the adhesive that shows as a silver haze, often around rivets and in recesses." }),
  item({ type: "term", title: "Edge lift", body: "Film edge coming up off the surface. Usually dirt, overstretch, or no post-heat at the edge." }),
  item({ type: "term", title: "PPF", body: "Paint protection film, the clear film. If an edge will not stick, clean, reseat, and heat only as that film's TDS says." }),
  item({ type: "module", title: "Surface Prep", body: "Clean the panel. Dirt and residue keep film from sticking." }),
  item({ type: "module", title: "Cutting & Edge Finish", body: "Relief cuts at a torn corner. Do not yank a tear." })
];

function top(q) {
  var hits = Search.search(INDEX, q).hits;
  assert.ok(hits.length, "expected hits for: " + q);
  return hits[0].item;
}

function topIdOrTitle(q) {
  var it = top(q);
  return it.id || it.title;
}

assert.strictEqual(Search.detectVehicle("rivets lifting trailer"), "trailer");
assert.ok(Search.tokens("bubbles won't go away").indexOf("silvering") >= 0 ||
  Search.analyze("bubbles won't go away").topics.indexOf("silvering") >= 0,
  "bubbles phrase maps to silvering");
assert.ok(Search.tokens("bubbles won't go away").indexOf("wont") < 0, "stopwords dropped");
assert.ok(Search.tokens("bubbles won't go away").indexOf("away") < 0, "away is a stopword");

assert.strictEqual(top("bubbles won't go away").title, "Silvering");
assert.strictEqual(top("film tore at the corner").title, "Corner Trim / Edge Finish");
assert.ok(["Surface Prep", "Prep & Cleaning — Dirt Traps", "Architectural Panel Hang"].indexOf(top("sticky stuff left on the wall").title) >= 0,
  "sticky residue on a wall hits prep or storefront, got " + top("sticky stuff left on the wall").title);
assert.strictEqual(top("it keeps wrinkling").id, "van-deep-recess");
assert.strictEqual(top("it won't stick by the edge").title, "Edge lift");
assert.strictEqual(top("rivets lifting trailer").id, "tr-rivet-rows");
assert.notStrictEqual(top("rivets lifting trailer").id, "van-mistake");
assert.strictEqual(top("trailer rivet slits").id === "van-mistake" ? "might still match the exact mistake title" : top("trailer rivet slits").id,
  top("trailer rivet slits").id); // just ensure search returns
assert.ok(top("dirt won't come off").title === "Surface Prep" || top("dirt won't come off").id === "bt-prep-cleaning");
assert.ok(top("film won't stick").title === "Surface Prep" || top("film won't stick").id === "bt-prep-cleaning");
assert.ok(top("silvering storefront window").vehicleId === "storefront" || top("silvering storefront window").title === "Silvering",
  "silvering storefront ranks a storefront lesson or Silvering, got " + top("silvering storefront window").title);
assert.ok(top("how do I start a storefront window").vehicleId === "storefront");
assert.ok(top("PPF").title === "PPF" || top("PPF").title === "Edge lift");
assert.ok(top("clear film lifting at the edge").title === "PPF" || top("clear film lifting at the edge").title === "Edge lift");
assert.ok(top("where do I start").title === "Surface Prep" || Search.analyze("where do I start").topics.indexOf("prep") >= 0);

console.log("search-logic.test.js: ok");
