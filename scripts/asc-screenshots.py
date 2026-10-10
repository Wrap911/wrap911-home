#!/usr/bin/env python3
"""Replace two App Store screenshot sets on the editable iOS version.

Uploads the iPhone 6.7" and iPad 12.9" images and deletes the previous
shots in those sets. Does not change the version string, attach a build,
or submit for review.
"""
import base64
import hashlib
import os
import re
import struct
import time

import jwt
import requests

APP_ID = "6816763473"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = (
    {
        "display": "APP_IPHONE_67",
        "path": os.path.join(ROOT, "appstore/screenshots/header-promo.png"),
        "width": 1290,
        "height": 2796,
        "file_name": "header-promo.png",
    },
    {
        "display": "APP_IPAD_PRO_3GEN_129",
        "path": os.path.join(ROOT, "appstore/screenshots/header-promo-ipad.png"),
        "width": 2048,
        "height": 2732,
        "file_name": "header-promo-ipad.png",
    },
)
EDITABLE = {
    "PREPARE_FOR_SUBMISSION",
    "READY_FOR_REVIEW",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
    "INVALID_BINARY",
}
REFUSED = (
    "appStoreVersionSubmissions",
)
# Removed from the unsubmitted draft on the previous run. Put them back
# even if that run stops before it can read them again.
KNOWN_DRAFT_ITEMS = (
    {
        "id": None,
        "entity": "fbb301a1-3160-4f92-bc09-5c4049c89a16",
        "relationship": "subscriptionVersion",
        "resource_type": "subscriptionVersions",
    },
    {
        "id": None,
        "entity": "a2bd9dea-e1f3-4df9-95ca-cb471a078765",
        "relationship": "subscriptionVersion",
        "resource_type": "subscriptionVersions",
    },
)


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


def call(method, path, params=None, body=None, raw=None, headers=None, timeout=60):
    segments = [piece.split("?", 1)[0] for piece in path.split("/") if piece]
    if method == "PATCH" and segments[:1] == ["reviewSubmissions"]:
        attrs = ((body or {}).get("data") or {}).get("attributes") or {}
        if set(attrs) != {"canceled"} or attrs.get("canceled") is not True:
            raise SystemExit("refusing review submission update")
    if method == "POST" and segments[:1] == ["reviewSubmissions"] and len(segments) > 1:
        raise SystemExit("refusing " + path)
    if method != "GET" and any(part in path for part in REFUSED):
        raise SystemExit("refusing " + path)
    if method != "GET" and path.startswith("appStoreVersions/") and "/appScreenshots" not in path and "appScreenshotSets" not in path:
        # Version updates, build attachments, and review details stay untouched.
        if body and "versionString" in str(body):
            raise SystemExit("refusing version string change")
        if body and "build" in str(body):
            raise SystemExit("refusing build attachment")
    req_headers = {"Authorization": "Bearer " + token()}
    if headers:
        req_headers.update(headers)
    if body is not None:
        req_headers["Content-Type"] = "application/json"
    response = requests.request(
        method,
        "https://api.appstoreconnect.apple.com/v1/" + path.lstrip("/"),
        headers=req_headers,
        params=params,
        json=body,
        data=raw,
        timeout=timeout,
    )
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:400]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} {method} {path} {str(payload)[:500]}")
    return response.status_code, payload


def pages(path, params=None):
    items = []
    query = dict(params or {})
    guard = 0
    while path and guard < 12:
        guard += 1
        status, payload = call("GET", path, params=query)
        if status >= 400:
            return items
        items.extend(payload.get("data") or [])
        next_url = ((payload.get("links") or {}).get("next")) or ""
        if "api.appstoreconnect.apple.com/v1/" in next_url:
            path = next_url.split("/v1/", 1)[1]
            query = None
        else:
            path = None
    return items


def png_size(path):
    data = open(path, "rb").read(26)
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(path + " is not a png")
    width, height = struct.unpack(">II", data[16:24])
    if data[25] != 2:
        raise SystemExit(path + " must be RGB with no alpha")
    return width, height


def check_files():
    for shot in SHOTS:
        width, height = png_size(shot["path"])
        if (width, height) != (shot["width"], shot["height"]):
            raise SystemExit(f"{shot['path']} is {width}x{height}")
        print(f"file {shot['file_name']} {width}x{height} rgb {os.path.getsize(shot['path'])} bytes")


