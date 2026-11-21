# Wrap911 iOS / App Store setup (Capacitor)

Bundle ID: `com.wrap911.trainer` · App name: Wrap911 · Opens `trainer/index.html`.

## One-time (Apple Developer portal)
1. developer.apple.com > Identifiers > + App ID > `com.wrap911.trainer`.
2. App Store Connect > My Apps > + New App: iOS, name "Wrap911", bundle ID above, SKU `wrap911-ios`.
3. Privacy Policy URL: https://wrap911.com/privacy.html

## On a Mac (Xcode 15+, Node 18+, CocoaPods)
```
npm install
npm run ios:sync      # copies site into www/ and pod installs
npm run ios:open      # opens Xcode
```
In Xcode > App target > Signing & Capabilities: tick "Automatically manage signing", pick your Team.
Version is 1.2. Build is 24. Add 1024px icon in Assets > AppIcon.
Product > Archive > Distribute App > App Store Connect > Upload. Then submit in App Store Connect (TestFlight first).

## Payments
The download is free. Full access is a one-time 12-month Shop Pack (5 seats), a one-time 12-month Seat (1 phone), or a one-time 7-day pass (1 phone).

Inside the iOS app (`Capacitor.getPlatform() === "ios"`), Shop Pack, Seat, and the 7-Day Pass are sold only through StoreKit 2 (`@capgo/native-purchases`). There is no Stripe link, no "Buy on wrap911.com" button, and no unlock-code field. The paywall is the Pricing screen. It opens from Home with no account. The button is **Restore with email**. On this phone it still reads StoreKit 2 `Transaction.all` and `Transaction.currentEntitlements` only. It does not call `AppStore.sync()` or `restoreCompletedTransactions()`, so it does not ask for an Apple Account or password. A new phone restores from the email saved after purchase: the worker stores the verified signed transaction and emails a code, then unlocks that phone with the original expiry. A Shop Pack still sends its signed transaction to the license server for the crew code.

The website at wrap911.com still sells the same plans with Stripe. That checkout is not linked from the iOS app.

### In-App Purchase products to create
Type: **Non-Renewing Subscription**. Shop Pack and Seat use a 1-year term. The 7-Day Pass uses a 7-day term. Not auto-renewable. Not non-consumable. StoreKit does not send an expiration for this type, so the app starts the term at `purchaseDate`: 365 days for Shop Pack and Seat, 7 days for the pass.

| Product ID | Reference name | Display name | Description | USA price |
| --- | --- | --- | --- | --- |
| `com.wrap911.trainer.pack.12mo` | Shop Pack 12 months | WRAP 911 Shop Pack | 5 seats, 12 months, full trainer. One-time. | $149 |
| `com.wrap911.trainer.seat.12mo` | Seat 12 months | WRAP 911 Seat | 1 seat, 12 months, full trainer. One-time. | $49 |
| `com.wrap911.trainer.pass.7d` | WRAP 911 7-Day Pass | WRAP 911 7-Day Pass | 7 days, full trainer, one phone. One-time. | $12.99 |

Use those prices. Do not pick a different Apple price. Prices are set in App Store Connect. The app shows StoreKit's localized `priceString` and does not hardcode them. Family Sharing off. No free trial. No introductory offer.

Version 1.2 already exists in App Store Connect (`600c93dd-0a49-4a1a-9d7c-3c402dadc446`, Prepare for Submission). Reuse it. Do not create another version and do not replace its iPhone 6.7" or 13" iPad screenshots. It still needs What's New text, build 24, and the 7-Day Pass attached before submission.

### Worker change required before a new phone can restore a 7-Day Pass

Do not deploy this from the iOS release. The buying phone unlocks from StoreKit without the worker. Email restore calls `POST /license/apple/bind`, and the live worker rejects `com.wrap911.trainer.pass.7d`.

In `cloudflare-coach-proxy/worker.js`:

- Add `var APPLE_PASS_SKU = "com.wrap911.trainer.pass.7d";` and `var WEEK_MS = 7 * 86400000;` next to the Shop Pack and Seat product ids.
- In `bindAppleEmail`, accept `APPLE_PASS_SKU`. Set `expiresAt` to `purchase + WEEK_MS` for that product and `purchase + YEAR_MS` for Shop Pack and Seat. Set `sku` to `"pass"` and `seats` to `1`. Shop Pack stays `sku: "pack"`, `seats: 5`. Seat stays `sku: "seat"`, `seats: 1`.
- In `issueAppleSeatCodes`, accept the same product id, store `sku: "pass"`, use the 7-day expiry, and mint no `W911-` codes.

