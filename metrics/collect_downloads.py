#!/usr/bin/env python3
"""Append PyPI download stats for the Azure Functions Python DX Toolkit to a CSV.

This is deliberately crude: a scheduled job that appends one row per package per
run to ``metrics/pypi-downloads.csv``. ``pypistats`` only exposes a rolling
~180-day window, so capturing regularly is the only way to build long-term
history. Dashboards/visualisation are intentionally out of scope.

The script is idempotent per ``(date, package)`` pair: re-running on the same UTC
date overwrites that date's rows rather than duplicating them, so a manual
``workflow_dispatch`` re-run is safe.
"""

from __future__ import annotations

import csv
import datetime as _dt
import json
import sys
import time
from pathlib import Path

import pypistats

# Canonical toolkit package list (PyPI distribution names).
PACKAGES: tuple[str, ...] = (
    "azure-functions-openapi",
    "azure-functions-validation",
    "azure-functions-logging",
    "azure-functions-doctor",
    "azure-functions-langgraph",
    "azure-functions-db",
    "azure-functions-durable-graph",
    "azure-functions-knowledge",
    "azure-functions-scaffold",
    "azure-functions-cookbook",
)

CSV_PATH = Path(__file__).with_name("pypi-downloads.csv")
FIELDNAMES = ("date", "package", "last_day", "last_week", "last_month")


def _recent(package: str, *, retries: int = 4, delay: float = 3.0) -> dict[str, str]:
    """Return ``{last_day, last_week, last_month}`` for *package* as strings.

    Retries with exponential backoff on transient errors (notably pypistats.org
    HTTP 429 rate limiting). On persistent failure the counts are recorded as
    empty strings rather than ``0`` so a rate-limited/unavailable fetch is never
    silently conflated with a genuine zero, and one bad package never aborts the
    whole run.
    """
    last_exc: Exception | None = None
    for attempt in range(retries):
        try:
            payload = json.loads(pypistats.recent(package, format="json"))
            data = payload.get("data", {})
            return {
                "last_day": str(int(data.get("last_day", 0))),
                "last_week": str(int(data.get("last_week", 0))),
                "last_month": str(int(data.get("last_month", 0))),
            }
        except Exception as exc:  # noqa: BLE001 - crude by design; never fail the run
            last_exc = exc
            if attempt < retries - 1:
                time.sleep(delay * (2**attempt))
    print(f"warning: could not fetch {package}: {last_exc}", file=sys.stderr)
    return {"last_day": "", "last_week": "", "last_month": ""}


def _load_existing() -> list[dict[str, str]]:
    if not CSV_PATH.exists():
        return []
    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def main() -> int:
    today = _dt.datetime.now(_dt.timezone.utc).date().isoformat()

    # Drop any pre-existing rows for today so re-runs are idempotent per date.
    rows = [r for r in _load_existing() if r.get("date") != today]

    for index, package in enumerate(PACKAGES):
        if index:
            time.sleep(2.0)  # be polite to pypistats.org; avoid 429 rate limiting
        stats = _recent(package)
        rows.append({"date": today, "package": package, **stats})
        print(f"{today} {package}: {stats}")

    rows.sort(key=lambda r: (r["date"], r["package"]))

    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)

    print(f"wrote {len(rows)} rows to {CSV_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
