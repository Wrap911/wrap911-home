# Wrap 911 Home

Stable public page. Do not use loca.lt tunnels for customers.

After GitHub Pages is on:
https://wrap911.github.io/wrap911-home/

## Make money (required, in order)

1. Repo Settings → Pages → Deploy from branch `main` / root.
2. Stripe Payment Links: Shop Pack $149 (default), Seat $49. Field $29/mo is sold in the trainer only (not on the sales page).
3. Paste those URLs into index.html Buy buttons and push.
4. Put real photos and Drive clips into the trainer modules.
5. Send the Pages URL to shops.

Until 3 + 5 are done, this is inventory.

## Pricing

- Seat $49 one-time, 12 months, one tech
- Shop Pack $149 one-time, 12 months, 5 seats (default sell)
- Field subscription: off. Do not sell a monthly SKU unless a new solution-photo pack actually ships every month.

## Job photo check (1.4)

The job screen can send one photo for a likely cause. The photo is not stored. The check runs only for a Seat or a Shop Pack.

The app calls `POST /job/photo-check` on the coach proxy. Set the vision key as a Worker secret named `JOB_PHOTO_API_KEY`. Do not commit the key.

```bash
cd cloudflare-coach-proxy
npx wrangler secret put JOB_PHOTO_API_KEY
npm test
npx wrangler deploy
```

If `JOB_PHOTO_API_KEY` is not set, the check says it is not available and the rest of the job still works. Steps and the cap are in `cloudflare-job-photo/README.md`.
