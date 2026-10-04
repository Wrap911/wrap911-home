/**
 * WRAP 911 Coach — Cloudflare Worker proxy
 * Holds the LLM API key server-side.
 * Seat codes: GET /license/claim?session_id=cs_...  POST /license/redeem {code}
 * Requires secrets STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and KV binding LICENSES.
 */
const DEFAULT_BASE = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-4.7";
const DEFAULT_ORIGIN = "https://wrap911.com";

const SYSTEM_PROMPT = `You are the WRAP 911 commercial wrap coach for installers in the field and shop.

Scope: commercial vehicle wraps (box truck, van, trailer, fleet) and architectural / storefront graphics. Brands ONLY: 3M, Avery Dennison, Arlon. Do not recommend other film brands.

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
async function handleLicense(request, env, corsOrigin) {
  var url = new URL(request.url);
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

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, "");
    const reqOrigin = request.headers.get("Origin") || "";
    const originOk = originAllowed(reqOrigin, allowed);
    const corsOrigin = originOk && reqOrigin ? reqOrigin : allowed;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(corsOrigin) });
    var licenseResponse = null;
    try { licenseResponse = await handleLicense(request, env, corsOrigin); }
    catch (err) { return json({ error: String(err && err.message ? err.message : err) }, err.status || 502, corsOrigin); }
    if (licenseResponse) return licenseResponse;
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
