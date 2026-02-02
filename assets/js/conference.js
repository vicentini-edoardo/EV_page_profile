(function () {
  const container = document.getElementById('conference-content');
  if (!container) return;

  const CACHE_PREFIX = 'conference-pdf-exists:';

  const formatDateRange = (start, end) => {
    if (!start) return '';
    const startDate = new Date(start);
    const endDate = new Date(end || start);
    if (Number.isNaN(startDate.getTime())) return '';
    const sameDay = start === end || startDate.toDateString() === endDate.toDateString();
    const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short' });
    const dayFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric' });
    const yearFormatter = new Intl.DateTimeFormat('en-GB', { year: 'numeric' });
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
        clearTimeout(timeoutId);
        sessionStorage.setItem(cacheKey, exists ? 'true' : 'false');
        return exists;
      });
  };

  const renderPresentation = (item) => {
    const dateRange = formatDateRange(item.dates?.start, item.dates?.end);
    const location = item.location ? ` - ${item.location}` : '';
    const authors = Array.isArray(item.authors) && item.authors.length ? item.authors.join(', ') : '';
    const notes = item.notes ? `<div class="conference-notes">${item.notes}</div>` : '';
    const downloadLabel = item.download?.label || 'Download PDF';
    const downloadPath = item.download?.path || '';

    return `
      <article class="conference-card" data-slug="${item.slug}">
        <div class="conference-main">
          <div class="conference-header">
            <h3 class="conference-title">${item.title}</h3>
            <span class="badge">${item.type}</span>
          </div>
          <div class="conference-event">${item.event}${location}</div>
          ${dateRange ? `<div class="conference-date">${dateRange}</div>` : ''}
          ${authors ? `<div class="conference-authors">${authors}</div>` : ''}
          ${notes}
          <a class="btn small conference-download" data-download-path="${downloadPath}">${downloadLabel}</a>
        </div>
      </article>`;
  };

  fetch('assets/data/conference.json')
    .then((response) => response.json())
    .then((data) => {
      const presentations = data.presentations || [];
      const sorted = presentations.slice().sort((a, b) => {
        const dateA = new Date(a.dates?.end || a.dates?.start || '1970-01-01');
        const dateB = new Date(b.dates?.end || b.dates?.start || '1970-01-01');
        return dateB - dateA;
      });

      container.innerHTML = sorted.map(renderPresentation).join('');

      const downloadButtons = Array.from(container.querySelectorAll('.conference-download'));
      downloadButtons.forEach((button) => {
        const path = button.getAttribute('data-download-path');
        if (!path) {
          button.classList.add('disabled');
          button.setAttribute('aria-disabled', 'true');
          button.textContent = 'PDF coming soon';
          return;
        }

        checkFileExists(path).then((exists) => {
          if (exists) {
            button.setAttribute('href', path);
            button.setAttribute('target', '_blank');
            button.setAttribute('rel', 'noopener');
            button.classList.remove('disabled');
            button.removeAttribute('aria-disabled');
          } else {
            button.removeAttribute('href');
            button.classList.add('disabled');
            button.setAttribute('aria-disabled', 'true');
            button.textContent = 'PDF coming soon';
          }
        });
      });
    })
    .catch(() => {
      container.innerHTML = '<p>Conference data is not available at the moment.</p>';
    });
})();
