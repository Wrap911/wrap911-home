/**
 * WRAP 911 Coach — Cloudflare Worker proxy
 * Holds the LLM API key server-side.
 * Seat codes: GET /license/claim?session_id=cs_...  POST /license/redeem {code}
 * Requires secrets STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and KV binding LICENSES.
 * Email restore (Apple non-renewing Shop Pack / Seat) also needs secret RESEND_API_KEY:
 *   POST /license/apple/bind {jws,email}  POST /license/restore/start {email}  POST /license/restore/verify {email,code}
 */
import { normalizeEmail, startEmailRestore, storeEmailPurchase, verifyEmailRestore } from "./license-restore.js";

const DEFAULT_BASE = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-4.7";
const DEFAULT_ORIGIN = "https://wrap911.com";

const SYSTEM_PROMPT = `You are the WRAP 911 commercial wrap coach for installers in the field and shop.

Scope: commercial vehicle wraps (box truck, van, trailer, fleet) and architectural / storefront graphics. Brands ONLY: 3M, Avery Dennison, BriteLine. Do not recommend other film brands.

Hard rules:
- NEVER invent application temperatures, post-heat targets, stretch percentages, dwell times, solvent recipes, or certification claims.
- For any number (temp, dwell, stretch %, chemical mix), tell the user to open the film maker's current TDS / Application Guide / care guide for that exact SKU and substrate.
- Prefer process-level guidance: prep, layout, glass flats first, rivets without tenting, corrugation, recesses, seams/overlaps, edges/trim, knifeless, doors/hardware reliefs, bumpers/plastic, chrome delete/pillars, post-heat discipline, QC, removal, weather staging, marine high-level only.
- If unsure, say what to check on the TDS and ask a clarifying question (vehicle part, film line, substrate).
- Keep answers practical and concise for phone use. End with a short TDS reminder when numbers or film-specific steps matter.
- You are not a substitute for manufacturer training or certifications.`;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) },
  });
}

