(function () {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const parseYear = (value) => {
    if (!value) return 0;
    const match = String(value).match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 0;
  };

  fetch('assets/data/projects.json')
    .then((response) => response.json())
    .then((data) => {
      const projects = Array.isArray(data.projects) ? data.projects.slice() : [];
      projects.sort((a, b) => {
        const yearA = parseYear(a.year);
        const yearB = parseYear(b.year);
        if (yearA !== yearB) return yearB - yearA;
        return (a.title || '').localeCompare(b.title || '');
      });

      grid.innerHTML = projects
        .map((project) => {
          return `
            <article class="card">
              <div class="meta">${project.year || ''}</div>
              <h3>${project.title}</h3>
              <p>${project.summary}</p>
              <p><strong>My role:</strong> ${project.role}</p>
              <div class="tag-list">${(project.methods || []).map((m) => `<span class=\"pill\">${m}</span>`).join('')}</div>
              <a class="btn ghost" href="projects/${project.slug}.html">View project</a>
            </article>`;
        })
        .join('');
    })
    .catch(() => {
      grid.innerHTML = '<p>Projects will appear here once the data file is available.</p>';
    });
})();
