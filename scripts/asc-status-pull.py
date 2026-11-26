#!/usr/bin/env python3
"""Read WRAP 911 version, sales, and analytics. GET only, plus one allowed POST.

The only write is POST /v1/analyticsReportRequests with accessType ONGOING,
and only when the app has no analytics report request. It does not submit
review, edit versions, or change purchases. It does not print the API key
or the vendor number.
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
VERSION_ID = "e5861b53-2ce6-482d-95e0-39ce3e46ea77"
SUBMISSION_ID = "b3484c79-17fd-4984-a38e-8fb2e934a38f"
BUILD_33 = "f3395f8e-cdea-4fca-8ff8-f5f886cff186"
BUILD_32 = "6d13e2f5-112d-4150-bbf6-29ed4304dd9b"
BASE = "https://api.appstoreconnect.apple.com"
LAUNCH = date(2026, 11, 13)
PT = ZoneInfo("America/Los_Angeles")
ET = ZoneInfo("America/New_York")
KNOWN_NUMBERS = {APP_ID, "6820187854", "6820187730", "6837827637"}
FIRST_TYPES = {"1", "1F", "1T", "F1", "1E", "1EP", "1EU"}
REDOWNLOAD_TYPES = {"3", "3F"}
UPDATE_TYPES = {"7", "7F", "7T", "F7"}
IAP = {
    "com.wrap911.trainer.seat.12mo": ("Seat", "6820187854"),
    "com.wrap911.trainer.pack.12mo": ("Shop Pack", "6820187730"),
    "com.wrap911.trainer.pass.7d": ("7-Day Pass", "6837827637"),
}
APP_SKUS = {"com.wrap911.trainer", "wrap911", "wrap911-ios"}


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

    def hide(match: re.Match[str]) -> str:
        number = match.group(0)
        return number if number in KNOWN_NUMBERS else "[redacted]"

    return re.sub(r"\b\d{6,12}\b", hide, cleaned)


def vendor_number() -> str:
    for name in ("ASC_VENDOR_NUMBER", "APPLE_VENDOR_NUMBER", "VENDOR_NUMBER"):
        value = (os.environ.get(name) or "").strip()
        if value and re.fullmatch(r"\d{4,12}", value):
            return value
    return ""


def call(method: str, path: str, params: dict | None = None, body: dict | None = None, accept: str | None = None, raw: bool = False, quiet: bool = False):
    if method not in {"GET", "POST"}:
        raise SystemExit("refusing " + method)
    if method == "POST" and path != "/v1/analyticsReportRequests":
        raise SystemExit("refusing POST " + path)
    url = path if path.startswith("http") else BASE + path
    if not url.startswith("https://api.appstoreconnect.apple.com/"):
        raise SystemExit("refusing non-ASC request")
    headers = {"Authorization": "Bearer " + token()}
    if accept:
        headers["Accept"] = accept
    if body is not None:
        headers["Content-Type"] = "application/json"
    response = requests.request(method, url, headers=headers, params=params, json=body, timeout=120)
    if raw:
        if response.status_code >= 400 and not quiet:
            print(f"HTTP {response.status_code} {method} {url.split('?')[0]} {redact(response.text[:400])}")
        return response.status_code, response.content
    if response.status_code == 204 or not response.content:
        return response.status_code, {}
    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text[:300]}
    if response.status_code >= 400 and not quiet:
        print(f"HTTP {response.status_code} {method} {url.split('?')[0]} {redact(json.dumps(payload)[:500])}")
    return response.status_code, payload


def pages(path: str) -> tuple[int, list[dict]]:
    items: list[dict] = []
    status, payload = call("GET", path, quiet=True)
    if not isinstance(payload, dict) or status >= 400:
        return status, items
    while isinstance(payload, dict) and status < 400:
        items.extend(payload.get("data") or [])
        nxt = (payload.get("links") or {}).get("next")
        if not nxt:
            break
        status, payload = call("GET", nxt, quiet=True)
    return 200, items


def et(value: str) -> str:
    if not value:
        return "not available"
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return value
    return parsed.astimezone(ET).strftime("%Y-%m-%d %I:%M %p ET") + " (raw " + value + ")"


def date_attrs(attrs: dict) -> str:
    bits = []
    for key, value in sorted(attrs.items()):
        if value and "date" in key.lower():
            bits.append(f"{key}={et(str(value))}")
    return "; ".join(bits) if bits else "no date fields"


def version_status() -> None:
    print("VERSION timezone=America/New_York for converted timestamps")
    status, payload = call("GET", f"/v1/appStoreVersions/{VERSION_ID}")
    if status >= 400 or not payload.get("data"):
        print(f"VERSION 1.3 appStoreState=not available (HTTP {status})")
        return
    attrs = payload["data"].get("attributes") or {}
    print(f"VERSION 1.3 id={VERSION_ID} versionString={attrs.get('versionString')} appStoreState={attrs.get('appStoreState') or 'not available'}")
    print("VERSION dates " + date_attrs(attrs))
    status, build = call("GET", f"/v1/appStoreVersions/{VERSION_ID}/build", quiet=True)
    data = (build.get("data") or {}) if status < 400 else {}
    battrs = data.get("attributes") or {}
    print(f"VERSION build id={data.get('id') or 'not available'} number={battrs.get('version') or 'not available'}")
    status, submission = call("GET", f"/v1/reviewSubmissions/{SUBMISSION_ID}")
    if status >= 400 or not submission.get("data"):
        print(f"SUBMISSION {SUBMISSION_ID} state=not available (HTTP {status})")
    else:
        sattrs = submission["data"].get("attributes") or {}
        print(f"SUBMISSION {SUBMISSION_ID} state={sattrs.get('state') or 'not available'} submitted={et(str(sattrs.get('submittedDate') or ''))}")
        print("SUBMISSION dates " + date_attrs(sattrs))
    status, beta = call("GET", f"/v1/builds/{BUILD_32}/betaAppReviewSubmission", quiet=True)
    data = beta.get("data") or {}
    if status >= 400 or not data:
        print(f"BETA32 state=not available (HTTP {status})")
        return
    battrs = data.get("attributes") or {}
    state = battrs.get("betaReviewState") or "not available"
    print(f"BETA32 id={BUILD_32} state={state} submitted={et(str(battrs.get('submittedDate') or ''))}")
    if state == "REJECTED":
        reason = battrs.get("rejectionReason") or battrs.get("reviewNote") or battrs.get("notes")
        print("BETA32 rejection " + (redact(str(reason)) if reason else "not available"))


def gunzip(blob: bytes) -> str:
    if blob[:2] == b"\x1f\x8b":
        blob = gzip.decompress(blob)
    return blob.decode("utf-8", errors="replace")


def sales_file(vendor: str, frequency: str, report_date: str) -> tuple[str, list[dict]]:
    last = "not available"
    for version in ("1_1", "1_0"):
        status, blob = call(
            "GET",
            "/v1/salesReports",
            params={
                "filter[frequency]": frequency,
                "filter[reportType]": "SALES",
                "filter[reportSubType]": "SUMMARY",
                "filter[version]": version,
                "filter[vendorNumber]": vendor,
                "filter[reportDate]": report_date,
            },
            accept="application/a-gzip",
            raw=True,
            quiet=True,
        )
        if status in (404, 410):
            return "not returned", []
        if status >= 400:
            last = f"http-{status}"
            continue
        text = gunzip(blob).lstrip("\ufeff")
        if not text.strip():
            return "empty", []
        return f"ok {version}", list(csv.DictReader(io.StringIO(text), delimiter="\t"))
    return last, []


def iap_name(row: dict) -> str:
    sku = (row.get("SKU") or "").strip()
    title = (row.get("Title") or "").strip()
    apple = (row.get("Apple Identifier") or "").strip()
    parent = (row.get("Parent Identifier") or "").strip()
    for product_id, (name, apple_id) in IAP.items():
        if sku == product_id or title == product_id or apple == apple_id or product_id in sku or product_id in title:
            return name
        if parent in {APP_ID, "com.wrap911.trainer"} and apple == apple_id:
            return name
    return ""


def is_app_row(row: dict) -> bool:
    apple = (row.get("Apple Identifier") or "").strip()
    sku = (row.get("SKU") or "").strip().lower()
    parent = (row.get("Parent Identifier") or "").strip()
    return apple == APP_ID or sku in APP_SKUS or parent == APP_ID


def add_sales(rows: list[dict], bucket: dict) -> None:
    for row in rows:
        kind = (row.get("Product Type Identifier") or "").strip().upper()
        name = iap_name(row)
        if not name and not is_app_row(row):
            continue
        try:
            units = int(float(row.get("Units") or 0))
        except ValueError:
            units = 0
        try:
            proceeds_each = float(row.get("Developer Proceeds") or 0)
        except ValueError:
            proceeds_each = 0.0
        currency = (row.get("Currency of Proceeds") or "").strip() or "unspecified"
        if name:
            key = ("iap", name, kind, currency)
        elif kind in REDOWNLOAD_TYPES:
            key = ("redownload", "app", kind, currency)
        elif kind in UPDATE_TYPES:
            key = ("update", "app", kind, currency)
        elif kind in FIRST_TYPES:
            key = ("first", "app", kind, currency)
        else:
            key = ("other", "app", kind or "unknown", currency)
        bucket[key]["units"] += units
        bucket[key]["proceeds"] += proceeds_each * units
        begin = (row.get("Begin Date") or "").strip()
        end = (row.get("End Date") or "").strip()
        if begin:
            bucket[key]["begins"].add(begin)
        if end:
            bucket[key]["ends"].add(end)


def print_sales_bucket(label: str, bucket: dict) -> None:
    if not bucket:
        print(f"{label} WRAP 911 rows=0")
        return
    grouped: dict[tuple, dict] = defaultdict(lambda: {"units": 0, "proceeds": defaultdict(float), "types": set()})
    for (motion, name, kind, currency), vals in bucket.items():
        slot = grouped[(motion, name)]
        slot["units"] += vals["units"]
        slot["proceeds"][currency] += vals["proceeds"]
        slot["types"].add(kind)
    for motion, name in sorted(grouped):
        slot = grouped[(motion, name)]
        proceeds = ", ".join(f"{amount:.2f} {currency}" for currency, amount in sorted(slot["proceeds"].items()))
        print(f"{label} {motion} {name} units={slot['units']} types={','.join(sorted(slot['types']))} proceeds={proceeds}")


def sales_report(vendor: str) -> None:
    print("SALES timezone=America/Los_Angeles (Apple Sales and Trends report dates are Pacific Time)")
    if not vendor:
        print("SALES not available (no vendor-number secret)")
        return
    end = datetime.now(PT).date()
    print(f"SALES daily requested {LAUNCH.isoformat()} through {end.isoformat()} Pacific")
    returned = []
    missing = []
    daily: dict = defaultdict(lambda: {"units": 0, "proceeds": 0.0, "begins": set(), "ends": set()})
    day = LAUNCH
    while day <= end:
        state, rows = sales_file(vendor, "DAILY", day.isoformat())
        print(f"SALES day {day.isoformat()} {state} rows={len(rows)}", flush=True)
        if state.startswith("ok"):
            returned.append(day.isoformat())
            before = len(daily)
            add_sales(rows, daily)
            if len(daily) == before and not any(is_app_row(row) or iap_name(row) for row in rows):
                print(f"SALES day {day.isoformat()} report returned with no WRAP 911 rows")
        else:
            missing.append(f"{day.isoformat()} {state}")
        day += timedelta(days=1)
    print("SALES daily returned " + (", ".join(returned) if returned else "none"))
    print("SALES daily not returned " + ("; ".join(missing) if missing else "none"))
    if returned:
        print_sales_bucket("SALES daily total", daily)
        for product in ("Seat", "Shop Pack", "7-Day Pass"):
            units = sum(vals["units"] for (motion, name, _kind, _currency), vals in daily.items() if motion == "iap" and name == product)
            if units == 0 and not any(name == product for (_m, name, _k, _c) in daily):
                print(f"SALES daily total iap {product} units=0 proceeds=0.00 (no rows in returned days)")
    else:
        print("SALES daily totals not available")
    for frequency, report_date in (("MONTHLY", "2026-11"), ("YEARLY", "2026")):
        state, rows = sales_file(vendor, frequency, report_date)
        print(f"SALES {frequency} {report_date} {state} rows={len(rows)}")
        if not state.startswith("ok"):
            print(f"SALES {frequency} {report_date} not available")
            continue
        bucket: dict = defaultdict(lambda: {"units": 0, "proceeds": 0.0, "begins": set(), "ends": set()})
        add_sales(rows, bucket)
        begins = sorted({item for vals in bucket.values() for item in vals["begins"]})
        ends = sorted({item for vals in bucket.values() for item in vals["ends"]})
        print(f"SALES {frequency} file dates begin={begins[:1] or ['not available']} end={ends[-1:] or ['not available']} (dates inside the file, MM/DD/YYYY Pacific)")
        print_sales_bucket(f"SALES {frequency} total", bucket)
        if not bucket:
            print(f"SALES {frequency} WRAP 911 units=0 in the returned file")


def download_segment(url: str) -> str:
    if not url.startswith("https://"):
        return ""
    response = requests.get(url, timeout=120)
    if response.status_code >= 400:
        print(f"ANALYTICS segment HTTP {response.status_code}")
        return ""
    return gunzip(response.content).lstrip("\ufeff")


def rollup_instance(text: str, kind: str) -> dict[tuple, dict]:
    reader = csv.DictReader(io.StringIO(text), delimiter="\t")
    fields = reader.fieldnames or []
    lower = {name.lower(): name for name in fields}
    date_key = lower.get("date")
    count_key = lower.get("counts")
    unique_key = lower.get("unique counts")
    label_key = lower.get("event") if kind == "engagement" else lower.get("download type")
    apple_key = lower.get("app apple identifier")
    rolled: dict[tuple, dict] = defaultdict(lambda: {"counts": 0, "unique": 0})
    if not date_key or not count_key or not label_key:
        return {}
    for row in reader:
        if apple_key and (row.get(apple_key) or "").strip() not in {"", APP_ID}:
            continue
        day = (row.get(date_key) or "")[:10]
        label = (row.get(label_key) or "").strip()
        if not day or not label:
            continue
        try:
            counts = int(float(row.get(count_key) or 0))
        except ValueError:
            counts = 0
        unique = 0
        if unique_key:
            try:
                unique = int(float(row.get(unique_key) or 0))
            except ValueError:
                unique = 0
        rolled[(day, label)]["counts"] += counts
        rolled[(day, label)]["unique"] += unique
    return rolled


def latest_by_date(instances: list[tuple[str, dict]]) -> dict[tuple, dict]:
    chosen: dict[tuple, tuple[str, dict]] = {}
    for processing, rolled in instances:
        for key, vals in rolled.items():
            previous = chosen.get(key)
            if previous is None or processing >= previous[0]:
                chosen[key] = (processing, vals)
    return {key: vals for key, (_processing, vals) in chosen.items()}


def analytics_reports(request_id: str) -> None:
    status, reports = pages(f"/v1/analyticsReportRequests/{request_id}/reports?limit=200")
    if status >= 400:
        print(f"ANALYTICS reports not available (HTTP {status})")
        return
    wanted = {
        "App Store Discovery and Engagement Standard": "engagement",
        "App Downloads Standard": "downloads",
    }
    found = {str((row.get("attributes") or {}).get("name") or ""): row for row in reports}
    print("ANALYTICS report names " + ", ".join(sorted(found)))
    for name, kind in wanted.items():
        report = found.get(name)
        if not report:
            print(f"ANALYTICS {name} not available")
            continue
        status, instances = pages(f"/v1/analyticsReports/{report['id']}/instances?limit=200")
        if status >= 400:
            print(f"ANALYTICS {name} instances not available (HTTP {status})")
            continue
        daily = []
        for instance in instances:
            attrs = instance.get("attributes") or {}
            if str(attrs.get("granularity") or "") != "DAILY":
                continue
            processing = str(attrs.get("processingDate") or "")[:10]
            status, segments = pages(f"/v1/analyticsReportInstances/{instance['id']}/segments?limit=20")
            if status >= 400 or not segments:
                continue
            parts = []
            for segment in segments:
                url = str((segment.get("attributes") or {}).get("url") or "")
                text = download_segment(url)
                if text:
                    parts.append(text)
            if not parts:
                continue
            header = parts[0].splitlines()[0]
            body = [parts[0]]
            for extra in parts[1:]:
                lines = extra.splitlines()
                body.append("\n".join(lines[1:]) if lines and lines[0] == header else extra)
            daily.append((processing, rollup_instance("\n".join(body), kind)))
        if not daily:
            print(f"ANALYTICS {name} daily instances not available")
            continue
        merged = latest_by_date(daily)
        if not merged:
            print(f"ANALYTICS {name} rows not available")
            continue
        dates = sorted({key[0] for key in merged})
        print(f"ANALYTICS {name} date range {dates[0]} through {dates[-1]} (Date column in the report file; no timezone field). Latest daily instance wins for each date so overlapping files are not added twice.")
        totals: dict[str, int] = defaultdict(int)
        for (day, label), vals in sorted(merged.items()):
            totals[label] += vals["counts"]
            print(f"ANALYTICS {name} {day} {label} counts={vals['counts']}")
        for label, total in sorted(totals.items()):
            print(f"ANALYTICS {name} TOTAL {label} counts={total}")
        print(f"ANALYTICS {name} unique counts not available as one total (rows are split by device, territory, and source)")


def analytics() -> None:
    print("ANALYTICS listing requests")
    status, rows = pages(f"/v1/apps/{APP_ID}/analyticsReportRequests?limit=50")
    if status >= 400:
        print(f"ANALYTICS requests not available (HTTP {status})")
        return
    ongoing = []
    for row in rows:
        attrs = row.get("attributes") or {}
        print(f"ANALYTICS request id={row.get('id')} accessType={attrs.get('accessType')}")
        if attrs.get("accessType") == "ONGOING":
            ongoing.append(row)
    if not rows:
        status, created = call(
            "POST",
            "/v1/analyticsReportRequests",
            body={
                "data": {
                    "type": "analyticsReportRequests",
                    "attributes": {"accessType": "ONGOING"},
                    "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
                }
            },
        )
        if status not in (200, 201) or not (created.get("data") or {}).get("id"):
            print("ANALYTICS request was not created")
            return
        attrs = created["data"].get("attributes") or {}
        print(f"ANALYTICS created id={created['data']['id']} accessType={attrs.get('accessType')}")
        print("ANALYTICS data will appear in 1-2 days. No report rows were available to read.")
        return
    if not ongoing:
        print("ANALYTICS ONGOING request not available. No new request was created because another request already exists.")
        return
    analytics_reports(ongoing[0]["id"])


def main() -> None:
    for name in ("RAW", "ASC_KEY_ID", "ASC_ISSUER_ID"):
        if not os.environ.get(name):
            raise SystemExit(name + " is required")
    print("READ ONLY except one ongoing analytics request when none exists.")
    version_status()
    print("---")
    sales_report(vendor_number())
    print("---")
    analytics()
    print("DONE.")


if __name__ == "__main__":
    main()
