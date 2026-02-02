(function () {
  const toggle = document.getElementById('density-toggle');
  const root = document.body;
  if (!toggle) return;

  const stored = localStorage.getItem('research-density') || 'general';
  const isTechnical = stored === 'technical';
  toggle.checked = isTechnical;
  root.classList.add(isTechnical ? 'research-density-technical' : 'research-density-general');

  toggle.addEventListener('change', () => {
    root.classList.remove('research-density-general', 'research-density-technical');
    const next = toggle.checked ? 'technical' : 'general';
    root.classList.add(next === 'technical' ? 'research-density-technical' : 'research-density-general');
    localStorage.setItem('research-density', next);
  });
})();
