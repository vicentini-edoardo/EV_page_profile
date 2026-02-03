(function (global) {
  const module = () => {
    const container = document.getElementById('awards-content');
    if (!container) return;
    if (!global.SlideshowManager) return;

    const SLIDESHOW_INTERVAL_MS = 3500;

    const renderAward = (award) => {
      const paragraphs = (award.description || []).map((p) => `<p>${p}</p>`).join('');

      return `
      <article class="award-card" data-slug="${award.slug}">
        <div class="award-media">
          <div class="award-slideshow" data-award-title="${award.title}" data-award-year="${award.year}">
            <div class="award-placeholder">Award photos available upon request.</div>
          </div>
        </div>
        <div>
          <h3>${award.title} (${award.year})</h3>
          ${award.subtitle ? `<p class="award-subtitle">${award.subtitle}</p>` : ''}
          ${paragraphs}
        </div>
      </article>`;
    };

    const loadImages = (slug) => {
      const manifestUrl = `assets/img/awards/${slug}/images.json`;
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
              src: `assets/img/awards/${slug}/${name}`,
              alt: ''
            }));
        })
        .catch(() => []);
    };

    fetch('assets/data/awards.json')
      .then((response) => response.json())
      .then((data) => {
        global.SlideshowManager.clear();
        const awards = data.awards || [];
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
        container.innerHTML = '<p>Awards data is not available at the moment.</p>';
      });
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.awards = module;
})(window);
