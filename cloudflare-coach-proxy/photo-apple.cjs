/* Rules the LIVE wrap911-coach-proxy worker needs before iOS Photo Fix can succeed.
   This file is not the worker and is not deployed.
   Do not `wrangler deploy` worker.js from this branch: that script is not the live worker
   and a deploy would remove POST /coach/photo and the live POST /license/apple. */
var DEVICE_RE = /^[A-Za-z0-9-]{8,64}$/;
var JPEG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/=\s]+$/;
var PHOTO_MAX = 1800000;
var PHOTO_FRAMES = 4;

var PHOTO_PROMPT = [
  "You diagnose a commercial vinyl wrap photo, or up to four frames from a short video, for a WRAP 911 installer.",
  "Brands ONLY: 3M, Avery Dennison, and BriteLine. Never name Arlon or any other film brand. If the film is unknown, say \"the film on the TDS\".",
  "Gerardo (Gerry) is an installer, not a shop owner. Never say that he owns or runs a shop.",
  "NEVER invent application temperatures, post-heat numbers, stretch percentages, dwell times, or chemical recipes. Point those to the current TDS for that exact SKU.",
  "Reply with JSON only, no markdown, using keys shows, causes, fix, prevention, and strip.",
  "Keep it short enough to read on a phone."
].join("\n");

/* saved is the KV object at apple:{originalTransactionId} after the live issuer runs.
   Pack: codes is four crew codes and code is codes[0]. Seat: codes is [] and code is "".
   Neither record has the buying phone on a code. deviceCode is the new field. */
function ensureDeviceAccess(saved, device, alloc, purchase, expiresAt) {
  if (!saved || (saved.sku !== "pack" && saved.sku !== "seat")) {
    return { error: "Unknown product.", status: 400 };
  }
  if (!DEVICE_RE.test(String(device || ""))) return { error: "Missing device.", status: 400 };
  var record = {
    sku: saved.sku,
    productId: saved.productId || "",
    codes: Array.isArray(saved.codes) ? saved.codes.slice() : [],
    code: saved.code || (Array.isArray(saved.codes) && saved.codes[0]) || "",
    deviceCode: saved.deviceCode || "",
    expiresAt: saved.expiresAt || expiresAt,
    environment: saved.environment || ""
  };
  var created = [];
  if (!record.deviceCode) {
    record.deviceCode = alloc();
    created.push({
      code: record.deviceCode,
      rec: {
        seats: 1,
        used: 1,
        devices: [device],
        sku: "seat",
        createdAt: purchase,
        expiresAt: record.expiresAt,
        revoked: false,
        source: "apple-device"
      }
    });
  }
  return { record: record, created: created, bindDevice: device };
}

/* Restore on a different phone moves the buyer's one device seat. Crew codes stay empty. */
function bindBuyerDevice(rec, device) {
  var next = {
    seats: 1,
    used: 1,
    devices: [device],
    sku: rec && rec.sku ? rec.sku : "seat",
    createdAt: rec && rec.createdAt,
    expiresAt: rec && rec.expiresAt,
    revoked: !!(rec && rec.revoked),
    source: "apple-device"
  };
  return next;
}

function appleResponse(record) {
  return {
    ok: true,
    sku: record.sku,
    codes: record.codes || [],
    code: record.code || "",
    deviceCode: record.deviceCode || "",
    expiresAt: record.expiresAt
  };
}

function collectPhotoImages(body) {
  var list = [];
  if (body && Array.isArray(body.images) && body.images.length) list = body.images.slice();
  else if (body && body.image) list = [body.image];
  if (!list.length) return { error: "Send one photo or up to 4 video frames.", status: 400 };
  if (list.length > PHOTO_FRAMES) return { error: "Send at most 4 frames.", status: 400 };
  var i, image;
  for (i = 0; i < list.length; i++) {
    image = String(list[i] || "");
    if (!JPEG_RE.test(image) || image.length > PHOTO_MAX) {
      return { error: "Send JPEG frames, 1024px or smaller.", status: 400 };
    }
  }
  return { images: list };
}

function photoEntitled(rec, device) {
  if (!rec) return { error: "Pack or Seat required.", status: 403 };
  if (rec.revoked) return { error: "This code was turned off.", status: 410 };
  if (rec.expiresAt && Number(rec.expiresAt) < Date.now()) return { error: "This code has expired.", status: 410 };
  var known = Array.isArray(rec.devices) && device && rec.devices.indexOf(device) !== -1;
  if (!known) return { error: "This phone is not on that code.", status: 403 };
  return { ok: true };
}

var api = {
  PHOTO_PROMPT: PHOTO_PROMPT,
  PHOTO_FRAMES: PHOTO_FRAMES,
  ensureDeviceAccess: ensureDeviceAccess,
  bindBuyerDevice: bindBuyerDevice,
  appleResponse: appleResponse,
  collectPhotoImages: collectPhotoImages,
  photoEntitled: photoEntitled
};
if (typeof module !== "undefined" && module.exports) module.exports = api;
