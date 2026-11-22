#!/usr/bin/env python3
"""Read App Store sales and analytics for WRAP 911. GET only.

Does not create, change, or delete anything in App Store Connect.
Does not print the API key or the vendor number.
"""
from __future__ import annotations

import csv
import gzip
import io
import json
import os
import re
import time
from collections import defaultdict
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import jwt
import requests

APP_ID = "6816763473"
BASE = "https://api.appstoreconnect.apple.com"
LAUNCH = date(2026, 11, 21)
APP_APPLE_IDS = {APP_ID}
IAP_IDS = {
    "com.wrap911.trainer.seat.12mo": "6820187854",
    "com.wrap911.trainer.pack.12mo": "6820187730",
    "com.wrap911.trainer.pass.7d": "6837827637",
}
KNOWN_NUMBERS = set(APP_APPLE_IDS) | set(IAP_IDS.values())
UPDATE_TYPES = {"7", "7F", "7T", "F7"}
PRODUCT_LABELS = {
    "1": "iOS app download",
    "1F": "free iOS app download",
    "1T": "iOS app download",
    "3": "iPad app download",
    "7": "iOS app update",
    "7F": "free iOS app update",
    "7T": "iOS app update",
    "F1": "free iOS app download",
    "F7": "free iOS app update",
    "IA1": "in-app purchase",
    "IA9": "in-app subscription",
    "IAY": "auto-renewable subscription",
}


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


def redact(text: str) -> str:
    cleaned = re.sub(r"(vendorNumber(?:=|%3D))[0-9]+", r"\1[redacted]", text, flags=re.I)
    cleaned = re.sub(r"(vendor(?:\s+number)?\s*[:=]\s*)[0-9]+", r"\1[redacted]", cleaned, flags=re.I)

    def hide(match: re.Match[str]) -> str:
        number = match.group(0)
        if number in KNOWN_NUMBERS:
            return number
        return "[redacted]"

    return re.sub(r"\b\d{6,12}\b", hide, cleaned)


def get(url: str, params: dict | None = None, accept: str | None = None, raw: bool = False):
    if not url.startswith("https://"):
        raise SystemExit("refusing non-https GET")
    headers = {"Authorization": "Bearer " + token()}
    if accept:
        headers["Accept"] = accept
    response = requests.get(url, headers=headers, params=params, timeout=120)
    if raw:
        return response.status_code, response.content, response.headers.get("Content-Type", "")
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:300]}
    if response.status_code >= 400:
        print(f"HTTP {response.status_code} GET {url.split('?')[0]} {redact(json.dumps(payload)[:500])}")
    return response.status_code, payload


def vendor_number() -> str:
    for name in ("ASC_VENDOR_NUMBER", "APPLE_VENDOR_NUMBER", "VENDOR_NUMBER"):
        value = (os.environ.get(name) or "").strip()
        if value and re.fullmatch(r"\d{4,12}", value):
            return value
    return ""


def pacific_today() -> date:
    return datetime.now(ZoneInfo("America/Los_Angeles")).date()


def gunzip(blob: bytes) -> str:
    if blob[:2] == b"\x1f\x8b":
        blob = gzip.decompress(blob)
    return blob.decode("utf-8", errors="replace")


def money(value: str) -> float:
    try:
        return float(value or 0)
    except ValueError:
        return 0.0


def sales_rows(vendor: str, day: date) -> tuple[str, list[dict]]:
    status, blob, _ctype = get(
        BASE + "/v1/salesReports",
        params={
            "filter[frequency]": "DAILY",
            "filter[reportType]": "SALES",
            "filter[reportSubType]": "SUMMARY",
            "filter[version]": "1_1",
            "filter[vendorNumber]": vendor,
            "filter[reportDate]": day.isoformat(),
        },
        accept="application/a-gzip",
        raw=True,
    )
    if status == 404 or status == 410:
        return "not-ready", []
    if status >= 400:
        return f"http-{status}", []
    text = gunzip(blob).lstrip("\ufeff")
    if not text.strip():
        return "empty", []
    reader = csv.DictReader(io.StringIO(text), delimiter="\t")
    return "ok", list(reader)


