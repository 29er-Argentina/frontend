import * as THREE from "three";
import type { SkyPalette } from "./sky";
import type { Collider } from "./monaco";
import {
  box,
  buildings,
  cargoShip,
  hullColliders,
  landSlab,
  lineColliders,
  rng,
  rockLine,
  scatter,
  segBox,
  shoreAt,
  shoreClamp,
  shoreStrip,
  std,
  trees,
  type Building,
  type ShorePts,
  type Showcase,
} from "./coastkit";

/**
 * Buenos Aires vista desde el Río de la Plata (el río al este = +X, el norte = -Z).
 * La costa baja en diagonal de Núñez (noroeste) a Puerto Madero (sudeste):
 * Ciudad Universitaria y el Monumental, la Costanera Norte con su murallón de piedras,
 * Aeroparque sobre el relleno con aviones que despegan y aterrizan, el Club de Pescadores
 * con su muelle, el Puerto Nuevo con grúas y contenedores, las torres de Catalinas y
 * Puerto Madero al fondo, y buques fondeados en la rada esperando entrar.
 */

const SHORE: ShorePts = [
  [-1500, -930],
  [-1100, -790],
  [-760, -680],
  [-520, -610],
  [-470, -545], // esquina norte del relleno de Aeroparque
  [380, -315], // esquina sur
  [430, -385],
  [620, -335],
  [660, -250], // Puerto Nuevo: frente de muelle
  [1000, -160],
  [1060, -260],
  [1500, -140],
];

const TOP = 3; // costanera / relleno sobre el agua (Buenos Aires es baja y plana)

/** Pista de Aeroparque (13/31), paralela a la costa del relleno. */
const RWY_N: [number, number] = [-628, -420];
const RWY_S: [number, number] = [-404, 330];

function airliner() {
  const g = new THREE.Group();
  const white = std("#f5f7f9", { roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide });
  const sky = std("#5aa0d8", { roughness: 0.4 });
  const grey = std("#9aa3ab", { roughness: 0.4, metalness: 0.5 });
  // frente hacia -Z, largo ≈ 38 m
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 30, 16), white);
  fus.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), white);
  nose.rotation.x = -Math.PI / 2;
  nose.scale.set(1, 1.8, 1);
  nose.position.z = -15;
  const tail = new THREE.Mesh(new THREE.ConeGeometry(2, 8, 16), white);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0.6, 19);
  g.add(fus, nose, tail);
  g.add(box(0.4, 0.5, 30, sky, 2.0, -0.2, 0), box(0.4, 0.5, 30, sky, -2.0, -0.2, 0)); // franja celeste
  const wing = new THREE.Shape();
  wing.moveTo(0, 0);
  wing.lineTo(17, 6);
  wing.lineTo(17, 8);
  wing.lineTo(0, 7);
  wing.closePath();
  for (const s of [1, -1]) {
    const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.4, bevelEnabled: false });
    wg.rotateX(Math.PI / 2);
    const w = new THREE.Mesh(wg, white);
    w.scale.x = s;
    w.position.set(0, -0.8, -3);
    g.add(w);
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.6, 12), grey);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(s * 6, -2, -1);
    g.add(eng);
    const hs = new THREE.Mesh(wg, white);
    hs.scale.set(s * 0.38, 1, 0.45);
    hs.position.set(0, 0.6, 16);
    g.add(hs);
  }
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.lineTo(7, 0);
  fin.lineTo(7.5, 8);
  fin.lineTo(5, 8);
  fin.closePath();
  const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.4, bevelEnabled: false });
  fg.rotateY(-Math.PI / 2);
  const finMesh = new THREE.Mesh(fg, sky);
  finMesh.position.set(0.2, 1.5, 15);
  g.add(finMesh);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

/** Grúa pórtico de muelle (STS), con la pluma sobre el agua (+X). */
function stsCrane(col: THREE.Material, white: THREE.Material) {
  const g = new THREE.Group();
  for (const dx of [-8, 8]) for (const dz of [-7, 7]) g.add(box(1.2, 34, 1.2, col, dx, TOP, dz));
  g.add(box(19, 2, 16, col, 0, TOP + 34, 0));
  g.add(box(80, 2.4, 3, col, 18, TOP + 38, 0)); // pluma
  g.add(box(6, 4, 5, white, -2, TOP + 30, 0)); // sala de máquinas
  g.add(box(1, 14, 1, col, -6, TOP + 40, 0)); // torre de la pluma
  return g;
}

