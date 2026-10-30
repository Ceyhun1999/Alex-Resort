// След за курсором: полутоновая «рябь» из мелких фигур на сетке.
// Механика как у ShapeWaves (zzir.ru): курсор добавляет заряд в волновое поле,
// волна расходится к соседним ячейкам и быстро гаснет; после резкого движения
// импульс по инерции уходит немного вперёд. Рисование — Canvas 2D, только активная область.

const DEFAULTS = {
  colors: ['#b59779', '#51a1b4'], // [основной, пик заряда]
  shapes: 'circles', // 'circles' | 'squares' | 'triangles' | 'mixed'
  cellSize: 9, // шаг сетки, px — «толщина» зерна следа
  dotSize: 0.62, // размер фигуры относительно половины ячейки
  opacity: 0.78, // максимальная непрозрачность
  splashRadius: 24, // радиус всплеска, px — ширина следа
  splashStrength: 0.3, // сила всплеска — насыщенность и длина следа
  waveSpeed: 0.42, // скорость распространения волны
  friction: 0.94, // инерция волны (плавность)
  decay: 0.962, // затухание за шаг: меньше — короче след
  momentum: true, // продолжение импульса вперёд после резкого движения
  controlDamping: 0.3, // ослабление над кнопками и ссылками
  scope: null, // CSS-селектор области действия; null — вся страница
  exclude: 'input, textarea, select, [data-cursor-trail="off"]',
  zIndex: 150,
};

const SIM_STEP = 1 / 60;
const SETTLED = 0.01;
const CONTROLS = 'a, button, label, summary, [role="button"], [role="tab"]';

const hexToRgb = (hex) => {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.replace(/./g, (c) => c + c) : v;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// Плавный value-noise: задаёт крупные «пятна», внутри которых меняется фигура или её размер
const noise = (x, y) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};

const LEVELS = 24;

