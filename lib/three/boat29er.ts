import * as THREE from "three";

/**
 * Modelo procedural de un 29er (unidades en metros, proa hacia -Z).
 * Eslora 4,45 m · manga con alas 1,77 m · mástil 6,25 m · asimétrico.
 */

const BOW_Z = -2.22;
const STERN_Z = 2.22;
const MAST_Z = -0.62;
const MAST_H = 6.25;
const MAST_BEND = 0.14; // caída del tope hacia popa

/** Desplazamiento hacia popa del mástil curvado a la altura h (sobre su base). */
const mastZ = (h: number) => MAST_BEND * Math.pow(h / MAST_H, 2);

function hullHalfWidth(s: number) {
  // s: 0 proa → 1 popa
  const front = Math.pow(Math.sin(Math.min(s * 1.7, 1) * Math.PI * 0.5), 0.75);
  const taper = 1 - 0.1 * Math.max(0, s - 0.72) / 0.28;
  return 0.6 * front * taper + 0.008;
}
const keelY = (s: number) => -0.24 + 0.2 * Math.pow(1 - s, 3);
const sheerY = (s: number) => 0.14 + 0.16 * Math.pow(1 - s, 2.2);

function makeHull() {
  const STATIONS = 48;
  // perfil de media sección (de crujía en cubierta → banda → fondo)
  const profile = (s: number) => {
    const w = hullHalfWidth(s);
    const yb = keelY(s);
    const ys = sheerY(s);
    const mid = yb + (ys - yb) * 0.42;
    return [
      { x: 0, y: ys + 0.035, part: 0 },
      { x: w * 0.45, y: ys + 0.025, part: 0 },
      { x: w * 0.9, y: ys + 0.005, part: 0 },
      { x: w, y: ys - 0.01, part: 1 },
      { x: w * 1.02, y: mid + 0.06, part: 1 },
      { x: w * 1.0, y: mid - 0.02, part: 2 },
      { x: w * 0.86, y: yb + 0.09, part: 3 },
      { x: w * 0.5, y: yb + 0.025, part: 3 },
      { x: 0, y: yb, part: 3 },
    ];
  };

  const ringLen = profile(0).length * 2 - 1; // simétrico, comparte la quilla
  const positions: number[] = [];
  const colors: number[] = [];
  const deck = new THREE.Color("#d9dee4");
  const topside = new THREE.Color("#f7f8fa");
  const stripe = new THREE.Color("#5fb4e6");
  const bottom = new THREE.Color("#eef1f4");
  const palette = [deck, topside, stripe, bottom];

  for (let i = 0; i <= STATIONS; i++) {
    const s = i / STATIONS;
    const z = THREE.MathUtils.lerp(BOW_Z, STERN_Z, s);
    const prof = profile(s);
    const ring = [...prof.map((p) => ({ ...p, x: p.x })), ...prof.slice(0, -1).reverse().map((p) => ({ ...p, x: -p.x }))];
    for (const p of ring) {
      positions.push(p.x, p.y, z);
      const c = palette[p.part];
      colors.push(c.r, c.g, c.b);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < STATIONS; i++) {
    for (let j = 0; j < ringLen - 1; j++) {
      const a = i * ringLen + j;
      const b = a + ringLen;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // espejo de popa
  const base = positions.length / 3;
  const last = STATIONS * ringLen;
  let cx = 0, cy = 0;
  for (let j = 0; j < ringLen; j++) { cy += positions[(last + j) * 3 + 1]; }
  cy /= ringLen;
  positions.push(cx, cy, STERN_Z);
  colors.push(topside.r, topside.g, topside.b);
  for (let j = 0; j < ringLen - 1; j++) idx.push(base, last + j, last + j + 1);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(
    g,
    new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15, side: THREE.DoubleSide })
  );
}

function tube(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

/** Tramo de mástil cónico que sigue la curva de mastZ entre las alturas h0 y h1. */
function mastSection(h0: number, h1: number, r0: number, r1: number, mat: THREE.Material) {
  const g = new THREE.CylinderGeometry(r1, r0, h1 - h0, 12, 24);
  g.translate(0, (h0 + h1) / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + mastZ(p.getY(i)));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

/**
 * Pala con perfil NACA simétrico, que cuelga hacia -Y desde y=0 con borde de ataque en -Z.
 * La punta se redondea en el último 18 % de la envergadura.
 */
function foil(rootChord: number, tipChord: number, span: number, tc: number, sweep: number, mat: THREE.Material) {
  const N = 14; // puntos por cara
  const M = 16; // estaciones en envergadura
  const naca = (t: number) => 5 * tc * (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t * t + 0.2843 * t ** 3 - 0.1036 * t ** 4);
  const positions: number[] = [];
  const idx: number[] = [];
  const ring = N * 2;
  for (let j = 0; j <= M; j++) {
    const s = j / M;
    const tip = s > 0.82 ? Math.sqrt(Math.max(0, 1 - ((s - 0.82) / 0.18) ** 2)) : 1;
    const chord = THREE.MathUtils.lerp(rootChord, tipChord, s) * Math.max(tip, 0.04);
    const le = sweep * s + (1 - tip) * 0.35 * rootChord;
    for (let i = 0; i < ring; i++) {
      const k = i < N ? i : ring - i;
      const t = (1 - Math.cos((Math.PI * k) / N)) / 2;
      const side = i < N ? 1 : -1;
      positions.push(side * naca(t) * chord, -span * s, le - rootChord * 0.35 + t * chord);
    }
  }
  for (let j = 0; j < M; j++)
    for (let i = 0; i < ring; i++) {
      const a = j * ring + i, b = j * ring + ((i + 1) % ring);
      idx.push(a, a + ring, b, b, a + ring, b + ring);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function sailTexture(kind: "main" | "jib" | "spi") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1024;
  const W = c.width, H = c.height;
  const g = c.getContext("2d")!;
  // en la textura: x = u (grátil → baluma), y = 1 - v (cabeza arriba)
  if (kind === "spi") {
    // franjas celeste / blanco / celeste
    const bands = ["#3f9fe0", "#ffffff", "#3f9fe0"];
    bands.forEach((col, i) => {
      g.fillStyle = col;
      g.fillRect(0, (i * H) / 3, W, H / 3 + 1);
    });
    // sol
    g.save();
    g.translate(W / 2, H / 2);
    g.fillStyle = "#faaf40";
    for (let i = 0; i < 16; i++) {
      g.rotate(Math.PI / 8);
      g.beginPath();
      g.moveTo(-10, 40);
      g.lineTo(0, 92);
      g.lineTo(10, 40);
      g.fill();
    }
    g.beginPath();
    g.arc(0, 0, 44, 0, Math.PI * 2);
    g.fill();
    g.restore();
    // paños tri-radiales: desde la cabeza, el puño de amura y el de escota
    g.strokeStyle = "rgba(10,30,60,0.16)";
    g.lineWidth = 2.5;
    for (let i = 1; i < 10; i++) {
      g.beginPath();
      g.moveTo((i / 10) * W, 0);
      g.lineTo((i / 10) * W, H * 0.42);
      g.stroke();
    }
    for (const [ox, dir] of [[0, 1], [W, -1]] as const) {
      for (let i = 1; i <= 6; i++) {
        const a = (i / 7) * Math.PI * 0.5;
        g.beginPath();
        g.moveTo(ox, H);
        g.lineTo(ox + dir * Math.cos(a) * W * 0.62, H - Math.sin(a) * H * 0.55);
        g.stroke();
      }
    }
    // refuerzos en los puños
    g.fillStyle = "rgba(10,26,46,0.22)";
    for (const [x, y, dx, dy] of [[0, H, 1, -1], [W, H, -1, -1]]) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + dx * 70, y);
      g.lineTo(x, y + dy * 120);
      g.fill();
    }
    g.fillRect(0, 0, W, 34);
    // relingas
    g.fillStyle = "rgba(10,26,46,0.35)";
    g.fillRect(0, 0, 8, H);
    g.fillRect(W - 6, 0, 6, H);
    g.fillRect(0, H - 8, W, 8);
  } else {
    // film laminado claro con hilos de refuerzo (scrim)
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#f4f6f9");
    grad.addColorStop(1, "#d9dfe6");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(60,70,82,0.12)";
    g.lineWidth = 1;
    for (let i = -40; i < 80; i++) {
      g.beginPath();
      g.moveTo(i * 18, 0);
      g.lineTo(i * 18 + 600, H);
      g.stroke();
      g.beginPath();
      g.moveTo(i * 18, H);
      g.lineTo(i * 18 + 500, 0);
      g.stroke();
    }
    // costuras de paños, radiales desde el puño de escota
    g.strokeStyle = "rgba(30,40,50,0.18)";
    g.lineWidth = 2;
    for (let i = 1; i <= 7; i++) {
      g.beginPath();
      g.moveTo(W, H);
      g.lineTo(0, H - (i / 7.5) * H);
      g.stroke();
    }
    // ventana transparente
    const win = kind === "main" ? [0.1, 0.8, 0.3, 0.09] : [0.18, 0.72, 0.36, 0.12];
    g.clearRect(win[0] * W, win[1] * H, win[2] * W, win[3] * H);
    g.fillStyle = "rgba(170,200,225,0.32)";
    g.fillRect(win[0] * W, win[1] * H, win[2] * W, win[3] * H);
    g.strokeStyle = "rgba(20,25,30,0.4)";
    g.lineWidth = 3;
    g.strokeRect(win[0] * W, win[1] * H, win[2] * W, win[3] * H);

    if (kind === "main") {
      // sables completos (bolsillos)
      for (let i = 0; i < 5; i++) {
        const y = H * (0.14 + i * 0.155);
        g.fillStyle = "rgba(255,255,255,0.7)";
        g.fillRect(0, y - 9, W, 18);
        g.fillStyle = "#0b1a2e";
        g.fillRect(W * 0.02, y - 4, W * 0.98, 8);
      }
      // panel de cabeza con el logo de clase
      g.fillStyle = "#0b1a2e";
      g.fillRect(0, 0, W, 22);
      g.font = "italic 900 118px Georgia, serif";
      g.textAlign = "center";
      g.fillStyle = "#d4202a";
      g.fillText("29er", W * 0.52, H * 0.11);
      // bandera y número de vela
      g.fillStyle = "#5fb4e6";
      g.fillRect(W * 0.2, H * 0.335, W * 0.7, 84);
      g.fillStyle = "#ffffff";
      g.fillRect(W * 0.2, H * 0.335 + 28, W * 0.7, 28);
      g.fillStyle = "#faaf40";
      g.beginPath();
      g.arc(W * 0.55, H * 0.335 + 42, 10, 0, Math.PI * 2);
      g.fill();
      g.font = "900 92px Arial, sans-serif";
      g.fillStyle = "#0b1a2e";
      g.fillText("ARG", W * 0.55, H * 0.535);
      g.fillText("2900", W * 0.55, H * 0.68);
    } else {
      // sables cortos en la baluma
      g.fillStyle = "#0b1a2e";
      for (let i = 0; i < 3; i++) g.fillRect(W * 0.72, H * (0.25 + i * 0.2) - 3, W * 0.28, 6);
    }
    // relingas de grátil, baluma y pujamen
    g.fillStyle = "rgba(11,26,46,0.55)";
    g.fillRect(0, 0, 10, H);
    g.fillRect(W - 6, 0, 6, H);
    g.fillRect(0, H - 10, W, 10);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

type SailOpts = {
  camber: number; // profundidad máxima / cuerda
  draft?: number; // posición de la máxima profundidad (0 grátil → 1 baluma)
  twist?: number; // apertura de la baluma hacia la cabeza
  luffRound?: number; // curva del grátil hacia afuera (m)
  roach?: number; // alunamiento de la baluma (m)
  footRound?: number; // curva del pujamen hacia abajo (m)
  headWidth?: number; // cabeza cuadrada (m)
  cols?: number;
  rows?: number;
};

/** Superficie de vela entre tres esquinas, con bolsa (camber) hacia +X local. */
function sailSurface(tack: THREE.Vector3, head: THREE.Vector3, clew: THREE.Vector3, opts: SailOpts, sign = 1) {
  const cols = opts.cols ?? 14;
  const rows = opts.rows ?? 22;
  const positions: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const headClew = opts.headWidth ? head.clone().add(clew.clone().sub(tack).setY(0).normalize().multiplyScalar(opts.headWidth)) : head;
  // perpendicular a un borde, en el plano de la vela, apuntando hacia afuera
  const normal = head.clone().sub(tack).cross(clew.clone().sub(tack)).normalize();
  const centroid = tack.clone().add(head).add(clew).divideScalar(3);
  const outward = (a: THREE.Vector3, b: THREE.Vector3) => {
    const n = normal.clone().cross(b.clone().sub(a)).normalize();
    return n.dot(centroid.clone().sub(a)) > 0 ? n.negate() : n;
  };
  const luffOut = outward(tack, head);
  const leechOut = outward(clew, headClew);
  const footOut = outward(tack, clew);
  const k = Math.log(0.5) / Math.log(opts.draft ?? 0.4);
  const L = new THREE.Vector3(), R = new THREE.Vector3(), p = new THREE.Vector3();
  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    L.lerpVectors(tack, head, v).addScaledVector(luffOut, (opts.luffRound ?? 0) * Math.sin(Math.PI * v));
    R.lerpVectors(clew, headClew, v).addScaledVector(leechOut, (opts.roach ?? 0) * Math.sin(Math.PI * v));
    const chord = L.distanceTo(R);
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      p.lerpVectors(L, R, u).addScaledVector(footOut, (opts.footRound ?? 0) * Math.sin(Math.PI * u) * (1 - v) ** 2);
      const depth = opts.camber * chord * Math.sin(Math.PI * Math.pow(u, k)) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(v * 1.1, 1)));
      const twist = (opts.twist ?? 0) * u * chord * Math.pow(v, 1.5);
      p.x += (depth + twist) * sign;
      positions.push(p.x, p.y, p.z);
      uvs.push(u, v);
    }
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + cols + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Vela legible de ambos lados y con la bolsa que cambia de banda al virar. */
function makeSail(
  tack: THREE.Vector3,
  head: THREE.Vector3,
  clew: THREE.Vector3,
  opts: SailOpts,
  front: THREE.Material,
  back: THREE.Material
) {
  const geos = { [1]: sailSurface(tack, head, clew, opts, 1), [-1]: sailSurface(tack, head, clew, opts, -1) } as Record<number, THREE.BufferGeometry>;
  const g = new THREE.Group();
  const a = new THREE.Mesh(geos[1], front);
  const b = new THREE.Mesh(geos[1], back);
  a.castShadow = true;
  g.add(a, b);
  let current = 1;
  return {
    group: g,
    setSide(side: number) {
      const s = side >= 0 ? 1 : -1;
      if (s === current) return;
      current = s;
      a.geometry = geos[s];
      b.geometry = geos[s];
    },
    dispose() {
      geos[1].dispose();
      geos[-1].dispose();
    },
  };
}

function sailMaterials(kind: "main" | "jib" | "spi") {
  const map = sailTexture(kind);
  const mapBack = map.clone();
  mapBack.wrapS = THREE.RepeatWrapping;
  mapBack.repeat.x = -1;
  mapBack.offset.x = 1;
  mapBack.needsUpdate = true;
  const base =
    kind === "spi"
      ? { roughness: 0.5, sheen: 0.7, sheenColor: new THREE.Color("#ffffff"), clearcoat: 0.3, clearcoatRoughness: 0.4 }
      : { roughness: 0.32, sheen: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.25, transparent: true, opacity: 0.94 };
  return [
    new THREE.MeshPhysicalMaterial({ ...base, map, side: THREE.FrontSide }),
    new THREE.MeshPhysicalMaterial({ ...base, map: mapBack, side: THREE.BackSide }),
  ] as const;
}

/** Rayas verticales tipo camiseta de la selección. */
function stripesTexture(a: string, b: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 8;
  const x = c.getContext("2d")!;
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? b : a;
    x.fillRect(i * 16, 0, 16, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type FigureOpts = {
  legs: string;
  sleeves: string;
  /** chaleco salvavidas encima de la camiseta */
  vest?: string;
  headwear: { kind: "cap"; color: string } | { kind: "hair"; color: string };
  glasses?: boolean;
};

/**
 * Muñeco estilo Playmobil (≈1,5 m). Origen en la cadera, mirando a -Z.
 * Articulaciones: piernas (cadera), torso (cintura), brazos (hombros), como el juguete.
 */
function playmobil(o: FigureOpts) {
  const plastic = (color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3, ...extra });
  const skin = plastic("#f3c9a1");
  const ink = plastic("#121417", { roughness: 0.3 });
  const pants = plastic(o.legs);
  const sleeve = plastic(o.sleeves);
  const jersey = plastic("#ffffff", { map: stripesTexture("#26a9e0", "#ffffff") });
  const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  const root = new THREE.Group();

  // ── piernas en bloque (rotan juntas en la cadera) ──
  const legs = new THREE.Group();
  root.add(legs);
  const hip = box(0.34, 0.13, 0.2, pants);
  hip.position.y = -0.03;
  legs.add(hip);
  for (const sd of [1, -1]) {
    const leg = box(0.155, 0.54, 0.175, pants);
    leg.position.set(sd * 0.085, -0.36, 0);
    const foot = box(0.155, 0.08, 0.25, ink);
    foot.position.set(sd * 0.085, -0.64, -0.035);
    legs.add(leg, foot);
  }

  // ── torso trapezoidal ──
  const torso = new THREE.Group();
  root.add(torso);
  const bodyGeo = new THREE.CylinderGeometry(0.215, 0.245, 0.48, 4, 1);
  bodyGeo.rotateY(Math.PI / 4);
  bodyGeo.scale(1, 1, 0.58);
  const body = new THREE.Mesh(bodyGeo, jersey);
  body.position.y = 0.27;
  torso.add(body);
  if (o.vest) {
    const vestGeo = new THREE.CylinderGeometry(0.228, 0.25, 0.27, 4, 1);
    vestGeo.rotateY(Math.PI / 4);
    vestGeo.scale(1, 1, 0.64);
    const vest = new THREE.Mesh(vestGeo, plastic(o.vest, { roughness: 0.6, clearcoat: 0.2 }));
    vest.position.y = 0.35;
    torso.add(vest);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), skin);
  neck.position.y = 0.53;
  torso.add(neck);

  // ── cabeza: cilindro redondeado con cara simple ──
  const head = new THREE.Group();
  head.position.y = 0.55;
  torso.add(head);
  const skull = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.09, 6, 20), skin);
  skull.position.y = 0.2;
  head.add(skull);
  if (o.glasses) {
    const glasses = box(0.25, 0.055, 0.04, ink);
    glasses.position.set(0, 0.235, -0.14);
    head.add(glasses);
  } else {
    for (const sd of [1, -1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), ink);
      eye.position.set(sd * 0.055, 0.235, -0.148);
      head.add(eye);
    }
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.009, 6, 16, Math.PI), ink);
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.175, -0.147);
  head.add(smile);
  const hw = plastic(o.headwear.color, { roughness: 0.5 });
  if (o.headwear.kind === "cap") {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.168, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), hw);
    crown.position.y = 0.27;
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.018, 20, 1, false, Math.PI / 2, Math.PI), hw);
    visor.position.set(0, 0.275, -0.1);
    head.add(crown, visor);
  } else {
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.175, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hw);
    top.position.y = 0.25;
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.17, 22, 1, true, -Math.PI / 2, Math.PI), hw);
    back.material.side = THREE.DoubleSide;
    back.position.y = 0.17;
    head.add(top, back);
  }

  // ── brazos con mano en C ──
  const arms: THREE.Group[] = [];
  const hands: THREE.Object3D[] = [];
  for (const sd of [1, -1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sd * 0.215, 0.45, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.34, 12), sleeve);
    arm.position.y = -0.17;
    const hand = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.019, 8, 14, Math.PI * 1.5), skin);
    hand.position.y = -0.38;
    hand.rotation.y = Math.PI / 2;
    shoulder.add(arm, hand);
    torso.add(shoulder);
    arms.push(shoulder);
    hands.push(hand);
  }

  root.traverse((m) => ((m as THREE.Mesh).castShadow = true));
  return { root, legs, torso, head, arms, hands };
}

