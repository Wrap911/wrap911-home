#!/usr/bin/env python3
"""Submit WRAP 911 build 32 for TestFlight Beta App Review.

Sets the beta review contact, adds only build 32 to WRAP 911 Public Testers,
and creates the beta review submission if Apple did not create one. Does not
touch App Store review, version 1.2, or build 30. Does not print API keys.
"""
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
BUILD_ID = "6d13e2f5-112d-4150-bbf6-29ed4304dd9b"
BUILD_30 = "58d43c1e-403a-499b-8aec-4756034ea677"
GROUP_NAME = "WRAP 911 Public Testers"
NOTES = (
    "WRAP 911 is a vinyl wrap installer trainer for beginners. Free lessons, Search, "
    "I'm stuck / first install, and Quick Fix work without purchase. Paid content unlocks "
    "via Apple in-app purchase only (Seat and Shop Pack); there is no Stripe, no external "
    "purchase link, and no unlock-code field on iOS. Restore Purchases is in Pricing."
)
CONTACT = {
    "contactFirstName": "Gerry",
    "contactLastName": "Rivera",
    "contactPhone": "5087621204",
    "contactEmail": "info@wrap911.com",
    "demoAccountRequired": False,
    "notes": NOTES,
}
BANNED = (
    "appStoreVersionSubmissions",
    "appStoreVersions",
    "appStoreVersionLocalizations",
    "reviewSubmissions",
    "reviewSubmissionItems",
    "inAppPurchases",
    "customerReviews",
)


def pem():
    raw = os.environ["RAW"]
    body = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    lines = [body[i : i + 64] for i in range(0, len(body), 64)]
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(lines) + "\n-----END PRIVATE KEY-----\n"


def token():
    encoded = jwt.encode(
        {
            "iss": os.environ["ASC_ISSUER_ID"],
            "iat": int(time.time()),
            "exp": int(time.time()) + 600,
            "aud": "appstoreconnect-v1",
        },
        pem(),
        algorithm="ES256",
        headers={"kid": os.environ["ASC_KEY_ID"]},
    )
    return encoded.decode() if isinstance(encoded, bytes) else encoded


def call(method, path, params=None, body=None):
    if BUILD_30 in path or (body is not None and BUILD_30 in str(body)):
        raise SystemExit("refusing build 30")
    if any(part in path for part in BANNED):
        raise SystemExit("refusing " + path)
    if method == "POST" and "relationships/builds" in path:
        ids = []
        for item in (body or {}).get("data") or []:
            if item.get("type") != "builds" or item.get("id") != BUILD_ID:
                raise SystemExit("refusing to add a build other than 32")
            ids.append(item.get("id"))
        if ids != [BUILD_ID]:
            raise SystemExit("refusing build relationship")
    if method == "POST" and path.strip("/") == "betaAppReviewSubmissions":
        build = ((((body or {}).get("data") or {}).get("relationships") or {}).get("build") or {}).get("data") or {}
        if build.get("id") != BUILD_ID:
            raise SystemExit("refusing beta review for a build other than 32")
    if method == "POST" and path.strip("/") not in {"betaAppReviewSubmissions"} and "relationships/builds" not in path:
        raise SystemExit("refusing POST " + path)
    if method == "PATCH" and not path.strip("/").startswith("betaAppReviewDetails/"):
        raise SystemExit("refusing PATCH " + path)
    if method not in ("GET", "POST", "PATCH"):
        raise SystemExit("refusing " + method)
    headers = {"Authorization": "Bearer " + token()}
    if body is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(
        method,
        "https://api.appstoreconnect.apple.com/v1/" + path.lstrip("/"),
        headers=headers,
        params=params,
        json=body,
        timeout=90,
    )
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:300]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} {method} {path.split('?')[0]} {str(payload)[:600]}")
    return response.status_code, payload


def confirm_build():
    status, payload = call("GET", f"builds/{BUILD_ID}", params={"fields[builds]": "version,processingState"})
    if status >= 400:
        raise SystemExit("could not read build 32")
    attrs = (payload.get("data") or {}).get("attributes") or {}
    if str(attrs.get("version")) != "32":
        raise SystemExit("the build id is not build number 32")
    rel = call("GET", f"builds/{BUILD_ID}/preReleaseVersion")
    train = ((rel[1].get("data") or {}).get("attributes") or {}).get("version")
    if train != "1.3":
        raise SystemExit("build 32 is not on version 1.3")
    print(f"build 32 {BUILD_ID} processing {attrs.get('processingState')} train {train}")


