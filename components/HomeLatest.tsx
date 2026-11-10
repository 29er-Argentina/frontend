import Link from "next/link";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import NewsCard from "./NewsCard";
import { CalendarIcon, DateBlock } from "./EventCard";
import { getContent } from "@/lib/store";
import { longRange, splitEvents } from "@/lib/dates";

export default async function HomeLatest() {
  const { news, events } = await getContent();
  const latest = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  const { upcoming } = splitEvents(events);
  const next = upcoming.slice(0, 4);

  return (
    <section id="novedades" className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-celeste/10 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          index="02"
          kicker="Novedades"
          title={
            <>
              Lo último <br />
              de la <span className="text-celeste">flota</span>
            </>
          }
        >
          Noticias de la clase y las próximas regatas del calendario. Para no perderte nada, seguinos también en Instagram.
        </SectionHeading>

        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          {/* Latest news */}
          <div className="lg:col-span-8">
            <div className="mb-5 flex items-end justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-foam/50">Latest news</h3>
              <Link href="/news" className="group inline-flex items-center gap-2 text-sm font-bold text-white">
                Todas las noticias <span className="text-sol transition group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {latest.map((n, i) => (
                <Reveal key={n.slug} delay={i * 100} className="h-full">
                  <NewsCard item={n} />
                </Reveal>
              ))}
            </div>
          </div>

          {/* Próximos eventos */}
          <Reveal delay={160} className="lg:col-span-4">
            <div className="mb-5 flex items-end justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-foam/50">Events</h3>
            </div>
            <div className="flex h-[calc(100%-2.75rem)] flex-col rounded-[24px] bg-gradient-to-b from-tide to-navy p-6 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-sol text-ink">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div className="font-display text-3xl uppercase leading-none">
                  Próximos
                  <br />
                  eventos
                </div>
              </div>
              <ol className="mt-6 flex-1 divide-y divide-white/10">
                {next.length === 0 && <li className="py-4 text-sm text-foam/60">Pronto publicamos el calendario de la temporada.</li>}
                {next.map((e) => (
                  <li key={e.id} className="flex items-center gap-4 py-4">
                    <DateBlock e={e} compact />
                    <div className="min-w-0">
                      <div className="font-display text-xl uppercase leading-tight">{e.name}</div>
                      <div className="mt-1 truncate text-xs text-foam/55">
                        {e.start ? longRange(e.start, e.end) : "Fecha a confirmar"}
                        {e.place ? ` · ${e.place}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/agenda"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-celeste"
              >
                Ver la agenda completa <span>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
