var assert = require("assert");
var fs = require("fs");
var path = require("path");
var logic = require("./job-logic.js");
var pdf = require("./job-pdf.js");

var material = logic.calcMaterial({ w: 144, h: 144, n: 1, roll: 54, rivet: 1, recess: 1, waste: 10 });
assert.strictEqual(material.sqftPanel, 144);
assert.ok(Math.abs(material.adjusted - 158.4) < 0.001);
assert.ok(Math.abs(material.linearFt - 35.2) < 0.001);
assert.strictEqual(logic.calcMaterial({ w: 10, h: 10, n: 1, roll: 48, waste: 5 }).roll, 54);
assert.strictEqual(logic.calcMaterial({ waste: 5 }).waste, 10);
assert.strictEqual(logic.calcMaterial({ waste: 40 }).waste, 20);
assert.strictEqual(logic.calcMaterial({ roll: 60, waste: 15 }).roll, 60);

assert.strictEqual(logic.starterHours({ jobType: "box-truck", adjustedSqft: 100 }), 8);
assert.strictEqual(logic.starterHours({ jobType: "van", coverage: "Partial sides" }), 4);
assert.strictEqual(logic.starterHours({ jobType: "rv-bus", adjustedSqft: 500 }), 20);
assert.ok(logic.estimateNote().indexOf("not a quote") !== -1);
assert.ok(logic.timeLabel().indexOf("estimate") !== -1);
assert.ok(logic.timeLabel().indexOf("not a quote") !== -1);
assert.strictEqual(logic.timeLabel().indexOf("\u2014"), -1);

var now = Date.now();
assert.strictEqual(logic.seatOrPack({ sku: "seat", expiresAt: now + 1000 }, now), true);
assert.strictEqual(logic.seatOrPack({ sku: "pack", expiresAt: now + 1000 }, now), true);
assert.strictEqual(logic.seatOrPack({ sku: "pass", expiresAt: now + 1000 }, now), false);
assert.strictEqual(logic.seatOrPack({ sku: "seat", expiresAt: now - 1000 }, now), false);
assert.strictEqual(logic.seatOrPack({ sku: "field", expiresAt: now + 1000 }, now), false);

var scrubbed = logic.scrubPhotoText("Definitely Arlon at 180 F. Guaranteed diagnosis.");
assert.strictEqual(scrubbed.indexOf("Arlon"), -1);
assert.strictEqual(scrubbed.indexOf("180"), -1);
assert.ok(/likely cause/i.test(scrubbed));
assert.ok(/^Likely cause:/.test(logic.asLikelyCause("The edge is lifting.")));
assert.strictEqual(logic.formatClock(65000), "1:05");

var tiny = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
var bytes = pdf.buildJobPdf({
  finished: true,
  jobType: "Box truck",
  coverage: "Partial sides",
  brand: "3M",
  filmLine: "cast film",
  filmLot: "LOT42",
  hoursLabel: "Time estimate: 8 hours. This is an estimate, not a quote.",
  materialLines: ["Material sq ft with waste: 158.40", "Linear feet on a 54 inch roll: 35.2"],
  steps: [{ title: "Panel Measurement", done: true, times: ["1:05"] }],
  notes: "Hinge the side. Follow the film TDS.",
  photos: [{ slot: "Before", bytes: tiny }]
});
var text = Buffer.from(bytes).toString("latin1");
assert.ok(text.indexOf("%PDF-1.4") === 0);
assert.ok(text.indexOf("LOT42") !== -1);
assert.ok(text.indexOf("Panel Measurement") !== -1);
assert.ok(text.indexOf("not a quote") !== -1);
assert.ok(text.indexOf("Before") !== -1);
assert.ok(text.indexOf("%%EOF") !== -1);

var root = path.join(__dirname, "..");
var indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
["job-film-line", "job-film-lot", "job-calc-w", "job-calc-roll", "job-hours", "job-before-cam", "job-after-lib", "job-fix", "job-check-go", "job-export", "job-completed"].forEach(function (id) {
  assert.ok(indexHtml.indexOf('id="' + id + '"') !== -1, id);
});
assert.ok(indexHtml.indexOf("js/job-logic.js") !== -1);
assert.ok(indexHtml.indexOf("js/jobs-plus.js") !== -1);
assert.ok(indexHtml.indexOf("js/job-pdf.js") !== -1);

var jobsPlus = fs.readFileSync(path.join(__dirname, "jobs-plus.js"), "utf8");
assert.strictEqual(jobsPlus.indexOf("\u2014"), -1);
assert.ok(!/Arlon|Dunkin|buy\.stripe|green vinyl/i.test(jobsPlus));
assert.ok(jobsPlus.indexOf("not a guaranteed diagnosis") !== -1);
assert.ok(jobsPlus.indexOf("not stored") !== -1);
assert.ok(jobsPlus.indexOf("Fix a Problem") !== -1);
assert.ok(jobsPlus.indexOf("JOB_PHOTO_API_KEY") === -1, "the app does not name the secret");
assert.ok(!/\d+\s*°/.test(jobsPlus));

var plist = fs.readFileSync(path.join(root, "../ios/App/App/Info.plist"), "utf8");
assert.ok(plist.indexOf("before and after") !== -1);
assert.ok(plist.indexOf("The video file is not uploaded.") !== -1);
assert.ok(plist.indexOf("\u2014") === -1);

console.log("job-logic tests ok");
