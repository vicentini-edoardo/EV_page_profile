(function () {
  function initResearchToggle() {
    const root = document.getElementById('research-page');
    if (!root) return;

    const buttons = Array.from(document.querySelectorAll('.view-toggle-btn'));
    if (!buttons.length) return;

    const stored = localStorage.getItem('researchView');
    const initial = stored === 'general' ? 'general' : 'scientific';

    const applyMode = (mode) => {
      document.body.classList.remove('mode-scientific', 'mode-general');
      document.body.classList.add(mode === 'general' ? 'mode-general' : 'mode-scientific');
      localStorage.setItem('researchView', mode);
      buttons.forEach((btn) => {
        const isActive = btn.dataset.view === mode;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.tabIndex = isActive ? 0 : -1;
      });
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        applyMode(btn.dataset.view);
      });
    });

    applyMode(initial);
  }

  window.initResearchToggle = initResearchToggle;
  document.addEventListener('DOMContentLoaded', initResearchToggle);
})();
