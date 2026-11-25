#!/usr/bin/env python3
"""Resend Jen Lopez's App Store Connect invitation.

If she is already a user, add her to Wrap911 Test Team and stop. Otherwise
delete the pending invitation and create a new DEVELOPER invitation for the
WRAP 911 app only. Does not add a build, submit review, or print API keys.
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
KNOWN_INVITE = "eff0acb0-bb1f-4b60-8cfe-1c407c9b6762"
BANNED = (
    "betaAppReviewSubmissions",
    "reviewSubmissions",
    "reviewSubmissionItems",
    "appStoreVersionSubmissions",
    "appStoreVersions",
    "appStoreVersionLocalizations",
    "inAppPurchases",
    "customerReviews",
    "builds",
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
    clean = path.strip("/")
    if any(part in clean for part in BANNED):
        raise SystemExit("refusing " + path)
    if method == "DELETE" and not re.fullmatch(r"userInvitations/[0-9a-f-]{36}", clean):
        raise SystemExit("refusing DELETE " + path)
    if method == "POST" and clean not in {"userInvitations", "betaTesters"} and not clean.endswith("/relationships/betaTesters"):
        raise SystemExit("refusing POST " + path)
    if method not in ("GET", "POST", "DELETE"):
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
        print(f"HTTP {response.status_code} {method} {clean.split('?')[0]} {str(payload)[:500]}")
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
    status, rows = pages("users", {"filter[username]": EMAIL, "limit": 5, "fields[users]": "username,firstName,lastName,roles"})
    if status >= 400:
        print(f"users lookup HTTP {status}")
    for row in rows:
        attrs = row.get("attributes") or {}
        if same_email(attrs.get("username")) or same_email(attrs.get("email")):
            found.append(row)
    return found


def find_invitations():
    status, rows = pages(
        "userInvitations",
        {"filter[email]": EMAIL, "limit": 10, "fields[userInvitations]": "email,expirationDate,roles"},
    )
    if status >= 400:
        print(f"userInvitations HTTP {status}")
        return []
    invites = [row for row in rows if same_email((row.get("attributes") or {}).get("email"))]
    if not any(row.get("id") == KNOWN_INVITE for row in invites):
        status, payload = call("GET", f"userInvitations/{KNOWN_INVITE}")
        data = payload.get("data") or {}
        if status < 400 and data.get("id") and same_email((data.get("attributes") or {}).get("email")):
            invites.append(data)
    return invites


def internal_group():
    status, groups = pages(f"apps/{APP_ID}/betaGroups", {"limit": 50, "fields[betaGroups]": "name,isInternalGroup"})
    if status >= 400:
        raise SystemExit("could not list beta groups")
    named = [group for group in groups if (group.get("attributes") or {}).get("name") == GROUP_NAME]
    if len(named) != 1 or not (named[0].get("attributes") or {}).get("isInternalGroup"):
        raise SystemExit("Wrap911 Test Team was not found as an internal group")
    return named[0]["id"]


def add_tester(group_id):
    status, rows = pages("betaTesters", {"filter[email]": EMAIL, "limit": 10, "fields[betaTesters]": "email"})
    existing = [row for row in rows if same_email((row.get("attributes") or {}).get("email"))] if status < 400 else []
    if existing:
        tester_id = existing[0]["id"]
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
    print(f"create tester in {GROUP_NAME} -> {status} id {((payload.get('data') or {}).get('id')) or ''}")


def delete_invites(invites):
    for row in invites:
        invite_id = row.get("id")
        if not invite_id:
            continue
        status, _payload = call("DELETE", f"userInvitations/{invite_id}")
        print(f"delete invitation {invite_id} -> {status}")


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
    data = payload.get("data") or {}
    if status in (200, 201) and data.get("id"):
        attrs = data.get("attributes") or {}
        print(f"created invitation id {data['id']} expiration {attrs.get('expirationDate')} roles {attrs.get('roles')}")
        return
    raise SystemExit(f"a new invitation was not created (HTTP {status})")


def main():
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    users = find_users()
    print(f"user exists: {bool(users)}")
    for user in users:
        attrs = user.get("attributes") or {}
        print(f"user id {user.get('id')} roles {attrs.get('roles')}")
    if users:
        print("She is already a user. No invitation was deleted or sent.")
        add_tester(internal_group())
        print("DONE. No build was added. No review was submitted.")
        return
    invites = find_invitations()
    print(f"pending invitations: {len(invites)}")
    for row in invites:
        attrs = row.get("attributes") or {}
        print(f"pending id {row.get('id')} expiration {attrs.get('expirationDate')}")
    delete_invites(invites)
    create_invitation()
    print("DONE. No build was added. No review was submitted.")


if __name__ == "__main__":
    main()