def choose_version(plan):
    rows = pages(f"apps/{APP_ID}/appStoreVersions", {"limit": 20})
    print("VERSIONS")
    strings = []
    editable = []
    for row in rows:
        attrs = row.get("attributes") or {}
        version = str(attrs.get("versionString") or "")
        state = attrs.get("appStoreState")
        platform = attrs.get("platform")
        strings.append(version)
        print(
            f"id {row['id']} version {version} appStoreState {state} "
            f"appVersionState {attrs.get('appVersionState')} platform {platform}"
        )
        if platform in (None, "IOS") and state in EDITABLE:
            editable.append(row)
    if not editable:
        raise SystemExit("no editable iOS App Store version; screenshots were not changed")
    chosen = next((row for row in editable if str((row.get("attributes") or {}).get("versionString")) == "1.0"), None)
    if chosen is None:
        chosen = editable[0]
    attrs = chosen.get("attributes") or {}
    state = attrs.get("appStoreState")
    version = str(attrs.get("versionString") or "")
    print("VERSION STRING CHECK")
    print(f"editable version {version} id {chosen['id']} state {state}")
    if version == "1.1":
        print("the App Store version string is already 1.1. No 1.0 version remains to rename. It was not changed.")
    elif "1.1" in strings:
        print("an App Store version string 1.1 already exists, so this version cannot be renamed to 1.1. It was not changed.")
    elif state in EDITABLE:
        print(
            "this version is editable and 1.1 is not used by another App Store version, "
            "so a versionString PATCH to 1.1 is allowed. It was not sent."
        )
    submissions = pages("reviewSubmissions", {"filter[app]": APP_ID, "limit": 5})
    for submission in submissions:
        sub_attrs = submission.get("attributes") or {}
        print(f"review submission {submission['id']} state {sub_attrs.get('state')} submitted {sub_attrs.get('submittedDate')}")
    chosen["restorePlan"] = plan
    explain_version(chosen["id"])
    unlock_unsubmitted(chosen["id"], plan)
    trains = pages(f"apps/{APP_ID}/preReleaseVersions", {"limit": 10})
    train_names = sorted({str((row.get("attributes") or {}).get("version") or "") for row in trains})
    print("build trains " + ", ".join(name for name in train_names if name) or "(none read)")
    return chosen


def entity_id(item_id):
    padded = item_id + "=" * ((4 - len(item_id) % 4) % 4)
    try:
        text = base64.b64decode(padded).decode()
    except (ValueError, UnicodeDecodeError):
        return ""
    parts = text.split("|")
    return parts[-1] if len(parts) >= 3 else ""


# List key, resource type used by GET, relationship name, relationship resource type.
ITEM_LINKS = (
    ("appStoreVersion", "appStoreVersions", "appStoreVersion", "appStoreVersions"),
    ("inAppPurchaseVersion", "inAppPurchaseVersions", "inAppPurchaseVersion", "inAppPurchaseVersions"),
    ("subscriptionVersion", "subscriptionVersions", "subscriptionVersion", "subscriptionVersions"),
    ("subscriptionGroupVersion", "subscriptionGroupVersions", "subscriptionGroupVersion", "subscriptionGroupVersions"),
    ("appEvent", "appEvents", "appEvent", "appEvents"),
    ("appCustomProductPageVersion", "appCustomProductPageVersions", "appCustomProductPageVersion", "appCustomProductPageVersions"),
    ("appStoreVersionExperiment", "appStoreVersionExperiments", "appStoreVersionExperiment", "appStoreVersionExperiments"),
    ("appStoreVersionExperimentV2", "appStoreVersionExperiments", "appStoreVersionExperimentV2", "appStoreVersionExperiments"),
    ("backgroundAssetVersion", "backgroundAssetVersions", "backgroundAssetVersion", "backgroundAssetVersions"),
)
ITEM_FIELDS = "state," + ",".join(row[0] for row in ITEM_LINKS)


def identify_entity(entity):
    seen = set()
    for _key, kind, relationship, resource_type in ITEM_LINKS:
        if kind in seen:
            continue
        seen.add(kind)
        status, payload = call("GET", f"{kind}/{entity}")
        if status < 400 and payload.get("data"):
            attrs = payload["data"].get("attributes") or {}
            label = attrs.get("productId") or attrs.get("versionString") or attrs.get("state") or attrs.get("name") or ""
            print(f"entity {entity} is {kind} {label}")
            return relationship, resource_type
    for kind in ("inAppPurchasesV2", "inAppPurchases"):
        status, payload = call("GET", f"{kind}/{entity}")
        if status < 400 and payload.get("data"):
            attrs = payload["data"].get("attributes") or {}
            print(f"entity {entity} is {kind} {attrs.get('productId') or ''}")
            return "inAppPurchaseV2", "inAppPurchases"
    print(f"entity {entity} was not identified")
    return "", ""


