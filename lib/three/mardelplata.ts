import * as THREE from "three";
import type { SkyPalette } from "./sky";
import type { Collider } from "./monaco";
import {
  box,
  buildings,
  lineColliders,
  landSlab,
  pathSampler,
  rng,
  rockLine,
  scatter,
  shoreAt,
  shoreClamp,
  shoreStrip,
  std,
  workBoat,
  type Building,
  type ShorePts,
  type Showcase,
} from "./coastkit";

/**
 * Mar del Plata, frente céntrico visto desde el mar (el Atlántico al este = +X, el norte = -Z).
 * De norte a sur: La Perla con sus torres, Punta Iglesia, Playa Bristol con espigones,
 * la Rambla con el Casino y el Hotel Provincial (Bustillo) y los lobos marinos de piedra,
 * Playa Varese con el Torreón del Monje sobre las rocas, Cabo Corrientes, Playa Grande con
 * sus carpas, el Puerto con las escolleras y las lanchitas amarillas, y el faro de Punta Mogotes.
 */

const SHORE: ShorePts = [
  [-1500, -655],
  [-1000, -628],
  [-700, -602],
  [-540, -575],
  [-480, -545], // Punta Iglesia
  [-430, -560],
  [-300, -602],
  [-150, -614],
  [0, -602],
  [120, -572],
  [200, -532],
  [250, -508], // Torreón del Monje
  [310, -490], // Cabo Corrientes
  [370, -516],
  [460, -575],
  [560, -602],
  [700, -604],
  [1050, -606],
  [1500, -640],
];

const TOP = 5.5; // nivel de la rambla / ciudad sobre el agua
const BRISTOL = { z0: -262, z1: -10 }; // Casino (norte) + Rambla + Hotel Provincial (sur)

const near = (z: number, a: number, b: number, fade = 40) => {
  const d = z < a ? a - z : z > b ? z - b : 0;
  return 1 - THREE.MathUtils.smoothstep(d, 0, fade);
};

/** Ancho de playa: casi nada en las puntas rocosas y en el puerto. */
function beach(z: number) {
  const rock = Math.max(near(z, -500, -455), near(z, 200, 350), near(z, 740, 1500, 30));
  return THREE.MathUtils.lerp(52, 5, rock);
}

/* ───────────── Edificios de Bustillo (Casino y Hotel Provincial) ───────────── */

function mansard(len: number, w0: number, w1: number, h: number, m: THREE.Material) {
  const s = new THREE.Shape();
  s.moveTo(-w0 / 2, 0);
  s.lineTo(w0 / 2, 0);
  s.lineTo(w1 / 2, h);
  s.lineTo(-w1 / 2, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2);
  return new THREE.Mesh(g, m);
}

