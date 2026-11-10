import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Collider } from "./monaco";

/**
 * Piezas compartidas por las costas "reales" (Mar del Plata y Buenos Aires):
 * costa como polilínea con tierra hacia -X, edificios con pisos y ventanas,
 * escolleras de piedra, y el límite navegable.
 *
 * Polilínea de costa: puntos [z, x] ordenados por z (de norte a sur), x = línea de agua.
 */

export type ShorePts = [z: number, x: number][];

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const std = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });

export function box(w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

/** Caja alineada con el segmento a→b (en XZ), apoyada en y. */
export function segBox(a: [number, number], b: [number, number], width: number, h: number, m: THREE.Material, y: number) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, h, len), m);
  mesh.position.set((a[0] + b[0]) / 2, y + h / 2, (a[1] + b[1]) / 2);
  mesh.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
  return mesh;
}

/** x de la línea de agua para un z dado. */
export function shoreAt(pts: ShorePts, z: number) {
  if (z <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (z <= pts[i][0]) {
      const [z0, x0] = pts[i - 1];
      const [z1, x1] = pts[i];
      return x0 + ((x1 - x0) * (z - z0)) / (z1 - z0);
    }
  }
  return pts[pts.length - 1][1];
}

/** Límite navegable: empuja el barco hacia el agua si se mete en la costa. */
export function shoreClamp(pts: ShorePts, margin: number) {
  return (x: number, z: number): [number, number] | null => {
    const limit = shoreAt(pts, z) + margin;
    return x < limit ? [limit, z] : null;
  };
}

/**
 * Losa de tierra: desde la costa (desplazada `inset` m tierra adentro) hasta `farX`,
 * con su cara frontal visible (muralla, barranca) de alto `h` sobre `y`.
 */
export function landSlab(pts: ShorePts, inset: (z: number) => number, farX: number, y: number, h: number, m: THREE.Material, step = 20) {
  const s = new THREE.Shape();
  const z0 = pts[0][0], z1 = pts[pts.length - 1][0];
  // forma en (x, -z): al extruir y rotar queda en el plano XZ del mundo
  s.moveTo(farX, -z0);
  for (let z = z0; z <= z1; z += step) s.lineTo(shoreAt(pts, z) - inset(z), -z);
  s.lineTo(shoreAt(pts, z1) - inset(z1), -z1);
  s.lineTo(farX, -z1);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.y = y;
  mesh.receiveShadow = true;
  return mesh;
}

/** Franja paralela a la costa entre `a(z)` y `b(z)` m tierra adentro (calle, vereda, baranda). */
export function shoreStrip(pts: ShorePts, a: (z: number) => number, b: (z: number) => number, z0: number, z1: number, y: number, h: number, m: THREE.Material, step = 15) {
  const s = new THREE.Shape();
  const zs: number[] = [];
  for (let z = z0; z < z1; z += step) zs.push(z);
  zs.push(z1);
  s.moveTo(shoreAt(pts, z0) - a(z0), -z0);
  for (const z of zs) s.lineTo(shoreAt(pts, z) - a(z), -z);
  for (const z of [...zs].reverse()) s.lineTo(shoreAt(pts, z) - b(z), -z);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(g, m);
  mesh.position.y = y;
  return mesh;
}

/* ───────────── Fachadas ───────────── */

export type FacadeKind = "apartment" | "glass" | "office";

const texCache = new Map<FacadeKind, THREE.Texture>();

/** Un piso por tile (vertical) y un módulo de ventana por tile (horizontal). Pared blanca: la tiñe el color del edificio. */
function facadeTexture(kind: FacadeKind) {
  const cached = texCache.get(kind);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  if (kind === "apartment") {
    // losa de balcón clara, vidrio retirado y oscuro, columnas cada tanto
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, 64, 64);
    x.fillStyle = "#4a5866";
    x.fillRect(4, 14, 56, 34);
    x.fillStyle = "#6f8090";
    x.fillRect(4, 14, 56, 6);
    x.fillStyle = "#e4e4e4";
    x.fillRect(0, 48, 64, 6); // baranda
    x.fillStyle = "#ffffff";
    x.fillRect(30, 14, 4, 34);
  } else if (kind === "glass") {
    // muro cortina: vidrio azulado con montantes finos
    const grd = x.createLinearGradient(0, 0, 64, 64);
    grd.addColorStop(0, "#9fb6c8");
    grd.addColorStop(1, "#5f7d96");
    x.fillStyle = grd;
    x.fillRect(0, 0, 64, 64);
    x.fillStyle = "#dfe7ee";
    x.fillRect(0, 0, 64, 3);
    x.fillRect(0, 0, 2, 64);
    x.fillRect(32, 0, 1, 64);
  } else {
    // oficina/hotel: ventanas rectangulares en muro macizo
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, 64, 64);
    x.fillStyle = "#3f4c58";
    x.fillRect(10, 16, 18, 30);
    x.fillRect(36, 16, 18, 30);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(kind, t);
  return t;
}

