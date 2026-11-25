#!/usr/bin/env python3
"""Submit WRAP 911 iOS 1.3 build 33 for App Review.

Finds or creates version 1.3 only. Does not modify version 1.2, in-app
purchases, prices, screenshots, or build 32's TestFlight beta review.
Does not print API keys.
"""
from __future__ import annotations

import os
import re
import time
from datetime import datetime
from zoneinfo import ZoneInfo

import jwt
import requests

APP_ID = "6816763473"
TRAIN = "1.3"
OLD_VERSION_ID = "600c93dd-0a49-4a1a-9d7c-3c402dadc446"
BUILD_ID = "f3395f8e-cdea-4fca-8ff8-f5f886cff186"
BUILD_NUMBER = "33"
BUILD_32 = "6d13e2f5-112d-4150-bbf6-29ed4304dd9b"
BASE = "https://api.appstoreconnect.apple.com"
WHATS_NEW = (
    "New Start here guide: pick what you are wrapping and jump straight to the right first lesson. "
    "Simpler home screen with four big buttons: Learn, Fix a Problem, Calculator and My Jobs. "
    "New How to use WRAP 911 lesson pinned at the top of Learn. Fixes and polish."
)
EXTRA_LINE = "1.3 adds a first-run Start here guide and a simpler home."
REQUIRED = (
    "Free lessons, Search, I'm stuck / first install, and Quick Fix work without a purchase.",
    "Apple in-app purchase is the only way to pay. There is no external purchase link and no unlock-code field.",
    "Restore Purchases is in Pricing.",
    EXTRA_LINE,
)
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
FORBIDDEN = (
    "appScreenshots",
    "appScreenshotSets",
    "customerReviews",
    "resolutionCenter",
    "inAppPurchase",
    "appAvailabilities",
    "appPriceSchedules",
    "betaAppReview",
    "builds/" + BUILD_32,
)


def pem() -> str:
    raw = os.environ["RAW"]
    body = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    lines = [body[i : i + 64] for i in range(0, len(body), 64)]
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(lines) + "\n-----END PRIVATE KEY-----\n"


def token() -> str:
    encoded = jwt.encode(
        {"iss": os.environ["ASC_ISSUER_ID"], "iat": int(time.time()), "exp": int(time.time()) + 1100, "aud": "appstoreconnect-v1"},
        pem(),
        algorithm="ES256",
        headers={"kid": os.environ["ASC_KEY_ID"]},
    )
    return encoded.decode() if isinstance(encoded, bytes) else encoded


def err_text(payload: dict) -> str:
    rows = (payload or {}).get("errors") or []
    if not rows:
        return str(payload)[:800]
    return " | ".join(
        " ".join(str(row.get(key) or "") for key in ("status", "code", "title", "detail")).strip() for row in rows
    )


def call(method: str, path: str, params: dict | None = None, body: dict | None = None) -> tuple[int, dict]:
    clean = path.split("?", 1)[0]
    if OLD_VERSION_ID in clean and method != "GET":
        raise SystemExit("refusing to change version 1.2")
    if BUILD_32 in clean or (body is not None and BUILD_32 in str(body)):
        raise SystemExit("refusing to change build 32")
    if method != "GET":
        for part in FORBIDDEN:
            if part in clean:
                raise SystemExit("refusing " + method + " " + clean)
    if method not in ("GET", "POST", "PATCH"):
        raise SystemExit("refusing " + method)
    url = path if path.startswith("http") else BASE + "/v1/" + path.lstrip("/")
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
        print(f"HTTP {response.status_code} {method} {clean} {err_text(payload)[:700]}")
    return response.status_code, payload


def pages(path: str, params: dict | None = None) -> list[dict]:
    items: list[dict] = []
    query = dict(params or {})
    guard = 0
    while path and guard < 12:
        guard += 1
        status, payload = call("GET", path, params=query)
        if status >= 400:
            return items
        items.extend(payload.get("data") or [])
        nxt = ((payload.get("links") or {}).get("next")) or ""
        if "/v1/" in nxt:
            path = nxt.split("/v1/", 1)[1]
            query = None
        else:
            path = ""
    return items


def list_versions() -> list[dict]:
    rows = pages(f"apps/{APP_ID}/appStoreVersions", {"limit": 20, "filter[platform]": "IOS"})
    for row in rows:
        attrs = row.get("attributes") or {}
        print(f"existing version {attrs.get('versionString')} {row.get('id')} state {attrs.get('appStoreState')}")
    return rows


