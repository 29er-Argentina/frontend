import type { Field, SectionSchema } from "./admin-schema";

/* Valida y normaliza lo que llega del panel según el esquema de la sección. */

const UPLOAD_URL = /^\/uploads\/[a-z0-9-]{1,80}\.(jpg|png|webp|pdf)$/;
const HTTP_URL = /^https?:\/\/[^\s<>"']+$/i;
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const TEL = /^[0-9+()\-\s]{6,30}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const clean = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\r\n?/g, "\n");

function str(v: unknown) {
  return typeof v === "string" ? clean(v).trim() : typeof v === "number" ? String(v) : "";
}

function validDate(s: string) {
  if (!DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

type Result = { value: unknown; error?: string };

function field(f: Field, raw: unknown): Result {
  const max = f.max ?? (f.type === "textarea" ? 2000 : f.type === "paragraphs" ? 20000 : 300);
  switch (f.type) {
    case "text":
    case "textarea": {
      const s = str(raw).slice(0, max);
      return { value: f.type === "text" ? s.replace(/\n+/g, " ") : s };
    }
    case "url": {
      const s = str(raw);
      if (!s || HTTP_URL.test(s) || UPLOAD_URL.test(s)) return { value: s };
      return { value: "", error: "tiene que ser un link que empiece con https://" };
    }
    case "pdf":
    case "image": {
      const s = str(raw);
      if (!s || UPLOAD_URL.test(s) || HTTP_URL.test(s)) return { value: s };
      return { value: "", error: "el archivo o link no es válido" };
    }
    case "email": {
      const s = str(raw).toLowerCase();
      if (!s || EMAIL.test(s)) return { value: s };
      return { value: "", error: "no parece un mail válido" };
    }
    case "tel": {
      const s = str(raw);
      if (!s || TEL.test(s)) return { value: s };
      return { value: "", error: "solo números, espacios, +, guiones y paréntesis" };
    }
    case "date": {
      const s = str(raw);
      if (!s || validDate(s)) return { value: s };
      return { value: "", error: "la fecha no es válida" };
    }
    case "number": {
      if (raw === null || raw === undefined || str(raw) === "") return { value: null };
      const n = Number(str(raw).replace(",", "."));
      if (!Number.isFinite(n) || Math.abs(n) > 1e12) return { value: null, error: "tiene que ser un número" };
      return { value: n };
    }
    case "select": {
      const s = str(raw);
      const ok = f.options?.some((o) => o.value === s);
      return { value: ok ? s : (f.options?.[0]?.value ?? "") };
    }
    case "lines": {
      const arr = Array.isArray(raw) ? raw : str(raw).split("\n");
      return {
        value: arr
          .map((x) => str(x).replace(/\n+/g, " ").slice(0, 200))
          .filter(Boolean)
          .slice(0, 40),
      };
    }
    case "paragraphs": {
      const arr = Array.isArray(raw) ? raw : str(raw).split(/\n\s*\n/);
      let total = 0;
      return {
        value: arr
          .map((x) => str(x))
          .filter(Boolean)
          .filter((p) => (total += p.length) <= max)
          .slice(0, 100),
      };
    }
  }
}

const isEmpty = (v: unknown) => v === "" || v === null || (Array.isArray(v) && v.length === 0);

function object(schema: SectionSchema, raw: unknown, label: string, errors: string[]) {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const f of schema.fields) {
    const r = field(f, src[f.key]);
    if (r.error) errors.push(`${label}${f.label}: ${r.error}.`);
    else if (f.required && isEmpty(r.value)) errors.push(`${label}${f.label}: es obligatorio.`);
    out[f.key] = r.value;
  }
  return out;
}

export function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

export function sanitizeSection(schema: SectionSchema, raw: unknown): { value?: unknown; errors: string[] } {
  const errors: string[] = [];

  if (schema.kind === "object") {
    const value = object(schema, raw, "", errors);
    return errors.length ? { errors } : { value, errors };
  }

  if (!Array.isArray(raw)) return { errors: ["Formato inválido."] };
  if (raw.length > 300) return { errors: ["Demasiados ítems."] };

  const used = new Set<string>();
  const items = raw.map((item, i) => {
    const out = object(schema, item, `${schema.itemName ?? "Ítem"} ${i + 1} · `, errors);
    if (schema.idField) {
      const src = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      // el id existente se conserva (así no se rompen los links); si falta, se genera del título
      let id = slugify(str(src[schema.idField]) || str(out[schema.titleField ?? ""]));
      const base = id;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      out[schema.idField] = id;
    }
    if (schema.key === "events" && out.start && out.end && String(out.end) < String(out.start)) {
      errors.push(`${schema.itemName} ${i + 1} · La fecha de fin es anterior a la de inicio.`);
    }
    return out;
  });
  return errors.length ? { errors } : { value: items, errors };
}