/** Largo cadera → suela de la figura. */
const LEG = 0.68;

/** Cabo recto cuyo extremo se puede mover cada cuadro. */
function line(a: THREE.Vector3, b: THREE.Vector3, mat: THREE.LineBasicMaterial) {
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mat);
  l.frustumCulled = false;
  return {
    object: l,
    set(from: THREE.Vector3, to: THREE.Vector3) {
      const p = l.geometry.attributes.position as THREE.BufferAttribute;
      p.setXYZ(0, from.x, from.y, from.z);
      p.setXYZ(1, to.x, to.y, to.z);
      p.needsUpdate = true;
    },
  };
}

export type Boat29er = ReturnType<typeof create29er>;

export function create29er() {
  const root = new THREE.Group(); // posición + rumbo
  const motion = new THREE.Group(); // cabeceo / escora
  root.add(motion);

  const hull = makeHull();
  hull.castShadow = true;
  motion.add(hull);

  const alu = new THREE.MeshStandardMaterial({ color: "#c3c9d0", metalness: 0.85, roughness: 0.3 });
  const carbon = new THREE.MeshStandardMaterial({ color: "#1a1d22", metalness: 0.3, roughness: 0.35 });
  const blackFoil = new THREE.MeshPhysicalMaterial({ color: "#0d0f12", roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
  const net = new THREE.MeshStandardMaterial({ color: "#20262e", roughness: 0.9, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: "#0b1a2e", roughness: 0.6 });

  // Alas (racks) a cada banda — llevan la manga a 1,77 m
  for (const side of [1, -1]) {
    const z0 = -0.55, z1 = 1.35, xo = 0.885 * side, y = 0.24;
    motion.add(tube(new THREE.Vector3(xo, y, z0), new THREE.Vector3(xo, y, z1), 0.022, alu));
    motion.add(tube(new THREE.Vector3(0.5 * side, y - 0.02, z0 - 0.15), new THREE.Vector3(xo, y, z0), 0.02, alu));
    motion.add(tube(new THREE.Vector3(0.55 * side, y - 0.02, z1 + 0.1), new THREE.Vector3(xo, y, z1), 0.02, alu));
    motion.add(tube(new THREE.Vector3(0.58 * side, 0.12, 0.4), new THREE.Vector3(xo, y, 0.4), 0.018, alu));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(xo) - 0.5, z1 - z0), net);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((Math.abs(xo) + 0.5) * 0.5 * side, y - 0.01, (z0 + z1) / 2);
    motion.add(mesh);
    // cinchas de pie en el piso de la bañera
    motion.add(tube(new THREE.Vector3(0.18 * side, 0.2, 0.2), new THREE.Vector3(0.18 * side, 0.2, 1.4), 0.012, dark));
  }

  // Orza (perfil NACA, con algo de flecha) y timón colgado del espejo
  const board = foil(0.34, 0.26, 1.05, 0.11, 0.06, blackFoil);
  board.position.set(0, -0.12, -0.12);
  motion.add(board);
  const rudderHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.16), carbon);
  rudderHead.position.set(0, 0.12, STERN_Z + 0.1);
  motion.add(rudderHead);
  const rudder = foil(0.24, 0.18, 0.92, 0.12, 0.04, blackFoil);
  rudder.position.set(0, -0.02, STERN_Z + 0.12);
  motion.add(rudder);
  const tiller = tube(new THREE.Vector3(0, 0.27, STERN_Z + 0.1), new THREE.Vector3(0, 0.3, 1.2), 0.016, carbon);
  motion.add(tiller);

  // Boca del tubo del asimétrico en la proa
  const chute = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 18), carbon);
  chute.position.set(0, 0.24, BOW_Z + 0.42);
  chute.rotation.x = -0.5;
  motion.add(chute);

  // Mástil: tramo bajo de aluminio y tope de carbono, con curva hacia popa
  const mastBase = sheerY(0.36);
  const mastAt = (h: number) => new THREE.Vector3(0, mastBase + h, MAST_Z + mastZ(h));
  const mastGroup = new THREE.Group();
  mastGroup.position.set(0, mastBase, MAST_Z);
  mastGroup.add(mastSection(0, 3.4, 0.034, 0.03, alu), mastSection(3.4, MAST_H, 0.03, 0.018, carbon));
  motion.add(mastGroup);

  // Jarcia: estay, obenques por las crucetas y crucetas
  const wire = new THREE.LineBasicMaterial({ color: "#2a3038", transparent: true, opacity: 0.85 });
  const hounds = mastAt(4.6);
  const spreaderH = 2.7;
  const rig: THREE.Vector3[][] = [[hounds, new THREE.Vector3(0, 0.3, BOW_Z + 0.1)]];
  for (const side of [1, -1]) {
    const tip = mastAt(spreaderH).add(new THREE.Vector3(0.36 * side, 0, 0.14));
    motion.add(tube(mastAt(spreaderH), tip, 0.011, carbon));
    rig.push([hounds, tip, new THREE.Vector3(0.58 * side, 0.26, MAST_Z + 0.15)]);
  }
  for (const pts of rig) motion.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));

  // Mayor + botavara (pivotan en el mástil)
  const boomPivot = new THREE.Group();
  boomPivot.position.set(0, mastBase, MAST_Z);
  motion.add(boomPivot);
  const boom = tube(new THREE.Vector3(0, 0.82, 0.02), new THREE.Vector3(0, 0.82, 2.05), 0.028, alu);
  boomPivot.add(boom);
  // contra (vang) de la botavara al pie del mástil
  boomPivot.add(tube(new THREE.Vector3(0, 0.8, 0.6), new THREE.Vector3(0, 0.12, 0.05), 0.01, carbon));
  const mainHeadH = MAST_H - 0.12;
  const mainTack = new THREE.Vector3(0, 0.86, 0.05);
  const main = makeSail(mainTack, new THREE.Vector3(0, mainHeadH, 0.05 + mastZ(mainHeadH)), new THREE.Vector3(0, 0.86, 2.02), {
    camber: 0.08,
    draft: 0.42,
    twist: 0.2,
    // el grátil acompaña la curva del mástil
    luffRound: (MAST_BEND * ((mainHeadH - 0.86) / MAST_H) ** 2) / 4,
    roach: 0.38,
    headWidth: 0.62,
    cols: 16,
    rows: 28,
  }, ...sailMaterials("main"));
  boomPivot.add(main.group);

  // Foque autovirante (pivota cerca de la amura)
  const jibPivot = new THREE.Group();
  jibPivot.position.set(0, 0.3, BOW_Z + 0.25);
  motion.add(jibPivot);
  const jib = makeSail(new THREE.Vector3(0, 0.05, -0.12), new THREE.Vector3(0, mastBase + 4.35, MAST_Z - (BOW_Z + 0.25) - 0.04), new THREE.Vector3(0, 0.16, 1.38), {
    camber: 0.1,
    draft: 0.38,
    twist: 0.14,
    roach: 0.08,
    headWidth: 0.05,
  }, ...sailMaterials("jib"));
  jibPivot.add(jib.group);

  // Botalón + asimétrico
  const spiGroup = new THREE.Group();
  motion.add(spiGroup);
  const spritEnd = new THREE.Vector3(0, 0.36, BOW_Z - 1.05);
  const sprit = tube(new THREE.Vector3(0, 0.3, BOW_Z + 0.42), spritEnd, 0.022, carbon);
  spiGroup.add(sprit);
  const spiPivot = new THREE.Group();
  spiPivot.position.copy(spritEnd);
  spiGroup.add(spiPivot);
  const spiHead = mastAt(4.95).sub(spritEnd);
  const spiClew = new THREE.Vector3(0, 0.55, 4.4);
  const spi = makeSail(new THREE.Vector3(0, 0, 0), spiHead, spiClew, {
    camber: 0.36,
    draft: 0.45,
    twist: 0.08,
    luffRound: 0.85,
    roach: 0.7,
    footRound: 0.18,
    cols: 22,
    rows: 30,
  }, ...sailMaterials("spi"));
  spiPivot.add(spi.group);
  // escota del asimétrico: puño de escota → aleta de sotavento
  const spiSheet = line(new THREE.Vector3(), new THREE.Vector3(), wire);
  spiGroup.add(spiSheet.object);

  // escota de mayor: centro de la botavara → piso de la bañera
  const mainSheet = line(new THREE.Vector3(), new THREE.Vector3(), wire);
  motion.add(mainSheet.object);

  // Tripulación estilo Playmobil (crewSide se espeja con la amura: +X = banda de barlovento)
  const crewSide = new THREE.Group();
  motion.add(crewSide);

  // Timonel: sentado en el ala mirando hacia adentro, colgado hacia afuera, mano de popa en el stick
  const helm = playmobil({ legs: "#1b2230", sleeves: "#26a9e0", vest: "#14181f", headwear: { kind: "cap", color: "#5b6470" }, glasses: true });
  const HELM_SEAT = new THREE.Vector3(0.87, 0.34, 1.05);
  helm.root.position.copy(HELM_SEAT);
  helm.root.rotation.y = Math.PI / 2; // mira a -X (hacia el centro del barco)
  helm.legs.rotation.x = 1.3; // piernas adentro del barco, bajo las cinchas
  helm.torso.rotation.x = 0.85; // espalda hacia el agua
  // (el torso ya va inclinado hacia atrás: los brazos se adelantan poco para quedar casi horizontales)
  helm.arms[1].rotation.set(0.5, 0, -0.3); // mano de popa: stick
  helm.arms[0].rotation.set(0.65, 0, 0.12); // mano de proa: escota de mayor
  crewSide.add(helm.root);

  // Proel: colgado del trapecio, cuerpo casi horizontal con los pies en el canto del ala
  const crew = playmobil({ legs: "#11161d", sleeves: "#ffffff", headwear: { kind: "hair", color: "#3a2416" } });
  const TRAP_FEET = new THREE.Vector3(0.93, 0.27, 0.05);
  const trapPhi = 0.14; // apenas por encima de la horizontal
  crew.root.rotation.order = "ZYX";
  crew.root.rotation.set(0, 0.85, -(Math.PI / 2 - trapPhi)); // pecho hacia arriba y adelante
  crew.root.position.set(TRAP_FEET.x + Math.cos(trapPhi) * LEG, TRAP_FEET.y + Math.sin(trapPhi) * LEG, TRAP_FEET.z);
  crew.arms[1].rotation.set(0.8, 0, -0.15); // mano en la manija del trapecio (hacia el cable)
  crew.arms[0].rotation.set(1.3, 0, 0.5); // escota del foque (hacia proa)
  crewSide.add(crew.root);
  // arnés: cinturón oscuro
  const harness = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 4, 1), new THREE.MeshStandardMaterial({ color: "#0d0f12", roughness: 0.7 }));
  harness.geometry.rotateY(Math.PI / 4);
  harness.geometry.scale(1.05, 1, 0.62);
  harness.position.y = 0.06;
  crew.torso.add(harness);
  const hook = crew.root.position.clone().add(new THREE.Vector3(0, 0.1, -0.06));
  const trapWire = new THREE.Line(new THREE.BufferGeometry().setFromPoints([mastAt(4.5), hook]), wire);
  crewSide.add(trapWire);
  // alargue del stick: punta de la caña → mano del timonel (se actualiza con la pose)
  const extension = line(new THREE.Vector3(0, 0.3, 1.2), new THREE.Vector3(0, 0.3, 1.2), new THREE.LineBasicMaterial({ color: "#15181c" }));
  crewSide.add(extension.object);
  const handTmp = new THREE.Vector3();

  // estado de trimado
  const state = { tack: 1, boom: 0.25, spi: 0, spiTarget: 0 };
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  return {
    root,
    motion,
    /**
     * Ajusta velas y tripulación según el ángulo al viento aparente.
     * twa: ángulo con signo en radianes (+ viento por estribor).
     */
    trim(twa: number, dt: number) {
      const tack = twa >= 0 ? 1 : -1;
      const a = Math.abs(twa);
      // cambio de banda suave
      state.tack += (tack - state.tack) * Math.min(1, dt * 3.5);
      const side = state.tack >= 0 ? 1 : -1;

      state.spiTarget = a > 1.75 ? 1 : a < 1.6 ? 0 : state.spiTarget;
      state.spi += (state.spiTarget - state.spi) * Math.min(1, dt * 1.8);
      const sv = THREE.MathUtils.smoothstep(state.spi, 0, 1);

      // con el asimétrico arriba la mayor no se abre tanto (va por dentro del spi)
      const boomMax = THREE.MathUtils.lerp(1.25, 0.6, sv);
      const boomTarget = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(a, 0.6, Math.PI, 0.12, 1.25), 0.08, boomMax);
      state.boom += (boomTarget - state.boom) * Math.min(1, dt * 2.5);
      boomPivot.rotation.y = -state.tack * state.boom;
      main.setSide(-side);
      jibPivot.rotation.y = -state.tack * Math.min(state.boom * 0.6, 0.4);
      jib.setSide(-side);

      spiGroup.visible = sv > 0.01;
      spi.setSide(-side);
      spiPivot.scale.set(1, Math.max(sv, 0.01), Math.max(sv, 0.01));
      spiPivot.rotation.y = -state.tack * THREE.MathUtils.mapLinear(Math.min(a, Math.PI), 1.6, Math.PI, 0.32, 0.62);
      crewSide.scale.x = state.tack;
      // con el asimétrico el timonel se mete adentro y se endereza
      helm.torso.rotation.x = 0.85 - sv * 0.6;
      helm.root.position.x = HELM_SEAT.x - sv * 0.25;
      helm.hands[1].getWorldPosition(handTmp);
      crewSide.worldToLocal(handTmp);
      extension.set(tmp2.set(0, 0.3, 1.2), handTmp);

      // cabos que siguen a las velas
      tmp.set(0, 0.82, 1.15).applyAxisAngle(up, boomPivot.rotation.y).add(boomPivot.position);
      mainSheet.set(tmp, tmp2.set(0, 0.2, MAST_Z + 1.75));
      if (spiGroup.visible) {
        tmp.copy(spiClew).multiply(spiPivot.scale).applyAxisAngle(up, spiPivot.rotation.y).add(spiPivot.position);
        spiSheet.set(tmp, tmp2.set(-0.55 * side, 0.3, STERN_Z - 0.35));
      }
      return sv;
    },
    get spinnaker() {
      return state.spi;
    },
    /** +1 viento por estribor (tripulación a estribor), -1 por babor */
    get tack() {
      return state.tack;
    },
    dispose() {
      main.dispose();
      jib.dispose();
      spi.dispose();
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) {
          (mat as THREE.MeshStandardMaterial).map?.dispose();
          mat.dispose();
        }
      });
    },
  };
}

