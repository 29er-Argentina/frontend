import type { SkyPalette } from "@/lib/three/sky";

/**
 * Las tres regatas del mini juego, de menor a mayor complejidad.
 * Datos puros (sin Three.js) para poder mostrarlos en la UI antes de cargar el motor.
 *
 * Coordenadas del mundo: el viento viene de -Z (barlovento arriba en el mapa),
 * la línea de largada/llegada está en z = 0 entre x = -30 y x = 30.
 *
 * Todas las boyas se rodean dejándolas a babor (a la izquierda del barco),
 * o sea en sentido antihorario visto desde arriba. La ruta siempre termina en
 * una boya de sotavento para que la llegada sea ciñendo, como la largada.
 */

export type CourseId = "mdp" | "rdp" | "monaco";

export type RouteLeg = {
  /** Etiqueta corta para splits y mapa (B1, B2, 1a…). */
  short: string;
  /** Nombre que se muestra en el HUD mientras vas hacia esta boya. */
  name: string;
  /** Mensaje al dejar la boya anterior y arrancar este tramo. */
  hint: string;
  pos: [x: number, z: number];
};

export type CourseDef = {
  id: CourseId;
  name: string;
  level: 1 | 2 | 3;
  levelName: string;
  blurb: string;
  /** Texto de la tarjeta inicial de la intro. */
  brief: string;
  route: RouteLeg[];
  wind: {
    /** Amplitud (rad) y período (s) de las dos componentes de la rolada. */
    shift: [amp1: number, period1: number, amp2: number, period2: number];
    /** Escala de la polar: < 1 es viento más flojo. */
    strength: number;
  };
  gusts: { count: number; boost: number; drift: number };
  /** Corriente en m/s (x, z). */
  current: [x: number, z: number];
  waveAmp: number;
  palette: SkyPalette;
  coast: "city" | "river" | "riviera";
};

const LEEWARD = "¡Izá el asimétrico!";
const BEAT = "Ceñí hasta la boya";
const OFFSET = "Abrí un poco hasta el desmarque";
const WING = "Largo abierto: ¡asimétrico arriba!";

export const COURSES: CourseDef[] = [
  {
    id: "mdp",
    name: "Mar del Plata",
    level: 1,
    levelName: "Fácil",
    blurb: "Barlovento, desmarque y sotavento frente a la costa. Rolas suaves y ráfagas parejas: ideal para aprender.",
    brief: "3 boyas · una vuelta. Rodealas todas dejándolas a babor.",
    route: [
      { short: "B1", name: "Boya 1 · Barlovento", hint: BEAT, pos: [0, -260] },
      { short: "1a", name: "Boya 1a · Desmarque", hint: OFFSET, pos: [-60, -245] },
      { short: "B2", name: "Boya 2 · Sotavento", hint: LEEWARD, pos: [-8, 70] },
    ],
    wind: { shift: [0.16, 19, 0.07, 7.3], strength: 1 },
    gusts: { count: 7, boost: 1.28, drift: 3.2 },
    current: [0, 0],
    waveAmp: 0.42,
    palette: {
      zenith: "#24609f",
      horizon: "#cfdfe9",
      mid: "#7eaad0",
      haze: "#e8f0f5",
      sun: "#fff4de",
      sunElevation: 34,
      sunAzimuth: -40,
      water: "#072c45",
      waterScatter: "#23808f",
      cloudiness: 0.5,
    },
    coast: "city",
  },
  {
    id: "rdp",
    name: "Río de la Plata",
    level: 2,
    levelName: "Media",
    blurb: "Triángulo con desmarque, boya de ala y dos largos. Agua color león, rolas más marcadas y corriente que te empuja de costado.",
    brief: "4 boyas · triángulo. La corriente te empuja hacia la derecha: compensá.",
    route: [
      { short: "B1", name: "Boya 1 · Barlovento", hint: BEAT, pos: [0, -260] },
      { short: "1a", name: "Boya 1a · Desmarque", hint: OFFSET, pos: [-60, -245] },
      { short: "B2", name: "Boya 2 · Ala", hint: WING, pos: [-130, -110] },
      { short: "B3", name: "Boya 3 · Sotavento", hint: "Segundo largo, cuidá la corriente", pos: [-8, 70] },
    ],
    wind: { shift: [0.22, 15, 0.09, 6.1], strength: 1 },
    gusts: { count: 7, boost: 1.28, drift: 3.6 },
    current: [0.9, 0.15],
    waveAmp: 0.2,
    palette: {
      zenith: "#3a6da3",
      horizon: "#eadcc0",
      mid: "#9cb7cf",
      haze: "#f4ead6",
      sun: "#ffefcc",
      sunElevation: 26,
      sunAzimuth: 40,
      water: "#3b2a16",
      waterScatter: "#9a7440",
      cloudiness: 0.45,
    },
    coast: "river",
  },
  {
    id: "monaco",
    name: "Mónaco",
    level: 3,
    levelName: "Difícil",
    blurb: "Dos vueltas: triángulo y después barlovento-sotavento. Viento flojo y rolón, las ráfagas valen oro y cada error se paga.",
    brief: "4 boyas · dos vueltas. Primero el triángulo, después B1, 1a y B3 otra vez.",
    route: [
      { short: "B1", name: "Boya 1 · Barlovento", hint: BEAT, pos: [0, -210] },
      { short: "1a", name: "Boya 1a · Desmarque", hint: OFFSET, pos: [-58, -196] },
      { short: "B2", name: "Boya 2 · Ala", hint: WING, pos: [-110, -80] },
      { short: "B3", name: "Boya 3 · Sotavento", hint: "Segundo largo hasta sotavento", pos: [-8, 50] },
      { short: "B1", name: "Boya 1 · 2.ª vuelta", hint: "Segunda vuelta: ceñí de nuevo", pos: [0, -210] },
      { short: "1a", name: "Boya 1a · 2.ª vuelta", hint: OFFSET, pos: [-58, -196] },
      { short: "B3", name: "Boya 3 · 2.ª vuelta", hint: "Última popa: ¡asimétrico!", pos: [-8, 50] },
    ],
    wind: { shift: [0.3, 12, 0.13, 4.7], strength: 0.86 },
    gusts: { count: 5, boost: 1.45, drift: 4.2 },
    current: [-0.25, 0.2],
    waveAmp: 0.26,
    palette: {
      zenith: "#1356ae",
      horizon: "#cdeafb",
      mid: "#6cb0ec",
      haze: "#eef8ff",
      sun: "#fffaf0",
      sunElevation: 50,
      sunAzimuth: -20,
      water: "#03264b",
      waterScatter: "#16a2c6",
      cloudiness: 0.12,
    },
    coast: "riviera",
  },
];

export const DEFAULT_COURSE: CourseId = "mdp";

export function getCourse(id: CourseId) {
  return COURSES.find((c) => c.id === id) ?? COURSES[0];
}
