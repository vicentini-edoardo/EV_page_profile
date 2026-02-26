(function (global) {
  const module = () => {
    const container = document.getElementById('awards-content');
    if (!container) return;
    if (!global.SlideshowManager) return;

    const SLIDESHOW_INTERVAL_MS = 3500;
    const DATA_URL = 'assets/data/awards.json';
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
          <button type="button" class="btn ghost" data-awards-retry>Retry</button>
        </div>`;
      const retry = container.querySelector('[data-awards-retry]');
      if (retry) retry.addEventListener('click', loadAwards);
    };

    const renderAward = (award) => {
      const paragraphs = (award.description || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');

      return `
      <article class="award-card" data-slug="${escapeHtml(award.slug)}">
        <div class="award-media">
          <div class="award-slideshow" data-award-title="${escapeHtml(award.title)}" data-award-year="${escapeHtml(award.year)}">
            <div class="award-placeholder">Award photos available upon request.</div>
          </div>
        </div>
        <div>
          <h3>${escapeHtml(award.title)} (${escapeHtml(award.year)})</h3>
          ${award.subtitle ? `<p class="award-subtitle">${escapeHtml(award.subtitle)}</p>` : ''}
          ${paragraphs}
        </div>
      </article>`;
    };

    const loadImages = (slug) => {
      const safeSlug = encodeURIComponent(String(slug || '').trim());
      if (!safeSlug) return Promise.resolve([]);
      const manifestUrl = `assets/img/awards/${safeSlug}/images.json`;
      return fetch(manifestUrl)
        .then((response) => {
          if (!response.ok) return null;
          return response.json();
        })
        .then((data) => {
          if (!data || !Array.isArray(data.images)) return [];
          return data.images
            .filter((name) => name)
            .map((name) => ({
              src: `assets/img/awards/${safeSlug}/${encodeURIComponent(name)}`,
              alt: ''
            }));
        })
        .catch(() => []);
    };

    const loadAwards = () => withTimeout(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        global.SlideshowManager.clear();
        const awards = data.awards || [];
        if (!awards.length) {
          container.innerHTML = `
            <div class="card">
              <p>No awards are available yet.</p>
            </div>`;
          return;
        }
        container.innerHTML = awards.map(renderAward).join('');

        const slideshowNodes = Array.from(container.querySelectorAll('.award-slideshow'));
        const tasks = slideshowNodes.map((node) => {
          const card = node.closest('.award-card');
          if (!card) return Promise.resolve();
          const slug = card.dataset.slug;
          const title = node.dataset.awardTitle || 'Award';
          const year = node.dataset.awardYear || '';
          const altBase = `Award photo - ${title}${year ? ` (${year})` : ''}`;

          return loadImages(slug).then((images) => {
            if (!images.length) return;
            global.SlideshowManager.createSlideshow({
              container: node,
              images,
              intervalMs: SLIDESHOW_INTERVAL_MS,
              altBase,
              enableLightbox: true
            });
          });
        });

        Promise.all(tasks).then(() => {
          if (document.visibilityState === 'visible') {
            global.SlideshowManager.setGlobalPaused(false);
          } else {
            global.SlideshowManager.setGlobalPaused(true);
          }
        });
      })
      .catch(() => {
        renderErrorState('Awards data is not available at the moment.');
      });

    loadAwards();
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.awards = module;
})(window);
