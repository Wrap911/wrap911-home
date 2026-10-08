#!/usr/bin/env python3
"""Compare TestFlight builds 11 and 13, then give 13 the same internal access as 11.

Sets export compliance only to match build 11, and adds build 13 to the internal
beta groups (and individual testers) that already have build 11. Does not submit
for review and does not change in-app purchases.
"""
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
VERSIONS = ("11", "13")
BANNED = (
    "reviewSubmissions",
    "reviewSubmissionItems",
    "appStoreVersionSubmissions",
    "inAppPurchaseSubmissions",
    "inAppPurchases",
    "subscriptionGroups",
    "buildUploads",
    "appStoreVersions",
)

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
    if any(part in path for part in BANNED):
        raise SystemExit("refusing " + path)
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
    while path and guard < 10:
        guard += 1
        status, payload = call("GET", path, params=query)
        if status >= 400:
            return items
        items.extend(payload.get("data") or [])
        next_url = ((payload.get("links") or {}).get("next")) or ""
        if "api.appstoreconnect.apple.com/v1/" in next_url:
            path = next_url.split("/v1/", 1)[1]
            query = None
        else:
            path = None
    return items


def find_build(version):
    rows = pages(
        "builds",
        {
            "filter[app]": APP_ID,
            "filter[version]": version,
            "sort": "-uploadedDate",
            "limit": 5,
            "fields[builds]": "version,uploadedDate,expirationDate,expired,processingState,usesNonExemptEncryption,buildAudienceType",
        },
    )
    exact = [row for row in rows if str((row.get("attributes") or {}).get("version")) == version]
    return exact[0] if exact else None


def beta_detail(build_id):
    status, payload = call("GET", f"builds/{build_id}/buildBetaDetail")
    if status >= 400:
        return {}
    data = payload.get("data") or {}
    return {"id": data.get("id"), **(data.get("attributes") or {})}


def app_groups():
    return pages(
        f"apps/{APP_ID}/betaGroups",
        {"limit": 50, "fields[betaGroups]": "name,isInternalGroup"},
    )


def group_build_ids(group_id):
    rows = pages(f"betaGroups/{group_id}/relationships/builds", {"limit": 200})
    return {row.get("id") for row in rows if row.get("id")}


def testers(build_id):
    return pages(
        f"builds/{build_id}/individualTesters",
        {"limit": 200, "fields[betaTesters]": "email"},
    )


def encryption_declaration(build_id):
    status, payload = call("GET", f"builds/{build_id}/appEncryptionDeclaration")
    if status == 404:
        return None
    data = payload.get("data") or {}
    if not data.get("id"):
        return None
    return {"id": data.get("id"), **(data.get("attributes") or {})}


def describe(label, row):
    attrs = row.get("attributes") or {}
    detail = beta_detail(row["id"])
    tester_rows = testers(row["id"])
    declaration = encryption_declaration(row["id"])
    group_rows = []
    for group in app_groups():
        if row["id"] in group_build_ids(group["id"]):
            group_rows.append(group)
    internal = [g for g in group_rows if (g.get("attributes") or {}).get("isInternalGroup")]
    external = [g for g in group_rows if not (g.get("attributes") or {}).get("isInternalGroup")]
    status, release = call("GET", f"builds/{row['id']}/preReleaseVersion")
    release_version = ((release.get("data") or {}).get("attributes") or {}).get("version") if status < 400 else "error"
    print(f"== {label} ==")
    print(f"id {row['id']}")
    print(f"train {release_version}")
    print(f"version {attrs.get('version')} processing {attrs.get('processingState')} expired {attrs.get('expired')}")
    print(f"uploaded {attrs.get('uploadedDate')} expiration {attrs.get('expirationDate')} audience {attrs.get('buildAudienceType')}")
    print(f"usesNonExemptEncryption {attrs.get('usesNonExemptEncryption')}")
    print(
        "beta internal {internal} external {external} autoNotify {notify}".format(
            internal=detail.get("internalBuildState"),
            external=detail.get("externalBuildState"),
            notify=detail.get("autoNotifyEnabled"),
        )
    )
    print("internal groups " + ", ".join(sorted((g.get("attributes") or {}).get("name") or g["id"] for g in internal)) or "(none)")
    print("external groups " + ", ".join(sorted((g.get("attributes") or {}).get("name") or g["id"] for g in external)) or "(none)")
    print(f"individual testers {len(tester_rows)}")
    if declaration:
        kept = {k: declaration.get(k) for k in ("id", "appEncryptionDeclarationState", "availableOnFrenchStore", "codeValue", "exempt")}
        print("encryption declaration " + str({k: v for k, v in kept.items() if v is not None}))
    else:
        print("encryption declaration none")
    return {
        "row": row,
        "attrs": attrs,
        "detail": detail,
        "internal": internal,
        "external": external,
        "testers": tester_rows,
        "declaration": declaration,
    }


