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

- Update `assets/data/publications.json` and `assets/data/projects.json`.
- Replace `CV/CV_placeholder.pdf` with your real CV.
- Swap SVGs in `assets/img/` with real figures or photos.
- Update content text directly in the HTML files.

## Local preview

Open any HTML file in a browser. For full fetch support, use a simple local server (e.g. `python -m http.server`).

## License

MIT - see `LICENSE`.
