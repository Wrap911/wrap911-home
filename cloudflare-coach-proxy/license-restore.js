/**
 * Email restore for non-renewing Apple Shop Pack and Seat.
 * Stores the verified JWS in the existing LICENSES KV namespace.
 * Sends the one-time code with the Worker send_email binding (env.EMAIL).
 * That binding is not in the deployed worker until wrangler deploy.
 */
const DAY_MS = 86400000;
const CODE_TTL_MS = 15 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_SENDS_PER_DAY = 8;
const MAX_ATTEMPTS = 5;
const CODE_SPACE = 1000000;

export function normalizeEmail(raw) {
  const email = String(raw || "").trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return "";
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return "";
  return email;
}

export function newRestoreCode(bytes) {
  const b = bytes || crypto.getRandomValues(new Uint8Array(4));
  const n = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
  const limit = Math.floor(0x100000000 / CODE_SPACE) * CODE_SPACE;
  if (!bytes && n >= limit) return newRestoreCode();
  return String(n % CODE_SPACE).padStart(6, "0");
}

async function sha256hex(text) {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return Array.from(h, (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function hashRestoreCode(email, code) {
  return sha256hex(normalizeEmail(email) + "\n" + String(code || ""));
}

export function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const left = enc.encode(String(a));
  const right = enc.encode(String(b));
  const n = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;
  for (let i = 0; i < n; i++) diff |= (left[i] || 0) ^ (right[i] || 0);
  if (left.length === right.length && crypto.subtle && typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(left, right);
  }
  return diff === 0;
}

export async function emailStorageKey(email) {
  return "iap-email:" + await sha256hex(normalizeEmail(email));
}

export async function codeStorageKey(email) {
  return "iap-code:" + await sha256hex("code\n" + normalizeEmail(email));
}

/* Pack wins. Expiry is the later of the purchases still inside 12 months. */
export function pickActive(transactions, now) {
  let pack = null;
  let seat = null;
  const rows = Array.isArray(transactions) ? transactions : [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || (row.sku !== "pack" && row.sku !== "seat")) continue;
    const exp = Number(row.expiresAt) || 0;
    if (!exp || exp <= now) continue;
    if (row.sku === "pack" && (!pack || exp > pack.expiresAt)) pack = row;
    if (row.sku === "seat" && (!seat || exp > seat.expiresAt)) seat = row;
  }
  if (!pack && !seat) return null;
  const primary = pack || seat;
  return {
    jws: String(primary.jws || ""),
    productId: String(primary.productId || ""),
    transactionId: String(primary.transactionId || ""),
    purchaseDate: Number(primary.purchaseDate) || 0,
    sku: pack ? "pack" : "seat",
    seats: pack ? 5 : 1,
    expiresAt: Math.max(pack ? Number(pack.expiresAt) : 0, seat ? Number(seat.expiresAt) : 0)
  };
}

export function upsertTransaction(record, tx) {
  const rec = record && typeof record === "object" ? record : {};
  const list = Array.isArray(rec.transactions) ? rec.transactions.slice() : [];
  const id = String(tx.transactionId || "");
  const next = {
    jws: String(tx.jws || ""),
    productId: String(tx.productId || ""),
    transactionId: id,
    purchaseDate: Number(tx.purchaseDate) || 0,
    expiresAt: Number(tx.expiresAt) || 0,
    sku: tx.sku,
    seats: tx.seats
  };
  const at = list.findIndex((row) => row && String(row.transactionId) === id);
  if (at >= 0) list[at] = next;
  else list.push(next);
  return {
    email: tx.email || rec.email || "",
    transactions: list,
    sends: Array.isArray(rec.sends) ? rec.sends : []
  };
}

export function recentSends(sends, now) {
  return (Array.isArray(sends) ? sends : []).map(Number).filter((t) => now - t < DAY_MS && now - t >= 0);
}

export function restoreEmailContent(code) {
  const safe = String(code || "").replace(/\D/g, "").slice(0, 6);
  const text =
    "Your WRAP 911 restore code is " + safe + ".\n\n" +
    "Open the WRAP 911 app, tap Restore with email, and enter this code. It expires in 15 minutes.\n\n" +
    "If you did not ask for this, ignore this email.";
  const html =
    "<p>Your WRAP 911 restore code is <strong>" + safe + "</strong>.</p>" +
    "<p>Open the WRAP 911 app, tap Restore with email, and enter this code. It expires in 15 minutes.</p>" +
    "<p>If you did not ask for this, ignore this email.</p>";
  return { text, html };
}

export async function sendRestoreCode(env, to, code) {
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
    const err = new Error("Email sending is not configured");
    err.code = "NO_EMAIL_BINDING";
    throw err;
  }
  const from = String((env.RESTORE_FROM_EMAIL || "info@wrap911.com")).trim();
  const copy = restoreEmailContent(code);
  await env.EMAIL.send({
    to,
    from: { email: from, name: "WRAP 911" },
    replyTo: "info@wrap911.com",
    subject: "Your WRAP 911 restore code",
    text: copy.text,
    html: copy.html
  });
}

