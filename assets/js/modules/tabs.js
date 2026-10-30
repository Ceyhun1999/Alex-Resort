// Простые ARIA-вкладки: [data-tabs] с role="tab" и aria-controls на панели
export function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    // Берём первый список вкладок: вложенные (например, этажи) обслуживают свои модули
    const list = root.querySelector('[role="tablist"]');
    const tabs = list ? [...list.querySelectorAll('[role="tab"]')] : [];
    if (!tabs.length) return;

    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) {
          panel.hidden = !on;
          if (on) panel.classList.add('is-entering');
        }
      });
      if (focus) tab.focus();
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      requestAnimationFrame(() => panel?.classList.remove('is-entering'));
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (event) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (step) {
          event.preventDefault();
          select(tabs[(i + step + tabs.length) % tabs.length], true);
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          select(tabs[event.key === 'Home' ? 0 : tabs.length - 1], true);
        }
      });
    });
  });
}
