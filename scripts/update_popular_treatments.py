#!/usr/bin/env python3
"""
Stylish Brow Bar: rewrite the "Popular treatments" list on the home page
from real Acuity Scheduling booking counts.

Run by .github/workflows/update-popular-treatments.yml on a schedule.

PRIVACY / SECURITY, read before changing anything:
  - This script reads ACUITY_USER_ID and ACUITY_API_KEY from environment
    variables ONLY (set as GitHub Actions encrypted secrets). Never hardcode
    them here, and never print them.
  - Acuity appointment records contain client names, emails, phone numbers
    and free-text form answers. This script must NEVER write any of that
    to a file, print it, or include it in anything committed to the repo.
    It only ever works with: service name (type), category, price,
    duration, and a count. That's it.
  - GitHub Actions logs for a PUBLIC repo are visible to anyone, so the
    same rule applies to anything printed with print().
"""

import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date, timedelta

API_BASE = "https://acuityscheduling.com/api/v1/appointments"
# Rolling 30 days, not the calendar month: a calendar month resets to zero on
# the 1st, which would make the list look sparse (or empty) for the first
# few days of every month. A rolling window stays stable day to day.
WINDOW_DAYS = 30
TOP_N = 6                 # how many services to show in the "Popular treatments" list
INDEX_HTML = os.path.join(os.path.dirname(__file__), "..", "index.html")
MARKER_START = "<!-- POPULAR-TREATMENTS:START -->"
MARKER_END = "<!-- POPULAR-TREATMENTS:END -->"

# Map an Acuity "category" to the matching service page, for the (currently
# unused but available) idea of linking each line item — kept here in case
# a future version of the list links out. Today the list only needs name,
# duration and price, so this isn't applied to the HTML yet.
CATEGORY_TO_PAGE = {
    "Threading": "services/threading",
    "Brows": "services/brows",
    "Waxing": "services/waxing",
    "Lashes": "services/lashes",
}


def month_chunks(start, end):
    """Yield (chunk_start, chunk_end) pairs no wider than one calendar month,
    since the Acuity API's `max` caps a single response and there's no
    documented offset/page parameter to page past that cap."""
    cur = start
    while cur <= end:
        # last day of cur's month, capped at `end`
        if cur.month == 12:
            next_month = date(cur.year + 1, 1, 1)
        else:
            next_month = date(cur.year, cur.month + 1, 1)
        chunk_end = min(next_month - timedelta(days=1), end)
        yield cur, chunk_end
        cur = chunk_end + timedelta(days=1)


def fetch_appointments(user_id, api_key, min_date, max_date):
    """Fetch appointments for one date range. Splits further if the
    response looks like it hit the `max` cap, so nothing is silently lost."""
    token = base64.b64encode(f"{user_id}:{api_key}".encode("utf-8")).decode("ascii")
    cap = 500
    params = {
        "minDate": min_date.isoformat(),
        "maxDate": max_date.isoformat(),
        "max": str(cap),
    }
    url = API_BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "Authorization": f"Basic {token}",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # Never include response bodies here in case Acuity ever echoes
        # request details back in an error page.
        print(f"Acuity API request failed: HTTP {e.code} for range "
              f"{min_date}..{max_date}", file=sys.stderr)
        raise

    if not isinstance(data, list):
        raise RuntimeError("Unexpected Acuity response shape (expected a list).")

    if len(data) >= cap:
        if min_date < max_date:
            # Hit (or very close to) the cap: split this range in half and
            # fetch each half, so we don't silently drop appointments.
            mid = min_date + (max_date - min_date) // 2
            if mid >= max_date:
                mid = max_date - timedelta(days=1)
            if mid >= min_date:
                left = fetch_appointments(user_id, api_key, min_date, mid)
                right = fetch_appointments(user_id, api_key, mid + timedelta(days=1), max_date)
                return left + right
        else:
            # A single calendar day alone hit the cap. The API only filters
            # by date, not time, so this can't be split any further. For a
            # one-person salon this should never happen in practice, but
            # make the gap visible rather than silently dropping records.
            print(f"WARNING: {min_date.isoformat()} has {cap}+ appointments, "
                  f"which exceeds the API's single-request limit and can't be "
                  f"split further (Acuity only filters by date, not time). "
                  f"Some appointments on this day may be missing from the count.",
                  file=sys.stderr)
    return data


