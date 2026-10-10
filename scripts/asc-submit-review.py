#!/usr/bin/env python3
"""Attach build 18 and submit App Store version 1.1 with both IAPs.

Replaces the attached build, puts the version and the two non-renewing
products on one review submission, and sets the App Review notes. Does not
change prices, IAP attributes, availability, or the worker. A Resolution
Center thread reply is not available on the public API, so the notes are
the reply.
"""
import base64
import json
import os
import re
import sys
import time

import jwt
import requests

APP_ID = "6816763473"
VERSION_ID = "ad69dc48-d34b-45e6-bd4a-41e4ec9f1ecd"
VERSION_NUMERIC = "892105462"
DRAFT_ID = "6e6b5317-ef80-4ed8-9d52-1f1a3ff79d41"
REJECTED_SUBMISSION = "7d4e92d4-43a5-499e-9594-421bc37178cb"
REJECTED_ITEM = "N2Q0ZTkyZDQtNDNhNS00OTllLTk1OTQtNDIxYmMzNzE3OGNifDZ8ODkyMTA1NDYy"
BUILD_NUMBER = "18"
TRAIN = "1.1"
PUBLIC_EMAIL = "info@wrap911.com"
PRODUCTS = {
    "com.wrap911.trainer.pack.12mo": "6820187730",
    "com.wrap911.trainer.seat.12mo": "6820187854",
}
NOTES = """Guideline 2.3.8: The placeholder app icon was replaced. This build uses the WRAP 911 wordmark.

Guideline 3.1.1: Shop Pack (com.wrap911.trainer.pack.12mo) and Seat (com.wrap911.trainer.seat.12mo) are 12-month non-renewing In-App Purchases on the Pricing screen. They do not auto-renew. A purchase unlocks the full trainer on this phone for 12 months from the purchase date. Restore Purchases is on the Pricing screen and restores the non-renewing purchase from StoreKit on this phone.

On the United States storefront only, a secondary Buy on wrap911.com link opens Safari. That external link is shown under the US anti-steering ruling and the current App Store Review Guideline. It is not shown on any other storefront. App availability is United States only.

Unlock code entry remains because the same Shop Pack and Seat are also offered as In-App Purchases (Guideline 3.1.3(b)). The app does not sell access only by a license key.

The AI Coach asks permission before sending a question to the server. Declining uses the offline answers.

Review contact: info@wrap911.com
"""
BAD_IAP_STATES = {
    "MISSING_METADATA",
    "REJECTED",
    "DEVELOPER_ACTION_NEEDED",
    "REMOVED_FROM_SALE",
    "DEVELOPER_REMOVED_FROM_SALE",
}
DONE_STATES = {"WAITING_FOR_REVIEW", "IN_REVIEW"}
UUID_RE = re.compile(r"^[0-9a-fA-F-]{36}$")
ID_RE = re.compile(r"^[0-9A-Za-z-]{8,80}$")

# Set only after the matching build 18 id is known. Submit stays disarmed
# until the preflight blockers are empty.
TARGET_BUILD_ID = None
TARGET_SUBMISSION_ID = None
SUBMIT_ARMED = False
DELETABLE_ITEMS = set()
LOOKUP_CACHE = {}


def pem():
    raw = os.environ["RAW"]
    body = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    lines = [body[i : i + 64] for i in range(0, len(body), 64)]
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(lines) + "\n-----END PRIVATE KEY-----\n"


