#!/usr/bin/env python3
"""Cancel the in-review submission for App Store version 1.2.

Patches review submission ceadddf8-544f-4184-b7df-214903396ff6 with
canceled=true, then waits until version 600c93dd-0a49-4a1a-9d7c-3c402dadc446
is editable. Does not contact Resolution Center, does not change screenshots,
prices, or the build attachment.
"""
from __future__ import annotations

import json
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
VERSION_ID = "600c93dd-0a49-4a1a-9d7c-3c402dadc446"
SUBMISSION_ID = "ceadddf8-544f-4184-b7df-214903396ff6"
BASE = "https://api.appstoreconnect.apple.com/v1/"
EDITABLE = {
    "PREPARE_FOR_SUBMISSION",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
    "INVALID_BINARY",
}
FORBIDDEN = (
    "customerReviews",
    "customerReviewResponses",
    "resolutionCenter",
    "appScreenshots",
    "appScreenshotSets",
    "inAppPurchasePriceSchedules",
)


def pem() -> str:
    raw = os.environ["RAW"]
    body = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    lines = [body[i : i + 64] for i in range(0, len(body), 64)]
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(lines) + "\n-----END PRIVATE KEY-----\n"


def token() -> str:
    now = int(time.time())
    encoded = jwt.encode(
        {"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1100, "aud": "appstoreconnect-v1"},
        pem(),
        algorithm="ES256",
        headers={"kid": os.environ["ASC_KEY_ID"]},
    )
    return encoded.decode() if isinstance(encoded, bytes) else encoded


def call(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    if method != "GET":
        for part in FORBIDDEN:
            if part in path:
                raise SystemExit("refusing " + method + " " + path)
        if method == "PATCH" and path.split("?", 1)[0].strip("/") != "reviewSubmissions/" + SUBMISSION_ID:
            raise SystemExit("refusing " + method + " " + path)
    headers = {"Authorization": "Bearer " + token()}
    if body is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(method, BASE + path.lstrip("/"), headers=headers, json=body, timeout=90)
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:400]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} {method} {path.split('?')[0]} {json.dumps(payload)[:700]}")
    return response.status_code, payload


def version_state() -> str:
    status, payload = call("GET", f"appStoreVersions/{VERSION_ID}")
    if status >= 400 or not payload.get("data"):
        raise SystemExit("could not read version 1.2")
    attrs = payload["data"].get("attributes") or {}
    state = str(attrs.get("appStoreState") or "")
    print(f"version {attrs.get('versionString')} {VERSION_ID} {state}", flush=True)
    return state


def main() -> None:
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    state = version_state()
    if state in EDITABLE:
        print("version 1.2 is already editable; submission was not changed")
        return
    status, payload = call("GET", f"reviewSubmissions/{SUBMISSION_ID}")
    if status >= 400:
        raise SystemExit("could not read the review submission")
    sub_state = str(((payload.get("data") or {}).get("attributes") or {}).get("state") or "")
    print(f"submission {SUBMISSION_ID} {sub_state}", flush=True)
    status, payload = call(
        "PATCH",
        f"reviewSubmissions/{SUBMISSION_ID}",
        {
            "data": {
                "type": "reviewSubmissions",
                "id": SUBMISSION_ID,
                "attributes": {"canceled": True},
            }
        },
    )
    new_state = str(((payload.get("data") or {}).get("attributes") or {}).get("state") or "")
    print(f"cancel -> {status} {new_state}", flush=True)
    if status >= 400:
        raise SystemExit("could not cancel the review submission")
    deadline = time.time() + 25 * 60
    while time.time() < deadline:
        state = version_state()
        if state in EDITABLE:
            print(f"EDITABLE {state}")
            print("Resolution Center was not contacted.")
            return
        time.sleep(20)
    raise SystemExit("version 1.2 did not become editable")


if __name__ == "__main__":
    main()
