#!/usr/bin/env python3
"""Delete every screenshot in the iPhone 6.5" set and leave that set empty.

6.7" screenshots are already uploaded, so 6.5" is optional. This does not
upload a replacement, attach a build, change the version string, or submit
for review.
"""
import os
import re
import time

import jwt
import requests

SET_ID = "9fc4d69b-3820-479f-8b96-7f970e9ca367"
VERSION_ID = "ad69dc48-d34b-45e6-bd4a-41e4ec9f1ecd"
DISPLAY = "APP_IPHONE_65"


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


def call(method, path, params=None):
    if method == "GET":
        allowed = True
    elif method == "DELETE" and re.fullmatch(r"appScreenshots/[0-9a-fA-F-]{36}", path):
        allowed = True
    else:
        allowed = False
    if not allowed:
        raise SystemExit("refusing " + method + " " + path)
    response = requests.request(
        method,
        "https://api.appstoreconnect.apple.com/v1/" + path.lstrip("/"),
        headers={"Authorization": "Bearer " + token()},
        params=params,
        timeout=60,
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
            raise SystemExit("could not list " + path)
        items.extend(payload.get("data") or [])
        next_url = ((payload.get("links") or {}).get("next")) or ""
        if "api.appstoreconnect.apple.com/v1/" in next_url:
            path = next_url.split("/v1/", 1)[1]
            query = None
        else:
            path = None
    return items


def snapshot(label):
    status, version = call("GET", f"appStoreVersions/{VERSION_ID}")
    if status >= 400:
        raise SystemExit("could not read the App Store version")
    attrs = (version.get("data") or {}).get("attributes") or {}
    build_status, build = call("GET", f"appStoreVersions/{VERSION_ID}/build")
    build_row = (build.get("data") or {}) if build_status < 400 else {}
    build_attrs = build_row.get("attributes") or {}
    set_status, shot_set = call("GET", f"appScreenshotSets/{SET_ID}")
    if set_status >= 400:
        raise SystemExit("could not read the 6.5 inch screenshot set")
    set_attrs = (shot_set.get("data") or {}).get("attributes") or {}
    shots = pages(f"appScreenshotSets/{SET_ID}/appScreenshots", {"limit": 20})
    summary = {
        "state": attrs.get("appStoreState"),
        "versionString": attrs.get("versionString"),
        "buildId": build_row.get("id"),
        "buildVersion": build_attrs.get("version"),
        "display": set_attrs.get("screenshotDisplayType"),
        "shots": [
            {
                "id": row.get("id"),
                "state": (row.get("attributes") or {}).get("assetDeliveryState", {}).get("state")
                if isinstance((row.get("attributes") or {}).get("assetDeliveryState"), dict)
                else (row.get("attributes") or {}).get("assetDeliveryState"),
            }
            for row in shots
        ],
    }
    print(
        label,
        "state", summary["state"],
        "version", summary["versionString"],
        "build", summary["buildVersion"],
        summary["buildId"],
        "display", summary["display"],
        "shots", len(summary["shots"]),
    )
    for shot in summary["shots"]:
        print(" screenshot", shot["id"], shot["state"])
    return summary


def main():
    before = snapshot("before")
    if before["display"] != DISPLAY:
        raise SystemExit("set is " + str(before["display"]) + ", expected " + DISPLAY)
    if before["versionString"] != "1.1":
        raise SystemExit("version string changed before this script ran")
    for shot in before["shots"]:
        status, _payload = call("DELETE", f"appScreenshots/{shot['id']}")
        print(f"deleted {shot['id']} -> {status}")
        if status not in (204, 404):
            raise SystemExit("could not delete " + shot["id"])
    after = snapshot("after")
    if after["versionString"] != before["versionString"] or after["buildId"] != before["buildId"]:
        raise SystemExit("version string or attached build changed")
    if after["buildVersion"] != before["buildVersion"]:
        raise SystemExit("attached build number changed")
    if after["state"] != before["state"]:
        raise SystemExit("version state changed from " + str(before["state"]) + " to " + str(after["state"]))
    if after["shots"]:
        raise SystemExit("6.5 inch set still has screenshots")
    print("APP_IPHONE_65", SET_ID, "empty; build", after["buildVersion"], "left attached; not submitted")


if __name__ == "__main__":
    main()
