#!/usr/bin/env python3
"""Attach build 25 and the 7-Day Pass to the existing App Store version 1.2.

Reuses version 600c93dd-0a49-4a1a-9d7c-3c402dadc446. Does not create a version,
does not change App Store screenshots, does not change prices, and does not
reply in Resolution Center. The API key is read from the environment. Nothing
in this script prints the key, the token, or request headers.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from decimal import Decimal

APP_ID = "6816763473"
VERSION_ID = "600c93dd-0a49-4a1a-9d7c-3c402dadc446"
TRAIN = "1.2"
BUILD_NUMBER = "25"
PASS_ID = "com.wrap911.trainer.pass.7d"
PASS_NAME = "WRAP 911 7-Day Pass"
PUBLIC_EMAIL = "info@wrap911.com"
BASE = "https://api.appstoreconnect.apple.com"
WHATS_NEW = (
    "Adds a 7-day pass for the full trainer on this phone. It does not auto-renew. "
    "Shop Pack and Seat are unchanged. Restore with email is unchanged."
)
NOTES = """Guideline 3.1.1: Shop Pack (com.wrap911.trainer.pack.12mo), Seat (com.wrap911.trainer.seat.12mo), and 7-Day Pass (com.wrap911.trainer.pass.7d) are non-renewing subscriptions on the Pricing screen. They do not auto-renew. Shop Pack and Seat unlock this phone for 12 months from the purchase date. The 7-Day Pass unlocks this phone for 7 days from the purchase date. Shop Pack covers 5 seats. Seat and the 7-Day Pass cover this phone.

Restore does not ask for an Apple Account or password and does not call AppStore.sync() or restoreCompletedTransactions(). The button is Restore with email. On the phone that bought the plan, the app reads StoreKit 2 Transaction.currentEntitlements and Transaction.all. On a new phone, the buyer enters the email saved after purchase, we send a one-time code, and the app restores the original expiry.

The Pricing screen opens with no account. Version 1.2, build 25. The iOS app has no Stripe link, no website buy button, and no unlock-code field.

The AI Coach asks permission before sending a question to the server. Declining uses the offline answers.

