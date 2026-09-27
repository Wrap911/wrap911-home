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

## Review risks
- Guideline 3.1.1: selling digital training via Stripe inside the iOS app is rejected. Hide Stripe buy links in the app (or use In-App Purchase); unlocking already-purchased access is fine.
- Guideline 4.2: pure website wrappers get rejected; the offline trainer (service worker, data/) helps — lead with that.
