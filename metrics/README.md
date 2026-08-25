# Toolkit PyPI download metrics

A deliberately crude, long-running record of PyPI download counts for the
**Azure Functions Python DX Toolkit**. [`pypistats`](https://pypi.org/project/pypistats/)
only exposes a rolling ~180-day window, so the only way to keep older data is to
capture it regularly and commit it here.

## Files

| File | Purpose |
| --- | --- |
| `pypi-downloads.csv` | Append-only history, one row per package per collection run. |
| `collect_downloads.py` | Fetches `pypistats recent` for every toolkit package and rewrites the CSV. |

## CSV schema

`pypi-downloads.csv` has a header row and the following columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `date` | ISO-8601 date (UTC) | The collection date, i.e. when the row was recorded. |
| `package` | string | PyPI distribution name (e.g. `azure-functions-logging`). |
| `last_day` | integer | Downloads in the last day, per `pypistats recent`. |
| `last_week` | integer | Downloads in the last week, per `pypistats recent`. |
| `last_month` | integer | Downloads in the last month, per `pypistats recent`. |

Rows are sorted by `(date, package)`. Collection is **idempotent per date**:
re-running on the same UTC date overwrites that date's rows instead of
duplicating them, so a manual re-run is always safe.

A **blank** count for a package means the fetch failed (e.g. pypistats.org
rate limiting, or the package not yet published) — collection records an empty
value rather than a misleading `0`, and never fails the run over a single
missing package. A genuine `0` means zero downloads in that window.

## Cadence

Collected weekly by the [`pypi-metrics`](../.github/workflows/pypi-metrics.yml)
GitHub Actions workflow (`cron`), and on demand via `workflow_dispatch`. The
workflow commits any change back to `main` with a `chore(metrics):` message.

## Out of scope

Dashboards, charts, and any use of these numbers as a maturity/quality gate are
intentionally excluded — this is raw data capture only.
