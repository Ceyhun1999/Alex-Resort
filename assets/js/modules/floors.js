// Переключатель поэтажных планов (ARIA tabs)
import { openLightbox } from './lightbox.js';

const planSrc = (floor, size) => `assets/img/plans/floor-${floor}-${size}.webp`;

export function initFloors() {
  const root = document.querySelector('[data-floors]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-floor]')];
  const panel = root.querySelector('[role="tabpanel"]');
  const img = root.querySelector('[data-floor-img]');
  let current = tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.floor || '3';

  const select = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    current = tab.dataset.floor;
    panel.setAttribute('aria-labelledby', tab.id);
    img.classList.add('is-loading');
    const next = new Image();
    next.onload = () => {
      img.src = next.src;
      img.alt = `План ${current} этажа: однокомнатные апартаменты отмечены бежевым, двухкомнатные — сиреневым`;
      img.classList.remove('is-loading');
    };
    next.src = planSrc(current, 1200);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (event) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (event.key in keys) {
        event.preventDefault();
        select(tabs[(i + keys[event.key] + tabs.length) % tabs.length], true);
      } else if (event.key === 'Home') {
        event.preventDefault();
        select(tabs[0], true);
      } else if (event.key === 'End') {
        event.preventDefault();
        select(tabs[tabs.length - 1], true);
      }
    });
  });

  root.querySelector('[data-floor-zoom]').addEventListener('click', () => {
    openLightbox([{ type: 'image', src: planSrc(current, 2400), caption: `План ${current} этажа`, plan: true }]);
  });
}
