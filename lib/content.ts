/* ------------------------------------------------------------------
 * Tipos del contenido del sitio y navegación fija.
 * El contenido se edita desde el panel (/admin) y se guarda en
 * data/content.json. Los valores iniciales están en lib/defaults.ts.
 * Un texto vacío ("") se muestra como "a confirmar" en la página.
 * ------------------------------------------------------------------ */

export type General = {
  instagram: string;
  taplink: string;
  email: string;
  mediaManagerHandle: string;
  mediaManagerUrl: string;
  classSite: string;
};

export type Home = {
  heroKicker: string;
  heroIntro: string;
  boatIntro: string;
};

export type Spec = { label: string; value: number | null; decimals: number | null; unit: string };
export type Feature = { title: string; text: string };

export type EventKind = "mundial" | "sudamericano" | "nacional" | "local";
export type EventItem = {
  id: string;
  name: string;
  /** AAAA-MM-DD. Vacío = fecha a confirmar. */
  start: string;
  end: string;
  place: string;
  club: string;
  /** Aviso de regata, inscripción o web del evento. */
  link: string;
  kind: EventKind;
};

export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  tag: string;
  excerpt: string;
  body: string[];
  /** Foto de portada. Vacía = portada gráfica generada. */
  image: string;
};

export type Boats = {
  usedSheet: string;
  shipyardName: string;
  shipyardText: string;
  shipyardServices: string[];
  contactName: string;
  phone: string;
  email: string;
  web: string;
};

export type MembershipItem = {
  id: string;
  name: string;
  share: number | null;
  /** Monto en pesos. Vacío = consultá con tesorería. */
  price: number | null;
  text: string;
  perks: string[];
};

export type Treasurer = { name: string; email: string; phone: string };

export type DocItem = { id: string; title: string; text: string; source: string; url: string };

export type Club = { id: string; short: string; name: string; venues: string[]; contact: string; web: string };

export type BoardMember = { role: string; name: string };

export type SiteContent = {
  general: General;
  home: Home;
  specs: Spec[];
  features: Feature[];
  events: EventItem[];
  news: NewsItem[];
  boats: Boats;
  membership: MembershipItem[];
  treasurer: Treasurer;
  docs: DocItem[];
  clubs: Club[];
  board: BoardMember[];
};

export type SectionKey = keyof SiteContent;

/* ----------------------------- Navegación ----------------------------- */

export type NavItem = { href: string; label: string; children?: { href: string; label: string; hint?: string }[] };

export const NAV: NavItem[] = [
  { href: "/", label: "Inicio" },
  { href: "/agenda", label: "Agenda" },
  {
    href: "/barcos",
    label: "Barcos",
    children: [
      { href: "/barcos#venta", label: "Venta de usados", hint: "Planilla de barcos a la venta" },
      { href: "/barcos#astillero", label: "Astillero", hint: "Barcos nuevos y repuestos" },
    ],
  },
  {
    href: "/anualidad",
    label: "Anualidad",
    children: [
      { href: "/anualidad#tipos", label: "Tipos de anualidad", hint: "Completa o 50 %" },
      { href: "/anualidad#tesorero", label: "Contacto del tesorero" },
    ],
  },
  { href: "/news", label: "News" },
  {
    href: "/informacion",
    label: "Información",
    children: [
      { href: "/informacion#estatuto", label: "Estatuto de la clase" },
      { href: "/informacion#reglas", label: "Reglas de la clase" },
      { href: "/informacion#reglamento", label: "Reglamento World Sailing" },
    ],
  },
  {
    href: "/nosotros",
    label: "Nosotros",
    children: [
      { href: "/nosotros#clubes", label: "Clubes asociados" },
      { href: "/nosotros#comision", label: "Comisión directiva" },
    ],
  },
];
