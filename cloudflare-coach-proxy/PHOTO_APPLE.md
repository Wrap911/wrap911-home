# Photo Fix for StoreKit buyers

Do not deploy this branch. `cloudflare-coach-proxy/worker.js` here is not the live worker. `wrangler deploy` from this folder would replace `wrap911-coach-proxy` and drop `POST /coach/photo` and the live `POST /license/apple`.

Version 1.1 (build 20) is in Apple review. Do not upload a build and do not change App Store Connect.

## What the live worker does today

Probed `https://wrap911-coach-proxy.wrap911.workers.dev` on 2026-10-24. The script that is live matches the photo route from `cursor/photo-fix-worker-7c96` plus the Apple route from `cursor/apple-license-route-7c96`. Neither branch contains both routes. This repo does not contain the merged live source.

`POST /license/apple` with `{ jws, device }`:

- Verifies the StoreKit JWS. An empty body returns `Invalid Apple receipt.`
- Shop Pack (`com.wrap911.trainer.pack.12mo`) stores four `W911-` codes. Each code has `seats: 1` and `devices: []`. The response `code` is `codes[0]`. The buying phone is not added to any code.
- Seat (`com.wrap911.trainer.seat.12mo`) stores no code. The response is `code: ""` and `codes: []`.
- The iOS app still unlocks locally from StoreKit with `code: "APPLE"`. That string is not a seat code.

`POST /coach/photo`:

- Requires `consent: true`, a `W911-XXXX-XXXX` code that exists in KV, and a `device` that is already in that code's `devices` array. Otherwise it returns 403 `Pack or Seat required.` or `This phone is not on that code.`
- Reads one `image` field: a `data:image/jpeg;base64,...` URL up to 1,800,000 characters. It does not read `images`.
- Allows `https://wrap911.com`, `https://wrap911.github.io`, `capacitor://localhost`, and `wrap911://localhost` (the Capacitor scheme in this app is `Wrap911`).
- The photo prompt on that branch still says Arlon. The iOS app does not.

A StoreKit buyer therefore cannot call `/coach/photo`. Pack's returned code has an empty device list, and Seat has no code at all. Sending `code: "APPLE"` fails the `W911-` check. Redeeming a crew code from the app would spend one of the four extra seats and still would not cover Seat.

## Change to make on the live worker (not deployed)

Keep the current JWS check, the four Pack crew codes, and `code` / `codes` so the 1.1 app still sees the same crew-code field.

After `issueAppleSeatCodes`, add a buyer code:

- New response field `deviceCode`: a separate `W911-` code with `seats: 1` and `devices: [device]` for the phone that sent the JWS.
- Do this for Seat and Shop Pack.
- Do not put `deviceCode` into `codes`, and do not replace `code` (1.1 shows `code` to the buyer).
- Save `deviceCode` on the `apple:{originalTransactionId}` record. A later call with the same transaction reuses it.
- If Restore runs on another phone, replace `devices` on that buyer code with the new device. Leave the four crew codes untouched.
- If `device` is missing or not 8–64 letters, digits, or dashes, return 400. The app always sends the same `wrap911_device` id it will send to `/coach/photo`.

`POST /coach/photo` image handling:

- If `images` is an array of 1 to 4 JPEG data URLs, diagnose those frames. Otherwise keep accepting a single `image`.
- Reject more than 4 frames, a non-JPEG, or a frame over 1,800,000 characters.
- Send each frame to the vision model. Do not store them.
- The same code and device check stays. Photo Fix sends `deviceCode`, not the crew `code`.
- Prompt brands are only 3M, Avery Dennison, and BriteLine. Never name Arlon. Gerardo is an installer, not a shop owner. Do not invent temperatures, dwell, stretch, or chemical recipes.

`cloudflare-coach-proxy/photo-apple.cjs` is the pure form of those rules. `node cloudflare-coach-proxy/photo-apple.test.cjs` checks them. The iOS app already posts `{ jws, device }` and, on the next response that includes `deviceCode`, stores it and sends it with `/coach/photo`.

Until this worker change is deployed, a paid iPhone can open Photo Fix and will be told to restore the purchase. The request will 403 because the live route still has no buyer code.
