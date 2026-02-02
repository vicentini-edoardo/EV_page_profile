#!/usr/bin/env python3
"""Generate static project pages from assets/data/projects.json."""

from __future__ import annotations

import html
import json
import os
import re
import sys
from typing import Any, Dict, List

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROJECTS_JSON = os.path.join(ROOT, "assets", "data", "projects.json")
TEMPLATE_PATH = os.path.join(ROOT, "projects", "project-template.html")
OUTPUT_DIR = os.path.join(ROOT, "projects")
INDEX_PATH = os.path.join(OUTPUT_DIR, "index.html")


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_template(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def sanitize_slug(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9-]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "project"


def make_methods_list(methods: List[str]) -> str:
    if not methods:
        return "<p>Methods: (to be added)</p>"
    items = "".join(f"<li>{html.escape(method)}</li>" for method in methods)
    return f"<ul>{items}</ul>"


def make_methods_pills(methods: List[str]) -> str:
    if not methods:
        return ""
    pills = "".join(f"<span class=\"pill\">{html.escape(method)}</span>" for method in methods)
    return pills


def make_why_it_matters(summary: str) -> str:
    summary = summary.strip()
    if summary:
        return f"{html.escape(summary)} This work supports rigorous, reproducible nano-optics experiments and helps translate measurements into device-relevant insights."
    return "This work supports rigorous, reproducible nano-optics experiments and helps translate measurements into device-relevant insights."


def render_project(template: str, project: Dict[str, Any]) -> str:
    title = html.escape(str(project.get("title", "Untitled project")))
    year = html.escape(str(project.get("year", "")))
    summary = html.escape(str(project.get("summary", "")))
    role = html.escape(str(project.get("role", ""))) or "(to be added)"
    methods = project.get("methods") if isinstance(project.get("methods"), list) else []
    methods = [str(m) for m in methods]

    replacements = {
        "{{TITLE}}": title,
        "{{YEAR}}": year,
        "{{SUMMARY}}": summary,
        "{{ROLE}}": role,
        "{{METHODS_LIST}}": make_methods_list(methods),
        "{{METHODS_PILLS}}": make_methods_pills(methods),
        "{{WHY_IT_MATTERS}}": make_why_it_matters(summary),
        "{{TIMELINE}}": year or "(to be added)",
        "{{NAV_ACTIVE_PROJECTS}}": "active",
    }

    output = template
    for key, value in replacements.items():
        output = output.replace(key, value)
    return output


def write_file(path: str, content: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def write_index_redirect(path: str) -> None:
    content = """<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta http-equiv=\"refresh\" content=\"0; url=../projects.html\" />
  <title>Projects</title>
</head>
<body>
  <p>Redirecting to <a href=\"../projects.html\">projects</a>...</p>
</body>
</html>
"""
    write_file(path, content)


def main() -> int:
    if not os.path.exists(PROJECTS_JSON):
        raise RuntimeError("assets/data/projects.json not found")
    if not os.path.exists(TEMPLATE_PATH):
        raise RuntimeError("projects/project-template.html not found")

    data = load_json(PROJECTS_JSON)
    projects = data.get("projects") if isinstance(data, dict) else []
    if not isinstance(projects, list):
        projects = []

    template = load_template(TEMPLATE_PATH)

    generated_paths: List[str] = []

    if projects:
        for project in projects:
            if not isinstance(project, dict):
                continue
            slug = sanitize_slug(str(project.get("slug", "project")))
            output_path = os.path.join(OUTPUT_DIR, f"{slug}.html")
            html_content = render_project(template, project)
            write_file(output_path, html_content)
            generated_paths.append(output_path)

    write_index_redirect(INDEX_PATH)

    print(f"Generated {len(generated_paths)} project page(s)")
    for path in generated_paths:
        print(f"- {path}")
    print(f"- {INDEX_PATH}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}")
        sys.exit(1)
