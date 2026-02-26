(function (global) {
  const module = () => {
    const root = document.getElementById('research-page');
    if (!root) return;
    const cards = Array.from(root.querySelectorAll('[data-focus-card]'));
    const overlay = document.querySelector('[data-focus-overlay]');
    const mobileQuery = global.matchMedia('(max-width: 768px)');
    if (!cards.length || !overlay) return;

    let active = null;
    let lastTrigger = null;

    const focusFirstInPanel = (panel) => {
      const first = panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (first) {
        first.focus();
      } else {
        panel.focus();
      }
    };

    const setPanelState = (card, open) => {
      const trigger = card.querySelector('[data-focus-trigger]');
      const panel = card.querySelector('[data-focus-panel]');
      if (!trigger || !panel) return;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      card.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      if ('inert' in panel) {
        panel.inert = !open;
      }
    };

    const closeActive = ({ restoreFocus = true } = {}) => {
      if (!active) return;
      if (active) {
        const wrapper = active.closest('.research-focus-card-wrapper');
        if (wrapper) wrapper.classList.remove('has-open-card');
      }
      active.classList.remove('is-modal-open');
      setPanelState(active, false);
      overlay.classList.remove('is-visible');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('research-modal-open');
      if (restoreFocus && lastTrigger) {
        lastTrigger.focus();
      }
      active = null;
      lastTrigger = null;
    };

    const openCard = (card, trigger) => {
      if (active && active !== card) {
        closeActive({ restoreFocus: false });
      }
      const panel = card.querySelector('[data-focus-panel]');
      setPanelState(card, true);
      active = card;
      lastTrigger = trigger;

      const wrapper = card.closest('.research-focus-card-wrapper');
      if (wrapper) wrapper.classList.add('has-open-card');
      card.classList.add('is-modal-open');
      overlay.classList.add('is-visible');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('research-modal-open');
      if (panel) {
        focusFirstInPanel(panel);
      }
    };

    cards.forEach((card) => {
      const trigger = card.querySelector('[data-focus-trigger]');
      const panel = card.querySelector('[data-focus-panel]');
      const closeBtn = card.querySelector('[data-focus-close]');
      if (!trigger || !panel) return;

      // Keep the back face mounted; visibility is controlled by rotateY.
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'true');
      if ('inert' in panel) {
        panel.inert = true;
      }

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          closeActive();
          return;
        }
        openCard(card, trigger);
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', closeActive);
      }

      panel.addEventListener('click', () => {
        if (active !== card) return;
        closeActive();
      });
    });

    overlay.addEventListener('click', closeActive);

    document.addEventListener('click', (event) => {
      if (!active) return;
      if (mobileQuery.matches) return;
      if (active.contains(event.target)) return;
      closeActive();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeActive();
      }
    });

    mobileQuery.addEventListener('change', (event) => {
      if (!active) return;
      if (!event.matches) {
        active.classList.remove('is-modal-open');
        overlay.classList.remove('is-visible');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('research-modal-open');
      } else {
        active.classList.add('is-modal-open');
        overlay.classList.add('is-visible');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('research-modal-open');
      }
    });
  };

  global.PageModules = global.PageModules || {};
  global.PageModules.research = module;
})(window);
