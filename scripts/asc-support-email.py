#!/usr/bin/env python3
"""Point App Store review contact email at info@wrap911.com.

Updates the review contact only when it is the personal iCloud address.
Does not submit for review, attach a build, or change a login.
"""
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
PERSONAL = "djavoo1975@icloud.com"
PUBLIC = "info@wrap911.com"
PATCHABLE = re.compile(r"^(appStoreReviewDetails|betaAppReviewDetails)/[0-9a-fA-F-]{36}$")


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


def call(method, path, params=None, body=None):
    if method == "GET":
        allowed = True
    elif method == "PATCH" and PATCHABLE.match(path):
        attrs = ((body or {}).get("data") or {}).get("attributes") or {}
        allowed = set(attrs) == {"contactEmail"} and attrs.get("contactEmail") == PUBLIC
    else:
        allowed = False
    if not allowed:
        raise SystemExit("refusing " + method + " " + path)
    headers = {"Authorization": "Bearer " + token()}
    if body is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(
        method,
        "https://api.appstoreconnect.apple.com/v1/" + path.lstrip("/"),
        headers=headers,
        params=params,
        json=body,
        timeout=60,
    )
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:300]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} {method} {path} {str(payload)[:400]}")
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


def show_email(label, resource):
    attrs = (resource or {}).get("attributes") or {}
    email = attrs.get("contactEmail") or ""
    print(label, resource.get("id") if resource else None, "contactEmail", email or "(empty)")
    return email


def patch_email(resource_type, resource):
    email = ((resource or {}).get("attributes") or {}).get("contactEmail") or ""
    if email.lower() != PERSONAL:
        print("left", resource_type, "unchanged")
        return
    status, payload = call(
        "PATCH",
        f"{resource_type}/{resource['id']}",
        body={
            "data": {
                "type": resource_type,
                "id": resource["id"],
                "attributes": {"contactEmail": PUBLIC},
            }
        },
    )
    after = (((payload.get("data") or {}).get("attributes") or {}).get("contactEmail")) if status < 400 else ""
    print(f"patched {resource_type} {resource['id']} -> {status} {after or ''}")
    if status >= 400 or (after and after.lower() != PUBLIC):
        raise SystemExit("contact email was not updated")


def main():
    versions = pages(f"apps/{APP_ID}/appStoreVersions", {"limit": 10})
    if not versions:
        raise SystemExit("no app store versions")
    for version in versions:
        attrs = version.get("attributes") or {}
        print("version", version["id"], attrs.get("versionString"), attrs.get("appStoreState"))
        status, detail = call("GET", f"appStoreVersions/{version['id']}/appStoreReviewDetail")
        if status >= 400 or not (detail.get("data") or {}).get("id"):
            print("review detail unavailable", status)
            continue
        show_email("review", detail["data"])
        patch_email("appStoreReviewDetails", detail["data"])
        locs = pages(
            f"appStoreVersions/{version['id']}/appStoreVersionLocalizations",
            {"limit": 10, "fields[appStoreVersionLocalizations]": "locale,supportUrl"},
        )
        for loc in locs:
            loc_attrs = loc.get("attributes") or {}
            print("supportUrl", loc_attrs.get("locale"), loc_attrs.get("supportUrl") or "(empty)")
    status, beta = call("GET", f"apps/{APP_ID}/betaAppReviewDetail")
    if status < 400 and (beta.get("data") or {}).get("id"):
        show_email("beta review", beta["data"])
        patch_email("betaAppReviewDetails", beta["data"])
    else:
        print("beta review detail", status)
    print("support contact check finished; not submitted")


if __name__ == "__main__":
    main()