def find_or_create() -> dict:
    rows = list_versions()
    for row in rows:
        attrs = row.get("attributes") or {}
        if str(attrs.get("versionString")) == TRAIN and str(attrs.get("platform") or "IOS") == "IOS":
            print(f"reusing version 1.3 {row['id']} state {attrs.get('appStoreState')}")
            return row
    blockers = []
    for row in rows:
        attrs = row.get("attributes") or {}
        state = str(attrs.get("appStoreState") or "")
        if state in EDITABLE:
            blockers.append(f"{attrs.get('versionString')} {row.get('id')} {state}")
    if blockers:
        print("EDITABLE VERSION BLOCKS 1.3: " + "; ".join(blockers))
        print("No version was changed.")
        raise SystemExit("an editable version is in the way; 1.3 was not created")
    status, payload = call(
        "POST",
        "appStoreVersions",
        body={
            "data": {
                "type": "appStoreVersions",
                "attributes": {"platform": "IOS", "versionString": TRAIN},
                "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
            }
        },
    )
    if status >= 400 or not (payload.get("data") or {}).get("id"):
        print("APPLE ERROR: " + err_text(payload))
        raise SystemExit("version 1.3 was not created")
    print(f"created version 1.3 {payload['data']['id']}")
    return payload["data"]


def confirm_build() -> None:
    status, payload = call("GET", f"builds/{BUILD_ID}", params={"fields[builds]": "version,processingState,usesNonExemptEncryption"})
    if status >= 400:
        raise SystemExit("could not read build 33")
    attrs = (payload.get("data") or {}).get("attributes") or {}
    print(f"build {attrs.get('version')} {BUILD_ID} processing {attrs.get('processingState')} encryption {attrs.get('usesNonExemptEncryption')}")
    if str(attrs.get("version")) != BUILD_NUMBER:
        raise SystemExit("that build id is not build 33")
    if attrs.get("usesNonExemptEncryption") is not False:
        raise SystemExit("export compliance is not false; it was not changed")
    if attrs.get("processingState") != "VALID":
        raise SystemExit("build 33 is not VALID")


def set_whats_new(version_id: str) -> None:
    locs = pages(f"appStoreVersions/{version_id}/appStoreVersionLocalizations", {"limit": 20})
    target = None
    for loc in locs:
        if (loc.get("attributes") or {}).get("locale") == "en-US":
            target = loc
            break
    if not target:
        status, created = call(
            "POST",
            "appStoreVersionLocalizations",
            body={
                "data": {
                    "type": "appStoreVersionLocalizations",
                    "attributes": {"locale": "en-US", "whatsNew": WHATS_NEW},
                    "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": version_id}}},
                }
            },
        )
        if status >= 400:
            print("APPLE ERROR: " + err_text(created))
            raise SystemExit("could not add the en-US What's New text")
        print("what's new created")
        return
    current = (target.get("attributes") or {}).get("whatsNew") or ""
    if current.strip() == WHATS_NEW:
        print("what's new already set")
        return
    status, payload = call(
        "PATCH",
        f"appStoreVersionLocalizations/{target['id']}",
        body={"data": {"type": "appStoreVersionLocalizations", "id": target["id"], "attributes": {"whatsNew": WHATS_NEW}}},
    )
    if status >= 400:
        print("APPLE ERROR: " + err_text(payload))
        raise SystemExit("could not set What's New")
    print("what's new set")


def attach_build(version_id: str) -> None:
    status, payload = call(
        "PATCH",
        f"appStoreVersions/{version_id}",
        body={"data": {"type": "appStoreVersions", "id": version_id, "relationships": {"build": {"data": {"type": "builds", "id": BUILD_ID}}}}},
    )
    if status >= 400:
        print("APPLE ERROR: " + err_text(payload))
        raise SystemExit("could not attach build 33")
    status, attached = call("GET", f"appStoreVersions/{version_id}/build")
    got = attached.get("data") or {}
    print(f"attached build {(got.get('attributes') or {}).get('version')} {got.get('id')}")
    if got.get("id") != BUILD_ID:
        raise SystemExit("version 1.3 is not attached to build 33")


def previous_notes() -> str:
    status, detail = call("GET", f"appStoreVersions/{OLD_VERSION_ID}/appStoreReviewDetail")
    if status >= 400:
        return ""
    return str(((detail.get("data") or {}).get("attributes") or {}).get("notes") or "")


def merged_notes(current: str) -> str:
    base = current.strip() or previous_notes().strip()
    parts = [base] if base else []
    lowered = base.lower()
    for line in REQUIRED:
        if line.lower() not in lowered:
            parts.append(line)
    return "\n\n".join(parts)


