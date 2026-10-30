// Морская поверхность подвала на Canvas 2D: три слоя воды по всей площади
// и блики на гребнях. Форма каждого слоя пересчитывается в каждом кадре:
// - сумма гармоник с разной длиной, скоростью и направлением — часть бежит навстречу
//   основной волне, поэтому гребни поднимаются и опускаются на месте и сливаются в новые;
// - амплитуды гармоник медленно «дышат» каждая со своим периодом;
// - огибающая по X собирает волны в группы разной высоты и движется вдвое медленнее гребней,
//   как на настоящей воде: гребень рождается в хвосте группы и гаснет в её голове;
// - частоты несоизмеримы, заметного повторяющегося цикла нет.
// Поверх — локальное отталкивание от курсора: у каждой точки поверхности своя пружина.

const STEP = 8; // шаг точек по X, px
const RADIUS = 190; // радиус воздействия курсора, px
const PUSH = 40; // максимальное смещение поверхности, px
const STIFFNESS = 0.05; // жёсткость пружины возврата
const DAMPING = 0.8; // затухание скорости (без заметных колебаний)
const POINTER_LERP = 0.18; // инерция курсора
const GLINT_LEVELS = 4; // ступени яркости бликов на гребнях

// Слой:
// baseline — средний уровень воды (доля высоты подвала);
// heave — медленный подъём всей поверхности [px, рад/с];
// harmonics — [амплитуда px, волновое число рад/px, угловая скорость рад/с (знак — направление), фаза];
// envelope — группы волн [глубина модуляции, волновое число, угловая скорость];
// breath — насколько меняются амплитуды гармоник; force — сила реакции на курсор.
const LAYERS = [
  {
    // Задний: очень длинные медленные волны, почти невидимые
    baseline: 0.1,
    heave: [9, 0.07],
    harmonics: [
      [58, 0.0029, 0.16, 0.4],
      [31, 0.0051, -0.11, 2.2],
      [15, 0.0083, 0.21, 4.1],
    ],
    envelope: [0.32, 0.0009, 0.024],
    breath: 0.25,
    force: 0.5,
    fill: 'rgba(31, 115, 150, 0.07)',
  },
  {
    // Средний: основная «вода» за меню и контактами, с бликами на гребнях
    baseline: 0.4,
    heave: [8, 0.11],
    harmonics: [
      [41, 0.0062, 0.42, 1.3],
      [24, 0.0097, -0.29, 3.7],
      [19, 0.0041, 0.17, 5.2],
      [8, 0.0176, 0.55, 0.8],
      [5, 0.027, -0.6, 2.9],
    ],
    envelope: [0.38, 0.0014, 0.048],
    breath: 0.3,
    force: 1,
    fill: 'rgba(35, 60, 87, 0.42)',
    glint: [31, 115, 150, 0.45],
  },
  {
    // Передний: самый живой, с мелкой рябью
    baseline: 0.7,
    heave: [6, 0.15],
    harmonics: [
      [34, 0.0079, 0.62, 4.6],
      [20, 0.0134, -0.41, 1.1],
      [15, 0.0052, 0.27, 2.5],
      [8, 0.021, 0.85, 5.9],
      [5, 0.033, -0.95, 0.4],
    ],
    envelope: [0.42, 0.0018, 0.07],
    breath: 0.35,
    force: 0.8,
    fill: 'rgba(18, 50, 79, 0.65)',
    glint: [31, 115, 150, 0.22],
  },
].map((layer) => ({
  ...layer,
  // Сумма амплитуд — для нормировки высоты гребня при расчёте бликов
  norm: layer.harmonics.reduce((sum, [amp]) => sum + amp, 0),
  glintColors: layer.glint
    ? Array.from({ length: GLINT_LEVELS }, (_, level) => {
      const [r, g, b, a] = layer.glint;
      return `rgba(${r}, ${g}, ${b}, ${(a * (0.15 + (0.85 * level) / (GLINT_LEVELS - 1))).toFixed(3)})`;
    })
    : null,
}));

