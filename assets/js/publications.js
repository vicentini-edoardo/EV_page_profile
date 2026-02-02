(function () {
  const listEl = document.getElementById('publications-list');
  if (!listEl) return;

  const yearSelect = document.getElementById('filter-year');
  const searchInput = document.getElementById('filter-search');
  const firstAuthorToggle = document.getElementById('filter-first-author');
  const tagContainer = document.getElementById('filter-tags');
  const selectedList = document.getElementById('selected-publications-list');
  const firstAuthorHint = document.getElementById('first-author-hint');

  let activeTags = new Set();
  let publications = [];
  let hasAuthors = false;

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

  function renderSelected(items) {
    if (!selectedList) return;
    const selected = items.filter((pub) => pub.selected);
    const maxItems = selected.length ? selected.slice(0, 8) : items.slice(0, 5);
    selectedList.innerHTML = maxItems
      .map((pub) => {
        const authors = formatAuthors(pub);
        return `
          <div class="publication">
            <h4>${pub.title}</h4>
            ${authors ? `<div class="meta">${authors}</div>` : ''}
            <small>${pub.venue}${pub.year ? ` (${pub.year})` : ''}</small>
            ${pub.my_role ? `<p><strong>My role:</strong> ${pub.my_role}</p>` : ''}
            ${renderLinks(pub.links)}
          </div>`;
      })
      .join('');
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
      if (hasAuthors && pub.authors) {
        if (!isFirstAuthor(pub)) return false;
      }
    }
    if (activeTags.size > 0 && !(pub.tags || []).some((tag) => activeTags.has(tag))) return false;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (!query) return true;
    const haystack = [
      pub.title,
      formatAuthors(pub),
      pub.venue,
      pub.type,
      pub.doi,
      pub.tags ? pub.tags.join(' ') : ''
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  function renderLinks(links) {
    if (!links) return '';
    const pairs = Object.entries(links).filter(([, value]) => value);
    if (!pairs.length) return '';
    return `
      <div class="inline-links">
        ${pairs
          .map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label.toUpperCase()}</a>`)
          .join('')}
      </div>`;
  }

  function renderList() {
    const filtered = publications.filter(matchesFilters);
    listEl.innerHTML = filtered
      .map((pub) => {
        const authors = formatAuthors(pub);
        return `
          <article class="publication">
            <h4>${pub.title}</h4>
            ${authors ? `<div class="meta">${authors}</div>` : ''}
            <small>${pub.venue}${pub.year ? ` (${pub.year})` : ''}</small>
            ${renderLinks(pub.links)}
            ${pub.my_role ? `<p><strong>My role:</strong> ${pub.my_role}</p>` : ''}
          </article>`;
      })
      .join('');
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
      hasAuthors = publications.some((pub) => Array.isArray(pub.authors) ? pub.authors.length : typeof pub.authors === 'string');
      if (firstAuthorToggle && !hasAuthors) {
        firstAuthorToggle.disabled = true;
        if (firstAuthorHint) {
          firstAuthorHint.textContent = 'First-author filter requires curated authors in overrides.';
        }
      }
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
})();