Review contact: info@wrap911.com
"""
EDITABLE = {
    "PREPARE_FOR_SUBMISSION",
    "READY_FOR_REVIEW",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
    "INVALID_BINARY",
    "WAITING_FOR_EXPORT_COMPLIANCE",
}
DONE = {"WAITING_FOR_REVIEW", "IN_REVIEW", "UNRESOLVED", "COMPLETE"}
IAP_READY = {"READY_TO_SUBMIT", "WAITING_FOR_REVIEW", "IN_REVIEW", "PENDING_BINARY_APPROVAL", "DEVELOPER_ACTION_NEEDED"}
FORBIDDEN_WRITES = (
    "appScreenshots",
    "appScreenshotSets",
    "customerReviews",
    "customerReviewResponses",
    "resolutionCenter",
    "inAppPurchasePriceSchedules",
    "appAvailabilities",
    "appPriceSchedules",
)
DROP_PRODUCTS = {
    "com.wrap911.trainer.crew.yearly",
    "com.wrap911.trainer.seat.yearly",
}


def self_check() -> None:
    blob = WHATS_NEW + "\n" + NOTES
    lowered = blob.lower()
    if "$" in WHATS_NEW:
        raise SystemExit("what's new must not hardcode a price")
    for banned in ("arlon", "temperature", "°f", "°c"):
        if banned in lowered:
            raise SystemExit("review copy is not allowed")
    if "no stripe link" not in lowered or "no website buy button" not in lowered or "no unlock-code field" not in lowered:
        raise SystemExit("review notes must describe the iOS purchase rules")
    if "appstore.sync" not in lowered:
        raise SystemExit("review notes must describe restore")
    if VERSION_ID not in open(__file__, encoding="utf-8").read():
        raise SystemExit("version id missing")
    for part in ("appScreenshots", "customerReviews", "resolutionCenter"):
        if part not in FORBIDDEN_WRITES:
            raise SystemExit("write block missing " + part)
    print("self-check ok")


def pem() -> str:
    raw = os.environ["RAW"]
    body = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    lines = [body[i : i + 64] for i in range(0, len(body), 64)]
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(lines) + "\n-----END PRIVATE KEY-----\n"


def token() -> str:
    import jwt

    encoded = jwt.encode(
        {
            "iss": os.environ["ASC_ISSUER_ID"],
            "iat": int(time.time()),
            "exp": int(time.time()) + 1100,
            "aud": "appstoreconnect-v1",
        },
        pem(),
        algorithm="ES256",
        headers={"kid": os.environ["ASC_KEY_ID"]},
    )
    if isinstance(encoded, bytes):
        encoded = encoded.decode()
    return encoded


def err_text(payload: dict) -> str:
    rows = (payload or {}).get("errors") or []
    if not rows:
        return str(payload)[:500]
    return " | ".join(
        " ".join(str(row.get(key) or "") for key in ("code", "title", "detail")).strip() for row in rows
    )


def call(method: str, path: str, params: dict | None = None, body: dict | None = None) -> tuple[int, dict]:
    if method != "GET":
        for part in FORBIDDEN_WRITES:
            if part in path:
                raise SystemExit("refusing " + method + " " + path)
        if method == "POST" and path.split("?", 1)[0].strip("/") in ("v1/appStoreVersions", "appStoreVersions"):
            raise SystemExit("refusing to create an App Store version")
    import requests

    url = path if path.startswith("http") else BASE + "/" + path.lstrip("/")
    if not path.startswith("http") and "/v1/" not in url and "/v2/" not in url:
        url = BASE + "/v1/" + path.lstrip("/")
    headers = {"Authorization": "Bearer " + token()}
    if body is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(method, url, headers=headers, params=params, json=body, timeout=90)
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:400]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} {method} {path.split('?')[0]} {err_text(payload)[:500]}")
    return response.status_code, payload


def pages(path: str, params: dict | None = None) -> list[dict]:
    items: list[dict] = []
    query = dict(params or {})
    guard = 0
    while path and guard < 20:
        guard += 1
        status, payload = call("GET", path, params=query)
        if status >= 400:
            return items
        items.extend(payload.get("data") or [])
        next_url = ((payload.get("links") or {}).get("next")) or ""
        if "/v1/" in next_url:
            path = next_url.split("/v1/", 1)[1]
            query = None
        elif "/v2/" in next_url:
            path = "v2/" + next_url.split("/v2/", 1)[1]
            query = None
        else:
            path = ""
    return items


def version_row() -> dict:
    status, payload = call("GET", f"appStoreVersions/{VERSION_ID}")
    if status >= 400 or not payload.get("data"):
        raise SystemExit("could not read App Store version " + VERSION_ID)
    return payload["data"]


def confirm_version() -> dict:
    row = version_row()
    attrs = row.get("attributes") or {}
    print(
        f"version {attrs.get('versionString')} {row.get('id')} "
        f"state {attrs.get('appStoreState')} release {attrs.get('releaseType')}"
    )
    if row.get("id") != VERSION_ID or str(attrs.get("versionString")) != TRAIN:
        raise SystemExit("this is not version 1.2; another version was not created")
    return row


def find_builds() -> list[dict]:
    rows = pages(
        "builds",
        {"filter[app]": APP_ID, "filter[version]": BUILD_NUMBER, "sort": "-uploadedDate", "limit": 10},
    )
    matched = []
    for row in rows:
        attrs = row.get("attributes") or {}
        if str(attrs.get("version")) != BUILD_NUMBER:
            continue
        status, pre = call("GET", f"builds/{row['id']}/preReleaseVersion")
        train = ((pre.get("data") or {}).get("attributes") or {}).get("version") if status < 400 else ""
        print(
            f"build {attrs.get('version')} {row['id']} train {train or '?'} "
            f"processing {attrs.get('processingState')} encryption {attrs.get('usesNonExemptEncryption')} "
            f"expired {attrs.get('expired')}"
        )
        if str(train) == TRAIN and not attrs.get("expired"):
            matched.append(row)
    return matched


def set_export_compliance(build_id: str) -> bool | None:
    status, payload = call(
        "PATCH",
        f"builds/{build_id}",
        body={
            "data": {
                "type": "builds",
                "id": build_id,
                "attributes": {"usesNonExemptEncryption": False},
            }
        },
    )
    value = ((payload.get("data") or {}).get("attributes") or {}).get("usesNonExemptEncryption")
    print(f"export compliance {build_id} -> {status} usesNonExemptEncryption {value}")
    if status < 400 and value is False:
        return False
    status, fresh = call("GET", f"builds/{build_id}")
    value = ((fresh.get("data") or {}).get("attributes") or {}).get("usesNonExemptEncryption")
    print(f"export compliance read {value}")
    return value if status < 400 else None


def money_is(value: str | None, target: str) -> bool:
    try:
        return Decimal(str(value)) == Decimal(target)
    except Exception:
        return False


def pass_price(iap_id: str) -> str | None:
    status, schedule = call(
        "GET",
        f"inAppPurchasePriceSchedules/{iap_id}/manualPrices",
        params={"include": "inAppPurchasePricePoint,territory", "limit": 50},
    )
    if status != 200:
        return None
    by_id = {row["id"]: row for row in (schedule.get("included") or []) if row.get("type") == "inAppPurchasePricePoints"}
    for price in schedule.get("data") or []:
        rel = ((price.get("relationships") or {}).get("territory") or {}).get("data") or {}
        if rel.get("id") not in (None, "USA"):
            continue
        point_id = (((price.get("relationships") or {}).get("inAppPurchasePricePoint") or {}).get("data") or {}).get("id")
        customer = ((by_id.get(point_id) or {}).get("attributes") or {}).get("customerPrice")
        if customer:
            return str(customer)
    return None


def pass_product() -> dict | None:
    rows = pages(f"apps/{APP_ID}/inAppPurchasesV2", {"limit": 50})
    for row in rows:
        attrs = row.get("attributes") or {}
        if attrs.get("productId") != PASS_ID:
            continue
        versions = pages(f"v2/inAppPurchases/{row['id']}/versions", {"limit": 10})
        names = []
        for version in versions:
            locs = pages(f"inAppPurchaseVersions/{version['id']}/localizations", {"limit": 20})
            if not locs:
                locs = pages(f"inAppPurchaseVersions/{version['id']}/inAppPurchaseLocalizations", {"limit": 20})
            for loc in locs:
                loc_attrs = loc.get("attributes") or {}
                if loc_attrs.get("locale") == "en-US":
                    names.append(loc_attrs.get("name") or "")
        shot_status, shot = call("GET", f"v2/inAppPurchases/{row['id']}/appStoreReviewScreenshot")
        shot_state = ""
        if shot_status == 200:
            shot_state = (((shot.get("data") or {}).get("attributes") or {}).get("assetDeliveryState") or {}).get("state") or ""
        price = pass_price(row["id"])
        print(
            f"iap {PASS_ID} {row['id']} type {attrs.get('inAppPurchaseType')} "
            f"state {attrs.get('state')} duration {attrs.get('duration')} price {price} "
            f"locale {names} screenshot {shot_state or shot_status}"
        )
        return {
            "id": row["id"],
            "state": attrs.get("state"),
            "type": attrs.get("inAppPurchaseType"),
            "duration": attrs.get("duration"),
            "price": price,
            "names": names,
            "screenshot": shot_state,
            "versionIds": [item.get("id") for item in versions if item.get("id")],
        }
    print("iap " + PASS_ID + " is not listed yet")
    return None


def iap_ready(product: dict | None) -> bool:
    if not product:
        return False
    if product.get("type") != "NON_RENEWING_SUBSCRIPTION":
        return False
    if not money_is(product.get("price"), "12.99"):
        return False
    if PASS_NAME not in (product.get("names") or []):
        return False
    if product.get("screenshot") not in ("COMPLETE", "UPLOAD_COMPLETE"):
        return False
    return product.get("state") in IAP_READY


def wait_for_release_bits() -> tuple[dict, dict]:
    deadline = time.time() + 150 * 60
    build = None
    product = None
    while time.time() < deadline:
        builds = find_builds()
        chosen = None
        for row in builds:
            state = (row.get("attributes") or {}).get("processingState")
            if state in ("FAILED", "INVALID"):
                raise SystemExit("build " + BUILD_NUMBER + " is " + str(state))
            if state == "VALID":
                chosen = row
                break
        if chosen is None and builds:
            chosen = builds[0]
        if chosen:
            attrs = chosen.get("attributes") or {}
            if attrs.get("usesNonExemptEncryption") is not False:
                set_export_compliance(chosen["id"])
                status, fresh = call("GET", f"builds/{chosen['id']}")
                if status < 400 and fresh.get("data"):
                    chosen = fresh["data"]
            build = chosen
        product = pass_product()
        processing = ((build or {}).get("attributes") or {}).get("processingState")
        encryption = ((build or {}).get("attributes") or {}).get("usesNonExemptEncryption")
        print(f"waiting build {processing} encryption {encryption} iap {(product or {}).get('state')}")
        if processing == "VALID" and encryption is False and iap_ready(product):
            return build, product
        time.sleep(30)
    raise SystemExit("build " + BUILD_NUMBER + " or the 7-Day Pass was not ready to submit")


def screenshot_counts() -> None:
    locs = pages(f"appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations", {"limit": 10})
    total = 0
    for loc in locs:
        sets = pages(f"appStoreVersionLocalizations/{loc['id']}/appScreenshotSets", {"limit": 20})
        for shot_set in sets:
            display = (shot_set.get("attributes") or {}).get("screenshotDisplayType") or ""
            shots = pages(f"appScreenshotSets/{shot_set['id']}/appScreenshots", {"limit": 20})
            total += len(shots)
            print(f"screenshots {(loc.get('attributes') or {}).get('locale')} {display} count {len(shots)}")
    if total < 12:
        raise SystemExit(f"version screenshots were left unchanged; found {total}")
    print(f"screenshot sets left unchanged, count {total}")


def set_whats_new() -> None:
    locs = pages(f"appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations", {"limit": 10})
    target = None
    for loc in locs:
        if (loc.get("attributes") or {}).get("locale") == "en-US":
            target = loc
            break
    if not target:
        raise SystemExit("version 1.2 has no en-US localization; screenshots were not changed")
    current = (target.get("attributes") or {}).get("whatsNew") or ""
    if current.strip() == WHATS_NEW:
        print("what's new already set")
        return
    status, _payload = call(
        "PATCH",
        f"appStoreVersionLocalizations/{target['id']}",
        body={
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": target["id"],
                "attributes": {"whatsNew": WHATS_NEW},
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not set What's New")
    print("what's new set")


def attach_build(build_id: str) -> None:
    status, payload = call(
        "PATCH",
        f"appStoreVersions/{VERSION_ID}",
        body={
            "data": {
                "type": "appStoreVersions",
                "id": VERSION_ID,
                "relationships": {"build": {"data": {"type": "builds", "id": build_id}}},
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not attach build " + BUILD_NUMBER)
    status, attached = call("GET", f"appStoreVersions/{VERSION_ID}/build")
    attached_version = ((attached.get("data") or {}).get("attributes") or {}).get("version")
    attached_id = (attached.get("data") or {}).get("id")
    print(f"attached build {attached_version} {attached_id}")
    if str(attached_version) != BUILD_NUMBER or attached_id != build_id:
        raise SystemExit("version 1.2 is not attached to build " + BUILD_NUMBER)


def set_notes() -> None:
    status, detail = call("GET", f"appStoreVersions/{VERSION_ID}/appStoreReviewDetail")
    if status < 400 and (detail.get("data") or {}).get("id"):
        review_id = detail["data"]["id"]
        status, _payload = call(
            "PATCH",
            f"appStoreReviewDetails/{review_id}",
            body={
                "data": {
                    "type": "appStoreReviewDetails",
                    "id": review_id,
                    "attributes": {"notes": NOTES},
                }
            },
        )
        if status >= 400:
            raise SystemExit("could not set review notes")
        print("review notes updated")
        return
    status, _created = call(
        "POST",
        "appStoreReviewDetails",
        body={
            "data": {
                "type": "appStoreReviewDetails",
                "attributes": {"notes": NOTES, "contactEmail": PUBLIC_EMAIL},
                "relationships": {
                    "appStoreVersion": {"data": {"type": "appStoreVersions", "id": VERSION_ID}}
                },
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not create review notes")
    print("review notes created")


def list_items(submission_id: str) -> list[dict]:
    return pages(f"reviewSubmissions/{submission_id}/items", {"limit": 50})


def item_target(item: dict) -> str:
    rels = item.get("relationships") or {}
    for key, value in rels.items():
        if key == "reviewSubmission":
            continue
        data = (value or {}).get("data") or {}
        if isinstance(data, dict) and data.get("id"):
            return str(data["id"])
        if isinstance(data, list) and data and data[0].get("id"):
            return str(data[0]["id"])
    return ""


def product_of(entity: str) -> str:
    if not entity or entity == VERSION_ID:
        return ""
    for kind in (f"v2/inAppPurchases/{entity}", f"inAppPurchases/{entity}", f"inAppPurchaseVersions/{entity}"):
        status, payload = call("GET", kind)
        if status >= 400 or not payload.get("data"):
            continue
        attrs = payload["data"].get("attributes") or {}
        if attrs.get("productId"):
            return str(attrs["productId"])
    return ""


def drop_wrong_products(submission_id: str) -> None:
    for item in list_items(submission_id):
        entity = item_target(item)
        if entity == VERSION_ID:
            continue
        product = product_of(entity)
        if product not in DROP_PRODUCTS:
            continue
        status, _payload = call("DELETE", f"reviewSubmissionItems/{item['id']}")
        print(f"removed {product} from draft -> {status}")
        if status not in (200, 202, 204):
            raise SystemExit("could not remove " + product + " from the draft")


def add_item(submission_id: str, relationship: str, resource_type: str, resource_id: str) -> bool:
    status, payload = call(
        "POST",
        "reviewSubmissionItems",
        body={
            "data": {
                "type": "reviewSubmissionItems",
                "relationships": {
                    "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": submission_id}},
                    relationship: {"data": {"type": resource_type, "id": resource_id}},
                },
            }
        },
    )
    detail = err_text(payload) if status >= 400 else ""
    print(f"add {relationship} {resource_id} -> {status} {detail[:240]}")
    if status in (200, 201):
        return True
    text = detail.lower()
    return "already" in text and "another" not in text


def ensure_submission(product: dict) -> dict:
    rows = pages("reviewSubmissions", {"filter[app]": APP_ID, "limit": 10})
    draft = None
    for row in rows:
        attrs = row.get("attributes") or {}
        print(f"review submission {row['id']} state {attrs.get('state')} submitted {attrs.get('submittedDate')}")
        if attrs.get("state") == "READY_FOR_REVIEW" and not attrs.get("submittedDate") and draft is None:
            draft = row
    if draft is None:
        status, payload = call(
            "POST",
            "reviewSubmissions",
            body={
                "data": {
                    "type": "reviewSubmissions",
                    "attributes": {"platform": "IOS"},
                    "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
                }
            },
        )
        if status >= 400 or not (payload.get("data") or {}).get("id"):
            raise SystemExit("could not create a review submission")
        draft = payload["data"]
        print(f"created review submission {draft['id']}")
    else:
        drop_wrong_products(draft["id"])
    if not add_item(draft["id"], "appStoreVersion", "appStoreVersions", VERSION_ID):
        raise SystemExit("could not add version 1.2 to the review submission")
    added = False
    for version_id in product.get("versionIds") or []:
        if add_item(draft["id"], "inAppPurchaseVersion", "inAppPurchaseVersions", version_id):
            added = True
            break
    if not added and not add_item(draft["id"], "inAppPurchase", "inAppPurchases", product["id"]):
        raise SystemExit("could not add the 7-Day Pass to the review submission")
    return draft


def submit(submission_id: str) -> str:
    status, payload = call(
        "PATCH",
        f"reviewSubmissions/{submission_id}",
        body={
            "data": {
                "type": "reviewSubmissions",
                "id": submission_id,
                "attributes": {"submitted": True},
            }
        },
    )
    state = ((payload.get("data") or {}).get("attributes") or {}).get("state") or ""
    print(f"submit {submission_id} -> {status} {state or err_text(payload)[:400]}")
    if status >= 400:
        raise SystemExit("review submission was not accepted")
    last = state
    for attempt in range(1, 13):
        status, fresh = call("GET", f"reviewSubmissions/{submission_id}")
        version = version_row()
        last = ((fresh.get("data") or {}).get("attributes") or {}).get("state") or last
        version_state = (version.get("attributes") or {}).get("appStoreState") or ""
        print(f"poll {attempt} version {version_state} submission {last}")
        if last in DONE or version_state in DONE:
            return last
        time.sleep(10)
    return last


def listed_iaps() -> dict[str, str]:
    wanted = {
        PASS_ID,
        "com.wrap911.trainer.seat.12mo",
        "com.wrap911.trainer.pack.12mo",
    }
    found: dict[str, str] = {}
    for row in pages(f"apps/{APP_ID}/inAppPurchasesV2", {"limit": 50}):
        attrs = row.get("attributes") or {}
        product = str(attrs.get("productId") or "")
        if product not in wanted:
            continue
        found[product] = f"{row.get('id')} {attrs.get('state')}"
        print(f"iap-final {product} {found[product]}", flush=True)
    return found


def write_summary(text: str) -> None:
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as handle:
        handle.write("```\n" + text + "\n```\n")


def main() -> None:
    self_check()
    if "--self-check" in sys.argv:
        return
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    row = confirm_version()
    state = (row.get("attributes") or {}).get("appStoreState")
    if state not in EDITABLE:
        if state in DONE:
            print(f"version 1.2 is already {state}; it was not changed")
            print("Resolution Center was not contacted.")
            return
        raise SystemExit("version 1.2 is " + str(state) + "; it was not changed")
    screenshot_counts()
    build, product = wait_for_release_bits()
    assert product is not None
    set_whats_new()
    attach_build(build["id"])
    set_notes()
    submission = ensure_submission(product)
    submission_state = submit(submission["id"])
    status, fresh_build = call("GET", f"builds/{build['id']}")
    if status < 400 and fresh_build.get("data"):
        build = fresh_build["data"]
    final = version_row()
    final_state = (final.get("attributes") or {}).get("appStoreState")
    encryption = (build.get("attributes") or {}).get("usesNonExemptEncryption")
    processing = (build.get("attributes") or {}).get("processingState")
    iaps = listed_iaps()
    text = "\n".join([
        f"VERSION {TRAIN} {VERSION_ID} {final_state}",
        f"BUILD {BUILD_NUMBER} {build.get('id')} processing {processing} encryption {encryption}",
        f"IAP {PASS_ID} {iaps.get(PASS_ID, product.get('state'))}",
        f"IAP com.wrap911.trainer.seat.12mo {iaps.get('com.wrap911.trainer.seat.12mo', '')}",
        f"IAP com.wrap911.trainer.pack.12mo {iaps.get('com.wrap911.trainer.pack.12mo', '')}",
        f"SUBMISSION ID {submission.get('id')}",
        f"SUBMISSION STATE {submission_state}",
        "Resolution Center was not contacted.",
    ])
    print(text)
    write_summary(text)
    if submission_state not in DONE and final_state not in DONE:
        raise SystemExit("submission did not reach review")


if __name__ == "__main__":
    main()