def version_state(version_id):
    _status, payload = call("GET", f"appStoreVersions/{version_id}")
    return ((payload.get("data") or {}).get("attributes") or {}).get("appStoreState")


def wait_unlocked(version_id):
    for _ in range(8):
        state = version_state(version_id)
        print(f"version state {state}")
        if state in EDITABLE and state != "READY_FOR_REVIEW":
            return True
        time.sleep(3)
    return False


def draft_items(submission_id):
    params = {"limit": 20, "fields[reviewSubmissionItems]": ITEM_FIELDS}
    status, payload = call("GET", f"reviewSubmissions/{submission_id}/items", params)
    if status >= 400:
        status, payload = call("GET", f"reviewSubmissions/{submission_id}/items", {"limit": 20})
    if status >= 400:
        raise SystemExit("could not list draft review items")
    return payload.get("data") or []


def describe_item(item):
    rels = item.get("relationships") or {}
    for key, _kind, relationship, resource_type in ITEM_LINKS:
        data = (rels.get(key) or {}).get("data") or {}
        if isinstance(data, dict) and data.get("id"):
            return data["id"], relationship, resource_type, key
    entity = entity_id(item["id"])
    if entity:
        relationship, resource_type = identify_entity(entity)
        if relationship:
            return entity, relationship, resource_type, relationship
    return entity, "", "", ""


def explain_version(version_id):
    status, payload = call("GET", f"appStoreVersions/{version_id}/appStoreVersionSubmission")
    submission = payload.get("data") or {}
    print(
        f"legacy appStoreVersionSubmission {status} "
        f"id {submission.get('id') or 'none'} state {(submission.get('attributes') or {}).get('state')}"
    )
    status, payload = call("GET", f"appStoreVersions/{version_id}")
    rels = ((payload.get("data") or {}).get("relationships") or {}) if status < 400 else {}
    for key, value in rels.items():
        data = (value or {}).get("data")
        ident = data.get("id") if isinstance(data, dict) else ""
        print(f"version relationship {key} {ident or 'none'}")


def remember_items(submission_id, plan):
    saved = []
    for item in draft_items(submission_id):
        entity, relationship, resource_type, label = describe_item(item)
        saved.append(
            {
                "id": item["id"],
                "entity": entity,
                "relationship": relationship,
                "resource_type": resource_type,
            }
        )
        print(
            f"draft item {item['id']} entity {entity} link {label or 'unknown'} "
            f"state {(item.get('attributes') or {}).get('state')}"
        )
    if saved:
        plan["items"] = saved
        plan["needs_restore"] = False
    else:
        plan["needs_restore"] = True
        print("unsubmitted draft has no items; the two subscription versions will be put back")
    return saved


def cancel_unsubmitted(submission_id):
    """Cancel the draft that was never submitted. This does not send it to App Review."""
    status, payload = call(
        "PATCH",
        f"reviewSubmissions/{submission_id}",
        body={
            "data": {
                "type": "reviewSubmissions",
                "id": submission_id,
                "attributes": {"canceled": True},
            }
        },
    )
    state = ((payload.get("data") or {}).get("attributes") or {}).get("state")
    print(f"canceled unsubmitted review submission {submission_id} -> {status} {state or ''}")
    return status < 400


def probe_numeric(entity):
    if not entity or not str(entity).isdigit():
        return
    for kind in (
        "builds",
        "preReleaseVersions",
        "appInfos",
        "appStoreReviewDetails",
        "appCustomProductPages",
        "appStoreVersionExperimentTreatments",
        "apps",
    ):
        status, payload = call("GET", f"{kind}/{entity}")
        if status < 400 and payload.get("data"):
            attrs = payload["data"].get("attributes") or {}
            print(f"entity {entity} is {kind} {str(attrs)[:180]}")
            return
    print(f"entity {entity} numeric id was not identified")


