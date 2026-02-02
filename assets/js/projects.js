(function () {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  fetch('assets/data/projects.json')
    .then((response) => response.json())
    .then((data) => {
      grid.innerHTML = data.projects
        .map((project) => {
          return `
            <article class="card">
              <small class="badge">${project.year}</small>
              <h3>${project.title}</h3>
              <p>${project.summary}</p>
              <p><strong>My role:</strong> ${project.role}</p>
              <a class="btn ghost" href="projects/${project.slug}.html">View project</a>
            </article>`;
        })
        .join('');
    })
    .catch(() => {
      grid.innerHTML = '<p>Projects will appear here once the data file is available.</p>';
    });
})();
