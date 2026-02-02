(function () {
  const listEl = document.getElementById('publications-list');
  if (!listEl) return;

  const yearSelect = document.getElementById('filter-year');
  const typeSelect = document.getElementById('filter-type');
  const searchInput = document.getElementById('filter-search');
  const tagContainer = document.getElementById('filter-tags');
  const selectedList = document.getElementById('selected-publications-list');

  let activeTags = new Set();
  let publications = [];

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
    const journal = pub.journal || '';
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

  function renderCitationPanel(pub) {
    const total = pub.citations_total || 0;
    const years = pub.citations_last5 ? pub.citations_last5.years : [];
    const counts = pub.citations_last5 ? pub.citations_last5.counts : [];
    const maxCount = Math.max(1, ...counts);

    const bars = counts.map((count, idx) => {
      const height = Math.round((count / maxCount) * 40);
      const yearLabel = years[idx] || '';
      return `
        <g>
          <rect x="${idx * 22}" y="${44 - height}" width="14" height="${height}" rx="2" class="pub-bar" />
          <title>${yearLabel}: ${count} citations</title>
        </g>`;
    }).join('');

    const labels = years.map((year, idx) => `
      <text x="${idx * 22 + 7}" y="58" text-anchor="middle" class="pub-bar-label">${year ? String(year).slice(2) : ''}</text>
    `).join('');

    return `
      <a class="pub-metrics" href="${pub.openalex_url}" target="_blank" rel="noopener" aria-label="Open OpenAlex page for this work">
        <div class="pub-metrics-total">Citations: ${total}</div>
        <svg class="pub-chart" viewBox="0 0 110 60" role="img" aria-label="Citations over last five years">
          ${bars}
          ${labels}
        </svg>
      </a>`;
  }

  function renderPublication(pub) {
    const authors = formatAuthors(pub);
    const titleLink = pub.doi_url || pub.openalex_url || '#';
    return `
      <article class="pub-item pub-row">
        <div class="pub-main">
          <h3 class="pub-title"><a href="${titleLink}" target="_blank" rel="noopener">${escapeHtml(pub.title)}</a></h3>
          ${authors ? `<div class="pub-authors">${escapeHtml(authors)}</div>` : ''}
          ${!authors ? '<div class="pub-authors missing">Authors: (add in overrides)</div>' : ''}
          ${buildVenueLine(pub)}
          ${renderDoiLine(pub)}
        </div>
        <div class="pub-side">
          ${renderCitationPanel(pub)}
        </div>
      </article>`;
  }

  function renderSelected(items) {
    if (!selectedList) return;
    const list = items.slice(0, 5);
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
        const journalA = a.journal || '';
        const journalB = b.journal || '';
        if (journalA !== journalB) return journalA.localeCompare(journalB);
        return (a.title || '').localeCompare(b.title || '');
      });

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
})();
