(function (global) {
  const module = () => {
    const container = document.getElementById('funding-content');
    if (!container) return;

    const formatCurrency = (amount, currency) => {
      if (!amount) return '';
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency || 'EUR',
        maximumFractionDigits: 0
      }).format(amount);
    };

    const formatDate = (value) => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short' }).format(date);
    };

    const renderItem = (item) => {
      const budget = formatCurrency(item.budget?.amount, item.budget?.currency);
      const start = formatDate(item.dates?.start);
      const end = formatDate(item.dates?.end);
      const acronym = item.acronym ? ` (${item.acronym})` : '';
      return `
      <article class="funding-card">
        <div>
          <h3>${item.title}${acronym}</h3>
          <p>${item.description}</p>
        </div>
        <div class="funding-meta">
          <div><strong>Grant/Project ID:</strong> ${item.id}</div>
          <div><strong>Program/Funder:</strong> ${item.program}${item.funder ? ` — ${item.funder}` : ''}</div>
          <div><strong>Beneficiary:</strong> ${item.beneficiary}${item.host ? ` (${item.host})` : ''}</div>
          <div><strong>Dates:</strong> ${start}–${end}</div>
          <div><strong>Budget:</strong> ${budget}</div>
          <div><strong>Role:</strong> ${item.role}</div>
        </div>
      </article>`;
    };

    const renderSection = (title, items) => {
      if (!items.length) return '';
      return `
      <section class="section">
        <h2>${title}</h2>
        <div class="funding-grid">
          ${items.map(renderItem).join('')}
        </div>
      </section>`;
    };

    fetch('assets/data/funding.json')
      .then((response) => response.json())
      .then((data) => {
        const fellowships = data.fellowships || [];
        const research = data.research_funding || [];
        container.innerHTML =
          renderSection('Fellowships', fellowships) +
          renderSection('Research funding', research);
      })
      .catch(() => {
        container.innerHTML = '<p>Funding data is not available at the moment.</p>';
      });
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.funding = module;
})(window);
