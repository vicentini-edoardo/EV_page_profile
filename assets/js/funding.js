(function () {
  const container = document.getElementById('funding-content');
  if (!container) return;

  const formatCurrency = (amount, currency) => {
    if (!amount || !currency) return '';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (err) {
      return `${amount} ${currency}`;
    }
  };

  const formatDateRange = (dates) => {
    if (!dates || !dates.start || !dates.end) return '';
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
    const fmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
    return `${fmt.format(start)} - ${fmt.format(end)}`;
  };

  const renderItem = (item) => {
    const title = item.acronym
      ? `${item.acronym} - ${item.title}`
      : item.title;
    return `
      <article class="funding-card">
        <div>
          <h3>${title}</h3>
          <p class="tagline">${item.description}</p>
        </div>
        <div class="funding-meta">
          <div><strong>Grant/Project ID:</strong> ${item.id}</div>
          <div><strong>Program/Funder:</strong> ${item.program} - ${item.funder}</div>
          <div><strong>Beneficiary:</strong> ${item.beneficiary} (${item.host})</div>
          <div><strong>Dates:</strong> ${formatDateRange(item.dates)}</div>
          <div><strong>Budget:</strong> ${formatCurrency(item.budget.amount, item.budget.currency)}</div>
          <div><strong>Role:</strong> ${item.role}</div>
        </div>
      </article>`;
  };

  fetch('assets/data/funding.json')
    .then((response) => response.json())
    .then((data) => {
      const fellowships = data.fellowships || [];
      const research = data.research_funding || [];

      container.innerHTML = `
        <section class="section">
          <div class="section-header">
            <div>
              <h2>Fellowships</h2>
              <p class="tagline">Personal fellowships supporting independent research.</p>
            </div>
          </div>
          <div class="funding-grid">
            ${fellowships.map(renderItem).join('')}
          </div>
        </section>
        <section class="section">
          <div class="section-header">
            <div>
              <h2>Research funding</h2>
              <p class="tagline">Collaborative projects and institutional grants.</p>
            </div>
          </div>
          <div class="funding-grid">
            ${research.map(renderItem).join('')}
          </div>
        </section>`;
    })
    .catch(() => {
      container.innerHTML = '<p>Funding data is not available at the moment.</p>';
    });
})();
