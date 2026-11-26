#!/usr/bin/env python3
"""Open TestFlight build 26 to the same internal group as builds 21-25.

Waits until build 26 is VALID, sets usesNonExemptEncryption false when that
matches builds 22 and 25, and writes the Problem Doctor test note. Stops if
the encryption flag does not match those builds. Does not create an App Store
version, submit for review, or edit purchases.
"""
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
BUILD = "26"
PREVIOUS = ("25", "22", "21")
WHAT_TO_TEST = (
    "Problem Doctor: take a photo or short clip of a vinyl problem, "
    "agree to the xAI consent, and read the diagnosis. Free users get 1 read a day."
)
BANNED = (
    "reviewSubmissions",
    "reviewSubmissionItems",
    "appStoreVersionSubmissions",
    "appStoreVersions",
    "appStoreVersionLocalizations",
    "inAppPurchases",
    "inAppPurchaseSubmissions",
    "subscriptionGroups",
    "buildUploads",
    "appInfos",
    "appPrivacy",
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
            "exp": int(time.time()) + 1100,
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
    if method not in ("GET", "PATCH", "POST"):
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
    while path and guard < 12:
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
            "fields[builds]": "version,uploadedDate,processingState,usesNonExemptEncryption,buildAudienceType",
        },
    )
    exact = [row for row in rows if str((row.get("attributes") or {}).get("version")) == version]
    return exact[0] if exact else None


def beta_detail(build_id):
    status, payload = call("GET", f"builds/{build_id}/buildBetaDetail")
    if status >= 400:
        return {}
    data = payload.get("data") or {}
    return data.get("attributes") or {}


def encryption_declaration(build_id):
    status, payload = call("GET", f"builds/{build_id}/appEncryptionDeclaration")
    if status >= 400:
        return None
    data = payload.get("data") or {}
    if not data.get("id"):
        return None
    attrs = data.get("attributes") or {}
    return {"id": data.get("id"), "exempt": attrs.get("exempt"), "state": attrs.get("appEncryptionDeclarationState")}


def groups():
    return pages(f"apps/{APP_ID}/betaGroups", {"limit": 50, "fields[betaGroups]": "name,isInternalGroup"})


def group_builds(group_id):
    return {row.get("id") for row in pages(f"betaGroups/{group_id}/relationships/builds", {"limit": 200}) if row.get("id")}


def group_testers(group_id):
    return pages(
        f"betaGroups/{group_id}/betaTesters",
        {"limit": 200, "fields[betaTesters]": "firstName,lastName,email"},
    )


def wait_for_build(seconds=110 * 60):
    deadline = time.time() + seconds
    while True:
        row = find_build(BUILD)
        state = ((row or {}).get("attributes") or {}).get("processingState")
        if row and state in ("VALID", "INVALID", "FAILED"):
            print(f"build {BUILD} processing {state} id {row['id']}")
            return row
        print(f"build {BUILD} " + (f"processing {state}" if row else "not uploaded yet"))
        if time.time() > deadline:
            return row
        time.sleep(30)


def reference_flags():
    flags = {}
    for version in PREVIOUS:
        row = find_build(version)
        if not row:
            print(f"build {version} not found")
            continue
        attrs = row.get("attributes") or {}
        flags[version] = {
            "id": row["id"],
            "processing": attrs.get("processingState"),
            "encryption": attrs.get("usesNonExemptEncryption"),
            "declaration": encryption_declaration(row["id"]),
        }
        print(f"build {version} processing {flags[version]['processing']} usesNonExemptEncryption {flags[version]['encryption']} declaration {flags[version]['declaration']}")
    return flags


def set_encryption_false(build_id):
    status, _payload = call(
        "PATCH",
        f"builds/{build_id}",
        body={"data": {"type": "builds", "id": build_id, "attributes": {"usesNonExemptEncryption": False}}},
    )
    print(f"set usesNonExemptEncryption false -> {status}")
    return status < 400


def shared_internal_groups(known):
    listed = groups()
    membership = {}
    chosen = []
    for group in listed:
        attrs = group.get("attributes") or {}
        if not attrs.get("isInternalGroup"):
            continue
        ids = group_builds(group["id"])
        membership[group["id"]] = ids
        present = [version for version, row in known.items() if row and row["id"] in ids]
        print(f"internal {attrs.get('name')}: builds {', '.join(present) or 'none of 21/22/25/26'}")
        if "25" in present and "22" in present:
            chosen.append(group)
    return chosen


def add_to_group(group, build_id):
    name = (group.get("attributes") or {}).get("name") or group["id"]
    status, _payload = call(
        "POST",
        f"betaGroups/{group['id']}/relationships/builds",
        body={"data": [{"type": "builds", "id": build_id}]},
    )
    print(f"add build {BUILD} to {name} -> {status}")
    return status in (204, 409)


