#!/usr/bin/env python3
"""Create the Shop Pack and Seat non-renewing IAPs in App Store Connect.

Idempotent. Does not submit for review, does not attach a build, and does
not change the app's price. The API key is read from a file. Nothing in
this script prints the key, the token, or request headers.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import threading
import time
from decimal import Decimal
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import jwt
import requests

APP_ID = os.environ.get("ASC_APP_ID", "6816763473")
BASE = "https://api.appstoreconnect.apple.com"
ROOT = Path(__file__).resolve().parents[1]

PACK_ID = "com.wrap911.trainer.pack.12mo"
SEAT_ID = "com.wrap911.trainer.seat.12mo"
PRODUCTS = [
    {
        "productId": PACK_ID,
        "referenceName": "WRAP 911 Shop Pack",
        "displayName": "WRAP 911 Shop Pack",
        "description": "5 seats, 12 months, full trainer. One-time.",
        "price": Decimal("149.00"),
    },
    {
        "productId": SEAT_ID,
        "referenceName": "WRAP 911 Seat",
        "displayName": "WRAP 911 Seat",
        "description": "1 seat, 12 months, full trainer. One-time.",
        "price": Decimal("49.00"),
    },
]
REVIEW_NOTE = (
    "Non-renewing 12-month access. The app unlocks this phone for 365 days "
    "from the purchase date and does not auto-renew. Shop Pack covers 5 seats. "
    "Restore Purchases is on the Pricing screen."
)

# These calls would submit or attach a build. The client refuses them.
BLOCKED_PATH_PARTS = (
    "reviewSubmissions",
    "reviewSubmissionItems",
    "appStoreVersionSubmissions",
    "inAppPurchaseSubmissions",
    "appStoreVersions",
    "buildUploads",
)


def self_check() -> None:
    for product in PRODUCTS:
        name = product["displayName"]
        desc = product["description"]
        if len(name) > 30:
            raise SystemExit("display name longer than 30: " + name)
        if len(desc) > 45:
            raise SystemExit("description longer than 45: " + desc)
        if "$29" in name or "$29" in desc or "shop owner" in desc.lower():
            raise SystemExit("copy is not allowed")
    points = [
        {"id": "a", "customerPrice": "148.00"},
        {"id": "b", "customerPrice": "149.00"},
        {"id": "c", "customerPrice": "149.99"},
    ]
    found = match_price(points, Decimal("149.00"))
    if found["id"] != "b":
        raise SystemExit("price matcher failed")
    try:
        match_price(points, Decimal("49.00"))
    except LookupError:
        pass
    else:
        raise SystemExit("price matcher accepted a missing price")
    print("self-check ok")


def match_price(points: list[dict], target: Decimal) -> dict:
    exact = [p for p in points if Decimal(str(p["customerPrice"])) == target]
    if not exact:
        nearby = sorted(points, key=lambda p: abs(Decimal(str(p["customerPrice"])) - target))[:5]
        shown = ", ".join(str(p["customerPrice"]) for p in nearby)
        raise LookupError(f"no USA price point for {target}. Nearby: {shown}")
    return exact[0]


class Asc:
    def __init__(self, key_path: str, key_id: str, issuer_id: str):
        self._key = Path(key_path).read_text()
        self._key_id = key_id
        self._issuer = issuer_id
        if "BEGIN PRIVATE KEY" not in self._key:
            raise SystemExit("API key file is not a private key")

    def _token(self) -> str:
        now = int(time.time())
        token = jwt.encode(
            {"iss": self._issuer, "iat": now, "exp": now + 600, "aud": "appstoreconnect-v1"},
            self._key,
            algorithm="ES256",
            headers={"kid": self._key_id},
        )
        if isinstance(token, bytes):
            token = token.decode()
        return token

    def request(self, method: str, path: str, body: dict | None = None, ok: tuple[int, ...] = ()) -> tuple[int, dict]:
        for part in BLOCKED_PATH_PARTS:
            if part in path:
                raise SystemExit("refusing blocked App Store Connect call: " + part)
        url = path if path.startswith("http") else BASE + path
        headers = {"Authorization": "Bearer " + self._token(), "Content-Type": "application/json"}
        response = requests.request(method, url, headers=headers, json=body, timeout=90)
        text = response.text or ""
        try:
            payload = json.loads(text) if text else {}
        except json.JSONDecodeError:
            payload = {"raw": text[:800]}
        if response.status_code not in ok and response.status_code >= 400:
            detail = json.dumps(payload)[:1200]
            print(f"{method} {path.split('?')[0]} -> {response.status_code} {detail}")
        return response.status_code, payload

    def get_all(self, path: str) -> list[dict]:
        items: list[dict] = []
        included: list[dict] = []
        next_path: str | None = path
        while next_path:
            status, payload = self.request("GET", next_path, ok=(200,))
            if status != 200:
                return items
            data = payload.get("data")
            if isinstance(data, list):
                items.extend(data)
            elif isinstance(data, dict):
                items.append(data)
            included.extend(payload.get("included") or [])
            next_path = (payload.get("links") or {}).get("next")
        for item in items:
            item["_included"] = included
        return items


def list_iaps(api: Asc) -> list[dict]:
    return api.get_all(f"/v1/apps/{APP_ID}/inAppPurchasesV2?limit=200")


def ensure_iap(api: Asc, product: dict) -> dict:
    existing = [row for row in list_iaps(api) if (row.get("attributes") or {}).get("productId") == product["productId"]]
    if existing:
        row = existing[0]
        attrs = row.get("attributes") or {}
        print(f"exists {product['productId']} id={row.get('id')} state={attrs.get('state')} type={attrs.get('inAppPurchaseType')}")
        if attrs.get("inAppPurchaseType") != "NON_RENEWING_SUBSCRIPTION":
            raise SystemExit(product["productId"] + " already exists as " + str(attrs.get("inAppPurchaseType")))
        if attrs.get("name") != product["referenceName"] or attrs.get("familySharable") not in (False, None):
            status, updated = api.request(
                "PATCH",
                f"/v2/inAppPurchases/{row['id']}",
                {
                    "data": {
                        "type": "inAppPurchases",
                        "id": row["id"],
                        "attributes": {
                            "name": product["referenceName"],
                            "reviewNote": REVIEW_NOTE,
                            "familySharable": False,
                        },
                    }
                },
                ok=(200,),
            )
            if status != 200:
                status, updated = api.request(
                    "PATCH",
                    f"/v2/inAppPurchases/{row['id']}",
                    {
                        "data": {
                            "type": "inAppPurchases",
                            "id": row["id"],
                            "attributes": {"name": product["referenceName"], "reviewNote": REVIEW_NOTE},
                        }
                    },
                    ok=(200,),
                )
            if status == 200:
                row = updated["data"]
        return row

    body = {
        "data": {
            "type": "inAppPurchases",
            "attributes": {
                "name": product["referenceName"],
                "productId": product["productId"],
                "inAppPurchaseType": "NON_RENEWING_SUBSCRIPTION",
                "familySharable": False,
                "reviewNote": REVIEW_NOTE,
            },
            "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
        }
    }
    status, created = api.request("POST", "/v2/inAppPurchases", body, ok=(201, 409))
    if status == 409:
        # A retry can lose the race with a previous create. Read it back.
        again = [row for row in list_iaps(api) if (row.get("attributes") or {}).get("productId") == product["productId"]]
        if not again:
            raise SystemExit("create conflict but product was not listed: " + product["productId"])
        return again[0]
    if status != 201:
        # Some product types reject familySharable. Retry without it.
        body["data"]["attributes"].pop("familySharable", None)
        status, created = api.request("POST", "/v2/inAppPurchases", body, ok=(201,))
        if status != 201:
            raise SystemExit("could not create " + product["productId"])
    row = created["data"]
    attrs = row.get("attributes") or {}
    print(f"created {product['productId']} id={row.get('id')} state={attrs.get('state')} familySharable={attrs.get('familySharable')}")
    return row


def ensure_localization(api: Asc, iap_id: str, product: dict) -> str:
    status, versions = api.request("GET", f"/v2/inAppPurchases/{iap_id}/versions?limit=20", ok=(200, 404))
    version_id = None
    if status == 200:
        rows = versions.get("data") or []
        if rows:
            version_id = rows[0]["id"]
        else:
            status, created = api.request(
                "POST",
                "/v1/inAppPurchaseVersions",
                {"data": {"type": "inAppPurchaseVersions", "relationships": {"inAppPurchase": {"data": {"type": "inAppPurchases", "id": iap_id}}}}},
                ok=(201, 409),
            )
            if status == 201:
                version_id = created["data"]["id"]
                print(f"version {version_id} state={(created['data'].get('attributes') or {}).get('state')}")
            elif status == 409:
                status, versions = api.request("GET", f"/v2/inAppPurchases/{iap_id}/versions?limit=20", ok=(200,))
                rows = (versions.get("data") or []) if status == 200 else []
                if rows:
                    version_id = rows[0]["id"]

    loc_path = f"/v1/inAppPurchaseVersions/{version_id}/localizations?limit=50" if version_id else f"/v1/inAppPurchases/{iap_id}/inAppPurchaseLocalizations?limit=50"
    status, locs = api.request("GET", loc_path, ok=(200, 404))
    current = None
    if status == 200:
        for loc in locs.get("data") or []:
            if (loc.get("attributes") or {}).get("locale") == "en-US":
                current = loc
                break
    wanted = {"name": product["displayName"], "description": product["description"], "locale": "en-US"}
    if current:
        attrs = current.get("attributes") or {}
        if attrs.get("name") == wanted["name"] and attrs.get("description") == wanted["description"]:
            print(f"localization en-US already set on {iap_id}")
            return "present"
        status, _patched = api.request(
            "PATCH",
            f"/v1/inAppPurchaseLocalizations/{current['id']}",
            {"data": {"type": "inAppPurchaseLocalizations", "id": current["id"], "attributes": {"name": wanted["name"], "description": wanted["description"]}}},
            ok=(200,),
        )
        print(f"localization patched status={status}")
        return "patched" if status == 200 else "patch-failed"

    if version_id:
        body = {
            "data": {
                "type": "inAppPurchaseLocalizations",
                "attributes": wanted,
                "relationships": {"version": {"data": {"type": "inAppPurchaseVersions", "id": version_id}}},
            }
        }
        status, _created = api.request("POST", "/v2/inAppPurchaseLocalizations", body, ok=(201, 409))
        if status in (201, 409):
            print(f"localization v2 status={status}")
            return "created" if status == 201 else "present"
    body = {
        "data": {
            "type": "inAppPurchaseLocalizations",
            "attributes": wanted,
            "relationships": {"inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}}},
        }
    }
    status, _created = api.request("POST", "/v1/inAppPurchaseLocalizations", body, ok=(201, 409))
    print(f"localization v1 status={status}")
    if status not in (201, 409):
        return "failed"
    return "created" if status == 201 else "present"


def usa_price_points(api: Asc, iap_id: str) -> list[dict]:
    path = f"/v2/inAppPurchases/{iap_id}/pricePoints?filter[territory]=USA&limit=200"
    points = []
    while path:
        status, payload = api.request("GET", path, ok=(200,))
        if status != 200:
            break
        for row in payload.get("data") or []:
            attrs = row.get("attributes") or {}
            if "customerPrice" in attrs:
                points.append({"id": row["id"], "customerPrice": attrs["customerPrice"], "proceeds": attrs.get("proceeds")})
        path = (payload.get("links") or {}).get("next")
    return points


def current_usa_price(api: Asc, iap_id: str) -> str | None:
    status, schedule = api.request(
        "GET",
        f"/v1/inAppPurchasePriceSchedules/{iap_id}/manualPrices?include=inAppPurchasePricePoint,territory&limit=50",
        ok=(200, 404),
    )
    if status != 200:
        return None
    by_id = {row["id"]: row for row in (schedule.get("included") or []) if row.get("type") == "inAppPurchasePricePoints"}
    for price in schedule.get("data") or []:
        rel = ((price.get("relationships") or {}).get("territory") or {}).get("data") or {}
        if rel.get("id") not in (None, "USA"):
            continue
        point_id = (((price.get("relationships") or {}).get("inAppPurchasePricePoint") or {}).get("data") or {}).get("id")
        point = by_id.get(point_id) or {}
        customer = (point.get("attributes") or {}).get("customerPrice")
        if customer:
            return str(customer)
    return None


def ensure_price(api: Asc, iap_id: str, target: Decimal) -> str:
    current = current_usa_price(api, iap_id)
    if current is not None and Decimal(current) == target:
        print(f"price already {current} on {iap_id}")
        return current
    point = match_price(usa_price_points(api, iap_id), target)
    local_id = "${price}"
    body = {
        "data": {
            "type": "inAppPurchasePriceSchedules",
            "relationships": {
                "baseTerritory": {"data": {"type": "territories", "id": "USA"}},
                "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iap_id}},
                "manualPrices": {"data": [{"type": "inAppPurchasePrices", "id": local_id}]},
            },
        },
        "included": [
            {
                "type": "inAppPurchasePrices",
                "id": local_id,
                "attributes": {"startDate": None, "endDate": None},
                "relationships": {
                    "inAppPurchasePricePoint": {"data": {"type": "inAppPurchasePricePoints", "id": point["id"]}},
                    "inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}},
                },
            }
        ],
    }
    status, _payload = api.request("POST", "/v1/inAppPurchasePriceSchedules", body, ok=(201, 200, 409))
    print(f"price schedule status={status} target={target} point={point['customerPrice']}")
    confirmed = current_usa_price(api, iap_id)
    if confirmed is None or Decimal(confirmed) != target:
        raise SystemExit(f"USA price for {iap_id} is {confirmed}, wanted {target}")
    return confirmed


def ensure_iap_us_only(api: Asc, iap_id: str) -> str:
    status, current = api.request(
        "GET",
        f"/v2/inAppPurchases/{iap_id}/inAppPurchaseAvailability?include=availableTerritories&limit[availableTerritories]=200",
        ok=(200, 404),
    )
    if status == 200:
        territories = [
            ((row.get("relationships") or {}).get("territory") or {}).get("data", {}).get("id")
            or row.get("id")
            for row in (current.get("included") or [])
            if row.get("type") == "territories"
        ]
        if not territories:
            territories = [
                row.get("id")
                for row in (((current.get("data") or {}).get("relationships") or {}).get("availableTerritories") or {}).get("data") or []
            ]
        attrs = (current.get("data") or {}).get("attributes") or {}
        only_us = territories == ["USA"] and attrs.get("availableInNewTerritories") is False
        print(f"iap availability {iap_id} territories={territories[:12]} count={len(territories)} newTerritories={attrs.get('availableInNewTerritories')}")
        if only_us:
            return "USA"
        availability_id = (current.get("data") or {}).get("id")
        if availability_id:
            status, _patched = api.request(
                "PATCH",
                f"/v1/inAppPurchaseAvailabilities/{availability_id}",
                {
                    "data": {
                        "type": "inAppPurchaseAvailabilities",
                        "id": availability_id,
                        "attributes": {"availableInNewTerritories": False},
                        "relationships": {"availableTerritories": {"data": [{"type": "territories", "id": "USA"}]}},
                    }
                },
                ok=(200,),
            )
            if status == 200:
                return "USA"
    status, _created = api.request(
        "POST",
        "/v1/inAppPurchaseAvailabilities",
        {
            "data": {
                "type": "inAppPurchaseAvailabilities",
                "attributes": {"availableInNewTerritories": False},
                "relationships": {
                    "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iap_id}},
                    "availableTerritories": {"data": [{"type": "territories", "id": "USA"}]},
                },
            }
        },
        ok=(201, 409),
    )
    print(f"iap availability post {iap_id} status={status}")
    return "USA" if status in (201, 409) else "unknown"


def capture_pricing_screenshot(dest: Path) -> None:
    from playwright.sync_api import sync_playwright

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, fmt: str, *args) -> None:
            return

        def handle(self) -> None:
            try:
                super().handle()
            except (BrokenPipeError, ConnectionResetError):
                return

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    stub = r"""
      window.Capacitor = {
        isNativePlatform: function () { return true; },
        getPlatform: function () { return "ios"; },
        Plugins: {
          NativePurchases: {
            getStorefront: function () { return Promise.resolve({ countryCode: "USA", storefrontId: "143441" }); },
            getProducts: function () { return Promise.resolve({ products: [
              { identifier: "com.wrap911.trainer.pack.12mo", priceString: "$149.00" },
              { identifier: "com.wrap911.trainer.seat.12mo", priceString: "$49.00" }
            ] }); },
            getPurchases: function () { return Promise.resolve({ purchases: [] }); },
            restorePurchases: function () { return Promise.resolve(); },
            purchaseProduct: function () { return Promise.resolve({}); },
            addListener: function () { return Promise.resolve({ remove: function () {} }); }
          }
        }
      };
    """
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            context = browser.new_context(
                viewport={"width": 430, "height": 932},
                device_scale_factor=3,
                is_mobile=True,
                has_touch=True,
            )
            context.add_init_script(stub)
            page = context.new_page()
            page.route("**/sw.js", lambda route: route.abort())
            page.route("**/*wrap911-coach-proxy*", lambda route: route.abort())
            page.goto(f"http://127.0.0.1:{port}/trainer/index.html", wait_until="domcontentloaded", timeout=60000)
            page.wait_for_function("() => window.WRAP911_APP && window.WRAP911_APP.core && window.WRAP911_APP.core.showScreen", timeout=30000)
            page.evaluate("() => window.WRAP911_APP.core.showScreen('pricing')")
            page.wait_for_selector("#iap-card button.buy", timeout=20000)
            page.wait_for_function(
                "() => document.getElementById('screen-pricing') && document.getElementById('screen-pricing').classList.contains('active')"
            )
            text = page.locator("#screen-pricing").inner_text()
            folded = text.casefold()
            if "$29" in text:
                raise SystemExit("pricing screenshot contains $29")
            for needle in ("buy shop pack", "$149.00", "buy seat", "$49.00", "restore purchases", "buy on wrap911.com"):
                if needle not in folded:
                    raise SystemExit("pricing screenshot missing " + needle)
            page.evaluate("() => { const screen = document.getElementById('screen-pricing'); if (screen) screen.scrollIntoView({block:'start'}); window.scrollTo(0, 0); }")
            page.screenshot(path=str(dest), full_page=False)
            browser.close()
    finally:
        server.shutdown()
    if not dest.exists() or dest.stat().st_size < 1000:
        raise SystemExit("screenshot file was not written")
    print(f"screenshot {dest.name} bytes={dest.stat().st_size}")


def upload_screenshot(api: Asc, iap_id: str, image: Path) -> str:
    status, existing = api.request("GET", f"/v2/inAppPurchases/{iap_id}/appStoreReviewScreenshot", ok=(200, 404))
    if status == 200:
        state = ((existing.get("data") or {}).get("attributes") or {}).get("assetDeliveryState") or {}
        print(f"screenshot already present on {iap_id} state={state.get('state')}")
        if state.get("state") in ("COMPLETE", "UPLOAD_COMPLETE"):
            return str(state.get("state"))
    data = image.read_bytes()
    checksum = hashlib.md5(data).hexdigest()
    status, reserved = api.request(
        "POST",
        "/v1/inAppPurchaseAppStoreReviewScreenshots",
        {
            "data": {
                "type": "inAppPurchaseAppStoreReviewScreenshots",
                "attributes": {"fileName": image.name, "fileSize": len(data)},
                "relationships": {"inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}}},
            }
        },
        ok=(201,),
    )
    if status != 201:
        return "reserve-failed"
    shot = reserved["data"]
    for operation in (shot.get("attributes") or {}).get("uploadOperations") or []:
        offset = int(operation.get("offset") or 0)
        length = int(operation.get("length") or len(data))
        headers = {item["name"]: item["value"] for item in operation.get("requestHeaders") or []}
        put = requests.request(operation.get("method") or "PUT", operation["url"], data=data[offset:offset + length], headers=headers, timeout=120)
        if put.status_code >= 400:
            print(f"screenshot upload chunk -> {put.status_code}")
            return "upload-failed"
    status, _committed = api.request(
        "PATCH",
        f"/v1/inAppPurchaseAppStoreReviewScreenshots/{shot['id']}",
        {"data": {"type": "inAppPurchaseAppStoreReviewScreenshots", "id": shot["id"], "attributes": {"uploaded": True, "sourceFileChecksum": checksum}}},
        ok=(200,),
    )
    if status != 200:
        return "commit-failed"
    final = "UPLOAD_COMPLETE"
    for _ in range(6):
        status, check = api.request("GET", f"/v1/inAppPurchaseAppStoreReviewScreenshots/{shot['id']}", ok=(200,))
        state = ((check.get("data") or {}).get("attributes") or {}).get("assetDeliveryState") or {}
        final = str(state.get("state") or final)
        errors = state.get("errors") or []
        if errors:
            print("screenshot errors " + json.dumps(errors)[:500])
        if final in ("COMPLETE", "FAILED"):
            break
        time.sleep(3)
    print(f"screenshot {iap_id} {final}")
    return final


def read_agreements(api: Asc) -> list[dict]:
    status, payload = api.request("GET", "/v1/agreements?limit=20", ok=(200, 403, 404))
    if status != 200:
        return [{"endpoint": "/v1/agreements", "http": status}]
    rows = []
    for item in payload.get("data") or []:
        attrs = item.get("attributes") or {}
        safe = {key: attrs.get(key) for key in ("agreementType", "status", "state") if key in attrs}
        safe["id"] = item.get("id")
        safe["attributeKeys"] = sorted(attrs.keys())
        rows.append(safe)
    return rows or [{"endpoint": "/v1/agreements", "http": 200, "count": 0}]


def read_build_10(api: Asc) -> dict:
    status, payload = api.request(
        "GET",
        f"/v1/builds?filter[app]={APP_ID}&filter[version]=10&limit=10&sort=-uploadedDate",
        ok=(200,),
    )
    if status != 200:
        return {"http": status}
    builds = []
    for row in payload.get("data") or []:
        attrs = row.get("attributes") or {}
        builds.append({
            "id": row.get("id"),
            "version": attrs.get("version"),
            "processingState": attrs.get("processingState"),
            "uploadedDate": attrs.get("uploadedDate"),
            "expired": attrs.get("expired"),
        })
    return {"builds": builds}


def read_app_price(api: Asc) -> dict:
    status, payload = api.request("GET", f"/v1/apps/{APP_ID}/appPriceSchedule?include=manualPrices", ok=(200, 404, 403))
    if status != 200:
        return {"http": status, "changed": False}
    data = payload.get("data") or {}
    manual = []
    if isinstance(data, dict):
        manual = ((data.get("relationships") or {}).get("manualPrices") or {}).get("data") or []
    return {"http": 200, "changed": False, "manualPriceCount": len(manual)}


def set_app_us_only(api: Asc) -> dict:
    status, current = api.request(
        "GET",
        f"/v2/appAvailabilities/{APP_ID}?include=territoryAvailabilities&limit[territoryAvailabilities]=50",
        ok=(200, 404, 403),
    )
    available_now: list[str] = []
    if status == 200:
        for row in current.get("included") or []:
            if row.get("type") != "territoryAvailabilities":
                continue
            attrs = row.get("attributes") or {}
            territory = ((row.get("relationships") or {}).get("territory") or {}).get("data") or {}
            if attrs.get("available") is True:
                available_now.append(territory.get("id") or row.get("id"))
        new_flag = ((current.get("data") or {}).get("attributes") or {}).get("availableInNewTerritories")
        print(f"app availability now count={len(available_now)} sample={available_now[:8]} newTerritories={new_flag}")
        if available_now == ["USA"] and new_flag is False:
            return {"result": "already-usa", "available": available_now}

    territories = api.get_all("/v1/territories?limit=200")
    territory_ids = [row["id"] for row in territories if row.get("id")]
    if "USA" not in territory_ids:
        return {"result": "no-territory-list", "http": status}
    included = []
    refs = []
    for territory_id in territory_ids:
        local = "${" + territory_id + "}"
        refs.append({"type": "territoryAvailabilities", "id": local})
        included.append({
            "type": "territoryAvailabilities",
            "id": local,
            "attributes": {"available": territory_id == "USA", "preOrderEnabled": False},
            "relationships": {"territory": {"data": {"type": "territories", "id": territory_id}}},
        })
    body = {
        "data": {
            "type": "appAvailabilities",
            "attributes": {"availableInNewTerritories": False},
            "relationships": {
                "app": {"data": {"type": "apps", "id": APP_ID}},
                "territoryAvailabilities": {"data": refs},
            },
        },
        "included": included,
    }
    if status == 200:
        patch_body = {
            "data": {
                "type": "appAvailabilities",
                "id": APP_ID,
                "attributes": {"availableInNewTerritories": False},
                "relationships": {"territoryAvailabilities": {"data": refs}},
            },
            "included": included,
        }
        patch_status, _patched = api.request("PATCH", f"/v2/appAvailabilities/{APP_ID}", patch_body, ok=(200,))
        print(f"app availability patch -> {patch_status}")
        if patch_status == 200:
            return {"result": "patched-usa", "previousAvailable": available_now}
    post_status, _posted = api.request("POST", "/v2/appAvailabilities", body, ok=(201, 409))
    print(f"app availability post -> {post_status}")
    return {"result": "posted" if post_status == 201 else "unchanged", "http": post_status, "previousAvailable": available_now}


def refresh_state(api: Asc, iap_id: str) -> dict:
    status, payload = api.request("GET", f"/v2/inAppPurchases/{iap_id}", ok=(200,))
    attrs = (payload.get("data") or {}).get("attributes") or {}
    if status != 200:
        return {"http": status}
    return {
        "id": iap_id,
        "name": attrs.get("name"),
        "productId": attrs.get("productId"),
        "type": attrs.get("inAppPurchaseType"),
        "state": attrs.get("state"),
        "familySharable": attrs.get("familySharable"),
    }


def main() -> None:
    if "--self-check" in sys.argv:
        self_check()
        return
    if "--screenshot-only" in sys.argv:
        dest = Path(sys.argv[sys.argv.index("--screenshot-only") + 1]) if len(sys.argv) > sys.argv.index("--screenshot-only") + 1 else Path("/tmp/wrap911-pricing.png")
        capture_pricing_screenshot(dest)
        return

    key_path = os.environ.get("KEY_PATH") or ""
    key_id = os.environ.get("ASC_KEY_ID") or ""
    issuer = os.environ.get("ASC_ISSUER_ID") or ""
    if not key_path or not key_id or not issuer:
        raise SystemExit("KEY_PATH, ASC_KEY_ID, and ASC_ISSUER_ID are required")
    api = Asc(key_path, key_id, issuer)
    summary: dict = {"products": [], "agreements": [], "build10": {}, "appAvailability": {}, "appPriceReadOnly": {}}
    screenshot_path = Path(os.environ.get("SCREENSHOT_PATH", "/tmp/wrap911-pricing.png"))
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    screenshot_state = "not-attempted"
    try:
        capture_pricing_screenshot(screenshot_path)
        screenshot_state = "captured"
    except Exception as exc:
        screenshot_state = "capture-failed: " + type(exc).__name__ + " " + str(exc)[:300]
        print("screenshot capture failed: " + screenshot_state)

    for product in PRODUCTS:
        row = ensure_iap(api, product)
        iap_id = row["id"]
        localization = ensure_localization(api, iap_id, product)
        price = ensure_price(api, iap_id, product["price"])
        availability = ensure_iap_us_only(api, iap_id)
        shot = "not-uploaded"
        if screenshot_state == "captured":
            shot = upload_screenshot(api, iap_id, screenshot_path)
        state = refresh_state(api, iap_id)
        summary["products"].append({
            "productId": product["productId"],
            "referenceName": product["referenceName"],
            "iapId": iap_id,
            "localization": localization,
            "usaPrice": price,
            "availability": availability,
            "screenshot": shot,
            **state,
        })

    def safe(label: str, fn):
        try:
            return fn()
        except Exception as exc:
            print(label + " failed: " + str(exc)[:400])
            return {"error": type(exc).__name__}

    summary["agreements"] = safe("agreements", lambda: read_agreements(api))
    summary["build10"] = safe("build", lambda: read_build_10(api))
    summary["appPriceReadOnly"] = safe("app price", lambda: read_app_price(api))
    summary["appAvailability"] = safe("app availability", lambda: set_app_us_only(api))
    summary["screenshotCapture"] = screenshot_state
    text = json.dumps(summary, indent=2, sort_keys=True)
    print("SUMMARY_JSON_BEGIN")
    print(text)
    print("SUMMARY_JSON_END")
    out = os.environ.get("SUMMARY_PATH")
    if out:
        dest = Path(out)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(text + "\n")
    wanted = {PACK_ID: Decimal("149.00"), SEAT_ID: Decimal("49.00")}
    bad = []
    for row in summary["products"]:
        try:
            price_ok = Decimal(str(row.get("usaPrice"))) == wanted.get(row.get("productId"))
        except Exception:
            price_ok = False
        if not price_ok or row.get("type") != "NON_RENEWING_SUBSCRIPTION":
            bad.append(row.get("productId"))
    if bad:
        raise SystemExit("one or more products did not stick")


if __name__ == "__main__":
    main()
