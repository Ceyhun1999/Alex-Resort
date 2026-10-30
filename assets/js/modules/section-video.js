// Видео «О проекте»: по кнопке Play проигрывается полный ролик со звуком и стандартными
// элементами управления (пауза, громкость, полный экран). Сам по себе не запускается.
export function initSectionVideos() {
  const video = document.querySelector('[data-about-video]');
  const button = document.querySelector('[data-about-play]');
  if (!video || !button) return;
  const media = video.closest('.about__media');

  const reset = () => {
    media.classList.remove('is-playing');
    video.classList.remove('is-playing');
    video.controls = false;
    button.focus({ preventScroll: true });
  };

  button.addEventListener('click', () => {
    if (!video.src) video.src = video.dataset.src;
    video.muted = false;
    video.controls = true;
    media.classList.add('is-playing');
    video.classList.add('is-playing');
    video.play().then(() => video.focus({ preventScroll: true })).catch(() => reset());
  });

  video.addEventListener('ended', reset);
  // Уходя из блока, ролик ставится на паузу, чтобы звук не играл за кадром
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && !video.paused) video.pause();
  }, { threshold: 0.2 }).observe(video);
}
