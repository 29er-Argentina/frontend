import * as THREE from "three";
import type { SkyPalette } from "./sky";
import { createMonacoHarbor, type Collider } from "./monaco";
import { createMarDelPlata } from "./mardelplata";
import { createBuenosAires } from "./buenosaires";
import { buildings, type Building, type Showcase } from "./coastkit";

/**
 * La costa de cada sede, navegable hasta la orilla:
 * Mar del Plata y Buenos Aires al oeste de la cancha (lib/three/mardelplata.ts, buenosaires.ts),
 * Mónaco al norte con el puerto y el circuito (lib/three/monaco.ts) delante de las montañas.
 */

export type CoastKind = "city" | "river" | "riviera";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Box = { x: number; z: number; y?: number; w: number; d: number; h: number; color: string };

function boxes(list: Box[], haze: THREE.Color, k: number) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ color: "#ffffff", emissive: haze.clone().multiplyScalar(0.35) });
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  list.forEach((b, i) => {
    m.compose(new THREE.Vector3(b.x, (b.y ?? -2) + b.h / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.set(b.color).lerp(haze, k));
  });
  mesh.frustumCulled = false;
  return mesh;
}

function peaks(list: { x: number; z: number; h: number; r: number }[], color: string, haze: THREE.Color, k: number, seed: number, depth = 0.55) {
  const g = new THREE.Group();
  const rand = rng(seed);
  const base = new THREE.Color(color);
  for (const p of list) {
    const col = base.clone().offsetHSL(0, 0, (rand() - 0.5) * 0.06).lerp(haze, k);
    const mat = new THREE.MeshLambertMaterial({ color: col, emissive: haze.clone().multiplyScalar(0.06) });
    // cúpula irregular (no cono): perfil redondeado con relieve, se lee como monte y no como pirámide
    const geo = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0.02) continue; // la base queda pegada al agua
      const j = 1 + (rand() - 0.5) * 0.08 * y;
      pos.setXYZ(i, pos.getX(i) * j, Math.pow(y, 0.8) * j, pos.getZ(i) * j);
    }
    geo.computeVertexNormals();
    const hill = new THREE.Mesh(geo, mat);
    hill.scale.set(p.r, p.h, p.r * depth);
    hill.position.set(p.x, -12, p.z);
    hill.rotation.y = (rand() - 0.5) * 0.4;
    hill.frustumCulled = false;
    g.add(hill);
  }
  return g;
}

function riviera(p: SkyPalette) {
  const haze = new THREE.Color(p.haze);
  const rand = rng(3);
  const g = new THREE.Group();
  // dos cordones de montaña: el de atrás más brumoso
  const back = Array.from({ length: 9 }, (_, i) => ({ x: -1050 + i * 260 + rand() * 60, z: -1230, h: 360 + rand() * 170, r: 300 + rand() * 80 }));
  const front = Array.from({ length: 11 }, (_, i) => ({
    x: -1000 + i * 200 + rand() * 60,
    z: -1110 - rand() * 40,
    h: 160 + rand() * 150 + (i === 3 ? 110 : 0),
    r: 210 + rand() * 70,
  }));
  const hills = Array.from({ length: 6 }, (_, i) => ({ x: -520 + i * 190 + rand() * 40, z: -1040, h: 90 + rand() * 40, r: 240 + rand() * 40 }));
  g.add(peaks(back, "#53684f", haze, 0.4, 11), peaks(front, "#3b5530", haze, 0.2, 12), peaks(hills, "#566b3a", haze, 0.14, 13, 0.3));
  // ladera bajo el pueblo (cuña que sube desde la pista hacia las montañas)
  const slope = (z: number) => -2 + ((-880 - z) / 130) * 72;
  const prof = new THREE.Shape();
  prof.moveTo(878, -4);
  prof.lineTo(1015, -4);
  prof.lineTo(1015, slope(-1015));
  prof.lineTo(878, slope(-878));
  prof.closePath();
  const wedgeGeo = new THREE.ExtrudeGeometry(prof, { depth: 980, bevelEnabled: false });
  wedgeGeo.rotateY(Math.PI / 2); // forma: x → -z del mundo; extrusión → +x
  wedgeGeo.translate(-490, 0, 0);
  const wedge = new THREE.Mesh(wedgeGeo, new THREE.MeshLambertMaterial({ color: new THREE.Color("#5f7048").lerp(haze, 0.15), emissive: haze.clone().multiplyScalar(0.05) }));
  wedge.frustumCulled = false;
  g.add(wedge);

  // pueblo trepando la ladera
  const palette = ["#e8c49a", "#f0dab4", "#e0a07a", "#f2e3c6", "#d88f6e", "#eccf8c", "#f1e8da", "#c99a72", "#e7b8a4"];
  const town: Building[] = [];
  for (let i = 0; i < 90; i++) {
    const x = -460 + rand() * 860;
    const z = -895 - rand() * 95; // detrás de la pista y las tribunas
    const tower = rand() < 0.12;
    town.push({
      x,
      z,
      y: slope(z) - 1,
      w: 14 + rand() * 18,
      d: 12 + rand() * 12,
      h: tower ? 45 + rand() * 50 : 10 + rand() * 24,
      color: palette[Math.floor(rand() * palette.length)],
    });
  }
  g.add(buildings(town, "office", haze, 0.3));
  // techos de teja sobre las casas bajas (las torres tienen azotea)
  g.add(boxes(town.filter((b) => b.h < 40).map((b) => ({ x: b.x, z: b.z, y: (b.y ?? 0) + b.h, w: b.w + 0.8, d: b.d + 0.8, h: 1.6, color: rand() < 0.8 ? "#b65a3c" : "#9c4a31" })), haze, 0.14));
  return g;
}

export type Coast = {
  group: THREE.Group;
  /** Obstáculos fijos (yates, buques, escolleras, muelles): rebotan pero no penalizan. */
  colliders: Collider[];
  /** Si (x, z) está en tierra devuelve el punto navegable más cercano; si no, null. */
  shore: ((x: number, z: number) => [number, number] | null) | null;
  /** Tomas de la costa para la intro. */
  showcase: Showcase[];
  update: (t: number, heightAt: (x: number, z: number) => number) => void;
};

export function createCoast(kind: CoastKind, p: SkyPalette): Coast {
  if (kind === "riviera") {
    const group = riviera(p);
    const harbor = createMonacoHarbor();
    group.add(harbor.group);
    return {
      group,
      colliders: harbor.colliders,
      shore: (x, z) => {
        const limit = harbor.shore(x);
        return z < limit ? [x, limit] : null;
      },
      showcase: [{ title: "Mónaco", subtitle: "Port Hercule: superyates y el circuito de F1 sobre el muelle", pos: [-40, 16, -620], look: [60, 6, -860] }],
      update: harbor.update,
    };
  }
  const local = kind === "river" ? createBuenosAires(p) : createMarDelPlata(p);
  return { group: local.group, colliders: local.colliders, shore: local.shore, showcase: local.showcase, update: local.update };
}
