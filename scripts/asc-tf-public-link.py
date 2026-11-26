#!/usr/bin/env python3
"""Create or reuse the WRAP 911 public TestFlight group.

Lists 1.3 builds and beta groups, then ensures an external group named
"WRAP 911 Public Testers" has a public link capped at 100 people.
Does not add a build to any group, does not submit beta review, and does
not change version 1.2 or App Review. Does not print API keys.
"""
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
GROUP_NAME = "WRAP 911 Public Testers"
LINK_ATTRS = {
    "publicLinkEnabled": True,
    "publicLinkLimitEnabled": True,
    "publicLinkLimit": 100,
}
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
    if method != "GET" and "relationships/builds" in path:
        raise SystemExit("refusing to add a build to a group")
    if method == "POST" and path.strip("/") != "betaGroups":
        raise SystemExit("refusing POST " + path)
    if method == "PATCH" and not re.fullmatch(r"betaGroups/[^/]+", path.strip("/")):
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
        print(f"HTTP {response.status_code} {method} {path.split('?')[0]} {str(payload)[:500]}")
    return response.status_code, payload


def pages(path, params=None):
    items = []
    query = dict(params or {})
    guard = 0
    while path and guard < 8:
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


def list_version_builds():
    status, versions = pages(
        "preReleaseVersions",
        {"filter[app]": APP_ID, "filter[version]": "1.3", "limit": 5, "fields[preReleaseVersions]": "version,platform"},
    )
    if status >= 400:
        print(f"could not list version 1.3 (HTTP {status})")
        return
    trains = [row for row in versions if (row.get("attributes") or {}).get("version") == "1.3"]
    print(f"version 1.3 trains: {len(trains)}")
    if not trains:
        print("no 1.3 pre-release train was returned")
        return
    for train in trains:
        print(f"train {train['id']} version {(train.get('attributes') or {}).get('version')}")
        status, builds = pages(
            f"preReleaseVersions/{train['id']}/builds",
            {"limit": 50, "fields[builds]": "version,processingState,uploadedDate"},
        )
        if status >= 400:
            print(f"  builds HTTP {status}")
            continue
        print(f"  builds {len(builds)}")
        for build in builds:
            attrs = build.get("attributes") or {}
            detail_status, detail = call("GET", f"builds/{build['id']}/buildBetaDetail")
            beta = ((detail.get("data") or {}).get("attributes") or {}) if detail_status < 400 else {}
            print(
                "  build {version} id {bid} processing {proc} external {ext}".format(
                    version=attrs.get("version"),
                    bid=build.get("id"),
                    proc=attrs.get("processingState"),
                    ext=beta.get("externalBuildState"),
                )
            )


def list_groups():
    status, groups = pages(
        f"apps/{APP_ID}/betaGroups",
        {
            "limit": 50,
            "fields[betaGroups]": "name,isInternalGroup,publicLinkEnabled,publicLinkLimitEnabled,publicLinkLimit,publicLink",
        },
    )
    if status >= 400:
        raise SystemExit(f"could not list beta groups (HTTP {status})")
    print(f"beta groups: {len(groups)}")
    for group in groups:
        attrs = group.get("attributes") or {}
        kind = "internal" if attrs.get("isInternalGroup") else "external"
        print(f"  {kind} {attrs.get('name')} id {group.get('id')} publicLinkEnabled {attrs.get('publicLinkEnabled')}")
    return groups


def settings_match(attrs):
    return all(attrs.get(key) == value for key, value in LINK_ATTRS.items())


def ensure_group(groups):
    named = [group for group in groups if (group.get("attributes") or {}).get("name") == GROUP_NAME]
    if len(named) > 1:
        raise SystemExit("more than one group is named " + GROUP_NAME)
    if named:
        group = named[0]
        attrs = group.get("attributes") or {}
        if attrs.get("isInternalGroup"):
            raise SystemExit("the named group is internal, so it was not changed")
        print("reusing external group " + group["id"])
        if settings_match(attrs):
            return group["id"]
        status, payload = call(
            "PATCH",
            f"betaGroups/{group['id']}",
            body={"data": {"type": "betaGroups", "id": group["id"], "attributes": dict(LINK_ATTRS)}},
        )
        if status >= 400:
            raise SystemExit("could not update the public link settings")
        return ((payload.get("data") or {}).get("id")) or group["id"]
    status, payload = call(
        "POST",
        "betaGroups",
        body={
            "data": {
                "type": "betaGroups",
                "attributes": {"name": GROUP_NAME, "isInternalGroup": False, **LINK_ATTRS},
                "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
            }
        },
    )
    if status not in (200, 201) or not (payload.get("data") or {}).get("id"):
        raise SystemExit("the public tester group was not created")
    print("created external group " + payload["data"]["id"])
    return payload["data"]["id"]


def print_link(group_id):
    status, payload = call(
        "GET",
        f"betaGroups/{group_id}",
        params={"fields[betaGroups]": "name,isInternalGroup,publicLinkEnabled,publicLinkLimitEnabled,publicLinkLimit,publicLink"},
    )
    if status >= 400:
        raise SystemExit("could not read the public tester group")
    attrs = (payload.get("data") or {}).get("attributes") or {}
    print(f"group {attrs.get('name')} internal {attrs.get('isInternalGroup')}")
    print(f"publicLinkEnabled {attrs.get('publicLinkEnabled')} limit {attrs.get('publicLinkLimit')} limitEnabled {attrs.get('publicLinkLimitEnabled')}")
    print("publicLink " + str(attrs.get("publicLink") or ""))


def print_review_contact():
    status, payload = call("GET", f"apps/{APP_ID}/betaAppReviewDetail")
    if status >= 400:
        print(f"betaAppReviewDetail HTTP {status}")
        return
    attrs = (payload.get("data") or {}).get("attributes") or {}
    for key in ("contactFirstName", "contactLastName", "contactPhone", "contactEmail"):
        print(f"betaAppReviewDetail {key} {attrs.get(key) or ''}")


def main():
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    print("Listing version 1.3 builds. No build will be added to a group.")
    list_version_builds()
    groups = list_groups()
    group_id = ensure_group(groups)
    print_link(group_id)
    print_review_contact()
    print("DONE. No build was added. No beta review was submitted. Version 1.2 was not changed.")


if __name__ == "__main__":
    main()