export type Building = {
  x: number;
  z: number;
  y?: number;
  w: number;
  d: number;
  h: number;
  color: string;
  /** Rotación en Y (rad). */
  yaw?: number;
  /** Alto de piso y ancho de módulo (m). */
  floor?: number;
  bay?: number;
};

/**
 * Todos los edificios de un tipo de fachada en una sola malla.
 * Se tiñen hacia la bruma según la distancia al centro de la cancha (perspectiva aérea).
 */
export function buildings(list: Building[], kind: FacadeKind, haze: THREE.Color, hazeK = 0.5) {
  const geos: THREE.BufferGeometry[] = [];
  const col = new THREE.Color();
  for (const b of list) {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const floor = b.floor ?? 3;
    const bay = b.bay ?? 3.5;
    // caras: +x, -x, +y, -y, +z, -z (4 vértices cada una)
    for (let f = 0; f < 6; f++) {
      const width = f < 2 ? b.d : b.w;
      for (let v = f * 4; v < f * 4 + 4; v++) {
        if (f === 2 || f === 3) uv.setXY(v, 0.5, 0.97); // techo/piso: color de pared
        else uv.setXY(v, uv.getX(v) * Math.max(1, Math.round(width / bay)), uv.getY(v) * Math.max(1, Math.round(b.h / floor)));
      }
    }
    if (b.yaw) g.rotateY(b.yaw);
    g.translate(b.x, (b.y ?? 0) + b.h / 2, b.z);
    const dist = Math.hypot(b.x, b.z + 100);
    col.set(b.color).lerp(haze, THREE.MathUtils.clamp((dist - 350) / 1500, 0, 1) * hazeK);
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) col.toArray(colors, i);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geos.push(g);
  }
  const merged = mergeGeometries(geos)!;
  geos.forEach((g) => g.dispose());
  const mat = new THREE.MeshStandardMaterial({
    map: facadeTexture(kind),
    vertexColors: true,
    roughness: kind === "glass" ? 0.25 : 0.85,
    metalness: kind === "glass" ? 0.35 : 0,
    emissive: haze.clone().multiplyScalar(0.04),
  });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.frustumCulled = false;
  return mesh;
}

/* ───────────── Piedras, escolleras, árboles ───────────── */

/** Piedras sueltas a lo largo de una polilínea (en XZ). */
export function rockLine(path: [number, number][], width: number, rand: () => number, color = "#7d7a74", size = 3.2, spacing = 2.6) {
  const pts: { x: number; z: number; s: number }[] = [];
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i];
    const len = Math.hypot(bx - ax, bz - az);
    const nx = -(bz - az) / len, nz = (bx - ax) / len;
    for (let d = 0; d < len; d += spacing) {
      const k = d / len;
      const off = (rand() - 0.5) * width;
      pts.push({ x: ax + (bx - ax) * k + nx * off, z: az + (bz - az) * k + nz * off, s: size * (0.6 + rand() * 0.7) });
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), std(color, { roughness: 0.95, flatShading: true }), pts.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const c = new THREE.Color();
  const base = new THREE.Color(color);
  pts.forEach((p, i) => {
    q.setFromEuler(e.set(rand() * 3, rand() * 3, rand() * 3));
    m.compose(new THREE.Vector3(p.x, p.s * 0.15 - 0.4, p.z), q, new THREE.Vector3(p.s, p.s * 0.7, p.s * 0.9));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.copy(base).offsetHSL(0, 0, (rand() - 0.5) * 0.12));
  });
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  return mesh;
}

