(function (global) {
  const module = () => {
    const container = document.getElementById('conference-content');
    if (!container) return;

    const CACHE_PREFIX = 'conference-pdf-exists:';
    const DATA_URL = 'assets/data/conference.json';
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
          <button type="button" class="btn ghost" data-conference-retry>Retry</button>
        </div>`;
      const retry = container.querySelector('[data-conference-retry]');
      if (retry) retry.addEventListener('click', loadConference);
    };

    const formatDateRange = global.FormatUtil ? global.FormatUtil.formatDateRange : (start, end) => {
      if (!start) return '';
      const startDate = new Date(start);
      const endDate = new Date(end || start);
      if (Number.isNaN(startDate.getTime())) return '';
      const sameDay = start === end || startDate.toDateString() === endDate.toDateString();
      const locale = document.documentElement.lang || navigator.language || 'en-GB';
      const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
      const dayFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric' });
      const yearFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric' });
      const startMonth = monthFormatter.format(startDate);
      const startDay = dayFormatter.format(startDate);
      const startYear = yearFormatter.format(startDate);

      if (sameDay) {
        return `${startDay} ${startMonth} ${startYear}`;
      }

      const endMonth = monthFormatter.format(endDate);
      const endDay = dayFormatter.format(endDate);
      const endYear = yearFormatter.format(endDate);

      if (startYear === endYear && startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth} ${startYear}`;
      }

      if (startYear === endYear) {
        return `${startDay} ${startMonth}-${endDay} ${endMonth} ${startYear}`;
      }

      return `${startDay} ${startMonth} ${startYear}-${endDay} ${endMonth} ${endYear}`;
    };

    const checkFileExists = (url) => {
      if (!url) return Promise.resolve(false);
      const cacheKey = `${CACHE_PREFIX}${url}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached !== null) return Promise.resolve(cached === 'true');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const attemptGet = () => {
        return fetch(url, { method: 'GET', signal: controller.signal })
          .then((response) => response.ok)
          .catch(() => false);
      };

      return fetch(url, { method: 'HEAD', signal: controller.signal })
        .then((response) => {
          if (response.ok) return true;
          if (response.status === 404) return false;
          return attemptGet();
        })
        .catch(() => attemptGet())
        .then((exists) => {
          sessionStorage.setItem(cacheKey, exists ? 'true' : 'false');
          return exists;
        })
        .finally(() => {
          clearTimeout(timeoutId);
        });
    };

    const renderPresentation = (item) => {
      const dateRange = formatDateRange(item.dates?.start, item.dates?.end);
      const location = item.location ? ` - ${escapeHtml(item.location)}` : '';
      const authors = Array.isArray(item.authors) && item.authors.length
        ? item.authors.map((name) => escapeHtml(name)).join(', ')
        : '';
      const notes = item.notes ? `<div class="conference-notes">${escapeHtml(item.notes)}</div>` : '';
      const downloadLabel = escapeHtml(item.download?.label || 'Download PDF');
      const downloadPath = escapeHtml(item.download?.path || '');
      const hasDownload = Boolean(item.download?.path);
      const downloadAttrs = hasDownload
        ? `data-download-path="${downloadPath}" data-download-enabled="pending"`
        : 'data-download-enabled="false" aria-disabled="true" disabled';

      return `
      <article class="conference-card" data-slug="${escapeHtml(item.slug)}">
        <div class="conference-main">
          <div class="conference-header">
            <h3 class="conference-title">${escapeHtml(item.title)}</h3>
            <span class="badge">${escapeHtml(item.type)}</span>
          </div>
          <div class="conference-event">${escapeHtml(item.event)}${location}</div>
          ${dateRange ? `<div class="conference-date">${dateRange}</div>` : ''}
          ${authors ? `<div class="conference-authors">${authors}</div>` : ''}
          ${notes}
          <button type="button" class="btn small conference-download" ${downloadAttrs}>${downloadLabel}</button>
        </div>
      </article>`;
    };

    const bindDownloadButtons = () => {
      const downloadButtons = Array.from(container.querySelectorAll('.conference-download'));
      downloadButtons.forEach((button) => {
        const path = button.getAttribute('data-download-path');
        if (!path) {
          button.classList.add('disabled');
          button.setAttribute('aria-disabled', 'true');
          button.setAttribute('disabled', 'true');
          button.textContent = 'PDF coming soon';
          return;
        }

        checkFileExists(path).then((exists) => {
          if (exists) {
            button.classList.remove('disabled');
            button.removeAttribute('aria-disabled');
            button.removeAttribute('disabled');
            button.dataset.downloadEnabled = 'true';
            button.addEventListener('click', () => {
              global.open(path, '_blank', 'noopener');
            }, { once: true });
          } else {
            button.classList.add('disabled');
            button.setAttribute('aria-disabled', 'true');
            button.setAttribute('disabled', 'true');
            button.textContent = 'PDF coming soon';
          }
        });
      });
    };

    const loadConference = () => withTimeout(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const presentations = data.presentations || [];
        if (!presentations.length) {
          container.innerHTML = `
            <div class="card">
              <p>No conference entries available yet.</p>
            </div>`;
          return;
        }
        const sorted = presentations.slice().sort((a, b) => {
          const dateA = new Date(a.dates?.end || a.dates?.start || '1970-01-01');
          const dateB = new Date(b.dates?.end || b.dates?.start || '1970-01-01');
          return dateB - dateA;
        });

        container.innerHTML = sorted.map(renderPresentation).join('');
        bindDownloadButtons();
      })
      .catch(() => {
        renderErrorState('Conference data is not available at the moment.');
      });

    loadConference();
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.conference = module;
})(window);