function originAllowed(reqOrigin, allowed) {
  if (!reqOrigin) return true;
  if (reqOrigin === allowed) return true;
  if (reqOrigin === "https://wrap-911.wrap911.workers.dev") return true;
  if (reqOrigin === "https://wrap911.github.io") return true;
  if (/^https:\/\/wrap911\.github\.io$/.test(reqOrigin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.wrap911\.workers\.dev$/.test(reqOrigin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.wrap911\.com$/.test(reqOrigin)) return true;
  /* iPhone app (Capacitor WKWebView) */
  if (/^(capacitor|ionic|wrap911):\/\/localhost$/i.test(reqOrigin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(reqOrigin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(reqOrigin)) return true;
  return false;
}

var YEAR_MS = 365 * 86400000;
function skuForSession(session) {
  if (session.mode === "subscription") return "field";
  return Number(session.amount_total) >= 10000 ? "pack" : "seat";
}
function seatsForSku(sku) { return sku === "pack" ? 5 : 1; }
function makeSeatCode() {
  var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  var s = "";
  for (var i = 0; i < bytes.length; i++) s += alphabet[bytes[i] % alphabet.length];
  return "W911-" + s.slice(0, 4) + "-" + s.slice(4);
}
async function stripeGet(env, path) {
  var res = await fetch("https://api.stripe.com/v1" + path, {
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY },
  });
  var data = await res.json();
  if (!res.ok) {
    var err = new Error((data.error && data.error.message) || "Stripe error");
    err.status = res.status;
    throw err;
  }
  return data;
}
async function licenseFromSession(env, session) {
  var existing = await env.LICENSES.get("sess:" + session.id);
  if (existing) {
    var prev = JSON.parse(await env.LICENSES.get("code:" + existing));
    return { code: existing, record: prev };
  }
  var code = makeSeatCode();
  var sku = skuForSession(session);
  var now = Date.now();
  var rec = {
    seats: seatsForSku(sku),
    used: 0,
    devices: [],
    sku: sku,
    session: session.id,
    subscription: session.subscription || "",
    email: (session.customer_details && session.customer_details.email) || "",
    amount: session.amount_total || 0,
    createdAt: now,
    expiresAt: sku === "field" ? 0 : now + YEAR_MS,
    revoked: false,
  };
  await env.LICENSES.put("sess:" + session.id, code);
  await env.LICENSES.put("code:" + code, JSON.stringify(rec));
  return { code: code, record: rec };
}
/* Field ($29/mo) stays valid while the Stripe subscription is active; cached for 12 hours. */
async function fieldActive(env, rec) {
  if (!rec.subscription || !env.STRIPE_SECRET_KEY) return true;
  if (rec.subCheckedAt && Date.now() - rec.subCheckedAt < 12 * 3600000) return rec.subActive !== false;
  try {
    var sub = await stripeGet(env, "/subscriptions/" + encodeURIComponent(rec.subscription));
    rec.subActive = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
  } catch (e) {
    return rec.subActive !== false;
  }
  rec.subCheckedAt = Date.now();
  return rec.subActive;
}
async function recordStatus(env, rec) {
  if (rec.revoked) return "revoked";
  if (rec.expiresAt && Date.now() > rec.expiresAt) return "expired";
  if (rec.sku === "field" && !(await fieldActive(env, rec))) return "expired";
  return "ok";
}
function cleanDevice(id) {
  id = String(id || "").trim();
  return /^[A-Za-z0-9-]{8,64}$/.test(id) ? id : "";
}
/* Uses one seat for a new phone. The same phone again does not use another seat. */
function takeSeat(rec, deviceId) {
  if (!Array.isArray(rec.devices)) rec.devices = [];
  if (deviceId && rec.devices.indexOf(deviceId) !== -1) return true;
  if (rec.used >= rec.seats) return false;
  rec.used += 1;
  if (deviceId) rec.devices.push(deviceId);
  return true;
}
function publicRec(code, rec) {
  return { ok: true, code: code, sku: rec.sku, seats: rec.seats, used: rec.used, expiresAt: rec.expiresAt || (Date.now() + 35 * 86400000) };
}
function hexFromBuf(buf) {
  var v = new Uint8Array(buf), s = "", i;
  for (i = 0; i < v.length; i++) s += ("0" + v[i].toString(16)).slice(-2);
  return s;
}
async function stripeSignatureOk(raw, header, secret) {
  if (!header || !secret) return false;
  var parts = {};
  header.split(",").forEach(function (piece) {
    var i = piece.indexOf("=");
    if (i > 0) parts[piece.slice(0, i)] = piece.slice(i + 1);
  });
  if (!parts.t || !parts.v1) return false;
  var key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  var mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(parts.t + "." + raw));
  return hexFromBuf(mac) === parts.v1;
}
/* Apple non-renewing purchases. Pack mints four extra one-seat codes. Seat mints none.
   Same W911- code shape as /license/redeem. Sandbox and Production both verify. */
var APPLE_ROOT_G3_SHA256 = "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";
var APPLE_BUNDLE_ID = "com.wrap911.trainer";
var APPLE_PACK_SKU = "com.wrap911.trainer.pack.12mo";
var APPLE_SEAT_SKU = "com.wrap911.trainer.seat.12mo";
var APPLE_LEAF_OID = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x63, 0x64, 0x06, 0x0b, 0x01];
var APPLE_INTER_OID = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x63, 0x64, 0x06, 0x02, 0x01];
function appleFail(message, status) {
  var err = new Error(message);
  err.status = status || 400;
  err.apple = true;
  throw err;
}
function b64urlToBytes(s) {
  s = String(s || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  var bin = atob(s);
  var out = new Uint8Array(bin.length);
  var i;
  for (i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64ToBytes(s) {
  return b64urlToBytes(String(s || "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
}
function derRead(bytes, offset) {
  if (offset < 0 || offset >= bytes.length) throw new Error("der");
  var tag = bytes[offset];
  var p = offset + 1;
  var len = bytes[p++];
  if (len & 0x80) {
    var n = len & 0x7f;
    if (!n || n > 3) throw new Error("der");
    len = 0;
    while (n--) len = (len * 256) + bytes[p++];
  }
  var end = p + len;
  if (end > bytes.length) throw new Error("der");
  return { tag: tag, start: p, end: end, next: end, header: offset };
}
function derInt(bytes, start, end) {
  var v = bytes.slice(start, end);
  if (v.length && v[0] === 0) v = v.slice(1);
  if (v.length > 32) throw new Error("der");
  var out = new Uint8Array(32);
  out.set(v, 32 - v.length);
  return out;
}
function ecdsaDerToRaw(sig) {
  var seq = derRead(sig, 0);
  if (seq.tag !== 0x30) throw new Error("der");
  var r = derRead(sig, seq.start);
  var s = derRead(sig, r.next);
  if (r.tag !== 0x02 || s.tag !== 0x02) throw new Error("der");
  var raw = new Uint8Array(64);
  raw.set(derInt(sig, r.start, r.end), 0);
  raw.set(derInt(sig, s.start, s.end), 32);
  return raw;
}
function certParts(cert) {
  var outer = derRead(cert, 0);
  if (outer.tag !== 0x30) throw new Error("bad cert");
  var tbs = derRead(cert, outer.start);
  var p = tbs.start;
  if (cert[p] === 0xa0) p = derRead(cert, p).next;
  p = derRead(cert, p).next;
  p = derRead(cert, p).next;
  p = derRead(cert, p).next;
  var validity = derRead(cert, p);
  p = validity.next;
  p = derRead(cert, p).next;
  var spki = derRead(cert, p);
  var alg = derRead(cert, tbs.next);
  var bit = derRead(cert, alg.next);
  if (bit.tag !== 0x03 || cert[bit.start] !== 0) throw new Error("bad cert");
  return {
    tbs: cert.slice(tbs.header, tbs.next),
    spki: cert.slice(spki.header, spki.next),
    sig: ecdsaDerToRaw(cert.slice(bit.start + 1, bit.end)),
    validity: validity,
  };
}
function certTime(bytes, el) {
  var text = "";
  var i;
  for (i = el.start; i < el.end; i++) text += String.fromCharCode(bytes[i]);
  text = text.replace(/Z$/, "").replace(/\..*$/, "");
  var year, rest;
  if (el.tag === 0x17) {
    year = Number(text.slice(0, 2));
    year += year >= 50 ? 1900 : 2000;
    rest = text.slice(2);
  } else if (el.tag === 0x18) {
    year = Number(text.slice(0, 4));
    rest = text.slice(4);
  } else {
    throw new Error("bad cert time");
  }
  var month = Number(rest.slice(0, 2)) - 1;
  var day = Number(rest.slice(2, 4));
  var hour = Number(rest.slice(4, 6));
  var min = Number(rest.slice(6, 8));
  var sec = Number(rest.slice(8, 10)) || 0;
  return Date.UTC(year, month, day, hour, min, sec);
}
function certDatesOk(cert, parts) {
  var a = derRead(cert, parts.validity.start);
  var b = derRead(cert, a.next);
  var now = Date.now();
  if (now < certTime(cert, a) || now > certTime(cert, b)) throw new Error("cert expired");
}
function bytesInclude(hay, needle) {
  var i, j;
  for (i = 0; i + needle.length <= hay.length; i++) {
    for (j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) break;
    if (j === needle.length) return true;
  }
  return false;
}
async function sha256hexBytes(bytes) {
  return hexFromBuf(await crypto.subtle.digest("SHA-256", bytes));
}
async function certKey(parts) {
  return crypto.subtle.importKey("spki", parts.spki, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
}
async function verifyAppleJws(jws, rootSha) {
  var parts = String(jws || "").split(".");
  if (parts.length !== 3) throw new Error("bad jws");
  var header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
  if (header.alg !== "ES256" || !Array.isArray(header.x5c) || header.x5c.length < 3) throw new Error("bad jws header");
  var ders = header.x5c.slice(0, 3).map(b64ToBytes);
  if ((await sha256hexBytes(ders[2])) !== (rootSha || APPLE_ROOT_G3_SHA256)) throw new Error("untrusted root");
  var parsed = ders.map(certParts);
  var i;
  for (i = 0; i < parsed.length; i++) certDatesOk(ders[i], parsed[i]);
  if (!bytesInclude(ders[0], APPLE_LEAF_OID) || !bytesInclude(ders[1], APPLE_INTER_OID)) throw new Error("not a StoreKit certificate");
  var rootKey = await certKey(parsed[2]);
  var interKey = await certKey(parsed[1]);
  var leafKey = await certKey(parsed[0]);
  if (!(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, rootKey, parsed[1].sig, parsed[1].tbs))) throw new Error("bad certificate");
  if (!(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, interKey, parsed[0].sig, parsed[0].tbs))) throw new Error("bad certificate");
  var signed = new TextEncoder().encode(parts[0] + "." + parts[1]);
  if (!(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, leafKey, b64urlToBytes(parts[2]), signed))) throw new Error("bad signature");
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
}
function applePurchaseMs(tx) {
  var v = tx.purchaseDate != null && tx.purchaseDate !== "" ? tx.purchaseDate : tx.originalPurchaseDate;
  if (typeof v === "number" && isFinite(v)) return v > 1e12 ? v : (v > 1e9 ? v * 1000 : 0);
  var n = Number(v);
  if (n > 1e12) return n;
  if (n > 1e9 && n < 1e12) return n * 1000;
  var parsed = Date.parse(String(v || ""));
  return isNaN(parsed) ? 0 : parsed;
}
async function issueAppleSeatCodes(env, tx) {
  var product = String(tx.productId || "");
  if (product !== APPLE_PACK_SKU && product !== APPLE_SEAT_SKU) appleFail("Unknown product.", 400);
  var id = String(tx.originalTransactionId || "");
  if (!/^[0-9]{4,40}$/.test(id)) appleFail("Missing transaction.", 400);
  var key = "apple:" + id;
  var existingRaw = await env.LICENSES.get(key);
  var existing = existingRaw ? JSON.parse(existingRaw) : null;
  if (tx.revocationDate) {
    if (existing && existing.codes) {
      var r;
      for (r = 0; r < existing.codes.length; r++) {
        var prior = await env.LICENSES.get("code:" + existing.codes[r]);
        if (!prior) continue;
        var revoked = JSON.parse(prior);
        revoked.revoked = true;
        await env.LICENSES.put("code:" + existing.codes[r], JSON.stringify(revoked));
      }
    }
    appleFail("Purchase was refunded.", 410);
  }
  if (existing) return existing;
  var purchase = applePurchaseMs(tx);
  if (!purchase) appleFail("Missing purchase date.", 400);
  var expiresAt = purchase + YEAR_MS;
  if (expiresAt < Date.now()) appleFail("Purchase expired.", 410);
  var codes = [];
  if (product === APPLE_PACK_SKU) {
    var n;
    for (n = 0; n < 4; n++) {
      var code = makeSeatCode();
      while (await env.LICENSES.get("code:" + code)) code = makeSeatCode();
      await env.LICENSES.put("code:" + code, JSON.stringify({
        seats: 1, used: 0, devices: [], sku: "seat", session: "", subscription: "", email: "", amount: 0,
        createdAt: purchase, expiresAt: expiresAt, revoked: false,
      }));
      codes.push(code);
    }
  }
  var saved = {
    sku: product === APPLE_PACK_SKU ? "pack" : "seat",
    productId: product,
    codes: codes,
    expiresAt: expiresAt,
    environment: String(tx.environment || ""),
  };
  await env.LICENSES.put(key, JSON.stringify(saved));
  return saved;
}
async function handleAppleLicense(request, env, corsOrigin) {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);
  if (!env.LICENSES) return json({ error: "License store is not configured on the worker." }, 500, corsOrigin);
  var body;
  try { body = await request.json(); } catch (e) { return json({ error: "Invalid JSON" }, 400, corsOrigin); }
  try {
    var tx = await verifyAppleJws(body && body.jws);
    if (tx.bundleId !== APPLE_BUNDLE_ID) return json({ error: "Wrong app." }, 400, corsOrigin);
    var environment = String(tx.environment || "");
    if (environment !== "Sandbox" && environment !== "Production") return json({ error: "Unsupported Apple environment." }, 400, corsOrigin);
    var saved = await issueAppleSeatCodes(env, tx);
    return json({ ok: true, sku: saved.sku, codes: saved.codes, code: saved.codes[0] || "", expiresAt: saved.expiresAt }, 200, corsOrigin);
  } catch (err) {
    var status = err && err.status ? err.status : 400;
    if (status < 400 || status > 499) status = 400;
    return json({ error: err && err.apple ? String(err.message) : "Invalid Apple receipt." }, status, corsOrigin);
  }
}

/* Email restore for the non-renewing Apple Shop Pack and Seat (iOS 1.1 build 22). */
var EMAIL_RESTORE_PATHS = { "/license/apple/bind": 1, "/license/restore/start": 1, "/license/restore/verify": 1 };
async function handleEmailRestore(request, env, corsOrigin) {
  var url = new URL(request.url);
  if (!EMAIL_RESTORE_PATHS[url.pathname]) return null;
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, corsOrigin);
  if (!env.LICENSES) return json({ ok: false, error: "Email restore is not set up on the server yet.", code: "EMAIL_NOT_CONFIGURED" }, 503, corsOrigin);
  var body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: "Invalid JSON" }, 400, corsOrigin); }
  body = body || {};
  var out;
  if (url.pathname === "/license/apple/bind") out = await bindAppleEmail(body, env);
  else if (url.pathname === "/license/restore/start") out = await startEmailRestore(body, env);
  else out = await verifyEmailRestore(body, env, async function (jws) { try { return await verifyAppleJws(jws); } catch (e) { return null; } });
  return json(out[0], out[1], corsOrigin);
}
async function bindAppleEmail(body, env) {
  var email = normalizeEmail(body.email);
  if (!email) return [{ ok: false, error: "Enter a valid email." }, 400];
  var tx;
  try { tx = await verifyAppleJws(body.jws); } catch (e) { return [{ ok: false, error: "Invalid Apple receipt." }, 400]; }
  if (tx.bundleId !== APPLE_BUNDLE_ID) return [{ ok: false, error: "Wrong app." }, 400];
  var product = String(tx.productId || "");
  if (product !== APPLE_PACK_SKU && product !== APPLE_SEAT_SKU) return [{ ok: false, error: "Unknown product." }, 400];
  if (tx.revocationDate) return [{ ok: false, error: "Purchase was refunded." }, 410];
  var purchase = applePurchaseMs(tx);
  if (!purchase) return [{ ok: false, error: "Missing purchase date." }, 400];
  var expiresAt = purchase + YEAR_MS;
  if (expiresAt < Date.now()) return [{ ok: false, error: "Purchase expired." }, 410];
  var pack = product === APPLE_PACK_SKU;
  await storeEmailPurchase(env, {
    email: email,
    jws: String(body.jws || ""),
    productId: product,
    transactionId: String(tx.originalTransactionId || tx.transactionId || ""),
    purchaseDate: purchase,
    expiresAt: expiresAt,
    sku: pack ? "pack" : "seat",
    seats: pack ? 5 : 1,
  });
  return [{ ok: true, sku: pack ? "pack" : "seat", expiresAt: expiresAt }, 200];
}
async function handleLicense(request, env, corsOrigin) {
  var url = new URL(request.url);
  var restoreResponse = await handleEmailRestore(request, env, corsOrigin);
  if (restoreResponse) return restoreResponse;
  if (url.pathname === "/license/apple") return handleAppleLicense(request, env, corsOrigin);
  var isLicense = url.pathname === "/license/claim" || url.pathname === "/license/redeem" || url.pathname === "/license/check" || url.pathname === "/stripe/webhook";
  if (!isLicense) return null;
  if (url.pathname !== "/stripe/webhook" && (!env.LICENSES || (url.pathname === "/license/claim" && !env.STRIPE_SECRET_KEY))) {
    return json({ error: "License store is not configured on the worker." }, 500, corsOrigin);
  }
  if (url.pathname === "/license/claim" && request.method === "GET") {
    var sessionId = url.searchParams.get("session_id") || "";
    var dev = cleanDevice(url.searchParams.get("device"));
    if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) return json({ error: "Missing checkout session." }, 400, corsOrigin);
    var session;
    try { session = await stripeGet(env, "/checkout/sessions/" + encodeURIComponent(sessionId)); }
    catch (e) { return json({ error: "Checkout not found." }, 404, corsOrigin); }
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") return json({ error: "Payment is not complete." }, 402, corsOrigin);
    var made = await licenseFromSession(env, session);
    takeSeat(made.record, dev);
    await env.LICENSES.put("code:" + made.code, JSON.stringify(made.record));
    return json(publicRec(made.code, made.record), 200, corsOrigin);
  }
  if ((url.pathname === "/license/redeem" || url.pathname === "/license/check") && request.method === "POST") {
    var body;
    try { body = await request.json(); } catch (e) { return json({ error: "Invalid JSON" }, 400, corsOrigin); }
    var code = String((body && body.code) || "").trim().toUpperCase();
    var device = cleanDevice(body && body.device);
    if (!/^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return json({ error: "Not a WRAP 911 code." }, 400, corsOrigin);
    var raw = await env.LICENSES.get("code:" + code);
    if (!raw) return json({ error: "Code not found.", status: "missing" }, 404, corsOrigin);
    var rec = JSON.parse(raw);
    var status = await recordStatus(env, rec);
    if (status !== "ok") {
      await env.LICENSES.put("code:" + code, JSON.stringify(rec));
      return json({ error: status === "revoked" ? "This code was turned off." : "This code has expired.", status: status }, 410, corsOrigin);
    }
    if (url.pathname === "/license/check") {
      var known = Array.isArray(rec.devices) && device && rec.devices.indexOf(device) !== -1;
      if (!known) return json({ error: "This phone is not on that code.", status: "unknown-device" }, 403, corsOrigin);
      return json(publicRec(code, rec), 200, corsOrigin);
    }
    if (!takeSeat(rec, device)) return json({ error: "All " + rec.seats + " seats on this code are used.", status: "full" }, 409, corsOrigin);
    await env.LICENSES.put("code:" + code, JSON.stringify(rec));
    return json(publicRec(code, rec), 200, corsOrigin);
  }
  if (url.pathname === "/stripe/webhook" && request.method === "POST") {
    if (!env.LICENSES || !env.STRIPE_WEBHOOK_SECRET) return json({ error: "Webhook secret is not configured." }, 500, corsOrigin);
    var payload = await request.text();
    var ok = await stripeSignatureOk(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
    if (!ok) return json({ error: "Bad signature" }, 400, corsOrigin);
    var event = JSON.parse(payload);
    if (event.type === "checkout.session.completed" && event.data && event.data.object && event.data.object.payment_status === "paid") {
      await licenseFromSession(env, event.data.object);
    }
    return json({ received: true }, 200, corsOrigin);
  }
  return json({ error: "Method not allowed" }, 405, corsOrigin);
}

async function handleLead(request, env, corsOrigin, originOk) {
  var url = new URL(request.url);
  if (url.pathname !== "/lead") return null;
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);
  if (!originOk) return json({ error: "Origin not allowed" }, 403, corsOrigin);
  if (!env.LICENSES) return json({ error: "Lead store is not configured." }, 500, corsOrigin);
  var body = {};
  try { body = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, corsOrigin); }
  var email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email." }, 400, corsOrigin);
  var key = "lead:" + email;
  var prev = await env.LICENSES.get(key, "json");
  var now = new Date().toISOString();
  var rec = { email: email, source: String(body.source || "start").slice(0, 40), firstSeen: prev && prev.firstSeen ? prev.firstSeen : now, lastSeen: now, count: (prev && prev.count ? prev.count : 0) + 1 };
  await env.LICENSES.put(key, JSON.stringify(rec));
  return json({ ok: true }, 200, corsOrigin);
}