def classify(row: dict) -> tuple[str, str]:
    sku = (row.get("SKU") or row.get("Title") or "").strip()
    apple = (row.get("Apple Identifier") or "").strip()
    kind = (row.get("Product Type Identifier") or "").strip()
    label = PRODUCT_LABELS.get(kind, kind or "unknown")
    for product_id, apple_id in IAP_IDS.items():
        if sku == product_id or apple == apple_id or product_id in sku:
            return "iap", product_id
    if apple in APP_APPLE_IDS or sku.lower() in {"wrap911-ios", "wrap911"}:
        if kind in UPDATE_TYPES or "update" in label:
            return "update", "app"
        return "download", "app"
    if kind.upper().startswith("IA"):
        return "iap", sku or apple or kind
    if kind in UPDATE_TYPES:
        return "update", sku or "app"
    return "other", sku or kind or "unknown"


def sales_report(vendor: str) -> None:
    if not vendor:
        print("SALES: no vendor-number secret is set.")
        print("Looked for ASC_VENDOR_NUMBER, APPLE_VENDOR_NUMBER, and VENDOR_NUMBER.")
        print("Sales and Trends was not requested.")
        return
    end = pacific_today()
    print(f"SALES: daily SUMMARY 1_1 from {LAUNCH.isoformat()} through {end.isoformat()} (Pacific dates)")
    day = LAUNCH
    totals: dict[tuple, dict] = defaultdict(lambda: {"units": 0, "proceeds": defaultdict(float)})
    any_ok = False
    while day <= end:
        state, rows = sales_rows(vendor, day)
        print(f"  {day.isoformat()} {state} rows={len(rows)}", flush=True)
        if state == "ok":
            any_ok = True
        for row in rows:
            bucket, sku = classify(row)
            units = int(float(row.get("Units") or 0))
            currency = (row.get("Currency of Proceeds") or row.get("Customer Currency") or "").strip() or "unknown"
            proceeds = money(row.get("Developer Proceeds")) * units
            kind = (row.get("Product Type Identifier") or "").strip()
            key = (day.isoformat(), bucket, sku, kind, currency)
            totals[key]["units"] += units
            totals[key]["proceeds"][currency] += proceeds
        day += timedelta(days=1)
    if not any_ok:
        print("SALES: no daily report was available yet. A 404 means Apple has not published that Pacific day.")
        print("Daily reports usually appear the next morning, Pacific time.")
        return
    print("SALES BREAKOUT (units, extended developer proceeds)")
    for key in sorted(totals):
        day_s, bucket, sku, kind, currency = key
        units = totals[key]["units"]
        proceeds = totals[key]["proceeds"][currency]
        label = PRODUCT_LABELS.get(kind, kind)
        print(f"  {day_s} {bucket} {sku} type={kind} ({label}) units={units} proceeds={proceeds:.2f} {currency}")


def pages(path: str) -> tuple[int, list[dict]]:
    items: list[dict] = []
    status, payload = get(BASE + path if path.startswith("/") else path)
    if isinstance(payload, dict) and status >= 400:
        return status, items
    while isinstance(payload, dict) and status < 400:
        items.extend(payload.get("data") or [])
        nxt = (payload.get("links") or {}).get("next")
        if not nxt:
            break
        status, payload = get(nxt)
    return 200, items


def instance_date(attrs: dict) -> str:
    return str(attrs.get("processingDate") or attrs.get("granularity") or "")


