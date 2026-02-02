# Edoardo Vicentini - Academic Personal Website

A multi-page, academic-first personal website designed for GitHub Pages. It uses static HTML/CSS/JS with data-driven publications and projects.

## Structure

- `index.html`, `research.html`, `publications.html`, `projects.html`, `funding.html`, `teaching.html`, `talks.html`, `resources.html`, `cv.html`, `contact.html`
- `assets/` contains CSS, JS, data, and SVG illustrations
- `projects/` contains individual project pages
- `CV/` contains a placeholder PDF
- `.github/workflows/deploy.yml` deploys to GitHub Pages

## Publish with GitHub Pages (Actions)

1. Create a new GitHub repository (or use an existing one).
2. Push this project to the repository (default branch: `main`).
3. In the GitHub repo settings, go to **Pages**.
4. Under **Build and deployment**, select **GitHub Actions**.
5. Push any change to `main` to trigger the workflow.
6. After the workflow completes, your site will be available at:
   `https://<username>.github.io/<repo>/`

## Customize

- Run the ORCID sync or edit `assets/data/publications.overrides.json`; update `assets/data/projects.json` for projects.
- Replace `CV/CV_placeholder.pdf` with your real CV.
- Swap SVGs in `assets/img/` with real figures or photos.
- Update content text directly in the HTML files.


## ORCID sync

The workflow `scripts/update_publications_from_orcid.py` pulls works from ORCID v3.0 and generates:

- `assets/data/publications.orcid.json` (raw ORCID-derived list)
- `assets/data/publications.overrides.json` (curated overrides)
- `assets/data/publications.json` (merged output used by the site)

Run locally (requires ORCID API credentials):

```
ORCID_CLIENT_ID=... ORCID_CLIENT_SECRET=... ORCID_ID=0000-0003-1850-2327 ORCID_ENV=prod python scripts/update_publications_from_orcid.py
```

Do not edit `assets/data/publications.json` by hand; use overrides.
If ORCID returns no works, a placeholder entry is written and marked as such.

## Overrides

Edit `assets/data/publications.overrides.json` to curate entries. Overrides match by `doi` (case-insensitive) or `id`.

Example:

```
[
  {
    "doi": "10.1038/s41563-025-02412-6",
    "selected": true,
    "tags": ["polaritons", "ultrastrong coupling"],
    "my_role": "Lead author; experiment and analysis",
    "authors": ["E. Vicentini", "X. Arrieta", "M. Schnell"],
    "links": {
      "pdf": "https://...",
      "code": "https://..."
    }
  }
]
```

## GitHub Secrets

Set these in the repository Settings -> Secrets and variables -> Actions:

- `ORCID_CLIENT_ID`
- `ORCID_CLIENT_SECRET`
- `ORCID_ID` (optional; defaults to 0000-0003-1850-2327)
- `ORCID_ENV` (optional: `prod` or `sandbox`)

## Troubleshooting

- **401 / invalid_client**: check ORCID client ID/secret and ensure you are using the correct ORCID environment.
- **429 rate limiting**: the script retries with backoff; re-run later if the API is throttling.
- **Scheduled workflow delays**: GitHub Actions scheduled runs can be delayed; use workflow_dispatch to run immediately.

## Build

Run the project page generator before deployment:

```
python3 scripts/generate_projects_pages.py
```

## Local preview

Open any HTML file in a browser. For full fetch support, use a simple local server (e.g. `python -m http.server`).

## License

MIT - see `LICENSE`.


<!--
Project pages checklist:
- Run generator locally: python3 scripts/generate_projects_pages.py
- Open projects.html and click through each project page
- Confirm dark mode works within /projects/*.html
-->