/** Círculos de choque a lo largo de una polilínea, todos del mismo grupo de contacto. */
export function lineColliders(path: [number, number][], r: number, group: number): Collider[] {
  const out: Collider[] = [];
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1];
    const [bx, bz] = path[i];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / (r * 1.2)));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) out.push({ x: ax + ((bx - ax) * k) / n, z: az + ((bz - az) * k) / n, r, group });
  }
  return out;
}

export function trees(list: { x: number; z: number; y?: number; s: number }[], rand: () => number, haze: THREE.Color, color = "#4f7a3a") {
  const g = new THREE.Group();
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std(color, { roughness: 0.9, flatShading: true }), list.length);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 1, 6), std("#5a4632"), list.length);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  const base = new THREE.Color(color);
  list.forEach((t, i) => {
    const y = t.y ?? 0;
    m.compose(new THREE.Vector3(t.x, y + t.s * 1.5, t.z), new THREE.Quaternion(), new THREE.Vector3(t.s, t.s * 0.85, t.s));
    crown.setMatrixAt(i, m);
    const dist = Math.hypot(t.x, t.z + 100);
    crown.setColorAt(i, c.copy(base).offsetHSL((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.08).lerp(haze, THREE.MathUtils.clamp((dist - 350) / 1500, 0, 0.6)));
    m.compose(new THREE.Vector3(t.x, y + t.s * 0.5, t.z), new THREE.Quaternion(), new THREE.Vector3(t.s * 0.4, t.s, t.s * 0.4));
    trunk.setMatrixAt(i, m);
  });
  crown.frustumCulled = trunk.frustumCulled = false;
  g.add(crown, trunk);
  return g;
}

/** Instancias de una misma geometría con colores (sombrillas, carpas, contenedores, gente…). */
export function scatter(geo: THREE.BufferGeometry, items: { x: number; y: number; z: number; c: string; sx?: number; sy?: number; sz?: number; yaw?: number }[], extra: THREE.MeshStandardMaterialParameters = {}) {
  const mesh = new THREE.InstancedMesh(geo, std("#ffffff", extra), items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  items.forEach((it, i) => {
    q.setFromAxisAngle(up, it.yaw ?? 0);
    m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.set(it.c));
  });
  mesh.frustumCulled = false;
  return mesh;
}

/** Barco simple de trabajo (pesquero, lancha): casco, cabina y mástil. Proa hacia -Z. */
export function workBoat(len: number, hull: string, cabin = "#f4f4f2", trim = "#c8102e") {
  const g = new THREE.Group();
  const beam = len * 0.3;
  const s = new THREE.Shape();
  s.moveTo(-beam / 2, -len / 2);
  s.lineTo(beam / 2, -len / 2);
  s.lineTo(beam / 2, len * 0.15);
  s.quadraticCurveTo(beam / 2, len * 0.42, 0, len / 2);
  s.quadraticCurveTo(-beam / 2, len * 0.42, -beam / 2, len * 0.15);
  s.closePath();
  const hg = new THREE.ExtrudeGeometry(s, { depth: len * 0.16, bevelEnabled: false, curveSegments: 5 });
  hg.rotateX(-Math.PI / 2);
  const h = new THREE.Mesh(hg, std(hull, { roughness: 0.5 }));
  h.position.y = -len * 0.06;
  g.add(h);
  const rim = new THREE.Mesh(hg, std(trim, { roughness: 0.5 }));
  rim.scale.set(1.02, 0.12, 1.01);
  rim.position.y = len * 0.085;
  g.add(rim);
  g.add(box(beam * 0.7, len * 0.14, len * 0.22, std(cabin), 0, len * 0.1, len * 0.02));
  g.add(box(beam * 0.74, len * 0.02, len * 0.25, std(trim), 0, len * 0.24, len * 0.02));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, len * 0.45, 6), std("#d9d9d9"));
  mast.position.set(0, len * 0.32, -len * 0.12);
  g.add(mast);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

