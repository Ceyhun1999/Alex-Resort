// Фоновое видео первого экрана: проигрывается один раз и не дольше 5 секунд,
// затем замирает на кадре. Так движение укладывается в WCAG 2.2.2 без кнопки паузы.

const MAX_PLAY_SECONDS = 5;

export function initHeroVideo() {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData;
  // При «уменьшении движения» и экономии трафика остаётся статичный кадр
  if (reduce.matches || saveData) return;

  let finished = false;
  const stop = () => {
    finished = true;
    video.pause();
  };
  const play = () => {
    if (finished) return;
    video.play().then(() => video.classList.add('is-playing')).catch(() => {});
  };

  video.loop = false;
  video.src = matchMedia('(min-width: 1280px)').matches ? video.dataset.srcLg : video.dataset.srcSm;
  video.addEventListener('canplay', play, { once: true });
  video.addEventListener('timeupdate', () => { if (video.currentTime >= MAX_PLAY_SECONDS) stop(); });
  video.addEventListener('ended', stop);
  video.load();

  // Пока первый экран не виден, видео стоит; досматривается, когда к нему вернулись
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) play();
    else video.pause();
  }).observe(video);

  reduce.addEventListener('change', (e) => { if (e.matches) stop(); });
}
