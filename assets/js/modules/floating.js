// Фиксированные блоки: уведомление о cookie и промо-карточка в левом нижнем углу.
// Постер виден только ниже первого экрана и прячется при возврате к нему;
// на узких экранах он ждёт ответа на уведомление о cookie.
// Слайды листаются только вручную, поэтому кнопка паузы не нужна (WCAG 2.2.2).

const COOKIE_KEY = 'alex-cookie-accepted';
const PROMO_KEY = 'alex-promo-closed';
const LEAVE_MS = 260;

const store = {
  get(area, key) { try { return area.getItem(key); } catch { return null; } },
  set(area, key, value) { try { area.setItem(key, value); } catch { /* приватный режим */ } },
};

// Таймер скрытия хранится на элементе: если блок снова показали раньше, он не исчезнет
function show(el) {
  clearTimeout(el._hideTimer);
  el.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));
}

function hide(el, done) {
  el.classList.remove('is-visible');
  clearTimeout(el._hideTimer);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el._hideTimer = setTimeout(() => { el.hidden = true; done?.(); }, reduce ? 0 : LEAVE_MS);
}

function initPromo(promo) {
  const slides = [...promo.querySelectorAll('[data-promo-slide]')];
  let index = 0;

  const go = () => {
    slides[index].classList.remove('is-active');
    slides[index].hidden = true;
    index = (index + 1) % slides.length;
    slides[index].hidden = false;
    // Перезапуск анимации появления слайда
    void slides[index].offsetWidth;
    slides[index].classList.add('is-active');
  };

  promo.querySelector('[data-promo-next]').hidden = slides.length < 2;
  promo.querySelector('[data-promo-next]').addEventListener('click', go);
  let closed = false;
  let parked = false; // скрыт после перехода по кнопке до возврата к первому экрану
  let visible = false;
  const hero = document.querySelector('.hero');
  const pastHero = () => !hero || hero.getBoundingClientRect().bottom <= 0;

  const sync = () => {
    const past = pastHero();
    if (!past) parked = false;
    const want = past && !closed && !parked;
    if (want === visible) return;
    visible = want;
    if (want) show(promo);
    else hide(promo);
  };

  promo.querySelector('[data-promo-close]').addEventListener('click', () => {
    store.set(sessionStorage, PROMO_KEY, '1');
    closed = true;
    sync();
  });
  // После перехода по кнопке карточка уступает место контенту
  promo.addEventListener('click', (event) => {
    if (!event.target.closest('.promo__cta')) return;
    parked = true;
    sync();
  });

  // Постер виден только ниже первого экрана: при возврате к видео он прячется
  return () => {
    if (store.get(sessionStorage, PROMO_KEY)) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; sync(); });
    }, { passive: true });
    sync();
  };
}

export function initFloating() {
  const cookie = document.querySelector('[data-cookie]');
  const promo = document.querySelector('[data-promo]');
  const startPromo = promo ? initPromo(promo) : () => {};
  // На широком экране постер и уведомление стоят в разных углах, на узком — по очереди
  const roomForBoth = matchMedia('(min-width: 1200px)').matches;

  if (!cookie || store.get(localStorage, COOKIE_KEY)) {
    startPromo();
    return;
  }
  setTimeout(() => show(cookie), 900);
  if (roomForBoth) startPromo();
  cookie.querySelector('[data-cookie-accept]').addEventListener('click', () => {
    store.set(localStorage, COOKIE_KEY, '1');
    hide(cookie, () => { if (!roomForBoth) startPromo(); });
  });
}
