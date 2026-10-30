// Галерея: превью на странице открывают общий лайтбокс
import { GALLERY } from '../data/gallery.js';
import { openLightbox } from './lightbox.js';

export function initGallery() {
  document.querySelectorAll('[data-gallery-index], [data-gallery-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const start = Number(trigger.dataset.galleryIndex ?? trigger.dataset.galleryOpen ?? 0);
      // Кнопка «все фото» начинает с первого фото, а не с видео
      openLightbox(GALLERY, trigger.hasAttribute('data-gallery-open') ? 1 : start);
    });
  });

  const more = document.querySelector('.shot__more');
  if (more) more.textContent = `+${GALLERY.length - 5} фото`;
}
