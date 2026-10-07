/**
 * WRAP 911 license server (seat codes) — routes inside the coach-proxy Worker.
 *
 * Bindings / secrets (see README):
 *   KV namespace  LICENSES            (wrangler.toml [[kv_namespaces]])
 *   secret        STRIPE_SECRET_KEY   (only for /license/claim, web checkout)
 *
 * Routes:
 *   POST /license/apple   { jws, device }  Apple non-renewing Shop Pack / Seat -> seat code
 *                                 Not deployed with the iOS change. Pack = 5 seats, Seat = 1.
 *                                 Missing expiresDate uses purchaseDate + 365 days.
 *   GET  /license/claim?session_id=cs_...&device=...   Stripe Checkout session -> seat code
 *   POST /license/redeem  { code, device } use a seat on this phone
 *   POST /license/check   { code, device } daily re-check (403/404/410 = lock the phone)
 *
 * Code record (KV "code:W911-XXXX-XXXX"):
 *   { code, sku: "seat"|"crew"|"pack"|"field", seats, devices: [], expiresAt, source, ref }
 */
import { X509Certificate } from "@peculiar/x509";

const BUNDLE_ID = "com.wrap911.trainer";
const YEAR_MS = 365 * 86400000;
const APPLE_PRODUCTS = {
  /* Current offer: non-renewing 12-month Shop Pack and Seat. */
  "com.wrap911.trainer.pack.12mo": { sku: "pack", seats: 5 },
  "com.wrap911.trainer.seat.12mo": { sku: "seat", seats: 1 },
  /* Older auto-renewable ids, if they were ever created. */
  "com.wrap911.trainer.seat.yearly": { sku: "seat", seats: 1 },
  "com.wrap911.trainer.crew.yearly": { sku: "pack", seats: 5 },
};
function appleMillis(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && isFinite(v)) return v > 1e11 ? v : (v > 1e9 ? v * 1000 : 0);
  const n = Number(v);
  if (n > 1e11) return n;
  if (n > 1e9 && n < 1e11) return n * 1000;
  const p = Date.parse(String(v));
  return Number.isNaN(p) ? 0 : p;
}
/* Non-renewing transactions have purchaseDate and no expiresDate. */
function appleExpiry(tx) {
  const stated = appleMillis(tx.expiresDate);
  if (stated) return stated;
  const purchase = appleMillis(tx.purchaseDate);
  return purchase ? purchase + YEAR_MS : 0;
}
/* SHA-256 fingerprint of Apple Root CA - G3 (DER). */
const APPLE_ROOT_G3_SHA256 = "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";
const OID_LEAF = "1.2.840.113635.100.6.11.1";
const OID_INTERMEDIATE = "1.2.840.113635.100.6.2.1";
const CODE_RE = /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const DEVICE_RE = /^[A-Za-z0-9-]{8,64}$/;
const DAY = 86400000;

function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64ToBytes(s) { return b64urlToBytes(s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")); }
async function sha256hex(bytes) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(h, (x) => x.toString(16).padStart(2, "0")).join("");
}
/* JOSE ES256 signature is raw r||s, which is what WebCrypto ECDSA expects. */
async function verifyAppleJws(jws) {
  const parts = String(jws || "").split(".");
  if (parts.length !== 3) throw new Error("bad jws");
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0])));
  if (header.alg !== "ES256" || !Array.isArray(header.x5c) || header.x5c.length < 3) throw new Error("bad jws header");
  const [leafDer, interDer, rootDer] = header.x5c.slice(0, 3).map(b64ToBytes);
  if ((await sha256hex(rootDer)) !== APPLE_ROOT_G3_SHA256) throw new Error("untrusted root");
  const leaf = new X509Certificate(leafDer);
  const inter = new X509Certificate(interDer);
  const root = new X509Certificate(rootDer);
  const now = new Date();
  for (const c of [leaf, inter, root]) if (now < c.notBefore || now > c.notAfter) throw new Error("cert expired");
  if (!leaf.getExtension(OID_LEAF) || !inter.getExtension(OID_INTERMEDIATE)) throw new Error("not an Apple StoreKit cert");
  if (!(await inter.verify({ publicKey: await root.publicKey.export(), signatureOnly: true }))) throw new Error("chain: intermediate");
  if (!(await leaf.verify({ publicKey: await inter.publicKey.export(), signatureOnly: true }))) throw new Error("chain: leaf");
  const key = await crypto.subtle.importKey("spki", leaf.publicKey.rawData, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" }, key,
    b64urlToBytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1])
  );
  if (!ok) throw new Error("bad signature");
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
}

function newCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = new Uint8Array(8); crypto.getRandomValues(b);
  const s = Array.from(b, (x) => A[x % A.length]).join("");
  return "W911-" + s.slice(0, 4) + "-" + s.slice(4);
}
async function getRec(env, code) { return code ? await env.LICENSES.get("code:" + code, "json") : null; }
async function putRec(env, rec) { await env.LICENSES.put("code:" + rec.code, JSON.stringify(rec)); }
function pub(rec) {
  return { ok: true, code: rec.code, sku: rec.sku, seats: rec.seats, used: (rec.devices || []).length, expiresAt: rec.expiresAt };
}
/* Find or create the code for an external purchase ref; refresh expiry; put this device on it. */
async function issue(env, ref, sku, seats, expiresAt, source, device) {
  let code = await env.LICENSES.get("ref:" + ref);
  let rec = code ? await getRec(env, code) : null;
  if (!rec) {
    do { code = newCode(); } while (await env.LICENSES.get("code:" + code));
    rec = { code, sku, seats, devices: [], expiresAt, source, ref, createdAt: Date.now() };
    await env.LICENSES.put("ref:" + ref, code);
  }
  rec.sku = sku; rec.seats = seats; rec.expiresAt = Math.max(Number(rec.expiresAt) || 0, expiresAt);
  if (device && !rec.devices.includes(device) && rec.devices.length < rec.seats) rec.devices.push(device);
  await putRec(env, rec);
  return rec;
}

async function appleRoute(body, env) {
  const tx = await verifyAppleJws(body.jws);
  if (tx.bundleId !== BUNDLE_ID) return [{ ok: false, error: "Wrong app" }, 400];
  const p = APPLE_PRODUCTS[tx.productId];
  if (!p) return [{ ok: false, error: "Unknown product" }, 400];
  if (tx.revocationDate) return [{ ok: false, error: "Purchase was refunded" }, 410];
  const exp = appleExpiry(tx);
  if (!exp || exp < Date.now()) return [{ ok: false, error: "Purchase expired" }, 410];
  const ref = "apple:" + (tx.originalTransactionId || tx.transactionId);
  const rec = await issue(env, ref, p.sku, p.seats, exp, "apple-" + (tx.environment || ""), body.device);
  return [pub(rec), 200];
}

async function claimRoute(url, env) {
  const sid = url.searchParams.get("session_id") || "";
  const device = url.searchParams.get("device") || "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return [{ ok: false, error: "Bad session" }, 400];
  if (!env.STRIPE_SECRET_KEY) return [{ ok: false, error: "Seat code server is not live yet. Your payment went through. Email us and we will send your code." }, 503];
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions/" + sid, {
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY },
  });
  const s = await r.json();
  if (!r.ok) return [{ ok: false, error: "Checkout not found" }, 404];
  const paid = s.payment_status === "paid" || s.payment_status === "no_payment_required" || s.status === "complete";
  if (!paid) return [{ ok: false, error: "Payment not finished" }, 402];
  const cents = Number(s.amount_total) || 0;
  const meta = (s.metadata && s.metadata.sku) || "";
  let sku = meta || (cents >= 14900 ? "pack" : cents >= 4900 ? "seat" : "field");
  if (cents === 0 && !meta) sku = "seat"; /* free trial checkout; webhook-free fallback */
  const seats = sku === "pack" || sku === "crew" ? 5 : 1;
  const days = sku === "field" ? 35 : 365;
  const rec = await issue(env, "stripe:" + (s.subscription || sid), sku, seats, Date.now() + days * DAY, "stripe", DEVICE_RE.test(device) ? device : "");
  return [pub(rec), 200];
}

async function redeemRoute(body, env) {
  const code = String(body.code || "").trim().toUpperCase();
  const device = String(body.device || "");
  if (!CODE_RE.test(code) || !DEVICE_RE.test(device)) return [{ ok: false, error: "Code not recognized." }, 400];
  const rec = await getRec(env, code);
  if (!rec) return [{ ok: false, error: "Code not recognized." }, 404];
  if (Number(rec.expiresAt) < Date.now()) return [{ ok: false, error: "This code has expired. Renew to keep training." }, 410];
  if (!rec.devices.includes(device)) {
    if (rec.devices.length >= rec.seats) return [{ ok: false, error: "All " + rec.seats + " seats on this code are in use." }, 403];
    rec.devices.push(device);
    await putRec(env, rec);
  }
  return [pub(rec), 200];
}

async function checkRoute(body, env) {
  const code = String(body.code || "").trim().toUpperCase();
  const rec = await getRec(env, code);
  if (!rec) return [{ ok: false, error: "Code not recognized." }, 404];
  if (Number(rec.expiresAt) < Date.now()) return [{ ok: false, error: "Expired" }, 410];
  if (!rec.devices.includes(String(body.device || ""))) return [{ ok: false, error: "Not on this code" }, 403];
  return [pub(rec), 200];
}

/** Returns [data, status] for /license/* paths, or null if the path is not a license route. */
export async function handleLicense(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/license/")) return null;
  if (!env.LICENSES) return [{ ok: false, error: "Seat code server is not live yet. Email us and we will send your code." }, 503];
  try {
    if (url.pathname === "/license/claim" && request.method === "GET") return await claimRoute(url, env);
    if (request.method !== "POST") return [{ ok: false, error: "Method not allowed" }, 405];
    const body = await request.json().catch(() => ({}));
    if (url.pathname === "/license/apple") return await appleRoute(body, env);
    if (url.pathname === "/license/redeem") return await redeemRoute(body, env);
    if (url.pathname === "/license/check") return await checkRoute(body, env);
    return [{ ok: false, error: "Not found" }, 404];
  } catch (e) {
    return [{ ok: false, error: "License check failed: " + String((e && e.message) || e) }, 400];
  }
}
