# Maintenance Guide

## Folder structure

- Root HTML pages: `index.html`, `research.html`, `publications.html`, `projects.html`, `funding.html`, `awards.html`, `conference.html`, `cv.html`, `contact.html`, `talks.html` (redirect stub).
- CSS: `assets/css/styles.css` (imports base/components/page files).
  - Base styles: `assets/css/base.css`
  - Components: `assets/css/components.css`
  - Page overrides: `assets/css/pages/*.css`
- JS: `assets/js/`
  - Core helpers: `assets/js/core/`
  - Shared features: `assets/js/features/`
  - Page modules: `assets/js/pages/`
  - Bootstrap: `assets/js/main.js`
- Data: `assets/data/`
- Images: `assets/img/` (including awards photo manifests)
- PDFs: `assets/files/` (conference PDFs), `CV/` (CV PDFs)
- Scripts: `scripts/`
- Workflows: `.github/workflows/`

## Editing content

- Narrative text (Research + CV intros): edit `/content/*.md`
- Research page: `research.html` (structure only)
- Publications: `assets/data/publications.json` (generated via OpenAlex script)
- Projects: `assets/data/projects.json`
- Funding: `assets/data/funding.json`
- Awards: `assets/data/awards.json`
- Conference: `assets/data/conference.json`

## Photos

- Awards photos: `assets/img/awards/<award_slug>/images.json` with listed images.

## PDFs

- Conference PDFs: `assets/files/conference/<slug>.pdf`
- CV PDFs: `CV/CV_Edoardo Vicentini.pdf`, `CV/CV_EV.pdf`

## OpenAlex updates

- Publications sync: `scripts/update_publications_openalex.py`
- Workflow: `.github/workflows/update-openalex-publications.yml`

## Notes

- Awards slideshow uses `assets/js/features/slideshow.js`.
- Research view toggle uses `assets/js/features/toggleView.js`.
- `talks.html` remains a redirect to `conference.html` for backward compatibility.

## Publication images

- Map DOI to one or more images in `assets/data/publication_images.json`.
- Example: `"10.1038/s41566-021-00892-x": ["assets/img/publications/dual-comb-1.jpg", "assets/img/publications/dual-comb-2.jpg"]`
- Place images in `assets/img/publications/`.
