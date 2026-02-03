(function (global) {
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderInline(text) {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  function renderMarkdownToHtml(mdText) {
    if (!mdText) return '';
    const safe = escapeHtml(mdText.trim());
    const lines = safe.split(/\r?\n/);
    const blocks = [];
    let inList = false;

    const flushList = () => {
      if (inList) {
        blocks.push('</ul>');
        inList = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      if (trimmed.startsWith('### ')) {
        flushList();
        blocks.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        blocks.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
        return;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        blocks.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          blocks.push('<ul>');
          inList = true;
        }
        blocks.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
        return;
      }

      flushList();
      blocks.push(`<p>${renderInline(trimmed)}</p>`);
    });

    flushList();
    return blocks.join('\n');
  }

  global.Markdown = { renderMarkdownToHtml };
})(window);