/* Photo Fix addition. Diagnoses one JPEG and does not store it. */
var PHOTO_MODEL = "grok-4.7";
var PHOTO_PER_HOUR = 8;
var PHOTO_WINDOW_MS = 3600000;
var PHOTO_PROMPT = `You diagnose one commercial vinyl wrap photo for a WRAP 911 installer.

Brands ONLY: 3M, Avery Dennison, and BriteLine. Never name any other film brand. If the film is unknown, say "the film on the TDS".
Gerardo (Gerry) is an installer. He does not own or run a shop. Never say that he does.
NEVER invent application temperatures, post-heat numbers, stretch percentages, dwell times, or chemical recipes. Point those to the current TDS for that exact SKU.

Reply with JSON only, no markdown, using these keys:
- shows: what the photo likely shows (lifting, bubbles, tenting, overstretch or discoloration, silvering, seam gaps, adhesive failure, edge lift on rivets, or say when it is not a wrap problem)
- causes: array of likely causes
- fix: array of step-by-step fix actions
- prevention: array of how to avoid it next time
- strip: when to strip and redo instead of repairing

Keep it short enough to read on a phone.`;
var OTHER_BRANDS = ["Hexis", "KPMF", "Vvivid", "Oracal", "Orafol", "Inozetek", "TeckWrap", "Teckwrap", "Cheetah", "TinyBot", "Tinybot", "Rwraps", "Metro Restyling", "General Formulations"];

