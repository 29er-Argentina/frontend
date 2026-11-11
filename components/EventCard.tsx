import type { EventItem } from "@/lib/content";
import { icsHref, longRange, monthShort, parts } from "@/lib/dates";

const KIND: Record<EventItem["kind"], { label: string; color: string }> = {
  mundial: { label: "Mundial", color: "bg-sol text-ink" },
  sudamericano: { label: "Sudamericano", color: "bg-buoy text-ink" },
  nacional: { label: "Nacional", color: "bg-celeste text-ink" },
  local: { label: "Local", color: "bg-white/80 text-ink" },
};

/** Bloque de fecha estilo "boleto": mes / día / año. */
export function DateBlock({ e, compact = false }: { e: EventItem; compact?: boolean }) {
  if (!e.start) {
    return (
      <div className={`grid shrink-0 place-items-center rounded-2xl border border-dashed border-white/25 text-center ${compact ? "h-[72px] w-[72px]" : "h-28 w-24 sm:w-28"}`}>
        <span className="font-mono text-[10px] uppercase leading-tight tracking-[0.2em] text-foam/55">
          Fecha
          <br />a conf.
        </span>
      </div>
    );
  }
  const { d, y } = parts(e.start);
  const endDay = e.end ? parts(e.end).d : null;
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-2xl bg-foam text-ink ${compact ? "h-[72px] w-[72px]" : "h-28 w-24 sm:w-28"}`}
    >
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-tide">{monthShort(e.start)}</span>
      <span className={`font-display leading-none ${compact ? "text-2xl" : "text-4xl"}`}>
        {d}
        {endDay && endDay !== d && !compact && <span className="text-2xl text-tide/60">–{endDay}</span>}
      </span>
      <span className="font-mono text-[10px] text-tide/70">{y}</span>
    </div>
  );
}

export default function EventCard({ e, past = false }: { e: EventItem; past?: boolean }) {
  const ics = icsHref(e);
  const kind = KIND[e.kind];
  return (
    <article
      className={`group relative flex flex-col gap-5 rounded-[24px] p-5 ring-1 transition sm:flex-row sm:items-center sm:gap-7 sm:p-6 ${
        past ? "bg-transparent ring-white/10" : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.07] hover:ring-white/20"
      }`}
    >
      <div className={past ? "opacity-60 grayscale" : ""}>
        <DateBlock e={e} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${kind.color}`}>{kind.label}</span>
          {past && <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foam/40">Finalizado</span>}
        </div>
        <h3 className="mt-2.5 font-display text-xl uppercase leading-none sm:text-2xl">{e.name}</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-foam/65 sm:grid-cols-[auto_1fr]">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foam/40 sm:pt-1">Cuándo</dt>
          <dd>{e.start ? longRange(e.start, e.end) : "A confirmar"}</dd>
          {e.place && (
            <>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foam/40 sm:pt-1">Dónde</dt>
              <dd>{e.place}</dd>
            </>
          )}
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foam/40 sm:pt-1">Club</dt>
          <dd>{e.club || "A confirmar"}</dd>
        </dl>
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
        {e.link ? (
          <a
            href={e.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-celeste"
          >
            Ver evento <span>↗</span>
          </a>
        ) : (
          <span className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm text-foam/45 ring-1 ring-white/10">Link pronto</span>
        )}
        {ics && !past && (
          <a
            href={ics}
            download={`${e.id}.ics`}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-foam/85 ring-1 ring-white/20 transition hover:bg-white/10 hover:text-white"
          >
            <CalendarIcon className="h-4 w-4" /> Agendar
          </a>
        )}
      </div>
    </article>
  );
}

export function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  );
}
