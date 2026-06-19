(function (global) {
  const module = () => {
    const root = document.getElementById('research-page');
    if (!root) return;

    const items = Array.from(root.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    const reduceMotion =
      global.matchMedia &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in global)) {
      items.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    // Opt in to the hidden initial state only now that we can animate it back.
    document.body.classList.add('reveal-on');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );

    items.forEach((el) => observer.observe(el));
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.research = module;
})(window);