In `cloudflare-coach-proxy/license-restore.js`, `pickActive` must keep a transaction whose `sku` is `"pass"`. Label priority stays Shop Pack, then Seat, then 7-Day Pass. `seats` is 5 only for Shop Pack. `expiresAt` is the later of the purchases that are still inside their own expiry, so a 7-day pass does not shorten a live Seat or Shop Pack.

Until that worker is deployed, Restore with email on a new phone cannot save or return a 7-Day Pass. The same-phone StoreKit restore still works.

A Shop Pack purchase unlocks the buying phone immediately. The app then sends the signed transaction to `POST /license/apple` on the coach-proxy worker. That route, once deployed, returns one `W911-XXXX-XXXX` code with 5 seats (this phone plus four others), the same shape the website Pack already uses. That route is live in `cloudflare-coach-proxy/worker.js`.

`Restore with email` is on the Pricing screen. Build 22 keeps the on-device StoreKit read for this phone and adds an email code for a new phone. The plugin method `restorePurchases` still returns without calling `AppStore.sync()`. That method is the only `AppStore.sync()` in `@capgo/native-purchases` 8.8.1, and the app does not call it. Non-renewing subscriptions cannot be restored with the Apple Account password sheet.

### Local StoreKit test
`ios/App/App/WRAP911.storekit` lists both products. In Xcode: Product > Scheme > Edit Scheme > Run > Options > StoreKit Configuration > WRAP911.storekit. The prices in that file are for the simulator only.

Do not run `.github/workflows/asc-setup-iap.yml`. It used to create the wrong auto-renewable products and now exits without changing App Store Connect.

## Privacy (done in code)
- `trainer/js/appstore.js`: the AI Coach asks permission before sending anything to xAI (5.1.2). Declining uses the offline answers. "Reset AI permission" is on the Coach screen.
- A Privacy policy link is on every trainer screen and the Coach (5.1.1).
- `privacy.html` covers the AI Coach (Cloudflare + xAI), Stripe, YouTube, on-device storage and the contact email. Merge to `main` so https://wrap911.com/privacy.html is live before you submit.
- `ios/App/App/PrivacyInfo.xcprivacy`: no tracking; collects Other User Content (Coach questions), not linked, used for app functionality; UserDefaults reason CA92.1.

## App Store Connect privacy label
Data Not Used to Track You. Data Not Linked to You: **User Content > Other User Content** (App Functionality). Nothing else is collected.

## Review notes (paste into App Review Information)
> Guideline 2.3.8: the app icon is now the WRAP 911 wordmark. The previous build used Capacitor's placeholder icon.
> Guideline 3.1.1: Shop Pack (`com.wrap911.trainer.pack.12mo`), Seat (`com.wrap911.trainer.seat.12mo`), and 7-Day Pass (`com.wrap911.trainer.pass.7d`) are non-renewing subscriptions, sold only on the Pricing screen. Version 1.2, build 24. Shop Pack and Seat last 12 months from the purchase date. The 7-Day Pass lasts 7 days from the purchase date. Restore does not ask for an Apple Account or password and does not call AppStore.sync() or restoreCompletedTransactions(). The button is Restore with email. On the phone that bought the plan, the app reads StoreKit 2 Transaction.currentEntitlements and Transaction.all. On a new device, the buyer enters the email they saved after purchase; we send a one-time code to that email and, after they enter it, restore the same purchase with its original expiry. The Pricing screen opens with no account. The iOS app has no Stripe link, no website buy button, and no unlock-code field.
> The AI Coach asks permission before sending a question to our server and xAI. Declining uses the offline answers.

## Review risks
- Guideline 4.2 (web wrapper): lead with the drills, scoring, job manager and progress that work on the device. The service worker does NOT run in the iOS app, so do not claim offline caching.

## Submit the IAPs with the version
App Store Connect > the iOS version > In-App Purchases > add both products above before you submit. The first IAP has to ship with a new version. Banking and tax (Paid Apps agreement) have to be complete or the products stay unsellable. The Small Business Program is separate and optional: enroll at https://developer.apple.com/app-store/small-business-program/ if the proceeds qualify for the 15% rate.

Publish the Apple paragraph in `privacy.html` to https://wrap911.com/privacy.html before resubmitting. The in-app privacy link points at that URL.

Do not upload a TestFlight build from this branch until the icon is approved and both products exist in App Store Connect. The TestFlight workflow only runs on a manual dispatch or when its own file changes.