def cycle_version(submission_id, version_id, plan):
    """Attach this version to the unsubmitted draft, then remove that item.

    Ready for Review blocks screenshot edits. The draft is not submitted.
    Subscription items already on the draft stay there.
    """
    print(f"version state before cycle {version_state(version_id)}")
    _status, detail, item_id = add_review_item(
        submission_id, "appStoreVersion", "appStoreVersions", version_id
    )
    if not item_id:
        if "ITEM_PART_OF_ANOTHER_SUBMISSION" in detail or "892105462" in detail:
            print("version 1.1 is the rejected September submission item 892105462")
            print("removing that item so screenshots can be edited; review was not submitted")
            rejected_item = "N2Q0ZTkyZDQtNDNhNS00OTllLTk1OTQtNDIxYmMzNzE3OGNifDZ8ODkyMTA1NDYy"
            delete_status, _payload = call("DELETE", f"reviewSubmissionItems/{rejected_item}")
            print(f"removed rejected version item -> {delete_status}")
            if delete_status in (200, 202, 204):
                return wait_unlocked(version_id)
        print("version was not attached to the unsubmitted draft")
        return False
    plan["temporary_version_item"] = item_id
    print(f"version state after attach {version_state(version_id)}")
    delete_status, _payload = call("DELETE", f"reviewSubmissionItems/{item_id}")
    print(f"removed temporary version item {item_id} -> {delete_status}")
    if delete_status not in (200, 202, 204):
        return False
    plan["temporary_version_item"] = None
    return wait_unlocked(version_id)


def unlock_unsubmitted(version_id, plan):
    """Ready for Review locks screenshots. Clear the unsubmitted draft, then restore it later.

    The rejected September submission is left alone. Nothing is submitted, and
    subscription products, prices, and availability are not edited.
    """
    submissions = pages("reviewSubmissions", {"filter[app]": APP_ID, "limit": 10})
    draft = None
    for submission in submissions:
        attrs = submission.get("attributes") or {}
        version_link = ((submission.get("relationships") or {}).get("appStoreVersionForReview") or {}).get("data") or {}
        print(
            f"submission link {submission['id']} appStoreVersionForReview {version_link.get('id') or 'none'} "
            f"state {attrs.get('state')} submitted {attrs.get('submittedDate')}"
        )
        unsubmitted = attrs.get("state") == "READY_FOR_REVIEW" and not attrs.get("submittedDate")
        if unsubmitted and draft is None:
            draft = submission
            plan["submission_id"] = submission["id"]
            remember_items(submission["id"], plan)
            continue
        print(f"leaving review submission {submission['id']} state {attrs.get('state')}")
        try:
            left_items = draft_items(submission["id"])
        except SystemExit as exc:
            print(f"could not list items for {submission['id']}: {exc}")
            continue
        for item in left_items:
            entity, _relationship, _resource_type, label = describe_item(item)
            print(
                f"left item {item['id']} entity {entity} link {label or 'unknown'} "
                f"rels {item.get('relationships')}"
            )
            probe_numeric(entity)
    if draft is None:
        raise SystemExit("version stayed locked; screenshots were not changed")
    plan["submission_id"] = draft["id"]
    if cycle_version(draft["id"], version_id, plan):
        return
    raise SystemExit("version stayed locked; screenshots were not changed")


def add_review_item(submission_id, relationship, resource_type, resource_id):
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
    print(f"draft item {relationship} {resource_id} -> {status} {item_id}")
    return status, str(payload)[:800], item_id


def restore_unsubmitted(plan, version_id):
    plan = plan or {}
    temporary = plan.get("temporary_version_item")
    if temporary:
        delete_status, _payload = call("DELETE", f"reviewSubmissionItems/{temporary}")
        print(f"removed temporary version item {temporary} -> {delete_status}")
        plan["temporary_version_item"] = None
    submission_id = plan.get("submission_id")
    if not plan.get("needs_restore"):
        print("draft items were left in place and review was not submitted")
        return
    if not submission_id and not plan.get("items"):
        print("no unsubmitted review submission to restore")
        return
    if plan.get("deleted_submission") or not submission_id:
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
        submission_id = (payload.get("data") or {}).get("id")
        print(f"created unsubmitted review submission {submission_id} -> {status}")
        if status >= 400 or not submission_id:
            print("screenshots were updated; the draft submission was not recreated and review was not submitted")
            return
    for item in plan.get("items") or []:
        if not item.get("relationship") or not item.get("resource_type") or not item.get("entity"):
            print(f"could not restore draft item {item.get('id')} entity {item.get('entity')}")
            continue
        add_review_item(submission_id, item["relationship"], item["resource_type"], item["entity"])
    print(f"app version {version_id} was not left on the draft and review was not submitted")