def set_what_to_test(build_id):
    rows = pages(f"builds/{build_id}/betaBuildLocalizations", {"limit": 10})
    if not rows:
        status, payload = call(
            "POST",
            "betaBuildLocalizations",
            body={
                "data": {
                    "type": "betaBuildLocalizations",
                    "attributes": {"locale": "en-US", "whatsNew": WHAT_TO_TEST},
                    "relationships": {"build": {"data": {"type": "builds", "id": build_id}}},
                }
            },
        )
        print(f"create What to Test -> {status}")
        return status < 300
    target = rows[0]
    for row in rows:
        if (row.get("attributes") or {}).get("locale") == "en-US":
            target = row
            break
    current = (target.get("attributes") or {}).get("whatsNew") or ""
    if current.strip() == WHAT_TO_TEST:
        print(f"What to Test already set ({(target.get('attributes') or {}).get('locale')})")
        return True
    status, _payload = call(
        "PATCH",
        f"betaBuildLocalizations/{target['id']}",
        body={"data": {"type": "betaBuildLocalizations", "id": target["id"], "attributes": {"whatsNew": WHAT_TO_TEST}}},
    )
    print(f"set What to Test {(target.get('attributes') or {}).get('locale')} -> {status}")
    return status < 300


def report_testers(group):
    name = (group.get("attributes") or {}).get("name") or group["id"]
    people = group_testers(group["id"])
    print(f"testers in {name}: {len(people)}")
    gerardo = False
    for person in people:
        attrs = person.get("attributes") or {}
        first = attrs.get("firstName") or ""
        last = attrs.get("lastName") or ""
        email = attrs.get("email") or ""
        mark = ""
        blob = (first + " " + last + " " + email).lower()
        if "gerardo" in blob or "gerry" in blob or email.lower() == "info@wrap911.com":
            gerardo = True
            mark = " MATCH"
        print(f"  {first} {last} <{email}>{mark}")
    print(f"Gerardo listed: {gerardo}")
    return gerardo


def main():
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    flags = reference_flags()
    for version in ("25", "22"):
        if version not in flags:
            raise SystemExit(f"build {version} is missing, so encryption was not compared")
        if flags[version]["encryption"] is not False:
            raise SystemExit(f"build {version} usesNonExemptEncryption is {flags[version]['encryption']}, not false. Stopped.")
    row = wait_for_build()
    if not row or (row.get("attributes") or {}).get("processingState") != "VALID":
        raise SystemExit("build 26 did not become VALID")
    build_id = row["id"]
    flag = (row.get("attributes") or {}).get("usesNonExemptEncryption")
    declaration = encryption_declaration(build_id)
    print(f"build 26 usesNonExemptEncryption {flag} declaration {declaration}")
    ref_decl = flags["25"]["declaration"]
    if declaration and ref_decl and declaration.get("exempt") != ref_decl.get("exempt"):
        raise SystemExit("build 26 encryption declaration does not match build 25. Stopped.")
    if flag is True:
        raise SystemExit("build 26 usesNonExemptEncryption is true, unlike builds 22 and 25. Stopped.")
    if flag is None:
        if not set_encryption_false(build_id):
            raise SystemExit("could not set usesNonExemptEncryption false")
        time.sleep(5)
        fresh = find_build(BUILD)
        flag = ((fresh or {}).get("attributes") or {}).get("usesNonExemptEncryption")
        print(f"build 26 usesNonExemptEncryption after patch {flag}")
        if flag is not False:
            raise SystemExit("export compliance did not stick as false")
    known = {version: find_build(version) for version in ("21", "22", "25", "26")}
    chosen = shared_internal_groups(known)
    if not chosen:
        raise SystemExit("no internal group contains both builds 22 and 25")
    detail = beta_detail(build_id)
    print(f"beta internal {detail.get('internalBuildState')} external {detail.get('externalBuildState')}")
    for group in chosen:
        ids = group_builds(group["id"])
        name = (group.get("attributes") or {}).get("name")
        if build_id in ids:
            print(f"already in internal group {name}")
        else:
            add_to_group(group, build_id)
        report_testers(group)
    if not set_what_to_test(build_id):
        raise SystemExit("What to Test was not saved")
    final = find_build(BUILD)
    final_flag = ((final or {}).get("attributes") or {}).get("usesNonExemptEncryption")
    final_state = ((final or {}).get("attributes") or {}).get("processingState")
    print(f"DONE build 26 {build_id} processing {final_state} usesNonExemptEncryption {final_flag}")
    print("No App Store version was created. Version 1.2 was not changed.")


if __name__ == "__main__":
    main()
