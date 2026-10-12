# TestFlight setup for WRAP 911

The trainer is a PWA. To put it on TestFlight:

1. Install Node.js.
2. In this repo run:
   ```
   npm install
   npx cap add ios
   npx cap sync ios
   npx cap open ios
   ```
3. In Xcode:
   - Set the team to your Apple Developer account.
   - Bundle ID must be `com.wrap911.trainer` (already configured).
   - Archive → Distribute App → App Store Connect.
4. In App Store Connect, add the build to a TestFlight group and invite testers.

App Store Connect IAP products (Seat / Crew yearly) are already scripted in `.github/workflows/asc-setup-iap.yml`. Run that workflow once if the products are not created yet.

After the first successful upload, TestFlight invites can be sent.
