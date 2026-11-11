import * as THREE from "three";
import { applyPalette, bakeEnvironment, createSky, sunDirection } from "@/lib/three/sky";
import { createCoast, type Coast } from "@/lib/three/coast";
import { DEFAULT_COURSE, getCourse, type CourseDef, type CourseId } from "@/lib/game/courses";
import { createOcean, waveHeight, type Gust } from "@/lib/three/ocean";
import { create29er, float29er } from "@/lib/three/boat29er";
import { createWake } from "@/lib/three/wake";

/* ───────────── Física de navegación ───────────── */

const TAU = Math.PI * 2;
const wrap = (a: number) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const DEG = 180 / Math.PI;

/** Polar simplificada de un 29er (grados → m/s, escala "de juego"). */
const POLAR: [number, number][] = [
  [0, 0], [28, 0.6], [36, 4.2], [44, 7.0], [60, 8.2], [80, 9.2],
  [100, 10.6], [120, 12.8], [140, 13.4], [155, 11.6], [170, 9.0], [180, 7.8],
];
export function polar(twaDeg: number) {
  const a = Math.min(180, Math.abs(twaDeg));
  for (let i = 1; i < POLAR.length; i++) {
    if (a <= POLAR[i][0]) {
      const [a0, v0] = POLAR[i - 1];
      const [a1, v1] = POLAR[i];
      return v0 + ((a - a0) / (a1 - a0)) * (v1 - v0);
    }
  }
  return POLAR[POLAR.length - 1][1];
}
export const toKnots = (ms: number) => ms * 1.45;

/* ───────────── Recorrido ───────────── */

/** Geometría común a todas las sedes (línea y radio de rodeo). La ruta de boyas sale de courses.ts. */
export const COURSE = {
  lineHalf: 30,
  pin: new THREE.Vector2(-30, 0),
  committee: new THREE.Vector2(30, 0),
  roundRadius: 11,
};

/** Reglas de la regata. */
export const RULES = {
  /** Segundos que se suman al reloj por tocar una boya o la lancha. */
  touchSeconds: 5,
  /** Puntos que se pierden por cada toque. */
  touchPoints: 150,
  startPoints: 1000,
  /** Distancia máxima a la boya para que el rodeo cuente (m). */
  roundDistance: 35,
};

export type MapInfo = {
  marks: { x: number; z: number; short: string; active: boolean }[];
  /** Límites del mundo a mostrar: x ∈ [minX, maxX], z ∈ [minZ, maxZ]. */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  current: { x: number; z: number };
};

export type Phase = "idle" | "intro" | "countdown" | "racing" | "finished";

export type Hud = {
  phase: Phase;
  countdown: number;
  time: number;
  leg: number;
  /** Cantidad total de tramos (largada + boyas + llegada). */
  legs: number;
  legName: string;
  distance: number;
  knots: number;
  twa: number; // grados con signo (+ estribor)
  windFrom: number; // radianes
  heading: number;
  inIrons: boolean;
  gust: boolean;
  spinnaker: boolean;
  vmg: number;
  boat: { x: number; z: number };
  target: { x: number; z: number };
  gusts: Gust[];
  map: MapInfo;
  points: number;
  touches: number;
  /** true mientras el objetivo es una boya (hay que dejarla a babor). */
  rounding: boolean;
  intro: { title: string; subtitle: string; step: number; steps: number } | null;
};

export type RaceStats = { touches: number; points: number; penalty: number };

type Events = {
  onPhase?: (p: Phase) => void;
  onLeg?: (leg: number, split: number, message: string) => void;
  onFinish?: (time: number, stats: RaceStats) => void;
  /** Toque de boya o lancha durante la regata. */
  onTouch?: (stats: RaceStats) => void;
  /** Choque contra la costa (muelle, rambla, escollera, edificio): frena en seco, sin penalidad. */
  onCrash?: () => void;
};

/** Grupo de contacto de la costa (los obstáculos usan grupos ≥ 0). */
const SHORE_GROUP = -1;

/* ───────────── Objetos del campo de regata ───────────── */

function buoy(color: string) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: color, emissiveIntensity: 0.15 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 2.2, 24), mat);
  body.position.y = 0.8;
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 12, 0, TAU, 0, Math.PI / 2), mat);
  top.position.y = 1.9;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 0.97, 0.25, 24), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5 }));
  band.position.y = 0.5;
  g.add(body, top, band);
  return g;
}