export function initFooterSea() {
  const host = document.querySelector('[data-footer-sea]');
  if (!host) return;
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  let width = 0;
  let height = 0;
  let points = 0;
  let layers = []; // на слой: смещения и скорости пружин, базовая и итоговая поверхность
  let frame = 0;
  let visible = false;
  let last = 0;
  let time = Math.random() * 600; // каждая загрузка начинается с новой картины моря
  const pointer = { cx: 0, cy: 0, x: -9999, y: -9999, sx: -9999, sy: -9999, active: false, seen: false };
  const amps = new Float32Array(8);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = host.clientWidth;
    height = host.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    points = Math.ceil(width / STEP) + 2;
    layers = LAYERS.map(() => ({
      off: new Float32Array(points),
      vel: new Float32Array(points),
      base: new Float32Array(points),
      ys: new Float32Array(points),
    }));
    if (!frame) draw(); // статичный кадр (reduced motion или пауза)
  };

  // Считает поверхность слоя для текущего кадра и применяет пружины отталкивания
  const computeLayer = (layer, li, interactive) => {
    const st = layers[li];
    const { harmonics } = layer;
    for (let h = 0; h < harmonics.length; h += 1) {
      const [amp, , , phase] = harmonics[h];
      amps[h] = amp * (1 + layer.breath * Math.sin(time * (0.12 + 0.07 * h) + phase * 1.7));
    }
    const [envDepth, envK, envW] = layer.envelope;
    const level = height * layer.baseline + layer.heave[0] * Math.sin(time * layer.heave[1] + li * 2.1);

    for (let i = 0; i < points; i += 1) {
      const x = i * STEP;
      const group = 1 + envDepth * Math.sin(envK * x - envW * time + li * 1.3);
      let y = level;
      for (let h = 0; h < harmonics.length; h += 1) {
        const [, k, w, phase] = harmonics[h];
        y += amps[h] * group * Math.sin(k * x - w * time + phase);
      }
      st.base[i] = y;

      // Цель пружины: плавный прогиб поверхности от курсора.
      // По X — колокол (гаусс), по Y — затухание с расстоянием до поверхности;
      // направление меняется непрерывно, поэтому над и под курсором нет «ступеньки».
      let target = 0;
      if (interactive) {
        const dx = x - pointer.sx;
        const dy = y - pointer.sy;
        const near = 1 - Math.abs(dy) / RADIUS;
        if (near > 0 && Math.abs(dx) < RADIUS * 1.6) {
          const bell = Math.exp(-(dx * dx) / (2 * (RADIUS * 0.45) ** 2));
          const side = Math.tanh(dy / 22);
          const ease = near * near * (3 - 2 * near);
          target = side * PUSH * layer.force * bell * ease;
        }
      }
      st.vel[i] = (st.vel[i] + (target - st.off[i]) * STIFFNESS) * DAMPING;
      st.off[i] += st.vel[i];
      st.ys[i] = y + st.off[i];
    }
    return level;
  };

  const drawLayer = (layer, li, level) => {
    const { ys } = layers[li];
    // Заливка от поверхности до низа: кривые через середины отрезков — без изломов
    ctx.beginPath();
    ctx.moveTo(0, ys[0]);
    for (let i = 1; i < points; i += 1) {
      const x0 = (i - 1) * STEP;
      ctx.quadraticCurveTo(x0, ys[i - 1], x0 + STEP / 2, (ys[i - 1] + ys[i]) / 2);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = layer.fill;
    ctx.fill();

    // Блики: чем выше гребень над средним уровнем, тем ярче линия; во впадинах почти не видна
    if (!layer.glintColors) return;
    for (let g = 0; g < GLINT_LEVELS; g += 1) {
      ctx.beginPath();
      let any = false;
      for (let i = 1; i < points; i += 1) {
        const lift = (level - (ys[i - 1] + ys[i]) / 2) / layer.norm;
        const step = Math.max(0, Math.min(GLINT_LEVELS - 1, Math.floor((lift + 0.35) * 3.2)));
        if (step !== g) continue;
        ctx.moveTo((i - 1) * STEP, ys[i - 1] - 3);
        ctx.lineTo(i * STEP, ys[i] - 3);
        any = true;
      }
      if (!any) continue;
      ctx.strokeStyle = layer.glintColors[g];
      ctx.stroke();
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const interactive = pointer.active && finePointer.matches && !reduce.matches;
    LAYERS.forEach((layer, li) => drawLayer(layer, li, computeLayer(layer, li, interactive)));
  };

  const tick = (now) => {
    frame = 0;
    if (!visible || reduce.matches) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    time += dt;
    trackPointer();
    pointer.sx += (pointer.x - pointer.sx) * POINTER_LERP;
    pointer.sy += (pointer.y - pointer.sy) * POINTER_LERP;
    draw();
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (frame || reduce.matches) return;
    last = 0;
    frame = requestAnimationFrame(tick);
  };

  // Храним координаты окна; переводим в координаты холста раз в кадр — так прокрутка учитывается
  const onMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    pointer.cx = event.clientX;
    pointer.cy = event.clientY;
    pointer.seen = true;
  };
  const trackPointer = () => {
    if (!pointer.seen) return;
    const rect = canvas.getBoundingClientRect();
    const x = pointer.cx - rect.left;
    const y = pointer.cy - rect.top;
    const near = y > -RADIUS && y < rect.height + RADIUS;
    if (near && !pointer.active) { pointer.sx = x; pointer.sy = y; }
    pointer.active = near;
    pointer.x = x;
    pointer.y = y;
  };
  const onLeave = () => { pointer.active = false; pointer.seen = false; };

  // Отладка (только с ?sea-debug в адресе): поверхность слоя и смещения пружин
  if (new URLSearchParams(location.search).has('sea-debug')) {
    host.seaDebug = {
      surface: (li) => Array.from(layers[li].base),
      offsets: () => layers.map(({ off }) => Math.max(...off.map(Math.abs))),
      step: STEP,
    };
  }

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  }).observe(host);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  reduce.addEventListener('change', () => (reduce.matches ? draw() : start()));
  resize();
}
