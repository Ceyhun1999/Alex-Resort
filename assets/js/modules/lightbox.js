// Просмотр фото, видео и планировок через Fancybox (assets/js/vendor/fancybox.umd.js).
// openLightbox(items, start) — галерея и планы; openVideo(...) — одно видео в отдельной «кинозале».

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
    Video: { autoplay: true },
  },
};

// Одно видео: без счётчика и миниатюр, только «Закрыть»; плеер оформлен в CSS (.alex-video)
const VIDEO_OPTIONS = {
  ...OPTIONS,
  mainClass: 'alex-video',
  dragToClose: false,
  idle: false, // кнопка «Закрыть» видна всегда, не прячется без движения мыши
  Carousel: {
    Toolbar: { display: { left: [], middle: [], right: ['close'] } },
    Thumbs: false,
    Video: { autoplay: true },
  },
};

const toSlide = (item) => (item.type === 'video'
  ? { src: item.src, type: 'html5video', poster: item.poster, caption: item.caption, thumbSrc: item.poster }
  : { src: item.src, type: 'image', caption: item.caption, thumbSrc: item.thumb || item.src });

export function openLightbox(items, start = 0) {
  const { Fancybox } = window;
  if (!Fancybox) return;
  Fancybox.show(items.map(toSlide), { ...OPTIONS, startIndex: start });
}

export function openVideo({ src, poster, caption }, triggerEl) {
  const { Fancybox } = window;
  if (!Fancybox) return;
  Fancybox.show([{ src, type: 'html5video', poster, caption }], { ...VIDEO_OPTIONS, triggerEl });
}

export function initLightbox() {
  const { Fancybox } = window;
  if (!Fancybox) return;
  // Фото с атрибутом data-fancybox: группы по значению атрибута
  Fancybox.bind('[data-fancybox]', OPTIONS);
  document.addEventListener('click', (event) => {
    // Одиночные планировки апартаментов
    const plan = event.target.closest('[data-lightbox-single]');
    if (plan) {
      openLightbox([{ type: 'image', src: plan.dataset.lightboxSingle, caption: plan.dataset.lightboxCaption || '' }]);
      return;
    }
    // Видео по кнопке Play (блок «О проекте»)
    const video = event.target.closest('[data-video-open]');
    if (video) {
      openVideo({ src: video.dataset.videoSrc, poster: video.dataset.videoPoster, caption: video.dataset.videoCaption || '' }, video);
    }
  });
}
