(function (global) {
  const module = () => {
    const listEl = document.getElementById('publications-list');
    if (!listEl) return;

    const yearSelect = document.getElementById('filter-year');
    const typeSelect = document.getElementById('filter-type');
    const searchInput = document.getElementById('filter-search');
    const tagContainer = document.getElementById('filter-tags');
    const selectedList = document.getElementById('selected-publications-list');

    let activeTags = new Set();
    let publications = [];
    let selectedDois = [];

    function normalizeDoi(doi) {
      if (!doi) return '';
      return String(doi).replace(/^https?:\/\/doi\.org\//i, '').trim().toLowerCase();
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function formatAuthors(pub) {
      if (Array.isArray(pub.authors)) {
        return pub.authors.join(', ');
      }
      return '';
    }

    function buildVenueLine(pub) {
      const journal = pub.journal || pub.venue || '';
      const volume = pub.volume || '';
      const issue = pub.issue || '';
      const pages = pub.pages || '';
      const year = pub.year ? String(pub.year) : '';

      let line = '';
      if (journal) {
        line += `<em>${escapeHtml(journal)}</em>`;
      }

      if (volume) {
        line += `${line ? ' ' : ''}${escapeHtml(volume)}`;
      }

      if (issue) {
        line += `${volume ? '' : (line ? ' ' : '')}(${escapeHtml(issue)})`;
      }

      if (pages) {
        line += `${line ? ', ' : ''}${escapeHtml(pages)}`;
      }

      if (year) {
        line += `${line ? ' ' : ''}(${escapeHtml(year)})`;
      }

      return line ? `<div class="pub-venue">${line}</div>` : '';
    }

    function renderDoiLine(pub) {
      if (!pub.doi) return '';
      const doi = escapeHtml(pub.doi);
      return `<div class="pub-doi"><a href="${pub.doi_url || `https://doi.org/${doi}`}" target="_blank" rel="noopener">doi: ${doi}</a></div>`;
    }


    function getPublicationImages(pub) {
      if (!pub.doi) return [];
      const doiKey = normalizeDoi(pub.doi);
      if (!doiKey) return [];
      const images = imageMap[doiKey] || [];
      return Array.isArray(images) ? images : [];
    }

    function renderImages(pub) {
      const images = getPublicationImages(pub);
      if (!images.length) return '';
      const payload = encodeURIComponent(JSON.stringify(images));
      const title = escapeHtml(pub.title);
      return `<div class="pub-media pub-slideshow" data-images="${payload}" data-title="${title}"></div>`;
    }

    function renderPublication(pub) {
      const authors = formatAuthors(pub);
      const titleLink = pub.doi_url || pub.openalex_url || '#';
      const imagesHtml = renderImages(pub);
      const mediaHtml = imagesHtml ? imagesHtml : '';
      return `
      <article class="pub-item pub-row${imagesHtml ? ' has-media' : ''}">
        ${mediaHtml}
        <div class="pub-main">
          <h3 class="pub-title"><a href="${titleLink}" target="_blank" rel="noopener">${escapeHtml(pub.title)}</a></h3>
          ${authors ? `<div class="pub-authors">${escapeHtml(authors)}</div>` : ''}
          ${!authors ? '<div class="pub-authors missing">Authors: (add in overrides)</div>' : ''}
          ${buildVenueLine(pub)}
          ${renderDoiLine(pub)}
        </div>
      </article>`;
    }

    function renderSummaryChart(items) {
      const chartEl = document.getElementById('citations-summary-chart');
      if (!chartEl) return;
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 10 }, (_, idx) => currentYear - 9 + idx);
      const totals = years.map(() => 0);

      items.forEach((pub) => {
        const byYear = pub.citations_by_year || pub.citations_last5 || null;
        if (!byYear) return;
        let y = [];
        let c = [];
        if (byYear.years && byYear.counts) {
          y = byYear.years;
          c = byYear.counts;
        }
        y.forEach((year, idx) => {
          const pos = years.indexOf(year);
          if (pos !== -1) {
            totals[pos] += Number(c[idx] || 0);
          }
        });
      });

      const maxCount = Math.max(1, ...totals);
      const totalSum = totals.reduce((acc, val) => acc + val, 0);
      const chartHeight = 64;
      const chartTop = 10;
      const chartBase = chartTop + chartHeight;
      const maxScale = Math.ceil(maxCount * 1.15);

      const bars = totals.map((count, idx) => {
        const height = maxScale ? Math.round((count / maxScale) * chartHeight) : 0;
        return `
        <g>
          <rect x="${idx * 24}" y="${chartBase - height}" width="16" height="${height}" rx="2" class="pub-bar" />
          <title>${years[idx]}: ${count} citations</title>
        </g>`;
      }).join('');

      const labels = years.map((year, idx) => `
      <text x="${idx * 24 + 8}" y="82" text-anchor="middle" class="pub-bar-label">${String(year).slice(2)}</text>
    `).join('');

      const tickFractions = [0.33, 0.66, 1];
      const gridLines = tickFractions.map((fraction) => {
        const value = Math.round(maxScale * fraction);
        const y = chartBase - Math.round(chartHeight * fraction);
        return `
        <g class="pub-grid">
          <line x1="0" y1="${y}" x2="240" y2="${y}" />
          <text x="238" y="${y - 2}" text-anchor="end" class="pub-grid-label">${value}</text>
        </g>`;
      }).join('');

      chartEl.innerHTML = `
      <div class="citations-summary-total">Total citations (10 years): ${totalSum}</div>
      <svg class="pub-chart" viewBox="0 0 240 88" role="img" aria-label="Total citations over last ten years">
        ${gridLines}
        ${bars}
        ${labels}
      </svg>`;
    }

    function renderSelected(items) {
      if (!selectedList) return;
      const selected = selectedDois.length
        ? items.filter((pub) => selectedDois.includes(normalizeDoi(pub.doi)))
        : items.filter((pub) => pub.selected);
      if (selectedDois.length && !selected.length) {
        selectedList.innerHTML = '<p>No selected publications found.</p>';
        return;
      }
      const list = selected.length ? selected.slice(0, 8) : items.slice(0, 5);
      selectedList.innerHTML = list.map(renderPublication).join('');
    }

    function renderTags(items) {
      if (!tagContainer) return;
      const tags = new Set();
      items.forEach((pub) => (pub.tags || []).forEach((tag) => tags.add(tag)));
      tagContainer.innerHTML = '';
      tags.forEach((tag) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = tag;
        btn.addEventListener('click', () => {
          if (activeTags.has(tag)) {
            activeTags.delete(tag);
            btn.classList.remove('active');
          } else {
            activeTags.add(tag);
            btn.classList.add('active');
          }
          renderList();
        });
        tagContainer.appendChild(btn);
      });
    }

    function renderYearOptions(items) {
      if (!yearSelect) return;
      const years = Array.from(new Set(items.map((pub) => pub.year).filter((year) => year)))
        .sort((a, b) => b - a);
      yearSelect.innerHTML = '<option value="all">All years</option>';
      years.forEach((year) => {
        const option = document.createElement('option');
        option.value = String(year);
        option.textContent = String(year);
        yearSelect.appendChild(option);
      });
    }

    function renderTypeOptions(items) {
      if (!typeSelect) return;
      const types = Array.from(new Set(items.map((pub) => pub.type).filter((type) => type)))
        .sort((a, b) => a.localeCompare(b));
      typeSelect.innerHTML = '<option value="all">All types</option>';
      types.forEach((type) => {
        const option = document.createElement('option');
        option.value = String(type);
        option.textContent = String(type);
        typeSelect.appendChild(option);
      });
    }

    function matchesFilters(pub) {
      const year = yearSelect ? yearSelect.value : 'all';
      if (year !== 'all' && String(pub.year) !== year) return false;

      const type = typeSelect ? typeSelect.value : 'all';
      if (type !== 'all' && String(pub.type) !== type) return false;

      if (activeTags.size > 0 && !(pub.tags || []).some((tag) => activeTags.has(tag))) return false;

      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      if (!query) return true;
      const haystack = [
        pub.title,
        formatAuthors(pub),
        pub.journal,
        pub.doi
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    }

    function renderList() {
      const filtered = publications.filter(matchesFilters);
      listEl.innerHTML = filtered.map(renderPublication).join('');
      initSlideshows();
    }


    function initSlideshows() {
      if (!global.SlideshowManager) return;
      const containers = Array.from(document.querySelectorAll('.pub-slideshow'));
      if (!containers.length) return;
      global.SlideshowManager.clear();
      containers.forEach((container) => {
        const data = container.dataset.images || '';
        let images = [];
        try {
          images = JSON.parse(decodeURIComponent(data));
        } catch (err) {
          images = [];
        }
        if (!Array.isArray(images) || !images.length) return;
        const title = container.dataset.title || 'Publication figure';
        global.SlideshowManager.createSlideshow({
          container,
          images,
          intervalMs: 2000,
          altBase: title,
          enableLightbox: false
        });
      });
    }


    const selectedFetch = fetch('assets/data/publications.selected.json')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          selectedDois = data.map((d) => normalizeDoi(d)).filter(Boolean);
        }
      })
      .catch(() => {});

    selectedFetch.then(() => fetch('assets/data/publication_images.json')
      .then((response) => response.json())
      .then((data) => {
        imageMap = data || {};
        Object.keys(imageMap).forEach((key) => {
          if (key.startsWith('_')) delete imageMap[key];
        });
      })
      .catch(() => {
        imageMap = {};
      }))
      .then(() => fetch('assets/data/publications.json'))
      .then((response) => response.json())
      .then((data) => {
        publications = Array.isArray(data) ? data : data.publications;
        publications = publications || [];
        publications = publications.slice().sort((a, b) => {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          if (yearA !== yearB) return yearB - yearA;
          const journalA = a.journal || '';
          const journalB = b.journal || '';
          if (journalA !== journalB) return journalA.localeCompare(journalB);
          return (a.title || '').localeCompare(b.title || '');
        });

        renderSummaryChart(publications);
        renderSelected(publications);
        renderTags(publications);
        renderYearOptions(publications);
        renderTypeOptions(publications);
        renderList();
      })
      .catch(() => {
        listEl.innerHTML = '<p>Publications list is not available yet.</p>';
      });

    [yearSelect, typeSelect, searchInput].forEach((el) => {
      if (el) {
        el.addEventListener('input', renderList);
        el.addEventListener('change', renderList);
      }
    });
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.publications = module;
})(window);