def summarize_table(text: str, report_name: str) -> None:
    reader = csv.DictReader(io.StringIO(text), delimiter="\t")
    fields = reader.fieldnames or []
    print(f"    columns: {', '.join(fields[:18])}")
    date_key = next((name for name in fields if name.lower() == "date"), None)
    count_key = next((name for name in fields if name.lower() in {"counts", "units"}), None)
    event_key = next((name for name in fields if name.lower() in {"event", "download type", "engagement type"}), None)
    if not date_key or not count_key:
        print("    no Date/Counts columns; skipped the rollup")
        return
    rolled: dict[tuple[str, str], int] = defaultdict(int)
    for row in reader:
        day = (row.get(date_key) or "")[:10]
        if not day or day < LAUNCH.isoformat():
            continue
        label = (row.get(event_key) or "total").strip() if event_key else "total"
        try:
            count = int(float(row.get(count_key) or 0))
        except ValueError:
            count = 0
        rolled[(day, label)] += count
    if not rolled:
        print(f"    {report_name}: no rows on or after {LAUNCH.isoformat()}")
        return
    print(f"    {report_name} since {LAUNCH.isoformat()}")
    for key in sorted(rolled):
        print(f"      {key[0]} {key[1]} {rolled[key]}")


def download_segment(url: str) -> str:
    response = requests.get(url, timeout=120)
    if response.status_code >= 400:
        print(f"    segment HTTP {response.status_code}")
        return ""
    return gunzip(response.content)


def analytics() -> None:
    print("ANALYTICS: listing report requests")
    status, requests_rows = pages(f"/v1/apps/{APP_ID}/analyticsReportRequests?limit=20")
    if status >= 400:
        print(f"ANALYTICS: could not list report requests (HTTP {status}).")
        return
    useful = []
    for row in requests_rows:
        attrs = row.get("attributes") or {}
        access = str(attrs.get("accessType") or "")
        print(f"  request {row.get('id')} accessType={access}")
        if access in {"ONGOING", "ONE_TIME_SNAPSHOT"}:
            useful.append(row)
    if not useful:
        print("ANALYTICS: no ONGOING or ONE_TIME_SNAPSHOT request exists.")
        print("One has to be created first. That needs Gerardo's OK.")
        print("Apple typically takes 1–2 days to produce the first data after a request is created.")
        return
    wanted = ("discovery and engagement", "app units", "app downloads")
    for request in useful:
        status, reports = pages(f"/v1/analyticsReportRequests/{request['id']}/reports?limit=50")
        if status >= 400:
            print(f"  reports HTTP {status}")
            continue
        for report in reports:
            attrs = report.get("attributes") or {}
            name = str(attrs.get("name") or "")
            category = str(attrs.get("category") or "")
            folded = name.casefold()
            if not any(part in folded for part in wanted):
                print(f"  skip {category} / {name}")
                continue
            print(f"  report {category} / {name}")
            status, instances = pages(f"/v1/analyticsReports/{report['id']}/instances?limit=50")
            if status >= 400:
                print(f"    instances HTTP {status}")
                continue
            daily = []
            for instance in instances:
                iattrs = instance.get("attributes") or {}
                if str(iattrs.get("granularity") or "") not in {"DAILY", ""}:
                    continue
                daily.append(instance)
            if not daily:
                print("    no daily instances")
                continue
            daily.sort(key=lambda item: instance_date(item.get("attributes") or {}))
            for instance in daily:
                iattrs = instance.get("attributes") or {}
                print(f"    instance {instance_date(iattrs)} {iattrs.get('granularity')}")
                status, segments = pages(f"/v1/analyticsReportInstances/{instance['id']}/segments?limit=20")
                if status >= 400:
                    print(f"    segments HTTP {status}")
                    continue
                for segment in segments:
                    url = str((segment.get("attributes") or {}).get("url") or "")
                    if not url:
                        continue
                    text = download_segment(url)
                    if text:
                        summarize_table(text, name)


def main() -> None:
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    print("READ ONLY. No App Store Connect resource was created or changed.")
    sales_report(vendor_number())
    print("---")
    analytics()
    print("DONE. Nothing was changed in App Store Connect.")


if __name__ == "__main__":
    main()
