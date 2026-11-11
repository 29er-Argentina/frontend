import * as THREE from "three";

/**
 * Puerto de Mónaco (Port Hercule) frente al pueblo de la costa "riviera":
 * escollera con faro, superyates (amarrados y fondeados), y el tramo del circuito
 * de F1 que bordea el puerto: muelle, guardarraíles, pianos, chicana de la pileta,
 * tribunas, salida del túnel y autos dando vueltas.
 *
 * Coordenadas: el mar está hacia +Z. Muelle/pista en z ≈ -862, escollera en z ≈ -765.
 */

/** `group`: círculos que cuentan como un solo obstáculo (un solo golpe). */
export type Collider = { x: number; z: number; r: number; group?: number };

const QUAY_Z = -862; // eje de la pista
const QUAY_TOP = 3; // altura del muelle sobre el agua
const BREAKWATER_Z = -765;
const BW_X0 = -335;
const BW_X1 = 125;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });

function box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

/* ───────────── Yates ───────────── */

/** Planta del casco (vista de arriba): proa en +Y de la forma (→ -Z del mundo). */
function hullShape(len: number, beam: number, inset = 0) {
  const L = len / 2 - inset, B = beam / 2 - inset;
  const s = new THREE.Shape();
  s.moveTo(-B, -L);
  s.lineTo(B, -L);
  s.lineTo(B, L * 0.25);
  s.quadraticCurveTo(B, L * 0.8, 0, L);
  s.quadraticCurveTo(-B, L * 0.8, -B, L * 0.25);
  s.closePath();
  return s;
}

function slab(shape: THREE.Shape, h: number, m: THREE.Material) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); // la forma queda en XZ y la extrusión hacia +Y
  return new THREE.Mesh(g, m);
}

const yachtMats = {
  white: std("#f6f7f8", { roughness: 0.3, metalness: 0.1 }),
  navy: std("#1a2740", { roughness: 0.3, metalness: 0.2 }),
  grey: std("#8d969e", { roughness: 0.35, metalness: 0.3 }),
  glass: std("#14202c", { roughness: 0.15, metalness: 0.6 }),
  teak: std("#a77a4f", { roughness: 0.8 }),
  red: std("#b3261e", { roughness: 0.5 }),
};

function yacht(len: number, rand: () => number) {
  const g = new THREE.Group();
  const beam = len * 0.18;
  const hullH = len * 0.085;
  const hullMat = rand() < 0.25 ? yachtMats.navy : rand() < 0.15 ? yachtMats.grey : yachtMats.white;
  // casco (un poco bajo el agua) + línea de flotación
  const hull = slab(hullShape(len, beam), hullH + 1.2, hullMat);
  hull.position.y = -1.2;
  const boot = slab(hullShape(len * 1.002, beam * 1.01), 0.35, yachtMats.red);
  boot.position.y = -0.15;
  // cubierta de teca
  const deck = slab(hullShape(len, beam, 0.4), 0.15, yachtMats.teak);
  deck.position.y = hullH;
  g.add(hull, boot, deck);
  // superestructura escalonada, cada nivel más corto y hacia popa, con franja de vidrio
  const levels = len > 60 ? 3 : 2;
  let y = hullH + 0.15;
  for (let i = 0; i < levels; i++) {
    const k = 0.72 - i * 0.16;
    const shape = hullShape(len * k, beam * (0.86 - i * 0.08));
    const off = len * (0.06 + i * 0.06);
    const lv = slab(shape, 2.6, yachtMats.white);
    lv.position.set(0, y, off);
    const glass = slab(hullShape(len * k * 1.01, beam * (0.86 - i * 0.08) * 1.03), 1.1, yachtMats.glass);
    glass.position.set(0, y + 0.9, off);
    g.add(lv, glass);
    y += 2.6;
  }
  // arco de radar + mástil
  const arch = box(beam * 0.5, 2.2, 1.2, yachtMats.white, 0, y, len * 0.18);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), yachtMats.white);
  dome.position.set(0, y + 2.9, len * 0.18);
  g.add(arch, dome);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

/* ───────────── Autos de F1 ───────────── */

