(function () {
  if (window.SlideshowManager) return;

  const instances = [];
  let globalPaused = false;
  let listenersBound = false;
  let lightboxBound = false;

  const lightboxState = {
    images: [],
    index: 0,
    title: ''
  };

  const ensureLightbox = () => {
    let modal = document.getElementById('lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lightbox-modal';
      modal.className = 'lightbox';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="lightbox-content">
          <button id="lightbox-close" class="lightbox-close" type="button" aria-label="Close">&times;</button>
          <button id="lightbox-prev" class="lightbox-nav" type="button" aria-label="Previous image">&#10094;</button>
          <button id="lightbox-next" class="lightbox-nav" type="button" aria-label="Next image">&#10095;</button>
          <img id="lightbox-image" alt="" />
          <p id="lightbox-caption"></p>
        </div>
      `;
      document.body.appendChild(modal);
    }
    if (lightboxBound) return modal;

    const modalImg = modal.querySelector('#lightbox-image');
    const modalCaption = modal.querySelector('#lightbox-caption');
    const modalClose = modal.querySelector('#lightbox-close');
    const modalPrev = modal.querySelector('#lightbox-prev');
    const modalNext = modal.querySelector('#lightbox-next');

    const closeModal = () => {
      modal.classList.remove('open');
      modalImg.src = '';
      modalCaption.textContent = '';
      lightboxState.images = [];
      lightboxState.index = 0;
      lightboxState.title = '';
    };

    const stepModal = (dir) => {
      if (!lightboxState.images.length) return;
      lightboxState.index = (lightboxState.index + dir + lightboxState.images.length) % lightboxState.images.length;
      const current = lightboxState.images[lightboxState.index];
      modalImg.src = current.src;
      modalImg.alt = current.alt || lightboxState.title || 'Photo';
      modalCaption.textContent = current.alt || lightboxState.title || '';
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

    lightboxBound = true;
    return modal;
  };

  const openLightbox = (images, index, title) => {
    if (!images.length) return;
    const modal = ensureLightbox();
    const modalImg = modal.querySelector('#lightbox-image');
    const modalCaption = modal.querySelector('#lightbox-caption');
    lightboxState.images = images;
    lightboxState.index = index;
    lightboxState.title = title || '';
    const current = images[index];
    modalImg.src = current.src;
    modalImg.alt = current.alt || title || 'Photo';
    modalCaption.textContent = current.alt || title || '';
    modal.classList.add('open');
  };

  const stopAll = () => {
    instances.forEach((show) => show.stop());
  };

  const startAll = () => {
    instances.forEach((show) => {
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

  const createSlideshow = ({
    container,
    images,
    intervalMs = 3500,
    altBase = '',
    enableLightbox = true
  }) => {
    if (!container || !images || !images.length) return null;

    bindVisibilityListeners();
    const normalized = images.map((img) => {
      if (typeof img === 'string') {
        return { src: img, alt: altBase };
      }
      return {
        src: img.src,
        alt: img.alt || altBase
      };
    });

    let imgEl = container.querySelector('img');
    if (!imgEl) {
      imgEl = document.createElement('img');
      container.innerHTML = '';
      container.appendChild(imgEl);
    }

    imgEl.loading = 'lazy';
    imgEl.decoding = 'async';
    imgEl.src = normalized[0].src;
    imgEl.alt = normalized[0].alt || altBase;
    imgEl.classList.add('is-visible');
    container.dataset.index = '0';

    const instance = {
      container,
      images: normalized,
      index: 0,
      intervalId: null,
      isRunning: false,
      isHovered: false,
      start() {
        if (this.isRunning || globalPaused) return;
        this.isRunning = true;
        this.intervalId = setInterval(() => {
          if (document.visibilityState !== 'visible' || globalPaused) {
            this.stop();
            return;
          }
          this.next();
        }, intervalMs);
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
          container.dataset.index = String(this.index);
        }, 200);
      }
    };

    container.addEventListener('mouseenter', () => {
      instance.isHovered = true;
      instance.stop();
    });

    container.addEventListener('mouseleave', () => {
      instance.isHovered = false;
      if (!globalPaused) instance.start();
    });

    if (enableLightbox) {
      container.addEventListener('click', () => {
        const idx = parseInt(container.dataset.index || '0', 10) || 0;
        openLightbox(normalized, idx, altBase);
      });
    }

    instances.push(instance);
    if (document.visibilityState === 'visible' && !globalPaused) {
      instance.start();
    } else {
      globalPaused = true;
    }

    return instance;
  };

  const clear = () => {
    stopAll();
    instances.length = 0;
  };

  window.SlideshowManager = {
    createSlideshow,
    clear,
    startAll,
    stopAll,
    setGlobalPaused: (value) => {
      globalPaused = value;
      if (globalPaused) {
        stopAll();
      } else {
        startAll();
      }
    }
  };
})();
