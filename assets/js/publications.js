(function () {
  const listEl = document.getElementById('publications-list');
  if (!listEl) return;

  const yearSelect = document.getElementById('filter-year');
  const searchInput = document.getElementById('filter-search');
  const firstAuthorToggle = document.getElementById('filter-first-author');
  const tagContainer = document.getElementById('filter-tags');
  const selectedList = document.getElementById('selected-publications-list');

  let activeTags = new Set();
  let publications = [];

  function renderSelected(items) {
    if (!selectedList) return;
    const selected = items.filter((pub) => pub.selected);
    selectedList.innerHTML = selected
      .map((pub) => {
        return `
          <div class="publication">
            <h4>${pub.title}</h4>
            <div class="meta">${pub.authors}</div>
            <small>${pub.venue} (${pub.year})</small>
            <p><strong>What's new:</strong> ${pub.whatsNew}</p>
            <p><strong>My role:</strong> ${pub.role}</p>
          </div>`;
      })
      .join('');
  }

  function renderTags(items) {
    if (!tagContainer) return;
    const tags = new Set();
    items.forEach((pub) => pub.tags.forEach((tag) => tags.add(tag)));
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
    const years = Array.from(new Set(items.map((pub) => pub.year))).sort((a, b) => b - a);
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
    if (firstAuthorToggle && firstAuthorToggle.checked && !pub.firstAuthor) return false;
    if (activeTags.size > 0 && !pub.tags.some((tag) => activeTags.has(tag))) return false;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (!query) return true;
    const haystack = [pub.title, pub.authors, pub.venue, pub.whatsNew, pub.role, pub.tags.join(' ')].join(' ').toLowerCase();
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
        return `
          <article class="publication">
            <h4>${pub.title}</h4>
            <div class="meta">${pub.authors}</div>
            <small>${pub.venue} (${pub.year})</small>
            ${renderLinks(pub.links)}
            <p><strong>What's new:</strong> ${pub.whatsNew}</p>
            <p><strong>My role:</strong> ${pub.role}</p>
          </article>`;
      })
      .join('');
  }

  fetch('assets/data/publications.json')
    .then((response) => response.json())
    .then((data) => {
      publications = data.publications;
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
