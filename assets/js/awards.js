(function () {
  const container = document.getElementById('awards-content');
  if (!container) return;

  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-image');
  const modalCaption = document.getElementById('lightbox-caption');
  const modalClose = document.getElementById('lightbox-close');
  const modalPrev = document.getElementById('lightbox-prev');
  const modalNext = document.getElementById('lightbox-next');

  const SLIDESHOW_INTERVAL_MS = 3500;
  const slideshows = [];
  let listenersBound = false;
  let globalPaused = false;

  const lightboxState = {
    images: [],
    index: 0
  };

  const openModal = (images, index, title) => {
    if (!images.length) return;
    lightboxState.images = images;
    lightboxState.index = index;
    const current = images[index];
    modalImg.src = current.src;
    modalImg.alt = current.alt || title || 'Award photo';
    modalCaption.textContent = current.alt || title || '';
    modal.classList.add('open');
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modalImg.src = '';
    modalCaption.textContent = '';
    lightboxState.images = [];
    lightboxState.index = 0;
  };

  const stepModal = (dir) => {
    if (!lightboxState.images.length) return;
    lightboxState.index = (lightboxState.index + dir + lightboxState.images.length) % lightboxState.images.length;
    const current = lightboxState.images[lightboxState.index];
    modalImg.src = current.src;
    modalImg.alt = current.alt || modalImg.alt;
    modalCaption.textContent = current.alt || '';
  };

  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', () => stepModal(-1));
  modalNext.addEventListener('click', () => stepModal(1));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft') stepModal(-1);
    if (event.key === 'ArrowRight') stepModal(1);
  });

  const createSlideshow = (containerEl, images) => {
    const imgEl = containerEl.querySelector('img');
    if (!imgEl || !images.length) return null;

    const instance = {
      container: containerEl,
      images,
      index: 0,
      intervalId: null,
      isRunning: false,
      isHovered: false,
      start() {
        if (this.isRunning || globalPaused) return;
        this.isRunning = true;
        this.intervalId = setInterval(() => {
          this.next();
        }, SLIDESHOW_INTERVAL_MS);
      },
      stop() {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        this.isRunning = false;
      },
      next() {
        if (!this.images.length) return;
        this.index = (this.index + 1) % this.images.length;
        const nextImage = this.images[this.index];
        imgEl.classList.remove('is-visible');
        setTimeout(() => {
          imgEl.src = nextImage.src;
          imgEl.alt = nextImage.alt || imgEl.alt;
          imgEl.classList.add('is-visible');
          containerEl.dataset.index = String(this.index);
        }, 200);
      }
    };

    containerEl.addEventListener('mouseenter', () => {
      instance.isHovered = true;
      instance.stop();
    });

    containerEl.addEventListener('mouseleave', () => {
      instance.isHovered = false;
      if (!globalPaused) instance.start();
    });

    return instance;
  };

  const stopAll = () => {
    slideshows.forEach((show) => show.stop());
  };

  const startAll = () => {
    slideshows.forEach((show) => {
      if (!show.isHovered) show.start();
    });
  };

  const bindVisibilityListeners = () => {
    if (listenersBound) return;
    listenersBound = true;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        globalPaused = true;
        stopAll();
      } else {
        globalPaused = false;
        startAll();
      }
    });

    window.addEventListener('blur', () => {
      globalPaused = true;
      stopAll();
    });

    window.addEventListener('focus', () => {
      if (document.visibilityState === 'visible') {
        globalPaused = false;
        startAll();
      }
    });
  };

  const destroySlideshows = () => {
    stopAll();
    slideshows.length = 0;
  };

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
    const manifestUrl = `images/Awards/${slug}/images.json`;
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
            src: `images/Awards/${slug}/${name}`,
            alt: ''
          }));
      })
      .catch(() => []);
  };

  fetch('assets/data/awards.json')
    .then((response) => response.json())
    .then((data) => {
      destroySlideshows();
      const awards = data.awards || [];
      container.innerHTML = awards.map(renderAward).join('');

      const slideshowNodes = Array.from(container.querySelectorAll('.award-slideshow'));
      const tasks = slideshowNodes.map((node) => {
        const slug = node.closest('.award-card').dataset.slug;
        const title = node.dataset.awardTitle || 'Award';
        const year = node.dataset.awardYear || '';
        return loadImages(slug).then((images) => {
          if (!images.length) return;
          const img = document.createElement('img');
          img.src = images[0].src;
          img.alt = images[0].alt || `Award photo - ${title} (${year})`;
          img.classList.add('is-visible');
          node.innerHTML = '';
          node.appendChild(img);
          node.dataset.index = '0';

          const instance = createSlideshow(node, images);
          if (instance) slideshows.push(instance);

          node.addEventListener('click', () => {
            const idx = parseInt(node.dataset.index || '0', 10) || 0;
            openModal(images, idx, title);
          });
        });
      });

      Promise.all(tasks).then(() => {
        bindVisibilityListeners();
        if (document.visibilityState === 'visible') {
          startAll();
        } else {
          globalPaused = true;
        }
      });
    })
    .catch(() => {
      container.innerHTML = '<p>Awards data is not available at the moment.</p>';
    });
})();