def ensure_contact():
    status, payload = call("GET", f"apps/{APP_ID}/betaAppReviewDetail")
    if status >= 400 or not (payload.get("data") or {}).get("id"):
        raise SystemExit("could not read the beta review contact")
    detail = payload["data"]
    attrs = detail.get("attributes") or {}
    current = {key: attrs.get(key) for key in CONTACT}
    if str(current.get("contactEmail") or "").lower() == CONTACT["contactEmail"]:
        current["contactEmail"] = CONTACT["contactEmail"]
    if current == CONTACT:
        print(f"beta review contact already set id {detail['id']}")
        return
    status, updated = call(
        "PATCH",
        f"betaAppReviewDetails/{detail['id']}",
        body={"data": {"type": "betaAppReviewDetails", "id": detail["id"], "attributes": CONTACT}},
    )
    if status >= 400:
        raise SystemExit("could not set the beta review contact")
    saved = ((updated.get("data") or {}).get("attributes") or {})
    print(f"beta review contact updated id {detail['id']} demoAccountRequired {saved.get('demoAccountRequired')}")
    print(f"contact {saved.get('contactFirstName')} {saved.get('contactLastName')} {saved.get('contactEmail')}")


def public_group():
    status, payload = call(
        "GET",
        f"apps/{APP_ID}/betaGroups",
        params={"limit": 50, "fields[betaGroups]": "name,isInternalGroup"},
    )
    if status >= 400:
        raise SystemExit("could not list beta groups")
    named = [row for row in (payload.get("data") or []) if (row.get("attributes") or {}).get("name") == GROUP_NAME]
    if len(named) != 1:
        raise SystemExit(f"expected one group named {GROUP_NAME}, found {len(named)}")
    if (named[0].get("attributes") or {}).get("isInternalGroup"):
        raise SystemExit("the public tester group is internal")
    return named[0]["id"]


def add_to_group(group_id):
    status, payload = call("GET", f"betaGroups/{group_id}/relationships/builds", params={"limit": 200})
    if status >= 400:
        raise SystemExit("could not read the public group builds")
    have = {row.get("id") for row in (payload.get("data") or [])}
    if BUILD_30 in have:
        print("build 30 is already in the group and was left there")
    if BUILD_ID in have:
        print("build 32 is already in WRAP 911 Public Testers")
        return
    status, _payload = call(
        "POST",
        f"betaGroups/{group_id}/relationships/builds",
        body={"data": [{"type": "builds", "id": BUILD_ID}]},
    )
    if status not in (200, 201, 204, 409):
        raise SystemExit("build 32 was not added to the public group")
    print(f"add build 32 to WRAP 911 Public Testers -> {status}")


def submission():
    status, payload = call("GET", f"builds/{BUILD_ID}/betaAppReviewSubmission")
    data = payload.get("data") or {}
    if status < 400 and data.get("id"):
        attrs = data.get("attributes") or {}
        print(f"beta review already exists id {data['id']} state {attrs.get('betaReviewState')}")
        return attrs.get("betaReviewState")
    status, created = call(
        "POST",
        "betaAppReviewSubmissions",
        body={
            "data": {
                "type": "betaAppReviewSubmissions",
                "relationships": {"build": {"data": {"type": "builds", "id": BUILD_ID}}},
            }
        },
    )
    data = created.get("data") or {}
    if status in (200, 201) and data.get("id"):
        state = (data.get("attributes") or {}).get("betaReviewState")
        print(f"created beta review id {data['id']} state {state}")
        return state
    status, payload = call("GET", f"builds/{BUILD_ID}/betaAppReviewSubmission")
    data = payload.get("data") or {}
    if status < 400 and data.get("id"):
        state = (data.get("attributes") or {}).get("betaReviewState")
        print(f"beta review id {data['id']} state {state}")
        return state
    raise SystemExit("beta review was not submitted")


def main():
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    confirm_build()
    ensure_contact()
    add_to_group(public_group())
    state = submission()
    print(f"BETA REVIEW STATE {state}")
    print("DONE. Version 1.2 and build 30 were not changed. No App Store review was submitted.")


if __name__ == "__main__":
    main()