function f1Car(color: string) {
  const g = new THREE.Group();
  const body = std(color, { roughness: 0.35, metalness: 0.3 });
  const black = std("#111316", { roughness: 0.6 });
  // largo ≈ 5,6 m, frente hacia -Z
  g.add(box(0.9, 0.5, 4.2, body, 0, 0.25, 0.2)); // monocasco
  g.add(box(1.5, 0.45, 1.6, body, 0, 0.25, 0.6)); // pontones
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 4), body);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.42, -2.5);
  g.add(nose);
  g.add(box(1.9, 0.08, 0.6, black, 0, 0.12, -2.8)); // alerón delantero
  g.add(box(1.0, 0.08, 0.5, black, 0, 0.95, 2.45)); // alerón trasero
  g.add(box(0.08, 0.6, 0.5, black, 0.5, 0.45, 2.45));
  g.add(box(0.08, 0.6, 0.5, black, -0.5, 0.45, 2.45));
  g.add(box(0.5, 0.35, 0.6, black, 0, 0.75, 0.1)); // halo / casco
  const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.38, 12);
  wheel.rotateZ(Math.PI / 2);
  for (const [x, z] of [[0.85, -1.6], [-0.85, -1.6], [0.85, 1.7], [-0.85, 1.7]] as const) {
    const w = new THREE.Mesh(wheel, black);
    w.position.set(x, 0.34, z);
    g.add(w);
  }
  return g;
}

/** Recorrido visible del circuito (de la salida del túnel hacia la Rascasse), con la chicana de la pileta. */
const TRACK: [number, number][] = [
  [255, QUAY_Z],
  [205, QUAY_Z],
  [190, QUAY_Z + 4.5], // chicana del puerto
  [172, QUAY_Z - 3.5],
  [140, QUAY_Z],
  [112, QUAY_Z + 4], // pileta
  [92, QUAY_Z - 3.5],
  [70, QUAY_Z],
  [-335, QUAY_Z],
];

function trackSampler() {
  const segs = TRACK.slice(1).map((p, i) => {
    const a = TRACK[i];
    return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) };
  });
  const total = segs.reduce((s, x) => s + x.len, 0);
  return {
    total,
    at(d: number) {
      let rest = ((d % total) + total) % total;
      for (const s of segs) {
        if (rest <= s.len) {
          const k = rest / s.len;
          return { x: s.a[0] + (s.b[0] - s.a[0]) * k, z: s.a[1] + (s.b[1] - s.a[1]) * k, yaw: Math.atan2(-(s.b[0] - s.a[0]), -(s.b[1] - s.a[1])) };
        }
        rest -= s.len;
      }
      const s = segs[segs.length - 1];
      return { x: s.b[0], z: s.b[1], yaw: 0 };
    },
  };
}

/* ───────────── Escena del puerto ───────────── */

