(function (global) {
  const module = () => {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    fetch('assets/data/projects.json')
      .then((response) => response.json())
      .then((data) => {
        const projects = data.projects || [];
        container.innerHTML = projects
          .map((project) => {
            return `
              <article class="card project-card">
                <h3>${project.title}</h3>
                <p class="meta">${project.year}</p>
                <p>${project.summary}</p>
                <p class="meta"><strong>Role:</strong> ${project.role}</p>
                <div class="tag-list">${(project.methods || []).map((m) => `<span class="badge">${m}</span>`).join('')}</div>
                <a href="projects/${project.slug}.html">Open project</a>
              </article>`;
          })
          .join('');
      })
      .catch(() => {
        container.innerHTML = '<p>Projects data is not available at the moment.</p>';
      });
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.projects = module;
})(window);