function scrubPhotoText(s) {
  s = String(s || "");
  var i, re;
  for (i = 0; i < OTHER_BRANDS.length; i++) {
    re = new RegExp(OTHER_BRANDS[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    s = s.replace(re, "the film maker");
  }
  s = s.replace(/[^.]*\b(Gerardo|Gerry)\b[^.]*\b(own|owns|owner|runs|running)\b[^.]*\.?/gi, " Gerardo is an installer, not a shop owner.");
  return s.replace(/\s+/g, " ").trim();
}
function scrubList(list) {
  var out = [], i, t;
  if (!Array.isArray(list)) list = list ? [list] : [];
  for (i = 0; i < list.length; i++) {
    t = scrubPhotoText(list[i]);
    if (t) out.push(t);
  }
  return out;
}
function parsePhotoJson(text) {
  var raw = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  var start = raw.indexOf("{");
  var end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
  var data = JSON.parse(raw);
  return {
    ok: true,
    disclaimer: "AI suggestion, verify on the job.",
    shows: scrubPhotoText(data.shows || data.what || ""),
    causes: scrubList(data.causes),
    fix: scrubList(data.fix || data.steps),
    prevention: scrubList(data.prevention),
    strip: scrubPhotoText(data.strip || data.redo || ""),
  };
}
async function photoRateOk(env, code) {
  var key = "photorl:" + code;
  var now = Date.now();
  var prev = null;
  try { prev = JSON.parse((await env.LICENSES.get(key)) || "null"); } catch (e) { prev = null; }
  if (!prev || !prev.t || now - prev.t >= PHOTO_WINDOW_MS) prev = { t: now, n: 0 };
  if (prev.n >= PHOTO_PER_HOUR) return false;
  prev.n += 1;
  await env.LICENSES.put(key, JSON.stringify(prev));
  return true;
}
async function handlePhoto(request, env, corsOrigin, originOk) {
  var url = new URL(request.url);
  if (url.pathname !== "/coach/photo") return null;
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);
  if (!originOk) return json({ error: "Origin not allowed" }, 403, corsOrigin);
  if (!env.LICENSES) return json({ error: "License store is not configured." }, 500, corsOrigin);
  var body;
  try { body = await request.json(); } catch (e) { return json({ error: "Invalid JSON" }, 400, corsOrigin); }
  if (!body || body.consent !== true) return json({ error: "Consent is required before a photo is sent." }, 400, corsOrigin);
  var code = String((body && body.code) || "").trim().toUpperCase();
  var device = cleanDevice(body && body.device);
  if (!/^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return json({ error: "Pack or Seat required." }, 403, corsOrigin);
  var raw = await env.LICENSES.get("code:" + code);
  if (!raw) return json({ error: "Pack or Seat required.", status: "missing" }, 403, corsOrigin);
  var rec = JSON.parse(raw);
  var status = await recordStatus(env, rec);
  if (status !== "ok") {
    await env.LICENSES.put("code:" + code, JSON.stringify(rec));
    return json({ error: status === "revoked" ? "This code was turned off." : "This code has expired.", status: status }, 410, corsOrigin);
  }
  var known = Array.isArray(rec.devices) && device && rec.devices.indexOf(device) !== -1;
  if (!known) return json({ error: "This phone is not on that code.", status: "unknown-device" }, 403, corsOrigin);
  /* Video frames: body.images = up to 4 JPEG frames from one clip, in order. body.image (one JPEG) still works. */
  var images = Array.isArray(body.images) && body.images.length ? body.images.slice(0, 5) : [body.image];
  if (images.length > 4) return json({ error: "Send up to 4 frames." }, 400, corsOrigin);
  var totalLen = 0;
  for (var ii = 0; ii < images.length; ii++) {
    images[ii] = String(images[ii] || "");
    totalLen += images[ii].length;
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=\s]+$/.test(images[ii]) || images[ii].length > 1800000) {
      return json({ error: images.length > 1 ? "Each frame must be a JPEG, 1280px or smaller." : "Send one JPEG, 1280px or smaller." }, 400, corsOrigin);
    }
  }
  if (totalLen > 4000000) return json({ error: "Frames are too large. Send smaller frames." }, 400, corsOrigin);
  var isClip = images.length > 1;
  var image = images[0];
  if (!(await photoRateOk(env, code))) return json({ error: "Too many Photo Fix requests for this code. Try again in an hour." }, 429, corsOrigin);
  var apiKey = env.LLM_API_KEY;
  if (!apiKey) return json({ error: "Worker misconfigured: LLM_API_KEY secret not set" }, 500, corsOrigin);
  var note = "Material: " + String(body.material || "").slice(0, 400) + "\nSurface: " + String(body.surface || "").slice(0, 400) + "\nSymptom: " + String(body.symptom || "").slice(0, 400);
  var model = String(env.LLM_VISION_MODEL || PHOTO_MODEL);
  var base = String(env.LLM_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  var upstreamRes;
  try {
    upstreamRes = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: PHOTO_PROMPT },
          { role: "user", content: [
            ...images.map(function (im) { return { type: "image_url", image_url: { url: im.replace(/\s/g, ""), detail: "high" } }; }),
            { type: "text", text: "Installer note (optional):\n" + note + "\n\n" + (isClip
              ? "These " + images.length + " images are frames from ONE short video clip, in time order (first to last). Treat them as one job. Diagnose the vinyl wrap problem. Reply with JSON only."
              : "Diagnose this vinyl wrap photo. Reply with JSON only.") },
          ] },
        ],
        max_tokens: 900,
        stream: false,
      }),
    });
  } catch (err) {
    return json({ error: "Upstream fetch failed" }, 502, corsOrigin);
  }
  var text = await upstreamRes.text();
  var data;
  try { data = JSON.parse(text); } catch (e2) { return json({ error: "Upstream non-JSON", status: upstreamRes.status }, 502, corsOrigin); }
  if (!upstreamRes.ok) return json({ error: "Upstream error", status: upstreamRes.status }, 502, corsOrigin);
  var outputText = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
    ? String(data.choices[0].message.content).trim() : "";
  if (!outputText) return json({ error: "Upstream response contained no output text" }, 502, corsOrigin);
  var parsed;
  try { parsed = parsePhotoJson(outputText); }
  catch (e3) {
    parsed = { ok: true, disclaimer: "AI suggestion, verify on the job.", shows: scrubPhotoText(outputText).slice(0, 2000), causes: [], fix: [], prevention: [], strip: "" };
  }
  return json(parsed, 200, corsOrigin);
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, "");
    const reqOrigin = request.headers.get("Origin") || "";
    const originOk = originAllowed(reqOrigin, allowed);
    const corsOrigin = originOk && reqOrigin ? reqOrigin : allowed;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(corsOrigin) });
    try { var leadResponse = await handleLead(request, env, corsOrigin, originOk); if (leadResponse) return leadResponse; }
    catch (err) { return json({ error: "Could not save email." }, 500, corsOrigin); }
    var licenseResponse = null;
    try { licenseResponse = await handleLicense(request, env, corsOrigin); }
    catch (err) { return json({ error: String(err && err.message ? err.message : err) }, err.status || 502, corsOrigin); }
    if (licenseResponse) return licenseResponse;
    try { var photoResponse = await handlePhoto(request, env, corsOrigin, originOk); if (photoResponse) return photoResponse; }
    catch (err) { return json({ error: "Photo Fix is unavailable." }, 500, corsOrigin); }
    if (request.method === "GET") {
      return json({ ok: true, service: "wrap911-coach-proxy", hint: "POST coach messages. GET /license/claim. POST /license/redeem." }, 200, corsOrigin);
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);
    if (!originOk) return json({ error: "Origin not allowed" }, 403, corsOrigin);
    const apiKey = env.LLM_API_KEY;
    if (!apiKey) return json({ error: "Worker misconfigured: LLM_API_KEY secret not set" }, 500, corsOrigin);
    let payload;
    try { payload = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400, corsOrigin); }
    const incoming = Array.isArray(payload.messages) ? payload.messages : null;
    if (!incoming || !incoming.length) return json({ error: "messages array required" }, 400, corsOrigin);
    const userMsgs = incoming.filter((m) => m && m.role && m.role !== "system").slice(-12).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 8000),
    }));
    if (!userMsgs.length) return json({ error: "No user/assistant messages" }, 400, corsOrigin);
    const model = String(payload.model || env.LLM_MODEL || DEFAULT_MODEL);
    const base = String(env.LLM_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
    const upstream = {
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }].concat(userMsgs),
      max_tokens: typeof payload.max_tokens === "number" ? payload.max_tokens : 600,
      stream: false,
    };
    let upstreamRes;
    try {
      upstreamRes = await fetch(base + "/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(upstream),
      });
    } catch (err) {
      return json({ error: "Upstream fetch failed", detail: String(err && err.message ? err.message : err) }, 502, corsOrigin);
    }
    const text = await upstreamRes.text();
    let data;
    try { data = JSON.parse(text); } catch {
      return json({ error: "Upstream non-JSON", status: upstreamRes.status, detail: text.slice(0, 400) }, 502, corsOrigin);
    }
    if (!upstreamRes.ok) return json({ error: "Upstream error", status: upstreamRes.status, detail: data.error || data }, 502, corsOrigin);
    const outputText = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
      ? String(data.choices[0].message.content).trim()
      : "";
    if (!outputText) return json({ error: "Upstream response contained no output text" }, 502, corsOrigin);
    return new Response(JSON.stringify({ id: data.id, model: data.model || model, choices: [{ message: { role: "assistant", content: outputText } }], usage: data.usage }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(corsOrigin) },
    });
  },
};
export { verifyAppleJws, issueAppleSeatCodes, handleAppleLicense };

