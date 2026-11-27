#!/usr/bin/env python3
"""Submit WRAP 911 iOS 1.4 build 36 for App Review.

Creates version 1.4 only if it does not exist. Keeps metadata Apple copies
from live 1.3, including screenshots. Sets release to AFTER_APPROVAL.
Does not modify version 1.2 or 1.3, purchases, external TestFlight groups,
or the photo-check key. Does not print API keys.
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
TRAIN = "1.4"
LIVE_VERSION_ID = "e5861b53-2ce6-482d-95e0-39ce3e46ea77"
OLD_VERSION_ID = "600c93dd-0a49-4a1a-9d7c-3c402dadc446"
BUILD_ID = "c2650d82-1dbb-49ce-9a10-9c07a328d3fb"
BUILD_NUMBER = "36"
BASE = "https://api.appstoreconnect.apple.com"
RELEASE = "AFTER_APPROVAL"
WHATS_NEW = "Job manager upgrades, Coach screen layout fix, and small wording fixes."
PHOTO_LINE = "The AI photo check is not enabled in this build."
PROTECTED = {LIVE_VERSION_ID, OLD_VERSION_ID}
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
    "betaGroups",
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
    if method != "GET":
        for version_id in PROTECTED:
            if version_id in clean or (body is not None and version_id in str(body)):
                raise SystemExit("refusing to change version " + version_id)
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


def et(value: str) -> str:
    if not value:
        return "not available"
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return str(value)
    return parsed.astimezone(ZoneInfo("America/New_York")).strftime("%Y-%m-%d %I:%M %p ET") + " (raw " + str(value) + ")"


def list_versions() -> list[dict]:
    rows = pages(f"apps/{APP_ID}/appStoreVersions", {"limit": 20, "filter[platform]": "IOS"})
    for row in rows:
        attrs = row.get("attributes") or {}
        print(
            f"existing version {attrs.get('versionString')} {row.get('id')} "
            f"state {attrs.get('appStoreState')} release {attrs.get('releaseType')}"
        )
    return rows


def find_or_create() -> dict:
    rows = list_versions()
    for row in rows:
        attrs = row.get("attributes") or {}
        if str(attrs.get("versionString")) == TRAIN and str(attrs.get("platform") or "IOS") == "IOS":
            print(f"reusing version 1.4 {row['id']} state {attrs.get('appStoreState')} release {attrs.get('releaseType')}")
            return row
    blockers = []
    for row in rows:
        attrs = row.get("attributes") or {}
        state = str(attrs.get("appStoreState") or "")
        if state in EDITABLE:
            blockers.append(f"{attrs.get('versionString')} {row.get('id')} {state}")
    if blockers:
        print("EDITABLE VERSION BLOCKS 1.4: " + "; ".join(blockers))
        print("No version was changed.")
        raise SystemExit("an editable version is in the way; 1.4 was not created")
    status, payload = call(
        "POST",
        "appStoreVersions",
        body={
            "data": {
                "type": "appStoreVersions",
                "attributes": {"platform": "IOS", "versionString": TRAIN, "releaseType": RELEASE},
                "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
            }
        },
    )
    if status >= 400 or not (payload.get("data") or {}).get("id"):
        print("APPLE ERROR: " + err_text(payload))
        raise SystemExit("version 1.4 was not created")
    created = payload["data"]
    attrs = created.get("attributes") or {}
    print(f"created version 1.4 {created['id']} release {attrs.get('releaseType')}")
    return created


def set_release(version_id: str) -> str:
    status, payload = call("GET", f"appStoreVersions/{version_id}")
    attrs = ((payload.get("data") or {}).get("attributes") or {}) if status < 400 else {}
    current = str(attrs.get("releaseType") or "")
    if current == RELEASE:
        print(f"release type already {RELEASE}")
        return current
    status, patched = call(
        "PATCH",
        f"appStoreVersions/{version_id}",
        body={"data": {"type": "appStoreVersions", "id": version_id, "attributes": {"releaseType": RELEASE}}},
    )
    if status >= 400:
        print("APPLE ERROR: " + err_text(patched))
        raise SystemExit("could not set release type AFTER_APPROVAL")
    fresh = ((patched.get("data") or {}).get("attributes") or {}).get("releaseType") or ""
    print(f"release type set {fresh}")
    if fresh != RELEASE:
        raise SystemExit("release type did not stick as AFTER_APPROVAL")
    return str(fresh)


def confirm_build() -> None:
    status, payload = call(
        "GET",
        f"builds/{BUILD_ID}",
        params={"fields[builds]": "version,processingState,usesNonExemptEncryption,uploadedDate"},
    )
    if status >= 400:
        raise SystemExit("could not read build 36")
    attrs = (payload.get("data") or {}).get("attributes") or {}
    print(
        f"build {attrs.get('version')} {BUILD_ID} processing {attrs.get('processingState')} "
        f"encryption {attrs.get('usesNonExemptEncryption')} uploaded {et(str(attrs.get('uploadedDate') or ''))}"
    )
    if str(attrs.get("version")) != BUILD_NUMBER:
        raise SystemExit("that build id is not build 36")
    if attrs.get("usesNonExemptEncryption") is not False:
        raise SystemExit("export compliance is not false; it was not changed")
    if attrs.get("processingState") != "VALID":
        raise SystemExit("build 36 is not VALID")


def shot_count(version_id: str, label: str) -> int:
    total = 0
    locs = pages(f"appStoreVersions/{version_id}/appStoreVersionLocalizations", {"limit": 20})
    for loc in locs:
        locale = (loc.get("attributes") or {}).get("locale")
        sets = pages(f"appStoreVersionLocalizations/{loc['id']}/appScreenshotSets", {"limit": 20})
        for shot_set in sets:
            display = (shot_set.get("attributes") or {}).get("screenshotDisplayType") or ""
            shots = pages(f"appScreenshotSets/{shot_set['id']}/appScreenshots", {"limit": 20})
            total += len(shots)
            print(f"screenshots {label} {locale} {display} count {len(shots)}")
    print(f"screenshots {label} total {total}")
    return total


def keep_screenshots(version_id: str) -> None:
    live = shot_count(LIVE_VERSION_ID, "1.3")
    current = shot_count(version_id, "1.4")
    if current == 0 or current < live:
        raise SystemExit(
            f"version 1.4 screenshots {current}, live 1.3 screenshots {live}. "
            "They were not copied in full, and none were uploaded. Submission stopped."
        )
    print("screenshots were not edited")


def set_whats_new(version_id: str) -> None:
    locs = pages(f"appStoreVersions/{version_id}/appStoreVersionLocalizations", {"limit": 20})
    target = None
    for loc in locs:
        if (loc.get("attributes") or {}).get("locale") == "en-US":
            target = loc
            break
    if not target:
        raise SystemExit("version 1.4 has no en-US localization copied from 1.3. What's New was not written and submission stopped.")
    attrs = target.get("attributes") or {}
    description = str(attrs.get("description") or "")
    if not description.strip():
        raise SystemExit("en-US description was not copied from 1.3. It was not replaced. Submission stopped.")
    current = str(attrs.get("whatsNew") or "")
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
        raise SystemExit("could not attach build 36")
    status, attached = call("GET", f"appStoreVersions/{version_id}/build")
    got = attached.get("data") or {}
    print(f"attached build {(got.get('attributes') or {}).get('version')} {got.get('id')}")
    if got.get("id") != BUILD_ID:
        raise SystemExit("version 1.4 is not attached to build 36")


def live_notes() -> str:
    status, detail = call("GET", f"appStoreVersions/{LIVE_VERSION_ID}/appStoreReviewDetail")
    if status >= 400:
        return ""
    return str(((detail.get("data") or {}).get("attributes") or {}).get("notes") or "")


def merged_notes(current: str) -> str:
    base = current.strip() or live_notes().strip()
    if not base:
        raise SystemExit("version 1.3 review notes were not readable. Notes were not replaced. Submission stopped.")
    if PHOTO_LINE.lower() in base.lower():
        return base
    return base + "\n\n" + PHOTO_LINE


def set_notes(version_id: str) -> None:
    status, detail = call("GET", f"appStoreVersions/{version_id}/appStoreReviewDetail")
    current = ""
    review_id = ""
    if status < 400 and (detail.get("data") or {}).get("id"):
        review_id = detail["data"]["id"]
        current = str((detail["data"].get("attributes") or {}).get("notes") or "")
    notes = merged_notes(current)
    if review_id and notes.strip() == current.strip():
        print("review notes already include the photo-check line")
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
    print(f"add version 1.4 -> {status} {detail[:300]}")
    if status in (200, 201):
        return
    if "already" in detail.lower() and "another" not in detail.lower():
        return
    print("APPLE ERROR: " + detail)
    raise SystemExit("could not add version 1.4 to the review submission")


def submission_items(submission_id: str) -> list[dict]:
    return pages(f"reviewSubmissions/{submission_id}/items", {"limit": 50})


def submit_version(version_id: str) -> tuple[str, str, str]:
    rows = pages("reviewSubmissions", {"filter[app]": APP_ID, "limit": 20})
    draft = None
    for row in rows:
        attrs = row.get("attributes") or {}
        print(f"review submission {row['id']} state {attrs.get('state')} submitted {attrs.get('submittedDate')}")
        if attrs.get("state") == "READY_FOR_REVIEW" and not attrs.get("submittedDate") and draft is None:
            items = submission_items(row["id"])
            print(f"draft {row['id']} items {len(items)}")
            if items:
                print("an open draft already has items. A new submission was not forced onto it.")
                continue
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
        release = ((version.get("data") or {}).get("attributes") or {}).get("releaseType") or ""
        print(f"poll {attempt} version {version_state} release {release} submission {state}")
        if state in DONE or version_state in DONE:
            return draft["id"], state, submitted
        time.sleep(8)
    return draft["id"], state, submitted


def main() -> None:
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    if "\u2014" in WHATS_NEW or "\u2013" in WHATS_NEW:
        raise SystemExit("what's new contains a dash that is not allowed")
    version = find_or_create()
    version_id = version["id"]
    if version_id in PROTECTED:
        raise SystemExit("refusing to use a protected version id")
    state = (version.get("attributes") or {}).get("appStoreState")
    if state in DONE:
        release = set_release(version_id)
        print(f"version 1.4 is already {state}; it was not resubmitted")
        print(f"VERSION ID {version_id}")
        print(f"VERSION STATE {state}")
        print(f"RELEASE {release}")
        return
    if state and state not in EDITABLE:
        print(f"version 1.4 is {state}; it was not changed")
        raise SystemExit("version 1.4 is not editable")
    confirm_build()
    keep_screenshots(version_id)
    set_whats_new(version_id)
    attach_build(version_id)
    release = set_release(version_id)
    set_notes(version_id)
    submission_id, submission_state, submitted = submit_version(version_id)
    status, fresh = call("GET", f"appStoreVersions/{version_id}")
    final = (fresh.get("data") or {}).get("attributes") or {}
    status, live = call("GET", f"appStoreVersions/{LIVE_VERSION_ID}")
    live_state = ((live.get("data") or {}).get("attributes") or {}).get("appStoreState") if status < 400 else "unread"
    print(f"VERSION ID {version_id}")
    print(f"VERSION STATE {final.get('appStoreState')}")
    print(f"RELEASE {final.get('releaseType') or release}")
    print(f"BUILD {BUILD_NUMBER} {BUILD_ID}")
    print(f"SUBMISSION {submission_id} {submission_state}")
    print(f"SUBMITTED {et(submitted)}")
    print(f"LIVE 1.3 STATE {live_state}")
    print("Version 1.2 and version 1.3 were not changed. No purchases or screenshots were edited. No external TestFlight group was changed.")


if __name__ == "__main__":
    main()
