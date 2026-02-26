(function (global) {
  const module = () => {
    const listEl = document.getElementById('publications-list');
    if (!listEl) return;
    const DATA_URL = 'assets/data/publications.json';
    const SELECTED_URL = 'assets/data/publications.selected.json';
    const IMAGES_URL = 'assets/data/publication_images.json';
    const FETCH_TIMEOUT_MS = 10000;
    const MAX_RENDER_COUNT = 600;

    const yearSelect = document.getElementById('filter-year');
    const typeSelect = document.getElementById('filter-type');
    const searchInput = document.getElementById('filter-search');
    const tagContainer = document.getElementById('filter-tags');
    const selectedList = document.getElementById('selected-publications-list');

    let activeTags = new Set();
    let publications = [];
    let selectedDois = [];
    let imageMap = {};
    let teardownSummaryChart = null;
    const locale = document.documentElement.lang || navigator.language || 'en-GB';
    const numberFormatter = new Intl.NumberFormat(locale);

    function withTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(url, { ...options, signal: controller.signal }).finally(() => {
        clearTimeout(timeoutId);
      });
    }

    function getJson(url) {
      return withTimeout(url).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      });
    }

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

    function safeExternalUrl(url, fallback) {
      if (!url || typeof url !== 'string') return fallback;
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return parsed.href;
        }
      } catch (error) {
        return fallback;
      }
      return fallback;
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
      const doiHref = safeExternalUrl(pub.doi_url, `https://doi.org/${encodeURIComponent(pub.doi)}`);
      return `<div class="pub-doi"><a href="${escapeHtml(doiHref)}" target="_blank" rel="noopener">doi: ${doi}</a></div>`;
    }

    function normalizeImagePath(path, baseDir) {
      if (!path) return '';
      if (/^(https?:)?\/\//.test(path) || path.startsWith('assets/')) return path;
      const cleanBase = baseDir.replace(/\/$/, '');
      return `${cleanBase}/${path}`;
    }

    function fetchFolderImages(dir) {
      if (!dir) return Promise.resolve([]);
      const cleanDir = String(dir).replace(/\/$/, '');
      if (!cleanDir) return Promise.resolve([]);
      return fetch(`${cleanDir}/images.json`)
        .then((response) => (response.ok ? response.json() : []))
        .then((data) => {
          const list = Array.isArray(data) ? data : (data.images || []);
          if (!Array.isArray(list)) return [];
          return list.filter(Boolean).map((img) => normalizeImagePath(img, cleanDir));
        })
        .catch(() => []);
    }

    function resolveImageMap(data) {
      imageMap = data || {};
      Object.keys(imageMap).forEach((key) => {
        if (key.startsWith('_')) delete imageMap[key];
      });

      const tasks = Object.entries(imageMap).map(([doi, value]) => {
        if (Array.isArray(value)) {
          imageMap[doi] = value.filter(Boolean);
          return Promise.resolve();
        }
        if (typeof value === 'string') {
          return fetchFolderImages(value).then((images) => {
            imageMap[doi] = images;
          });
        }
        if (value && typeof value === 'object' && typeof value.dir === 'string') {
          return fetchFolderImages(value.dir).then((images) => {
            imageMap[doi] = images;
          });
        }
        imageMap[doi] = [];
        return Promise.resolve();
      });

      return Promise.all(tasks);
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
      const titleLink = safeExternalUrl(pub.doi_url, safeExternalUrl(pub.openalex_url, '#'));
      const externalAttrs = titleLink === '#'
        ? ''
        : ' target="_blank" rel="noopener"';
      const imagesHtml = renderImages(pub);
      const mediaHtml = imagesHtml ? imagesHtml : '';
      return `
      <article class="pub-item pub-row${imagesHtml ? ' has-media' : ''}">
        ${mediaHtml}
        <div class="pub-main">
          <h3 class="pub-title"><a href="${escapeHtml(titleLink)}"${externalAttrs}>${escapeHtml(pub.title)}</a></h3>
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
      if (typeof teardownSummaryChart === 'function') {
        teardownSummaryChart();
        teardownSummaryChart = null;
      }
      const citationTotals = (Array.isArray(items) ? items : [])
        .map((pub) => Number(pub && pub.citations_total))
        .map((value) => (Number.isFinite(value) && value > 0 ? value : 0))
        .sort((a, b) => b - a);
      let hIndex = 0;
      citationTotals.forEach((count, index) => {
        const rank = index + 1;
        if (count >= rank) hIndex = rank;
      });
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
      const metricsHtml = `
        <aside class="citations-summary-metrics" aria-label="Citation summary metrics">
          <p class="citations-summary-total">Total citations (10 years)</p>
          <p class="citations-total-value">${numberFormatter.format(totalSum)}</p>
          <p class="citations-summary-hindex">H-index</p>
          <p class="citations-hindex-value">${numberFormatter.format(hIndex)}</p>
        </aside>`;
      if (totalSum <= 0) {
        chartEl.innerHTML = `
          <div class="citations-summary-layout is-empty">
            <div class="citations-summary-layout__chart">
              <p class="citations-summary-empty">Citation counts by year are currently unavailable for the loaded records.</p>
            </div>
            ${metricsHtml}
          </div>`;
        return;
      }
      const maxScale = Math.ceil(maxCount * 1.15);
      const tickFractions = [1, 0.66, 0.33];
      const gridRows = tickFractions.map((fraction) => {
        const value = Math.round(maxScale * fraction);
        return `<div class="citations-grid-row"><span class="citations-grid-label">${numberFormatter.format(value)}</span></div>`;
      }).join('');

      const bars = totals.map((count, idx) => {
        const year = years[idx];
        const heightPct = maxScale ? Math.round((count / maxScale) * 100) : 0;
        return `
          <button
            type="button"
            class="citations-bar"
            data-year="${year}"
            data-count="${count}"
            aria-label="${year}: ${numberFormatter.format(count)} citations"
            aria-pressed="false"
            style="--bar-height:${heightPct};"
          >
            <span class="citations-bar__fill" aria-hidden="true"></span>
            <span class="citations-bar__label" aria-hidden="true">${year}</span>
          </button>`;
      }).join('');

      chartEl.innerHTML = `
        <div class="citations-summary-layout">
          <div class="citations-summary-layout__chart">
            <div class="citations-bars-chart" role="group" aria-label="Total citations over last ten years">
              <div class="citations-grid" aria-hidden="true">${gridRows}</div>
              <div class="citations-bars">${bars}</div>
              <div class="citations-tooltip" role="tooltip" hidden></div>
            </div>
          </div>
          ${metricsHtml}
        </div>`;

      const chart = chartEl.querySelector('.citations-bars-chart');
      const tooltip = chartEl.querySelector('.citations-tooltip');
      const barEls = Array.from(chartEl.querySelectorAll('.citations-bar'));
      if (!chart || !tooltip || !barEls.length) return;
      const listenersController = new AbortController();
      const { signal } = listenersController;
      const listen = (target, eventName, handler, options = {}) => {
        target.addEventListener(eventName, handler, { ...options, signal });
      };
      teardownSummaryChart = () => {
        listenersController.abort();
      };

      let activeBar = null;
      let touchOpen = false;

      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

      const positionTooltip = (clientX) => {
        const rect = chart.getBoundingClientRect();
        const padding = 14;
        const x = clamp(clientX - rect.left, padding, rect.width - padding);
        tooltip.style.left = `${x}px`;
      };

      const showTooltip = (bar, clientX) => {
        const year = bar.dataset.year || '';
        const count = bar.dataset.count || '0';
        tooltip.textContent = `${year}: ${numberFormatter.format(Number(count || 0))} citations`;
        tooltip.hidden = false;
        tooltip.setAttribute('aria-hidden', 'false');
        barEls.forEach((el) => {
          const isActive = el === bar;
          el.classList.toggle('is-active', isActive);
          el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        activeBar = bar;
        if (typeof clientX === 'number') {
          positionTooltip(clientX);
        } else {
          const rect = bar.getBoundingClientRect();
          positionTooltip(rect.left + rect.width / 2);
        }
      };

      const hideTooltip = () => {
        tooltip.hidden = true;
        tooltip.setAttribute('aria-hidden', 'true');
        barEls.forEach((el) => {
          el.classList.remove('is-active');
          el.setAttribute('aria-pressed', 'false');
        });
        activeBar = null;
        touchOpen = false;
      };

      barEls.forEach((bar) => {
        listen(bar, 'mouseenter', (event) => {
          touchOpen = false;
          showTooltip(bar, event.clientX);
        });

        listen(bar, 'mousemove', (event) => {
          if (!tooltip.hidden && activeBar === bar) {
            positionTooltip(event.clientX);
          }
        });

        listen(bar, 'mouseleave', () => {
          if (!touchOpen) hideTooltip();
        });

        listen(bar, 'focus', () => {
          touchOpen = false;
          showTooltip(bar);
        });

        listen(bar, 'blur', () => {
          if (!touchOpen) hideTooltip();
        });

        listen(bar, 'keydown', (event) => {
          const currentIndex = barEls.indexOf(bar);
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const delta = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = Math.max(0, Math.min(barEls.length - 1, currentIndex + delta));
            const nextBar = barEls[nextIndex];
            if (nextBar) nextBar.focus();
            return;
          }
          if (event.key === 'Home') {
            event.preventDefault();
            barEls[0].focus();
            return;
          }
          if (event.key === 'End') {
            event.preventDefault();
            barEls[barEls.length - 1].focus();
            return;
          }
          if (event.key === 'Escape') {
            hideTooltip();
            bar.blur();
          }
        });

        listen(bar, 'touchstart', (event) => {
          touchOpen = true;
          const touch = event.touches && event.touches[0];
          showTooltip(bar, touch ? touch.clientX : undefined);
        }, { passive: true });
      });

      listen(chart, 'mouseleave', () => {
        if (!touchOpen) hideTooltip();
      });

      listen(chart, 'mousemove', (event) => {
        if (!tooltip.hidden && activeBar && !touchOpen) {
          positionTooltip(event.clientX);
        }
      });

      listen(chart, 'keydown', (event) => {
        if (event.key === 'Escape') {
          hideTooltip();
        }
      });

      listen(document, 'touchstart', (event) => {
        if (!touchOpen) return;
        if (chart.contains(event.target)) return;
        hideTooltip();
      }, { passive: true });

      listen(document, 'mousedown', (event) => {
        if (tooltip.hidden) return;
        if (chart.contains(event.target)) return;
        hideTooltip();
      });
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
      if (!filtered.length) {
        listEl.innerHTML = '<div class="card"><p>No publications match these filters. Try clearing one or more filters.</p></div>';
        return;
      }
      const tooMany = filtered.length > MAX_RENDER_COUNT;
      const visibleItems = tooMany ? filtered.slice(0, MAX_RENDER_COUNT) : filtered;
      const truncationNotice = tooMany
        ? `<div class="card"><p>Showing ${numberFormatter.format(MAX_RENDER_COUNT)} of ${numberFormatter.format(filtered.length)} results. Refine filters for a narrower result set.</p></div>`
        : '';
      listEl.innerHTML = truncationNotice + visibleItems.map(renderPublication).join('');
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
          enableLightbox: true
        });
      });
    }


    const renderFatalError = () => {
      listEl.innerHTML = `
        <div class="card">
          <p>Publications data is not available at the moment.</p>
          <button type="button" class="btn ghost" id="publications-retry">Retry</button>
        </div>`;
      const retry = document.getElementById('publications-retry');
      if (retry) retry.addEventListener('click', loadPublications);
    };

    const selectedFetch = getJson(SELECTED_URL)
      .then((data) => {
        if (Array.isArray(data)) {
          selectedDois = data.map((d) => normalizeDoi(d)).filter(Boolean);
        }
      })
      .catch(() => {});

    const loadPublications = () => selectedFetch.then(() => getJson(IMAGES_URL)
      .then((data) => resolveImageMap(data))
      .catch(() => {
        imageMap = {};
      }))
      .then(() => getJson(DATA_URL))
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
      .catch(renderFatalError);

    loadPublications();

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