def token():
    return jwt.encode(
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


def segments_of(path):
    pieces = [piece.split("?", 1)[0] for piece in path.split("/") if piece]
    if pieces[:1] == ["v2"]:
        pieces = pieces[1:]
    return pieces


def allowed(method, path, body):
    if method == "GET":
        return True
    if path.startswith("v2/"):
        return False
    segments = segments_of(path)
    data = (body or {}).get("data") or {}
    attrs = data.get("attributes") or {}
    if method == "PATCH" and segments == ["appStoreVersions", VERSION_ID]:
        if attrs or "versionString" in json.dumps(body):
            return False
        rel = data.get("relationships") or {}
        if set(rel) != {"build"}:
            return False
        build = ((rel.get("build") or {}).get("data") or {})
        return (
            build.get("type") == "builds"
            and build.get("id") == TARGET_BUILD_ID
            and bool(TARGET_BUILD_ID)
            and bool(UUID_RE.match(TARGET_BUILD_ID))
        )
    if method == "PATCH" and segments[:1] == ["appStoreReviewDetails"] and len(segments) == 2 and UUID_RE.match(segments[1]):
        if set(attrs) - {"notes", "contactEmail"}:
            return False
        if attrs.get("notes") != NOTES:
            return False
        if "contactEmail" in attrs and attrs.get("contactEmail") != PUBLIC_EMAIL:
            return False
        return "notes" in attrs
    if method == "PATCH" and segments[:1] == ["builds"] and len(segments) == 2 and UUID_RE.match(segments[1]):
        return set(attrs) == {"usesNonExemptEncryption"} and attrs.get("usesNonExemptEncryption") is False and segments[1] == TARGET_BUILD_ID
    if method == "POST" and segments == ["reviewSubmissions"]:
        app = (((data.get("relationships") or {}).get("app") or {}).get("data") or {})
        return set(attrs) == {"platform"} and attrs.get("platform") == "IOS" and app.get("type") == "apps" and app.get("id") == APP_ID
    if method == "POST" and segments == ["reviewSubmissionItems"]:
        rel = data.get("relationships") or {}
        keys = set(rel) - {"reviewSubmission"}
        if len(keys) != 1 or attrs:
            return False
        sub = ((rel.get("reviewSubmission") or {}).get("data") or {})
        if sub.get("type") != "reviewSubmissions" or not UUID_RE.match(sub.get("id") or ""):
            return False
        if sub.get("id") == REJECTED_SUBMISSION:
            return False
        key = next(iter(keys))
        target = ((rel.get(key) or {}).get("data") or {})
        expected = {
            "appStoreVersion": "appStoreVersions",
            "inAppPurchaseVersion": "inAppPurchaseVersions",
            "inAppPurchase": "inAppPurchases",
            "inAppPurchases": "inAppPurchases",
        }.get(key)
        return expected is not None and target.get("type") == expected and bool(ID_RE.match(str(target.get("id") or "")))
    if method == "DELETE" and segments[:1] == ["reviewSubmissionItems"] and len(segments) == 2:
        return segments[1] in DELETABLE_ITEMS
    if method == "PATCH" and segments == ["reviewSubmissionItems", REJECTED_ITEM]:
        return set(attrs) == {"removed"} and attrs.get("removed") is True
    if method == "PATCH" and segments[:1] == ["reviewSubmissions"] and len(segments) == 2:
        return (
            SUBMIT_ARMED
            and segments[1] == TARGET_SUBMISSION_ID
            and segments[1] != REJECTED_SUBMISSION
            and set(attrs) == {"submitted"}
            and attrs.get("submitted") is True
        )
    return False


def call(method, path, params=None, body=None, quiet=False):
    if not allowed(method, path, body):
        raise SystemExit("refusing " + method + " " + path)
    headers = {"Authorization": "Bearer " + token()}
    if body is not None:
        headers["Content-Type"] = "application/json"
    url = "https://api.appstoreconnect.apple.com/" + (path if path.startswith("v2/") else "v1/" + path.lstrip("/"))
    response = requests.request(method, url, headers=headers, params=params, json=body, timeout=60)
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:500]}
    if response.status_code >= 400 and not quiet:
        print(f"HTTP {response.status_code} {method} {path} {err_text(payload)[:500]}")
    return response.status_code, payload


def pages(path, params=None):
    items = []
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
            path = None
    return items


def err_text(payload):
    rows = (payload or {}).get("errors") or []
    if not rows:
        return str(payload)[:500]
    return " | ".join(
        " ".join(str(row.get(key) or "") for key in ("code", "title", "detail")).strip() for row in rows
    )


def decoded_item(item_id):
    padded = item_id + "=" * ((4 - len(item_id) % 4) % 4)
    try:
        text = base64.b64decode(padded).decode()
    except (ValueError, UnicodeDecodeError):
        return "", "", ""
    parts = text.split("|")
    if len(parts) < 3:
        return "", "", ""
    return parts[0], parts[1], parts[-1]


def shot_state(row):
    delivery = (row.get("attributes") or {}).get("assetDeliveryState")
    if isinstance(delivery, dict):
        return delivery.get("state") or ""
    return delivery or ""


def blank(value):
    return value is None or str(value).strip() == ""


def norm_text(value):
    return (value or "").replace("\r\n", "\n").strip()


def self_check():
    global TARGET_BUILD_ID, TARGET_SUBMISSION_ID, SUBMIT_ARMED
    saved = (TARGET_BUILD_ID, TARGET_SUBMISSION_ID, SUBMIT_ARMED, set(DELETABLE_ITEMS))
    build_id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    TARGET_BUILD_ID = build_id
    TARGET_SUBMISSION_ID = DRAFT_ID
    SUBMIT_ARMED = False
    DELETABLE_ITEMS.clear()
    assert "stripe" not in NOTES.lower()
    assert "$" not in NOTES
    assert "website prices" not in NOTES.lower()
    assert "2.3.8" in NOTES and "3.1.1" in NOTES and "3.1.3(b)" in NOTES
    assert PUBLIC_EMAIL in NOTES
    assert not allowed(
        "PATCH",
        f"appStoreVersions/{VERSION_ID}",
        {"data": {"type": "appStoreVersions", "id": VERSION_ID, "attributes": {"versionString": "9.9"}}},
    )
    assert allowed(
        "PATCH",
        f"appStoreVersions/{VERSION_ID}",
        {
            "data": {
                "type": "appStoreVersions",
                "id": VERSION_ID,
                "relationships": {"build": {"data": {"type": "builds", "id": build_id}}},
            }
        },
    )
    assert not allowed("POST", "inAppPurchasePriceSchedules", {"data": {}})
    assert not allowed("PATCH", "v2/inAppPurchases/6820187730", {"data": {"attributes": {"name": "x"}}})
    assert not allowed(
        "PATCH",
        f"reviewSubmissions/{DRAFT_ID}",
        {"data": {"type": "reviewSubmissions", "id": DRAFT_ID, "attributes": {"canceled": True}}},
    )
    assert not allowed(
        "PATCH",
        f"reviewSubmissions/{DRAFT_ID}",
        {"data": {"type": "reviewSubmissions", "id": DRAFT_ID, "attributes": {"submitted": True}}},
    )
    SUBMIT_ARMED = True
    assert allowed(
        "PATCH",
        f"reviewSubmissions/{DRAFT_ID}",
        {"data": {"type": "reviewSubmissions", "id": DRAFT_ID, "attributes": {"submitted": True}}},
    )
    assert not allowed(
        "PATCH",
        f"reviewSubmissions/{REJECTED_SUBMISSION}",
        {"data": {"type": "reviewSubmissions", "id": REJECTED_SUBMISSION, "attributes": {"submitted": True}}},
    )
    assert not allowed("DELETE", "reviewSubmissionItems/not-listed", None)
    DELETABLE_ITEMS.add("draft-item")
    assert allowed("DELETE", "reviewSubmissionItems/draft-item", None)
    TARGET_BUILD_ID, TARGET_SUBMISSION_ID, SUBMIT_ARMED = saved[0], saved[1], saved[2]
    DELETABLE_ITEMS.clear()
    DELETABLE_ITEMS.update(saved[3])
    print("self-check ok")


