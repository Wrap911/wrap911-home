#!/usr/bin/env python3
"""Create one ONGOING Analytics Reports request if none exists.

GET the app's requests first. POST exactly once, and only when the list is
empty. Does not create a ONE_TIME_SNAPSHOT and does not read Sales reports.
Does not print the API key.
"""
from __future__ import annotations

import json
import os
import re
import time

import jwt
import requests

APP_ID = "6816763473"
BASE = "https://api.appstoreconnect.apple.com"
LIST_PATH = f"/v1/apps/{APP_ID}/analyticsReportRequests?limit=50"
CREATE_PATH = "/v1/analyticsReportRequests"


def pem() -> str:
    raw = os.environ["RAW"]
    body = re.sub(r"-----(BEGIN|END) PRIVATE KEY-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    lines = [body[i : i + 64] for i in range(0, len(body), 64)]
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(lines) + "\n-----END PRIVATE KEY-----\n"


def token() -> str:
    now = int(time.time())
    encoded = jwt.encode(
        {"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 600, "aud": "appstoreconnect-v1"},
        pem(),
        algorithm="ES256",
        headers={"kid": os.environ["ASC_KEY_ID"]},
    )
    return encoded.decode() if isinstance(encoded, bytes) else encoded


def call(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    if method == "POST" and path != CREATE_PATH:
        raise SystemExit("refusing POST " + path)
    if method not in {"GET", "POST"}:
        raise SystemExit("refusing " + method)
    if method == "POST" and body:
        access = (((body.get("data") or {}).get("attributes") or {}).get("accessType"))
        app = ((((body.get("data") or {}).get("relationships") or {}).get("app") or {}).get("data") or {}).get("id")
        if access != "ONGOING" or app != APP_ID:
            raise SystemExit("refusing a request that is not the one ongoing app request")
    headers = {"Authorization": "Bearer " + token(), "Content-Type": "application/json"}
    response = requests.request(method, BASE + path if path.startswith("/") else path, headers=headers, json=body, timeout=90)
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:300]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} {method} {path.split('?')[0]} {json.dumps(payload)[:600]}")
    return response.status_code, payload


def pages(path: str) -> list[dict]:
    items: list[dict] = []
    status, payload = call("GET", path)
    if status >= 400:
        raise SystemExit("could not read " + path.split("?")[0])
    while status < 400 and isinstance(payload, dict):
        items.extend(payload.get("data") or [])
        nxt = (payload.get("links") or {}).get("next")
        if not nxt:
            break
        status, payload = call("GET", nxt)
    return items


def describe(row: dict) -> str:
    attrs = row.get("attributes") or {}
    bits = [f"id={row.get('id')}", f"accessType={attrs.get('accessType')}"]
    if "stoppedDueToInactivity" in attrs:
        bits.append(f"stoppedDueToInactivity={attrs.get('stoppedDueToInactivity')}")
    extra = sorted(set(attrs) - {"accessType", "stoppedDueToInactivity"})
    if extra:
        bits.append("attributes=" + ",".join(extra))
    return " ".join(bits)


def main() -> None:
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    existing = pages(LIST_PATH)
    print(f"existing requests: {len(existing)}")
    for row in existing:
        print("  " + describe(row))
    if existing:
        print("A request already exists. No new request was created.")
        chosen = existing[0]
    else:
        status, created = call(
            "POST",
            CREATE_PATH,
            {
                "data": {
                    "type": "analyticsReportRequests",
                    "attributes": {"accessType": "ONGOING"},
                    "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
                }
            },
        )
        if status not in (200, 201) or not (created.get("data") or {}).get("id"):
            raise SystemExit("the ongoing request was not created")
        chosen = created["data"]
        print("created " + describe(chosen))
    request_id = str(chosen.get("id") or "")
    status, fresh = call("GET", f"/v1/analyticsReportRequests/{request_id}")
    if status >= 400 or not fresh.get("data"):
        raise SystemExit("could not read the request back")
    print("confirmed " + describe(fresh["data"]))
    reports = pages(f"/v1/analyticsReportRequests/{request_id}/reports?limit=50")
    print(f"reports: {len(reports)}")
    instances = 0
    for report in reports:
        attrs = report.get("attributes") or {}
        print(f"  {attrs.get('category')} / {attrs.get('name')} id={report.get('id')}")
        rows = pages(f"/v1/analyticsReports/{report['id']}/instances?limit=20")
        instances += len(rows)
        if rows:
            for row in rows:
                iattrs = row.get("attributes") or {}
                print(f"    instance {iattrs.get('granularity')} {iattrs.get('processingDate')}")
    if instances == 0:
        print("No report instances yet. Apple typically takes 1–2 days to produce the first data.")
    else:
        print(f"report instances: {instances}")
    print("DONE. Sales reports were not requested. Nothing else was changed.")


if __name__ == "__main__":
    main()
