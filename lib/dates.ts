import type { EventItem } from "./content";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-07-02" → {y, m (0-11), d}. Sin zona horaria para evitar corrimientos. */
export function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

export const monthShort = (iso: string) => MONTHS[parts(iso).m];
export const monthLong = (m: number) => MONTHS_LONG[m];

/** "2 al 9 de julio de 2026", "15 de noviembre de 2026", "30 de junio al 2 de julio de 2026". */
export function longRange(start: string, end?: string) {
  if (!start) return "A confirmar";
  const a = parts(start);
  if (!end || end === start) return `${a.d} de ${MONTHS_LONG[a.m]} de ${a.y}`;
  const b = parts(end);
  if (a.y === b.y && a.m === b.m) return `${a.d} al ${b.d} de ${MONTHS_LONG[a.m]} de ${a.y}`;
  if (a.y === b.y) return `${a.d} de ${MONTHS_LONG[a.m]} al ${b.d} de ${MONTHS_LONG[b.m]} de ${a.y}`;
  return `${a.d} de ${MONTHS_LONG[a.m]} de ${a.y} al ${b.d} de ${MONTHS_LONG[b.m]} de ${b.y}`;
}

export function newsDate(iso: string) {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m]} ${y}`;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Próximos: sin fecha (a confirmar) o que todavía no terminaron. Ordenados por fecha, los "a confirmar" al final. */
export function splitEvents(events: EventItem[], now = today()) {
  const upcoming = events
    .filter((e) => !e.start || (e.end || e.start) >= now)
    .sort((a, b) => (a.start || "9999").localeCompare(b.start || "9999"));
  const past = events.filter((e) => e.start && (e.end || e.start) < now).sort((a, b) => b.start.localeCompare(a.start));
  return { upcoming, past };
}

/** Archivo .ics como data URI para "Agregar a mi calendario". */
export function icsHref(e: EventItem) {
  if (!e.start) return null;
  const compact = (iso: string) => iso.replaceAll("-", "");
  const endExclusive = (() => {
    const { y, m, d } = parts(e.end || e.start);
    const dt = new Date(Date.UTC(y, m, d + 1));
    return dt.toISOString().slice(0, 10);
  })();
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//29er Argentina//Agenda//ES",
    "BEGIN:VEVENT",
    `UID:${e.id}@29erargentina`,
    `DTSTAMP:${compact(e.start)}T000000Z`,
    `DTSTART;VALUE=DATE:${compact(e.start)}`,
    `DTEND;VALUE=DATE:${compact(endExclusive)}`,
    `SUMMARY:${esc(e.name)}`,
    e.place ? `LOCATION:${esc(e.place)}` : "",
    e.link ? `URL:${e.link}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
