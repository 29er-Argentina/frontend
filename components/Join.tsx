import Link from "next/link";
import Reveal from "./Reveal";
import { getContent } from "@/lib/store";
import { InstagramIcon } from "./Nav";

const STEPS = [
  { n: "01", title: "Escribinos", text: "Mandanos un mail o un mensaje por Instagram contándonos tu experiencia y desde dónde navegás." },
  { n: "02", title: "Conocé el barco", text: "Te contamos cómo probar un 29er, dónde entrenan los equipos y qué necesitás para arrancar." },
  { n: "03", title: "Sumate a la flota", text: "Pagá tu anualidad y anotate en las regatas: nacionales, Sudamericano y Mundial." },
];

export default async function Join() {
  const { general: LINKS } = await getContent();
  return (
    <section id="sumate" className="relative overflow-hidden bg-celeste text-ink">
      <div className="pointer-events-none absolute -bottom-24 left-0 right-0 select-none text-center font-display text-[19vw] uppercase leading-none text-white/25">
        29er
      </div>
      <div className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 sm:py-36">
        <Reveal>
          <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.3em] text-navy/70">
            <span>04</span>
            <span className="h-px w-10 bg-navy/40" />
            Sumate
          </div>
          <h2 className="mt-5 max-w-4xl font-display text-[clamp(2rem,5.2vw,4.6rem)] uppercase leading-[0.86]">
            ¿Querés navegar en <span className="text-white [text-shadow:0_2px_0_rgba(11,29,51,0.25)]">29er?</span>
          </h2>
        </Reveal>

        <ol className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 100} className="rounded-[28px] bg-white/55 p-8 backdrop-blur-sm ring-1 ring-navy/10">
              <div className="font-display text-5xl text-navy/25">{s.n}</div>
              <h3 className="mt-6 font-display text-2xl uppercase">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-navy/80">{s.text}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-14 flex flex-wrap items-center gap-4">
          <a
            href={`mailto:${LINKS.email}?subject=${encodeURIComponent("Quiero navegar en 29er")}`}
            className="inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(4,11,21,0.8)]"
          >
            {LINKS.email} <span>→</span>
          </a>
          <a
            href={LINKS.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-ink transition hover:-translate-y-0.5"
          >
            <InstagramIcon className="h-5 w-5" /> Escribinos por DM
          </a>
          <Link href="/anualidad" className="inline-flex items-center gap-2 px-3 py-4 font-bold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            Ver la anualidad →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
