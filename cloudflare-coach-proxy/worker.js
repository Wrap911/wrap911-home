/**
 * WRAP 911 Coach proxy — Cloudflare Worker
 * Holds LLM_API_KEY. Browser never sees the key.
 *
 * Secrets:
 *   wrangler secret put LLM_API_KEY
 * Optional vars:
 *   LLM_BASE_URL  default https://api.x.ai/v1/chat/completions
 *   LLM_MODEL     default grok-4
 */
import { handleLicense } from "./license.js";

const ALLOWED_ORIGINS = [
  "capacitor://localhost",
  "https://wrap911.com",
  "https://www.wrap911.com",
  "https://wrap911.github.io",
  "https://wrap-911.wrap911.workers.dev",
];

const SYSTEM = `You are the WRAP 911 shop coach for commercial and architectural vinyl wrap installs.
Brands only: 3M, Avery Dennison, Arlon.
Never invent temperatures, dwell times, stretch percentages, or chemical recipes.
Tell the tech to confirm heat and film steps on the current TDS / Application Guide for that SKU.
Process language only. Short. Direct. Shop floor, not marketing.
If the question is off-topic, say so and point back to wrap process.`;

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    const lic = await handleLicense(request, env);
    if (lic) return json(lic[0], lic[1], origin);
    if (request.method === "GET") {
      return json(
        { ok: true, service: "wrap911-coach-proxy", hint: "POST { messages }" },
        200,
        origin
      );
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    const key = env.LLM_API_KEY || env.XAI_API_KEY || env.OPENAI_API_KEY || "";
    if (!key) {
      return json({ error: "Worker missing LLM_API_KEY" }, 503, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    const incoming = Array.isArray(body && body.messages) ? body.messages : [];
    const messages = [{ role: "system", content: SYSTEM }].concat(
      incoming
        .filter((m) => m && (m.role === "user" || m.role === "assistant"))
        .slice(-12)
        .map((m) => ({ role: m.role, content: String(m.content || "").slice(0, 4000) }))
    );

    const url = env.LLM_BASE_URL || "https://api.x.ai/v1/chat/completions";
    const model = env.LLM_MODEL || "grok-4";
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);

    try {
      const upstream = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 700,
        }),
        signal: ctrl.signal,
      });
      const raw = await upstream.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (e) {
        data = null;
      }
      if (!upstream.ok) {
        return json(
          {
            error: "Upstream HTTP " + upstream.status,
            detail: (data && (data.error && data.error.message)) || raw.slice(0, 240),
          },
          502,
          origin
        );
      }
      return new Response(raw, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      const aborted = err && (err.name === "AbortError" || /abort/i.test(String(err)));
      return json(
        { error: aborted ? "Upstream timed out after 10s" : String(err && err.message ? err.message : err) },
        504,
        origin
      );
    } finally {
      clearTimeout(t);
    }
  },
};