function bustillo(front: number, z0: number, z1: number, haze: THREE.Color) {
  const g = new THREE.Group();
  const len = z1 - z0;
  const zc = (z0 + z1) / 2;
  const depth = 34;
  const xc = front - depth / 2;
  const stone = std("#ddd2bb", { roughness: 0.9 });
  const slate = std("#46515c", { roughness: 0.6, metalness: 0.15 });
  // basamento de piedra con recova (arcos oscuros)
  g.add(box(depth, 7, len, stone, xc, TOP, zc));
  const arches = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 4.4, 3.4), std("#2d2a27"), Math.floor(len / 6));
  const m = new THREE.Matrix4();
  for (let i = 0; i < arches.count; i++) arches.setMatrixAt(i, m.makeTranslation(front + 0.05, TOP + 2.2, z0 + 3 + i * 6));
  g.add(arches);
  // cuerpo de ladrillo con ventanas (cuerpo central y pabellones de las puntas más altos)
  const brick = "#a4593b";
  const body: Building[] = [
    { x: xc - 1, z: zc, y: TOP + 7, w: depth - 2, d: len - 30, h: 18, color: brick, floor: 3.6, bay: 4 },
    { x: xc, z: z0 + 9, y: TOP + 7, w: depth + 2, d: 18, h: 23, color: brick, floor: 3.6, bay: 4 },
    { x: xc, z: z1 - 9, y: TOP + 7, w: depth + 2, d: 18, h: 23, color: brick, floor: 3.6, bay: 4 },
  ];
  g.add(buildings(body, "office", haze, 0.2));
  // cornisas de piedra
  g.add(box(depth + 1, 0.9, len - 30, stone, xc - 1, TOP + 25, zc));
  for (const z of [z0 + 9, z1 - 9]) g.add(box(depth + 3, 0.9, 19, stone, xc, TOP + 30, z));
  // techos de pizarra: mansarda corrida y pirámides en los pabellones, con buhardillas
  const roof = mansard(len - 30, depth, depth - 14, 8, slate);
  roof.position.set(xc - 1, TOP + 25.9, zc);
  roof.rotation.y = 0;
  g.add(roof);
  for (const z of [z0 + 9, z1 - 9]) {
    const pyr = new THREE.Mesh(new THREE.ConeGeometry(14, 11, 4), slate);
    pyr.rotation.y = Math.PI / 4;
    pyr.scale.set(1.35, 1, 0.75);
    pyr.position.set(xc, TOP + 30.9 + 5.5, z);
    g.add(pyr);
  }
  const dormers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 3, 2.2), stone, Math.floor((len - 34) / 7));
  for (let i = 0; i < dormers.count; i++) dormers.setMatrixAt(i, m.makeTranslation(front - 5, TOP + 28.5, z0 + 20 + i * 7));
  g.add(dormers);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

/** Lobo marino de piedra (las esculturas de la Rambla), mirando al mar (+X). */
function seaLion(stone: THREE.Material) {
  const g = new THREE.Group();
  g.add(box(4.2, 2.6, 3.2, std("#d8cdb6", { roughness: 0.9 }), 0, 0, 0)); // pedestal
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), stone);
  body.scale.set(2.6, 1.2, 1.2);
  body.rotation.z = 0.55;
  body.position.set(-0.4, 3.6, 0);
  const neck = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10), stone);
  neck.scale.set(1, 1.4, 0.9);
  neck.position.set(1.3, 5.1, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10), stone);
  head.scale.set(1.5, 0.9, 0.85);
  head.position.set(1.9, 6.3, 0);
  g.add(body, neck, head);
  for (const s of [-1, 1]) {
    const flip = box(1.6, 0.25, 0.9, stone, 0.9, 2.65, s * 1.1);
    flip.rotation.y = s * 0.5;
    g.add(flip);
  }
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

/** Torreón del Monje: castillito de piedra rojiza sobre las rocas, con su torre almenada y el puente sobre la costanera. */
function torreon(x: number, z: number, edge: number) {
  const g = new THREE.Group();
  const stoneMat = std("#b9764a", { roughness: 0.9 });
  const trim = std("#e8dcc4", { roughness: 0.9 });
  g.add(box(20, TOP + 6, 26, stoneMat, x, -1, z));
  g.add(box(9, 22, 9, stoneMat, x + 3, TOP + 5, z - 6)); // torre
  g.add(box(10, 1, 10, trim, x + 3, TOP + 27, z - 6));
  g.add(box(6, 9, 6, stoneMat, x + 6, TOP + 5, z + 8)); // torrecilla
  const merlon = new THREE.BoxGeometry(1.3, 1.6, 1.3);
  const items: THREE.Vector3[] = [];
  for (let i = -2; i <= 2; i++) items.push(new THREE.Vector3(x + 3 + i * 2, TOP + 28.8, z - 10.4), new THREE.Vector3(x + 3 + i * 2, TOP + 28.8, z - 1.6), new THREE.Vector3(x - 1.4, TOP + 28.8, z - 6 + i * 2), new THREE.Vector3(x + 7.4, TOP + 28.8, z - 6 + i * 2));
  for (let i = -4; i <= 4; i++) items.push(new THREE.Vector3(x + 9.6, TOP + 5.8, z + i * 2.8), new THREE.Vector3(x - 9.6, TOP + 5.8, z + i * 2.8));
  const merlons = new THREE.InstancedMesh(merlon, stoneMat, items.length);
  items.forEach((p, i) => merlons.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z)));
  g.add(merlons);
  // ventanas góticas oscuras en la torre
  for (let k = 0; k < 3; k++) g.add(box(0.3, 2.6, 1.4, std("#2a2420"), x + 7.6, TOP + 10 + k * 5, z - 6));
  // puente de arco hacia la ciudad, sobre la costanera
  const bridgeLen = x - 10 - edge + 22;
  g.add(box(bridgeLen, 2.4, 6, stoneMat, x - 10 - bridgeLen / 2, TOP + 7, z + 2));
  g.add(box(4, 9.4, 6, stoneMat, x - 10 - bridgeLen + 2, TOP, z + 2)); // pilar del lado de la ciudad
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

