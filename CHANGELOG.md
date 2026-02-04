# Changelog

## 2026-02-04
- Introduced a design-token system in `assets/css/base.css` (colors, spacing, radius, shadows, typography scale) and normalized section spacing, cards, links, buttons, and focus states for consistent UX.
- Refined the homepage hero with a clearer hierarchy, CV call-to-action, and explicit image sizing to reduce layout shift.
- Standardized footer and header metadata with `data-site` attributes and centralized values in `assets/js/main.js`.
- Added markdown heading anchors for research pillars and enabled ID parsing in the markdown renderer to keep pillar links stable.
- Updated publication image wiring to map DOI → folder path and load per-folder `images.json` manifests.
- Streamlined CSS loading by removing unused page/component styles and referencing `assets/css/base.css` directly.
- Optimized award slideshow assets to WebP, updated manifests, and removed legacy JPG/JPEG duplicates.
- Cleaned redirect stubs (`talks.html`, `teaching.html`) to use shared section spacing styles.
- Added canonical URLs and meta descriptions across all pages, plus Person JSON-LD on the homepage to improve search visibility.
- Added `robots.txt` and `sitemap.xml`, and aligned the project index redirect with the canonical `/projects.html` URL.
