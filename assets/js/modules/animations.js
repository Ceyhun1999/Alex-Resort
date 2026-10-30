// Анимации: один оркестрованный вход на первом экране и сдержанные раскрытия при прокрутке.
// Анимируются только transform и opacity. При prefers-reduced-motion — короткие fade без движения.

export function initAnimations() {
  const root = document.documentElement;
  const { gsap, ScrollTrigger } = window;
  if (!gsap) {
    root.classList.remove('motion');
    return;
  }
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  mm.add({
    motionOK: '(prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)',
  }, (ctx) => {
    const { motionOK } = ctx.conditions;
    const hero = {
      lines: gsap.utils.toArray('[data-hero-line]'),
      items: gsap.utils.toArray('[data-hero-item]'),
      poster: document.querySelector('.hero__media'),
    };

    if (!motionOK) {
      gsap.set([...hero.lines, ...hero.items], { opacity: 1, clearProps: 'transform' });
      root.classList.remove('motion');
      window.__heroAnimated = true;
      return;
    }

    // --- Первый экран ---
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onStart: () => { window.__heroAnimated = true; },
    });
    tl.fromTo(hero.poster, { scale: 1.06 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .fromTo(hero.items[0], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
      .fromTo(hero.lines, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 1.05, stagger: 0.12 }, 0.3)
      .fromTo(hero.items.slice(1), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.75);
    root.classList.remove('motion');

    if (!ScrollTrigger) return;

    // --- Раскрытие изображений: кадр «оседает» из лёгкого увеличения ---
    gsap.utils.toArray('.reveal-media').forEach((wrap) => {
      const img = wrap.querySelector('img');
      if (!img || wrap.closest('.hero')) return;
      gsap.fromTo(wrap, { opacity: 0 }, {
        opacity: 1, duration: 0.9, ease: 'power1.out',
        scrollTrigger: { trigger: wrap, start: 'top 88%', once: true },
      });
      gsap.fromTo(img, { scale: 1.12 }, {
        scale: 1, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: wrap, start: 'top 88%', once: true },
        clearProps: 'transform',
      });
    });
  });
}
