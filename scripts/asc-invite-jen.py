#!/usr/bin/env python3
"""Invite Jen Lopez to App Store Connect, or add her if she already joined.

Creates one DEVELOPER invitation for the WRAP 911 app only. If that email
already belongs to a user, adds her to the internal group Wrap911 Test Team.
Skips a second invitation when one is already open. Does not add a build,
does not submit review, and does not print API keys.
"""
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
EMAIL = "jen.lopez0220@gmail.com"
FIRST = "Jen"
LAST = "Lopez"
GROUP_NAME = "Wrap911 Test Team"
BANNED = (
    "betaAppReviewSubmissions",
    "reviewSubmissions",
    "reviewSubmissionItems",
    "appStoreVersionSubmissions",
    "appStoreVersions",
    "appStoreVersionLocalizations",
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
    if any(part in path for part in BANNED):
        raise SystemExit("refusing " + path)
    if "relationships/builds" in path or (method != "GET" and path.rstrip("/").endswith("/builds")):
        raise SystemExit("refusing to add a build")
    allowed_post = {"userInvitations", "betaTesters"}
    clean = path.strip("/")
    if method == "POST" and clean not in allowed_post and not clean.endswith("/relationships/betaTesters"):
        raise SystemExit("refusing POST " + path)
    if method == "PATCH":
        raise SystemExit("refusing PATCH " + path)
    if method not in ("GET", "POST"):
        raise SystemExit("refusing " + method)
    headers = {"Authorization": "Bearer " + token()}
    if body is not None:
        headers["Content-Type"] = "application/json"
        blob = str(body)
        if '"builds"' in blob or "'builds'" in blob:
            raise SystemExit("refusing a body that names builds")
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
        print(f"HTTP {response.status_code} {method} {path.split('?')[0]} {str(payload)[:500]}")
    return response.status_code, payload


def pages(path, params=None):
    items = []
    query = dict(params or {})
    guard = 0
    while path and guard < 6:
        guard += 1
        status, payload = call("GET", path, params=query)
        if status >= 400:
            return status, items
        items.extend(payload.get("data") or [])
        nxt = ((payload.get("links") or {}).get("next")) or ""
        if "api.appstoreconnect.apple.com/v1/" in nxt:
            path = nxt.split("/v1/", 1)[1]
            query = None
        else:
            path = None
    return 200, items


def same_email(value):
    return str(value or "").strip().lower() == EMAIL


def find_users():
    found = []
    for key in ("username", "email"):
        status, rows = pages("users", {"filter[" + key + "]": EMAIL, "limit": 5, "fields[users]": "username,firstName,lastName,roles"})
        if status >= 400:
            print(f"users filter {key} HTTP {status}")
            continue
        for row in rows:
            attrs = row.get("attributes") or {}
            if same_email(attrs.get("username")) or same_email(attrs.get("email")):
                found.append(row)
    deduped = []
    seen = set()
    for row in found:
        if row.get("id") in seen:
            continue
        seen.add(row.get("id"))
        deduped.append(row)
    return deduped


def find_invitations():
    status, rows = pages(
        "userInvitations",
        {"filter[email]": EMAIL, "limit": 10, "fields[userInvitations]": "email,firstName,lastName,roles,expirationDate,allAppsVisible,provisioningAllowed"},
    )
    if status >= 400:
        print(f"userInvitations HTTP {status}")
        return []
    return [row for row in rows if same_email((row.get("attributes") or {}).get("email"))]


def print_invitation(row, prefix):
    attrs = row.get("attributes") or {}
    print(f"{prefix} id {row.get('id')} expiration {attrs.get('expirationDate')} roles {attrs.get('roles')}")


def internal_group():
    status, groups = pages(
        f"apps/{APP_ID}/betaGroups",
        {"limit": 50, "fields[betaGroups]": "name,isInternalGroup"},
    )
    if status >= 400:
        raise SystemExit("could not list beta groups")
    named = [group for group in groups if (group.get("attributes") or {}).get("name") == GROUP_NAME]
    if len(named) != 1:
        raise SystemExit(f"expected one group named {GROUP_NAME}, found {len(named)}")
    attrs = named[0].get("attributes") or {}
    if not attrs.get("isInternalGroup"):
        raise SystemExit("Wrap911 Test Team is not an internal group")
    return named[0]["id"]


def tester_in_group(group_id, tester_id):
    status, rows = pages(f"betaGroups/{group_id}/betaTesters", {"limit": 200, "fields[betaTesters]": "email,firstName,lastName"})
    if status >= 400:
        return False
    return any(row.get("id") == tester_id or same_email((row.get("attributes") or {}).get("email")) for row in rows)


def find_testers():
    status, rows = pages("betaTesters", {"filter[email]": EMAIL, "limit": 10, "fields[betaTesters]": "email,firstName,lastName"})
    if status >= 400:
        print(f"betaTesters HTTP {status}")
        return []
    return [row for row in rows if same_email((row.get("attributes") or {}).get("email"))]


def add_tester(group_id):
    existing = find_testers()
    if existing:
        tester_id = existing[0]["id"]
        if tester_in_group(group_id, tester_id):
            print(f"already in {GROUP_NAME} tester {tester_id}")
            return
        status, _payload = call(
            "POST",
            f"betaGroups/{group_id}/relationships/betaTesters",
            body={"data": [{"type": "betaTesters", "id": tester_id}]},
        )
        print(f"add existing tester {tester_id} to {GROUP_NAME} -> {status}")
        return
    status, payload = call(
        "POST",
        "betaTesters",
        body={
            "data": {
                "type": "betaTesters",
                "attributes": {"email": EMAIL, "firstName": FIRST, "lastName": LAST},
                "relationships": {"betaGroups": {"data": [{"type": "betaGroups", "id": group_id}]}},
            }
        },
    )
    tester_id = ((payload.get("data") or {}).get("id")) or ""
    print(f"create tester in {GROUP_NAME} -> {status} id {tester_id}")


def create_invitation():
    status, payload = call(
        "POST",
        "userInvitations",
        body={
            "data": {
                "type": "userInvitations",
                "attributes": {
                    "email": EMAIL,
                    "firstName": FIRST,
                    "lastName": LAST,
                    "roles": ["DEVELOPER"],
                    "allAppsVisible": False,
                    "provisioningAllowed": False,
                },
                "relationships": {"visibleApps": {"data": [{"type": "apps", "id": APP_ID}]}},
            }
        },
    )
    if status in (200, 201) and (payload.get("data") or {}).get("id"):
        print_invitation(payload["data"], "created invitation")
        return
    print(f"invitation was not created (HTTP {status})")
    again = find_invitations()
    for row in again:
        print_invitation(row, "existing invitation after create")


def main():
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    users = find_users()
    invites = find_invitations()
    print(f"user exists: {bool(users)}")
    for user in users:
        attrs = user.get("attributes") or {}
        print(f"user id {user.get('id')} roles {attrs.get('roles')}")
    print(f"invitation exists: {bool(invites)}")
    for invite in invites:
        print_invitation(invite, "invitation")
    if users:
        print("She is already a user. No new invitation was sent.")
        add_tester(internal_group())
    elif invites:
        print("An invitation is already open. No second invitation was sent.")
    else:
        create_invitation()
    print("DONE. No build was added. No review was submitted.")


if __name__ == "__main__":
    main()
