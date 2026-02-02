(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark');
      themeToggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    }
  }

  const storedTheme = localStorage.getItem('theme');
  const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (preferredDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
    });
  }

  const navLinks = document.querySelectorAll('.nav a');
  const currentPath = window.location.pathname.replace(/\/$/, '/index.html');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPath = new URL(href, window.location.href).pathname;
    const isProjectPage = currentPath.includes('/projects/') && linkPath.endsWith('/projects.html');
    if (currentPath === linkPath || isProjectPage) {
      link.classList.add('active');
    }
  });

  const selectedList = document.getElementById('selected-publications');
  if (selectedList) {
    const formatAuthors = (pub) => {
      if (Array.isArray(pub.authors)) return pub.authors.join(', ');
      if (typeof pub.authors === 'string') return pub.authors;
      return '';
    };

    fetch('assets/data/publications.json')
      .then((response) => response.json())
      .then((data) => {
        const publications = Array.isArray(data) ? data : (data.publications || []);
        const sorted = publications.slice().sort((a, b) => {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          if (yearA !== yearB) return yearB - yearA;
          return (a.title || '').localeCompare(b.title || '');
        });
        const items = sorted.slice(0, 3);
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

  const copyButton = document.querySelector('[data-copy-email]');
  if (copyButton) {
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

  const demoCanvas = document.getElementById('demo-canvas');
  const demoSlider = document.getElementById('demo-slider');
  if (demoCanvas && demoSlider) {
    const ctx = demoCanvas.getContext('2d');
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
    window.addEventListener('resize', resize);
    resize();
  }
})();
