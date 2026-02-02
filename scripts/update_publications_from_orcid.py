#!/usr/bin/env python3
"""Sync ORCID works to publications JSON files.

Outputs:
- assets/data/publications.orcid.json (raw ORCID-derived list)
- assets/data/publications.overrides.json (curated overrides, if missing)
- assets/data/publications.json (merged output for the site)
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

USER_AGENT = "orcid-to-ghpages-publications (GitHub Actions)"
HEADERS = {
    "Accept": "application/json",
    "User-Agent": USER_AGENT,
}

DEFAULT_ORCID = "0000-0003-1850-2327"

PROD_TOKEN = "https://orcid.org/oauth/token"
PROD_API = "https://pub.orcid.org/v3.0"
SANDBOX_TOKEN = "https://sandbox.orcid.org/oauth/token"
SANDBOX_API = "https://pub.sandbox.orcid.org/v3.0"

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ORCID_OUT = os.path.join(ROOT, "assets", "data", "publications.orcid.json")
OVERRIDES_OUT = os.path.join(ROOT, "assets", "data", "publications.overrides.json")
MERGED_OUT = os.path.join(ROOT, "assets", "data", "publications.json")


def normalize_doi(raw: str) -> str:
    if not raw:
        return ""
    doi = raw.strip()
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi, flags=re.IGNORECASE)
    doi = re.sub(r"^doi:\s*", "", doi, flags=re.IGNORECASE)
    return doi.strip()


def sanitize_id(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value


def request_with_retry(method: str, url: str, headers: Dict[str, str], data: Optional[Dict[str, str]] = None) -> requests.Response:
    backoff = 0.5
    for attempt in range(5):
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            else:
                response = requests.post(url, headers=headers, data=data, timeout=30)
        except requests.RequestException:
            if attempt == 4:
                raise
            time.sleep(backoff)
            backoff *= 2
            continue

        if response.status_code in (429, 500, 502, 503, 504):
            if attempt == 4:
                return response
            time.sleep(backoff)
            backoff *= 2
            continue

        return response
    return response


def get_token(token_url: str, client_id: str, client_secret: str) -> str:
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
        "scope": "/read-public",
    }
    response = request_with_retry("POST", token_url, headers=HEADERS, data=data)
    if response.status_code != 200:
        raise RuntimeError(f"Token request failed: {response.status_code} {response.text}")
    payload = response.json()
    token = payload.get("access_token")
    if not token:
        raise RuntimeError("Token response missing access_token")
    return token


def get_putcodes(api_base: str, orcid_id: str, token: str) -> List[int]:
    url = f"{api_base}/{orcid_id}/works"
    headers = dict(HEADERS)
    headers["Authorization"] = f"Bearer {token}"
    response = request_with_retry("GET", url, headers=headers)
    if response.status_code != 200:
        raise RuntimeError(f"Works request failed: {response.status_code} {response.text}")
    payload = response.json()
    putcodes: List[int] = []
    for group in payload.get("group", []):
        for summary in group.get("work-summary", []):
            code = summary.get("put-code")
            if isinstance(code, int):
                putcodes.append(code)
    return list(dict.fromkeys(putcodes))


def extract_external_ids(work: Dict[str, Any]) -> Tuple[str, Dict[str, str]]:
    doi = ""
    links: Dict[str, str] = {}
    for ext in work.get("external-ids", {}).get("external-id", []):
        ext_type = (ext.get("external-id-type") or "").lower()
        value = ext.get("external-id-value")
        if not value:
            continue
        if ext_type == "doi" and not doi:
            doi = normalize_doi(value)
        if ext_type and value:
            if ext_type == "doi":
                links["doi"] = f"https://doi.org/{normalize_doi(value)}"
    return doi, links


def fetch_work(api_base: str, orcid_id: str, putcode: int, token: str) -> Dict[str, Any]:
    url = f"{api_base}/{orcid_id}/work/{putcode}"
    headers = dict(HEADERS)
    headers["Authorization"] = f"Bearer {token}"
    response = request_with_retry("GET", url, headers=headers)
    if response.status_code != 200:
        raise RuntimeError(f"Work request failed ({putcode}): {response.status_code} {response.text}")
    return response.json()


def normalize_work(work: Dict[str, Any], orcid_id: str) -> Dict[str, Any]:
    title = (work.get("title", {}) or {}).get("title", {})
    title_value = title.get("value") or ""
    publication_date = work.get("publication-date") or {}
    year_value = None
    if isinstance(publication_date, dict):
        year_raw = (publication_date.get("year") or {}).get("value")
        if year_raw and str(year_raw).isdigit():
            year_value = int(year_raw)
    work_type = work.get("type") or ""
    venue = (work.get("journal-title") or {}).get("value") or ""

    doi, links = extract_external_ids(work)

    work_url = (work.get("url") or {}).get("value") or ""
    if work_url:
        links["url"] = work_url

    if doi:
        identifier = f"doi-{sanitize_id(doi)}"
    else:
        identifier = f"orcid-putcode-{work.get('put-code')}"

    return {
        "id": identifier,
        "title": title_value,
        "year": year_value,
        "type": work_type,
        "venue": venue,
        "doi": doi,
        "links": links,
        "tags": [],
        "selected": False,
        "my_role": "",
        "source": {
            "orcid_putcode": work.get("put-code"),
            "orcid_path": f"/{orcid_id}/work/{work.get('put-code')}"
        }
    }


def load_overrides(path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            return []
    if isinstance(data, list):
        return data
    return []


def apply_overrides(publications: List[Dict[str, Any]], overrides: List[Dict[str, Any]]) -> None:
    by_id = {pub["id"]: pub for pub in publications}
    by_doi = {pub.get("doi", "").lower(): pub for pub in publications if pub.get("doi")}

    for override in overrides:
        if not isinstance(override, dict):
            continue
        target = None
        override_id = override.get("id")
        override_doi = override.get("doi")
        if override_id and override_id in by_id:
            target = by_id[override_id]
        elif override_doi:
            target = by_doi.get(str(override_doi).lower())

        if not target:
            continue

        if "selected" in override:
            target["selected"] = bool(override["selected"])
        if "tags" in override and isinstance(override["tags"], list):
            target["tags"] = override["tags"]
        if "my_role" in override and isinstance(override["my_role"], str):
            target["my_role"] = override["my_role"]
        if "authors" in override and isinstance(override["authors"], list):
            target["authors"] = override["authors"]
        if "links" in override and isinstance(override["links"], dict):
            target_links = target.get("links", {})
            for key in ("pdf", "code", "data", "arxiv", "doi", "url"):
                if key in override["links"]:
                    target_links[key] = override["links"][key]
            target["links"] = target_links


def ensure_required_fields(publications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cleaned = []
    for pub in publications:
        pub = dict(pub)
        pub["title"] = pub.get("title") or ""
        pub["year"] = pub.get("year") if isinstance(pub.get("year"), int) else None
        pub["type"] = pub.get("type") or ""
        pub["venue"] = pub.get("venue") or ""
        pub["doi"] = pub.get("doi") or ""
        pub["tags"] = pub.get("tags") if isinstance(pub.get("tags"), list) else []
        pub["selected"] = bool(pub.get("selected"))
        pub["my_role"] = pub.get("my_role") or ""
        links = pub.get("links") if isinstance(pub.get("links"), dict) else {}
        if pub["doi"] and "doi" not in links:
            links["doi"] = f"https://doi.org/{pub['doi']}"
        pub["links"] = links
        cleaned.append(pub)
    return cleaned


def sort_publications(publications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    def key_fn(pub: Dict[str, Any]):
        year = pub.get("year")
        year_key = year if isinstance(year, int) else -1
        return (-year_key, (pub.get("title") or "").lower())
    return sorted(publications, key=key_fn)


def write_json(path: str, payload: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=True)
        f.write("\n")


def read_file(path: str) -> str:
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def main() -> int:
    orcid_env = os.getenv("ORCID_ENV", "prod").lower()
    orcid_id = os.getenv("ORCID_ID", DEFAULT_ORCID)
    client_id = os.getenv("ORCID_CLIENT_ID")
    client_secret = os.getenv("ORCID_CLIENT_SECRET")

    if orcid_env not in ("prod", "sandbox"):
        raise RuntimeError("ORCID_ENV must be 'prod' or 'sandbox'")

    if orcid_env == "sandbox":
        token_url = SANDBOX_TOKEN
        api_base = SANDBOX_API
    else:
        token_url = PROD_TOKEN
        api_base = PROD_API

    if not client_id or not client_secret:
        raise RuntimeError("ORCID_CLIENT_ID and ORCID_CLIENT_SECRET must be set")

    token = get_token(token_url, client_id, client_secret)
    putcodes = get_putcodes(api_base, orcid_id, token)

    publications: List[Dict[str, Any]] = []
    seen_ids = set()
    for putcode in putcodes:
        work = fetch_work(api_base, orcid_id, putcode, token)
        normalized = normalize_work(work, orcid_id)
        if normalized["id"] in seen_ids:
            normalized["id"] = f"{normalized['id']}-{putcode}"
        seen_ids.add(normalized["id"])
        publications.append(normalized)
        time.sleep(0.15)

    doi_count = sum(1 for pub in publications if pub.get("doi"))

    write_json(ORCID_OUT, publications)

    if not os.path.exists(OVERRIDES_OUT):
        write_json(OVERRIDES_OUT, [])

    overrides = load_overrides(OVERRIDES_OUT)
    apply_overrides(publications, overrides)

    if not publications:
        publications = [
            {
                "id": "placeholder-000",
                "title": "Placeholder - ORCID returned no works",
                "year": None,
                "type": "",
                "venue": "",
                "doi": "",
                "tags": ["placeholder"],
                "selected": False,
                "my_role": "",
                "links": {},
                "source": {"placeholder": True},
            }
        ]

    publications = ensure_required_fields(publications)
    publications = sort_publications(publications)

    merged_payload = {"publications": publications}
    before = read_file(MERGED_OUT)
    write_json(MERGED_OUT, merged_payload)
    after = read_file(MERGED_OUT)

    selected_count = sum(1 for pub in publications if pub.get("selected"))
    changed = before != after

    print(f"Fetched works: {len(putcodes)}")
    print(f"With DOI: {doi_count}")
    print(f"Selected after overrides: {selected_count}")
    print(f"publications.json changed: {changed}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}")
        sys.exit(1)
