/**
 * Email four Shop Pack crew codes after a verified Apple purchase.
 * Reuses RESEND_API_KEY (already live for email restore). Does not return
 * the codes in the HTTP body, and does not add a redeem path in the iOS app.
 */
import { normalizeEmail, RESEND_URL, RESTORE_FROM, RESTORE_REPLY_TO } from "./license-restore.js";

export const CREW_EMAIL_PATH = "/license/apple/crew-email";
const DAY_MS = 86400000;
const MAX_SENDS_PER_DAY = 5;
const APPLE_PACK_SKU = "com.wrap911.trainer.pack.12mo";
const APPLE_BUNDLE_ID = "com.wrap911.trainer";

export function crewEmailReady(env) {
  return !!(env && env.LICENSES && env.RESEND_API_KEY);
}

export function crewCodesEmailContent(codes, expiresAt) {
  const list = (codes || []).filter(function (c) { return /^W911-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(c)); });
  const when = expiresAt ? new Date(expiresAt).toISOString().slice(0, 10) : "";
  const text =
    "Your WRAP 911 Shop Pack includes four codes for other phones.\n\n" +
    list.map(function (c) { return "  " + c; }).join("\n") + "\n\n" +
    "Each of the other four phones opens the WRAP 911 website trainer at wrap911.com/trainer and unlocks with one code. " +
    "Do not type these codes in the iPhone app. The iPhone app uses Apple purchases and Restore Purchases only.\n\n" +
    (when ? "The codes last until " + when + ".\n\n" : "") +
    "If you did not ask for this, ignore this email.";
  return { text, subject: "Your WRAP 911 Shop Pack crew codes" };
}

export function crewCodesResendPayload(to, codes, expiresAt) {
  const copy = crewCodesEmailContent(codes, expiresAt);
  return {
    from: RESTORE_FROM,
    to: [to],
    reply_to: RESTORE_REPLY_TO,
    subject: copy.subject,
    text: copy.text
  };
}

export async function sendCrewCodesEmail(env, to, codes, expiresAt) {
  if (!env || !env.RESEND_API_KEY) {
    const err = new Error("RESEND_API_KEY is not set");
    err.code = "NO_RESEND_KEY";
    throw err;
  }
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(crewCodesResendPayload(to, codes, expiresAt))
  });
  if (!res.ok) {
    const err = new Error("Resend returned " + res.status);
    err.code = "RESEND_" + res.status;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  return data && data.id ? String(data.id) : "";
}

export async function allowCrewEmailSend(env, originalTransactionId, now) {
  const id = String(originalTransactionId || "");
  if (!/^[0-9]{4,40}$/.test(id)) return { ok: false, error: "Missing transaction.", status: 400 };
  const key = "apple-crew-email:" + id;
  const rec = (await env.LICENSES.get(key, "json")) || { sends: [] };
  const cutoff = now - DAY_MS;
  rec.sends = (rec.sends || []).filter(function (t) { return t > cutoff; });
  if (rec.sends.length >= MAX_SENDS_PER_DAY) return { ok: false, error: "Try again tomorrow.", status: 429, key: key, rec: rec };
  return { ok: true, key: key, rec: rec };
}

export async function recordCrewEmailSend(env, gate, now) {
  gate.rec.sends.push(now);
  await env.LICENSES.put(gate.key, JSON.stringify(gate.rec));
}

export async function handleCrewEmail(request, env, corsOrigin, deps) {
  if (request.method !== "POST") return { body: { ok: false, error: "Method not allowed" }, status: 405 };
  if (!env || !env.LICENSES) return { body: { ok: false, error: "Email is not set up on the server yet.", code: "EMAIL_NOT_CONFIGURED" }, status: 503 };
  let body;
  try { body = await request.json(); } catch (e) { return { body: { ok: false, error: "Invalid JSON" }, status: 400 }; }
  body = body || {};
  const email = normalizeEmail(body.email);
  if (!email) return { body: { ok: false, error: "Enter a valid email." }, status: 400 };
  if (!crewEmailReady(env)) return { body: { ok: false, error: "Email is not set up on the server yet.", code: "EMAIL_NOT_CONFIGURED" }, status: 503 };

  let tx;
  try { tx = await deps.verifyAppleJws(body.jws); } catch (e) { return { body: { ok: false, error: "Invalid Apple receipt." }, status: 400 }; }
  if (tx.bundleId !== (deps.APPLE_BUNDLE_ID || APPLE_BUNDLE_ID)) return { body: { ok: false, error: "Wrong app." }, status: 400 };
  const environment = String(tx.environment || "");
  if (environment !== "Sandbox" && environment !== "Production") return { body: { ok: false, error: "Unsupported Apple environment." }, status: 400 };
  if (String(tx.productId || "") !== (deps.APPLE_PACK_SKU || APPLE_PACK_SKU)) {
    return { body: { ok: false, error: "Crew codes are only for the Shop Pack." }, status: 400 };
  }

  const now = deps.now || Date.now();
  const gate = await allowCrewEmailSend(env, tx.originalTransactionId, now);
  if (!gate.ok) return { body: { ok: false, error: gate.error }, status: gate.status };

  let saved;
  try { saved = await deps.issueAppleSeatCodes(env, tx); } catch (err) {
    const status = err && err.status ? err.status : 400;
    return { body: { ok: false, error: err && err.apple ? String(err.message) : "Invalid Apple receipt." }, status: status >= 400 && status <= 499 ? status : 400 };
  }
  const codes = (saved && saved.codes) || [];
  if (codes.length < 1) return { body: { ok: false, error: "No crew codes on this purchase." }, status: 400 };

  try {
    await sendCrewCodesEmail(env, email, codes, saved.expiresAt);
  } catch (err) {
    if (err && err.code === "NO_RESEND_KEY") return { body: { ok: false, error: "Email is not set up on the server yet.", code: "EMAIL_NOT_CONFIGURED" }, status: 503 };
    return { body: { ok: false, error: "Could not send the email. Try again, or email info@wrap911.com." }, status: 502 };
  }
  await recordCrewEmailSend(env, gate, now);
  return { body: { ok: true }, status: 200 };
}
