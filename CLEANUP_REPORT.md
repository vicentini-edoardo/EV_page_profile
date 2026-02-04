# Cleanup Report

## Removed files
- `assets/css/components.css` (empty placeholder file; styles consolidated in `assets/css/base.css`).
- `assets/css/pages/awards.css`
- `assets/css/pages/conference.css`
- `assets/css/pages/cv.css`
- `assets/css/pages/funding.css`
- `assets/css/pages/projects.css`
- `assets/css/pages/publications.css`
- `assets/css/pages/research.css` (all page overrides were empty; removed with directory).
- `assets/css/styles.css` (import-only bundle; pages now link to `assets/css/base.css` directly).
- `assets/img/conference/` (only empty `images.json` placeholders and `.gitkeep`; not referenced).
- `assets/img/nano-figure.svg`, `assets/img/polariton-figure.svg` (only referenced by deleted placeholder project pages).
- `projects/project-01.html`, `projects/project-02.html`, `projects/project-03.html` (stale placeholder pages not generated from data).
- `assets/img/awards/bernard-couillaud-prize/Social Media - Couillaud E Vicentini.png` (replaced by WebP).
- Legacy award JPG/JPEGs replaced by WebP:
  - `assets/img/awards/bernard-couillaud-prize/20230627_CLEO_Europe-EQEC_1.jpeg`
  - `assets/img/awards/bernard-couillaud-prize/20230627_CLEO_Europe-EQEC_2.jpeg`
  - `assets/img/awards/bernard-couillaud-prize/Laser2023_mb_10403.jpg`
  - `assets/img/awards/bernard-couillaud-prize/Laser2023_mb_10415.jpg`
  - `assets/img/awards/helmholtz-prize/D2602_093_red.jpg`
  - `assets/img/awards/helmholtz-prize/D2602_098_red.jpg`
  - `assets/img/awards/helmholtz-prize/D2602_103_red.jpg`
  - `assets/img/awards/helmholtz-prize/D2602_114_red.jpg`
  - `assets/img/awards/helmholtz-prize/D2602_119_red.jpg`
  - `assets/img/awards/helmholtz-prize/D2602_123_red.jpg`
  - `assets/img/awards/best-scientific-communication/108° Congresso Nazionale- SIF 2022.jpg`

## Refactors
- Consolidated global styling into `assets/css/base.css` and added a full design-token section (colors, spacing, radii, shadows, typography scale).
- Centralized repeated site metadata in `assets/js/main.js` and applied via `data-site` attributes (name, affiliation, email, ORCID, CV links).
- Updated the markdown renderer to support `{#id}` heading anchors and added anchors to research content.
- Switched publication image mapping to DOI → folder paths, with per-folder `images.json` manifests.
- Normalized CTA styling in project cards and added consistent focus styles.

## Risky changes + mitigations
- **CSS bundle removal:** `assets/css/styles.css` removed in favor of direct `base.css` links. Mitigated by updating every HTML entry point to point to `base.css`.
- **Research anchor links:** Anchors now come from markdown `{#id}` syntax. Mitigated by adding ID parsing in the markdown renderer and verifying link targets.
- **WebP slideshow updates:** Awards manifests now reference `.webp`. Legacy `.jpg/.jpeg` duplicates were removed after verification.
- **Project page regeneration:** Regenerated pages from `assets/data/projects.json` to align with the updated template.

## Notes (kept per request)
- Existing unexpected assets (e.g., additional `assets/img/publications/` folders and `.DS_Store` files) were preserved.
- `assets/data/awards.json` contains non-trivial content updates outside the scope of style changes; kept as-is.
