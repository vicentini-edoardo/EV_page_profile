# Edoardo Vicentini Website

Static multi-page academic website published with GitHub Pages.

## Stack
- Static HTML/CSS/JS (no framework build)
- Data-driven sections from `assets/data/*.json`
- GitHub Actions deployment

## Local development

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Useful scripts

```bash
# Regenerate project detail pages from template + data
python3 scripts/generate_projects_pages.py

# Regenerate award image manifests
python3 scripts/generate_award_manifests.py

# Sync publications from OpenAlex
OPENALEX_API_KEY=... OPENALEX_MAILTO=you@example.com python3 scripts/update_publications_openalex.py
```

## Repository structure
- `index.html`, `research.html`, `publications.html`, `cv.html`, ...: page entry points
- `projects/`: generated project pages + `project-template.html`
- `assets/css/`: design layers (`tokens.css`, `base-core.css`, `components.css`, `pages.css`) + `base.css` importer
- `assets/js/core/`: shared utilities and layout loader
- `assets/js/pages/`: page-specific behavior modules
- `assets/partials/`: shared header/footer fragments injected client-side
- `assets/data/`: structured content data
- `scripts/`: content generation/sync utilities
- `/_archive_unused/`: archived legacy/unused files for rollback

## GitHub Pages deployment
- Workflow: `.github/workflows/deploy.yml`
- Trigger: push to `main`
- Publish model: upload generated static artifact from repo root (excluding archive folder)
- `scripts/generate_projects_pages.py` is executed during deploy before artifact upload

## Notes
- Public URLs are preserved; avoid renaming existing page paths without redirect stubs.
- Keep generated project pages in sync by re-running the generator after editing `projects/project-template.html`.
