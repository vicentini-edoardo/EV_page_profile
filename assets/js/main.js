(function (global) {
  const { qs, qsa } = global.DOM || { qs: (s, c) => (c || document).querySelector(s), qsa: (s, c) => Array.from((c || document).querySelectorAll(s)) };

  function initThemeToggle() {
    const root = document.documentElement;
    const themeToggle = qs('#theme-toggle');

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      if (themeToggle) {
        themeToggle.setAttribute('aria-pressed', theme === 'dark');
        themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
      }
    }

    const storedTheme = global.StorageUtil ? global.StorageUtil.get('theme') : localStorage.getItem('theme');
    const preferredDark = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (preferredDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        if (global.StorageUtil) {
          global.StorageUtil.set('theme', next);
        } else {
          localStorage.setItem('theme', next);
        }
        applyTheme(next);
      });
    }
  }

  function initActiveNav() {
    const navLinks = qsa('.nav a');
    const currentPath = global.location.pathname.replace(/\/$/, '/index.html');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkPath = new URL(href, global.location.href).pathname;
      const isProjectPage = currentPath.includes('/projects/') && linkPath.endsWith('/projects.html');
      if (currentPath === linkPath || isProjectPage) {
        link.classList.add('active');
      }
    });
  }

  function initSelectedPublications() {
    const selectedList = qs('#selected-publications');
    if (!selectedList) return;

    const normalizeDoi = (doi) => {
      if (!doi) return '';
      return String(doi).replace(/^https?:\/\/doi\.org\//i, '').trim().toLowerCase();
    };

    const formatAuthors = (pub) => {
      if (Array.isArray(pub.authors)) return pub.authors.join(', ');
      if (typeof pub.authors === 'string') return pub.authors;
      return '';
    };

    Promise.all([
      fetch('assets/data/publications.json').then((r) => r.json()).catch(() => []),
      fetch('assets/data/publications.selected.json').then((r) => r.json()).catch(() => [])
    ])
      .then(([pubData, selectedData]) => {
        const publications = Array.isArray(pubData) ? pubData : (pubData.publications || []);
        const selectedDois = Array.isArray(selectedData) ? selectedData.map((d) => normalizeDoi(d)).filter(Boolean) : [];
        const sorted = publications.slice().sort((a, b) => {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          if (yearA !== yearB) return yearB - yearA;
          return (a.title || '').localeCompare(b.title || '');
        });
        let items = [];
        if (selectedDois.length) {
          items = sorted.filter((pub) => selectedDois.includes(normalizeDoi(pub.doi)));
        } else {
          items = sorted.filter((pub) => pub.selected);
        }
        if (!items.length) {
          selectedList.innerHTML = '<p>Selected publications are not available yet.</p>';
          return;
        }
        selectedList.innerHTML = items
          .map((pub) => {
            const authors = formatAuthors(pub);
            const journal = pub.journal || pub.venue || '';
            return `
              <div class="list-item">
                <strong>${pub.title}</strong>
                ${authors ? `<div class="meta">${authors}</div>` : ''}
                <small>${journal}${pub.year ? ` (${pub.year})` : ''}</small>
              </div>`;
          })
          .join('');
      })
      .catch(() => {
        selectedList.innerHTML = '<p>Selected publications will appear here once the data file is available.</p>';
      });
  }

  function initCopyEmail() {
    const copyButton = qs('[data-copy-email]');
    if (!copyButton) return;
    copyButton.addEventListener('click', () => {
      const email = copyButton.getAttribute('data-copy-email');
      if (!email) return;
      const showCopied = () => {
        copyButton.textContent = 'Copied';
        setTimeout(() => {
          copyButton.textContent = 'Copy email';
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(showCopied).catch(() => {});
      } else {
        showCopied();
      }
    });
  }

  function initDemo() {
    const demoCanvas = qs('#demo-canvas');
    const demoSlider = qs('#demo-slider');
    if (!demoCanvas || !demoSlider) return;
    const ctx = demoCanvas.getContext('2d');
    const root = document.documentElement;

    const draw = (value) => {
      const width = demoCanvas.width;
      const height = demoCanvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = getComputedStyle(root).getPropertyValue('--accent').trim() || '#0f5c6e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < width; x += 4) {
        const t = x / width;
        const y = height / 2 - Math.sin(t * 6.28) * (value * 0.4) * height * (0.4 + 0.6 * t);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const resize = () => {
      demoCanvas.width = demoCanvas.clientWidth;
      demoCanvas.height = demoCanvas.clientHeight;
      draw(parseFloat(demoSlider.value));
    };

    demoSlider.addEventListener('input', () => draw(parseFloat(demoSlider.value)));
    global.addEventListener('resize', resize);
    resize();
  }

  function initPageModules() {
    const modules = global.PageModules || {};
    if (qs('#research-page') && modules.research) modules.research();
    if (qs('#awards-content') && modules.awards) modules.awards();
    if (qs('#funding-content') && modules.funding) modules.funding();
    if (qs('#projects-grid') && modules.projects) modules.projects();
    if (qs('#publications-list') && modules.publications) modules.publications();
    if (qs('#conference-content') && modules.conference) modules.conference();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initActiveNav();
    initSelectedPublications();
    initCopyEmail();
    initDemo();
    initPageModules();
  });
})(window);
