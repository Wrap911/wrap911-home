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

## Payments: US storefront only (keeps Stripe, no In-App Purchase)
Since May 2025, Guideline 3.1.1(a) lets apps on the **United States** storefront link to web checkout without an entitlement. Every other country still requires In-App Purchase.
- App Store Connect > Pricing and Availability: price **Free** (the download is free, and the trainer is sold on the web), availability **United States only**.
- In the app, Buy buttons open Stripe in Safari (wrap911.com). The pricing screen tells iOS users to come back and enter their unlock code.
- Do not turn on other countries unless In-App Purchase has been added.

## Privacy (done in code)
- `trainer/js/appstore.js`: the AI Coach asks permission before sending anything to xAI (5.1.2). Declining uses the offline answers. "Reset AI permission" is on the Coach screen.
- A Privacy policy link is on every trainer screen and the Coach (5.1.1).
- `privacy.html` covers the AI Coach (Cloudflare + xAI), Stripe, YouTube, on-device storage and the contact email. Merge to `main` so https://wrap911.com/privacy.html is live before you submit.
- `ios/App/App/PrivacyInfo.xcprivacy`: no tracking; collects Other User Content (Coach questions), not linked, used for app functionality; UserDefaults reason CA92.1.

## App Store Connect privacy label
Data Not Used to Track You. Data Not Linked to You: **User Content > Other User Content** (App Functionality). Nothing else is collected.

## Review notes (paste into App Review Information)
> WRAP 911 is an on-device training app for commercial vinyl-wrap installers: lessons, practice scenarios, drills with scoring, a job workflow manager, a material calculator, and progress saved on the device. The AI Coach asks for permission before sending a question to our server and xAI.
> Full access: on the Pricing screen, enter unlock code **<REVIEW CODE>** and tap Unlock.
> The digital training is sold on our website through Stripe. Under Guideline 3.1.1(a), the app links out to that checkout on the US storefront only.

## Review risks
- Guideline 4.2 (web wrapper): lead with the drills, scoring, job manager and progress that work on the device. The service worker does NOT run in the iOS app, so do not claim offline caching.

## In-App Purchase: Wrap911 Pro yearly (v1.1)
- Product ID `com.wrap911.trainer.pro.yearly`, auto-renewable, group "Wrap911 Pro", 1 year, $49.00 USD, 7-day free trial (introductory offer, new subscribers).
- Code: `trainer/js/iap.js` + `@capgo/native-purchases` (StoreKit 2). Active sub writes a local `plan: "pro", sku: "iap"` license; expired/refunded subs remove it on next launch.
- Paywall shows price, trial terms, auto-renew text, Restore purchases, Terms of Use (Apple EULA) and Privacy links (Guideline 3.1.2).
- Stripe seat codes and US web checkout still work alongside IAP.
- First subscription must be submitted for review together with app version 1.1.
