// Просмотр фото, видео и планировок через Fancybox (assets/js/vendor/fancybox.umd.js).
// Интерфейс прежний: openLightbox(items, start) и initLightbox() — остальные модули не менялись.

const L10N = {
  CLOSE: 'Закрыть',
  NEXT: 'Следующее',
  PREV: 'Предыдущее',
  MODAL: 'Просмотр фото и видео',
  ERROR: 'Не удалось загрузить. Попробуйте позже',
  IMAGE_ERROR: 'Изображение не найдено',
  ELEMENT_NOT_FOUND: 'Элемент не найден',
  AJAX_NOT_FOUND: 'Ошибка загрузки',
  AJAX_FORBIDDEN: 'Доступ запрещён',
  IFRAME_ERROR: 'Ошибка загрузки страницы',
  TOGGLE_ZOOM: 'Увеличить',
  TOGGLE_THUMBS: 'Миниатюры',
  TOGGLE_SLIDESHOW: 'Слайд-шоу',
  TOGGLE_FULLSCREEN: 'Во весь экран',
  DOWNLOAD: 'Скачать',
};

// Страница под окном не прокручивается (Lenis слушает класс is-locked)
const lock = { init: () => document.body.classList.add('is-locked'), destroy: () => document.body.classList.remove('is-locked') };

const OPTIONS = {
  l10n: L10N,
  on: lock,
  Hash: false,
  Carousel: {
    Toolbar: {
      display: { left: ['counter'], middle: [], right: ['zoomIn', 'fullscreen', 'close'] },
    },
  },
};

const toSlide = (item) => (item.type === 'video'
  ? { src: item.src, type: 'html5video', caption: item.caption, thumbSrc: item.poster }
  : { src: item.src, type: 'image', caption: item.caption, thumbSrc: item.thumb || item.src });

export function openLightbox(items, start = 0) {
  const { Fancybox } = window;
  if (!Fancybox) return;
  Fancybox.show(items.map(toSlide), { ...OPTIONS, startIndex: start });
}

export function initLightbox() {
  const { Fancybox } = window;
  if (!Fancybox) return;
  // Фото с атрибутом data-fancybox: группы по значению атрибута
  Fancybox.bind('[data-fancybox]', OPTIONS);
  // Одиночные планировки апартаментов
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-lightbox-single]');
    if (!trigger) return;
    openLightbox([{ type: 'image', src: trigger.dataset.lightboxSingle, caption: trigger.dataset.lightboxCaption || '' }]);
  });
}
