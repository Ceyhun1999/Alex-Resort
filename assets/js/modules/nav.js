// Шапка: фон при прокрутке, мобильное меню, активный пункт навигации

export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-solid', window.scrollY > 24);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

export function initMobileMenu() {
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-mobile-menu]');
  const header = document.querySelector('[data-header]');
  if (!burger || !menu) return;
  const outside = [document.querySelector('main'), document.querySelector('footer')];
  const desktop = matchMedia('(min-width: 1200px)');

  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.querySelector('.visually-hidden').textContent = open ? 'Закрыть меню' : 'Меню';
    header.classList.toggle('is-menu-open', open);
    document.body.classList.toggle('is-locked', open);
    outside.forEach((el) => el && (el.inert = open));
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      menu.querySelector('a')?.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => { if (burger.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, reduce ? 0 : 320);
    }
  };

  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a, [data-modal-open]')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });
  desktop.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

export function initActiveSection() {
  const links = [...document.querySelectorAll('.nav__list a')];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => observer.observe(s));
}
