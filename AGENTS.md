# Repository Guidelines

## Project Structure & Module Organization
This repository is a static academic website for GitHub Pages.
- Root pages: `index.html`, `research.html`, `publications.html`, `projects.html`, `awards.html`, `conference.html`, `cv.html`, `contact.html`.
- Frontend assets: `assets/css/` (`base.css`, `print.css`), `assets/js/` (`core/`, `features/`, `pages/`, `main.js`).
- Data sources: `assets/data/*.json` (projects, publications, awards, funding, conference).
- Generated project pages: `projects/*.html` from `projects/project-template.html` + `assets/data/projects.json`.
- Automation scripts: `scripts/`.
- CI/CD: `.github/workflows/`.

## Build, Test, and Development Commands
- `python3 scripts/generate_projects_pages.py`: regenerate `projects/*.html` and `projects/index.html` redirect.
- `python3 scripts/generate_award_manifests.py`: regenerate `assets/img/awards/<slug>/images.json` from image folders.
- `OPENALEX_API_KEY=... OPENALEX_MAILTO=you@example.com python3 scripts/update_publications_openalex.py`: refresh publications data.
- `python3 -m http.server 8000`: local preview at `http://localhost:8000`.

## Coding Style & Naming Conventions
- Use 2 spaces in HTML/CSS/JSON; keep Python PEP 8-compatible (4 spaces).
- Prefer semantic, lowercase, hyphenated filenames (example: `dual-comb-hyperspectral-imaging.html`).
- Keep JS modular: shared utilities in `assets/js/core/` or `assets/js/features/`; page-specific logic in `assets/js/pages/`.
- Preserve existing data contracts in `assets/data/*.json`; avoid ad-hoc keys.

## Testing Guidelines
There is no formal automated test suite yet.
- Validate changes with local preview and click-through checks across edited pages.
- After data/script changes, verify: `projects.html`, at least one generated project page, `publications.html`, and `conference.html` links.
- For workflow-sensitive updates, inspect `.github/workflows/*.yml` and run the corresponding script locally first.

## Commit & Pull Request Guidelines
Git history currently uses short, minimal messages (examples: `update research`, `fix indexing`, `new images`). Prefer clearer imperative commits, optionally scoped:
- `content: update research summary`
- `scripts: fix project slug sanitization`

For PRs, include:
- Purpose and affected pages/files.
- Before/after screenshots for visual changes.
- Linked issue (if any) and manual verification steps.
