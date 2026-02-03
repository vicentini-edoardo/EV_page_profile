# Edoardo Vicentini - Academic Personal Website

A multi-page, academic-first personal website designed for GitHub Pages. It uses static HTML/CSS/JS with data-driven publications and projects.

## Structure

- `index.html`, `research.html`, `publications.html`, `projects.html`, `funding.html`, `teaching.html`, `conference.html`, `resources.html`, `cv.html`, `contact.html`
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

- Run the OpenAlex sync to update publications; update `assets/data/projects.json` for projects.
- Replace `CV/CV_placeholder.pdf` with your real CV.
- Swap SVGs in `assets/img/` with real figures or photos.
- Update content text directly in the HTML files.

## GitHub Secrets

Set these in the repository Settings -> Secrets and variables -> Actions:
- OPENALEX_API_KEY
- OPENALEX_MAILTO (optional)
- ORCID_ID (optional; defaults to 0000-0003-1850-2327)

## Troubleshooting

- **401 / invalid_api_key**: check that OPENALEX_API_KEY is set and valid.
- **429 rate limiting**: the script retries with backoff; re-run later if the API is throttling.
- **Scheduled workflow delays**: GitHub Actions scheduled runs can be delayed; use workflow_dispatch to run immediately.

## OpenAlex publications sync

Publications are sourced from OpenAlex (not ORCID).

Run locally:

```
OPENALEX_API_KEY=... OPENALEX_MAILTO=you@example.com python scripts/update_publications_openalex.py
```

OpenAlex citation bars use counts_by_year for the last five years.




## Conference PDFs

Update `assets/data/conference.json` to add or edit presentations; the `slug` must match the PDF filename.

Add PDFs to `assets/files/conference/<slug>.pdf`. If the file is missing, the page shows "PDF coming soon".
The conference page provides download links only (no inline preview).

## Award photo slideshows

Award photos are loaded from per-award folders using a manifest file:

- Folder: `assets/img/awards/<award_slug>/`
- Manifest: `assets/img/awards/<award_slug>/images.json`

Example `images.json`:

```
{
  "images": ["photo1.jpg", "photo2.png", "photo3.webp"]
}
```

Supported formats: .jpg, .jpeg, .png, .webp.
Slideshows rotate every 3.5 seconds and pause on hover.

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

## Maintenance

## Update website text

- Edit Markdown in `content/` (research + CV intros).
- Structured lists live in `assets/data/*.json`.

See `MAINTENANCE.md` for the folder structure and editing guidelines.
