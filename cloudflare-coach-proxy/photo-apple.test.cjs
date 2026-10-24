/* node cloudflare-coach-proxy/photo-apple.test.js */
var assert = require("assert");
var P = require("./photo-apple.cjs");

var jpeg = "data:image/jpeg;base64," + "abcd";
var device = "0123456789abcdef";
var other = "fedcba9876543210";
var n = 0;
function alloc() {
  n += 1;
  return "W911-DEV" + n + "-000" + n;
}

var packSaved = {
  sku: "pack",
  productId: "com.wrap911.trainer.pack.12mo",
  codes: ["W911-CREW-0001", "W911-CREW-0002", "W911-CREW-0003", "W911-CREW-0004"],
  code: "W911-CREW-0001",
  expiresAt: Date.now() + 86400000
};
var seatSaved = {
  sku: "seat",
  productId: "com.wrap911.trainer.seat.12mo",
  codes: [],
  code: "",
  expiresAt: packSaved.expiresAt
};

var pack = P.ensureDeviceAccess(packSaved, device, alloc, Date.now(), packSaved.expiresAt);
assert.strictEqual(pack.record.codes.length, 4);
assert.strictEqual(pack.record.code, "W911-CREW-0001", "1.1 still reads the first crew code");
assert.ok(pack.record.deviceCode);
assert.notStrictEqual(pack.record.deviceCode, pack.record.code);
assert.deepStrictEqual(pack.created[0].rec.devices, [device]);
assert.strictEqual(pack.created[0].rec.seats, 1);

var seat = P.ensureDeviceAccess(seatSaved, device, alloc, Date.now(), seatSaved.expiresAt);
assert.deepStrictEqual(seat.record.codes, []);
assert.strictEqual(seat.record.code, "");
assert.ok(seat.record.deviceCode);
assert.deepStrictEqual(seat.created[0].rec.devices, [device]);

var again = P.ensureDeviceAccess(seat.record, other, alloc, Date.now(), seatSaved.expiresAt);
assert.strictEqual(again.created.length, 0, "restore reuses the buyer code");
assert.strictEqual(again.record.deviceCode, seat.record.deviceCode);
var moved = P.bindBuyerDevice(seat.created[0].rec, other);
assert.deepStrictEqual(moved.devices, [other]);
assert.strictEqual(P.photoEntitled(moved, other).ok, true);
assert.strictEqual(P.photoEntitled(moved, device).status, 403);

var crewRec = { seats: 1, used: 0, devices: [], expiresAt: Date.now() + 1000 };
assert.strictEqual(P.photoEntitled(crewRec, device).status, 403, "a crew code with no device is not Photo Fix");

var pub = P.appleResponse(pack.record);
assert.strictEqual(pub.code, "W911-CREW-0001");
assert.strictEqual(pub.deviceCode, pack.record.deviceCode);

var one = P.collectPhotoImages({ image: jpeg, images: undefined });
assert.deepStrictEqual(one.images, [jpeg]);
var four = [jpeg, jpeg, jpeg, jpeg];
var clip = P.collectPhotoImages({ image: jpeg, images: four });
assert.strictEqual(clip.images.length, 4, "video frames win over the single image");
assert.strictEqual(P.collectPhotoImages({ images: four.concat([jpeg]) }).status, 400);
assert.strictEqual(P.collectPhotoImages({ image: "data:image/png;base64,aaaa" }).status, 400);
assert.strictEqual(P.collectPhotoImages({}).status, 400);

assert.ok(P.PHOTO_PROMPT.indexOf("BriteLine") !== -1);
assert.ok(P.PHOTO_PROMPT.indexOf("Never name Arlon") !== -1);
assert.ok(P.PHOTO_PROMPT.indexOf("not a shop owner") !== -1);
assert.strictEqual(P.PHOTO_FRAMES, 4);

console.log("photo-apple tests ok");
