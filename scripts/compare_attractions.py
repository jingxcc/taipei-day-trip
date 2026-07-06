import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OLD_DATA_PATH = BASE_DIR / "data" / "taipei-attractions.json"
API_DATA_PATH = BASE_DIR / "data" / "taipei-api-attractions.json"
REPORT_PATH = BASE_DIR / "data" / "attraction-compare-report.json"


def load_json(path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def get_old_attractions(data):
    return data["result"]["results"]


def get_api_attractions(data):
    return data


def main():
    old_data = load_json(OLD_DATA_PATH)
    api_data = load_json(API_DATA_PATH)

    old_attractions = get_old_attractions(old_data)
    api_attractions = get_api_attractions(api_data)

    old_by_name = {}
    for item in old_attractions:
        old_by_name[item["name"].strip()] = item

    api_by_name = {}
    for item in api_attractions:
        api_by_name[item["name"].strip()] = item

    old_names = set(old_by_name.keys())
    api_names = set(api_by_name.keys())

    matched_names = sorted(old_names.intersection(api_names))
    not_found_names = sorted(old_names.difference(api_names))
    new_api_names = sorted(api_names.difference(old_names))

    report = {
        "summary":{
            "old_total": len(old_names),
            "api_total": len(api_names),
            "matched": len(matched_names),
            "not_found": len(not_found_names),
            "new_in_api": len(new_api_names),
        },
        "matched_names": matched_names,
        "not_found_names": not_found_names,
        "new_api_names": new_api_names,
    }

    with REPORT_PATH.open("w", encoding="utf-8") as file:
        json.dump(report, file, ensure_ascii=False, indent=2)

    print(f"Matched: {len(matched_names)}")
    print(f"Not found: {len(not_found_names)}")
    print(f"New API Attractions: {len(new_api_names)}")
    print(f"Report saved to {REPORT_PATH}")


if __name__ == "__main__":
    main()