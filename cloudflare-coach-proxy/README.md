# WRAP 911 coach proxy

Deploy from this folder after `npx wrangler login`.

```bash
cd cloudflare-coach-proxy
npx wrangler deploy
npx wrangler secret put LLM_API_KEY
```

Allowed browser origins:

- https://wrap911.com
- https://www.wrap911.com
- https://wrap911.github.io

The live worker was echoing the wrong `Access-Control-Allow-Origin` for wrap911.com and hanging on POST to the model. This worker reflects only the allow-list and fails the upstream call in 10 seconds instead of hanging.

## Problem Doctor

`POST /coach/doctor` reads up to 6 JPEG or PNG data URLs and returns JSON. The browser pulls still frames from a short video and never uploads the video file. The worker does not store the images. The API key stays in `LLM_API_KEY`.

Vision model: `LLM_VISION_MODEL`, default `grok-4.7`. That is the current xAI model with image input and text output. Calls go to `POST /v1/responses` (derived from `LLM_BASE_URL` by dropping `/chat/completions`, or set `LLM_VISION_URL`). Coach chat stays on `grok-4` and `/v1/chat/completions`.

`store` is false and reasoning effort is `low` so a shop photo is not kept for a follow-up turn and the read stays short. xAI still processes the frames to write the answer.

Limits in this worker: at most 6 images, about 900 KB each, note capped at 500 characters, and 20 reads an hour per IP per isolate (`DOCTOR_RATE_PER_HOUR`). The isolate counter resets when that isolate goes away. It is a burst guard. The daily free and paid caps live in the trainer (`doctorFreePerDay` 1, `doctorPaidPerDay` 15).

### Do not replace the live worker

This folder does not contain `/license/check`, `/license/claim`, `/license/redeem`, or the email restore routes. Those run on the live worker. Deploying this file as the whole script would send those requests through the coach chat proxy.

Merge instead:

1. Copy `handleProblemDoctor` and the helpers it uses (`doctorHits`, `scrub`, `shapeDoctor`, and the image parsers) into the live worker source.
2. In the live `fetch`, after the method check and before license routing, add: if the path is `/coach/doctor`, return `handleProblemDoctor(request, env, origin)`.
3. Leave every license and restore route as it is.
4. Set `LLM_VISION_MODEL` if you do not want the code default. `LLM_API_KEY` is already the secret. Do not add a new key.

```bash
cd cloudflare-coach-proxy
npx wrangler login
# Only if the secret is missing. This prints nothing and does not show the key.
npx wrangler secret put LLM_API_KEY
npx wrangler deploy
```

Run the stub test before you deploy:

```bash
cd cloudflare-coach-proxy
node --test --test-concurrency=1 doctor.test.mjs
```