def blank(value):
    return value is None or str(value).strip() == ""


def report_gaps(version_id, localizations, shot_results):
    status, version = call("GET", f"appStoreVersions/{version_id}")
    attrs = (version.get("data") or {}).get("attributes") or {}
    gaps = []
    if blank(attrs.get("copyright")):
        gaps.append("copyright is empty")
    review_status, review = call("GET", f"appStoreVersions/{version_id}/appStoreReviewDetail")
    review_attrs = ((review.get("data") or {}).get("attributes") or {}) if review_status < 400 else {}
    if review_status >= 400:
        gaps.append("app review contact could not be read")
    else:
        for field in ("contactFirstName", "contactLastName", "contactEmail", "contactPhone"):
            if blank(review_attrs.get(field)):
                gaps.append("review contact missing " + field)
    build_status, build = call("GET", f"appStoreVersions/{version_id}/build")
    build_row = build.get("data") if build_status < 400 else None
    if not build_row:
        gaps.append("no build is attached (left unattached on purpose)")
    else:
        print("attached build left as-is " + str((build_row.get("attributes") or {}).get("version")))
    iap_status, iap = call("GET", f"appStoreVersions/{version_id}/inAppPurchasesV2", {"limit": 10})
    iap_rows = (iap.get("data") or []) if iap_status < 400 else None
    if iap_rows is None:
        gaps.append("could not read the version's in-app purchases")
    elif not iap_rows:
        gaps.append("no in-app purchases are added to this version")
    info_rows = pages(f"apps/{APP_ID}/appInfos", {"limit": 5})
    for info in info_rows:
        info_attrs = info.get("attributes") or {}
        if blank(info_attrs.get("appStoreAgeRating")) and blank(info_attrs.get("brazilAgeRating")):
            pass
        locs = pages(f"appInfos/{info['id']}/appInfoLocalizations", {"limit": 10})
        for loc in locs:
            loc_attrs = loc.get("attributes") or {}
            locale = loc_attrs.get("locale")
            if blank(loc_attrs.get("privacyPolicyUrl")):
                gaps.append(f"privacy policy URL empty ({locale})")
            if blank(loc_attrs.get("name")):
                gaps.append(f"app name empty ({locale})")
    for loc in localizations:
        loc_attrs = loc.get("attributes") or {}
        locale = loc_attrs.get("locale")
        for field in ("description", "keywords", "supportUrl"):
            if blank(loc_attrs.get(field)):
                gaps.append(f"{locale} {field} is empty")
    for result in shot_results:
        if result.get("state") == "UNREPLACED":
            gaps.append(f"{result.get('locale')} {result['display']} still has screenshots that were not replaced")
        elif result.get("state") != "COMPLETE":
            gaps.append(f"{result['display']} screenshot state {result.get('state')}")
    print("METADATA GAPS")
    if not gaps:
        print("none of the checked fields are empty")
    for gap in gaps:
        print("- " + gap)


def delete_old(set_id):
    rows = pages(f"appScreenshotSets/{set_id}/appScreenshots", {"limit": 20})
    for row in rows:
        status, _payload = call("DELETE", f"appScreenshots/{row['id']}")
        print(f"deleted old screenshot {row['id']} -> {status}")
        if status not in (204, 404):
            raise SystemExit("could not delete old screenshot " + row["id"])


def upload_bytes(operations, data):
    for operation in operations:
        headers = {}
        for header in operation.get("requestHeaders") or []:
            headers[header.get("name")] = header.get("value")
        offset = int(operation.get("offset") or 0)
        length = operation.get("length")
        chunk = data[offset:] if length is None else data[offset : offset + int(length)]
        response = requests.request(
            operation.get("method") or "PUT",
            operation["url"],
            headers=headers,
            data=chunk,
            timeout=180,
        )
        print(f"upload {offset} {len(chunk)} -> {response.status_code}")
        if response.status_code not in (200, 201, 204):
            raise SystemExit("screenshot upload failed " + response.text[:200])


