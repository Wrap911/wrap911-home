# Job photo check worker

Small Cloudflare Worker for the job manager photo check (WRAP 911 1.4). It sends one photo to a vision model and returns a likely cause and a fix. It does not store the photo.

The iOS app and the website call `POST /job/photo-check` on the existing coach proxy (`cloudflare-coach-proxy`). That route uses this folder's `check.js`. Deploying the coach proxy is enough for the app.

You can also deploy this folder as its own worker. The app uses it only when `jobPhotoEndpoint` is set in `trainer/js/config.js`.

## Secret

`JOB_PHOTO_API_KEY`

This is the vision model API key (xAI). Put it in a Worker secret. Do not commit it, do not paste it into the repo, and do not print it in logs.

If `JOB_PHOTO_API_KEY` is not set, `POST /job/photo-check` returns 503 and does not call the model. The job screen says the check is not available. The rest of the job still works.

## Coach proxy (what the app uses)

```bash
cd cloudflare-coach-proxy
npx wrangler secret put JOB_PHOTO_API_KEY
npm test
npx wrangler deploy
```

Do not change `LLM_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or `RESEND_API_KEY` when you set this.

The daily cap is a count in the existing `LICENSES` KV namespace, key `jobphoto:<device>:<day>`. The photo is not written there. Paid Seat and Shop Pack only. A 7-Day Pass is not enough. Apple purchases are checked from the signed transaction. Website purchases are checked from the seat code already stored for that purchase.

Default cap: 10 checks per device per day. Override with the var `JOB_PHOTO_PER_DAY`.

## Standalone worker

```bash
cd cloudflare-job-photo
npx wrangler kv namespace create JOB_CAPS
```

Paste the id into `wrangler.toml` under `JOB_CAPS`, then:

```bash
npx wrangler secret put JOB_PHOTO_API_KEY
npm test
npx wrangler deploy
```

Without `JOB_CAPS` (or `LICENSES`), the standalone worker refuses the check so it cannot run with no cap. The standalone worker can confirm a website seat code stored in that KV namespace. Apple receipt checks stay on the coach proxy route.

## Route

`POST /job/photo-check` or `POST /check`

Body: `{ consent: true, image: "data:image/jpeg;base64,...", device, jws or code, note }`

`note` is job data (film brand and product line). It is not stored.
