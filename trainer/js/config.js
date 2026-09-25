/* WRAP 911 Trainer — shop config
   Offer lock (pack-first): W911-PACK $149 (default) · W911-SEAT $49 one-time.
   Free preview shows a sample of photos + videos. Full library stays paid.
   Do not print owner codes. */
window.WRAP911_CONFIG = {
  shopName: "WRAP 911",
  contactName: "Gerry",
  contactEmail: "",
  brands: ["3M", "Avery Dennison", "Arlon"],
  version: "2.8.3-home",
  defaultSku: "W911-PACK",
  proPriceUsd: 149,
  proPriceLabel: "W911-PACK $149",
  seatPriceUsd: 49,
  seatPriceLabel: "W911-SEAT $49 one-time",
  fieldPriceUsd: 29,
  fieldPriceLabel: "W911-FIELD killed — not for sale",
  fieldSkuLive: false,
  proPeriodDays: 365,
  audience: "other-shops-first",
  aiEndpoint: "https://wrap911-coach-proxy.wrap911.workers.dev",
  hostedUrl: "https://wrap911.github.io/wrap911-home",
  stripePaymentLink: "https://buy.stripe.com/3cI6oI3ML8WU2ZjdzP9ws03",
  stripeSeatLink: "https://buy.stripe.com/eVq8wQ1EDc9643nanD9ws04",
  stripeFieldLink: "",
  stripeTestMode: false,
  /* Optional: paste your Cloudflare Worker URL here to receive problem uploads server-side.
     Leave empty to keep submissions in the device's local queue. */
  problemUploadEndpoint: "",

  plans: [
    {
      id: "preview",
      name: "Free look",
      priceExample: "Free",
      status: "available",
      blurb: "Shop rules, Coach, 14 shop photos (including Problems), and 2 bay videos. Enough to see how WRAP 911 trains. Jobs, drills, calculator, and the rest of the library unlock with the pack."
    },
    {
      id: "w911-pack",
      name: "W911-PACK (default)",
      priceExample: "$149",
      status: "locked-price",
      blurb: "Full trainer for the shop. All photos, Problems database, videos, drills, jobs, and calculator. 5 seats, 12 months."
    },
    {
      id: "w911-seat",
      name: "W911-SEAT",
      priceExample: "$49 one-time",
      status: "locked-price",
      blurb: "One tech, 12 months. Same library as the pack."
    }
  ],

  demoCodes: {}
};
