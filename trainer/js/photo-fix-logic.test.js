/* node trainer/js/photo-fix-logic.test.js */
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var L = require("./photo-fix-logic.js");

var jpeg = "data:image/jpeg;base64,QQ==";
var body = L.photoRequestBody({
  frames: [jpeg, jpeg, jpeg, jpeg],
  code: "APPLE",
  device: "0123456789abcdef",
  appleJws: "eyJ.e30.sig",
  material: "3M",
  surface: "rivets",
  symptom: "lift"
});
assert.strictEqual(body.consent, true);
assert.deepStrictEqual(body.images.length, 4);
assert.strictEqual(body.image, undefined);
assert.strictEqual(body.code, undefined, "APPLE is not a seat code");
assert.strictEqual(body.appleJws, "eyJ.e30.sig");

var one = L.photoRequestBody({
  frames: [jpeg],
  code: "w911-abcd-efgh",
  appleJws: "nope"
});
assert.strictEqual(one.image, jpeg);
assert.strictEqual(one.images, undefined);
assert.strictEqual(one.code, "W911-ABCD-EFGH");
assert.strictEqual(one.appleJws, undefined);
assert.strictEqual(L.needsAppleRestore(one, true), false);
assert.strictEqual(L.needsAppleRestore(body, true), false);
assert.strictEqual(L.needsAppleRestore(L.photoRequestBody({ frames: [jpeg] }), true), true);
assert.strictEqual(L.needsAppleRestore(L.photoRequestBody({ frames: [jpeg] }), false), false);

var root = path.join(__dirname, "..", "..");
function read(rel) { return fs.readFileSync(path.join(root, rel), "utf8"); }
var photo = read("trainer/js/photo-fix.js");
var index = read("trainer/index.html");
var plist = read("ios/App/App/Info.plist");
var proj = read("ios/App/App.xcodeproj/project.pbxproj");
var config = read("trainer/js/config.js");
["buy.stripe.com", "unlock-code", "Arlon", "wrap911.com/"].forEach(function (bad) {
  assert.strictEqual(photo.indexOf(bad), -1, "photo-fix.js contains " + bad);
});
assert.ok(photo.indexOf("appleJws") !== -1);
assert.ok(photo.indexOf("videoFrames") !== -1);
assert.ok(index.indexOf('id="goto-photo-fix"') !== -1);
assert.ok(index.indexOf('id="screen-photo-fix"') !== -1);
assert.ok(index.indexOf("photo-fix.js") !== -1);
assert.ok(plist.indexOf("NSCameraUsageDescription") !== -1);
assert.ok(plist.indexOf("NSPhotoLibraryUsageDescription") !== -1);
assert.ok(plist.indexOf("NSMicrophoneUsageDescription") !== -1);
assert.ok(proj.indexOf("MARKETING_VERSION = 1.2;") !== -1);
assert.ok(proj.indexOf("CURRENT_PROJECT_VERSION = 21;") !== -1);
assert.strictEqual(proj.indexOf("MARKETING_VERSION = 1.1;"), -1);
assert.strictEqual(proj.indexOf("CURRENT_PROJECT_VERSION = 20;"), -1);
assert.ok(config.indexOf("photoFix: true") !== -1);
assert.ok(config.indexOf('"photo-fix"') !== -1);
assert.ok(config.indexOf("BriteLine") !== -1);
assert.strictEqual(config.indexOf("Arlon"), -1);
["pk-door-glass", "pb-graphic", "pb-squeegee", 'id: "pl06"', 'id: "sm04"'].forEach(function (id) {
  var hay = read("trainer/js/photos-pack.js") + read("trainer/js/photos-boost.js") + read("trainer/js/data.js");
  assert.ok(hay.indexOf(id) !== -1, "missing 2.7.6 card " + id);
});
assert.ok(fs.existsSync(path.join(root, "trainer/media/videos/IMG_8345.jpeg")));
assert.ok(fs.existsSync(path.join(root, "trainer/media/videos/fleet/graphic-installation-1.jpg")));
assert.ok(fs.existsSync(path.join(root, "trainer/media/videos/prep/squeegee-strokes.jpg")));

console.log("photo-fix-logic tests ok");
