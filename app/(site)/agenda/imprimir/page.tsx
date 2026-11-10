import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { LogoMark } from "@/components/Logo";
import { getContent } from "@/lib/store";
import { longRange, monthLong, parts, splitEvents } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Calendario para imprimir",
  description: "Calendario de regatas de la clase 29er Argentina listo para imprimir o guardar como PDF.",
};


// las regatas pasan a "Anteriores" según la fecha: se recalcula cada hora

export default async function PrintableCalendar() {
  const { events, general } = await getContent();
  const { upcoming } = splitEvents(events);
  const dated = upcoming.filter((e) => e.start);
  const tbd = upcoming.filter((e) => !e.start);

  // agrupar por mes
  const groups = new Map<string, typeof dated>();
  for (const e of dated) {
    const { y, m } = parts(e.start);
    const key = `${monthLong(m)} ${y}`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const season = dated.length ? parts(dated[0].start).y : new Date().getFullYear();

  return (
    <div className="px-4 pb-24 pt-28 sm:pt-36 print:p-0">
      <div className="mx-auto mb-8 flex max-w-[210mm] flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href="/agenda" className="font-mono text-xs uppercase tracking-[0.2em] text-foam/60 hover:text-white">
          ← Volver a la agenda
        </Link>
        <PrintButton className="inline-flex items-center gap-2 rounded-full bg-sol px-6 py-3 font-bold text-ink transition hover:-translate-y-0.5">
          Imprimir o guardar PDF
        </PrintButton>
      </div>

      {/* Hoja A4 */}
      <article className="mx-auto max-w-[210mm] bg-white p-[12mm] text-ink shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-center justify-between border-b-4 border-ink pb-5">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-tide">Clase Internacional 29er · Argentina</div>
            <h1 className="mt-1 font-display text-5xl uppercase leading-none">Calendario {season}</h1>
          </div>
          <LogoMark className="h-16 w-16" />
        </header>

        {groups.size === 0 && tbd.length === 0 && <p className="py-10 text-center text-tide">Todavía no hay regatas publicadas.</p>}

        {[...groups.entries()].map(([month, items]) => (
          <section key={month} className="break-inside-avoid border-b border-ink/15 py-5">
            <h2 className="font-display text-2xl uppercase text-tide">{month}</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="w-16 py-1.5 font-display text-3xl leading-none">{parts(e.start).d}</td>
                    <td className="py-1.5">
                      <div className="font-bold">{e.name}</div>
                      <div className="text-xs text-ink/65">
                        {longRange(e.start, e.end)}
                        {e.place ? ` · ${e.place}` : ""}
                        {e.club ? ` · ${e.club}` : ""}
                      </div>
                    </td>
                    <td className="w-8 py-1.5 text-right">
                      <span className="inline-block h-5 w-5 rounded border-2 border-ink/40" aria-label="casilla para tildar" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        {tbd.length > 0 && (
          <section className="break-inside-avoid py-5">
            <h2 className="font-display text-2xl uppercase text-tide">Fecha a confirmar</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {tbd.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded border border-dashed border-ink/30 px-3 py-2">
                  <span className="font-mono text-ink/40">__/__</span>
                  <span className="font-bold">{e.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-6 flex items-center justify-between border-t-4 border-ink pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">
          <span>{general.email}</span>
          <span>@29er_argentina</span>
        </footer>
      </article>
    </div>
  );
}
