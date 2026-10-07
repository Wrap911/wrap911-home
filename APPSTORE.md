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
Set Version 1.0.0 / Build 1. Add 1024px icon in Assets > AppIcon.
Product > Archive > Distribute App > App Store Connect > Upload. Then submit in App Store Connect (TestFlight first).

## Payments
The download is free. Full access is a one-time 12-month Shop Pack (5 seats) or Seat (1 phone).

Apple In-App Purchase is the primary way to buy inside the iOS app. On the US storefront only, a secondary **Buy on wrap911.com** link opens Safari. That link is allowed without the external-purchase entitlement under Guideline 3.1.1(a) / 3.1.3 (May 2025). Other storefronts do not show the website button or the website prices. Keep App Store Connect availability set to **United States only** until you intend to sell elsewhere.

People who already paid on wrap911.com still type their unlock code on the Pricing screen.

### In-App Purchase products to create
Type: **Non-Renewing Subscription**, duration **1 year**. Not auto-renewable (those renew). Not non-consumable (those never expire). StoreKit does not send an expiration for this type, so the app uses the same 365-day window as an unlock code, starting at `purchaseDate`.

| Product ID | Reference name | Display name | Description | USA price |
| --- | --- | --- | --- | --- |
| `com.wrap911.trainer.pack.12mo` | Shop Pack 12 months | WRAP 911 Shop Pack | 5 seats, 12 months, full trainer. One-time. | $149 |
| `com.wrap911.trainer.seat.12mo` | Seat 12 months | WRAP 911 Seat | 1 seat, 12 months, full trainer. One-time. | $49 |

Use the same prices the site already sells: Shop Pack $149, Seat $49. Do not pick a different Apple price. Prices are set in App Store Connect. The app shows StoreKit's localized `priceString` and does not hardcode them. Family Sharing off. No free trial. No introductory offer.

A Shop Pack purchase unlocks the buying phone immediately. The app then sends the signed transaction to `POST /license/apple` on the coach-proxy worker. That route, once deployed, returns one `W911-XXXX-XXXX` code with 5 seats (this phone plus four others), the same shape the website Pack already uses. The worker change is in `cloudflare-coach-proxy/license.js` and is **not** deployed by this branch. Until it is, the buying phone still unlocks, and the screen tells the buyer to email the Apple receipt for the other four seats.

`Restore Purchases` is on the Pricing screen.

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
> Guideline 3.1.1: Shop Pack and Seat are for sale as non-renewing In-App Purchases on the Pricing screen (Shop Pack first). Restore Purchases is on that screen. A purchase unlocks the full trainer on this phone for 12 months.
> On the United States storefront only, a secondary Buy on wrap911.com button opens Safari. That is the external-purchase link allowed by Guideline 3.1.1(a) and 3.1.3. The website button and website prices are hidden on every other storefront. Availability is United States only.
> Unlock code entry remains for people who already bought on wrap911.com. The app does not sell access only by license key.
> The AI Coach asks permission before sending a question to our server and xAI. Declining uses the offline answers.

## Review risks
- Guideline 4.2 (web wrapper): lead with the drills, scoring, job manager and progress that work on the device. The service worker does NOT run in the iOS app, so do not claim offline caching.

## Submit the IAPs with the version
App Store Connect > the iOS version > In-App Purchases > add both products above before you submit. The first IAP has to ship with a new version. Banking and tax (Paid Apps agreement) have to be complete or the products stay unsellable. The Small Business Program is separate and optional: enroll at https://developer.apple.com/app-store/small-business-program/ if the proceeds qualify for the 15% rate.

Publish the Apple paragraph in `privacy.html` to https://wrap911.com/privacy.html before resubmitting. The in-app privacy link points at that URL.

Do not upload a TestFlight build from this branch until the icon is approved and both products exist in App Store Connect. The TestFlight workflow only runs on a manual dispatch or when its own file changes.
