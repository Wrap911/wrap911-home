/* How POST /coach/photo should authorize a request.
   NOT DEPLOYED. Do not `wrangler deploy` this branch over the live worker.

   The worker that is live (wrap911-coach-proxy) already has POST /coach/photo
   and POST /license/apple. /coach/photo only accepts a W911 code whose device
   is already in that code's devices array, and a single JPEG in `image`.
   /license/apple verifies the StoreKit JWS, then:
     - Shop Pack mints four extra one-seat codes and does not register this phone
     - Seat mints no code
   So a StoreKit buyer cannot call /coach/photo until the live handler uses
   authorizePhoto() below. Splice it in. Leave /license/apple's response as it
   is, so version 1.1 (build 20), which is in App Review, keeps the same claim.

   Live handlePhoto, after the JSON body is parsed:

     var access = await authorizePhoto(body, {
       now: Date.now(),
       verifyAppleJws: verifyAppleJws,
       lookupCode: async function (code) {
         var raw = await env.LICENSES.get("code:" + code);
         return raw ? JSON.parse(raw) : null;
       },
       recordStatus: function (rec) { return recordStatus(env, rec); }
     });
     if (!access.ok) {
       return json({ error: access.error, status: access.reason }, access.statusCode, corsOrigin);
     }
     if (!(await photoRateOk(env, access.rateKey))) {
       return json({ error: "Too many Photo Fix requests for this code. Try again in an hour." }, 429, corsOrigin);
     }
     // vision message content:
     //   photoUserContent(access.frames, note)
     // Replace the photo system prompt brand line with PHOTO_PROMPT_BRANDS.
     // Brands only: 3M, Avery Dennison, BriteLine. Gerardo is an installer.
*/
(function (factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(function () {
  var YEAR_MS = 365 * 86400000;
  var BUNDLE_ID = "com.wrap911.trainer";
  var PACK = "com.wrap911.trainer.pack.12mo";
  var SEAT = "com.wrap911.trainer.seat.12mo";
  var CODE_RE = /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  var JPEG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/=\s]+$/;
  var MAX_JPEG = 1800000;
  var PHOTO_PROMPT_BRANDS = "3M, Avery Dennison, and BriteLine";
  var PHOTO_PROMPT = [
    "You diagnose commercial vinyl wrap photos for a WRAP 911 installer.",
    "A request may include one photo or up to four frames from one short video, in time order. The video itself was not uploaded.",
    "Brands ONLY: " + PHOTO_PROMPT_BRANDS + ". Never name any other film brand. If the film is unknown, say \"the film on the TDS\".",
    "Gerardo (Gerry) is an installer. He does not own or run a shop. Never say that he does.",
    "NEVER invent application temperatures, post-heat numbers, stretch percentages, dwell times, or chemical recipes. Point those to the current TDS for that exact SKU.",
    "Reply with JSON only, no markdown, using these keys:",
    "- shows: what the photo likely shows",
    "- causes: array of likely causes",
    "- fix: array of step-by-step fix actions",
    "- prevention: array of how to avoid it next time",
    "- strip: when to strip and redo instead of repairing"
  ].join("\n");

  function fail(statusCode, error, reason) {
    var out = { ok: false, statusCode: statusCode, error: error };
    if (reason) out.reason = reason;
    return out;
  }

  function cleanDevice(id) {
    id = String(id || "").trim();
    return /^[A-Za-z0-9-]{8,64}$/.test(id) ? id : "";
  }

  /* Same purchase clock as the live /license/apple route. */
  function applePurchaseMs(tx) {
    var v = tx && tx.purchaseDate != null && tx.purchaseDate !== "" ? tx.purchaseDate : (tx && tx.originalPurchaseDate);
    if (typeof v === "number" && isFinite(v)) return v > 1e12 ? v : (v > 1e9 ? v * 1000 : 0);
    var n = Number(v);
    if (n > 1e12) return n;
    if (n > 1e9 && n < 1e12) return n * 1000;
    var parsed = Date.parse(String(v || ""));
    return isNaN(parsed) ? 0 : parsed;
  }

  function appleTxOk(tx, now) {
    if (!tx || tx.bundleId !== BUNDLE_ID) return null;
    if (tx.revocationDate) return null;
    var environment = String(tx.environment || "");
    if (environment !== "Sandbox" && environment !== "Production") return null;
    var product = String(tx.productId || "");
    if (product !== PACK && product !== SEAT) return null;
    var id = String(tx.originalTransactionId || "");
    if (!/^[0-9]{4,40}$/.test(id)) return null;
    var purchase = applePurchaseMs(tx);
    if (!purchase) return null;
    var expiresAt = purchase + YEAR_MS;
    if (expiresAt < now) return null;
    return { id: id, productId: product, expiresAt: expiresAt };
  }

  function collectFrames(body) {
    var list = [];
    if (body && Array.isArray(body.images) && body.images.length) list = body.images;
    else if (body && body.image) list = [body.image];
    if (!list.length) return fail(400, "Send one JPEG, or up to 4 frames from a short video.");
    if (list.length > 4) return fail(400, "Send at most 4 frames.");
    var frames = [];
    var i, image;
    for (i = 0; i < list.length; i++) {
      image = String(list[i] || "");
      if (!JPEG_RE.test(image) || image.length > MAX_JPEG) {
        return fail(400, "Send JPEG frames, 1024px or smaller.");
      }
      frames.push(image.replace(/\s/g, ""));
    }
    return { ok: true, frames: frames };
  }

  async function codeEntitlement(body, deps) {
    var code = String((body && body.code) || "").trim().toUpperCase();
    var device = cleanDevice(body && body.device);
    if (!CODE_RE.test(code)) return fail(403, "Pack or Seat required.");
    if (!deps.lookupCode) return fail(403, "Pack or Seat required.");
    var rec = await deps.lookupCode(code);
    if (!rec) return fail(403, "Pack or Seat required.", "missing");
    var status = "ok";
    if (deps.recordStatus) status = await deps.recordStatus(rec);
    if (status !== "ok") {
      return fail(410, status === "revoked" ? "This code was turned off." : "This code has expired.", status);
    }
    var known = Array.isArray(rec.devices) && device && rec.devices.indexOf(device) !== -1;
    if (!known) return fail(403, "This phone is not on that code.", "unknown-device");
    return { ok: true, via: "code", rateKey: code };
  }

  async function authorizePhoto(body, deps) {
    deps = deps || {};
    var now = typeof deps.now === "number" ? deps.now : Date.now();
    if (!body || body.consent !== true) return fail(400, "Consent is required before a photo is sent.");
    var jws = String((body && (body.appleJws || body.jws)) || "");
    if (jws.split(".").length === 3 && typeof deps.verifyAppleJws === "function") {
      try {
        var tx = await deps.verifyAppleJws(jws);
        var apple = appleTxOk(tx, now);
        if (apple) {
          var frames = collectFrames(body);
          if (!frames.ok) return frames;
          return { ok: true, via: "apple", rateKey: "apple:" + apple.id, productId: apple.productId, frames: frames.frames };
        }
      } catch (e) { /* fall through to the website seat code */ }
    }
    var byCode = await codeEntitlement(body, deps);
    if (!byCode.ok) return byCode;
    var codedFrames = collectFrames(body);
    if (!codedFrames.ok) return codedFrames;
    return { ok: true, via: "code", rateKey: byCode.rateKey, frames: codedFrames.frames };
  }

  function photoUserContent(frames, note) {
    var parts = [];
    var i;
    for (i = 0; i < frames.length; i++) {
      parts.push({ type: "image_url", image_url: { url: frames[i], detail: "high" } });
    }
    var lead = frames.length > 1
      ? "These frames are from one short video of a vinyl wrap problem, in time order. The video itself was not uploaded. Diagnose the problem. Reply with JSON only."
      : "Diagnose this vinyl wrap photo. Reply with JSON only.";
    parts.push({ type: "text", text: "Installer note (optional):\n" + String(note || "") + "\n\n" + lead });
    return parts;
  }

  return {
    YEAR_MS: YEAR_MS,
    PHOTO_PROMPT: PHOTO_PROMPT,
    PHOTO_PROMPT_BRANDS: PHOTO_PROMPT_BRANDS,
    applePurchaseMs: applePurchaseMs,
    appleTxOk: appleTxOk,
    collectFrames: collectFrames,
    authorizePhoto: authorizePhoto,
    photoUserContent: photoUserContent
  };
});