def version_row():
    status, payload = call("GET", f"appStoreVersions/{VERSION_ID}")
    if status >= 400 or not payload.get("data"):
        raise SystemExit("could not read App Store version 1.1")
    return payload["data"]


def attached_build():
    status, payload = call("GET", f"appStoreVersions/{VERSION_ID}/build")
    if status >= 400:
        return {}
    return payload.get("data") or {}


def find_build_18():
    rows = pages(
        "builds",
        {
            "filter[app]": APP_ID,
            "filter[version]": BUILD_NUMBER,
            "sort": "-uploadedDate",
            "limit": 10,
        },
    )
    chosen = None
    for row in rows:
        attrs = row.get("attributes") or {}
        status, train = call("GET", f"builds/{row['id']}/preReleaseVersion")
        train_name = ((train.get("data") or {}).get("attributes") or {}).get("version") if status < 400 else ""
        print(
            f"build candidate {row['id']} version {attrs.get('version')} train {train_name} "
            f"processing {attrs.get('processingState')} expired {attrs.get('expired')} "
            f"encryption {attrs.get('usesNonExemptEncryption')}"
        )
        if str(attrs.get("version")) == BUILD_NUMBER and str(train_name) == TRAIN and not attrs.get("expired"):
            chosen = row
            break
    if not chosen:
        raise SystemExit("build 18 on train 1.1 was not found")
    return chosen