def patch_encryption(build_id, value):
    status, payload = call(
        "PATCH",
        f"builds/{build_id}",
        body={"data": {"type": "builds", "id": build_id, "attributes": {"usesNonExemptEncryption": value}}},
    )
    print(f"set usesNonExemptEncryption {value} -> {status}")
    return status < 400


def add_to_group(group_id, build_id, name):
    status, _payload = call(
        "POST",
        f"betaGroups/{group_id}/relationships/builds",
        body={"data": [{"type": "builds", "id": build_id}]},
    )
    print(f"add to internal group {name} -> {status}")
    return status in (204, 409)


def add_testers(build_id, tester_ids):
    if not tester_ids:
        return
    status, _payload = call(
        "POST",
        f"builds/{build_id}/relationships/individualTesters",
        body={"data": [{"type": "betaTesters", "id": tester_id} for tester_id in tester_ids]},
    )
    print(f"add {len(tester_ids)} individual testers -> {status}")


def main():
    found = {}
    for version in VERSIONS:
        row = find_build(version)
        if not row:
            print(f"build {version} not found")
            continue
        found[version] = row
    build11 = (found.get("11") or {}).get("id")
    build13 = (found.get("13") or {}).get("id")
    print("GROUPS")
    listed = app_groups()
    if not listed:
        print("no beta groups returned")
    membership = {}
    for group in listed:
        attrs = group.get("attributes") or {}
        kind = "internal" if attrs.get("isInternalGroup") else "external"
        ids = group_build_ids(group["id"])
        membership[group["id"]] = ids
        has11 = build11 in ids if build11 else False
        has13 = build13 in ids if build13 else False
        print(f"{kind} {attrs.get('name') or group['id']}: builds={len(ids)} build11={has11} build13={has13}")
    print("BEFORE")
    described = {}
    for version, row in found.items():
        described[version] = describe(f"build {version}", row)
    if "13" not in described:
        raise SystemExit("build 13 was not found")
    current = described["13"]
    previous = described.get("11")
    print("ACTIONS")
    changed = False
    build_id = current["row"]["id"]
    flag = current["attrs"].get("usesNonExemptEncryption")
    previous_flag = previous["attrs"].get("usesNonExemptEncryption") if previous else None
    state = current["detail"].get("internalBuildState")
    if flag is None and previous_flag is False:
        changed = patch_encryption(build_id, False) or changed
    elif flag is None and state == "MISSING_EXPORT_COMPLIANCE" and previous and previous["detail"].get("internalBuildState") in (
        "READY_FOR_BETA_TESTING",
        "IN_BETA_TESTING",
    ):
        print("build 11 is already available to testers and did not record a true encryption flag; marking 13 exempt")
        changed = patch_encryption(build_id, False) or changed
    elif flag is not None and previous_flag is not None and flag != previous_flag and state == "MISSING_EXPORT_COMPLIANCE":
        print(f"build 13 encryption flag {flag} does not match build 11 {previous_flag}")
        changed = patch_encryption(build_id, previous_flag) or changed
    else:
        print(f"encryption left unchanged (13={flag}, 11={previous_flag}, state={state})")

    if previous and previous["declaration"] and not current["declaration"]:
        declaration_id = previous["declaration"]["id"]
        status, _payload = call(
            "PATCH",
            f"builds/{build_id}",
            body={
                "data": {
                    "type": "builds",
                    "id": build_id,
                    "relationships": {
                        "appEncryptionDeclaration": {"data": {"type": "appEncryptionDeclarations", "id": declaration_id}}
                    },
                }
            },
        )
        print(f"copy encryption declaration -> {status}")
        changed = True

    if previous:
        have = {group["id"] for group in current["internal"]}
        for group in previous["internal"]:
            if group["id"] in have:
                print(f"already in internal group {(group.get('attributes') or {}).get('name')}")
                continue
            add_to_group(group["id"], build_id, (group.get("attributes") or {}).get("name") or group["id"])
            changed = True
        if previous["external"]:
            print("skipped external groups: " + ", ".join((g.get("attributes") or {}).get("name") or g["id"] for g in previous["external"]))
        have_testers = {tester["id"] for tester in current["testers"]}
        missing = [tester["id"] for tester in previous["testers"] if tester["id"] not in have_testers]
        if missing:
            add_testers(build_id, missing)
            changed = True
        else:
            print(f"individual testers already match ({len(have_testers)})")

    if changed:
        time.sleep(8)
    print("AFTER")
    row = find_build("13")
    if row:
        describe("build 13", row)


if __name__ == "__main__":
    main()
