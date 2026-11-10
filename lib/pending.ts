import { ADMIN_PAGES, SECTIONS } from "./admin-schema";
import type { SectionKey, SiteContent } from "./content";

export type PendingItem = { section: SectionKey; page: string; anchor: string; title: string; missing: string[] };

const empty = (v: unknown) => v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0);

/** Campos importantes vacíos en todo el sitio, para la lista de "Pendientes" del panel. */
export function findPending(content: SiteContent): PendingItem[] {
  const out: PendingItem[] = [];
  for (const page of ADMIN_PAGES) {
    for (const key of page.sections) {
      const schema = SECTIONS[key];
      const important = schema.fields.filter((f) => f.important);
      if (!important.length) continue;
      const value = content[key] as unknown;
      if (schema.kind === "object") {
        const missing = important.filter((f) => empty((value as Record<string, unknown>)[f.key])).map((f) => f.label);
        if (missing.length) out.push({ section: key, page: page.slug, anchor: key, title: schema.title, missing });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        (value as Record<string, unknown>[]).forEach((item, i) => {
          // a un evento que ya terminó no tiene sentido completarle datos
          if (key === "events" && item.start && String(item.end || item.start) < today) return;
          const missing = important.filter((f) => empty(item[f.key])).map((f) => f.label);
          if (missing.length)
            out.push({
              section: key,
              page: page.slug,
              anchor: `${key}-${i}`,
              title: String(item[schema.titleField ?? ""] || `${schema.itemName} ${i + 1}`),
              missing,
            });
        });
      }
    }
  }
  return out;
}
