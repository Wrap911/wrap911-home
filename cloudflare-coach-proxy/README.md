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

## License server (seat codes)
`license.js` adds `/license/apple`, `/license/claim`, `/license/redeem`, `/license/check` to this Worker.
- Shop Pack bought in the iPhone app (`com.wrap911.trainer.pack.12mo`, non-renewing, 12 months, 5 seats): the app sends Apple's signed transaction to `/license/apple`. The Worker checks Apple's signature chain (Apple Root CA G3). A non-renewing transaction has no `expiresDate`, so expiry is `purchaseDate` plus 365 days. The Worker then returns a W911 code with 5 seats. Seat (`com.wrap911.trainer.seat.12mo`) is 1 seat. This route is in the repo and is not deployed by the iOS change; until it is deployed, the buying phone still unlocks from StoreKit and the other four Pack seats are sent by email.
- Stripe web checkout: `/license/claim?session_id=...` reads the Checkout Session and returns a code (pack = 5 seats, seat = 1).

One-time setup:
```bash
cd cloudflare-coach-proxy
npm install
npx wrangler kv namespace create LICENSES     # paste the id into wrangler.toml
npx wrangler secret put STRIPE_SECRET_KEY     # sk_live_... (for web checkout codes)
npx wrangler deploy
```
