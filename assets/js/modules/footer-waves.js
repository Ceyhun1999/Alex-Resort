// Морские волны (подвал, галерея) двигаются только когда блок виден — без лишней нагрузки при прокрутке
export function initFooterWaves() {
  const blocks = document.querySelectorAll('[data-footer-waves]');
  if (!blocks.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => target.classList.toggle('is-paused', !isIntersecting));
  });
  blocks.forEach((waves) => {
    waves.classList.add('is-paused');
    observer.observe(waves);
  });
}
