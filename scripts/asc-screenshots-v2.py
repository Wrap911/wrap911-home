#!/usr/bin/env python3
"""Upload the reviewed v2 App Store screenshots to the editable app version.

Never edits a version that is READY_FOR_SALE / in review. Creates the next
version (default 1.2) only if no editable version exists. Does NOT attach a
build and does NOT submit for review.
"""
import glob, hashlib, json, os, re, sys, time
import jwt, requests

APP_ID = "6816763473"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW_VERSION = os.environ.get("NEW_VERSION", "1.2")
SETS = (
    ("APP_IPHONE_67", "appstore/screenshots-v2/iphone-6.9", (1320, 2868)),
    ("APP_IPAD_PRO_3GEN_129", "appstore/screenshots-v2/ipad-13", (2064, 2752)),
)
EDITABLE = ("PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY")
BASE = "https://api.appstoreconnect.apple.com/v1/"


def pem():
    b = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", os.environ["RAW"])
    b = re.sub(r"[^A-Za-z0-9+/=]", "", b)
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(b[i:i + 64] for i in range(0, len(b), 64)) + "\n-----END PRIVATE KEY-----\n"


def token():
    now = int(time.time())
    return jwt.encode({"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1100, "aud": "appstoreconnect-v1"},
                      pem(), algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"]})


def call(method, path, params=None, body=None, quiet=False):
    r = requests.request(method, path if path.startswith("http") else BASE + path.lstrip("/"),
                         headers={"Authorization": "Bearer " + token()}, params=params, json=body, timeout=60)
    try:
        j = r.json() if r.content else {}
    except ValueError:
        j = {}
    if r.status_code >= 400 and not quiet:
        print(f"HTTP {r.status_code} {method} {path} {json.dumps(j.get('errors', ''))[:600]}")
    return r.status_code, j


def pages(path, params=None):
    out = []
    st, j = call("GET", path, params)
    while st < 400 and j:
        out += j.get("data", [])
        n = (j.get("links") or {}).get("next")
        if not n:
            break
        st, j = call("GET", n)
    return out


def versions():
    return pages(f"apps/{APP_ID}/appStoreVersions", {"limit": 20})


def png_size(p):
    d = open(p, "rb").read(24)
    return int.from_bytes(d[16:20], "big"), int.from_bytes(d[20:24], "big")


def pick_or_create():
    vs = versions()
    for v in vs:
        print("VERSION", v["attributes"]["versionString"], v["id"], v["attributes"]["appStoreState"], v["attributes"].get("platform"))
    ed = [v for v in vs if v["attributes"]["appStoreState"] in EDITABLE and v["attributes"].get("platform") == "IOS"]
    if ed:
        v = ed[0]
        print("USING existing editable version", v["attributes"]["versionString"], v["id"], v["attributes"]["appStoreState"])
        return v
    busy = [v for v in vs if v["attributes"]["appStoreState"] in ("WAITING_FOR_REVIEW", "IN_REVIEW", "PENDING_DEVELOPER_RELEASE", "PENDING_APPLE_RELEASE", "PROCESSING_FOR_APP_STORE")]
    if busy:
        raise SystemExit("a version is in review/pending; refusing to touch: " + str([(b['attributes']['versionString'], b['attributes']['appStoreState']) for b in busy]))
    print("No editable version; creating", NEW_VERSION)
    st, j = call("POST", "appStoreVersions", body={"data": {"type": "appStoreVersions",
        "attributes": {"platform": "IOS", "versionString": NEW_VERSION},
        "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}}}})
    if st >= 400:
        time.sleep(5)
        ed = [v for v in versions() if v["attributes"]["appStoreState"] in EDITABLE]
        if ed:
            print("Another editable version appeared; using it")
            return ed[0]
        raise SystemExit("could not create version")
    v = j["data"]
    print("CREATED version", NEW_VERSION, v["id"], v["attributes"]["appStoreState"])
    return v


def ensure_set(loc, display):
    for s in pages(f"appStoreVersionLocalizations/{loc}/appScreenshotSets", {"limit": 50}):
        if s["attributes"]["screenshotDisplayType"] == display:
            return s["id"]
    st, j = call("POST", "appScreenshotSets", body={"data": {"type": "appScreenshotSets",
        "attributes": {"screenshotDisplayType": display},
        "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": loc}}}}})
    if st >= 400:
        raise SystemExit("could not create set " + display)
    return j["data"]["id"]


def upload(set_id, path):
    data = open(path, "rb").read()
    name = os.path.basename(path)
    st, j = call("POST", "appScreenshots", body={"data": {"type": "appScreenshots",
        "attributes": {"fileName": name, "fileSize": len(data)},
        "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}}}})
    if st >= 400:
        raise SystemExit("reserve failed " + name)
    sid = j["data"]["id"]
    for op in j["data"]["attributes"]["uploadOperations"]:
        h = {x["name"]: x["value"] for x in op["requestHeaders"]}
        chunk = data[op["offset"]:op["offset"] + op["length"]]
        r = requests.request(op["method"], op["url"], headers=h, data=chunk, timeout=120)
        if r.status_code >= 400:
            raise SystemExit(f"chunk upload failed {name} {r.status_code}")
    st, _ = call("PATCH", f"appScreenshots/{sid}", body={"data": {"type": "appScreenshots", "id": sid,
        "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(data).hexdigest()}}})
    if st >= 400:
        raise SystemExit("commit failed " + name)
    return sid


def wait_complete(sid):
    state = None
    for _ in range(60):
        st, j = call("GET", f"appScreenshots/{sid}")
        a = (j.get("data") or {}).get("attributes", {})
        state = (a.get("assetDeliveryState") or {}).get("state")
        if state in ("COMPLETE", "FAILED"):
            if state == "FAILED":
                print("FAILED detail", json.dumps(a.get("assetDeliveryState"))[:500])
            return state
        time.sleep(3)
    return state


def main():
    files = {}
    for display, rel, size in SETS:
        fs = sorted(glob.glob(os.path.join(ROOT, rel, "*.png")))
        assert len(fs) == 6, (rel, len(fs))
        for f in fs:
            assert png_size(f) == size, (f, png_size(f))
        files[display] = fs
    print("files OK")
    ver = pick_or_create()
    st = ver["attributes"]["appStoreState"]
    assert st in EDITABLE, st
    locs = pages(f"appStoreVersions/{ver['id']}/appStoreVersionLocalizations")
    if not locs:
        raise SystemExit("version has no localizations")
    bad = False
    for loc in locs:
        print("LOCALIZATION", loc["attributes"]["locale"], loc["id"])
        for display, fs in files.items():
            sid = ensure_set(loc["id"], display)
            for old in pages(f"appScreenshotSets/{sid}/appScreenshots", {"limit": 20}):
                call("DELETE", f"appScreenshots/{old['id']}")
            ids = []
            for f in fs:
                shot = upload(sid, f)
                ids.append(shot)
            # keep order = file order
            call("PATCH", f"appScreenshotSets/{sid}/relationships/appScreenshots",
                 body={"data": [{"type": "appScreenshots", "id": i} for i in ids]})
            states = [wait_complete(i) for i in ids]
            print(f"SET {display} {sid} uploaded {len(ids)} states {states}")
            bad |= any(s != "COMPLETE" for s in states)
    print("== FINAL")
    ver2 = [v for v in versions() if v["id"] == ver["id"]][0]
    print("VERSION", ver2["attributes"]["versionString"], ver2["id"], ver2["attributes"]["appStoreState"])
    for loc in locs:
        for s in pages(f"appStoreVersionLocalizations/{loc['id']}/appScreenshotSets", {"limit": 50}):
            shots = pages(f"appScreenshotSets/{s['id']}/appScreenshots", {"limit": 20})
            print(loc["attributes"]["locale"], s["attributes"]["screenshotDisplayType"], s["id"], len(shots),
                  [(x["attributes"]["fileName"], (x["attributes"].get("assetDeliveryState") or {}).get("state")) for x in shots])
    if bad:
        sys.exit(1)


if __name__ == "__main__":
    main()