def set_notes(version_id: str) -> None:
    status, detail = call("GET", f"appStoreVersions/{version_id}/appStoreReviewDetail")
    current = ""
    review_id = ""
    if status < 400 and (detail.get("data") or {}).get("id"):
        review_id = detail["data"]["id"]
        current = str((detail["data"].get("attributes") or {}).get("notes") or "")
    notes = merged_notes(current)
    if review_id and notes.strip() == current.strip():
        print("review notes already include the 1.3 line")
        return
    if review_id:
        status, payload = call(
            "PATCH",
            f"appStoreReviewDetails/{review_id}",
            body={"data": {"type": "appStoreReviewDetails", "id": review_id, "attributes": {"notes": notes}}},
        )
    else:
        status, payload = call(
            "POST",
            "appStoreReviewDetails",
            body={
                "data": {
                    "type": "appStoreReviewDetails",
                    "attributes": {"notes": notes, "contactEmail": "info@wrap911.com"},
                    "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": version_id}}},
                }
            },
        )
    if status >= 400:
        print("APPLE ERROR: " + err_text(payload))
        raise SystemExit("could not save review notes")
    print("review notes saved")


def add_version_item(submission_id: str, version_id: str) -> None:
    status, payload = call(
        "POST",
        "reviewSubmissionItems",
        body={
            "data": {
                "type": "reviewSubmissionItems",
                "relationships": {
                    "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": submission_id}},
                    "appStoreVersion": {"data": {"type": "appStoreVersions", "id": version_id}},
                },
            }
        },
    )
    detail = err_text(payload) if status >= 400 else ""
    print(f"add version 1.3 -> {status} {detail[:300]}")
    if status in (200, 201):
        return
    if "already" in detail.lower() and "another" not in detail.lower():
        return
    print("APPLE ERROR: " + detail)
    raise SystemExit("could not add version 1.3 to the review submission")


def submit_version(version_id: str) -> tuple[str, str, str]:
    rows = pages("reviewSubmissions", {"filter[app]": APP_ID, "limit": 20})
    draft = None
    for row in rows:
        attrs = row.get("attributes") or {}
        print(f"review submission {row['id']} state {attrs.get('state')} submitted {attrs.get('submittedDate')}")
        if attrs.get("state") in DONE and version_id in str(row):
            continue
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
            print("APPLE ERROR: " + err_text(payload))
            raise SystemExit("could not create the review submission")
        draft = payload["data"]
        print(f"created review submission {draft['id']}")
    add_version_item(draft["id"], version_id)
    status, payload = call(
        "PATCH",
        f"reviewSubmissions/{draft['id']}",
        body={"data": {"type": "reviewSubmissions", "id": draft["id"], "attributes": {"submitted": True}}},
    )
    if status >= 400:
        print("APPLE ERROR: " + err_text(payload))
        raise SystemExit("review submission was not accepted")
    state = ((payload.get("data") or {}).get("attributes") or {}).get("state") or ""
    submitted = ((payload.get("data") or {}).get("attributes") or {}).get("submittedDate") or ""
    print(f"submit {draft['id']} -> {status} {state} {submitted}")
    for attempt in range(1, 8):
        status, fresh = call("GET", f"reviewSubmissions/{draft['id']}")
        status2, version = call("GET", f"appStoreVersions/{version_id}")
        state = ((fresh.get("data") or {}).get("attributes") or {}).get("state") or state
        submitted = ((fresh.get("data") or {}).get("attributes") or {}).get("submittedDate") or submitted
        version_state = ((version.get("data") or {}).get("attributes") or {}).get("appStoreState") or ""
        print(f"poll {attempt} version {version_state} submission {state}")
        if state in DONE or version_state in DONE:
            return draft["id"], state, submitted
        time.sleep(8)
    return draft["id"], state, submitted


def et(value: str) -> str:
    if not value:
        return ""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(ZoneInfo("America/New_York")).strftime("%Y-%m-%d %I:%M %p ET")
    except ValueError:
        return value


def main() -> None:
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    version = find_or_create()
    version_id = version["id"]
    if version_id == OLD_VERSION_ID:
        raise SystemExit("refusing to use the 1.2 version id")
    state = (version.get("attributes") or {}).get("appStoreState")
    if state in DONE:
        print(f"version 1.3 is already {state}; it was not changed")
        print(f"VERSION STATE {state}")
        return
    if state and state not in EDITABLE:
        print(f"version 1.3 is {state}; it was not changed")
        raise SystemExit("version 1.3 is not editable")
    confirm_build()
    set_whats_new(version_id)
    attach_build(version_id)
    set_notes(version_id)
    submission_id, submission_state, submitted = submit_version(version_id)
    status, fresh = call("GET", f"appStoreVersions/{version_id}")
    final_state = ((fresh.get("data") or {}).get("attributes") or {}).get("appStoreState") if status < 400 else ""
    print(f"VERSION STATE {final_state}")
    print(f"SUBMISSION {submission_id} {submission_state}")
    print(f"SUBMITTED {et(submitted)}")
    print("Build 32 beta review was not changed. Version 1.2 was not changed. No screenshots or purchases were edited.")


if __name__ == "__main__":
    main()
