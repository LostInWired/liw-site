import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const ACCENT = 0x8ea2ff;

// ширины клавиш по рядам (в юнитах), суммарно 15u
const ROWS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

// на сколько единиц каждый слой уезжает вверх в разобранном виде
const LIFT = { case: 0, pcb: 1.5, plate: 3, switches: 4.6, keys: 6.4 };

const std = (color, metalness, roughness) => new THREE.MeshStandardMaterial({ color, metalness, roughness });

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xeef3ff, 1.7);
  key.position.set(6, 12, 8);
  const rim = new THREE.DirectionalLight(ACCENT, 2.2);
  rim.position.set(-8, 5, -8);
  scene.add(key, rim);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const kb = new THREE.Group();
  scene.add(kb);

  const layers = { case: new THREE.Group(), pcb: new THREE.Group(), plate: new THREE.Group(), switches: new THREE.Group(), keys: new THREE.Group() };
  Object.values(layers).forEach((g) => kb.add(g));

  const mats = {
    case: std(0x1a1c22, 0.85, 0.32),
    pcb: std(0x0e3d38, 0.3, 0.55),
    plate: std(0xc2c8d6, 0.9, 0.3),
    housing: std(0xd5dae6, 0.05, 0.45),
    stem: std(ACCENT, 0.1, 0.4),
    keyLight: std(0xdfe4ee, 0.05, 0.55),
    keyDark: std(0x2a2d38, 0.1, 0.5),
    keyAccent: std(ACCENT, 0.1, 0.45),
    cable: std(ACCENT, 0.05, 0.75),
    chip: std(0x0b0b0c, 0.4, 0.4),
  };
  const glow = {
    keys: [mats.keyLight, mats.keyDark, mats.keyAccent],
    switches: [mats.housing, mats.stem],
    boards: [mats.pcb, mats.plate],
    case: [mats.case, mats.cable],
  };
  Object.values(mats).forEach((m) => { m.emissive = new THREE.Color(ACCENT); m.emissiveIntensity = 0; });

  // ---- позиции клавиш ----
  const keys = [];
  ROWS.forEach((row, r) => {
    let x = -7.5;
    row.forEach((w, i) => {
      keys.push({ w, x: x + w / 2, z: (r - 2) * 1.0, r, i, last: i === row.length - 1 });
      x += w;
    });
  });

  // ---- корпус ----
  const wallMat = mats.case;
  const floor = new THREE.Mesh(new RoundedBoxGeometry(15.9, 0.25, 5.9, 3, 0.08), wallMat);
  floor.position.y = 0.12;
  const wall = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.08), wallMat);
    m.position.set(x, y, z);
    layers.case.add(m);
  };
  layers.case.add(floor);
  wall(15.9, 1.0, 0.3, 0, 0.5, -2.8);
  wall(15.9, 0.8, 0.3, 0, 0.4, 2.8);
  wall(0.3, 1.0, 5.9, -7.8, 0.5, 0);
  wall(0.3, 1.0, 5.9, 7.8, 0.5, 0);
  // кабель («wired»): выходит из задней стенки и уходит вправо
  const plug = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.38, 0.5, 2, 0.06), mats.plate);
  plug.position.set(0, 0.45, -3.1);
  layers.case.add(plug);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.45, -3.3), new THREE.Vector3(0, 0.4, -4.6), new THREE.Vector3(1.8, 0.2, -6.2),
    new THREE.Vector3(5, 0.2, -6.4), new THREE.Vector3(8.5, 0.9, -5.4), new THREE.Vector3(11, 3.2, -4.5),
  ]);
  layers.case.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.11, 10, false), mats.cable));

  // ---- плата ----
  const pcb = new THREE.Mesh(new RoundedBoxGeometry(15.2, 0.1, 5.2, 2, 0.03), mats.pcb);
  pcb.position.y = 0.38;
  layers.pcb.add(pcb);
  [[-5.6, 0.45, 0.4, 0.6], [-4.6, 0.45, -0.6, 0.5], [5.2, 0.45, 0.9, 0.7], [6.2, 0.45, -0.4, 0.5], [0.6, 0.45, -2.1, 0.8]].forEach(([x, y, z, s]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(s, 0.1, s * 0.6), mats.chip);
    c.position.set(x, y + 0.05, z);
    layers.pcb.add(c);
  });

  // ---- пластина с отверстиями под переключатели ----
  const shape = new THREE.Shape();
  shape.moveTo(-7.6, -2.6); shape.lineTo(7.6, -2.6); shape.lineTo(7.6, 2.6); shape.lineTo(-7.6, 2.6); shape.closePath();
  keys.forEach((k) => {
    const h = new THREE.Path();
    const x0 = k.x - 0.28, x1 = k.x + 0.28, y0 = k.z - 0.28, y1 = k.z + 0.28;
    h.moveTo(x0, y0); h.lineTo(x0, y1); h.lineTo(x1, y1); h.lineTo(x1, y0); h.closePath();
    shape.holes.push(h);
  });
  const plateGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
  plateGeo.rotateX(Math.PI / 2);          // плоскость XZ, толщина вниз
  const plate = new THREE.Mesh(plateGeo, mats.plate);
  plate.position.y = 0.72;
  layers.plate.add(plate);

  // ---- переключатели ----
  const housingGeo = new THREE.BoxGeometry(0.56, 0.34, 0.56);
  const stemGeo = new THREE.BoxGeometry(0.2, 0.22, 0.2);
  const housings = new THREE.InstancedMesh(housingGeo, mats.housing, keys.length);
  const stems = new THREE.InstancedMesh(stemGeo, mats.stem, keys.length);
  const m4 = new THREE.Matrix4();
  keys.forEach((k, n) => {
    housings.setMatrixAt(n, m4.makeTranslation(k.x, 0.8, k.z));
    stems.setMatrixAt(n, m4.makeTranslation(k.x, 1.08, k.z));
  });
  layers.switches.add(housings, stems);

  // ---- кейкапы (по одной геометрии на ширину) ----
  const byW = new Map();
  keys.forEach((k) => { (byW.get(k.w) || byW.set(k.w, []).get(k.w)).push(k); });
  byW.forEach((list, w) => {
    const geo = new RoundedBoxGeometry(w - 0.1, 0.52, 0.88, 3, 0.11);
    const mesh = new THREE.InstancedMesh(geo, mats.keyLight, list.length);
    const c = new THREE.Color();
    list.forEach((k, n) => {
      mesh.setMatrixAt(n, m4.makeTranslation(k.x, 1.42, k.z));
      const isEsc = k.r === 0 && k.i === 0;
      const isEnter = k.r === 2 && k.last;
      mesh.setColorAt(n, c.set(isEsc || isEnter ? ACCENT : (w !== 1 ? 0x2a2d38 : 0xdfe4ee)));
    });
    mesh.material = new THREE.MeshStandardMaterial({ metalness: 0.05, roughness: 0.5 });
    mesh.material.emissive = new THREE.Color(ACCENT);
    mesh.material.emissiveIntensity = 0;
    glow.keys.push(mesh.material);
    layers.keys.add(mesh);
  });

  // ---- состояние ----
  const state = { explode: 0, rotY: -0.45, active: -1, p: 0 };
  const cur = { explode: 0, rotY: -0.45 };
  const lit = { keys: 0, switches: 0, boards: 0, case: 0 };
  const groups = ['keys', 'switches', 'boards', 'case'];
  let size = { w: 1, h: 1 };
  let raf = 0;
  let running = false;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    size = { w, h };
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const portrait = w / h < 1;
    camera.setViewOffset(w, h, portrait ? 0 : -w * 0.15, portrait ? h * 0.13 : 0, w, h);
    camera.updateProjectionMatrix();
  }

  function frame() {
    const aspect = size.w / size.h;
    const half = aspect < 1 ? 8.4 : 11.6;
    const fit = half / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(aspect, 1.9));
    const dist = Math.max(fit, 17) * (1 + cur.explode * 0.22);
    camera.position.set(0, 3 + cur.explode * 1.5, dist);
    camera.lookAt(0, cur.explode * 3.1, 0);
    kb.rotation.set(THREE.MathUtils.lerp(0.78, 0.42, cur.explode), cur.rotY, 0);
    kb.position.y = -cur.explode * 0.4;
    Object.keys(layers).forEach((name) => { layers[name].position.y = LIFT[name] * cur.explode; });
  }

  function tick() {
    if (!running) return;
    cur.explode += (state.explode - cur.explode) * 0.08;
    cur.rotY += (state.rotY - cur.rotY) * 0.08;
    groups.forEach((g, i) => {
      lit[g] += ((state.active === i ? 0.32 : 0) - lit[g]) * 0.12;
      glow[g].forEach((m) => { m.emissiveIntensity = lit[g]; });
    });
    frame();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  return {
    // p — прогресс скролла 0..1, active — индекс подсвеченной группы
    set(p, active) {
      state.p = p;
      const s = (a, b) => { const t = THREE.MathUtils.clamp((p - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      state.explode = s(0.08, 0.3) * (1 - 0.92 * s(0.88, 1));
      state.rotY = -0.45 + p * 0.95;
      state.active = active;
    },
    resize,
    start() { if (running) return; running = true; resize(); raf = requestAnimationFrame(tick); },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { resize(); frame(); renderer.render(scene, camera); },
  };
}
