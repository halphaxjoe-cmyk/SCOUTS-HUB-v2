
/**
 * SCOUT HUB V15.14 — Multi-page Lessons
 * Each lesson is split into pages of <= 3000 characters.
 * Usage:
 *   const pages = ScoutLessonPages.paginate(text, 3000);
 *   ScoutLessonPages.mount(container, pages);
 */
window.ScoutLessonPages = (() => {
  const MAX = 3000;

  function paginate(text, max = MAX) {
    text = String(text || '').trim();
    if (!text) return [];
    const chunks = [];
    let rest = text;

    while (rest.length > max) {
      let cut = max;
      const paragraph = rest.lastIndexOf('\n\n', max);
      const sentence = Math.max(
        rest.lastIndexOf('. ', max),
        rest.lastIndexOf('! ', max),
        rest.lastIndexOf('? ', max)
      );
      if (paragraph > Math.floor(max * 0.65)) cut = paragraph + 2;
      else if (sentence > Math.floor(max * 0.65)) cut = sentence + 1;

      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  function mount(container, pages, options = {}) {
    if (!container) return;
    let index = 0;
    const title = options.title || 'Leçon';

    const render = () => {
      container.innerHTML = '';
      const wrap = document.createElement('section');
      wrap.className = 'lesson-pager';

      const heading = document.createElement('div');
      heading.className = 'lesson-pager__heading';
      heading.innerHTML = `<span>${escapeHtml(title)}</span><span>${index + 1} / ${pages.length}</span>`;
      wrap.appendChild(heading);

      const content = document.createElement('article');
      content.className = 'lesson-pager__content';
      content.textContent = pages[index] || '';
      wrap.appendChild(content);

      const nav = document.createElement('div');
      nav.className = 'lesson-pager__nav';

      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'lesson-pager__button';
      prev.textContent = '← Précédent';
      prev.disabled = index === 0;
      prev.onclick = () => { index--; render(); };

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'lesson-pager__button lesson-pager__button--primary';
      next.textContent = index === pages.length - 1 ? '✓ Terminer' : 'Suivant →';
      next.onclick = () => {
        if (index < pages.length - 1) { index++; render(); }
        else if (typeof options.onComplete === 'function') options.onComplete();
      };

      nav.append(prev, next);
      wrap.appendChild(nav);
      container.appendChild(wrap);
    };

    render();
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[c]));
  }

  return { paginate, mount, MAX };
})();