export async function storeEmailPurchase(env, purchase) {
  const email = normalizeEmail(purchase && purchase.email);
  const key = await emailStorageKey(email);
  const current = await env.LICENSES.get(key, "json");
  const next = upsertTransaction(current, Object.assign({}, purchase, { email }));
  await env.LICENSES.put(key, JSON.stringify(next));
  return next;
}

export async function startEmailRestore(body, env, now) {
  const email = normalizeEmail(body && body.email);
  if (!email) return [{ ok: false, error: "Enter a valid email." }, 400];
  if (!env.LICENSES || !env.EMAIL || typeof env.EMAIL.send !== "function") {
    return [{ ok: false, error: "Email restore is not set up yet." }, 503];
  }
  const nowMs = now || Date.now();
  const key = await emailStorageKey(email);
  const rec = await env.LICENSES.get(key, "json");
  const active = pickActive(rec && rec.transactions, nowMs);
  if (!active) return [{ ok: true }, 200];
  const sends = recentSends(rec && rec.sends, nowMs);
  if (sends.length >= MAX_SENDS_PER_DAY) return [{ ok: true }, 200];
  const codeKey = await codeStorageKey(email);
  const existing = await env.LICENSES.get(codeKey, "json");
  if (existing && Number(existing.expiresAt) > nowMs && nowMs - Number(existing.sentAt) < COOLDOWN_MS) {
    return [{ ok: true }, 200];
  }
  const code = newRestoreCode();
  const pending = {
    hash: await hashRestoreCode(email, code),
    expiresAt: nowMs + CODE_TTL_MS,
    sentAt: nowMs,
    attempts: 0
  };
  await env.LICENSES.put(codeKey, JSON.stringify(pending), { expirationTtl: 900 });
  try {
    await sendRestoreCode(env, email, code);
  } catch (e) {
    if (env.LICENSES.delete) await env.LICENSES.delete(codeKey);
    return [{ ok: false, error: "Could not send the restore email. Try again." }, 502];
  }
  const stored = rec && typeof rec === "object" ? rec : { transactions: [] };
  stored.email = email;
  stored.sends = sends.concat([nowMs]);
  await env.LICENSES.put(key, JSON.stringify(stored));
  return [{ ok: true }, 200];
}

export async function verifyEmailRestore(body, env, verifyJws, now) {
  const email = normalizeEmail(body && body.email);
  const code = String((body && body.code) || "").replace(/\D/g, "");
  if (!email || code.length !== 6) return [{ ok: false, error: "Enter the email and the 6-digit code." }, 400];
  if (!env.LICENSES) return [{ ok: false, error: "Email restore is not set up yet." }, 503];
  const nowMs = now || Date.now();
  const codeKey = await codeStorageKey(email);
  const pending = await env.LICENSES.get(codeKey, "json");
  if (!pending || Number(pending.expiresAt) < nowMs || Number(pending.attempts) >= MAX_ATTEMPTS) {
    if (pending && env.LICENSES.delete) await env.LICENSES.delete(codeKey);
    return [{ ok: false, error: "That code is not valid. Request a new one." }, 400];
  }
  const hash = await hashRestoreCode(email, code);
  if (!timingSafeEqual(hash, String(pending.hash || ""))) {
    pending.attempts = Number(pending.attempts) || 0;
    pending.attempts += 1;
    const ttl = Math.max(60, Math.ceil((Number(pending.expiresAt) - nowMs) / 1000));
    await env.LICENSES.put(codeKey, JSON.stringify(pending), { expirationTtl: ttl });
    return [{ ok: false, error: "That code is not valid. Request a new one." }, 400];
  }
  if (env.LICENSES.delete) await env.LICENSES.delete(codeKey);
  const rec = await env.LICENSES.get(await emailStorageKey(email), "json");
  const active = pickActive(rec && rec.transactions, nowMs);
  if (!active || !active.jws) return [{ ok: false, error: "That purchase is no longer active." }, 410];
  if (verifyJws) {
    const tx = await verifyJws(active.jws);
    if (!tx || tx.revocationDate) return [{ ok: false, error: "That purchase is no longer active." }, 410];
  }
  return [{
    ok: true,
    sku: active.sku,
    seats: active.seats,
    productId: active.productId,
    transactionId: active.transactionId,
    purchaseDate: active.purchaseDate,
    expiresAt: active.expiresAt,
    jws: active.jws
  }, 200];
}