export function initCursorTrail(options = {}) {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const settings = { ...DEFAULTS, ...options };

  let canvas = null;
  let ctx = null;
  let running = false;
  let frameId = 0;
  let dpr = 1;
  let cell = settings.cellSize;
  let cols = 0;
  let rows = 0;
  let heights = new Float32Array(0);
  let previous = new Float32Array(0);
  let bands = new Uint8Array(0);
  let palette = [];
  let box = null; // активная область сетки {c0, c1, r0, r1}
  let backlog = 0;
  let lastTime = 0;
  let scrollY = window.scrollY;
  let scrollAcc = 0;
  let momentum = null;
  const pointer = { x: 0, y: 0, at: 0, inside: false };

  const buildPalette = () => {
    const [from, to] = settings.colors.map(hexToRgb);
    palette = [];
    for (let i = 0; i <= LEVELS; i += 1) {
      const charge = i / LEVELS;
      const mix = smoothstep(0.15, 0.85, charge);
      const rgb = from.map((c, k) => Math.round(c + (to[k] - c) * mix));
      const alpha = smoothstep(0.02, 0.45, charge) * settings.opacity;
      palette.push(`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`);
    }
  };

  const resize = () => {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cell = settings.cellSize;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    cols = Math.ceil(w / cell);
    rows = Math.ceil(h / cell);
    heights = new Float32Array(cols * rows);
    previous = new Float32Array(cols * rows);
    bands = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        bands[r * cols + c] = Math.min(2, Math.floor(noise(c / 11, r / 11) * 3));
      }
    }
    box = null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
  };

  const growBox = (c0, c1, r0, r1) => {
    c0 = Math.max(0, c0); r0 = Math.max(0, r0);
    c1 = Math.min(cols - 1, c1); r1 = Math.min(rows - 1, r1);
    if (c0 > c1 || r0 > r1) return;
    if (!box) box = { c0, c1, r0, r1 };
    else {
      box.c0 = Math.min(box.c0, c0); box.c1 = Math.max(box.c1, c1);
      box.r0 = Math.min(box.r0, r0); box.r1 = Math.max(box.r1, r1);
    }
  };

  const splash = (x, y, strength) => {
    const sigma = Math.max(0.5, (settings.splashRadius / cell) * 0.5);
    const reach = Math.ceil(sigma * 2.5);
    const cc = x / cell - 0.5;
    const cr = y / cell - 0.5;
    const r0 = Math.max(0, Math.floor(cr - reach));
    const r1 = Math.min(rows - 1, Math.ceil(cr + reach));
    const c0 = Math.max(0, Math.floor(cc - reach));
    const c1 = Math.min(cols - 1, Math.ceil(cc + reach));
    const k = 2 * sigma * sigma;
    for (let r = r0; r <= r1; r += 1) {
      const dy = r - cr;
      for (let c = c0; c <= c1; c += 1) {
        const dx = c - cc;
        const i = r * cols + c;
        heights[i] = Math.min(1.2, heights[i] + strength * Math.exp(-(dx * dx + dy * dy) / k));
      }
    }
    growBox(c0, c1, r0, r1);
    wake();
  };

  // Один шаг волнового уравнения в пределах активной области (+1 ячейка на распространение)
  const step = () => {
    if (!box) return 0;
    growBox(box.c0 - 1, box.c1 + 1, box.r0 - 1, box.r1 + 1);
    const { c0, c1, r0, r1 } = box;
    const lastCol = cols - 1;
    const lastRow = rows - 1;
    let peak = 0;
    let nc0 = cols; let nc1 = -1; let nr0 = rows; let nr1 = -1;
    for (let r = r0; r <= r1; r += 1) {
      const up = (r === 0 ? r : r - 1) * cols;
      const down = (r === lastRow ? r : r + 1) * cols;
      const base = r * cols;
      for (let c = c0; c <= c1; c += 1) {
        const i = base + c;
        const h = heights[i];
        const lap = heights[base + (c === 0 ? c : c - 1)] + heights[base + (c === lastCol ? c : c + 1)]
          + heights[up + c] + heights[down + c] - 4 * h;
        const next = (h + (h - previous[i]) * settings.friction + settings.waveSpeed * lap) * settings.decay;
        previous[i] = next;
        if (next > peak) peak = next;
        // Провалы волны (отрицательные значения) тоже держат область активной
        if (next > SETTLED || next < -SETTLED) {
          if (c < nc0) nc0 = c; if (c > nc1) nc1 = c;
          if (r < nr0) nr0 = r; if (r > nr1) nr1 = r;
        }
      }
    }
    const swap = heights; heights = previous; previous = swap;
    // Область сжимается вслед за угасающей волной
    if (nc1 >= 0) box = { c0: nc0, c1: nc1, r0: nr0, r1: nr1 };
    return peak;
  };

  const traceShape = (shape, x, y, s) => {
    if (shape === 1) {
      ctx.moveTo(x + s, y);
      ctx.arc(x, y, s, 0, Math.PI * 2);
    } else if (shape === 0) {
      ctx.rect(x - s, y - s, s * 2, s * 2);
    } else {
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x - s, y + s);
      ctx.closePath();
    }
  };

  const buckets = Array.from({ length: LEVELS + 1 }, () => []);

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    if (!box) return;
    const half = cell / 2;
    const mode = settings.shapes;
    for (let r = box.r0; r <= box.r1; r += 1) {
      for (let c = box.c0; c <= box.c1; c += 1) {
        const charge = heights[r * cols + c];
        if (charge <= 0.02) continue;
        buckets[Math.min(LEVELS, Math.round(Math.min(1, charge) * LEVELS))].push(r * cols + c);
      }
    }
    for (let level = 1; level <= LEVELS; level += 1) {
      const list = buckets[level];
      if (!list.length) continue;
      const charge = level / LEVELS;
      ctx.fillStyle = palette[level];
      ctx.beginPath();
      for (let n = 0; n < list.length; n += 1) {
        const i = list[n];
        const c = i % cols;
        const r = (i - c) / cols;
        const stepped = (bands[i] + Math.floor(Math.min(charge, 0.999) * 3)) % 3;
        let shape = 1;
        let size = settings.dotSize;
        if (mode === 'mixed') shape = 2 - stepped;
        else {
          shape = mode === 'squares' ? 0 : mode === 'triangles' ? 2 : 1;
          size *= 0.45 + 0.55 * (stepped / 2);
        }
        traceShape(shape, c * cell + half, r * cell + half, size * half);
      }
      ctx.fill();
      list.length = 0;
    }
  };

  // Прокрутка: поле сдвигается вместе со страницей, след «прилипает» к контенту
  const applyScroll = () => {
    const y = window.scrollY;
    scrollAcc += y - scrollY;
    scrollY = y;
    const shift = Math.trunc(scrollAcc / cell);
    if (!shift || !box) { if (!box) scrollAcc = 0; return; }
    scrollAcc -= shift * cell;
    const n = Math.abs(shift) * cols;
    [heights, previous].forEach((arr) => {
      if (shift > 0) { arr.copyWithin(0, n); arr.fill(0, arr.length - n); }
      else { arr.copyWithin(n, 0, arr.length - n); arr.fill(0, 0, n); }
    });
    box.r0 -= shift; box.r1 -= shift;
    if (box.r1 < 0 || box.r0 >= rows) box = null;
    else { box.r0 = Math.max(0, box.r0); box.r1 = Math.min(rows - 1, box.r1); }
    if (momentum) momentum.y -= shift * cell;
  };

  const runMomentum = (now) => {
    if (!momentum || now < momentum.nextAt) return;
    // Курсор снова двигается — инерцию отменяем, как в оригинале
    if (now - pointer.at < 25) { momentum = null; return; }
    momentum.phase += 1;
    const t = momentum.phase / 4;
    splash(momentum.x + momentum.vx * momentum.drift * t, momentum.y + momentum.vy * momentum.drift * t, momentum.strength * 0.42 * (1 - t));
    momentum.nextAt = now + 28;
    if (momentum.phase >= 4) momentum = null;
  };

  const frame = (now) => {
    frameId = 0;
    if (!running) return;
    const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : SIM_STEP;
    lastTime = now;
    applyScroll();
    runMomentum(now);
    backlog = Math.min(backlog + dt, SIM_STEP * 4);
    let peak = 1;
    while (backlog >= SIM_STEP) {
      backlog -= SIM_STEP;
      peak = step();
    }
    if (peak < SETTLED && !momentum) {
      heights.fill(0); previous.fill(0); box = null;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      lastTime = 0;
      return; // поле успокоилось — цикл останавливается до следующего движения
    }
    draw();
    frameId = requestAnimationFrame(frame);
  };

  function wake() {
    if (running && !frameId) frameId = requestAnimationFrame(frame);
  }

  const inScope = (target) => {
    if (!(target instanceof Element)) return true;
    if (settings.exclude && target.closest(settings.exclude)) return false;
    if (settings.scope && !target.closest(settings.scope)) return false;
    return true;
  };

  const onPointerMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const now = performance.now();
    const x = event.clientX;
    const y = event.clientY;
    const target = event.target;
    if (!inScope(target)) {
      pointer.inside = false;
      return;
    }
    const elapsed = pointer.inside ? Math.max(8, now - pointer.at) : 16;
    const travelled = pointer.inside ? Math.hypot(x - pointer.x, y - pointer.y) : 0;
    const speed = (travelled / elapsed) * 1000;
    const onControl = target instanceof Element && target.closest(CONTROLS);
    const strength = Math.min(1, 0.22 + speed * 0.0006) * settings.splashStrength * (onControl ? settings.controlDamping : 1);
    splash(x, y, strength);
    // При быстром жесте добавляем промежуточные точки, чтобы след не распадался на пятна
    if (pointer.inside && travelled > 14) {
      const steps = Math.min(8, Math.ceil(travelled / 15));
      for (let i = 1; i < steps; i += 1) {
        const t = i / steps;
        splash(pointer.x + (x - pointer.x) * t, pointer.y + (y - pointer.y) * t, strength * 0.3);
      }
    }
    momentum = null;
    if (settings.momentum && speed > 120 && travelled > 3) {
      momentum = {
        x, y,
        vx: (x - pointer.x) / travelled,
        vy: (y - pointer.y) / travelled,
        drift: Math.min(58, Math.max(15, speed * 0.035)),
        strength,
        phase: 0,
        nextAt: now + 55,
      };
    }
    pointer.x = x; pointer.y = y; pointer.at = now; pointer.inside = true;
  };

  const onLeave = () => { pointer.inside = false; };
  const onScroll = () => { if (box) wake(); else scrollY = window.scrollY; };
  const onVisibility = () => { if (document.hidden) pointer.inside = false; };

  const start = () => {
    if (running) return;
    canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.zIndex = String(settings.zIndex);
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    running = true;
    scrollY = window.scrollY;
    buildPalette();
    resize();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas?.remove();
    canvas = null;
    ctx = null;
    box = null;
    momentum = null;
  };

  // Только мышь/трекпад и без запроса на уменьшение движения; реагируем на смену настроек
  const sync = () => (finePointer.matches && !reduceMotion.matches ? start() : stop());
  finePointer.addEventListener('change', sync);
  reduceMotion.addEventListener('change', sync);
  sync();

  return {
    update(patch) {
      Object.assign(settings, patch);
      if (!running) return;
      buildPalette();
      if ('cellSize' in patch) resize();
      if (canvas && 'zIndex' in patch) canvas.style.zIndex = String(settings.zIndex);
    },
    destroy() {
      finePointer.removeEventListener('change', sync);
      reduceMotion.removeEventListener('change', sync);
      stop();
    },
  };
}
