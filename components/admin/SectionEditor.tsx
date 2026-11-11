"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Icon from "./Icon";
import FieldInput from "./FieldInput";
import { SECTIONS, type SectionSchema } from "@/lib/admin-schema";
import type { SectionKey } from "@/lib/content";
import { asset } from "@/lib/paths";
import { usePanel } from "./PanelProvider";

type Row = Record<string, unknown>;
type Status = { kind: "idle" } | { kind: "saved" } | { kind: "error"; errors: string[] };

const isEmpty = (v: unknown) => v === "" || v === null || v === undefined || (Array.isArray(v) && v.every((x) => !String(x).trim()));

function fmtDate(v: unknown) {
  const s = String(v ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export default function SectionEditor({
  sectionKey,
  initial,
  autoNew = false,
  showTitle = true,
}: {
  sectionKey: SectionKey;
  initial: unknown;
  autoNew?: boolean;
  showTitle?: boolean;
}) {
  const schema = SECTIONS[sectionKey];
  const { saveSection } = usePanel();
  const [value, setValue] = useState<unknown>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(value) !== saved;
  const rootRef = useRef<HTMLElement>(null);

  const save = useCallback(() => {
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const res = await saveSection(sectionKey, value);
      if (res.ok) {
        setValue(res.value);
        setSaved(JSON.stringify(res.value));
        setStatus({ kind: "saved" });
      } else {
        setStatus({ kind: "error", errors: res.errors });
      }
    });
  }, [saveSection, sectionKey, value]);

  // avisar antes de cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Ctrl/Cmd + S guarda la sección que tiene el foco
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && dirty && rootRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, save]);

  // el mensaje "Guardado" se va solo
  useEffect(() => {
    if (status.kind !== "saved") return;
    const t = setTimeout(() => setStatus({ kind: "idle" }), 5000);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <section ref={rootRef} id={sectionKey} className="scroll-mt-28">
      {showTitle && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-2xl uppercase leading-none">{schema.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-foam/55">{schema.description}</p>
          </div>
          <a
            href={asset(schema.preview)}
            target="_blank"
            rel="noreferrer"
            className="admin-focus inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-foam/70 ring-1 ring-white/15 transition hover:text-white"
          >
            Ver en el sitio <Icon name="external" className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
      {!showTitle && <p className="mb-6 max-w-2xl text-sm text-foam/55">{schema.description}</p>}

      {schema.kind === "object" ? (
        <div className="grid gap-5 rounded-[24px] bg-white/[0.03] p-6 ring-1 ring-white/10 sm:grid-cols-2 sm:p-8">
          {schema.fields.map((f) => (
            <FieldInput key={f.key} field={f} value={(value as Row)[f.key]} onChange={(v) => setValue({ ...(value as Row), [f.key]: v })} />
          ))}
        </div>
      ) : (
        <ListEditor schema={schema} items={value as Row[]} onChange={setValue} autoNew={autoNew} />
      )}

      {/* Barra de guardado */}
      <div
        className={`sticky bottom-4 z-30 mt-6 transition duration-300 ${
          dirty || status.kind !== "idle" || pending ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy/95 p-3 pl-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/15 backdrop-blur-xl">
          <div className="min-w-0 text-sm">
            {status.kind === "error" ? (
              <div className="text-[#ffb48a]">
                <div className="flex items-center gap-2 font-bold">
                  <Icon name="alert" className="h-4 w-4" /> No se pudo guardar
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                  {status.errors.slice(0, 6).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : status.kind === "saved" && !dirty ? (
              <span className="flex items-center gap-2 font-semibold text-celeste-light">
                <Icon name="check" className="h-4 w-4" /> Guardado. La web se actualiza en un par de minutos.
              </span>
            ) : (
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-2 w-2 rounded-full bg-sol" /> Cambios sin guardar en {schema.title.toLowerCase()}
              </span>
            )}
          </div>
          {dirty && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Descartar los cambios sin guardar?")) {
                    setValue(JSON.parse(saved));
                    setStatus({ kind: "idle" });
                  }
                }}
                className="admin-focus rounded-full px-4 py-2.5 text-sm font-semibold text-foam/70 hover:bg-white/10 hover:text-white"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="admin-focus rounded-full bg-sol px-5 py-2.5 text-sm font-bold text-ink transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {pending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Listas -------------------------------- */

function ListEditor({ schema, items, onChange, autoNew }: { schema: SectionSchema; items: Row[]; onChange: (v: Row[]) => void; autoNew: boolean }) {
  // claves estables para React aunque se reordene la lista
  // (las iniciales son por posición para que coincidan entre servidor y navegador)
  const keys = useRef<string[]>(items.map((_, i) => `init-${i}`));
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const didAuto = useRef(false);

  if (keys.current.length !== items.length) {
    keys.current = items.map((_, i) => keys.current[i] ?? crypto.randomUUID());
  }

  const add = useCallback(() => {
    const k = crypto.randomUUID();
    keys.current = [k, ...keys.current];
    onChange([structuredClone(schema.blank ?? {}), ...items]);
    setOpen((o) => new Set(o).add(k));
    setQuery("");
  }, [items, onChange, schema.blank]);

  // "Nueva noticia" / "Nuevo evento" desde el resumen, y links directos a un ítem (#news-2)
  useEffect(() => {
    if (autoNew && !didAuto.current && new URLSearchParams(location.search).get("nuevo") === "1") {
      didAuto.current = true;
      add();
      history.replaceState(history.state, "", location.pathname);
    }
    const m = location.hash.match(new RegExp(`^#${schema.key}-(\\d+)$`));
    if (m) {
      const k = keys.current[Number(m[1])];
      if (k) {
        setOpen((o) => new Set(o).add(k));
        setTimeout(() => document.getElementById(`item-${k}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    }
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    const k = [...keys.current];
    [k[i], k[j]] = [k[j], k[i]];
    keys.current = k;
    onChange(next);
  };

  const remove = (i: number) => {
    const name = String(items[i][schema.titleField ?? ""] || `este ${schema.itemName}`);
    if (!confirm(`¿Borrar "${name}"? Se aplica cuando guardes.`)) return;
    keys.current = keys.current.filter((_, j) => j !== i);
    onChange(items.filter((_, j) => j !== i));
  };

  const duplicate = (i: number) => {
    const copy = structuredClone(items[i]);
    if (schema.idField) copy[schema.idField] = "";
    if (schema.titleField) copy[schema.titleField] = `${copy[schema.titleField] ?? ""} (copia)`;
    const k = crypto.randomUUID();
    keys.current = [...keys.current.slice(0, i + 1), k, ...keys.current.slice(i + 1)];
    onChange([...items.slice(0, i + 1), copy, ...items.slice(i + 1)]);
    setOpen((o) => new Set(o).add(k));
  };

  const toggle = (k: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => items.map((it, i) => ({ it, i })).filter(({ it }) => !q || JSON.stringify(it).toLowerCase().includes(q)),
    [items, q]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={add}
          className="admin-focus inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-celeste"
        >
          <Icon name="plus" className="h-4 w-4" /> Agregar {schema.itemName}
        </button>
        {items.length > 5 && (
          <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span className="sr-only">Buscar</span>
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foam/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="admin-input py-2.5 pl-10" />
          </label>
        )}
        <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.2em] text-foam/40">
          {items.length} {schema.itemName}
          {items.length === 1 ? "" : "s"}
        </span>
      </div>

      {items.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-white/15 p-10 text-center text-sm text-foam/50">
          Todavía no hay {schema.itemName}s. Tocá &quot;Agregar {schema.itemName}&quot; para crear el primero.
        </div>
      )}

      <ol className="space-y-3">
        {visible.map(({ it, i }) => {
          const k = keys.current[i];
          const isOpen = open.has(k);
          const title = String(it[schema.titleField ?? ""] || "") || `Nuevo ${schema.itemName}`;
          const sub = schema.subtitleField ? it[schema.subtitleField] : "";
          const missing = schema.fields.filter((f) => f.important && isEmpty(it[f.key])).length;
          return (
            <li key={k} id={`item-${k}`} className={`scroll-mt-28 overflow-hidden rounded-[20px] ring-1 transition ${isOpen ? "bg-white/[0.05] ring-white/20" : "bg-white/[0.03] ring-white/10"}`}>
              <div className="flex items-center gap-2 p-2 pl-4">
                <button
                  type="button"
                  onClick={() => toggle(k)}
                  aria-expanded={isOpen}
                  className="admin-focus flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left"
                >
                  <Icon name="down" className={`h-4 w-4 shrink-0 text-foam/40 transition ${isOpen ? "rotate-180" : ""}`} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{title}</span>
                    {(sub || missing > 0) && (
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-foam/50">
                        {sub ? <span>{fmtDate(sub)}</span> : null}
                        {missing > 0 && (
                          <span className="rounded-full bg-sol/10 px-2 py-0.5 font-semibold text-sol ring-1 ring-sol/25">
                            Falta{missing > 1 ? `n ${missing} datos` : " 1 dato"}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </button>
                <div className="flex shrink-0 items-center">
                  <IconButton label="Subir" icon="up" onClick={() => move(i, -1)} disabled={i === 0 || Boolean(q)} />
                  <IconButton label="Bajar" icon="down" onClick={() => move(i, 1)} disabled={i === items.length - 1 || Boolean(q)} />
                  <IconButton label="Duplicar" icon="copy" onClick={() => duplicate(i)} />
                  <IconButton label="Borrar" icon="trash" onClick={() => remove(i)} danger />
                </div>
              </div>
              {isOpen && (
                <div className="grid gap-5 border-t border-white/10 p-5 sm:grid-cols-2 sm:p-6">
                  {schema.fields.map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      value={it[f.key]}
                      onChange={(v) => onChange(items.map((row, j) => (j === i ? { ...row, [f.key]: v } : row)))}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {q && visible.length === 0 && <p className="mt-4 text-sm text-foam/50">No hay resultados para &quot;{query}&quot;.</p>}
    </div>
  );
}

function IconButton({ label, icon, onClick, disabled, danger }: { label: string; icon: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`admin-focus grid h-9 w-9 place-items-center rounded-full text-foam/50 transition disabled:opacity-25 ${
        danger ? "hover:bg-buoy/15 hover:text-buoy" : "hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
    </button>
  );
}
