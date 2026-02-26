(function (global) {
  const module = () => {
    const container = document.getElementById('projects-grid');
    if (!container) return;
    const isCvPage = Boolean(document.getElementById('cv-page-body'));
    const DATA_URL = 'assets/data/projects.json';
    const FETCH_TIMEOUT_MS = 10000;

    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const withTimeout = (url, options, timeoutMs = FETCH_TIMEOUT_MS) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(url, { ...options, signal: controller.signal }).finally(() => {
        clearTimeout(timeoutId);
      });
    };

    const renderErrorState = (message) => {
      container.innerHTML = `
        <div class="card">
          <p>${escapeHtml(message)}</p>
          <button type="button" class="btn ghost" data-projects-retry>Retry</button>
        </div>`;
      const retry = container.querySelector('[data-projects-retry]');
      if (retry) retry.addEventListener('click', loadProjects);
    };

    const projectHref = (slug) => {
      const safeSlug = String(slug || '').trim();
      if (!safeSlug) return 'projects.html';
      return `projects/${encodeURIComponent(safeSlug)}.html`;
    };

    const loadProjects = () => withTimeout(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const projects = data.projects || [];
        if (!projects.length) {
          container.innerHTML = `
            <div class="card">
              <p>No projects are available yet.</p>
            </div>`;
          return;
        }
        if (isCvPage) {
          const compactProjects = projects
            .slice()
            .sort((a, b) => (b.year || 0) - (a.year || 0))
            .slice(0, 4);

          container.classList.add('cv-projects-list');
          container.innerHTML = compactProjects
            .map((project) => {
              return `
                <article class="cv-project-item">
                  <div class="cv-project-item__head">
                    <h3 class="cv-project-item__title">${escapeHtml(project.title)}</h3>
                    ${project.year ? `<span class="cv-project-item__year">${escapeHtml(project.year)}</span>` : ''}
                  </div>
                  ${project.summary ? `<p class="cv-project-item__summary">${escapeHtml(project.summary)}</p>` : ''}
                  <a class="cv-project-item__link" href="${projectHref(project.slug)}">Open project</a>
                </article>`;
            })
            .join('');
          return;
        }

        container.innerHTML = projects
          .map((project) => {
            return `
              <article class="card project-card">
                <h3>${escapeHtml(project.title)}</h3>
                <p class="meta">${escapeHtml(project.year)}</p>
                <p>${escapeHtml(project.summary)}</p>
                <p class="meta"><strong>Role:</strong> ${escapeHtml(project.role)}</p>
                <div class="tag-list">${(project.methods || []).map((m) => `<span class="badge">${escapeHtml(m)}</span>`).join('')}</div>
                <a class="btn ghost" href="${projectHref(project.slug)}">Open project</a>
              </article>`;
          })
          .join('');
      })
      .catch(() => {
        renderErrorState('Projects data is not available at the moment.');
      });

    loadProjects();
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.projects = module;
})(window);
