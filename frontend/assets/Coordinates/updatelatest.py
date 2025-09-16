import json
import requests
import time
import os
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIONS_FILE = os.path.join(BASE_DIR, "stations.json")

LOOKBACK_DAYS = 45
API_URL = "https://indiawris.gov.in/CommonDataSetMasterAPI/getCommonDataSetByStationCode"
TIMEOUT = 40
SLEEP_BETWEEN = 0.15  # seconds

def classify(depth):
    if depth is None:
        return "NO_DATA"
    # depth now always positive (converted if API returns negative)
    if depth <= 10:
        return "SAFE"
    if depth <= 20:
        return "WARNING"
    if depth <= 40:
        return "CRITICAL"
    return "DANGEROUS"

def iso(d: datetime) -> str:
    return d.strftime("%Y-%m-%d")

def fetch_latest(code):
    end = datetime.utcnow()
    start = end - timedelta(days=LOOKBACK_DAYS)
    payload = {
        "station_code": code,
        "starttime": iso(start),
        "endtime": iso(end),
        "dataset": "GWATERLVL",
    }
    try:
        r = requests.post(API_URL, json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f"[ERR] {code}: {e}")
        return None, None, "ERROR"

    rows = data.get("data") or []
    if not rows:
        return None, None, "NO_DATA"
    rows.sort(key=lambda x: x.get("dataTime") or "")
    latest = rows[-1]
    raw = latest.get("dataValue")
    depth = None
    try:
        if raw not in (None, "", "NA"):
            f = float(raw)
            if f == f:  # not NaN
                depth = f
    except:
        depth = None
    # CONVERT negative to positive
    if depth is not None and depth < 0:
        depth = abs(depth)
    ts = latest.get("dataTime")
    return depth, ts, classify(depth)

def main():
    if not os.path.exists(STATIONS_FILE):
        raise FileNotFoundError(f"stations.json not found at {STATIONS_FILE}")
    with open(STATIONS_FILE, "r", encoding="utf-8") as f:
        stations = json.load(f)

    total = len(stations)
    for i, st in enumerate(stations, 1):
        code = st.get("station_code")
        if not code:
            continue
        depth, ts, status = fetch_latest(code)
        st["latest_depth"] = depth
        st["latest_status"] = status
        st["latest_data_time"] = ts
        print(f"\rUpdating {i}/{total} {code} -> {status} {depth}", end="")
        time.sleep(SLEEP_BETWEEN)

    with open(STATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(stations, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\nDone: {STATIONS_FILE}")

if __name__ == "__main__":
    main()
