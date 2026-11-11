import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import type { DocItem } from "@/lib/content";
import { asset } from "@/lib/paths";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "Información",
  description: "Estatuto de la clase 29er Argentina, reglas de la clase 29er y Reglamento de Regatas a Vela de World Sailing.",
};

export default async function InformacionPage() {
  const { docs: DOCS, general: LINKS } = await getContent();
  return (
    <>
      <PageHeader
        index="05"
        kicker="Información"
        sail="WS"
        title={
          <>
            Reglas <br />y <span className="text-celeste">documentos</span>
          </>
        }
        intro="Los documentos que todo tripulante de 29er tiene que conocer: cómo se organiza la clase, qué dice la regla de medición y cómo se corre una regata."
        links={DOCS.map((d) => ({ href: `#${d.id}`, label: d.title }))}
      />

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <ol className="space-y-5">
          {DOCS.map((d, i) => (
            <Reveal as="li" key={d.id} delay={i * 80}>
              <div id={d.id} className="scroll-mt-28">
                <DocRow doc={d} n={i + 1} />
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-10 flex flex-col items-start justify-between gap-6 rounded-[24px] bg-white/[0.03] p-8 ring-1 ring-white/10 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl uppercase">¿Tenés una duda de reglamento?</h2>
            <p className="mt-2 text-sm text-foam/65">Escribinos y te ayudamos a encontrar la regla que buscás.</p>
          </div>
          <a
            href={`mailto:${LINKS.email}?subject=${encodeURIComponent("Consulta de reglamento")}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-ink transition hover:bg-celeste"
          >
            Consultar →
          </a>
        </Reveal>
      </section>
    </>
  );
}

function DocRow({ doc, n }: { doc: DocItem; n: number }) {
  const available = Boolean(doc.url);
  const external = /^https?:/.test(doc.url);
  const Wrapper = available ? "a" : "div";
  return (
    <Wrapper
      {...(available ? { href: asset(doc.url), target: "_blank", rel: "noreferrer" } : {})}
      className={`group grid items-center gap-6 rounded-[24px] p-6 ring-1 transition sm:grid-cols-[auto_1fr_auto] sm:gap-8 sm:p-8 ${
        available ? "bg-white/[0.04] ring-white/10 hover:bg-white/[0.07] hover:ring-white/25" : "bg-transparent ring-white/10"
      }`}
    >
      <PdfIcon n={n} muted={!available} />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-celeste">{doc.source}</div>
        <h2 className="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl">{doc.title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foam/65">{doc.text}</p>
      </div>
      {available ? (
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-sol px-5 py-3 text-sm font-bold text-ink transition group-hover:-translate-y-0.5 sm:self-center">
          {external ? "Ver en el sitio oficial ↗" : "Abrir PDF ↓"}
        </span>
      ) : (
        <span className="inline-flex items-center self-start rounded-full px-5 py-3 text-sm text-foam/45 ring-1 ring-white/10 sm:self-center">PDF próximamente</span>
      )}
    </Wrapper>
  );
}

function PdfIcon({ n, muted }: { n: number; muted: boolean }) {
  return (
    <div className={`relative h-24 w-20 shrink-0 transition group-hover:-rotate-3 ${muted ? "opacity-50" : ""}`} aria-hidden>
      <svg viewBox="0 0 80 96" className="h-full w-full">
        <path d="M6 4h48l20 20v66a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="#eef5fb" />
        <path d="M54 4v18a2 2 0 0 0 2 2h18" fill="#88d0ee" />
        {[40, 48, 56, 64].map((y) => (
          <rect key={y} x="14" y={y} width={y === 64 ? 30 : 48} height="3" rx="1.5" fill="#12304f" opacity=".35" />
        ))}
        <rect x="0" y="72" width="44" height="16" rx="3" fill="#faaf40" />
        <text x="22" y="84" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="700" fontSize="10" fill="#040b15">
          PDF
        </text>
      </svg>
      <span className="absolute right-2 top-7 font-display text-xl text-tide">{n}</span>
    </div>
  );
}