function committeeBoat() {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: "#f4f6f8", roughness: 0.4 });
  const navy = new THREE.MeshStandardMaterial({ color: "#0b1d33", roughness: 0.5 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 8), white);
  hull.position.y = 0.4;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.4, 3), navy);
  cabin.position.set(0, 1.6, 0.6);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5, 8), white);
  pole.position.set(0, 3.5, -1.5);
  const c = document.createElement("canvas");
  c.width = 256; c.height = 160;
  const x = c.getContext("2d")!;
  ["#26a9e0", "#ffffff", "#26a9e0"].forEach((col, i) => { x.fillStyle = col; x.fillRect(0, (i * 160) / 3, 256, 54); });
  x.fillStyle = "#faaf40"; x.beginPath(); x.arc(128, 80, 18, 0, TAU); x.fill();
  const flagTex = new THREE.CanvasTexture(c);
  flagTex.colorSpace = THREE.SRGBColorSpace;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide }));
  flag.position.set(0.95, 5.3, -1.5);
  g.add(hull, cabin, pole, flag);
  return g;
}

function beacon(color: string) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(COURSE.roundRadius - 0.6, COURSE.roundRadius, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.25;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 60, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.position.y = 30;
  g.add(ring, beam);
  return { group: g, ring, beam };
}

function lineStrip() {
  const len = COURSE.lineHalf * 2;
  const c = document.createElement("canvas");
  c.width = 512; c.height = 8;
  const x = c.getContext("2d")!;
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.9)"; x.fillRect(i * 32, 0, 32, 8); }
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.8 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.35;
  return m;
}

function chevron() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.4);
  shape.lineTo(0.9, -0.6);
  shape.lineTo(0, -0.1);
  shape.lineTo(-0.9, -0.6);
  shape.closePath();
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: "#faaf40", transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false })
  );
  m.rotation.x = -Math.PI / 2;
  const g = new THREE.Group();
  g.add(m);
  g.renderOrder = 10;
  return g;
}

/** Flechas que giran en el agua alrededor de la boya: muestran por dónde rodearla (antihorario = a babor). */
function roundArrows(color: string, radius = 6.5, count = 4) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.1);
  shape.lineTo(0.8, -0.5);
  shape.lineTo(0, -0.05);
  shape.lineTo(-0.8, -0.5);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2); // apunta a -Z
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < count; i++) {
    const th = (i / count) * TAU;
    const m = new THREE.Mesh(geo, mat);
    // posición antihoraria en (x, -z) y orientación tangente
    m.position.set(radius * Math.cos(th), 0.45, -radius * Math.sin(th));
    m.rotation.y = th;
    g.add(m);
  }
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.12, radius + 0.12, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.4;
  g.add(ring);
  g.renderOrder = 5;
  return g;
}

function windStreaks(count = 140) {
  const pos = new Float32Array(count * 6);
  const seeds = Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 120, y: 1 + Math.random() * 9, z: (Math.random() - 0.5) * 120, l: 1.5 + Math.random() * 3 }));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false }));
  lines.frustumCulled = false;
  return {
    lines,
    update(center: THREE.Vector3, windTo: THREE.Vector2, speed: number, dt: number) {
      for (let i = 0; i < count; i++) {
        const s = seeds[i];
        s.x += windTo.x * speed * dt;
        s.z += windTo.y * speed * dt;
        if (s.x > 60) s.x -= 120; if (s.x < -60) s.x += 120;
        if (s.z > 60) s.z -= 120; if (s.z < -60) s.z += 120;
        const x = center.x + s.x, z = center.z + s.z;
        pos.set([x, s.y, z, x + windTo.x * s.l, s.y, z + windTo.y * s.l], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
    },
    dispose() { geo.dispose(); (lines.material as THREE.Material).dispose(); },
  };
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      (mat as THREE.MeshBasicMaterial).map?.dispose();
      mat.dispose();
    }
  });
}

/* ───────────── Motor del juego ───────────── */

