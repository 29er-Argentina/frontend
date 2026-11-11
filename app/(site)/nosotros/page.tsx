import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import Seal from "@/components/Seal";
import ContactList from "@/components/ContactList";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Clubes asociados a la clase 29er en Argentina y comisión directiva.",
};

export default async function NosotrosPage() {
  const { board: BOARD, clubs: CLUBS, general: LINKS } = await getContent();
  return (
    <>
      <PageHeader
        index="06"
        kicker="Nosotros"
        sail="29ER"
        title={
          <>
            La clase <br />
            en <span className="text-celeste">Argentina</span>
          </>
        }
        intro="Una comunidad de tripulantes, familias, entrenadores y clubes que empuja el 29er en el país, del Río de la Plata al Mundial."
        links={[
          { href: "#clubes", label: "Clubes asociados" },
          { href: "#comision", label: "Comisión directiva" },
        ]}
      />

      <section id="clubes" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
        <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
          <h2 className="font-display text-3xl uppercase sm:text-5xl">Clubes asociados</h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-foam/50">{CLUBS.length} clubes</span>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {CLUBS.map((c, i) => (
            <Reveal key={c.id} delay={i * 120} className="group relative overflow-hidden rounded-[28px] bg-white/[0.03] p-8 ring-1 ring-white/10 sm:p-10">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[9rem] leading-none text-outline [--outline:rgba(38,169,224,0.18)] transition duration-700 group-hover:-translate-x-3"
              >
                {c.short}
              </div>
              <div className="relative">
                <Burgee index={i} />
                <h3 className="mt-6 font-display text-4xl uppercase leading-none">{c.short}</h3>
                <p className="mt-2 text-foam/70">{c.name}</p>
                <div className="mt-8">
                  <ContactList
                    rows={[
                      { label: c.venues.length > 1 ? "Sedes" : "Sede", value: c.venues.join(" · ") },
                      { label: "Contacto", value: c.contact, href: c.contact.includes("@") ? `mailto:${c.contact}` : null },
                      { label: "Web", value: c.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: c.web },
                    ]}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-foam/55">
          ¿Tu club tiene flota de 29er?{" "}
          <a href={`mailto:${LINKS.email}?subject=${encodeURIComponent("Sumar club a la clase")}`} className="font-semibold text-white underline decoration-celeste underline-offset-4">
            Escribinos
          </a>{" "}
          y lo sumamos.
        </p>
      </section>

      <section id="comision" className="relative scroll-mt-28 overflow-hidden border-t border-white/10 py-20 sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-celeste/10 blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Autoridades</div>
            <h2 className="mt-4 font-display text-4xl uppercase sm:text-5xl">Comisión directiva</h2>
          </div>
          <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {BOARD.map((b, i) => (
              <Reveal as="li" key={b.role} delay={i * 90}>
                <Seal role={b.role} name={b.name} index={i} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

/** Gallardete triangular genérico (no es el escudo oficial de cada club). */
function Burgee({ index }: { index: number }) {
  const colors = [
    ["#26a9e0", "#eef5fb"],
    ["#faaf40", "#12304f"],
  ][index % 2];
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-16" aria-hidden>
      <rect x="0" y="0" width="2.5" height="40" fill="#eef5fb" opacity=".6" />
      <path d="M2.5 2 L 62 14 L 2.5 26 Z" fill={colors[0]} />
      <path d="M2.5 10 L 32 14 L 2.5 18 Z" fill={colors[1]} />
    </svg>
  );
}
