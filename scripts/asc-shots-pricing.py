#!/usr/bin/env python3
"""Replace only the slot-06 pricing screenshot on version 1.2.

Keeps 01-home through 05-practice-rivet in that order. Does not create a
version, does not attach a build, and does not submit for review.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from pathlib import Path

import jwt
import requests

APP_ID = "6816763473"
VERSION_ID = "600c93dd-0a49-4a1a-9d7c-3c402dadc446"
BASE = "https://api.appstoreconnect.apple.com/v1/"
ROOT = Path(__file__).resolve().parents[1]
EDITABLE = {
    "PREPARE_FOR_SUBMISSION",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
    "INVALID_BINARY",
}
ORDER = (
    "01-home",
    "02-lesson-rivet-mastery",
    "03-workflow-box-truck",
    "04-photos",
    "05-practice-rivet",
    "06-pricing",
)
SETS = (
    {
        "display": "APP_IPHONE_67",
        "id_prefix": "c0de0523",
        "path": ROOT / "appstore/screenshots-v2/iphone-6.9/06-pricing.png",
        "pixels": (1320, 2868),
    },
    {
        "display": "APP_IPAD_PRO_3GEN_129",
        "id_prefix": "b16f9bc9",
        "path": ROOT / "appstore/screenshots-v2/ipad-13/06-pricing.png",
        "pixels": (2064, 2752),
    },
)


def pem() -> str:
    raw = os.environ["RAW"]
    body = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(body[i : i + 64] for i in range(0, len(body), 64)) + "\n-----END PRIVATE KEY-----\n"


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
    headers = {"Authorization": "Bearer " + token()}
    if body is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(method, path if path.startswith("http") else BASE + path.lstrip("/"), headers=headers, json=body, timeout=120)
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} {method} {path.split('?')[0]} {json.dumps(payload.get('errors', payload))[:600]}")
    return response.status_code, payload


def pages(path: str) -> list[dict]:
    items: list[dict] = []
    status, payload = call("GET", path)
    while status < 400 and payload:
        items.extend(payload.get("data") or [])
        nxt = (payload.get("links") or {}).get("next")
        if not nxt:
            break
        status, payload = call("GET", nxt)
    return items


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()[:24]
    return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")


def wait_editable() -> None:
    deadline = time.time() + 20 * 60
    while time.time() < deadline:
        status, payload = call("GET", f"appStoreVersions/{VERSION_ID}")
        if status >= 400:
            raise SystemExit("could not read version 1.2")
        state = ((payload.get("data") or {}).get("attributes") or {}).get("appStoreState")
        print(f"version 1.2 {state}", flush=True)
        if state in EDITABLE:
            return
        time.sleep(20)
    raise SystemExit("version 1.2 is not editable")


def shot_name(row: dict) -> str:
    return str((row.get("attributes") or {}).get("fileName") or "")


def upload(set_id: str, path: Path) -> str:
    data = path.read_bytes()
    status, payload = call(
        "POST",
        "appScreenshots",
        {
            "data": {
                "type": "appScreenshots",
                "attributes": {"fileName": path.name, "fileSize": len(data)},
                "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}},
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not reserve " + path.name)
    shot_id = payload["data"]["id"]
    for operation in (payload["data"].get("attributes") or {}).get("uploadOperations") or []:
        headers = {item["name"]: item["value"] for item in operation.get("requestHeaders") or []}
        chunk = data[int(operation["offset"]) : int(operation["offset"]) + int(operation["length"])]
        response = requests.request(operation.get("method") or "PUT", operation["url"], headers=headers, data=chunk, timeout=180)
        if response.status_code >= 400:
            raise SystemExit(f"upload failed {path.name} {response.status_code}")
    status, _payload = call(
        "PATCH",
        f"appScreenshots/{shot_id}",
        {
            "data": {
                "type": "appScreenshots",
                "id": shot_id,
                "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(data).hexdigest()},
            }
        },
    )
    if status >= 400:
        raise SystemExit("could not commit " + path.name)
    return shot_id


def wait_complete(shot_id: str) -> str:
    state = ""
    for _ in range(40):
        status, payload = call("GET", f"appScreenshots/{shot_id}")
        delivery = (((payload.get("data") or {}).get("attributes") or {}).get("assetDeliveryState") or {})
        state = str(delivery.get("state") or "")
        print(f"screenshot {shot_id} {state}", flush=True)
        if state in ("COMPLETE", "FAILED"):
            if state == "FAILED":
                print(json.dumps(delivery)[:400])
            return state
        time.sleep(3)
    return state


def replace_slot(spec: dict, set_id: str) -> list[str]:
    rows = pages(f"appScreenshotSets/{set_id}/appScreenshots?limit=20")
    by_prefix: dict[str, dict] = {}
    for row in rows:
        name = shot_name(row)
        for prefix in ORDER:
            if name.startswith(prefix):
                by_prefix[prefix] = row
                break
    print("before", set_id, [shot_name(row) for row in rows])
    kept = []
    for prefix in ORDER[:-1]:
        row = by_prefix.get(prefix)
        if not row:
            raise SystemExit(f"{spec['display']} is missing {prefix}")
        kept.append(row["id"])
    old = by_prefix.get("06-pricing")
    if old:
        status, _payload = call("DELETE", f"appScreenshots/{old['id']}")
        print(f"deleted previous 06-pricing {old['id']} -> {status}")
        if status not in (200, 202, 204, 404):
            raise SystemExit("could not delete the previous pricing screenshot")
    new_id = upload(set_id, spec["path"])
    ordered = kept + [new_id]
    status, _payload = call(
        "PATCH",
        f"appScreenshotSets/{set_id}/relationships/appScreenshots",
        {"data": [{"type": "appScreenshots", "id": shot_id} for shot_id in ordered]},
    )
    print(f"order {set_id} -> {status}")
    if wait_complete(new_id) != "COMPLETE":
        raise SystemExit("pricing screenshot did not finish processing")
    final = pages(f"appScreenshotSets/{set_id}/appScreenshots?limit=20")
    names = [shot_name(row) for row in final]
    print("after", spec["display"], set_id, names)
    return names


def find_sets() -> dict[str, str]:
    locs = pages(f"appStoreVersions/{VERSION_ID}/appStoreVersionLocalizations?limit=10")
    found: dict[str, str] = {}
    for loc in locs:
        if (loc.get("attributes") or {}).get("locale") != "en-US":
            continue
        for row in pages(f"appStoreVersionLocalizations/{loc['id']}/appScreenshotSets?limit=20"):
            display = (row.get("attributes") or {}).get("screenshotDisplayType") or ""
            print(f"set {display} {row['id']}")
            for spec in SETS:
                if display == spec["display"] or str(row["id"]).startswith(spec["id_prefix"]):
                    found[spec["display"]] = row["id"]
    return found


def main() -> None:
    for spec in SETS:
        size = png_size(spec["path"])
        if size != spec["pixels"]:
            raise SystemExit(f"{spec['path'].name} is {size}, wanted {spec['pixels']}")
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    wait_editable()
    found = find_sets()
    summary = {}
    for spec in SETS:
        set_id = found.get(spec["display"])
        if not set_id:
            raise SystemExit("missing screenshot set " + spec["display"])
        summary[spec["display"]] = {"id": set_id, "files": replace_slot(spec, set_id)}
    print("SUMMARY")
    print(json.dumps(summary, indent=2))
    for spec in SETS:
        names = summary[spec["display"]]["files"]
        if len(names) != 6 or not any(name.startswith("06-pricing") for name in names):
            raise SystemExit(spec["display"] + " does not have 6 shots with 06-pricing")


if __name__ == "__main__":
    main()