export class RegattaEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 4000);
  private boat = create29er();
  private ocean;
  private sky;
  private wake;
  private streaks = windStreaks();
  private arrow = chevron();
  private marks: THREE.Group[] = [];
  private routeMarks: THREE.Group[] = [];
  private coast: THREE.Group | null = null;
  private sun: THREE.DirectionalLight;
  private course: CourseDef;
  private mapCache: Omit<MapInfo, "marks"> & {
    marks: { x: number; z: number; short: string; leg: number[] }[];
    /** Por cada tramo de boya: dirección (x, y=-z) de la semirrecta que hay que cruzar en sentido antihorario. */
    rays: { x: number; y: number }[];
  };
  private rounder = roundArrows("#faaf40");
  /** Obstáculos con los que se puede chocar: boyas de la ruta, boya de largada y lancha. */
  private obstacles: { x: number; z: number; r: number; group: number; penalty: boolean }[] = [];
  private coastData: Coast | null = null;
  private beacon = beacon("#faaf40");
  private line = lineStrip();
  private raf = 0;
  private timer = new THREE.Timer();
  private ro: ResizeObserver;
  private visible = true;
  private io: IntersectionObserver;

  // estado
  phase: Phase = "idle";
  /** Congela la simulación (sigue renderizando para acompañar resizes). */
  paused = false;
  /** prefers-reduced-motion: la intro corta entre tomas en vez de volar. */
  reducedMotion = false;
  private t = 0;
  private raceTime = 0;
  private countdown = 0;
  private leg = 0; // 0 largada, 1..N → boya N de la ruta, N+1 → llegada
  private heading = 0.75;
  private speed = 0;
  private yawRate = 0;
  /** Timón con inercia: sigue al input con una velocidad limitada. */
  private rudder = 0;
  private touches = 0;
  private points = RULES.startPoints;
  private penalty = 0;
  private contact = new Set<number>();
  private prevCross: number | null = null;
  // intro
  private introT = 0;
  private introShots: { title: string; subtitle: string; dur: number; pos: THREE.Vector3; look: THREE.Vector3; mark?: [number, number] }[] = [];
  private introLook = new THREE.Vector3();
  private lookBlend = 1;
  private windFrom = 0;
  private gusts: Gust[] = [];
  private inGust = false;
  private input = { left: false, right: false, axis: 0 };
  private camYaw = 0;
  private camMode = 0;
  get cameraMode() {
    return this.camMode;
  }
  private prevZ = 0;
  private events: Events;
  private disposed = false;
  private snapCamera = true;

  constructor(private mount: HTMLElement, events: Events = {}, courseId: CourseId = DEFAULT_COURSE) {
    this.events = events;
    this.course = getCourse(courseId);
    this.mapCache = this.buildMap();
    const small = window.matchMedia("(max-width: 768px)").matches;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    const pr = Math.min(window.devicePixelRatio, small ? 1.5 : 1.75);
    this.renderer.setPixelRatio(pr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    mount.appendChild(this.renderer.domElement);

    const palette = this.course.palette;
    this.sky = createSky(palette);
    this.scene.add(this.sky.mesh);
    this.scene.environment = bakeEnvironment(this.renderer, palette);
    this.sun = new THREE.DirectionalLight(palette.sun, 2.2);
    this.sun.position.copy(sunDirection(palette)).multiplyScalar(100);
    this.scene.add(this.sun, new THREE.HemisphereLight("#cfe8ff", "#0b3046", 0.7));

    this.ocean = createOcean({ palette, amplitude: this.course.waveAmp, segments: small ? 200 : 320 });
    this.scene.add(this.ocean.mesh);
    this.scene.add(this.boat.root);
    this.wake = createWake(small ? 700 : 1200);
    this.wake.setPixelRatio(pr);
    this.scene.add(this.wake.points);
    this.scene.add(this.streaks.lines);
    this.scene.add(this.arrow);

    this.buildCourse();
    const pin = buoy("#faaf40");
    pin.position.set(COURSE.pin.x, 0, COURSE.pin.y);
    this.scene.add(pin);
    this.marks.push(pin);
    const cb = committeeBoat();
    cb.position.set(COURSE.committee.x + 3, 0, COURSE.committee.y);
    this.scene.add(cb);
    this.marks.push(cb);
    this.scene.add(this.line);
    this.scene.add(this.beacon.group);
    this.rounder.visible = false;
    this.scene.add(this.rounder);

    this.resetGusts();
    this.reset();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(mount);
    this.resize();
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(mount);
    this.loop();
  }

  private resize() {
    const w = this.mount.clientWidth, h = this.mount.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < 640 ? 68 : 55;
    this.camera.updateProjectionMatrix();
  }

  /** Boyas y costa de la sede actual. */
  private buildCourse() {
    for (const b of this.routeMarks) {
      this.scene.remove(b);
      disposeTree(b);
      this.marks.splice(this.marks.indexOf(b), 1);
    }
    this.routeMarks = [];
    for (const m of this.mapCache.marks) {
      const b = buoy("#ff6a1a");
      b.position.set(m.x, 0, m.z);
      this.scene.add(b);
      this.routeMarks.push(b);
      this.marks.unshift(b);
    }
    if (this.coast) {
      this.scene.remove(this.coast);
      disposeTree(this.coast);
    }
    this.coastData = createCoast(this.course.coast, this.course.palette);
    this.coast = this.coastData.group;
    this.scene.add(this.coast);

    // obstáculos: boyas (r≈1 m), boya de largada y lancha de comisión (tres círculos a lo largo del casco)
    const cbx = COURSE.committee.x + 3;
    this.obstacles = [
      ...this.mapCache.marks.map((m, i) => ({ x: m.x, z: m.z, r: 1.05, group: i, penalty: true })),
      { x: COURSE.pin.x, z: COURSE.pin.y, r: 1.05, group: 100, penalty: true },
      ...[-2.6, 0, 2.6].map((dz) => ({ x: cbx, z: COURSE.committee.y + dz, r: 1.9, group: 101, penalty: true })),
      // costa (yates, buques, escolleras, muelles): cada grupo cuenta como un solo obstáculo; rebotan sin penalizar
      ...this.coastData.colliders.map((c, i) => ({ ...c, group: 200 + (c.group ?? Math.floor(i / 3)), penalty: false })),
    ];
  }

  /** Boyas únicas (una ruta puede repetir boyas) y límites del mapa. */
  private buildMap() {
    const marks: { x: number; z: number; short: string; leg: number[] }[] = [];
    this.course.route.forEach((r, i) => {
      const found = marks.find((m) => m.x === r.pos[0] && m.z === r.pos[1]);
      if (found) found.leg.push(i + 1);
      else marks.push({ x: r.pos[0], z: r.pos[1], short: r.short, leg: [i + 1] });
    });
    const xs = [...marks.map((m) => m.x), -COURSE.lineHalf, COURSE.lineHalf];
    const zs = [...marks.map((m) => m.z), 0];
    const pad = 40;
    // Para cada boya, la semirrecta "hacia afuera" de la cancha: desde el punto medio
    // entre la boya anterior y la siguiente hacia la boya. Rodearla a babor = cruzarla antihorario.
    const route = this.course.route;
    const rays = route.map((r, i) => {
      const prev = i === 0 ? [0, 0] : route[i - 1].pos;
      const next = i === route.length - 1 ? [0, 0] : route[i + 1].pos;
      const dx = r.pos[0] - (prev[0] + next[0]) / 2;
      const dz = r.pos[1] - (prev[1] + next[1]) / 2;
      const l = Math.hypot(dx, dz) || 1;
      return { x: dx / l, y: -dz / l };
    });
    return {
      marks,
      rays,
      minX: Math.min(...xs) - pad,
      maxX: Math.max(...xs) + pad,
      minZ: Math.min(...zs) - pad,
      maxZ: Math.max(...zs) + pad,
      current: { x: this.course.current[0], z: this.course.current[1] },
    };
  }

  get courseId() {
    return this.course.id;
  }

  /** Cambia de sede: ruta, viento, olas, cielo y costa. Vuelve al modo demo. */
  setCourse(id: CourseId) {
    if (id === this.course.id) return;
    this.course = getCourse(id);
    this.mapCache = this.buildMap();
    const p = this.course.palette;
    applyPalette(this.sky.uniforms, p);
    applyPalette(this.ocean.uniforms, p);
    this.ocean.uniforms.uWater.value.set(p.water);
    this.ocean.uniforms.uScatter.value.set(p.waterScatter);
    this.ocean.uniforms.uAmp.value = this.course.waveAmp;
    this.sun.color.set(p.sun);
    this.sun.position.copy(sunDirection(p)).multiplyScalar(100);
    this.scene.environment?.dispose();
    this.scene.environment = bakeEnvironment(this.renderer, p);
    this.buildCourse();
    this.resetGusts();
    this.reset();
  }

  private resetGusts() {
    const top = this.mapCache.minZ;
    const n = this.course.gusts.count;
    this.gusts = Array.from({ length: n }, (_, i) => ({
      x: (Math.random() - 0.5) * 220,
      z: top - 40 + (i * (Math.abs(top) + 100)) / n + Math.random() * 40,
      r: 18 + Math.random() * 20,
      s: 1,
    }));
  }

  reset() {
    this.phase = "idle";
    this.leg = 0;
    this.raceTime = 0;
    this.speed = 0;
    this.rudder = 0;
    this.yawRate = 0;
    this.touches = 0;
    this.points = RULES.startPoints;
    this.penalty = 0;
    this.contact.clear();
    this.prevCross = null;
    this.lookBlend = 1;
    this.heading = 0.72; // amura de estribor, ciñendo hacia la línea
    this.boat.root.position.set(8, 0, 28);
    this.prevZ = 28;
    this.camYaw = this.heading;
    this.snapCamera = true;
    this.wake.reset();
    this.events.onPhase?.("idle");
  }

  /** Larga la regata. Con intro, primero un paneo por la cancha presentando cada boya. */
  start(withIntro = false) {
    this.reset();
    if (withIntro) {
      this.introShots = this.buildIntro();
      this.introT = 0;
      this.introLook.copy(this.boat.root.position);
      this.phase = "intro";
      this.events.onPhase?.("intro");
    } else this.beginCountdown();
  }

  skipIntro() {
    if (this.phase === "intro") this.beginCountdown();
  }

  private beginCountdown() {
    if (this.phase === "intro") {
      // volver suave desde la última toma hasta la cámara del barco
      this.lookBlend = 0;
      this.snapCamera = false;
    }
    this.phase = "countdown";
    this.countdown = 3.999;
    this.events.onPhase?.("countdown");
  }

  private buildIntro() {
    const c = this.course;
    const shots: typeof this.introShots = [
      {
        title: `Regata ${c.name}`,
        subtitle: c.brief,
        dur: 3,
        pos: new THREE.Vector3(70, 170, 200),
        look: new THREE.Vector3(-20, 0, (this.mapCache.minZ + this.mapCache.maxZ) / 2),
      },
    ];
    // la costa de la sede, para que se sepa que se puede ir a verla
    for (const s of this.coastData?.showcase ?? [])
      shots.push({ title: s.title, subtitle: s.subtitle, dur: 2.6, pos: new THREE.Vector3(...s.pos), look: new THREE.Vector3(...s.look) });
    const seen = new Set<string>();
    c.route.forEach((r, i) => {
      const key = r.pos.join(",");
      if (seen.has(key)) return;
      seen.add(key);
      const ray = this.mapCache.rays[i];
      // cámara del lado de donde llegás a la boya, un poco elevada
      const [x, z] = r.pos;
      shots.push({
        title: r.name,
        subtitle: "↺ Rodeala dejándola a babor (a tu izquierda)",
        dur: 2.4,
        pos: new THREE.Vector3(x - ray.x * 42 + 14, 20, z + ray.y * 42 + 8),
        look: new THREE.Vector3(x, 1, z),
        mark: [x, z],
      });
    });
    shots.push({
      title: "Largada",
      subtitle: "Cruzá la línea entre la boya amarilla y la lancha cuando termine la cuenta",
      dur: 2.6,
      pos: new THREE.Vector3(-6, 14, 58),
      look: new THREE.Vector3(0, 1, 0),
    });
    return shots;
  }

  private currentShot() {
    let acc = 0;
    for (let i = 0; i < this.introShots.length; i++) {
      acc += this.introShots[i].dur;
      if (this.introT < acc) return i;
    }
    return -1;
  }

  setInput(left: boolean, right: boolean) {
    this.input.left = left;
    this.input.right = right;
  }
  setAxis(axis: number) {
    this.input.axis = THREE.MathUtils.clamp(axis, -1, 1);
  }
  /** Solo para pruebas: avanza la simulación sin renderizar. */
  simulate(seconds: number, dt = 1 / 30, autopilot?: (h: Hud) => number) {
    for (let i = 0; i < seconds / dt; i++) {
      if (autopilot) this.setAxis(autopilot(this.hud()));
      this.step(dt);
    }
  }

  /** Alterna cámara detrás del barco / aérea. Devuelve el modo nuevo (0 detrás, 1 aérea). */
  toggleCamera() {
    this.camMode = (this.camMode + 1) % 2;
    return this.camMode;
  }

  private target() {
    const r = this.course.route[this.leg - 1];
    return r ? new THREE.Vector2(r.pos[0], r.pos[1]) : new THREE.Vector2(0, 0);
  }

  hud(): Hud {
    const p = this.boat.root.position;
    const tg = this.target();
    const twa = wrap(this.heading - this.windFrom) * DEG;
    const route = this.course.route;
    const legNames = ["Cruzá la línea de largada", ...route.map((r) => r.name), "¡A la llegada!"];
    // VMG hacia el objetivo
    const fx = -Math.sin(this.heading), fz = -Math.cos(this.heading);
    const to = new THREE.Vector2(tg.x - p.x, tg.y - p.z);
    const dist = to.length();
    to.normalize();
    return {
      phase: this.phase,
      countdown: this.countdown,
      time: this.raceTime,
      leg: this.leg,
      legs: route.length + 2,
      legName: legNames[this.leg] ?? "",
      distance: dist,
      knots: toKnots(this.speed),
      twa,
      windFrom: this.windFrom,
      heading: this.heading,
      inIrons: Math.abs(twa) < 34 && this.phase === "racing",
      gust: this.inGust,
      spinnaker: this.boat.spinnaker > 0.5,
      vmg: toKnots(this.speed * (fx * to.x + fz * to.y)),
      boat: { x: p.x, z: p.z },
      target: { x: tg.x, z: tg.y },
      gusts: this.gusts,
      points: this.points,
      touches: this.touches,
      rounding: this.leg >= 1 && this.leg <= route.length,
      intro: (() => {
        if (this.phase !== "intro") return null;
        const i = Math.max(0, this.currentShot());
        const sh = this.introShots[i];
        return sh ? { title: sh.title, subtitle: sh.subtitle, step: i + 1, steps: this.introShots.length } : null;
      })(),
      map: {
        ...this.mapCache,
        marks: this.mapCache.marks.map((m) => ({ x: m.x, z: m.z, short: m.short, active: m.leg.includes(this.leg) })),
      },
    };
  }

  private step(dt: number) {
    this.t += dt;
    const t = this.t;

    // viento con rolada oscilante
    const [a1, p1, a2, p2] = this.course.wind.shift;
    this.windFrom = a1 * Math.sin(t / p1) + a2 * Math.sin(t / p2 + 1.3);
    const windTo = new THREE.Vector2(Math.sin(this.windFrom), Math.cos(this.windFrom)); // hacia donde sopla
    const p = this.boat.root.position;

    // ráfagas que bajan con el viento
    this.inGust = false;
    for (const g of this.gusts) {
      g.x += windTo.x * this.course.gusts.drift * dt;
      g.z += windTo.y * this.course.gusts.drift * dt;
      if (g.z > p.z + 220 || g.z > 260) {
        g.z = Math.min(p.z, 0) + this.mapCache.minZ - 30 - Math.random() * 80;
        g.x = p.x + (Math.random() - 0.5) * 240;
        g.r = 18 + Math.random() * 20;
      }
      const d = Math.hypot(p.x - g.x, p.z - g.z);
      if (d < g.r * 0.8) this.inGust = true;
    }
    this.ocean.setGusts(this.gusts);

    if (this.phase === "intro") {
      this.introT += dt;
      if (this.currentShot() < 0) this.beginCountdown();
    }

    if (this.phase === "countdown") {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.phase = "racing";
        this.events.onPhase?.("racing");
      }
    }

    const twa = wrap(this.heading - this.windFrom);
    const twaDeg = Math.abs(twa) * DEG;
    const racing = this.phase === "racing";

    // timón
    let steer = this.input.axis;
    if (this.input.left) steer += 1;
    if (this.input.right) steer -= 1;
    steer = THREE.MathUtils.clamp(steer, -1, 1);
    if (!racing) steer = this.phase === "idle" ? Math.sin(t * 0.25) * 0.15 : 0;
    // inercia del timón: se mueve hacia el input a velocidad limitada (más rápido al volver al centro)
    const back = Math.abs(steer) < Math.abs(this.rudder) || Math.sign(steer) !== Math.sign(this.rudder);
    const rate = (back ? 3.2 : 1.9) * dt;
    this.rudder += THREE.MathUtils.clamp(steer - this.rudder, -rate, rate);
    const authority = 0.35 + 0.65 * Math.min(this.speed / 6, 1);
    const targetYaw = this.rudder * 1.3 * authority;
    // inercia de giro del casco
    this.yawRate += (targetYaw - this.yawRate) * Math.min(1, dt * 2.6);
    this.heading = wrap(this.heading + this.yawRate * dt);

    // velocidad
    let target = polar(twaDeg) * this.course.wind.strength * (this.inGust ? this.course.gusts.boost : 1);
    if (this.phase === "countdown" || this.phase === "intro") target = 0;
    if (this.phase === "idle") target = 4;
    if (this.phase === "finished") target = 2;
    // inercia: acelera despacio y pierde velocidad todavía más despacio (proa al viento sigue avanzando un rato)
    const k = target > this.speed ? 0.45 : twaDeg < 34 ? 0.2 : 0.3;
    this.speed += (target - this.speed) * Math.min(1, dt * k);
    this.speed -= Math.abs(this.yawRate) * this.speed * 0.05 * dt;
    this.speed = Math.max(0, this.speed);

    // avance + deriva en proa al viento
    p.x += -Math.sin(this.heading) * this.speed * dt;
    p.z += -Math.cos(this.heading) * this.speed * dt;
    if (twaDeg < 30 && racing) {
      p.x += windTo.x * 0.6 * dt;
      p.z += windTo.y * 0.6 * dt;
    }
    // corriente
    if (this.phase !== "idle") {
      p.x += this.course.current[0] * dt;
      p.z += this.course.current[1] * dt;
    }

    // en modo demo, que navegue en círculos amplios cerca de la línea
    if (this.phase === "idle" && Math.hypot(p.x, p.z - 20) > 70) {
      this.heading = wrap(this.heading + dt * 0.5);
    }

    this.collide(racing);

    // lógica de regata
    if (racing) {
      this.raceTime += dt;
      const crossedLine = (this.prevZ > 0 && p.z <= 0) && Math.abs(p.x) <= COURSE.lineHalf + 1;
      const route = this.course.route;
      const N = route.length;
      if (this.leg === 0 && crossedLine) {
        this.leg = 1;
        this.events.onLeg?.(1, this.raceTime, `¡Largaste! Rumbo a la ${route[0].short}`);
      } else if (this.leg >= 1 && this.leg <= N) {
        // rodeo a babor: cruzar en sentido antihorario la semirrecta que sale de la boya hacia afuera
        const tg = this.target();
        const ray = this.mapCache.rays[this.leg - 1];
        const rx = p.x - tg.x, ry = -(p.z - tg.y);
        const along = rx * ray.x + ry * ray.y;
        const cross = ray.x * ry - ray.y * rx;
        const near = Math.hypot(rx, ry) < RULES.roundDistance;
        const rounded = this.prevCross !== null && this.prevCross < 0 && cross >= 0 && along > 0 && near;
        this.prevCross = cross;
        if (rounded) {
          this.prevCross = null;
          const done = route[this.leg - 1].short;
          this.leg += 1;
          const next = this.leg <= N ? route[this.leg - 1].hint : "Ceñí hasta la llegada";
          this.events.onLeg?.(this.leg, this.raceTime, `${done} ✓ · ${next}`);
        }
      } else if (this.leg === N + 1 && crossedLine) {
        this.phase = "finished";
        this.events.onFinish?.(this.raceTime, { touches: this.touches, points: this.points, penalty: this.penalty });
        this.events.onPhase?.("finished");
      }
    }
    this.prevZ = p.z;

    // barco
    const amp = this.course.waveAmp;
    const heightAt = (x: number, z: number) => waveHeight(x, z, t, amp);
    const sv = this.boat.trim(twa, dt);
    const heel = twaDeg < 35 ? 0.01 : 0.03 + 0.05 * Math.sin(Math.min(twaDeg, 120) / 120 * Math.PI) * (this.inGust ? 1.5 : 1);
    float29er(this.boat, heightAt, this.heading, heel, dt, sv * Math.min(1, this.speed / 10));
    this.wake.spawn(p, this.heading, this.speed, dt);
    this.wake.update(dt, heightAt);
    this.streaks.update(p, windTo, 9, dt);

    this.coastData?.update(t, heightAt);

    // marcas balanceándose
    this.marks.forEach((m, i) => {
      m.position.y = heightAt(m.position.x, m.position.z) * 0.8;
      m.rotation.z = Math.sin(t * 1.3 + i) * 0.06;
      m.rotation.x = Math.cos(t * 1.1 + i * 2) * 0.05;
    });

    // baliza en la próxima boya / flecha
    const tg = this.target();
    const showBeacon = this.leg >= 1 && this.leg <= this.course.route.length;
    this.beacon.group.visible = showBeacon && this.phase !== "idle";
    this.beacon.group.position.set(tg.x, 0, tg.y);
    const pulse = 1 + Math.sin(t * 4) * 0.06;
    this.beacon.ring.scale.set(pulse, pulse, 1);
    this.line.visible = this.leg === 0 || this.leg === this.course.route.length + 1 || this.phase === "intro";
    const shot = this.phase === "intro" ? this.introShots[this.currentShot()] : undefined;
    const roundAt = shot ? shot.mark : showBeacon && this.phase !== "idle" ? ([tg.x, tg.y] as [number, number]) : undefined;
    this.rounder.visible = !!roundAt;
    if (roundAt) {
      this.rounder.position.set(roundAt[0], heightAt(roundAt[0], roundAt[1]) * 0.8, roundAt[1]);
      this.rounder.rotation.y += dt * 0.9; // antihorario visto desde arriba
    }
    this.arrow.visible = this.phase === "racing";
    this.arrow.position.set(p.x, p.y + 8.2, p.z);
    this.arrow.rotation.y = Math.atan2(-(tg.x - p.x), -(tg.y - p.z));

    // cámara de la intro: paneo suave entre tomas
    if (shot) {
      const cam = this.camera.position;
      const kk = this.reducedMotion ? 1 : 1 - Math.exp(-dt * 2.2);
      cam.lerp(shot.pos, kk);
      cam.y = Math.max(cam.y, heightAt(cam.x, cam.z) + 2);
      this.introLook.lerp(shot.look, kk);
      this.camera.lookAt(this.introLook);
      this.camYaw = this.heading;
      this.sky.mesh.position.copy(cam);
      this.sky.uniforms.uTime.value = t;
      this.ocean.update(t, this.camera);
      return;
    }

    // cámara
    const yawDiff = wrap(this.heading - this.camYaw);
    this.camYaw = wrap(this.camYaw + yawDiff * Math.min(1, dt * 2.2));
    const idle = this.phase === "idle";
    const far = this.camMode === 1 && !idle;
    const dist = far ? 34 : idle ? 17 : 13.5 + this.speed * 0.25;
    const height = far ? 30 : idle ? 4.2 : 5.2;
    const orbit = idle ? this.camYaw + 2.1 + Math.sin(t * 0.08) * 0.6 : this.camYaw;
    const cx = p.x + Math.sin(orbit) * dist;
    const cz = p.z + Math.cos(orbit) * dist;
    const cam = this.camera.position;
    const ck = this.snapCamera ? 1 : Math.min(1, dt * 4);
    this.snapCamera = false;
    cam.x += (cx - cam.x) * ck;
    cam.z += (cz - cam.z) * ck;
    cam.y += (Math.max(p.y + height, heightAt(cam.x, cam.z) + 1.5) - cam.y) * ck;
    const look = idle
      ? new THREE.Vector3(p.x, p.y + 2.6, p.z)
      : new THREE.Vector3(p.x - Math.sin(this.camYaw) * 6, p.y + (far ? 0 : 2.4), p.z - Math.cos(this.camYaw) * 6);
    // al salir de la intro, la mirada pasa suave de la última toma al barco
    if (this.lookBlend < 1) {
      this.lookBlend = Math.min(1, this.lookBlend + dt * 0.9);
      const e = this.lookBlend * this.lookBlend * (3 - 2 * this.lookBlend);
      look.lerpVectors(this.introLook, look, e);
    }
    this.camera.lookAt(look);

    this.sky.mesh.position.copy(cam);
    this.sky.uniforms.uTime.value = t;
    this.ocean.update(t, this.camera);
  }

  /** Choques del casco contra boyas y lancha: rebote, y en regata +segundos y −puntos. */
  private collide(racing: boolean) {
    const p = this.boat.root.position;
    const fx = -Math.sin(this.heading), fz = -Math.cos(this.heading);
    const half = 2.1; // medio largo del casco
    const beam = 0.55; // media manga
    const touching = new Set<number>();
    for (const o of this.obstacles) {
      // punto del eje del casco más cercano al obstáculo
      const ox = o.x - p.x, oz = o.z - p.z;
      const s = THREE.MathUtils.clamp(ox * fx + oz * fz, -half, half);
      const cx = p.x + fx * s, cz = p.z + fz * s;
      const dx = cx - o.x, dz = cz - o.z;
      const d = Math.hypot(dx, dz);
      const min = o.r + beam;
      if (d < min + 1.5) touching.add(o.group);
      if (d >= min) continue;
      // rebote: sacar el barco afuera y frenarlo
      const nx = d > 1e-3 ? dx / d : -fx, nz = d > 1e-3 ? dz / d : -fz;
      p.x += nx * (min - d + 0.05);
      p.z += nz * (min - d + 0.05);
      if (!this.contact.has(o.group)) {
        this.contact.add(o.group);
        this.speed *= 0.35;
        this.yawRate *= 0.3;
        if (racing && o.penalty) {
          this.touches += 1;
          this.points = Math.max(0, this.points - RULES.touchPoints);
          this.penalty += RULES.touchSeconds;
          this.raceTime += RULES.touchSeconds;
          this.events.onTouch?.({ touches: this.touches, points: this.points, penalty: this.penalty });
        }
      }
    }
    // costa: es sólida. Se revisan proa, popa y centro; el barco rebota y frena en seco
    const shore = this.coastData?.shore;
    if (shore) {
      let hit = false;
      for (const s of [half, -half, 0]) {
        const hx = p.x + fx * s, hz = p.z + fz * s;
        const fix = shore(hx, hz);
        if (!fix) continue;
        hit = true;
        const dx = fix[0] - hx, dz = fix[1] - hz;
        const d = Math.hypot(dx, dz) || 1;
        p.x += dx + (dx / d) * 0.6; // un poco de rebote hacia el agua
        p.z += dz + (dz / d) * 0.6;
      }
      if (hit) {
        touching.add(SHORE_GROUP);
        if (!this.contact.has(SHORE_GROUP)) {
          this.contact.add(SHORE_GROUP);
          this.speed *= 0.2;
          this.yawRate *= 0.2;
          this.events.onCrash?.();
        }
      } else if (shore(p.x + fx * (half + 2), p.z + fz * (half + 2))) touching.add(SHORE_GROUP);
    }

    // se libera el contacto cuando te alejás un poco
    for (const g of [...this.contact]) if (!touching.has(g)) this.contact.delete(g);
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 1 / 20);
    if (!this.visible || document.hidden) return;
    if (!this.paused) this.step(dt);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this.boat.dispose();
    this.wake.dispose();
    this.ocean.dispose();
    this.streaks.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