export function createMonacoHarbor() {
  const g = new THREE.Group();
  const rand = rng(29);
  const stone = std("#d9d2c2", { roughness: 0.9 });
  const asphalt = std("#3a3d42", { roughness: 0.95 });
  const armco = std("#cfd4d8", { roughness: 0.4, metalness: 0.5 });
  const tecpro = std("#c8102e", { roughness: 0.7 });

  // muelle (plataforma de piedra) donde corre la pista
  g.add(box(660, QUAY_TOP + 3, 26, stone, -40, -3, QUAY_Z - 4));
  // escollera + faro en la punta
  g.add(box(BW_X1 - BW_X0, 6, 10, stone, (BW_X0 + BW_X1) / 2, -2, BREAKWATER_Z));
  g.add(box(10, 6, BREAKWATER_Z - QUAY_Z + 5, stone, BW_X0 - 5, -2, (QUAY_Z + BREAKWATER_Z) / 2)); // brazo oeste
  const lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 12, 16), std("#f2f2f2"));
  lighthouse.position.set(BW_X1 - 4, 10, BREAKWATER_Z);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2, 16), std("#2e8b57", { emissive: "#1f6b40", emissiveIntensity: 0.4 }));
  lamp.position.set(BW_X1 - 4, 17, BREAKWATER_Z);
  g.add(lighthouse, lamp);
  // muelle este que cierra la dársena (la boca queda entre la escollera y este muelle)
  g.add(box(10, 6, BREAKWATER_Z - QUAY_Z, stone, 165, -2, (QUAY_Z + BREAKWATER_Z) / 2));

  // pista: asfalto, línea blanca de borde, guardarraíles, pianos en la chicana
  const road = new THREE.Mesh(new THREE.PlaneGeometry(600, 12), asphalt);
  road.rotation.x = -Math.PI / 2;
  road.position.set(-40, QUAY_TOP + 0.03, QUAY_Z);
  g.add(road);
  for (const dz of [-5.6, 5.6]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(600, 0.3), std("#f4f4f4"));
    line.rotation.x = -Math.PI / 2;
    line.position.set(-40, QUAY_TOP + 0.05, QUAY_Z + dz);
    g.add(line);
  }
  g.add(box(600, 0.6, 0.25, armco, -40, QUAY_TOP, QUAY_Z + 6.6)); // lado puerto (bajo, para ver los autos desde el agua)
  g.add(box(600, 0.9, 0.25, armco, -40, QUAY_TOP, QUAY_Z - 6.6)); // lado pueblo
  // alambrado alto (catch fence) del lado del puerto, con postes
  const fence = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 4),
    new THREE.MeshStandardMaterial({ color: "#d6dde3", transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  fence.position.set(-40, QUAY_TOP + 2.9, QUAY_Z + 6.7);
  g.add(fence);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 4.9, 0.15), armco, 120);
  const pm = new THREE.Matrix4();
  for (let i = 0; i < 120; i++) posts.setMatrixAt(i, pm.makeTranslation(-340 + i * 5, QUAY_TOP + 2.45, QUAY_Z + 6.7));
  posts.frustumCulled = false;
  g.add(posts);
  // carteles de colores sobre el guardarraíl del lado del pueblo, de fondo detrás de los autos (sin marcas)
  const boardColors = ["#0b5d3b", "#f6f6f6", "#c8102e", "#111316", "#faaf40", "#1e41ff"];
  const boards = new THREE.InstancedMesh(new THREE.BoxGeometry(9.6, 1.8, 0.08), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 60);
  const bc = new THREE.Color();
  for (let i = 0; i < 60; i++) {
    boards.setMatrixAt(i, pm.makeTranslation(-335 + i * 10, QUAY_TOP + 0.9, QUAY_Z - 6.8));
    boards.setColorAt(i, bc.set(boardColors[i % boardColors.length]));
  }
  boards.frustumCulled = false;
  g.add(boards);

  // barreras TecPro rojas en la chicana
  g.add(box(30, 1.2, 1, tecpro, 190, QUAY_TOP, QUAY_Z + 7.4));
  // pianos rojos y blancos
  const kerbGeo = new THREE.BoxGeometry(2, 0.12, 1.2);
  const kerbRed = std("#d62828"), kerbWhite = std("#f6f6f6");
  for (const [cx, cz] of [[190, QUAY_Z + 4.5], [172, QUAY_Z - 3.5], [112, QUAY_Z + 4], [92, QUAY_Z - 3.5]] as const) {
    for (let i = -4; i <= 4; i++) {
      const k = new THREE.Mesh(kerbGeo, i % 2 ? kerbRed : kerbWhite);
      k.position.set(cx + i * 2, QUAY_TOP + 0.08, cz + Math.sign(cz - QUAY_Z) * 1.4);
      g.add(k);
    }
  }
  // pileta entre la pista y el puerto
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(50, 9), std("#3ec7e0", { roughness: 0.1, metalness: 0.1, emissive: "#0b6f84", emissiveIntensity: 0.25 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(102, QUAY_TOP + 0.04, QUAY_Z + 11);
  g.add(pool);

  // túnel (salida) al este y la Rascasse al oeste: tapan los extremos del recorrido
  g.add(box(70, 16, 34, std("#cfc6b4", { roughness: 0.85 }), 292, QUAY_TOP - 1, QUAY_Z - 6));
  g.add(box(2, 7, 12.5, std("#0c0d10"), 256.5, QUAY_TOP, QUAY_Z)); // boca oscura
  g.add(box(26, 9, 22, std("#e9dcc2"), -350, QUAY_TOP - 1, QUAY_Z - 2));

  // tribunas con público del lado del pueblo
  const crowdColors = ["#d62828", "#f6f6f6", "#faaf40", "#2a6fdb", "#ff8a00", "#1d1d1d", "#26a9e0"];
  const seats: { x: number; y: number; z: number; c: string }[] = [];
  for (const [x0, x1] of [[-60, 40], [-250, -150]] as const) {
    for (let row = 0; row < 6; row++) {
      const z = QUAY_Z - 10 - row * 2.2;
      const y = QUAY_TOP + row * 1.4;
      g.add(box(x1 - x0, 1.4, 2.2, std("#9aa3ab"), (x0 + x1) / 2, y - 1.4 + 1.4 * 0, z));
      for (let x = x0 + 0.8; x < x1; x += 1.2) seats.push({ x, y: y + 0.1, z, c: crowdColors[Math.floor(rand() * crowdColors.length)] });
    }
    g.add(box(x1 - x0 + 2, 0.4, 16, std("#ffffff"), (x0 + x1) / 2, QUAY_TOP + 11, QUAY_Z - 15)); // techo
  }
  const crowd = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 1.1, 0.6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), seats.length);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  seats.forEach((s, i) => {
    m.makeTranslation(s.x, s.y + 0.55, s.z);
    crowd.setMatrixAt(i, m);
    crowd.setColorAt(i, c.set(s.c));
  });
  crowd.frustumCulled = false;
  g.add(crowd);

  // yates: amarrados de popa al muelle dentro del puerto y fondeados afuera
  const colliders: Collider[] = [];
  const bobbing: { obj: THREE.Object3D; phase: number }[] = [];
  for (let x = -300; x < 100; x += 32 + rand() * 18) {
    const len = 30 + rand() * 35;
    const y = yacht(len, rand);
    y.position.set(x, 0, QUAY_Z + 17 + len / 2);
    y.rotation.y = Math.PI; // proa al mar
    g.add(y);
    bobbing.push({ obj: y, phase: rand() * 10 });
  }
  const anchored: [number, number, number, number][] = [
    [-380, -690, 85, 0.5],
    [-220, -640, 70, 0.4],
    [-60, -700, 95, 0.6],
    [120, -655, 60, 0.35],
    [280, -705, 78, 0.55],
    [430, -650, 55, 0.3],
  ];
  for (const [x, z, len, yaw] of anchored) {
    const y = yacht(len, rand);
    y.position.set(x, 0, z);
    y.rotation.y = yaw; // aproados al viento (que viene de -Z)
    g.add(y);
    bobbing.push({ obj: y, phase: rand() * 10 });
    // tres círculos a lo largo del casco para los choques
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    for (const k of [-0.33, 0, 0.33]) colliders.push({ x: x + fx * len * k, z: z + fz * len * k, r: len * 0.11 });
  }

  // autos de F1
  const track = trackSampler();
  const cars = ["#dc0000", "#ff8000", "#1e41ff", "#c0c7cc", "#00a19c", "#ffffff"].map((col) => {
    const car = f1Car(col);
    g.add(car);
    return car;
  });

  return {
    group: g,
    colliders,
    /** Límite de la costa: z mínimo navegable para un x dado. */
    shore(x: number) {
      return x > BW_X0 - 12 && x < 172 ? BREAKWATER_Z + 7 : QUAY_Z + 18;
    },
    update(t: number, heightAt: (x: number, z: number) => number) {
      for (const b of bobbing) {
        const p = b.obj.position;
        p.y = heightAt(p.x, p.z) * 0.35;
        b.obj.rotation.z = Math.sin(t * 0.6 + b.phase) * 0.012;
      }
      cars.forEach((car, i) => {
        const s = track.at(t * 62 + i * (track.total / cars.length) + Math.sin(i * 7.1) * 20);
        car.position.set(s.x, QUAY_TOP + 0.05, s.z);
        car.rotation.y = s.yaw;
      });
    },
  };
}
