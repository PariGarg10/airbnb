"""HEAD every image URL in listings.json and print the broken ones."""

import json
import urllib.error
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "app" / "seed_data" / "listings.json"


def head_status(url: str) -> int | None:
    request = urllib.request.Request(
        url,
        method="HEAD",
        headers={"User-Agent": "Mozilla/5.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception:
        return None


def main() -> None:
    listings = json.loads(DATA.read_text(encoding="utf-8"))
    cache: dict[str, int | None] = {}
    broken: list[str] = []
    for listing in listings:
        for url in listing["images"]:
            if url not in cache:
                cache[url] = head_status(url)
            status = cache[url]
            if status is None or status >= 400:
                broken.append(f"{status or 'error'}  {listing['title']}  {url}")
    for line in broken:
        print(line)


if __name__ == "__main__":
    main()
