(function () {
  const listEl = document.getElementById('publications-list');
  if (!listEl) return;

  const yearSelect = document.getElementById('filter-year');
  const searchInput = document.getElementById('filter-search');
  const firstAuthorToggle = document.getElementById('filter-first-author');
  const tagContainer = document.getElementById('filter-tags');
  const selectedList = document.getElementById('selected-publications-list');
  const firstAuthorHint = document.getElementById('first-author-hint');
  const previewToggle = document.getElementById('toggle-doi-preview');

  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const MAX_CONCURRENT = 3;
  const PREVIEW_DELAY_MS = 200;

  let activeTags = new Set();
  let publications = [];
  let previewEnabled = false;
  let previewQueue = [];
  let previewInFlight = new Set();
  let activeRequests = 0;
  let scheduleTimer = null;
  const memoryCache = new Map();

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
    if (typeof pub.authors === 'string') {
      return pub.authors;
    }
    return '';
  }

  function isFirstAuthor(pub) {
    const authors = Array.isArray(pub.authors)
      ? pub.authors
      : (typeof pub.authors === 'string' ? pub.authors.split(',') : []);
    if (!authors.length) return false;
    const first = authors[0].toLowerCase();
    return first.includes('vicentini');
  }


  function getDoi(pub) {
    if (pub.doi) return pub.doi;
    if (pub.links && pub.links.doi) {
      return pub.links.doi.replace(/^https?:\/\/doi\.org\//i, '');
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
    const doiValue = getDoi(pub);
    if (!doiValue) return '';
    const doi = escapeHtml(doiValue);
    return `<div class="pub-doi"><a href="https://doi.org/${doi}" target="_blank" rel="noopener">doi: ${doi}</a></div>`;
  }

  function renderPreviewContainer(pub) {
    const doiValue = getDoi(pub);
    if (!doiValue) return '';
    const doi = escapeHtml(doiValue);
    const hiddenClass = previewEnabled ? '' : ' hide';
    return `<div class="doi-preview${hiddenClass}" data-doi="${doi}" data-preview-status="idle"></div>`;
  }

  function renderPublication(pub) {
    const authors = formatAuthors(pub);
    return `
      <article class="pub-item">
        <h3 class="pub-title">${escapeHtml(pub.title)}</h3>
        ${authors ? `<div class="pub-authors">${escapeHtml(authors)}</div>` : ''}
        ${!authors ? '<div class="pub-authors missing">Authors: (add in overrides)</div>' : ''}
        ${buildVenueLine(pub)}
        ${renderDoiLine(pub)}
        ${renderPreviewContainer(pub)}
      </article>`;
  }

  function renderSelected(items) {
    if (!selectedList) return;
    const selected = items.filter((pub) => pub.selected).slice(0, 8);
    const list = selected.length ? selected : items.slice(0, 5);
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

  function matchesFilters(pub) {
    const year = yearSelect ? yearSelect.value : 'all';
    if (year !== 'all' && String(pub.year) !== year) return false;

    if (firstAuthorToggle && firstAuthorToggle.checked) {
      if (!pub.authors || (Array.isArray(pub.authors) && pub.authors.length === 0)) {
        return false;
      }
      if (!isFirstAuthor(pub)) return false;
    }

    if (activeTags.size > 0 && !(pub.tags || []).some((tag) => activeTags.has(tag))) return false;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (!query) return true;
    const haystack = [
      pub.title,
      formatAuthors(pub),
      pub.journal,
      pub.venue,
      pub.type,
      pub.doi,
      pub.tags ? pub.tags.join(' ') : ''
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  function renderList() {
    const filtered = publications.filter(matchesFilters);
    listEl.innerHTML = filtered.map(renderPublication).join('');

    if (firstAuthorHint) {
      if (firstAuthorToggle && firstAuthorToggle.checked && publications.some((pub) => !pub.authors || (Array.isArray(pub.authors) && pub.authors.length === 0))) {
        firstAuthorHint.textContent = 'First-author filter requires curated authors in overrides.';
      } else {
        firstAuthorHint.textContent = '';
      }
    }

    if (previewEnabled) {
      schedulePreviewLoad();
    }
  }

  function cacheKey(doi) {
    return `doi-preview:${doi.toLowerCase()}`;
  }

  function getCachedPreview(doi) {
    const key = cacheKey(doi);
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    let raw = null;
    try {
      raw = localStorage.getItem(key);
    } catch (err) {
      return null;
    }
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw);
      if (Date.now() - payload.ts > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      memoryCache.set(key, payload);
      return payload;
    } catch (err) {
      try {
        localStorage.removeItem(key);
      } catch (removeErr) {
        // ignore
      }
      return null;
    }
  }

  function setCachedPreview(doi, payload) {
    const key = cacheKey(doi);
    memoryCache.set(key, payload);
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      // ignore storage errors
    }
  }

  function renderPreviewCard(container, preview) {
    if (!container) return;
    if (!preview || preview.unavailable) {
      container.innerHTML = '<div class="doi-preview-card unavailable">Preview unavailable</div>';
      container.dataset.previewStatus = 'done';
      return;
    }

    const title = escapeHtml(preview.title || 'Preview');
    const journal = preview.journal ? `<em>${escapeHtml(preview.journal)}</em>` : '';
    const year = preview.year ? ` (${escapeHtml(preview.year)})` : '';
    const url = preview.url || (container.dataset.doi ? `https://doi.org/${container.dataset.doi}` : '#');

    container.innerHTML = `
      <div class="doi-preview-card">
        <div class="doi-preview-title">${title}</div>
        <div class="doi-preview-meta">${journal}${year}</div>
        <a class="btn ghost small" href="${url}" target="_blank" rel="noopener">Open publisher page</a>
      </div>`;
    container.dataset.previewStatus = 'done';
  }

  function fetchPreview(doi, container) {
    if (previewInFlight.has(doi)) return;
    previewInFlight.add(doi);
    activeRequests += 1;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    })
      .then((response) => {
        clearTimeout(timeout);
        if (!response.ok) {
          throw new Error('Crossref request failed');
        }
        return response.json();
      })
      .then((payload) => {
        const message = payload && payload.message ? payload.message : {};
        const title = Array.isArray(message.title) ? message.title[0] : '';
        const journal = Array.isArray(message['container-title']) ? message['container-title'][0] : '';
        const year = message.issued && Array.isArray(message.issued['date-parts']) && message.issued['date-parts'][0]
          ? message.issued['date-parts'][0][0]
          : '';
        const url = message.URL || '';

        const preview = {
          title,
          journal,
          year,
          url
        };
        const payloadToCache = { ts: Date.now(), data: preview };
        setCachedPreview(doi, payloadToCache);
        renderPreviewCard(container, preview);
      })
      .catch(() => {
        const payloadToCache = { ts: Date.now(), unavailable: true };
        setCachedPreview(doi, payloadToCache);
        renderPreviewCard(container, { unavailable: true });
      })
      .finally(() => {
        previewInFlight.delete(doi);
        activeRequests = Math.max(0, activeRequests - 1);
        setTimeout(processPreviewQueue, PREVIEW_DELAY_MS);
      });
  }

  function processPreviewQueue() {
    if (!previewEnabled) return;
    if (activeRequests >= MAX_CONCURRENT) return;
    if (!previewQueue.length) return;

    const next = previewQueue.shift();
    if (!next) return;

    const { doi, container } = next;
    if (!container || container.dataset.previewStatus === 'done') {
      setTimeout(processPreviewQueue, PREVIEW_DELAY_MS);
      return;
    }

    const cached = getCachedPreview(doi);
    if (cached) {
      renderPreviewCard(container, cached.data || { unavailable: cached.unavailable });
      setTimeout(processPreviewQueue, PREVIEW_DELAY_MS);
      return;
    }

    container.dataset.previewStatus = 'loading';
    fetchPreview(doi, container);
  }

  function schedulePreviewLoad() {
    if (!previewEnabled) return;
    clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(() => {
      const containers = Array.from(listEl.querySelectorAll('.doi-preview'));
      containers.forEach((container) => {
        container.classList.remove('hide');
      });

      previewQueue = [];
      containers.forEach((container) => {
        const doi = container.dataset.doi;
        if (!doi) return;
        if (container.dataset.previewStatus === 'done' || container.dataset.previewStatus === 'loading') return;
        container.dataset.previewStatus = 'queued';
        previewQueue.push({ doi, container });
      });

      processPreviewQueue();
    }, 400);
  }

  function togglePreviews(enabled) {
    previewEnabled = enabled;
    const containers = Array.from(listEl.querySelectorAll('.doi-preview'));
    containers.forEach((container) => {
      if (!previewEnabled) {
        container.classList.add('hide');
      } else {
        container.classList.remove('hide');
      }
    });

    if (previewEnabled) {
      schedulePreviewLoad();
    }
  }

  fetch('assets/data/publications.json')
    .then((response) => response.json())
    .then((data) => {
      publications = Array.isArray(data) ? data : data.publications;
      publications = publications || [];
      publications = publications.slice().sort((a, b) => {
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        if (yearA !== yearB) return yearB - yearA;
        return (a.title || '').localeCompare(b.title || '');
      });

      renderSelected(publications);
      renderTags(publications);
      renderYearOptions(publications);
      renderList();
    })
    .catch(() => {
      listEl.innerHTML = '<p>Publications list is not available yet.</p>';
    });

  [yearSelect, searchInput, firstAuthorToggle].forEach((el) => {
    if (el) {
      el.addEventListener('input', renderList);
      el.addEventListener('change', renderList);
    }
  });

  if (previewToggle) {
    previewToggle.addEventListener('change', () => {
      togglePreviews(previewToggle.checked);
    });
  }
})();
