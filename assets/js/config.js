// Настройки сайта. Контакты и точка приёма заявок вынесены сюда,
// чтобы при подключении CMS/API менять данные в одном месте.

export const CONTACTS = {
  salesPhone: '+78006007136',
  salesPhoneDisplay: '8 800 600 71 36',
  messengerPhone: '+79667708659',
  messengerPhoneDisplay: '+7 966 770 86 59',
  whatsappUrl: 'https://wa.me/79667708659',
  emails: ['alex.apartamenty@yandex.ru', 'alexresortapartments@mail.ru'],
};

// След за курсором (assets/js/modules/cursor-trail.js). Все параметры необязательны.
export const CURSOR_TRAIL = {
  enabled: true,
  colors: ['#b59779', '#51a1b4'], // основной цвет и цвет пика; можно '#233c57'
  shapes: 'circles', // 'circles' | 'squares' | 'triangles' | 'mixed' (как на zzir.ru)
  cellSize: 9, // шаг сетки, px — толщина «зерна»
  dotSize: 0.62, // размер фигуры в ячейке
  opacity: 0.78,
  splashRadius: 24, // ширина следа, px
  splashStrength: 0.3, // насыщенность и длина следа
  decay: 0.962, // скорость затухания: меньше — быстрее гаснет
  friction: 0.94, // плавность и инерция волны
  scope: null, // область действия, например '.hero, .gallery'; null — весь сайт
};

// Инерционная прокрутка (assets/js/modules/smooth-scroll.js, библиотека Lenis)
export const SMOOTH_SCROLL = {
  enabled: true,
  lerp: 0.11, // 0.06 — мягче и дольше, 0.12 — резче; 0.11 по замерам ближе всего к yesapart.com/invest
  wheelMultiplier: 1, // дальность прокрутки за один щелчок колеса
};

export const LEAD_API = {
  // Адрес обработчика заявок. Пока бэкенда нет — null,
  // и форма честно сообщает, что отправка не подключена.
  endpoint: null,
  timeoutMs: 15000,
};
