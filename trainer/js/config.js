/* WRAP 911 Trainer — shop config (LIVE)
   Offer lock (pack-first): W911-PACK $149 one-time (5 seats, 12 months, default sell)
   · W911-SEAT $49 one-time (1 tech, 12 months) · W911-FIELD $29/mo (trainer only). No per-seat monthly price.
   Free look: rules, Coach, 14 shop photos, 8 sample videos, 3 sample lessons.
   Live: stripeTestMode false, live Payment Links. Buyers unlock with ?license=STRIPE on the Stripe
   success return (honor system until the license Worker ships). Do not print owner codes. */
window.WRAP911_CONFIG = {
  shopName: "WRAP 911",
  contactName: "Gerry",
  contactEmail: "Djavoo1975@icloud.com", /* same address as the live sales page footer */
  brands: ["3M", "Avery Dennison", "Arlon"],
  version: "2.6.3",
  defaultSku: "W911-PACK",
  proPriceUsd: 149,
  proPriceLabel: "W911-PACK $149",
  seatPriceUsd: 49,
  seatPriceLabel: "W911-SEAT $49 one-time",
  fieldPriceUsd: 29,
  fieldPriceLabel: "W911-FIELD $29/mo",
  /* Offer lock 2026-09-26: Field $29/mo sold in the trainer. Set false to hide Field everywhere in the app. */
  fieldSkuLive: true,
  proPeriodDays: 365,
  audience: "other-shops-first",
  aiEndpoint: "https://wrap911-coach-proxy.wrap911.workers.dev",
  hostedUrl: "https://wrap911.github.io/wrap911-home",
  stripePaymentLink: "https://buy.stripe.com/3cI6oI3ML8WU2ZjdzP9ws03",
  stripeSeatLink: "https://buy.stripe.com/eVq8wQ1EDc9643nanD9ws04",
  stripeFieldLink: "https://buy.stripe.com/fZueVe5UT6OM9nH2Vb9ws05",
  stripeTestMode: false,
  shopPhoneOpen: false,
  problemUploadEndpoint: "",
  /* Free look limits (license-gate.js / video-fix.js read these) */
  freePhotoSamples: 14,
  freeVideoSamples: 8,
  /* Lessons open on the free look. Empty array = every lesson open. */
  freeLessonIds: ["bt-rivet-mastery", "van-deep-recess", "sf-wet-install"],
  /* Hotfix 2.6.1: ONE list of screens a free phone may open. app-core.js showScreen and
     license-gate.js both read this. Paid content inside stays gated (photo cap, video cap,
     lesson lock, practice lock, game rounds). module, scenarios, flashcards, jobs, calc, badges stay paid. */
  freeScreens: [
    "rules", "home", "pricing", "contact", "coach", "about",
    "photos", "photo", "videos",
    "lesson", "vehicle", "library",
    "practice-hub", "practice",
    "drills", "drill-spot", "drill-checklist", "drill-checklist-pick",
    "games", "game"
  ],
  plans: [
    {
      id: "preview",
      name: "Free look",
      priceExample: "Free",
      status: "available",
      blurb: "Shop rules, Coach, 14 shop photos, 8 sample videos, and 3 sample lessons. Enough to see how WRAP 911 trains. The rest of the lessons, videos, jobs, and calculator unlock with a seat or the pack."
    },
    {
      id: "w911-pack",
      name: "W911-PACK (default)",
      priceExample: "$149",
      status: "locked-price",
      blurb: "Full trainer for the crew. 5 seats, 12 months, one-time. All lessons, photos, Problems, videos, drills, jobs, and calculator. This is the default sell."
    },
    {
      id: "w911-seat",
      name: "W911-SEAT",
      priceExample: "$49 one-time",
      status: "locked-price",
      blurb: "One tech, 12 months, one-time. Same library as the pack."
    },
    {
      id: "w911-field",
      name: "W911-FIELD",
      priceExample: "$29 / mo",
      status: "locked-price",
      blurb: "Monthly, one tech. Not the default sell."
    }
  ],
  demoCodes: {}
};
