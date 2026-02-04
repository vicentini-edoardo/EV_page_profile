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

  const extractHeading = (text) => {
    const match = text.match(/^(.*?)(?:\s*\{#([\w-]+)\})?$/);
    if (!match) return { label: text, id: null };
    return { label: match[1].trim(), id: match[2] || null };
  };

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

  function renderMarkdownToHtmlWithSections(mdText) {
    if (!mdText) return '';
    const safe = escapeHtml(mdText.trim());
    const lines = safe.split(/\r?\n/);
    const sections = [];
    let current = [];
    let inList = false;

    const flushList = () => {
      if (inList) {
        current.push('</ul>');
        inList = false;
      }
    };

    const flushSection = () => {
      flushList();
      if (current.length) {
        sections.push(current.join('\n'));
        current = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      if (trimmed.startsWith('## ')) {
        flushSection();
        const { label, id } = extractHeading(trimmed.slice(3));
        const idAttr = id ? ` id="${id}"` : '';
        current.push(`<h2${idAttr}>${renderInline(label)}</h2>`);
        return;
      }

      if (trimmed.startsWith('### ')) {
        flushList();
        const { label, id } = extractHeading(trimmed.slice(4));
        const idAttr = id ? ` id="${id}"` : '';
        current.push(`<h3${idAttr}>${renderInline(label)}</h3>`);
        return;
      }

      if (trimmed.startsWith('# ')) {
        flushList();
        const { label, id } = extractHeading(trimmed.slice(2));
        const idAttr = id ? ` id="${id}"` : '';
        current.push(`<h1${idAttr}>${renderInline(label)}</h1>`);
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          current.push('<ul>');
          inList = true;
        }
        current.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
        return;
      }

      flushList();
      current.push(`<p>${renderInline(trimmed)}</p>`);
    });

    flushSection();
    return sections.map((section) => `<div class="md-section card">${section}</div>`).join('\n');
  }

  global.Markdown = { renderMarkdownToHtml, renderMarkdownToHtmlWithSections };
})(window);
