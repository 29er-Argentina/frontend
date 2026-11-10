import type { SectionKey } from "./content";

/* ------------------------------------------------------------------
 * Esquema del panel: describe cada sección editable y sus campos.
 * Lo usan el editor (para dibujar el formulario) y el servidor
 * (para validar lo que se guarda).
 * ------------------------------------------------------------------ */

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "select"
  | "image"
  | "pdf"
  | "lines" // lista de textos, uno por renglón
  | "paragraphs"; // párrafos separados por una línea en blanco

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Si está vacío, aparece en "Pendientes" del panel. */
  important?: boolean;
  max?: number;
  /** Ocupa todo el ancho en el formulario. */
  wide?: boolean;
};

export type SectionSchema = {
  key: SectionKey;
  title: string;
  description: string;
  kind: "object" | "list";
  fields: Field[];
  /** Solo listas */
  itemName?: string;
  /** Campo que se usa como título de cada ítem de la lista */
  titleField?: string;
  subtitleField?: string;
  /** Campo identificador que se genera solo a partir del título */
  idField?: string;
  /** Ítem nuevo vacío */
  blank?: Record<string, unknown>;
  /** Página pública donde se ve la sección */
  preview: string;
};

const EVENT_KINDS = [
  { value: "nacional", label: "Nacional" },
  { value: "sudamericano", label: "Sudamericano" },
  { value: "mundial", label: "Mundial" },
  { value: "local", label: "Local" },
];

