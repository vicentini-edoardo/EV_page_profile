(function (global) {
  function initToggle({
    buttons,
    storageKey,
    classScientific,
    classGeneral,
    defaultView = 'scientific'
  }) {
    if (!buttons || !buttons.length) return;
    const stored = global.StorageUtil ? global.StorageUtil.get(storageKey, defaultView) : defaultView;
    const initial = stored === 'general' ? 'general' : 'scientific';

    const applyMode = (mode) => {
      document.body.classList.remove(classScientific, classGeneral);
      document.body.classList.add(mode === 'general' ? classGeneral : classScientific);
      if (global.StorageUtil) {
        global.StorageUtil.set(storageKey, mode);
      }
      buttons.forEach((btn) => {
        const isActive = btn.dataset.view === mode;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.tabIndex = isActive ? 0 : -1;
      });
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => applyMode(btn.dataset.view));
    });

    applyMode(initial);
  }

  global.ToggleView = { initToggle };
})(window);
