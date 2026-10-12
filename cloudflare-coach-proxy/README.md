# WRAP 911 coach proxy

Do not deploy this folder until Photo Fix is approved. `wrangler deploy` from here replaces the live `wrap911-coach-proxy` worker. There is no Cloudflare token in the agent environment, and this change is not deployed.

`worker.js` is the script that is live now (`rollback/worker.live-before-photo.js`, sha256 `327c15641d63653123206974399b40b2540f07e08f6038c220ce31b23eb7f873`, the `cda0a41` backup plus `POST /lead`) with one addition: `POST /coach/photo`. Chat still uses `LLM_MODEL` (`grok-4-fast-non-reasoning` on `https://api.x.ai/v1`). Photo Fix calls `grok-4.7` because that model accepts an image. The route checks a `W911-` code the same way `POST /license/check` does, requires `consent: true`, rate-limits in KV (`photorl:`), and does not store the photo.

```bash
node cloudflare-coach-proxy/photo-route.test.mjs
```

Deploy from this folder only after that check passes and the web flag `photoFix` is turned on.

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
