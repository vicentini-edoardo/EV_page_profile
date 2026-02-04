(function (global) {
  const cache = new Map();

  async function loadMarkdown(path) {
    if (cache.has(path)) return cache.get(path);
    const promise = fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load');
        return response.text();
      })
      .catch(() => null);
    cache.set(path, promise);
    return promise;
  }

  async function renderMarkdownInto(el, path) {
    const markdown = await loadMarkdown(path);
    if (!markdown) {
      if (!el.dataset.mdWarned) {
        console.warn(`Markdown content unavailable: ${path}`);
        el.dataset.mdWarned = 'true';
      }
      el.innerHTML = '<p>Content unavailable. Please refresh or check deployment.</p>';
      return;
    }
    let renderer = global.Markdown ? global.Markdown.renderMarkdownToHtml : (t) => t;
    if (el.dataset.mdLayout === 'cards' && global.Markdown && global.Markdown.renderMarkdownToHtmlWithSections) {
      renderer = global.Markdown.renderMarkdownToHtmlWithSections;
    }
    el.innerHTML = renderer(markdown);
  }

  global.ContentLoader = { loadMarkdown, renderMarkdownInto };
})(window);