def collect_window(user_id, api_key, window_days):
    today = date.today()
    start = today - timedelta(days=window_days)
    end = today
    seen_ids = set()
    counts = defaultdict(lambda: {"count": 0, "type": None, "category": None,
                                   "duration": None, "price": None})
    total_fetched = 0
    total_counted = 0

    for chunk_start, chunk_end in month_chunks(start, end):
        appointments = fetch_appointments(user_id, api_key, chunk_start, chunk_end)
        total_fetched += len(appointments)
        for appt in appointments:
            appt_id = appt.get("id")
            if appt_id is None or appt_id in seen_ids:
                continue
            seen_ids.add(appt_id)

            # By request, cancelled appointments still count: a service that
            # gets booked a lot is "popular" even if some of those bookings
            # were later cancelled. To exclude cancellations instead, add:
            #   if appt.get("canceled"): continue
            type_id = appt.get("appointmentTypeID")
            type_name = appt.get("type")
            if not type_name:
                continue
            key = type_id if type_id is not None else type_name

            entry = counts[key]
            entry["count"] += 1
            entry["type"] = type_name
            entry["category"] = appt.get("category")
            # Keep the most recently seen duration/price for this service,
            # in case it changed over the window.
            if appt.get("duration"):
                entry["duration"] = appt["duration"]
            if appt.get("price"):
                entry["price"] = appt["price"]
            total_counted += 1

    # Deliberately no per-appointment data is kept beyond this point: only
    # aggregate counts per service survive. Safe to print aggregate numbers.
    print(f"Fetched {total_fetched} appointment records across "
          f"{start.isoformat()}..{end.isoformat()}, counted {total_counted} "
          f"bookings (cancelled bookings included) across {len(counts)} "
          f"distinct services.")
    return counts


def format_price(raw_price):
    try:
        value = float(raw_price)
    except (TypeError, ValueError):
        return None
    if value == int(value):
        return f"${int(value)}"
    return f"${value:.2f}"


def html_escape(text):
    return (text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))


def build_list_items(counts, top_n):
    ranked = sorted(
        counts.values(),
        key=lambda e: (-e["count"], e["type"] or ""),
    )[:top_n]

    lines = []
    for entry in ranked:
        name = html_escape(entry["type"])
        duration = entry["duration"]
        price = format_price(entry["price"])
        if duration and price:
            lines.append(
                f'          <li><span>{name} <small>{duration} min</small></span>'
                f'<span class="price">{price}</span></li>'
            )
        elif price:
            lines.append(
                f'          <li><span>{name}</span><span class="price">{price}</span></li>'
            )
        else:
            lines.append(f'          <li><span>{name}</span></li>')
    return lines


def update_index_html(list_items):
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        html = f.read()

    if MARKER_START not in html or MARKER_END not in html:
        raise RuntimeError(
            "Could not find the POPULAR-TREATMENTS markers in index.html. "
            "Has the file been restructured? Not touching the file."
        )

    pattern = re.compile(
        re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
        re.DOTALL,
    )
    replacement = MARKER_START + "\n" + "\n".join(list_items) + "\n" + MARKER_END
    new_html, n = pattern.subn(replacement, html, count=1)
    if n != 1:
        raise RuntimeError("Marker replacement failed unexpectedly.")

    if new_html == html:
        print("No change: generated list is identical to what's already in index.html.")
        return False

    with open(INDEX_HTML, "w", encoding="utf-8") as f:
        f.write(new_html)
    print(f"Updated {INDEX_HTML} with {len(list_items)} popular-treatment line(s).")
    return True


def main():
    user_id = os.environ.get("ACUITY_USER_ID")
    api_key = os.environ.get("ACUITY_API_KEY")
    if not user_id or not api_key:
        print("ACUITY_USER_ID and/or ACUITY_API_KEY is not set.", file=sys.stderr)
        sys.exit(1)

    counts = collect_window(user_id, api_key, WINDOW_DAYS)
    if not counts:
        print("No non-canceled appointments found in the window; leaving index.html unchanged.")
        sys.exit(0)

    list_items = build_list_items(counts, TOP_N)
    changed = update_index_html(list_items)
    # Exit code 0 either way; the workflow checks `git status` to decide
    # whether to commit, not this script's exit code.
    sys.exit(0)


if __name__ == "__main__":
    main()
