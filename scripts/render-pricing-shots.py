#!/usr/bin/env python3
"""Render the iOS Pricing screen at the App Store screenshot sizes.

Uses the trainer as it ships in this checkout, with a StoreKit stub.
Shop Pack stays the gradient button. Seat and 7-Day Pass are outlined.
"""
from __future__ import annotations

import io
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SHOTS = (
    {
        "path": ROOT / "appstore/screenshots-v2/iphone-6.9/06-pricing.png",
        "width": 440,
        "height": 956,
        "scale": 3,
        "pixels": (1320, 2868),
    },
    {
        "path": ROOT / "appstore/screenshots-v2/ipad-13/06-pricing.png",
        "width": 1032,
        "height": 1376,
        "scale": 2,
        "pixels": (2064, 2752),
    },
)
STUB = r"""
  window.Capacitor = {
    isNativePlatform: function () { return true; },
    getPlatform: function () { return "ios"; },
    Plugins: {
      NativePurchases: {
        getStorefront: function () { return Promise.resolve({ countryCode: "USA" }); },
        getProducts: function () { return Promise.resolve({ products: [
          { identifier: "com.wrap911.trainer.pack.12mo", priceString: "$149.00" },
          { identifier: "com.wrap911.trainer.seat.12mo", priceString: "$49.00" },
          { identifier: "com.wrap911.trainer.pass.7d", priceString: "$12.99" }
        ] }); },
        getPurchases: function () { return Promise.resolve({ purchases: [] }); },
        purchaseProduct: function () { return Promise.resolve({}); },
        addListener: function () { return Promise.resolve({ remove: function () {} }); },
        diagnostics: function () { return Promise.resolve({ canMakePayments: true, build: "25" }); }
      }
    }
  };
"""


def check(page) -> None:
    page.wait_for_function(
        "() => { const h = document.querySelector('#screen-pricing h1'); const c = document.getElementById('iap-card'); return h && c && h.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING; }"
    )
    heading = page.locator("#screen-pricing h1").bounding_box()
    card = page.locator("#iap-card").bounding_box()
    if not heading or not card or heading["y"] >= card["y"]:
        raise SystemExit("PRICING heading is not above the purchase card")
    text = page.locator("#screen-pricing").inner_text()
    folded = text.casefold()
    for needle in ("buy 7-day pass", "$12.99", "buy seat", "$49.00", "buy shop pack", "$149.00", "restore with email"):
        if needle not in folded:
            raise SystemExit("pricing screen missing " + needle)
    for banned in ("stripe", "buy on wrap911", "unlock code", "arlon", "temperature"):
        if banned in folded:
            raise SystemExit("pricing screen contains " + banned)
    if page.locator("body > a.w911-privacy-link").count():
        raise SystemExit("a privacy link is floating outside the purchase card")
    seat_bg = page.locator("#iap-card button.buy.seat").first.evaluate("el => getComputedStyle(el).backgroundImage")
    pack_bg = page.locator("#iap-card button.buy:not(.seat)").first.evaluate("el => getComputedStyle(el).backgroundImage")
    restore_bg = page.locator("#iap-card button.restore").first.evaluate("el => getComputedStyle(el).backgroundImage")
    if "gradient" in seat_bg or "gradient" in restore_bg:
        raise SystemExit("Seat or Restore is using the gradient")
    if "gradient" not in pack_bg:
        raise SystemExit("Shop Pack is not the gradient button")


def save_rgb(png: bytes, dest: Path, pixels: tuple[int, int]) -> None:
    image = Image.open(io.BytesIO(png)).convert("RGB")
    if image.size != pixels:
        raise SystemExit(f"{dest.name} is {image.size}, wanted {pixels}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "PNG")
    print(f"wrote {dest.relative_to(ROOT)} {image.size[0]}x{image.size[1]}")


def main() -> None:
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, fmt: str, *args) -> None:
            return

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            for shot in SHOTS:
                context = browser.new_context(
                    viewport={"width": shot["width"], "height": shot["height"]},
                    device_scale_factor=shot["scale"],
                    is_mobile=shot["width"] < 800,
                    has_touch=True,
                )
                context.add_init_script(STUB)
                page = context.new_page()
                page.route("**/sw.js", lambda route: route.abort())
                page.goto(f"http://127.0.0.1:{port}/trainer/index.html", wait_until="domcontentloaded", timeout=60000)
                page.wait_for_function("() => window.WRAP911_APP && window.WRAP911_APP.core && window.WRAP911_APP.core.showScreen")
                page.evaluate("() => window.WRAP911_APP.core.showScreen('pricing')")
                page.wait_for_selector("#iap-card button.buy.seat", timeout=20000)
                page.wait_for_timeout(400)
                check(page)
                save_rgb(page.screenshot(full_page=False, type="png"), shot["path"], shot["pixels"])
                context.close()
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