/** Buque mercante fondeado o amarrado: casco largo, superestructura a popa, carga en cubierta. Proa hacia -Z. */
export function cargoShip(len: number, hull: string, rand: () => number, cargo: "containers" | "bulk") {
  const g = new THREE.Group();
  const beam = len * 0.15;
  const fb = len * 0.06; // francobordo
  const s = new THREE.Shape();
  // forma en (x, -z): la proa en +Y de la forma queda hacia -Z del mundo
  s.moveTo(-beam / 2, -len / 2);
  s.lineTo(beam / 2, -len / 2);
  s.lineTo(beam / 2, len * 0.32);
  s.quadraticCurveTo(beam / 2, len * 0.47, 0, len / 2);
  s.quadraticCurveTo(-beam / 2, len * 0.47, -beam / 2, len * 0.32);
  s.closePath();
  const hg = new THREE.ExtrudeGeometry(s, { depth: fb + 3, bevelEnabled: false, curveSegments: 6 });
  hg.rotateX(-Math.PI / 2);
  const hullMesh = new THREE.Mesh(hg, std(hull, { roughness: 0.6 }));
  hullMesh.position.y = -3;
  const boot = new THREE.Mesh(hg, std("#8b1e1e", { roughness: 0.7 }));
  boot.scale.set(1.01, 0.12, 1.005);
  boot.position.y = -0.6;
  g.add(hullMesh, boot);
  // superestructura blanca a popa con puente
  const sx = len * 0.38;
  g.add(box(beam * 0.9, fb * 2.4, len * 0.1, std("#f2f2f0"), 0, fb, sx));
  g.add(box(beam * 1.05, 1.2, len * 0.06, std("#f2f2f0"), 0, fb * 3.4, sx - len * 0.01));
  g.add(box(beam * 0.92, 1.1, len * 0.002 + 0.3, std("#1d2733", { roughness: 0.2, metalness: 0.5 }), 0, fb * 3.05, sx - len * 0.05));
  g.add(box(beam * 0.2, fb * 1.4, beam * 0.2, std(hull), 0, fb * 3.4, sx + len * 0.03)); // chimenea
  if (cargo === "containers") {
    const colors = ["#b3261e", "#1f5fa8", "#e0a526", "#2f7d4f", "#d9d9d9", "#7a3f99", "#e36a1d"];
    const items: { x: number; y: number; z: number; c: string }[] = [];
    for (let z = -len * 0.36; z < len * 0.3; z += 6.4) {
      const tiers = 2 + Math.floor(rand() * 4);
      for (let t = 0; t < tiers; t++)
        for (let x = -beam / 2 + 1.4; x < beam / 2 - 1.2; x += 2.5) items.push({ x, y: fb + 1.3 + t * 2.6, z, c: colors[Math.floor(rand() * colors.length)] });
    }
    g.add(scatter(new THREE.BoxGeometry(2.4, 2.55, 6.1), items, { roughness: 0.7 }));
  } else {
    // bodegas con tapas y grúas de a bordo
    for (let z = -len * 0.34; z < len * 0.28; z += len * 0.12) {
      g.add(box(beam * 0.7, 1.4, len * 0.08, std("#6d4a3a"), 0, fb, z));
      const crane = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, fb * 2.6, 8), std("#e8c547"));
      crane.position.set(beam * 0.3, fb + fb * 1.3, z + len * 0.06);
      g.add(crane);
    }
  }
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return g;
}

/** Tres círculos a lo largo de un casco con proa hacia `yaw` (rumbo 0 = -Z). */
export function hullColliders(x: number, z: number, len: number, yaw: number, beamK: number, group: number): Collider[] {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const n = Math.max(3, Math.round(len / 25));
  const out: Collider[] = [];
  for (let i = 0; i < n; i++) {
    const k = -0.42 + (0.84 * i) / (n - 1);
    out.push({ x: x + fx * len * k, z: z + fz * len * k, r: len * beamK, group });
  }
  return out;
}

/** Toma de cámara para la intro que muestra la costa. */
export type Showcase = { title: string; subtitle: string; pos: [number, number, number]; look: [number, number, number] };

/** Recorrido cerrado o abierto para animar algo a velocidad constante. */
export function pathSampler(path: [number, number][]) {
  const segs = path.slice(1).map((b, i) => ({ a: path[i], b, len: Math.hypot(b[0] - path[i][0], b[1] - path[i][1]) }));
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
      return { x: path[0][0], z: path[0][1], yaw: 0 };
    },
  };
}