/** Faro de Punta Mogotes: torre de franjas rojas y blancas. */
function lighthouse(x: number, z: number) {
  const g = new THREE.Group();
  const red = std("#c62828"), white = std("#f4f4f2");
  for (let i = 0; i < 7; i++) {
    const r0 = 3.4 - i * 0.22;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r0 - 0.22, r0, 5, 18), i % 2 ? white : red);
    seg.position.set(x, TOP + 2.5 + i * 5, z);
    g.add(seg);
  }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.4, 14), std("#2a3540", { roughness: 0.2, metalness: 0.6, emissive: "#ffe9a8", emissiveIntensity: 0.25 }));
  lamp.position.set(x, TOP + 36.2, z);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.2, 14), red);
  cap.position.set(x, TOP + 38.5, z);
  g.add(lamp, cap, box(12, 5, 9, white, x - 9, TOP, z));
  return g;
}

/* ───────────── Escena ───────────── */

export function createMarDelPlata(p: SkyPalette) {
  const g = new THREE.Group();
  const haze = new THREE.Color(p.haze);
  const rand = rng(41);
  const colliders: Collider[] = [];
  const edge = (z: number) => shoreAt(SHORE, z) - beach(z);

  // playa de arena (entra un poco al agua para que la ola la lama) y la rambla/ciudad con su murallón
  g.add(landSlab(SHORE, () => -4, -2200, -1.6, 2.3, std("#e3cfa2", { roughness: 1 })));
  g.add(landSlab(SHORE, beach, -2200, -1.6, TOP + 1.6, std("#cdbf9f", { roughness: 0.95 })));
  // costanera (Bulevar Marítimo): baranda, vereda, asfalto
  const zA = SHORE[0][0], zB = 760;
  g.add(shoreStrip(SHORE, (z) => beach(z) + 0.3, (z) => beach(z) + 0.9, zA, zB, TOP, 1.1, std("#f1ece0")));
  g.add(shoreStrip(SHORE, (z) => beach(z) + 0.9, (z) => beach(z) + 6, zA, zB, TOP, 0.12, std("#bdb6a8")));
  g.add(shoreStrip(SHORE, (z) => beach(z) + 6, (z) => beach(z) + 20, zA, zB, TOP, 0.1, std("#3b3e43", { roughness: 0.95 })));
  // faroles
  const lamps: { x: number; y: number; z: number; c: string }[] = [];
  for (let z = zA + 20; z < zB; z += 28) lamps.push({ x: edge(z) - 2.4, y: TOP + 2.6, z, c: "#2f3a40" });
  g.add(scatter(new THREE.BoxGeometry(0.25, 5.2, 0.25), lamps));

  // piedras al pie de las puntas (Punta Iglesia, Varese, Cabo Corrientes)
  for (const [a, b] of [[-520, -440], [180, 380]] as const) {
    const path: [number, number][] = [];
    for (let z = a; z <= b; z += 10) path.push([shoreAt(SHORE, z) - 1, z]);
    g.add(rockLine(path, 9, rand, "#9b9286", 3.6, 2.2));
  }

  // espigones de piedra de Bristol y La Perla (se pueden chocar: no penalizan)
  [-960, -820, -690, -380, -250, -110, 40].forEach((z, i) => {
    const x0 = shoreAt(SHORE, z);
    const path: [number, number][] = [[x0 - 40, z], [x0 + 78, z + 6]];
    g.add(rockLine(path, 8, rand, "#a29d94", 3.4, 2.0));
    colliders.push(...lineColliders([[x0 - 4, z + 2], [x0 + 80, z + 6]], 5, 1000 + i));
  });

  // Rambla Bristol: Casino al norte, Hotel Provincial al sur, escalinata y lobos marinos en el medio
  const front = edge(-140) - 22;
  g.add(bustillo(front, BRISTOL.z0, -150, haze), bustillo(front, -112, BRISTOL.z1, haze));
  const plaza = std("#d9cfb9", { roughness: 0.95 });
  for (let i = 0; i < 10; i++) g.add(box(1.3, TOP + 1.2 - i * 0.62, 60, plaza, edge(-131) + 0.6 + i * 1.3, -1, -131));
  const stone = std("#55534f", { roughness: 0.85 });
  for (const z of [-154, -108]) {
    const lion = seaLion(stone);
    lion.position.set(edge(z) - 3, TOP, z);
    g.add(lion);
  }

  // torres de departamentos (la postal de Mar del Plata), más altas sobre la costa
  const towers: Building[] = [];
  const cream = ["#d9c3a0", "#c9ad86", "#b8946c", "#a86f52", "#c98f6a", "#d6cdbf", "#9c958b", "#e0cfae", "#b5a184", "#8f6a52", "#cdbb9c"];
  for (let row = 0; row < 9; row++) {
    for (let z = SHORE[0][0] + rand() * 30; z < 740; z += 26 + rand() * 22) {
      const back = 34 + row * 46 + rand() * 18;
      const inBristol = z > BRISTOL.z0 - 15 && z < BRISTOL.z1 + 15 && back < 120;
      const inTorreon = z > 200 && z < 300 && back < 70;
      if (inBristol || inTorreon || rand() < 0.18) continue;
      const frontRow = row < 2 ? 1 : 0;
      const h = frontRow ? 30 + rand() * 55 : 14 + rand() * (row < 5 ? 42 : 24);
      towers.push({
        x: edge(z) - back,
        z,
        y: TOP,
        w: 16 + rand() * 12,
        d: 18 + rand() * 12,
        h,
        color: cream[Math.floor(rand() * cream.length)],
        floor: 2.9,
        bay: 3.6,
      });
    }
  }
  g.add(buildings(towers, "apartment", haze, 0.55));

  // Torreón del Monje: adelantado sobre su peñasco, unido a la ciudad por el puente
  const tx = shoreAt(SHORE, 250) + 6;
  g.add(torreon(tx, 250, edge(250)));
  const ring: [number, number][] = [];
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.35) ring.push([tx + 2 + Math.cos(a) * 16, 250 + Math.sin(a) * 19]);
  g.add(rockLine(ring, 6, rand, "#8f8579", 4, 2.2));
  colliders.push({ x: tx + 2, z: 240, r: 15, group: 1300 }, { x: tx + 2, z: 260, r: 15, group: 1300 });

  // sombrillas en Bristol / La Perla y carpas de balneario en Playa Grande, con gente
  const umbrellas: { x: number; y: number; z: number; c: string }[] = [];
  const people: { x: number; y: number; z: number; c: string }[] = [];
  const uCols = ["#e63946", "#f1c40f", "#2a9d8f", "#ffffff", "#1d6fb8", "#f4a261"];
  const skin = ["#e0b391", "#c98e66", "#f1c9a5", "#8d5a3b"];
  for (let z = -1000; z < 120; z += 7) {
    if (beach(z) < 30 || (z > -200 && z < -60)) continue;
    for (let k = 0; k < 4; k++) {
      if (rand() < 0.45) continue;
      const x = shoreAt(SHORE, z) - 12 - k * 8 - rand() * 4;
      umbrellas.push({ x, y: 2.6, z: z + rand() * 4, c: uCols[Math.floor(rand() * uCols.length)] });
      if (rand() < 0.7) people.push({ x: x + 2, y: 1.2, z: z + rand() * 3, c: skin[Math.floor(rand() * skin.length)] });
    }
    if (rand() < 0.5) people.push({ x: shoreAt(SHORE, z) - 3 + rand() * 4, y: 1.2, z, c: skin[Math.floor(rand() * skin.length)] });
  }
  g.add(scatter(new THREE.ConeGeometry(1.8, 0.7, 8), umbrellas, { roughness: 0.8 }));
  g.add(scatter(new THREE.BoxGeometry(0.15, 2.2, 0.15), umbrellas.map((u) => ({ ...u, y: 1.4, c: "#dddddd" }))));
  const carpas: { x: number; y: number; z: number; c: string }[] = [];
  const stripes = ["#1f5fa8", "#f6f6f6", "#e36a1d", "#f6f6f6", "#2f7d4f", "#f6f6f6"];
  for (let row = 0; row < 4; row++) {
    for (let z = 420; z < 690; z += 3.6) carpas.push({ x: shoreAt(SHORE, z) - 22 - row * 6, y: 1.6, z, c: stripes[(Math.floor((z - 420) / 3.6) + row * 2) % stripes.length] });
  }
  g.add(scatter(new THREE.BoxGeometry(3.4, 2.6, 3.4), carpas, { roughness: 0.85 }));
  for (let z = 425; z < 690; z += 6) if (rand() < 0.5) people.push({ x: shoreAt(SHORE, z) - 6 - rand() * 8, y: 1.2, z, c: skin[Math.floor(rand() * skin.length)] });
  g.add(scatter(new THREE.BoxGeometry(0.5, 1.7, 0.4), people, { roughness: 0.9 }));
  // balnearios (edificio bajo al fondo de Playa Grande)
  g.add(box(14, TOP + 3, 260, std("#f2efe8"), edge(555) + 6, -1, 555));

  // Puerto: escolleras Norte y Sur con sus luces, lanchitas amarillas y la lobería
  const north: [number, number][] = [[shoreAt(SHORE, 760) - 10, 760], [-480, 792], [-388, 812]];
  const south: [number, number][] = [[shoreAt(SHORE, 1080) - 10, 1080], [-430, 1030], [-338, 940], [-300, 858]];
  for (const [path, i] of [[north, 0], [south, 1]] as const) {
    g.add(rockLine(path as [number, number][], 13, rand, "#a7a197", 4.2, 2.2));
    colliders.push(...lineColliders(path as [number, number][], 7, 1100 + i));
  }
  const crown = std("#b8b2a6", { roughness: 0.9 });
  for (const path of [north, south]) {
    for (let i = 1; i < path.length; i++) {
      const [ax, az] = path[i - 1], [bx, bz] = path[i];
      const len = Math.hypot(bx - ax, bz - az);
      const seg = box(5, 1.4, len, crown, (ax + bx) / 2, 2.2, (az + bz) / 2);
      seg.rotation.y = Math.atan2(bx - ax, bz - az);
      g.add(seg);
    }
  }
  for (const [[x, z], col] of [[north[north.length - 1], "#2e8b57"], [south[south.length - 1], "#c62828"]] as const) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 9, 12), std(col));
    t.position.set(x, 7.6, z);
    g.add(t);
  }
  // banquina de pescadores con lanchitas amarillas
  const bobbing: { obj: THREE.Object3D; phase: number }[] = [];
  const quayX = shoreAt(SHORE, 900);
  for (let z = 830; z < 1040; z += 6.5) {
    const len = 13 + rand() * 4;
    const b = workBoat(len, rand() < 0.8 ? "#f2b705" : "#e8731a", "#f4f4f2", "#c8102e");
    b.position.set(quayX + 2 + len / 2, 0, z);
    b.rotation.y = -Math.PI / 2; // popa a la banquina, proa al agua (+X)
    g.add(b);
    bobbing.push({ obj: b, phase: rand() * 10 });
  }
  for (const [x, z, col] of [[-470, 880, "#b03a2e"], [-455, 960, "#1f4e79"]] as const) {
    const b = workBoat(30, col, "#f2f2f0", "#f2f2f0");
    b.position.set(x, 0, z);
    b.rotation.y = 0.2;
    g.add(b);
    bobbing.push({ obj: b, phase: rand() * 10 });
    colliders.push({ x, z: z - 9, r: 4.5, group: 1200 + z }, { x, z, r: 4.5, group: 1200 + z }, { x, z: z + 9, r: 4.5, group: 1200 + z });
  }
  // lobos marinos de verdad tirados en la escollera sur
  const lions: { x: number; y: number; z: number; c: string; yaw: number }[] = [];
  for (let i = 0; i < 26; i++) {
    const k = rand();
    const x = -430 + k * 90 + rand() * 6, z = 1030 - k * 90 - 8;
    lions.push({ x, y: 1.6, z, c: rand() < 0.5 ? "#4a3a2c" : "#5d4a38", yaw: rand() * 6 });
  }
  g.add(scatter(new THREE.CapsuleGeometry(0.55, 1.6, 4, 8).rotateZ(Math.PI / 2), lions, { roughness: 0.6 }));

  // galpones del puerto, la Banquina y la ciudad baja hacia Punta Mogotes
  const port: Building[] = [];
  const portCols = ["#d6d0c4", "#b9c2c8", "#c98e5a", "#e8e4dc", "#8fa3ad", "#a0533c"];
  for (let i = 0; i < 70; i++) {
    const z = 760 + rand() * 720;
    const nearQuay = z < 1080;
    port.push({
      x: edge(z) - (nearQuay ? 14 + rand() * 120 : 30 + rand() * 300),
      z,
      y: TOP,
      w: 16 + rand() * 30,
      d: 14 + rand() * 30,
      h: nearQuay ? 6 + rand() * 9 : 8 + rand() * 30,
      color: portCols[Math.floor(rand() * portCols.length)],
      floor: 3.2,
      bay: 5,
    });
  }
  g.add(buildings(port, "office", haze, 0.55));

  // faro de Punta Mogotes al sur
  g.add(lighthouse(shoreAt(SHORE, 1400) - 30, 1400));

  // una lanchita que sale del puerto, pasea por la costa y vuelve
  const tour = workBoat(15, "#f2b705");
  g.add(tour);
  const route = pathSampler([
    [-520, 930],
    [-420, 880],
    [-340, 835],
    [-300, 700],
    [-360, 420],
    [-420, 120],
    [-430, -200],
    [-380, -120],
    [-330, 300],
    [-310, 720],
    [-350, 850],
    [-440, 900],
    [-520, 930],
  ]);

  const showcase: Showcase[] = [
    { title: "Mar del Plata", subtitle: "Rambla Bristol: el Casino, el Hotel Provincial y los lobos marinos", pos: [-430, 22, -10], look: [-690, 18, -140] },
    { title: "Cabo Corrientes", subtitle: "El Torreón del Monje sobre las rocas de Playa Varese", pos: [-400, 14, 170], look: [-515, 14, 250] },
  ];

  return {
    group: g,
    colliders,
    shore: shoreClamp(SHORE, 4),
    showcase,
    update(t: number, heightAt: (x: number, z: number) => number) {
      for (const b of bobbing) {
        const q = b.obj.position;
        q.y = heightAt(q.x, q.z) * 0.4;
        b.obj.rotation.z = Math.sin(t * 0.9 + b.phase) * 0.03;
      }
      const s = route.at(t * 5.5);
      tour.position.set(s.x, heightAt(s.x, s.z) * 0.5, s.z);
      tour.rotation.y = s.yaw;
      tour.rotation.z = Math.sin(t * 1.3) * 0.04;
    },
  };
}
