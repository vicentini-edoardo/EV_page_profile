(function (global) {
  const module = () => {
    const root = document.getElementById('cv-page-body');
    const content = root ? root.querySelector('.cv-content') : null;
    if (!content) return;

    const sections = Array.from(content.querySelectorAll('.card-block'));
    if (!sections.length) return;

    const getHeadingNode = (section) =>
      section.querySelector(':scope > h2') || section.querySelector('h2');

    const getTitle = (section, index) => {
      if (section.dataset.cvTitle) return section.dataset.cvTitle;
      const heading = getHeadingNode(section);
      if (heading && heading.textContent) return heading.textContent.trim();
      return index === 0 ? 'Profile' : `Section ${index + 1}`;
    };

    const getIcon = (section) => {
      const name = section.dataset.cvIcon;
      if (!name) return '';
      const icons = {
        'user-circle': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.5"></circle><path d="M5.5 19a6.5 6.5 0 0 1 13 0"></path><circle cx="12" cy="12" r="9"></circle></svg>',
        briefcase: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3 12h18"></path></svg>',
        'graduation-cap': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z"></path><path d="M6 11.5v4c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3v-4"></path></svg>',
        sparkles: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z"></path><path d="m5 15 .9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9L5 15Zm14-2 .9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9L19 13Z"></path></svg>',
        award: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4.5"></circle><path d="M8.8 12.9 7 20l5-2.1L17 20l-1.8-7.1"></path></svg>',
        'flask-conical': '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 3h4"></path><path d="M10 3v4.2l-5.5 9A3 3 0 0 0 7 21h10a3 3 0 0 0 2.5-4.8l-5.5-9V3"></path><path d="M8.5 14h7"></path></svg>',
        languages: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h10"></path><path d="M7 6v12"></path><path d="M3 18h8"></path><path d="m14 9 2.5 7L19 9l2.5 7"></path></svg>'
      };
      return icons[name] || '';
    };

    const openSection = (section) => {
      sections.forEach((item) => {
        const trigger = item.querySelector('[data-cv-trigger]');
        const panel = item.querySelector('[data-cv-panel]');
        const isTarget = item === section;
        item.classList.toggle('is-open', isTarget);
        if (trigger) trigger.setAttribute('aria-expanded', isTarget ? 'true' : 'false');
        if (panel) panel.hidden = !isTarget;
      });
    };

    const closeSection = (section) => {
      const trigger = section.querySelector('[data-cv-trigger]');
      const panel = section.querySelector('[data-cv-panel]');
      section.classList.remove('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
    };

    sections.forEach((section, index) => {
      const title = getTitle(section, index);
      const panel = document.createElement('div');
      panel.className = 'cv-section-panel';
      panel.setAttribute('data-cv-panel', '');

      const headingNode = getHeadingNode(section);
      if (headingNode) {
        headingNode.remove();
      }

      // Keep existing content structure but drive disclosure with a dedicated trigger.
      while (section.firstChild) {
        panel.appendChild(section.firstChild);
      }

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'cv-section-trigger';
      trigger.setAttribute('data-cv-trigger', '');
      trigger.setAttribute('aria-expanded', 'false');
      const iconMarkup = getIcon(section);
      trigger.innerHTML = iconMarkup
        ? `<span class="cv-section-trigger__label"><span class="cv-section-trigger__icon">${iconMarkup}</span><span class="cv-section-trigger__text">${title}</span></span>`
        : `<span class="cv-section-trigger__text">${title}</span>`;

      section.appendChild(trigger);
      section.appendChild(panel);

      trigger.addEventListener('click', () => {
        const isOpen = section.classList.contains('is-open');
        if (isOpen) {
          closeSection(section);
        } else {
          openSection(section);
        }
      });
    });

    const hash = global.location.hash ? global.location.hash.slice(1) : '';
    const fromHash = hash ? sections.find((section) => section.id === hash) : null;
    openSection(fromHash || sections[0]);
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.cv = module;
})(window);
