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
    if (typeof pub.authors === 'string') {
      return pub.authors;
    }
    return '';
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

  function renderPublication(pub) {
    const authors = formatAuthors(pub);
    return `
      <article class="pub-item">
        <h3 class="pub-title">${escapeHtml(pub.title)}</h3>
        ${authors ? `<div class="pub-authors">${escapeHtml(authors)}</div>` : ''}
        ${!authors ? '<div class="pub-authors missing">Authors: (add in overrides)</div>' : ''}
        ${buildVenueLine(pub)}
        ${renderDoiLine(pub)}
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
