#!/usr/bin/env python3
"""Sync publications from OpenAlex and generate publications.json."""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

API_BASE = "https://api.openalex.org"
USER_AGENT = "openalex-to-ghpages-publications (GitHub Actions)"
DEFAULT_ORCID = "0000-0003-1850-2327"

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW_OUT = os.path.join(ROOT, "assets", "data", "publications.openalex.raw.json")
FINAL_OUT = os.path.join(ROOT, "assets", "data", "publications.json")
SELECTED_PATH = os.path.join(ROOT, "assets", "data", "publications.selected.json")


def request_with_retry(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    backoff = 0.6
    for attempt in range(5):
        try:
            response = requests.get(
                url,
                params=params,
                headers={
                    "Accept": "application/json",
                    "User-Agent": USER_AGENT,
                },
                timeout=10,
            )
        except requests.RequestException:
            if attempt == 4:
                raise
            time.sleep(backoff)
            backoff *= 2
            continue

        if response.status_code in (429, 500, 502, 503, 504):
            if attempt == 4:
                response.raise_for_status()
            time.sleep(backoff)
            backoff *= 2
            continue

        response.raise_for_status()
        return response.json()

    raise RuntimeError("Request failed after retries")


def get_author(orcid_id: str, api_key: str, mailto: Optional[str]) -> Dict[str, Any]:
    url = f"{API_BASE}/authors/orcid:{orcid_id}"
    params: Dict[str, Any] = {"api_key": api_key}
    if mailto:
        params["mailto"] = mailto
    return request_with_retry(url, params)


def paginate_works(author_id: str, api_key: str, mailto: Optional[str], max_works: int) -> List[Dict[str, Any]]:
    url = f"{API_BASE}/works"
    params: Dict[str, Any] = {
        "filter": f"authorships.author.id:{author_id}",
        "per-page": 200,
        "sort": "publication_date:desc",
        "api_key": api_key,
        "cursor": "*",
    }
    if mailto:
        params["mailto"] = mailto

    results: List[Dict[str, Any]] = []

    while True:
        payload = request_with_retry(url, params)
        batch = payload.get("results", [])
        if not batch:
            break
        for work in batch:
            results.append(work)
            if len(results) >= max_works:
                return results
        cursor = payload.get("meta", {}).get("next_cursor")
        if not cursor:
            break
        params["cursor"] = cursor

    return results


def normalize_doi(doi: Optional[str]) -> str:
    if not doi:
        return ""
    doi = doi.strip()
    doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "")
    return doi


def extract_pages(biblio: Dict[str, Any]) -> str:
    first_page = biblio.get("first_page") or ""
    last_page = biblio.get("last_page") or ""
    if first_page and last_page:
        return f"{first_page}-{last_page}"
    return first_page or last_page or ""




def last_ten_years_counts(counts_by_year: List[Dict[str, Any]]) -> Dict[str, Any]:
    current_year = datetime.utcnow().year
    years = [current_year - i for i in range(9, -1, -1)]
    counts_lookup = {item.get("year"): item.get("cited_by_count", 0) for item in counts_by_year}
    counts = [int(counts_lookup.get(year, 0) or 0) for year in years]
    return {"years": years, "counts": counts}

def last_five_years_counts(counts_by_year: List[Dict[str, Any]]) -> Dict[str, Any]:
    current_year = datetime.utcnow().year
    years = [current_year - i for i in range(4, -1, -1)]
    counts_lookup = {item.get("year"): item.get("cited_by_count", 0) for item in counts_by_year}
    counts = [int(counts_lookup.get(year, 0) or 0) for year in years]
    return {"years": years, "counts": counts}


def map_work(work: Dict[str, Any]) -> Dict[str, Any]:
    ids = work.get("ids", {}) or {}
    doi = normalize_doi(ids.get("doi"))
    doi_url = f"https://doi.org/{doi}" if doi else ""
    openalex_id = ids.get("openalex") or work.get("id") or ""
    openalex_url = openalex_id

    authorships = work.get("authorships", [])
    authors = [a.get("author", {}).get("display_name", "") for a in authorships]
    authors = [a for a in authors if a]

    host_venue = work.get("host_venue", {}) or {}
    primary_location = work.get("primary_location", {}) or {}
    primary_source = primary_location.get("source", {}) or {}
    first_location = (work.get("locations") or [{}])[0] or {}
    first_source = (first_location.get("source") or {})

    journal = (
        host_venue.get("display_name")
        or primary_source.get("display_name")
        or first_source.get("display_name")
        or ""
    )

    biblio = work.get("biblio", {}) or {}

    counts = last_five_years_counts(work.get("counts_by_year", []) or [])
    counts_10 = last_ten_years_counts(work.get("counts_by_year", []) or [])

    year = work.get("publication_year")
    if not year:
        pub_date = work.get("publication_date") or ""
        if pub_date and len(pub_date) >= 4 and pub_date[:4].isdigit():
            year = int(pub_date[:4])

    return {
        "openalex_id": openalex_id,
        "openalex_url": openalex_url,
        "title": work.get("display_name") or "",
        "authors": authors,
        "journal": journal or "",
        "year": year,
        "volume": biblio.get("volume") or "",
        "issue": biblio.get("issue") or "",
        "pages": extract_pages(biblio),
        "doi": doi,
        "doi_url": doi_url,
        "citations_total": int(work.get("cited_by_count") or 0),
        "citations_last5": counts,
        "citations_by_year": counts_10,
    }




def load_selected_dois(path: str) -> List[str]:
    if not os.path.exists(path):
        return []
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return []
    if isinstance(data, list):
        return [str(d).lower().strip() for d in data if str(d).strip()]
    return []


def sort_key(item: Dict[str, Any]):
    year = item.get("year") or 0
    journal = item.get("journal") or ""
    title = item.get("title") or ""
    return (-int(year), journal.lower(), title.lower())


def read_file(path: str) -> str:
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_json(path: str, payload: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=True)
        f.write("\n")


def main() -> int:
    api_key = os.getenv("OPENALEX_API_KEY")
    if not api_key:
        raise RuntimeError("OPENALEX_API_KEY is required")

    orcid_id = os.getenv("ORCID_ID", DEFAULT_ORCID)
    mailto = os.getenv("OPENALEX_MAILTO")
    max_works = int(os.getenv("MAX_WORKS", "200"))

    author = get_author(orcid_id, api_key, mailto)
    author_id = author.get("id")
    if not author_id:
        raise RuntimeError("Failed to resolve OpenAlex author id")

    works = paginate_works(author_id, api_key, mailto, max_works)

    mapped = [map_work(work) for work in works]
    mapped.sort(key=sort_key)

    doi_count = sum(1 for item in mapped if item.get("doi"))

    selected_dois = load_selected_dois(SELECTED_PATH)
    if selected_dois:
        for item in mapped:
            item["selected"] = item.get("doi", "").lower() in selected_dois

    write_json(RAW_OUT, mapped)

    before = read_file(FINAL_OUT)
    write_json(FINAL_OUT, mapped)
    after = read_file(FINAL_OUT)
    changed = before != after

    print(f"Works fetched: {len(mapped)}")
    print(f"With DOI: {doi_count}")
    print(f"Wrote: {RAW_OUT}")
    print(f"Wrote: {FINAL_OUT}")
    print(f"publications.json changed: {changed}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}")
        sys.exit(1)
