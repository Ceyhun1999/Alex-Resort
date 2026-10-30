// Плавающая кнопка связи: открывает меню мессенджеров и звонка.
// Поднимается над уведомлением о cookie и промо-полоской, если они под ней.

const GAP = 12;

export function initContactFab() {
  const fab = document.querySelector('[data-fab]');
  if (!fab) return;
  const toggle = fab.querySelector('[data-fab-toggle]');
  const menu = fab.querySelector('[data-fab-menu]');
  const label = 'Связаться с отделом продаж';
  toggle.setAttribute('aria-label', label);

  let isOpen = false;
  const setOpen = (open, { focus = false } = {}) => {
    isOpen = open;
    fab.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть список контактов' : label);
    // Фокус переводим только при открытии с клавиатуры, чтобы не было рамки после клика мышью
    if (open && focus) menu.querySelector('a, button')?.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', (event) => setOpen(!isOpen, { focus: event.detail === 0 }));

  // Привлечение внимания: кольца и покачивание работают постоянно (по просьбе заказчика).
  // Пока меню открыто, анимация на паузе; при prefers-reduced-motion её нет.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const syncPulse = () => fab.classList.toggle('is-pulsing', !reduce.matches && !isOpen);
  toggle.addEventListener('click', () => requestAnimationFrame(syncPulse));
  document.addEventListener('click', () => requestAnimationFrame(syncPulse));
  document.addEventListener('keydown', () => requestAnimationFrame(syncPulse));
  reduce.addEventListener('change', syncPulse);
  syncPulse();
  menu.addEventListener('click', (event) => { if (event.target.closest('a, button')) setOpen(false); });
  document.addEventListener('click', (event) => { if (isOpen && !fab.contains(event.target)) setOpen(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Подъём над нижними блоками, которые оказались под кнопкой
  const blockers = [...document.querySelectorAll('[data-cookie], [data-promo]')];
  const lift = () => {
    // Считаем от исходного положения: во время анимации подъёма текущий rect смещён
    const rect = toggle.getBoundingClientRect();
    const baseBottom = window.innerHeight - parseFloat(getComputedStyle(fab).bottom);
    const btn = { left: rect.left, right: rect.right, bottom: baseBottom };
    let need = 0;
    blockers.forEach((el) => {
      if (el.hidden || !el.classList.contains('is-visible')) return;
      // offset* — положение без transform: блок может ещё выезжать
      const r = { top: el.offsetTop, left: el.offsetLeft, right: el.offsetLeft + el.offsetWidth };
      const overlapX = r.left < btn.right && r.right > btn.left;
      if (overlapX && r.top < btn.bottom + GAP) need = Math.max(need, btn.bottom - r.top + GAP);
    });
    fab.style.setProperty('--fab-lift', `${Math.round(need)}px`);
  };
  const observer = new MutationObserver(() => requestAnimationFrame(lift));
  blockers.forEach((el) => observer.observe(el, { attributes: true, attributeFilter: ['class', 'hidden'] }));
  window.addEventListener('resize', lift);
  lift();

  // На телефоне в первом экране кнопка перекрыла бы «Получить презентацию»: прячем, пока он виден
  const heroCta = document.querySelector('.hero__cta');
  if (heroCta) {
    new IntersectionObserver(([entry]) => {
      fab.classList.toggle('is-near-hero-cta', entry.isIntersecting);
      if (entry.isIntersecting) setOpen(false);
    }).observe(heroCta);
  }
}
