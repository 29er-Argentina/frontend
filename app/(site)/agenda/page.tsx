import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import EventCard, { CalendarIcon } from "@/components/EventCard";
import Reveal from "@/components/Reveal";
import { getContent } from "@/lib/store";
import { splitEvents } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Calendario de regatas de la clase 29er en Argentina: fechas, clubes y links de inscripción.",
};


// las regatas pasan a "Anteriores" según la fecha: se recalcula cada hora

export default async function AgendaPage() {
  const { events } = await getContent();
  const { upcoming, past } = splitEvents(events);
  return (
    <>
      <PageHeader
        index="01"
        kicker="Agenda"
        sail="ARG"
        title={
          <>
            Calendario <br />
            de <span className="text-sol">regatas</span>
          </>
        }
        intro="Todas las fechas de la temporada con su club y el link al aviso de regata. Agendalas en tu celular con un toque o imprimí el calendario para la pizarra del club."
        links={[
          { href: "#proximas", label: "Próximas" },
          { href: "#imprimir", label: "Calendario para imprimir" },
          ...(past.length ? [{ href: "#anteriores", label: "Anteriores" }] : []),
        ]}
      />

      <section id="proximas" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
        <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
          <h2 className="font-display text-3xl uppercase sm:text-4xl">Próximas</h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-foam/50">{upcoming.length} eventos</span>
        </div>
        <ol className="mt-8 space-y-4">
          {upcoming.map((e, i) => (
            <Reveal as="li" key={e.id} delay={i * 70}>
              <EventCard e={e} />
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="imprimir" className="mx-auto max-w-7xl scroll-mt-28 px-5 sm:px-8">
        <Reveal>
          <Link
            href="/agenda/imprimir"
            className="group relative flex flex-col gap-8 overflow-hidden rounded-[28px] bg-gradient-to-r from-buoy to-sol p-8 text-ink sm:flex-row sm:items-center sm:justify-between sm:p-12"
          >
            <PaperStack />
            <div className="relative">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.3em]">Gratis · A4</div>
              <div className="mt-2 max-w-xl font-display text-3xl uppercase leading-[0.9] sm:text-4xl">Mirá nuestro calendario para imprimir</div>
              <p className="mt-3 max-w-md font-semibold text-ink/75">Descargalo gratis e imprimilo: todas las regatas de la temporada en una hoja.</p>
            </div>
            <span className="relative inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-ink px-6 py-4 font-bold text-white transition group-hover:gap-5 sm:self-auto">
              <CalendarIcon className="h-5 w-5" /> Descargar calendario
            </span>
          </Link>
        </Reveal>
      </section>

      {past.length > 0 && (
        <section id="anteriores" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
            <h2 className="font-display text-4xl uppercase text-outline [--outline:rgba(238,245,251,0.55)] sm:text-5xl">Anteriores</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-foam/50">{past.length} eventos</span>
          </div>
          <ol className="mt-8 space-y-4">
            {past.map((e) => (
              <li key={e.id}>
                <EventCard e={e} past />
              </li>
            ))}
          </ol>
        </section>
      )}
      {past.length === 0 && <div className="h-20" />}
    </>
  );
}

function PaperStack() {
  return (
    <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rotate-12 opacity-25" aria-hidden>
      <rect x="40" y="30" width="120" height="150" rx="6" fill="#040b15" transform="rotate(-8 100 100)" />
      <rect x="40" y="30" width="120" height="150" rx="6" fill="#eef5fb" />
      {[60, 80, 100, 120, 140].map((y) => (
        <rect key={y} x="56" y={y} width="88" height="8" rx="2" fill="#040b15" opacity=".5" />
      ))}
    </svg>
  );
}
