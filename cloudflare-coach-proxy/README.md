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

`POST /license/apple` checks an Apple transaction for bundle `com.wrap911.trainer` (sandbox or production). Shop Pack `com.wrap911.trainer.pack.12mo` returns the same four extra `W911-` seat codes for that original transaction, expiring 365 days after purchase. Seat `com.wrap911.trainer.seat.12mo` returns no extra codes. The rest of the worker, including `POST /lead`, is the live script. `rollback/worker.live-before-apple.js` is that script before the Apple route. `rollback/worker.live-cda0a41.js` is an older backup and does not include `/lead`.
