(function (global) {
  const module = () => {
    const root = document.getElementById('research-page');
    if (!root) return;

    const initResearchToggle = () => {
      const toggleBtns = Array.from(root.querySelectorAll('[data-research-view]'));
      if (!toggleBtns.length) return;
      const narrativeContent = root.querySelector('.research-narrative-content');
      if (!narrativeContent) return;

      const applyView = (view) => {
        narrativeContent.classList.remove('research-density-general', 'research-density-technical');
        narrativeContent.classList.add(`research-density-${view}`);
        toggleBtns.forEach((btn) => {
          const active = btn.dataset.researchView === view;
          btn.classList.toggle('is-active', active);
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        if (global.StorageUtil) {
          global.StorageUtil.set('researchView', view);
        }
      };

      toggleBtns.forEach((btn) => {
        btn.addEventListener('click', () => applyView(btn.dataset.researchView));
        btn.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const current = btn.dataset.researchView === 'technical' ? 1 : 0;
          const nextIndex = event.key === 'ArrowRight' ? Math.min(1, current + 1) : Math.max(0, current - 1);
          const next = toggleBtns[nextIndex];
          if (!next) return;
          applyView(next.dataset.researchView);
          next.focus();
        });
      });

      const stored = global.StorageUtil ? global.StorageUtil.get('researchView', 'general') : 'general';
      applyView(stored === 'technical' ? 'technical' : 'general');
    };

    initResearchToggle();
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.research = module;
})(window);