/** Aplica la flotación: altura, cabeceo y escora siguiendo las olas. */
export function float29er(
  boat: Boat29er,
  heightAt: (x: number, z: number) => number,
  heading: number,
  heel: number,
  dt: number,
  planing = 0
) {
  const p = boat.root.position;
  const fx = -Math.sin(heading), fz = -Math.cos(heading);
  const rx = Math.cos(heading), rz = -Math.sin(heading);
  const bow = heightAt(p.x + fx * 1.8, p.z + fz * 1.8);
  const stern = heightAt(p.x - fx * 1.8, p.z - fz * 1.8);
  const port = heightAt(p.x - rx * 0.8, p.z - rz * 0.8);
  const stbd = heightAt(p.x + rx * 0.8, p.z + rz * 0.8);
  const y = (bow + stern + port + stbd) / 4 + 0.02 + planing * 0.06;
  const k = Math.min(1, dt * 6);
  p.y += (y - p.y) * k;
  boat.root.rotation.y = heading;
  const pitch = Math.atan2(bow - stern, 3.6) - planing * 0.03;
  // escora hacia sotavento (lado opuesto a la tripulación)
  const roll = Math.atan2(stbd - port, 1.6) * 0.6 + heel * boat.tack;
  boat.motion.rotation.x += (pitch - boat.motion.rotation.x) * k;
  boat.motion.rotation.z += (roll - boat.motion.rotation.z) * k;
}
