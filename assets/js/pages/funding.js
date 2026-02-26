(function (global) {
  const module = () => {
    const container = document.getElementById('funding-content');
    if (!container) return;
    const DATA_URL = 'assets/data/funding.json';
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
          <button type="button" class="btn ghost" data-funding-retry>Retry</button>
        </div>`;
      const retry = container.querySelector('[data-funding-retry]');
      if (retry) retry.addEventListener('click', loadFunding);
    };

    const formatCurrency = (amount, currency) => {
      if (global.FormatUtil && global.FormatUtil.formatCurrency) {
        return global.FormatUtil.formatCurrency(amount, currency);
      }
      if (!amount) return '';
      const locale = document.documentElement.lang || navigator.language || 'en-GB';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency || 'EUR',
        maximumFractionDigits: 0
      }).format(Number(amount));
    };

    const formatDate = (value) => {
      if (global.FormatUtil && global.FormatUtil.formatMonthYear) {
        return global.FormatUtil.formatMonthYear(value);
      }
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const locale = document.documentElement.lang || navigator.language || 'en-GB';
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(date);
    };

    const renderItem = (item) => {
      const budget = formatCurrency(item.budget?.amount, item.budget?.currency);
      const start = formatDate(item.dates?.start);
      const end = formatDate(item.dates?.end);
      const acronym = item.acronym ? ` (${item.acronym})` : '';
      return `
      <article class="funding-card">
        <div>
          <h3>${escapeHtml(item.title)}${escapeHtml(acronym)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </div>
        <div class="funding-meta">
          <div><strong>Grant/Project ID:</strong> ${escapeHtml(item.id)}</div>
          <div><strong>Program/Funder:</strong> ${escapeHtml(item.program)}${item.funder ? ` — ${escapeHtml(item.funder)}` : ''}</div>
          <div><strong>Beneficiary:</strong> ${escapeHtml(item.beneficiary)}${item.host ? ` (${escapeHtml(item.host)})` : ''}</div>
          <div><strong>Dates:</strong> ${escapeHtml(start)}–${escapeHtml(end)}</div>
          <div><strong>Budget:</strong> ${escapeHtml(budget)}</div>
          <div><strong>Role:</strong> ${escapeHtml(item.role)}</div>
        </div>
      </article>`;
    };

    const renderSection = (title, items) => {
      if (!items.length) return '';
      return `
      <section class="section">
        <h2>${escapeHtml(title)}</h2>
        <div class="funding-grid">
          ${items.map(renderItem).join('')}
        </div>
      </section>`;
    };

    const loadFunding = () => withTimeout(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const fellowships = data.fellowships || [];
        const research = data.research_funding || [];
        if (!fellowships.length && !research.length) {
          container.innerHTML = `
            <div class="card">
              <p>No funding records are available yet.</p>
            </div>`;
          return;
        }
        container.innerHTML =
          renderSection('Fellowships', fellowships) +
          renderSection('Research funding', research);
      })
      .catch(() => {
        renderErrorState('Funding data is not available at the moment.');
      });

    loadFunding();
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.funding = module;
})(window);
