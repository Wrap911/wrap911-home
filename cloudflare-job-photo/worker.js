/* Standalone job photo check worker (Cloudflare free tier).
   The trainer calls this only if jobPhotoEndpoint is set.
   The live app uses POST /job/photo-check on wrap911-coach-proxy, which imports check.js.
   Secret: JOB_PHOTO_API_KEY. Never commit the key. */
import { handleJobPhoto } from "./check.js";

const ALLOWED = [
  "https://wrap911.com",
  "https://www.wrap911.com",
  "https://wrap911.github.io",
];

function originOk(origin) {
  if (!origin) return true;
  if (ALLOWED.indexOf(origin) !== -1) return true;
  if (/^https:\/\/[a-z0-9-]+\.wrap911\.workers\.dev$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.wrap911\.com$/.test(origin)) return true;
  if (/^(capacitor|ionic|wrap911):\/\/localhost$/i.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "https://wrap911.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

async function allowCode(env, body) {
  const code = String((body && body.code) || "").trim();
  const store = env && (env.LICENSES || env.JOB_CAPS);
  if (!code || !store || typeof store.get !== "function") return false;
  let rec = null;
  try { rec = JSON.parse((await store.get("code:" + code)) || "null"); } catch (e) { return false; }
  if (!rec || rec.revoked) return false;
  if (rec.sku !== "seat" && rec.sku !== "pack") return false;
  if (rec.expiresAt && Date.now() > Number(rec.expiresAt)) return false;
  return true;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const ok = originOk(origin);
    const headers = corsHeaders(ok && origin ? origin : "https://wrap911.com");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers });
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && (path === "/" || path === "/health")) {
      return new Response(JSON.stringify({ ok: true, service: "wrap911-job-photo", check: "POST /check" }), {
        status: 200,
        headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers),
      });
    }
    if (request.method !== "POST" || (path !== "/check" && path !== "/job/photo-check" && path !== "/")) {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers),
      });
    }
    if (!ok) {
      return new Response(JSON.stringify({ ok: false, error: "Origin not allowed" }), {
        status: 403,
        headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers),
      });
    }
    return handleJobPhoto(request, env, {
      headers: headers,
      allow: function (body) { return allowCode(env, body); },
    });
  },
};
