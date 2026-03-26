(function (global) {
  const module = () => {
    const container = document.getElementById('github-projects-grid');
    if (!container) return;

    const DATA_URL = 'assets/data/github_projects.json';
    const FETCH_TIMEOUT_MS = 10000;

    const escapeHtml = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const withTimeout = (url, timeoutMs = FETCH_TIMEOUT_MS) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
    };

    const renderError = (msg) => {
      container.innerHTML = `
        <div class="card">
          <p>${escapeHtml(msg)}</p>
          <button type="button" class="btn ghost" data-gh-retry>Retry</button>
        </div>`;
      const btn = container.querySelector('[data-gh-retry]');
      if (btn) btn.addEventListener('click', load);
    };

    const renderImage = (project) => {
      if (!project.image) return '';
      return `
        <div class="github-project-card__img-wrap">
          <img
            class="github-project-card__img"
            src="${escapeHtml(project.image)}"
            alt="${escapeHtml(project.title)} preview"
            loading="lazy"
            onerror="this.closest('.github-project-card__img-wrap').style.display='none'"
          />
        </div>`;
    };

    const renderTopics = (project) => {
      const topics = project.topics || [];
      const privateBadge = project.private
        ? `<span class="badge github-project-card__private-badge" title="Repository is currently private">Private</span>`
        : '';
      if (!topics.length && !privateBadge) return '';
      return `
        <div class="tag-list">
          ${privateBadge}
          ${topics.map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}
        </div>`;
    };

    const load = () => withTimeout(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const projects = data.projects || [];
        const profile = data.profile || {};

        const profileBanner = profile.url ? `
          <div class="github-profile-banner">
            <svg class="github-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span>${escapeHtml(profile.label || 'GitHub Profile')}</span>
            <a class="btn ghost" href="${escapeHtml(profile.url)}" target="_blank" rel="noopener noreferrer">
              Open profile ↗
            </a>
          </div>` : '';

        if (profileBanner) {
          const bannerEl = document.getElementById('github-profile-banner');
          if (bannerEl) bannerEl.innerHTML = profileBanner;
        }

        if (!projects.length) {
          container.innerHTML = '<div class="card"><p>No projects listed yet.</p></div>';
          return;
        }

        container.innerHTML = projects.map((project) => `
          <article class="card github-project-card">
            ${renderImage(project)}
            <h3 class="github-project-card__title">${escapeHtml(project.title)}</h3>
            <p class="github-project-card__desc">${escapeHtml(project.description)}</p>
            ${renderTopics(project)}
            <a class="btn ghost github-project-card__link" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">
              View on GitHub ↗
            </a>
          </article>`).join('');
      })
      .catch(() => renderError('GitHub projects data is not available at the moment.'));

    load();
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.githubProjects = module;
})(window);
