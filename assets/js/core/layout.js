(function (global) {
  const { qs, qsa } = global.DOM || {
    qs: (s, c) => (c || document).querySelector(s),
    qsa: (s, c) => Array.from((c || document).querySelectorAll(s)),
  };

  const basePath = global.location.pathname.includes('/projects/') ? '../' : '';
  const partialRoot = `${basePath}assets/partials`;

  function applyBase(html) {
    return html.replaceAll('{{BASE}}', basePath);
  }

  function loadPartial(target, name) {
    return fetch(`${partialRoot}/${name}.html`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch partial: ${name}`);
        return res.text();
      })
      .then((html) => {
        target.innerHTML = applyBase(html);
      })
      .catch(() => {});
  }

  function initLayout() {
    const headers = qsa('[data-partial="header"]');
    const footers = qsa('[data-partial="footer"]');

    const tasks = [];
    headers.forEach((el) => tasks.push(loadPartial(el, 'header')));
    footers.forEach((el) => tasks.push(loadPartial(el, 'footer')));

    Promise.all(tasks).finally(() => {
      document.dispatchEvent(new CustomEvent('layout:ready'));
    });
  }

  global.LayoutLoader = { initLayout };
})(window);
