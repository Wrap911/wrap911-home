#!/usr/bin/env python3
"""Read TestFlight beta review status for WRAP 911 build 32. GET only.

Does not create a submission, change groups, or edit the review contact.
Does not print API keys.
"""
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
BUILD_ID = "6d13e2f5-112d-4150-bbf6-29ed4304dd9b"
GROUP_NAME = "WRAP 911 Public Testers"


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


def get(path, params=None):
    if path.startswith("http") and not path.startswith("https://api.appstoreconnect.apple.com/"):
        raise SystemExit("refusing non-ASC GET")
    response = requests.get(
        "https://api.appstoreconnect.apple.com/v1/" + path.lstrip("/"),
        headers={"Authorization": "Bearer " + token()},
        params=params,
        timeout=90,
    )
    try:
        payload = response.json() if response.content else {}
    except ValueError:
        payload = {"raw": response.text[:300]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} GET {path.split('?')[0]} {str(payload)[:400]}")
    return response.status_code, payload


def pages(path, params=None):
    items = []
    query = dict(params or {})
    guard = 0
    while path and guard < 6:
        guard += 1
        status, payload = get(path, query)
        if status >= 400:
            return items
        items.extend(payload.get("data") or [])
        nxt = ((payload.get("links") or {}).get("next")) or ""
        if "api.appstoreconnect.apple.com/v1/" in nxt:
            path = nxt.split("/v1/", 1)[1]
            query = None
        else:
            path = None
    return items


def public_attrs(attrs):
    hidden = {"demoAccountPassword", "demoAccountName"}
    return {key: value for key, value in (attrs or {}).items() if key not in hidden and "token" not in key.lower() and "secret" not in key.lower()}


def main():
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    print("READ ONLY. No App Store Connect resource will be created or changed.")
    status, payload = get(f"builds/{BUILD_ID}", {"fields[builds]": "version,processingState,uploadedDate,expired"})
    if status >= 400:
        raise SystemExit("could not read build 32")
    attrs = (payload.get("data") or {}).get("attributes") or {}
    print(f"build id {BUILD_ID} number {attrs.get('version')} processing {attrs.get('processingState')} expired {attrs.get('expired')}")
    train_status, train = get(f"builds/{BUILD_ID}/preReleaseVersion")
    version = ((train.get("data") or {}).get("attributes") or {}).get("version") if train_status < 400 else "error"
    print(f"marketing version {version}")
    detail_status, detail = get(f"builds/{BUILD_ID}/buildBetaDetail")
    beta = ((detail.get("data") or {}).get("attributes") or {}) if detail_status < 400 else {}
    print(f"internalBuildState {beta.get('internalBuildState')}")
    print(f"externalBuildState {beta.get('externalBuildState')}")
    sub_status, submission = get(f"builds/{BUILD_ID}/betaAppReviewSubmission")
    data = submission.get("data") or {}
    if sub_status >= 400 or not data.get("id"):
        print(f"beta review submission: none (HTTP {sub_status})")
        state = None
    else:
        sub_attrs = data.get("attributes") or {}
        state = sub_attrs.get("betaReviewState")
        print(f"beta review id {data.get('id')} state {state} submitted {sub_attrs.get('submittedDate')}")
        extra = public_attrs(sub_attrs)
        print("beta review attributes " + str(extra))
        if state == "REJECTED":
            reason = sub_attrs.get("rejectionReason") or sub_attrs.get("reviewNote") or sub_attrs.get("notes")
            print("rejection reason " + (str(reason) if reason else "Apple did not return a rejection note on this GET"))
    groups = pages(f"apps/{APP_ID}/betaGroups", {"limit": 50, "fields[betaGroups]": "name,isInternalGroup,publicLinkEnabled,publicLinkLimit,publicLink"})
    named = [row for row in groups if (row.get("attributes") or {}).get("name") == GROUP_NAME]
    if not named:
        print("external group WRAP 911 Public Testers was not listed")
    else:
        group = named[0]
        gattrs = group.get("attributes") or {}
        print(f"group {gattrs.get('name')} internal {gattrs.get('isInternalGroup')} publicLinkEnabled {gattrs.get('publicLinkEnabled')} limit {gattrs.get('publicLinkLimit')}")
        print("publicLink " + str(gattrs.get("publicLink") or ""))
        members = pages(f"betaGroups/{group['id']}/relationships/builds", {"limit": 200})
        present = BUILD_ID in {row.get("id") for row in members}
        print(f"build 32 in public group: {present}")
    print("DONE. Nothing was changed in App Store Connect.")


if __name__ == "__main__":
    main()
