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
    const extractHeading = (text) => {
      const match = text.match(/^(.*?)(?:\s*\{#([\w-]+)\})?$/);
      if (!match) return { label: text, id: null };
      return { label: match[1].trim(), id: match[2] || null };
    };

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
        const { label, id } = extractHeading(trimmed.slice(4));
        const idAttr = id ? ` id="${id}"` : '';
        blocks.push(`<h3${idAttr}>${renderInline(label)}</h3>`);
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        const { label, id } = extractHeading(trimmed.slice(3));
        const idAttr = id ? ` id="${id}"` : '';
        blocks.push(`<h2${idAttr}>${renderInline(label)}</h2>`);
        return;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        const { label, id } = extractHeading(trimmed.slice(2));
        const idAttr = id ? ` id="${id}"` : '';
        blocks.push(`<h1${idAttr}>${renderInline(label)}</h1>`);
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