export const SECTIONS: Record<SectionKey, SectionSchema> = {
  events: {
    key: "events",
    title: "Eventos",
    description: "Las regatas del calendario. Los eventos pasan solos a \"Anteriores\" cuando termina su fecha.",
    kind: "list",
    itemName: "evento",
    titleField: "name",
    subtitleField: "start",
    idField: "id",
    preview: "/agenda",
    blank: { id: "", name: "", start: "", end: "", place: "", club: "", link: "", kind: "nacional" },
    fields: [
      { key: "name", label: "Nombre del evento", type: "text", required: true, wide: true, max: 120 },
      { key: "start", label: "Fecha de inicio", type: "date", important: true, help: "Dejala vacía si todavía no está confirmada." },
      { key: "end", label: "Fecha de fin", type: "date", help: "Opcional, para eventos de varios días." },
      { key: "kind", label: "Tipo", type: "select", options: EVENT_KINDS },
      { key: "place", label: "Lugar", type: "text", placeholder: "San Fernando, Buenos Aires", max: 120 },
      { key: "club", label: "Club organizador", type: "text", important: true, max: 120 },
      { key: "link", label: "Link (aviso de regata o inscripción)", type: "url", important: true, wide: true },
    ],
  },

  news: {
    key: "news",
    title: "Noticias",
    description: "Las noticias de la sección News. Las dos más nuevas aparecen también en el inicio.",
    kind: "list",
    itemName: "noticia",
    titleField: "title",
    subtitleField: "date",
    idField: "slug",
    preview: "/news",
    blank: { slug: "", title: "", date: "", tag: "", excerpt: "", body: [], image: "" },
    fields: [
      { key: "title", label: "Titular", type: "text", required: true, wide: true, max: 140 },
      { key: "date", label: "Fecha", type: "date", required: true },
      { key: "tag", label: "Etiqueta", type: "text", placeholder: "Regata, Clase, Mundial…", max: 30 },
      { key: "excerpt", label: "Bajada", type: "textarea", help: "Una o dos oraciones que resumen la nota.", wide: true, max: 300 },
      { key: "body", label: "Texto de la nota", type: "paragraphs", help: "Separá los párrafos con una línea en blanco.", wide: true, max: 20000 },
      { key: "image", label: "Foto de portada", type: "image", help: "Opcional. Sin foto se dibuja una portada con velas.", wide: true },
    ],
  },

  boats: {
    key: "boats",
    title: "Barcos",
    description: "La planilla de barcos usados y los datos del astillero.",
    kind: "object",
    preview: "/barcos",
    fields: [
      { key: "usedSheet", label: "Link a la hoja de cálculo de usados", type: "url", important: true, wide: true, help: "Por ejemplo, un Google Sheets compartido como \"cualquiera con el link\"." },
      { key: "shipyardName", label: "Nombre del astillero", type: "text", required: true, max: 60 },
      { key: "contactName", label: "Persona de contacto", type: "text", important: true, max: 80 },
      { key: "phone", label: "Teléfono / WhatsApp", type: "tel", important: true, placeholder: "+54 9 11 1234 5678" },
      { key: "email", label: "Mail", type: "email", important: true },
      { key: "web", label: "Web", type: "url" },
      { key: "shipyardText", label: "Descripción", type: "textarea", wide: true, max: 400 },
      { key: "shipyardServices", label: "Servicios", type: "lines", help: "Uno por renglón.", wide: true },
    ],
  },

  membership: {
    key: "membership",
    title: "Tipos de anualidad",
    description: "Las modalidades de anualidad y sus valores.",
    kind: "list",
    itemName: "anualidad",
    titleField: "name",
    idField: "id",
    preview: "/anualidad",
    blank: { id: "", name: "", share: 100, price: null, text: "", perks: [] },
    fields: [
      { key: "name", label: "Nombre", type: "text", required: true, max: 60 },
      { key: "share", label: "Porcentaje de la cuota", type: "number", help: "100 para la completa, 50 para la mitad." },
      { key: "price", label: "Valor en pesos", type: "number", important: true, help: "Vacío = \"consultá con tesorería\"." },
      { key: "text", label: "Descripción", type: "textarea", wide: true, max: 400 },
      { key: "perks", label: "Puntos destacados", type: "lines", help: "Uno por renglón.", wide: true },
    ],
  },

  treasurer: {
    key: "treasurer",
    title: "Tesorería",
    description: "Contacto para pagar la anualidad. Si no hay mail, se usa el mail general de la clase.",
    kind: "object",
    preview: "/anualidad#tesorero",
    fields: [
      { key: "name", label: "Nombre del tesorero/a", type: "text", important: true, max: 80 },
      { key: "email", label: "Mail", type: "email", important: true },
      { key: "phone", label: "Teléfono", type: "tel" },
    ],
  },

  docs: {
    key: "docs",
    title: "Documentos",
    description: "Estatuto, reglas y reglamentos. Podés subir un PDF o pegar un link.",
    kind: "list",
    itemName: "documento",
    titleField: "title",
    subtitleField: "source",
    idField: "id",
    preview: "/informacion",
    blank: { id: "", title: "", text: "", source: "", url: "" },
    fields: [
      { key: "title", label: "Título", type: "text", required: true, max: 80 },
      { key: "source", label: "Fuente", type: "text", placeholder: "World Sailing", max: 80 },
      { key: "text", label: "Descripción", type: "textarea", wide: true, max: 400 },
      { key: "url", label: "Documento (PDF o link)", type: "pdf", important: true, wide: true },
    ],
  },

  clubs: {
    key: "clubs",
    title: "Clubes asociados",
    description: "Los clubes que forman parte de la clase.",
    kind: "list",
    itemName: "club",
    titleField: "short",
    subtitleField: "name",
    idField: "id",
    preview: "/nosotros#clubes",
    blank: { id: "", short: "", name: "", venues: [], contact: "", web: "" },
    fields: [
      { key: "short", label: "Sigla", type: "text", required: true, placeholder: "YCA", max: 12 },
      { key: "name", label: "Nombre completo", type: "text", required: true, max: 100 },
      { key: "venues", label: "Sedes", type: "lines", important: true, help: "Una por renglón.", wide: true },
      { key: "contact", label: "Contacto", type: "text", important: true, help: "Mail, teléfono o nombre." },
      { key: "web", label: "Web", type: "url" },
    ],
  },

  board: {
    key: "board",
    title: "Comisión directiva",
    description: "Los cargos y quiénes los ocupan.",
    kind: "list",
    itemName: "cargo",
    titleField: "role",
    subtitleField: "name",
    preview: "/nosotros#comision",
    blank: { role: "", name: "" },
    fields: [
      { key: "role", label: "Cargo", type: "text", required: true, max: 40 },
      { key: "name", label: "Nombre", type: "text", important: true, max: 80 },
    ],
  },

  home: {
    key: "home",
    title: "Textos del inicio",
    description: "Los textos de la portada.",
    kind: "object",
    preview: "/",
    fields: [
      { key: "heroKicker", label: "Línea sobre el título", type: "text", wide: true, max: 80 },
      { key: "heroIntro", label: "Texto debajo del título", type: "textarea", wide: true, max: 300 },
      { key: "boatIntro", label: "Descripción del barco", type: "textarea", wide: true, max: 600 },
    ],
  },

  specs: {
    key: "specs",
    title: "Ficha técnica",
    description: "Las medidas del barco que se muestran en el inicio y en Barcos.",
    kind: "list",
    itemName: "medida",
    titleField: "label",
    preview: "/#clase",
    blank: { label: "", value: null, decimals: 0, unit: "" },
    fields: [
      { key: "label", label: "Medida", type: "text", required: true, max: 30 },
      { key: "value", label: "Valor", type: "number", required: true },
      { key: "unit", label: "Unidad", type: "text", max: 6 },
      { key: "decimals", label: "Decimales a mostrar", type: "number" },
    ],
  },

  features: {
    key: "features",
    title: "Características",
    description: "Las cuatro tarjetas debajo de la ficha técnica.",
    kind: "list",
    itemName: "característica",
    titleField: "title",
    preview: "/#clase",
    blank: { title: "", text: "" },
    fields: [
      { key: "title", label: "Título", type: "text", required: true, max: 40 },
      { key: "text", label: "Texto", type: "textarea", wide: true, max: 240 },
    ],
  },

  general: {
    key: "general",
    title: "Contacto y redes",
    description: "Datos de contacto que aparecen en todo el sitio.",
    kind: "object",
    preview: "/",
    fields: [
      { key: "email", label: "Mail de la clase", type: "email", required: true },
      { key: "instagram", label: "Instagram", type: "url", required: true },
      { key: "taplink", label: "Taplink", type: "url" },
      { key: "mediaManagerHandle", label: "Media manager (usuario)", type: "text", placeholder: "@usuario" },
      { key: "mediaManagerUrl", label: "Media manager (link)", type: "url" },
      { key: "classSite", label: "Sitio de la clase internacional", type: "url" },
    ],
  },
};

/** Páginas del panel y qué secciones edita cada una. */
export const ADMIN_PAGES = [
  { slug: "agenda", label: "Agenda", sections: ["events"] as SectionKey[], icon: "calendar" },
  { slug: "news", label: "News", sections: ["news"] as SectionKey[], icon: "news" },
  { slug: "barcos", label: "Barcos", sections: ["boats"] as SectionKey[], icon: "boat" },
  { slug: "anualidad", label: "Anualidad", sections: ["membership", "treasurer"] as SectionKey[], icon: "card" },
  { slug: "informacion", label: "Información", sections: ["docs"] as SectionKey[], icon: "doc" },
  { slug: "nosotros", label: "Nosotros", sections: ["clubs", "board"] as SectionKey[], icon: "people" },
  { slug: "inicio", label: "Inicio", sections: ["home", "specs", "features"] as SectionKey[], icon: "home" },
  { slug: "general", label: "Contacto y redes", sections: ["general"] as SectionKey[], icon: "link" },
] as const;

export const pageForSection = (key: SectionKey) => ADMIN_PAGES.find((p) => p.sections.includes(key))!;
