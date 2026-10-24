/* Photo Fix request shape for the iOS app and the website trainer.
   Paid access in the app is StoreKit only. This file does not build a checkout
   link, an unlock field, or a price. The worker accepts a W911 code whose
   device is already registered, or (once the live worker is updated) appleJws
   from com.wrap911.trainer.seat.12mo / com.wrap911.trainer.pack.12mo. */
(function (factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.WRAP911_PHOTO_FIX_LOGIC = api;
})(function () {
  var CODE_RE = /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  function seatCode(code) {
    var c = String(code || "").trim().toUpperCase();
    return CODE_RE.test(c) ? c : "";
  }

  function signedJws(jws) {
    var s = String(jws || "");
    return s.split(".").length === 3 ? s : "";
  }

  function photoRequestBody(opts) {
    opts = opts || {};
    var frames = Array.isArray(opts.frames) ? opts.frames : [];
    var body = {
      consent: true,
      device: String(opts.device || ""),
      material: String(opts.material || "").slice(0, 400),
      surface: String(opts.surface || "").slice(0, 400),
      symptom: String(opts.symptom || "").slice(0, 400)
    };
    if (frames.length > 1) body.images = frames.slice(0, 4);
    else if (frames.length === 1) body.image = frames[0];
    var code = seatCode(opts.code);
    var jws = signedJws(opts.appleJws);
    if (code) body.code = code;
    if (jws) body.appleJws = jws;
    return body;
  }

  /* A StoreKit buyer has no W911 code on this phone. Without the signed
     transaction, the live worker cannot tell the purchase from a free look. */
  function needsAppleRestore(body, nativeApplePaid) {
    if (!nativeApplePaid) return false;
    body = body || {};
    return !body.appleJws && !body.code;
  }

  return {
    seatCode: seatCode,
    signedJws: signedJws,
    photoRequestBody: photoRequestBody,
    needsAppleRestore: needsAppleRestore
  };
});
