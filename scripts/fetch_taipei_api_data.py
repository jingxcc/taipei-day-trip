import json
import math
from pathlib import Path
from urllib.request import urlopen, Request


API_LANG="zh-tw"
API_RECORDS_PER_PAGE = 30
HEADERS={
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)  AppleWebKit/537.36 (KHTML, like Gecko)  Chrome/137.0.0.0 Safari/537.36"
}

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = BASE_DIR / "data" / "taipei-api-attractions.json"

def fetch_api_page(page):
    url = f"https://www.travel.taipei/open-api/{API_LANG}/Attractions/All?page={page}"
    
    request = Request(url,headers=HEADERS)

    with urlopen(request) as response:
        return json.load(response)


def fetch_attractions():
    attractions = []
        
    first_page_data = fetch_api_page(1)

    total = first_page_data["total"]
    total_pages = math.ceil(total / API_RECORDS_PER_PAGE)

    attractions.extend(first_page_data["data"])
    print(f"Total pages: {total_pages}")

    for page in range(2, total_pages + 1):
        page_data = fetch_api_page(page)
        attractions.extend(page_data["data"])

    print(
        f"Fetched {len(attractions)} attractions "
        f"(expected: {total})"
    )

    ids = [item["id"] for item in attractions]
    print(f"Total records: {len(ids)}")
    print(f"Unique IDs: {len(set(ids))}")
    
    return attractions



def main():
    data = fetch_attractions()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    print(f"Saved API data to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()