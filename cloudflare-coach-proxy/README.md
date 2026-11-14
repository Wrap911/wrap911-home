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
`worker.js` is the live worker source (snapshot of the deployed script from 2026-11-12 in `rollback/worker.live-2026-11-12.js`) plus the email-restore routes. It serves `/lead`, `/coach/photo`, `/stripe/webhook`, `/license/apple`, `/license/claim`, `/license/redeem`, `/license/check`, and the new `/license/apple/bind`, `/license/restore/start`, `/license/restore/verify`. `photo-route.test.mjs` fails if any line of the live snapshot is dropped or reordered.

Email restore: after a Shop Pack or Seat purchase the app can `POST /license/apple/bind` with the signed transaction (JWS), an email, and the phone's device id. The Worker checks Apple's signature, then stores that JWS in the `LICENSES` KV namespace. On another phone, `POST /license/restore/start` emails a 6-digit code when that address has an active purchase, and `POST /license/restore/verify` returns the original purchase with its original 12-month expiry. Verify also stores the device id. A verified purchase is never refused for the device list. A Seat keeps one id, and a restore on a new phone replaces the previous one, so delete and reinstall still restores. A Shop Pack keeps up to 5 ids. When that list is full, a verified restore replaces the oldest id. Seat codes redeemed at `/license/redeem` are unchanged. The code is sent through Resend (`https://api.resend.com/emails`) from `WRAP 911 <info@wrap911.com>`. wrap911.com DNS stays at Namecheap; the domain must be verified in Resend (its DKIM/SPF records added at Namecheap) before mail goes to buyers.

This device cap is in the repo and is not live until you deploy. Do not deploy it as part of an App Store upload. From this folder, after `npm test`:

```bash
npx wrangler deploy
```

Leave `RESEND_API_KEY`, `LLM_API_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` as they are. Until that deploy, the live worker still restores an email purchase without counting phones.

Before deploying:

1. Verify `wrap911.com` in Resend and create an API key with sending access.
2. `npx wrangler secret put RESEND_API_KEY`. Do not touch `LLM_API_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET`.
3. `npm test`, then `npx wrangler deploy` from this folder. Until the key is set, `/license/restore/start` returns 503 `EMAIL_NOT_CONFIGURED`.

- Shop Pack bought in the iPhone app (`com.wrap911.trainer.pack.12mo`, non-renewing, 12 months): the app sends Apple's signed transaction to `/license/apple`. The Worker checks Apple's signature chain (Apple Root CA G3), sets expiry to the purchase date plus 365 days, and returns four 1-seat W911 codes for the other phones (the buying phone unlocks from StoreKit). Seat (`com.wrap911.trainer.seat.12mo`) returns no extra codes.
- Stripe web checkout: `/license/claim?session_id=...` reads the Checkout Session and returns a code (pack = 5 seats, seat = 1).

One-time setup:
```bash
cd cloudflare-coach-proxy
npm test
npx wrangler secret put RESEND_API_KEY        # once, for email restore
npx wrangler deploy
```
