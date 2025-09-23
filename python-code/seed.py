import requests
import datetime
from pymongo import MongoClient

# ✅ MongoDB Atlas connection
client = MongoClient(
    "mongodb+srv://Yuvi123:hQ5Iyu03OLOiDEBF@cluster0.th4eu8z.mongodb.net/"
    "?retryWrites=true&w=majority&appName=Cluster0"
)
db = client["gwlr_db"]
collection = db["groundwater_levels"]

BASE_URL = "https://indiawris.gov.in"

# ✅ Tamil Nadu statecode = 22
state_code = "22"
target_district = "Coimbatore"

print(f"🚀 Starting groundwater data fetch for {target_district}...")

# 1. Fetch districts for Tamil Nadu
districts_resp = requests.post(
    f"{BASE_URL}/masterDistrict/getDistrictbyState",
    json={"statecode": state_code, "datasetcode": "GWATERLVL"}
).json()

# 2. Find only Coimbatore district
for district in districts_resp.get("data", []):
    district_name = district["districtname"]
    if district_name.lower() != target_district.lower():
        continue

    district_id = district["district_id"]
    print(f"\n📍 Processing District: {district_name} (ID: {district_id})")

    # 3. Fetch telemetric stations in Coimbatore
    stations_resp = requests.post(
        f"{BASE_URL}/masterStationDS/stationDSList",
        json={
            "district_id": str(district_id),
            "agencyid": "113",
            "datasetcode": "GWATERLVL",
            "telemetric": "true"
        }
    ).json()

    for station in stations_resp.get("data", []):
        station_code = station["stationcode"]
        station_name = station["stationname"]

        print(f"   ⏳ Fetching data for station: {station_name} ({station_code})...")

        # 4. Last 1 month date range
        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=30)

        payload = {
            "station_code": station_code,
            "starttime": str(start_date),
            "endtime": str(end_date),
            "dataset": "GWATERLVL"
        }

        try:
            data_resp = requests.post(
                f"{BASE_URL}/CommonDataSetMasterAPI/getCommonDataSetByStationCode",
                json=payload
            ).json()
        except Exception as e:
            print(f"   ❌ Error fetching data for {station_name}: {e}")
            continue

        entries = data_resp.get("data", [])
        if not entries:
            print(f"   ⚠️ No data found for {station_name} ({station_code})")
            continue

        # 5. Insert into MongoDB with deduplication
        for entry in entries:
            doc = {
                "timestamp": entry["dataTime"],
                "station": {
                    "code": station_code,
                    "name": station_name,
                    "district": district_name
                },
                "value": entry["dataValue"],
                "unit": entry.get("unitCode", "m")
            }

            collection.update_one(
                {"timestamp": entry["dataTime"], "station.code": station_code},
                {"$set": doc},
                upsert=True
            )

        print(f"   ✅ Inserted/updated {len(entries)} records for {station_name}")

print(f"\n🎉 Groundwater data for {target_district} (last 1 month) successfully synced to MongoDB Atlas.")