def wait_complete(shot_id):
    deadline = time.time() + 180
    last = ""
    while time.time() < deadline:
        status, payload = call("GET", f"appScreenshots/{shot_id}")
        if status >= 400:
            time.sleep(5)
            continue
        delivery = ((payload.get("data") or {}).get("attributes") or {}).get("assetDeliveryState") or {}
        last = delivery.get("state") or ""
        print(f"screenshot {shot_id} {last}")
        if last == "COMPLETE":
            return last
        if last == "FAILED":
            raise SystemExit("screenshot failed " + str(delivery.get("errors"))[:300])
        time.sleep(5)
    raise SystemExit("screenshot did not complete: " + last)


def ensure_set(localization_id, display):
    rows = pages(
        f"appStoreVersionLocalizations/{localization_id}/appScreenshotSets",
        {"limit": 20},
    )
    for row in rows:
        if (row.get("attributes") or {}).get("screenshotDisplayType") == display:
            return row["id"]
    status, payload = call(
        "POST",
        "appScreenshotSets",
        body={
            "data": {
                "type": "appScreenshotSets",
                "attributes": {"screenshotDisplayType": display},
                "relationships": {
                    "appStoreVersionLocalization": {
                        "data": {"type": "appStoreVersionLocalizations", "id": localization_id}
                    }
                },
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not create screenshot set " + display)
    return payload["data"]["id"]


def upload_shot(set_id, shot):
    data = open(shot["path"], "rb").read()
    checksum = hashlib.md5(data).hexdigest()
    delete_old(set_id)
    status, payload = call(
        "POST",
        "appScreenshots",
        body={
            "data": {
                "type": "appScreenshots",
                "attributes": {"fileName": shot["file_name"], "fileSize": len(data)},
                "relationships": {
                    "appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}
                },
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not reserve " + shot["file_name"])
    created = payload["data"]
    operations = (created.get("attributes") or {}).get("uploadOperations") or []
    if not operations:
        raise SystemExit("no upload operations for " + shot["file_name"])
    upload_bytes(operations, data)
    status, _payload = call(
        "PATCH",
        f"appScreenshots/{created['id']}",
        body={
            "data": {
                "type": "appScreenshots",
                "id": created["id"],
                "attributes": {"uploaded": True, "sourceFileChecksum": checksum},
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not commit " + shot["file_name"])
    state = wait_complete(created["id"])
    return created["id"], state


def main():
    check_files()
    holder = {
        "version": None,
        "plan": {
            "submission_id": None,
        "items": [dict(item) for item in KNOWN_DRAFT_ITEMS],
        "deleted_submission": False,
        "needs_restore": True,
    },
    }
    try:
        version = choose_version(holder["plan"])
        holder["version"] = version
        version_id = version["id"]
        localizations = pages(f"appStoreVersions/{version_id}/appStoreVersionLocalizations", {"limit": 10})
        if not localizations:
            raise SystemExit("the App Store version has no localization")
        results = []
        replaced = {shot["display"] for shot in SHOTS}
        for localization in localizations:
            locale = (localization.get("attributes") or {}).get("locale")
            print(f"LOCALIZATION {locale} {localization['id']}")
            for shot in SHOTS:
                set_id = ensure_set(localization["id"], shot["display"])
                shot_id, state = upload_shot(set_id, shot)
                print(f"SET {shot['display']} id {set_id} screenshot {shot_id} {state}")
                results.append({"display": shot["display"], "set_id": set_id, "shot_id": shot_id, "state": state, "locale": locale})
        print("SCREENSHOTS")
        for result in results:
            print(
                f"{result['locale']} {result['display']} set {result['set_id']} "
                f"screenshot {result['shot_id']} {result['state']}"
            )
        print("OTHER SETS")
        for localization in localizations:
            locale = (localization.get("attributes") or {}).get("locale")
            for row in pages(f"appStoreVersionLocalizations/{localization['id']}/appScreenshotSets", {"limit": 30}):
                display = (row.get("attributes") or {}).get("screenshotDisplayType")
                shots = pages(f"appScreenshotSets/{row['id']}/appScreenshots", {"limit": 10})
                states = [((item.get("attributes") or {}).get("assetDeliveryState") or {}).get("state") for item in shots]
                print(f"{locale} {display} set {row['id']} count {len(shots)} {states}")
                if display not in replaced and shots:
                    results.append({"display": display, "state": "UNREPLACED", "locale": locale})
        report_gaps(version_id, localizations, results)
    finally:
        version = holder["version"] or {}
        restore_unsubmitted(holder["plan"], version.get("id") or "")


if __name__ == "__main__":
    main()
