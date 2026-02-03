(function (global) {
  const module = () => {
    const root = document.getElementById('research-page');
    if (!root) return;
    const buttons = Array.from(document.querySelectorAll('.view-toggle-btn'));
    if (!buttons.length || !global.ToggleView) return;
    global.ToggleView.initToggle({
      buttons,
      storageKey: 'researchView',
      classScientific: 'mode-scientific',
      classGeneral: 'mode-general',
      defaultView: 'scientific'
    });
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.research = module;
})(window);