def patch_attached_build(build_id):
    return call(
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


def release_locked_version():
    """Take the version off an unsubmitted draft so its build can change."""
    released = False
    for submission in list_submissions():
        if not unsubmitted(submission):
            continue
        for item in list_items(submission["id"]):
            _sub, type_code, entity = decoded_item(item.get("id") or "")
            linked = (((item.get("relationships") or {}).get("appStoreVersion") or {}).get("data") or {}).get("id")
            if entity not in (VERSION_ID, VERSION_NUMERIC) and linked != VERSION_ID and type_code != "6":
                continue
            if not mark_deletable(item, submission):
                continue
            status, _payload = call("DELETE", f"reviewSubmissionItems/{item['id']}")
            print(f"removed version item {item['id']} so the build can change -> {status}")
            DELETABLE_ITEMS.discard(item["id"])
            released = status in (200, 202, 204) or released
    return released


def attach_build(build_id):
    global TARGET_BUILD_ID
    current = attached_build()
    current_version = (current.get("attributes") or {}).get("version")
    if current.get("id") == build_id and str(current_version) == BUILD_NUMBER:
        print(f"build {BUILD_NUMBER} already attached {build_id}")
        return
    TARGET_BUILD_ID = build_id
    status, _payload = patch_attached_build(build_id)
    if status == 409 and release_locked_version():
        status, _payload = patch_attached_build(build_id)
    if status >= 400:
        raise SystemExit("could not attach build 18")
    confirmed = attached_build()
    if confirmed.get("id") != build_id:
        raise SystemExit("build 18 did not stay attached")
    print(f"attached build {BUILD_NUMBER} {build_id}")


def ensure_encryption(build):
    flag = (build.get("attributes") or {}).get("usesNonExemptEncryption")
    if flag is False:
        print("usesNonExemptEncryption false")
        return False
    if flag is True:
        raise SystemExit("build 18 declares non-exempt encryption; left unchanged")
    status, _payload = call(
        "PATCH",
        f"builds/{build['id']}",
        body={"data": {"type": "builds", "id": build["id"], "attributes": {"usesNonExemptEncryption": False}}},
    )
    if status >= 400:
        raise SystemExit("could not set export compliance")
    print("set usesNonExemptEncryption false")
    return False


def update_notes():
    status, detail = call("GET", f"appStoreVersions/{VERSION_ID}/appStoreReviewDetail")
    row = detail.get("data") or {}
    if status >= 400 or not row.get("id"):
        raise SystemExit("could not read the App Review contact")
    attrs = row.get("attributes") or {}
    email = (attrs.get("contactEmail") or "").strip()
    print(f"review contact {email or '(empty)'} detail {row['id']}")
    for field in ("contactFirstName", "contactLastName", "contactPhone"):
        print(f"review {field} {'set' if not blank(attrs.get(field)) else 'empty'}")
    body_attrs = {"notes": NOTES}
    if email.lower() != PUBLIC_EMAIL:
        body_attrs["contactEmail"] = PUBLIC_EMAIL
    status, patched = call(
        "PATCH",
        f"appStoreReviewDetails/{row['id']}",
        body={"data": {"type": "appStoreReviewDetails", "id": row["id"], "attributes": body_attrs}},
    )
    if status >= 400:
        raise SystemExit("could not update the App Review notes")
    saved = ((patched.get("data") or {}).get("attributes") or {}).get("notes") or ""
    if norm_text(saved) != norm_text(NOTES):
        raise SystemExit("App Review notes did not save")
    email_after = ((patched.get("data") or {}).get("attributes") or {}).get("contactEmail") or email
    if email_after.lower() != PUBLIC_EMAIL:
        raise SystemExit("review contact is not info@wrap911.com")
    print("review notes saved")
    return patched.get("data") or row


def list_submissions():
    rows = pages("reviewSubmissions", {"filter[app]": APP_ID, "limit": 20})
    for row in rows:
        attrs = row.get("attributes") or {}
        print(
            f"submission {row['id']} state {attrs.get('state')} submitted {attrs.get('submittedDate')} "
            f"platform {attrs.get('platform')}"
        )
    return rows


def list_items(submission_id):
    status, payload = call("GET", f"reviewSubmissions/{submission_id}/items", {"limit": 50})
    if status >= 400:
        raise SystemExit("could not list review submission items for " + submission_id)
    return payload.get("data") or []


def unsubmitted(row):
    attrs = row.get("attributes") or {}
    return not attrs.get("submittedDate") and attrs.get("state") in (None, "READY_FOR_REVIEW", "UNRESOLVED_ISSUES")


def mark_deletable(item, submission):
    if not unsubmitted(submission):
        return False
    if submission.get("id") == REJECTED_SUBMISSION:
        return False
    sub_id, _type_code, _entity = decoded_item(item.get("id") or "")
    if sub_id and sub_id != submission.get("id"):
        return False
    if sub_id == REJECTED_SUBMISSION:
        return False
    DELETABLE_ITEMS.add(item["id"])
    return True


def resource_attrs(kind, resource_id):
    status, payload = call("GET", f"{kind}/{resource_id}", quiet=True)
    if status >= 400 or not payload.get("data"):
        return None
    return payload["data"]


def product_of_entity(entity):
    """Return a productId if this review item entity is one of our IAPs."""
    if entity in LOOKUP_CACHE:
        return LOOKUP_CACHE[entity]
    apple = {apple_id: product for product, apple_id in PRODUCTS.items()}
    if not entity or entity in (VERSION_ID, VERSION_NUMERIC):
        LOOKUP_CACHE[entity] = ""
        return ""
    if entity in apple:
        LOOKUP_CACHE[entity] = apple[entity]
        print(f"entity {entity} is apple id for {apple[entity]}")
        return apple[entity]
    product = ""
    probes = (
        ("v2/inAppPurchases", ""),
        ("inAppPurchases", ""),
        ("inAppPurchaseVersions", "inAppPurchase"),
        ("subscriptionVersions", "subscription"),
        ("subscriptions", ""),
    )
    for kind, parent_rel in probes:
        row = resource_attrs(kind, entity)
        if not row:
            continue
        attrs = row.get("attributes") or {}
        product = attrs.get("productId") or ""
        parent_id = ""
        if not product and parent_rel:
            parent_id = (((row.get("relationships") or {}).get(parent_rel) or {}).get("data") or {}).get("id") or ""
            if not parent_id:
                status, parent_payload = call("GET", f"{kind}/{entity}/{parent_rel}", quiet=True)
                if status < 400:
                    parent_id = (parent_payload.get("data") or {}).get("id") or ""
        if product:
            print(f"entity {entity} is {kind} {product} state {attrs.get('state')}")
            break
        for parent_kind in ("v2/inAppPurchases", "inAppPurchases", "subscriptions"):
            if not parent_id:
                break
            parent = resource_attrs(parent_kind, parent_id)
            if not parent:
                continue
            product = (parent.get("attributes") or {}).get("productId") or ""
            print(f"entity {entity} parent {parent_kind} {parent_id} product {product or '(none)'} state {attrs.get('state')}")
            if product:
                break
        if product:
            break
        print(f"entity {entity} is {kind} state {attrs.get('state')} without a product id")
    LOOKUP_CACHE[entity] = product
    return product


def item_products(items):
    found = {}
    version_present = False
    unknown = []
    for item in items:
        sub_id, type_code, entity = decoded_item(item.get("id") or "")
        rels = item.get("relationships") or {}
        for _key, value in rels.items():
            data = (value or {}).get("data") or {}
            if isinstance(data, dict) and data.get("id"):
                entity = entity or data["id"]
                if data["id"] == VERSION_ID:
                    entity = VERSION_ID
                break
        is_version = entity in (VERSION_ID, VERSION_NUMERIC) or type_code == "6"
        product = "" if is_version else product_of_entity(entity)
        if is_version:
            version_present = True
        elif product in PRODUCTS:
            found[product] = item.get("id")
        else:
            unknown.append(f"{item.get('id')} type {type_code or '?'} entity {entity or '?'}")
        print(
            f"item {item.get('id')} type {type_code or '?'} entity {entity or '?'} "
            f"product {product or ('version' if is_version else '?')} submission {sub_id or '?'}"
        )
    return found, version_present, unknown


def post_item(submission_id, relationship, resource_type, resource_id):
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
    item_id = (payload.get("data") or {}).get("id") or ""
    detail = err_text(payload) if status >= 400 else ""
    print(f"add {relationship} {resource_id} -> {status} {item_id or detail[:240]}")
    return status, item_id, detail


def already_here(detail):
    text = detail.lower()
    return "already" in text and "another" not in text


def other_submission(detail):
    text = detail.lower()
    return "another submission" in text or "item_part_of_another" in text or "892105462" in text


def bad_relationship(detail):
    text = detail.lower()
    return any(word in text for word in ("relationship", "not a valid", "unknown", "does not exist", "cannot be included"))


def load_iaps():
    rows = pages(f"apps/{APP_ID}/inAppPurchasesV2", {"limit": 50})
    by_product = {}
    for row in rows:
        attrs = row.get("attributes") or {}
        product = attrs.get("productId") or ""
        print(
            f"iap {product} id {row.get('id')} apple {PRODUCTS.get(product, '')} "
            f"type {attrs.get('inAppPurchaseType')} state {attrs.get('state')}"
        )
        if product not in PRODUCTS:
            continue
        versions = pages(f"v2/inAppPurchases/{row['id']}/versions", {"limit": 20})
        version_ids = []
        for version in versions:
            version_ids.append(version.get("id"))
            print(f"iap version {product} {version.get('id')} state {(version.get('attributes') or {}).get('state')}")
        by_product[product] = {
            "id": row["id"],
            "appleId": PRODUCTS[product],
            "state": attrs.get("state"),
            "type": attrs.get("inAppPurchaseType"),
            "versionIds": [item for item in version_ids if item],
            "row": row,
        }
    missing = [product for product in PRODUCTS if product not in by_product]
    if missing:
        raise SystemExit("missing in-app purchases: " + ", ".join(missing))
    return by_product


def choose_submission(submissions):
    global TARGET_SUBMISSION_ID
    by_id = {row["id"]: row for row in submissions}
    draft = by_id.get(DRAFT_ID)
    if draft and unsubmitted(draft):
        TARGET_SUBMISSION_ID = draft["id"]
        print(f"using unsubmitted draft {draft['id']}")
        return draft
    for row in submissions:
        if unsubmitted(row) and row["id"] != REJECTED_SUBMISSION:
            TARGET_SUBMISSION_ID = row["id"]
            print(f"preferred draft was not unsubmitted; using {row['id']}")
            return row
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
    created = payload.get("data") or {}
    if status >= 400 or not created.get("id"):
        raise SystemExit("could not create a review submission")
    TARGET_SUBMISSION_ID = created["id"]
    print(f"created review submission {created['id']}")
    return created


def remove_rejected_version_lock(detail):
    if "892105462" not in detail and REJECTED_SUBMISSION not in detail:
        return False
    print("version is still the removed item on the rejected submission; marking that item removed")
    status, _payload = call(
        "PATCH",
        f"reviewSubmissionItems/{REJECTED_ITEM}",
        body={
            "data": {
                "type": "reviewSubmissionItems",
                "id": REJECTED_ITEM,
                "attributes": {"removed": True},
            }
        },
    )
    print(f"rejected version item removed -> {status}")
    return status in (200, 202, 204)


def move_item_onto(submission, resource_label, entity):
    """Delete an unsubmitted copy of this entity so it can be added to submission."""
    for other in list_submissions():
        if other["id"] == submission["id"] or not unsubmitted(other):
            continue
        for item in list_items(other["id"]):
            _sub, _code, item_entity = decoded_item(item.get("id") or "")
            if item_entity != str(entity):
                continue
            if not mark_deletable(item, other):
                print(f"could not move {resource_label} {entity}; it is not on an unsubmitted draft")
                return False
            status, _payload = call("DELETE", f"reviewSubmissionItems/{item['id']}")
            print(f"moved {resource_label} {entity} off {other['id']} -> {status}")
            DELETABLE_ITEMS.discard(item["id"])
            return status in (200, 202, 204)
    return False


def ensure_version_item(submission):
    items = list_items(submission["id"])
    _found, present, _described = item_products(items)
    if present:
        print("app version is already on the submission")
        return True
    for relationship, resource_type, resource_id in (("appStoreVersion", "appStoreVersions", VERSION_ID),):
        status, _item_id, detail = post_item(submission["id"], relationship, resource_type, resource_id)
        if status in (200, 201) or already_here(detail):
            return True
        if other_submission(detail):
            if remove_rejected_version_lock(detail) or move_item_onto(submission, "appStoreVersion", VERSION_ID):
                status, _item_id, detail = post_item(submission["id"], relationship, resource_type, resource_id)
                if status in (200, 201) or already_here(detail):
                    return True
            print("app version is locked on another submission: " + detail[:300])
            return False
    return False


def ensure_iap_item(submission, product, iap):
    items = list_items(submission["id"])
    found, _present, _described = item_products(items)
    if product in found:
        print(f"{product} is already on the submission")
        return True
    attempts = [("inAppPurchaseVersion", "inAppPurchaseVersions", version_id) for version_id in iap["versionIds"]]
    attempts.append(("inAppPurchase", "inAppPurchases", iap["id"]))
    attempts.append(("inAppPurchases", "inAppPurchases", iap["id"]))
    last = ""
    for relationship, resource_type, resource_id in attempts:
        status, _item_id, detail = post_item(submission["id"], relationship, resource_type, resource_id)
        if status in (200, 201) or already_here(detail):
            return True
        if other_submission(detail):
            if move_item_onto(submission, relationship, resource_id):
                status, _item_id, detail = post_item(submission["id"], relationship, resource_type, resource_id)
                if status in (200, 201) or already_here(detail):
                    return True
            last = detail
            break
        last = detail
        if not bad_relationship(detail) and status not in (400, 404, 409, 422):
            break
    print(f"could not add {product}: {last[:400]}")
    return False


def screenshot_report():
    counts = {}
    locs = pages(f"appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations", {"limit": 10})
    for loc in locs:
        locale = (loc.get("attributes") or {}).get("locale")
        sets = pages(f"appStoreVersionLocalizations/{loc['id']}/appScreenshotSets", {"limit": 20})
        for shot_set in sets:
            display = (shot_set.get("attributes") or {}).get("screenshotDisplayType") or ""
            shots = pages(f"appScreenshotSets/{shot_set['id']}/appScreenshots", {"limit": 20})
            states = [shot_state(row) for row in shots]
            counts.setdefault(display, {"count": 0, "complete": 0, "locale": locale})
            counts[display]["count"] += len(shots)
            counts[display]["complete"] += sum(1 for state in states if state == "COMPLETE")
            print(f"screenshots {locale} {display} count {len(shots)} states {states}")
    return counts


def age_and_privacy():
    gaps = []
    infos = pages(f"apps/{APP_ID}/appInfos", {"limit": 5})
    if not infos:
        gaps.append("app info could not be read")
        return gaps
    for info in infos:
        attrs = info.get("attributes") or {}
        rating = attrs.get("appStoreAgeRating")
        rights = attrs.get("contentRightsDeclaration")
        print(f"appInfo {info['id']} age {rating or '(empty)'} contentRights {rights or '(empty)'}")
        status, declaration = call("GET", f"appInfos/{info['id']}/ageRatingDeclaration")
        if status >= 400 or not declaration.get("data"):
            gaps.append("age rating declaration is missing")
        elif blank(rating):
            print("age rating declaration exists; App Store age rating value was empty on the app info")
        if blank(rights):
            gaps.append("content rights declaration is empty")
        locs = pages(f"appInfos/{info['id']}/appInfoLocalizations", {"limit": 10})
        for loc in locs:
            loc_attrs = loc.get("attributes") or {}
            url = loc_attrs.get("privacyPolicyUrl") or ""
            print(f"privacy policy {loc_attrs.get('locale')} {url or '(empty)'}")
            if blank(url):
                gaps.append(f"privacy policy URL empty ({loc_attrs.get('locale')})")
    status, usages = call("GET", f"apps/{APP_ID}/appDataUsages", {"limit": 50})
    usage_count = len((usages.get("data") or [])) if status < 400 else -1
    print(f"app data usages {status} count {usage_count}")
    if status >= 400:
        gaps.append("privacy nutrition labels could not be read")
    elif usage_count == 0:
        gaps.append("privacy nutrition labels are empty")
    return gaps


def availability_ids(path, params):
    available = []
    new_flag = None
    query = dict(params or {})
    guard = 0
    while path and guard < 8:
        guard += 1
        status, payload = call("GET", path, params=query)
        if status >= 400:
            return None, None
        attrs = (payload.get("data") or {}).get("attributes") or {}
        if "availableInNewTerritories" in attrs:
            new_flag = attrs.get("availableInNewTerritories")
        for row in payload.get("included") or []:
            row_type = row.get("type")
            row_attrs = row.get("attributes") or {}
            if row_type == "territories":
                available.append(row.get("id"))
            elif row_type == "territoryAvailabilities" and row_attrs.get("available") is True:
                territory = ((row.get("relationships") or {}).get("territory") or {}).get("data") or {}
                available.append(territory.get("id") or row.get("id"))
        related = ((payload.get("data") or {}).get("relationships") or {}).get("availableTerritories") or {}
        for row in related.get("data") or []:
            if isinstance(row, dict) and row.get("id"):
                available.append(row["id"])
        next_url = ((payload.get("links") or {}).get("next")) or ""
        if "/v2/" in next_url:
            path = "v2/" + next_url.split("/v2/", 1)[1]
            query = None
        elif "/v1/" in next_url:
            path = next_url.split("/v1/", 1)[1]
            query = None
        else:
            path = None
    return sorted({item for item in available if item}), new_flag


def usa_only_report(iaps):
    gaps = []
    territories, new_flag = availability_ids(
        f"v2/appAvailabilities/{APP_ID}",
        {"include": "territoryAvailabilities", "limit[territoryAvailabilities]": 200},
    )
    print(f"app availability territories {territories} newTerritories {new_flag}")
    if territories != ["USA"] or new_flag is not False:
        gaps.append(f"app availability is not United States only ({territories}, newTerritories={new_flag})")
    for product, iap in iaps.items():
        territories, new_flag = availability_ids(
            f"v2/inAppPurchases/{iap['id']}/inAppPurchaseAvailability",
            {"include": "availableTerritories", "limit[availableTerritories]": 200},
        )
        print(f"iap availability {product} territories {territories} newTerritories {new_flag}")
        if territories != ["USA"] or new_flag is not False:
            gaps.append(f"{product} availability is not United States only ({territories}, newTerritories={new_flag})")
    return gaps


def iap_metadata_gaps(iaps):
    gaps = []
    for product, iap in iaps.items():
        if iap.get("type") != "NON_RENEWING_SUBSCRIPTION":
            gaps.append(f"{product} type is {iap.get('type')}")
        if iap.get("state") in BAD_IAP_STATES:
            gaps.append(f"{product} state is {iap.get('state')}")
        status, shot = call("GET", f"v2/inAppPurchases/{iap['id']}/appStoreReviewScreenshot")
        state = shot_state(shot.get("data") or {}) if status < 400 else ""
        print(f"iap review screenshot {product} {status} {state or '(none)'}")
        if status >= 400 or not (shot.get("data") or {}).get("id"):
            gaps.append(f"{product} is missing its review screenshot")
        elif state not in ("COMPLETE", "UPLOAD_COMPLETE", ""):
            gaps.append(f"{product} review screenshot is {state}")
    return gaps


def screenshot_gaps(counts):
    gaps = []
    for display in ("APP_IPHONE_67", "APP_IPAD_PRO_3GEN_129"):
        row = counts.get(display) or {}
        if row.get("complete", 0) < 1:
            gaps.append(f"{display} is not complete")
    iphone65 = counts.get("APP_IPHONE_65") or {"count": 0}
    if iphone65.get("count", 0) != 0:
        gaps.append(f"iPhone 6.5 inch set has {iphone65.get('count')} screenshots")
    return gaps


def review_contact_gaps(detail):
    gaps = []
    attrs = (detail or {}).get("attributes") or {}
    if (attrs.get("contactEmail") or "").lower() != PUBLIC_EMAIL:
        gaps.append("review contact email is not info@wrap911.com")
    if norm_text(attrs.get("notes")) != norm_text(NOTES):
        gaps.append("review notes do not match the drafted reply")
    for field in ("contactFirstName", "contactLastName", "contactPhone"):
        if blank(attrs.get(field)):
            gaps.append("review contact missing " + field)
    if attrs.get("demoAccountRequired") and blank(attrs.get("demoAccountName")):
        gaps.append("a demo account is required but empty")
    return gaps


def preflight(version, build, counts, detail, iaps, submission):
    gaps = []
    attrs = version.get("attributes") or {}
    if str(attrs.get("versionString")) != TRAIN:
        gaps.append("version string is " + str(attrs.get("versionString")))
    if blank(attrs.get("copyright")):
        gaps.append("copyright is empty")
    build_attrs = build.get("attributes") or {}
    if str(build_attrs.get("version")) != BUILD_NUMBER or build.get("id") != TARGET_BUILD_ID:
        gaps.append("attached build is not build 18")
    if build_attrs.get("processingState") != "VALID":
        gaps.append("build 18 processing state is " + str(build_attrs.get("processingState")))
    if build_attrs.get("expired"):
        gaps.append("build 18 is expired")
    if build_attrs.get("usesNonExemptEncryption") is not False:
        gaps.append("export compliance is not set to exempt")
    gaps.extend(screenshot_gaps(counts))
    gaps.extend(age_and_privacy())
    gaps.extend(usa_only_report(iaps))
    gaps.extend(iap_metadata_gaps(iaps))
    status, fresh_detail = call("GET", f"appStoreVersions/{VERSION_ID}/appStoreReviewDetail")
    if status < 400 and (fresh_detail.get("data") or {}).get("id"):
        detail = fresh_detail["data"]
    gaps.extend(review_contact_gaps(detail))
    items = list_items(submission["id"])
    found, present, unknown = item_products(items)
    if not present:
        gaps.append("the app version is not on the review submission")
    for product in PRODUCTS:
        if product not in found:
            gaps.append(product + " is not on the review submission")
    if unknown:
        gaps.append("submission contains unexpected items: " + "; ".join(unknown))
    return gaps


def submit(submission):
    global SUBMIT_ARMED
    SUBMIT_ARMED = True
    status, payload = call(
        "PATCH",
        f"reviewSubmissions/{submission['id']}",
        body={
            "data": {
                "type": "reviewSubmissions",
                "id": submission["id"],
                "attributes": {"submitted": True},
            }
        },
    )
    SUBMIT_ARMED = False
    state = ((payload.get("data") or {}).get("attributes") or {}).get("state")
    print(f"submit {submission['id']} -> {status} {state or err_text(payload)[:400]}")
    return status, payload


def poll(submission_id):
    last_version = ""
    last_submission = ""
    for attempt in range(1, 13):
        version = version_row()
        status, payload = call("GET", f"reviewSubmissions/{submission_id}")
        last_version = (version.get("attributes") or {}).get("appStoreState") or ""
        last_submission = ((payload.get("data") or {}).get("attributes") or {}).get("state") or ""
        print(f"poll {attempt} version {last_version} submission {last_submission}")
        if last_version in DONE_STATES or last_submission in DONE_STATES:
            return last_version, last_submission
        time.sleep(10)
    return last_version, last_submission


def write_summary(lines):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")


def report(state, submission_state, submission_id, build, iaps, notes):
    lines = [
        f"FINAL STATE {state}",
        f"SUBMISSION STATE {submission_state}",
        f"SUBMISSION ID {submission_id}",
        f"ATTACHED BUILD {BUILD_NUMBER} {build.get('id')} processing {(build.get('attributes') or {}).get('processingState')} encryption {(build.get('attributes') or {}).get('usesNonExemptEncryption')}",
        "INCLUDED IAPS",
    ]
    for product, iap in iaps.items():
        lines.append(f"{product} apple {iap['appleId']} api {iap['id']} state {iap['state']}")
    lines.append("REVIEW NOTES BEGIN")
    lines.append(notes.strip())
    lines.append("REVIEW NOTES END")
    lines.append("RESOLUTION CENTER reply was not sent. The public App Store Connect API has no reply endpoint. The notes above are the reply.")
    text = "\n".join(lines)
    print(text)
    write_summary(["```", text, "```"])


def main():
    self_check()
    if "--self-check" in sys.argv:
        return
    global TARGET_BUILD_ID
    version = version_row()
    attrs = version.get("attributes") or {}
    print(f"version {attrs.get('versionString')} {version['id']} state {attrs.get('appStoreState')} release {attrs.get('releaseType')}")
    if str(attrs.get("versionString")) != TRAIN:
        raise SystemExit("refusing to submit a version that is not 1.1")
    build = find_build_18()
    TARGET_BUILD_ID = build["id"]
    ensure_encryption(build)
    current = attached_build()
    state = attrs.get("appStoreState")
    if state in DONE_STATES and current.get("id") == build["id"]:
        print("version is already submitted with build 18")
        iaps = load_iaps()
        status, detail = call("GET", f"appStoreVersions/{VERSION_ID}/appStoreReviewDetail")
        notes = ((detail.get("data") or {}).get("attributes") or {}).get("notes") or ""
        submissions = list_submissions()
        active = next((row for row in submissions if (row.get("attributes") or {}).get("state") in DONE_STATES), None)
        found, present, _unknown = item_products(list_items(active["id"])) if active else ({}, False, [])
        report(state, (active or {}).get("attributes", {}).get("state") if active else "", (active or {}).get("id") or "", attached_build(), iaps, notes)
        if not active or not present or any(product not in found for product in PRODUCTS):
            raise SystemExit("already submitted, but the active submission does not include the version and both IAPs")
        if norm_text(notes) != norm_text(NOTES):
            raise SystemExit("already submitted, and the saved notes differ")
        return
    attach_build(build["id"])
    detail = update_notes()
    print("Resolution Center reply is not available with the API key. The App Review notes carry the reply.")
    iaps = load_iaps()
    submissions = list_submissions()
    submission = choose_submission(submissions)
    if not ensure_version_item(submission):
        raise SystemExit("the app version was not added to the review submission")
    for product, iap in iaps.items():
        if not ensure_iap_item(submission, product, iap):
            raise SystemExit(product + " was not added to the review submission")
    fresh_version = version_row()
    fresh_build = attached_build()
    counts = screenshot_report()
    gaps = preflight(fresh_version, fresh_build, counts, detail, iaps, submission)
    if gaps:
        print("BLOCKERS")
        for gap in gaps:
            print("- " + gap)
        report(
            (fresh_version.get("attributes") or {}).get("appStoreState"),
            (submission.get("attributes") or {}).get("state"),
            submission["id"],
            fresh_build,
            iaps,
            NOTES,
        )
        raise SystemExit("not submitted; blockers remain")
    status, payload = submit(submission)
    if status >= 400:
        print(err_text(payload)[:800])
        raise SystemExit("Apple did not accept the submission")
    version_state, submission_state = poll(submission["id"])
    final_build = attached_build()
    status, saved = call("GET", f"appStoreVersions/{VERSION_ID}/appStoreReviewDetail")
    notes = ((saved.get("data") or {}).get("attributes") or {}).get("notes") or NOTES
    report(version_state, submission_state, submission["id"], final_build, iaps, notes)
    if version_state not in DONE_STATES and submission_state not in DONE_STATES:
        raise SystemExit("submission did not reach WAITING_FOR_REVIEW")


if __name__ == "__main__":
    main()
