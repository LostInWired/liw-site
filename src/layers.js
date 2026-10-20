// Лёгкая замена 3D-клавиатуры для телефонов: сайт в изометрии разбирается на слои (чистый CSS 3D).
const s = (p, a, b) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t); };

export function createLayers() {
  const stack = document.querySelector('.stack');
  // порядок совпадает с индексами подсветки: дизайн, анимация, заявки, хостинг
  const lays = ['.lay--design', '.lay--motion', '.lay--form', '.lay--host'].map((q) => stack.querySelector(q));
  const target = { e: 0, rz: -38, rx: 58, active: -1 };
  const cur = { e: 0, rz: -38, rx: 58 };
  let raf = 0;
  let running = false;

  function tick() {
    if (!running) return;
    cur.e += (target.e - cur.e) * 0.09;
    cur.rz += (target.rz - cur.rz) * 0.09;
    cur.rx += (target.rx - cur.rx) * 0.09;
    stack.style.setProperty('--e', cur.e.toFixed(4));
    stack.style.setProperty('--rz', cur.rz.toFixed(2) + 'deg');
    stack.style.setProperty('--rx', cur.rx.toFixed(2) + 'deg');
    raf = requestAnimationFrame(tick);
  }

  return {
    set(p, active) {
      const e = s(p, 0.08, 0.3) * (1 - 0.92 * s(p, 0.88, 1));
      target.e = e;
      target.rz = -38 + p * 16;
      target.rx = 58 + e * 6;
      lays.forEach((l, i) => l.classList.toggle('on', i === active));
    },
    resize() {},
    start() { if (!running) { running = true; raf = requestAnimationFrame(tick); } },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}
