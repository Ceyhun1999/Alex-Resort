# ALEX Resort & Spa Apartments — фронтенд (этап 1)

Статический сайт: HTML + CSS + ES-модули, GSAP 3.13 (локально в `assets/js/vendor`). Сборка не нужна.

## Запуск

```bash
python3 -m http.server 5173
# открыть http://127.0.0.1:5173
```

Нужен именно локальный сервер: ES-модули не работают при открытии файла через `file://`.

## Структура

```text
index.html                 разметка всех секций
assets/css/
  tokens.css               цвета, шрифты, отступы (брендбук)
  base.css                 сброс, типографика, утилиты
  components.css           кнопки, поля, модальные окна, лайтбокс, toast
  layout.css               шапка, мобильное меню, подвал
  sections.css             секции страницы
assets/js/
  main.js                  точка входа
  config.js                контакты и адрес API заявок (LEAD_API.endpoint)
  data/gallery.js          материалы галереи (структура под CMS)
  modules/                 nav, modal, forms, phone-mask, lead-service, lightbox,
                           gallery, floors, hero-video, copy-max, toast, animations
assets/img/brand/          логотип: оригиналы (Logo.png/pdf) и SVG-варианты
assets/img/photos/         кадры из видео и буклета, WebP 640/1280/1920
assets/img/plans/          планировки апартаментов и поэтажные планы 3–7
assets/video/              hero-петля (1920/1280) и полное видео 720p
assets/docs/               буклет и поэтажные планы в сжатом PDF
materials_for_website/     исходники клиента (не изменялись)
```

## След за курсором

Модуль `assets/js/modules/cursor-trail.js`, настройки — `CURSOR_TRAIL` в `assets/js/config.js`
(цвета, фигуры, шаг сетки, ширина и сила следа, затухание, инерция, область действия `scope`).
Механика повторяет zzir.ru (ShapeWaves): волновое поле на сетке, всплеск от курсора, быстрое затухание,
импульс вперёд после резкого движения. Canvas 2D, один `<canvas>` с `pointer-events: none`,
цикл `requestAnimationFrame` работает только пока след виден.
Отключается на сенсорных устройствах и при `prefers-reduced-motion`. Над полями ввода след не рисуется,
над кнопками и ссылками ослаблен. Исключить область: атрибут `data-cursor-trail="off"`.
Во время работы: `AlexCursorTrail.update({ shapes: 'mixed' })`, `AlexCursorTrail.destroy()`.

## Инерционная прокрутка

Lenis 1.3.26 (`assets/js/vendor/lenis.min.js`), модуль `assets/js/modules/smooth-scroll.js`,
настройки — `SMOOTH_SCROLL` в `assets/js/config.js` (`lerp`, `wheelMultiplier`, `enabled`).
`lerp: 0.11` подобран замером под yesapart.com/invest: у них контент догоняет нативный скролл
с коэффициентом 0.1 за 16 мс, полная остановка через ~1–1,3 с.
Lenis обновляется от `gsap.ticker` (один цикл анимации), ScrollTrigger — по событию `scroll` Lenis.
Включается только для мыши и трекпада; на сенсорных экранах и при `prefers-reduced-motion` прокрутка нативная.
Пока открыт диалог или мобильное меню, страница под ними не прокручивается; внутри них прокрутка нативная.
Якорные ссылки прокручиваются плавно, отступ под шапку берётся из `scroll-padding-top`.

## Подключение отправки заявок

Все формы вызывают `submitLead()` из `assets/js/modules/lead-service.js`.
Пока `LEAD_API.endpoint === null`, после валидации показывается окно
«Заявка не отправлена» с телефоном и ссылкой WhatsApp (текст заявки подставляется).
Чтобы подключить бэкенд, укажите URL в `assets/js/config.js` — интерфейс менять не нужно.
Тело запроса: `{ name, phone (E.164), message?, interest?, source, page }`.
