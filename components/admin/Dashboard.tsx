"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { usePanel } from "./PanelProvider";
import { ADMIN_PAGES, SECTIONS } from "@/lib/admin-schema";
import { longRange, newsDate, splitEvents } from "@/lib/dates";
import type { Activity } from "@/lib/github";
import { CONTENT_FILE } from "@/lib/panel-config";
import { asset } from "@/lib/paths";
import { findPending } from "@/lib/pending";

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export default function Dashboard() {
  const { user, content, gh, deploy } = usePanel();
  const [activity, setActivity] = useState<Activity[] | null>(null);
  // se recarga después de cada publicación
  useEffect(() => {
    let alive = true;
    gh.activity(CONTENT_FILE, 8)
      .then((a) => alive && setActivity(a))
      .catch(() => alive && setActivity([]));
    return () => {
      alive = false;
    };
  }, [gh, deploy.kind]);
  const pending = findPending(content);
  const { upcoming } = splitEvents(content.events);
  const nextEvent = upcoming.find((e) => e.start) ?? upcoming[0];
  const latestNews = [...content.news].sort((a, b) => b.date.localeCompare(a.date))[0];
  const name = user.charAt(0).toUpperCase() + user.slice(1);
  const pageLabel = (slug: string) => ADMIN_PAGES.find((p) => p.slug === slug)?.label ?? slug;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="animate-rise">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Resumen</div>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">Hola, {name}</h1>
        <p className="mt-3 max-w-xl text-foam/65">Desde acá manejás todo el contenido de la web. Cuando tocás &quot;Guardar&quot;, la web se actualiza sola en uno o dos minutos.</p>
      </header>

      {/* Accesos rápidos */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/news?nuevo=1" className="admin-focus inline-flex items-center gap-2 rounded-full bg-sol px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5">
          <Icon name="plus" className="h-4 w-4" /> Nueva noticia
        </Link>
        <Link href="/admin/agenda?nuevo=1" className="admin-focus inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5">
          <Icon name="plus" className="h-4 w-4" /> Nuevo evento
        </Link>
        <a href={asset("/")} target="_blank" rel="noreferrer" className="admin-focus inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold ring-1 ring-white/20 transition hover:bg-white/10">
          Ver el sitio <Icon name="external" className="h-4 w-4" />
        </a>
      </div>

      {/* Números */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <StatCard href="/admin/agenda" label="Próximos eventos" value={upcoming.length} icon="calendar">
          {nextEvent ? (
            <>
              <span className="font-semibold text-foam/85">{nextEvent.name}</span> · {longRange(nextEvent.start, nextEvent.end)}
            </>
          ) : (
            "No hay eventos cargados."
          )}
        </StatCard>
        <StatCard href="/admin/news" label="Noticias" value={content.news.length} icon="news">
          {latestNews ? (
            <>
              Última: <span className="font-semibold text-foam/85">{latestNews.title}</span> · {newsDate(latestNews.date)}
            </>
          ) : (
            "Todavía no hay noticias."
          )}
        </StatCard>
        <StatCard href="#pendientes" label="Datos pendientes" value={pending.length} icon="alert" warn={pending.length > 0}>
          {pending.length ? "Datos que se ven como \"a confirmar\" en la web." : "¡Todo completo!"}
        </StatCard>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        {/* Pendientes */}
        <section id="pendientes" className="scroll-mt-24 rounded-[24px] bg-white/[0.03] p-6 ring-1 ring-white/10 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase">Para completar</h2>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-[11px] text-foam/60">{pending.length}</span>
          </div>
          <p className="mt-1 text-sm text-foam/55">Hacé clic en cualquiera para ir directo a cargarlo.</p>
          {pending.length === 0 ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-celeste/10 p-5 text-sm text-celeste-light ring-1 ring-celeste/20">
              <Icon name="check" /> No falta ningún dato importante.
            </div>
          ) : (
            <ul className="mt-5 max-h-[460px] space-y-2 overflow-y-auto pr-1">
              {pending.map((p) => (
                <li key={p.anchor}>
                  <Link
                    href={`/admin/${p.page}#${p.anchor}`}
                    className="admin-focus group flex items-start justify-between gap-4 rounded-2xl px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/[0.05] hover:ring-white/20"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-foam/45">
                        {pageLabel(p.page)} · {SECTIONS[p.section].title}
                      </span>
                      <span className="mt-1 block truncate font-semibold">{p.title}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.missing.map((m) => (
                          <span key={m} className="rounded-full bg-sol/10 px-2 py-0.5 text-[11px] font-semibold text-sol ring-1 ring-sol/25">
                            {m}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="mt-5 text-foam/30 transition group-hover:translate-x-0.5 group-hover:text-sol">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actividad */}
        <section className="rounded-[24px] bg-white/[0.03] p-6 ring-1 ring-white/10 lg:col-span-2">
          <h2 className="font-display text-2xl uppercase">Últimos cambios</h2>
          {activity === null ? (
            <p className="mt-4 text-sm text-foam/45">Cargando…</p>
          ) : activity.length === 0 ? (
            <p className="mt-4 text-sm text-foam/55">Todavía no se guardó nada desde el panel. Los cambios que hagas van a aparecer acá.</p>
          ) : (
            <ol className="mt-5 space-y-4">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-foam/60">
                    <Icon name="clock" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-semibold">{a.summary}</span>
                    <span className="text-foam/50">
                      {a.user.charAt(0).toUpperCase() + a.user.slice(1)} · {ago(a.at)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Secciones */}
      <section className="mt-10">
        <h2 className="font-display text-2xl uppercase">Secciones</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_PAGES.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/admin/${p.slug}`}
                className="admin-focus group flex h-full flex-col rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-celeste/15 text-celeste">
                  <Icon name={p.icon} />
                </span>
                <span className="mt-4 font-bold">{p.label}</span>
                <span className="mt-1 text-xs leading-relaxed text-foam/50">{p.sections.map((s) => SECTIONS[s].title).join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  href,
  label,
  value,
  icon,
  warn = false,
  children,
}: {
  href: string;
  label: string;
  value: number;
  icon: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="admin-focus group rounded-[24px] bg-white/[0.03] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.06]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foam/50">{label}</span>
        <span className={warn ? "text-sol" : "text-celeste"}>
          <Icon name={icon} />
        </span>
      </div>
      <div className={`mt-3 font-display text-6xl leading-none ${warn ? "text-sol" : ""}`}>{value}</div>
      <p className="mt-3 line-clamp-2 text-sm text-foam/55">{children}</p>
    </Link>
  );
}
