# WRAP 911 AI Coach

## Modes

1. **Live LLM (preferred)** — browser `POST`s to `WRAP911_CONFIG.aiEndpoint` (OpenAI-compatible chat). A **Cloudflare Worker** holds the API key and injects the WRAP 911 system prompt. **No API key in github.io JS.**
2. **Local SOP fallback** — if `aiEndpoint` is empty or the Worker/LLM fails, the offline SOP library answers (process-level; always TDS footer).

Implementation: `js/coach.js` → `window.WRAP911_COACH`.

## Endpoint resolution

1. `localStorage` key `wrap911_ai_endpoint` (optional override)
2. `WRAP911_CONFIG.aiEndpoint`

## What Gerardo must provide (to turn live AI on)

| Need | Why |
|------|-----|
| **LLM API key** | Preferred: **xAI Grok** (`https://console.x.ai`). Alternative: OpenAI. |
| **Cloudflare account login** | Free tier is enough to deploy `cloudflare-coach-proxy/` with Wrangler. |
| Worker URL after deploy | Paste into `config.aiEndpoint` (or localStorage) and bump trainer version. |

**Never** commit the key or put it in `trainer/js/*.js`.

## Deploy the proxy

See [`../cloudflare-coach-proxy/README.md`](../cloudflare-coach-proxy/README.md).

```bash
cd cloudflare-coach-proxy
npx wrangler login
npx wrangler deploy
npx wrangler secret put LLM_API_KEY
```

Then set in live `trainer/js/config.js`:

```js
aiEndpoint: "https://wrap911-coach-proxy.<subdomain>.workers.dev",
```

Keep `stripeTestMode: false` and real `buy.stripe.com` Payment Links.

## Client behavior

- `sendQuestion` → cloud first when endpoint set → on failure, local SOP + note.
- Worker strips client `system` messages and applies WRAP 911 rules (3M / Avery Dennison / Arlon only; **never invent temps / dwell / stretch % / chem** — always TDS).
- Brands only: **3M · Avery Dennison · Arlon**.

## Media drafts / categorize

Unchanged: local heuristics; drafts in `localStorage` `wrap911_media_drafts`; does not mutate `VIDEO_CATALOG` on disk.