export function createBuenosAires(p: SkyPalette) {
  const g = new THREE.Group();
  const haze = new THREE.Color(p.haze);
  const rand = rng(77);
  const colliders: Collider[] = [];
  const inland = (d: number, z: number) => shoreAt(SHORE, z) - d;

  // tierra baja: relleno con murallón y piedras sueltas en toda la costa
  g.add(landSlab(SHORE, () => 0, -2400, -2, TOP + 2, std("#a8a28f", { roughness: 0.95 })));
  g.add(landSlab(SHORE, () => 6, -2400, -1.9, TOP + 1.92, std("#6f8a4f", { roughness: 1 }))); // césped de la costanera
  const rip: [number, number][] = [];
  for (let z = SHORE[0][0]; z <= 640; z += 8) rip.push([shoreAt(SHORE, z) + 2, z]);
  g.add(rockLine(rip, 6, rand, "#8a8170", 2.6, 2.4));
  // Avenida Costanera (Rafael Obligado) con vereda y pescadores sobre el murallón
  const zA = SHORE[0][0], zB = 640;
  g.add(shoreStrip(SHORE, () => 9, () => 23, zA, zB, TOP + 0.02, 0.06, std("#3b3e43", { roughness: 0.95 }), 10));
  const fishers: { x: number; y: number; z: number; c: string }[] = [];
  const shirts = ["#2a6fdb", "#d62828", "#f1f1f1", "#1d1d1d", "#26a9e0", "#faaf40"];
  for (let z = -1300; z < 620; z += 9) if (rand() < 0.35) fishers.push({ x: shoreAt(SHORE, z) - 1.5, y: TOP + 0.85, z, c: shirts[Math.floor(rand() * shirts.length)] });

  // Aeroparque: pista con marcas, calles de rodaje, terminal y torre de control
  const asphalt = std("#45484d", { roughness: 0.95 });
  const paint = std("#f2f2f2", { roughness: 0.8 });
  g.add(segBox(RWY_N, RWY_S, 45, 0.08, asphalt, TOP));
  const rdx = RWY_S[0] - RWY_N[0], rdz = RWY_S[1] - RWY_N[1];
  const rlen = Math.hypot(rdx, rdz);
  const ux = rdx / rlen, uz = rdz / rlen;
  for (let d = 40; d < rlen - 40; d += 50) {
    const a: [number, number] = [RWY_N[0] + ux * d, RWY_N[1] + uz * d];
    g.add(segBox(a, [a[0] + ux * 26, a[1] + uz * 26], 0.9, 0.04, paint, TOP + 0.08)); // eje
  }
  for (const [end, sgn] of [[RWY_N, 1], [RWY_S, -1]] as const) {
    for (let k = -4; k <= 4; k++) {
      if (k === 0) continue;
      const cx = end[0] + ux * 12 * sgn + uz * k * 4.2, cz = end[1] + uz * 12 * sgn - ux * k * 4.2;
      g.add(segBox([cx, cz], [cx + ux * 30 * sgn, cz + uz * 30 * sgn], 1.8, 0.04, paint, TOP + 0.08)); // cebra de umbral
    }
  }
  const taxiOff = -95; // calle de rodaje del lado de la ciudad
  g.add(segBox([RWY_N[0] - uz * taxiOff * -1, RWY_N[1] + ux * taxiOff * -1], [RWY_S[0] - uz * taxiOff * -1, RWY_S[1] + ux * taxiOff * -1], 23, 0.07, asphalt, TOP));
  const terminalZ = 140;
  const termX = inland(250, terminalZ);
  g.add(buildings([{ x: termX, z: terminalZ, y: TOP, w: 48, d: 260, h: 14, color: "#e9eef2", floor: 7, bay: 6, yaw: Math.atan2(ux, uz) }], "glass", haze, 0.3));
  g.add(box(4, 32, 4, std("#e6e6e2"), termX + 30, TOP, terminalZ - 180), box(9, 5, 9, std("#33414d", { roughness: 0.2, metalness: 0.6 }), termX + 30, TOP + 32, terminalZ - 180));
  // aviones estacionados en plataforma
  for (let i = 0; i < 4; i++) {
    const a = airliner();
    a.position.set(termX + 45, TOP + 3.2, terminalZ - 90 + i * 55);
    a.rotation.y = Math.atan2(-uz, ux); // trompa hacia la calle de rodaje
    g.add(a);
  }

  // Club de Pescadores: muelle sobre pilotes y el edificio estilo Tudor en la punta
  const pierZ = 470;
  const px0 = shoreAt(SHORE, pierZ);
  const pierLen = 170;
  g.add(box(pierLen, 0.8, 6, std("#8b6b4a", { roughness: 0.9 }), px0 + pierLen / 2, TOP, pierZ));
  const piles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.35, TOP + 4, 6), std("#5a4632"), 2 * Math.floor(pierLen / 6));
  const mm = new THREE.Matrix4();
  for (let i = 0; i < piles.count / 2; i++) {
    piles.setMatrixAt(2 * i, mm.makeTranslation(px0 + 3 + i * 6, TOP / 2 - 1.8, pierZ - 2.6));
    piles.setMatrixAt(2 * i + 1, mm.makeTranslation(px0 + 3 + i * 6, TOP / 2 - 1.8, pierZ + 2.6));
  }
  g.add(piles);
  const cx = px0 + pierLen + 8;
  const plaster = std("#f3eee3"), beams = std("#3a2b20"), roofMat = std("#5b3a2a", { roughness: 0.8 });
  g.add(box(20, 2, 22, std("#8b6b4a"), cx, TOP - 1, pierZ));
  g.add(box(16, 8, 16, plaster, cx, TOP + 1, pierZ));
  for (let k = -3; k <= 3; k++) g.add(box(16.2, 8, 0.35, beams, cx, TOP + 1, pierZ + k * 2.4), box(0.35, 8, 16.2, beams, cx + k * 2.4, TOP + 1, pierZ));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(13, 9, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(cx, TOP + 13.5, pierZ);
  const turret = box(5, 8, 5, plaster, cx + 6, TOP + 9, pierZ - 6);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(4, 6, 4), roofMat);
  spire.rotation.y = Math.PI / 4;
  spire.position.set(cx + 6, TOP + 20, pierZ - 6);
  g.add(roof, turret, spire);
  for (let x = px0 + 8; x < px0 + pierLen; x += 7) if (rand() < 0.6) fishers.push({ x, y: TOP + 1.65, z: pierZ + (rand() < 0.5 ? -2.6 : 2.6), c: shirts[Math.floor(rand() * shirts.length)] });
  colliders.push(...lineColliders([[px0, pierZ], [px0 + pierLen + 18, pierZ]], 6, 2000));
  g.add(scatter(new THREE.BoxGeometry(0.5, 1.7, 0.4), fishers, { roughness: 0.9 }));

  // Puerto Nuevo: frente de muelle con grúas pórtico, contenedores y un portacontenedores amarrado
  const quayZ0 = 680, quayZ1 = 980;
  const craneMat = std("#c0392b", { roughness: 0.5 }), craneWhite = std("#f2f2f0");
  for (let i = 0; i < 6; i++) {
    const z = quayZ0 + 30 + i * 48;
    const c = stsCrane(i % 2 ? craneWhite : craneMat, craneWhite);
    c.position.set(shoreAt(SHORE, z) - 12, 0, z);
    g.add(c);
  }
  const contColors = ["#b3261e", "#1f5fa8", "#e0a526", "#2f7d4f", "#d9d9d9", "#7a3f99", "#e36a1d", "#8a8f94"];
  const stacks: { x: number; y: number; z: number; c: string }[] = [];
  for (let z = quayZ0; z < quayZ1; z += 6.6) {
    for (let r = 0; r < 14; r++) {
      if (rand() < 0.15) continue;
      const tiers = 1 + Math.floor(rand() * 4);
      for (let t = 0; t < tiers; t++) stacks.push({ x: shoreAt(SHORE, z) - 55 - r * 2.7, y: TOP + 1.3 + t * 2.6, z, c: contColors[Math.floor(rand() * contColors.length)] });
    }
  }
  g.add(scatter(new THREE.BoxGeometry(2.45, 2.55, 6.1), stacks, { roughness: 0.7 }));
  const berth = cargoShip(220, "#1f2a38", rand, "containers");
  const bz = 830;
  const bx = shoreAt(SHORE, bz) + 22;
  berth.position.set(bx, 0, bz);
  berth.rotation.y = Math.atan2(90, 340); // paralelo al muelle
  g.add(berth);
  colliders.push(...hullColliders(bx, bz, 220, berth.rotation.y, 0.09, 2001));
  // silos de granos detrás del puerto
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 42, 18), std("#d8d2c4", { roughness: 0.9 }));
    s.position.set(shoreAt(SHORE, 1040) - 120 - (i % 4) * 12.5, TOP + 21, 1040 + Math.floor(i / 4) * 12.5);
    g.add(s);
  }

  // ciudad: Palermo y Belgrano bajos y medios detrás de los parques; torres de Catalinas y Puerto Madero al sur
  const flats: Building[] = [];
  const cols = ["#d8d0c2", "#c4bba9", "#b5ab98", "#a8714f", "#b8865f", "#9ea4a8", "#d9cbb1", "#8c8f91", "#c9a27e"];
  for (let i = 0; i < 520; i++) {
    const z = -1450 + rand() * 2050;
    const back = 380 + rand() * 900;
    const tall = rand() < 0.22;
    flats.push({ x: inland(back, z), z, y: TOP, w: 18 + rand() * 20, d: 18 + rand() * 20, h: tall ? 45 + rand() * 60 : 12 + rand() * 26, color: cols[Math.floor(rand() * cols.length)], floor: 2.9 });
  }
  g.add(buildings(flats, "apartment", haze, 0.5));
  const glass: Building[] = [];
  const glassCols = ["#7f9fb3", "#5d7f97", "#8eaab9", "#6f8f86", "#a4b8c6", "#4f6577"];
  for (let i = 0; i < 46; i++) {
    const z = 1080 + rand() * 360;
    glass.push({ x: inland(160 + rand() * 340, z), z, y: TOP, w: 26 + rand() * 18, d: 26 + rand() * 18, h: 90 + rand() * 90, color: glassCols[Math.floor(rand() * glassCols.length)], floor: 3.8, bay: 3 });
  }
  // las que se reconocen: Alvear Tower (la más alta), las torres El Faro (gemelas), Torre YPF
  glass.push({ x: inland(260, 1230), z: 1230, y: TOP, w: 30, d: 30, h: 235, color: "#a9bccb", floor: 3.6, bay: 3 });
  glass.push({ x: inland(200, 1140), z: 1140, y: TOP, w: 32, d: 32, h: 170, color: "#cfdbe4", floor: 3.6, bay: 3 }, { x: inland(200, 1185), z: 1185, y: TOP, w: 32, d: 32, h: 170, color: "#cfdbe4", floor: 3.6, bay: 3 });
  glass.push({ x: inland(320, 1320), z: 1320, y: TOP, w: 44, d: 30, h: 160, color: "#7f98ab", floor: 3.8, bay: 3, yaw: 0.5 });
  g.add(buildings(glass, "glass", haze, 0.6));
  // Torre Monumental (de los Ingleses) en Retiro
  const brick = std(new THREE.Color("#9a4e32").lerp(haze, 0.35), { roughness: 0.9 });
  const tmx = inland(240, 1000);
  g.add(box(14, 60, 14, brick, tmx, TOP, 1000), box(16, 3, 16, std(new THREE.Color("#e0d6c2").lerp(haze, 0.35)), tmx, TOP + 60, 1000));
  const clock = new THREE.Mesh(new THREE.ConeGeometry(9, 14, 4), std(new THREE.Color("#4f6b74").lerp(haze, 0.35)));
  clock.rotation.y = Math.PI / 4;
  clock.position.set(tmx, TOP + 70, 1000);
  g.add(clock);

  // Estadio Monumental (River) al norte: anillo blanco con la franja roja
  const stadium = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(120, 110, 32, 40, 1, true), std(new THREE.Color("#ecebe6").lerp(haze, 0.45), { side: THREE.DoubleSide }));
  ring.scale.z = 0.8;
  ring.position.y = TOP + 16;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(120.6, 119, 5, 40, 1, true), std(new THREE.Color("#d62828").lerp(haze, 0.35)));
  band.scale.z = 0.8;
  band.position.y = TOP + 22;
  stadium.add(ring, band);
  stadium.position.set(inland(320, -1180), 0, -1180);
  g.add(stadium);
  // Ciudad Universitaria: pabellones largos y bajos junto al río
  g.add(
    buildings(
      [-1320, -1240, -1160].map((z) => ({ x: inland(110, z), z, y: TOP, w: 60, d: 70, h: 16, color: "#cfc8bb", floor: 4, bay: 4, yaw: 0.33 })),
      "office",
      haze,
      0.5
    )
  );

  // arboledas de la costanera y los bosques de Palermo
  const treeList: { x: number; z: number; y: number; s: number }[] = [];
  for (let z = -1450; z < 640; z += 11) {
    const inAirport = z > -480 && z < 400;
    for (let k = 0; k < (inAirport ? 2 : 4); k++) if (rand() < 0.75) treeList.push({ x: inland((inAirport ? 350 : 30) + k * 14 + rand() * 6, z + rand() * 6), z, y: TOP, s: 3 + rand() * 2.5 });
  }
  for (let i = 0; i < 260; i++) {
    const z = -700 + rand() * 1150;
    treeList.push({ x: inland(370 + rand() * 120, z), z, y: TOP, s: 3.5 + rand() * 3 });
  }
  g.add(trees(treeList, rand, haze, "#4d7337"));

  // buques fondeados en la rada (rebotan, no penalizan)
  const anchored: [number, number, number, number, "containers" | "bulk", string][] = [
    [520, -620, 190, 0.12, "bulk", "#7a2e24"],
    [700, -180, 230, -0.08, "containers", "#22313f"],
    [560, 260, 170, 0.18, "bulk", "#2f4f3f"],
  ];
  const bobbing: { obj: THREE.Object3D; phase: number }[] = [];
  anchored.forEach(([x, z, len, yaw, kind, col], i) => {
    const s = cargoShip(len, col, rand, kind);
    s.position.set(x, 0, z);
    s.rotation.y = yaw;
    g.add(s);
    bobbing.push({ obj: s, phase: rand() * 10 });
    colliders.push(...hullColliders(x, z, len, yaw, 0.085, 2100 + i));
  });

  // avión que aterriza en la 13 (desde el río, al norte) y después despega por la 31
  const plane = airliner();
  g.add(plane);
  const hdgS = Math.atan2(-ux, -uz); // rumbo hacia el sur por la pista
  const hdgN = hdgS + Math.PI;
  const at = (d: number): [number, number] => [RWY_N[0] + ux * d, RWY_N[1] + uz * d];

  const showcase: Showcase[] = [
    { title: "Río de la Plata", subtitle: "Costanera Norte y Aeroparque: atento a los aviones", pos: [-330, 26, -120], look: [-560, 10, 40] },
    { title: "Club de Pescadores", subtitle: "El muelle de la Costanera, con Puerto Madero al fondo", pos: [-200, 18, 400], look: [-320, 14, 520] },
  ];

  return {
    group: g,
    colliders,
    shore: shoreClamp(SHORE, 5),
    showcase,
    update(t: number, heightAt: (x: number, z: number) => number) {
      for (const b of bobbing) {
        const q = b.obj.position;
        q.y = heightAt(q.x, q.z) * 0.15;
        b.obj.rotation.z = Math.sin(t * 0.3 + b.phase) * 0.006;
      }
      // ciclo de 70 s: aproximación y aterrizaje (0–26 s), escondido, despegue (34–62 s)
      const c = t % 70;
      plane.visible = true;
      if (c < 26) {
        // final: baja con 3° desde 1.6 km sobre el río, toca a 300 m del umbral y frena
        const k = c / 26;
        const d = THREE.MathUtils.lerp(-1500, rlen - 80, 1 - (1 - k) * (1 - k));
        const [x, z] = at(d);
        const y = d < 150 ? TOP + 3.2 + (150 - d) * 0.06 : TOP + 3.2;
        plane.position.set(x, y, z);
        plane.rotation.set(d < 150 ? 0.05 : 0, hdgS, 0, "YXZ");
      } else if (c < 34) plane.visible = false;
      else if (c < 62) {
        // despegue hacia el norte: carrera, rotación y trepada sobre el río
        const k = (c - 34) / 28;
        const d = rlen - 60 - 2600 * k * k;
        const [x, z] = at(d);
        const lift = Math.max(0, rlen * 0.4 - d);
        plane.position.set(x, TOP + 3.2 + lift * 0.11, z);
        plane.rotation.set(lift > 0 ? 0.16 : 0, hdgN, 0, "YXZ");
      } else plane.visible = false;
    },
  };
}
