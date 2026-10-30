// Инерционная прокрутка колесом (Lenis) с физикой, подобранной под yesapart.com/invest:
// там контент догоняет нативную позицию с коэффициентом 0.1 за кадр 16 мс.
// Работает только с мышью/трекпадом; на сенсорных экранах и при prefers-reduced-motion — нативный скролл.

const DEFAULTS = {
  lerp: 0.11, // плавность догоняния: больше — резче, меньше — «ватнее»
  wheelMultiplier: 1,
  smoothWheel: true,
  syncTouch: false,
  allowNestedScroll: true, // textarea и другие прокручиваемые блоки прокручиваются сами
};
// Отступ под шапку Lenis берёт из scroll-padding-top у <html> (base.css), отдельно его не задаём

let lenis = null;

export const getLenis = () => lenis;

export function initSmoothScroll(options = {}) {
  const { Lenis, gsap, ScrollTrigger } = window;
  if (!Lenis) return null;
  const settings = { ...DEFAULTS, ...options };
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const tick = (time) => lenis?.raf(time * 1000);
  let observer = null;

  // Пока открыт диалог или мобильное меню, страница под ними не прокручивается
  const syncLock = () => {
    if (!lenis) return;
    const locked = document.querySelector('dialog[open]') || document.body.classList.contains('is-locked');
    if (locked) lenis.stop();
    else lenis.start();
  };

  const onAnchorClick = (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !lenis || event.defaultPrevented || link.classList.contains('skip-link')) return;
    const id = link.getAttribute('href');
    const target = id === '#top' ? 0 : id.length > 1 && document.querySelector(id);
    if (target === null || target === false) return;
    event.preventDefault();
    // Ждём кадр: мобильное меню успевает закрыться и снять блокировку
    requestAnimationFrame(() => lenis?.scrollTo(target));
  };

  const create = () => {
    if (lenis) return;
    lenis = new Lenis({
      lerp: settings.lerp,
      wheelMultiplier: settings.wheelMultiplier,
      smoothWheel: settings.smoothWheel,
      syncTouch: settings.syncTouch,
      allowNestedScroll: settings.allowNestedScroll,
      autoRaf: !gsap,
      anchors: false, // якоря обрабатываем сами: учитываем мобильное меню и логотип (#top)
      // Внутри диалогов и меню прокрутка остаётся нативной
      prevent: (node) => Boolean(node.closest?.('dialog, .mobile-menu, .fancybox__container, [data-lenis-prevent]')),
    });
    // Один цикл анимации на всё: Lenis обновляется тиком GSAP, ScrollTrigger — событием Lenis
    if (gsap) {
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    document.addEventListener('click', onAnchorClick);
    observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.querySelectorAll('dialog').forEach((d) => observer.observe(d, { attributes: true, attributeFilter: ['open'] }));
    root.classList.add('has-smooth-scroll');
    syncLock();
  };

  const destroy = () => {
    if (!lenis) return;
    gsap?.ticker.remove(tick);
    document.removeEventListener('click', onAnchorClick);
    observer?.disconnect();
    lenis.destroy();
    lenis = null;
    root.classList.remove('has-smooth-scroll');
  };

  const sync = () => (finePointer.matches && !reduceMotion.matches ? create() : destroy());
  finePointer.addEventListener('change', sync);
  reduceMotion.addEventListener('change', sync);
  sync();
  return lenis;
}
