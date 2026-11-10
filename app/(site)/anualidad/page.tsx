import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import ContactList from "@/components/ContactList";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "Anualidad",
  description: "Los dos tipos de anualidad de la clase 29er Argentina (completa y 50 %) y el contacto de tesorería.",
};

const STEPS = [
  { t: "Elegí tu anualidad", d: "Completa o 50 %. Si no sabés cuál te corresponde, consultá con tesorería." },
  { t: "Escribí a tesorería", d: "Te pasamos el valor de la temporada y los datos para pagar." },
  { t: "Mandá el comprobante", d: "Con el nombre del tripulante y el número de vela. ¡Listo, a navegar!" },
];

const peso = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default async function AnualidadPage() {
  const { membership: MEMBERSHIP, treasurer: TREASURER, general: LINKS } = await getContent();
  const email = TREASURER.email || LINKS.email;
  const mailto = (subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  return (
    <>
      <PageHeader
        index="03"
        kicker="Anualidad"
        sail="100%"
        title={
          <>
            Anualidad <br />
            de la <span className="text-sol">clase</span>
          </>
        }
        intro="La anualidad sostiene la actividad de la clase durante toda la temporada. Hay dos modalidades: completa o del 50 %. Acá te explicamos cada una y cómo pagarla."
        links={[
          { href: "#tipos", label: "Tipos de anualidad" },
          { href: "#como-pagar", label: "Cómo pagar" },
          { href: "#tesorero", label: "Contacto del tesorero" },
        ]}
      />

      <section id="tipos" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {MEMBERSHIP.map((m, i) => {
            const full = (m.share ?? 100) >= 100;
            return (
              <Reveal
                key={m.id}
                delay={i * 120}
                className={`relative flex flex-col overflow-hidden rounded-[28px] p-8 sm:p-10 ${full ? "bg-sol text-ink" : "bg-white/[0.04] ring-1 ring-white/15"}`}
              >
                <ShareRing share={m.share ?? 100} dark={full} />
                <div className={`font-mono text-[11px] font-bold uppercase tracking-[0.3em] ${full ? "text-ink/60" : "text-celeste"}`}>
                  Opción {i + 1}
                </div>
                <h2 className="mt-4 max-w-[70%] font-display text-5xl uppercase leading-[0.9] sm:text-6xl">{m.name}</h2>
                <div className="mt-6 flex items-baseline gap-3">
                  {m.price != null && m.price > 0 ? (
                    <span className="font-display text-5xl">{peso(m.price)}</span>
                  ) : (
                    <span className={`font-mono text-sm uppercase tracking-[0.2em] ${full ? "text-ink/70" : "text-foam/60"}`}>Valor: consultá con tesorería</span>
                  )}
                </div>
                <p className={`mt-5 max-w-md leading-relaxed ${full ? "text-ink/80" : "text-foam/75"}`}>{m.text}</p>
                <ul className="mt-6 space-y-2.5">
                  {m.perks.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm font-semibold">
                      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${full ? "bg-ink text-sol" : "bg-celeste text-ink"}`}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <a
                  href={mailto(`${m.name} — consulta`)}
                  className={`mt-10 inline-flex items-center justify-center gap-2 self-start rounded-full px-6 py-3.5 font-bold transition hover:-translate-y-0.5 ${
                    full ? "bg-ink text-white" : "bg-white text-ink hover:bg-celeste"
                  }`}
                >
                  Quiero esta anualidad →
                </a>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="como-pagar" className="mx-auto max-w-7xl scroll-mt-28 px-5 sm:px-8">
        <h2 className="font-display text-4xl uppercase sm:text-6xl">Cómo pagar</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 100} className="relative">
              <div className="flex items-center gap-4">
                <span className="font-display text-7xl leading-none text-outline [--outline:#74acdf]">{i + 1}</span>
                {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-gradient-to-r from-celeste/50 to-transparent md:block" />}
              </div>
              <h3 className="mt-4 font-display text-2xl uppercase">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foam/65">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="tesorero" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8 sm:py-24">
        <Reveal className="grid overflow-hidden rounded-[28px] bg-gradient-to-br from-tide to-navy ring-1 ring-white/10 lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Tesorería</div>
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.9] sm:text-6xl">
              Contacto <br />
              del tesorero
            </h2>
            <p className="mt-5 max-w-sm text-foam/70">Para pagar, pedir el valor de la temporada o consultar qué anualidad te corresponde.</p>
            <a
              href={mailto("Anualidad 29er")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-sol px-6 py-3.5 font-bold text-ink transition hover:-translate-y-0.5"
            >
              Escribir a tesorería →
            </a>
          </div>
          <div className="border-t border-white/10 bg-ink/40 p-8 sm:p-12 lg:border-l lg:border-t-0">
            <ContactList
              rows={[
                { label: "Tesorero/a", value: TREASURER.name },
                { label: "Mail", value: email, href: `mailto:${email}` },
                { label: "Teléfono", value: TREASURER.phone, href: TREASURER.phone ? `tel:${TREASURER.phone.replace(/\s/g, "")}` : null },
              ]}
            />
          </div>
        </Reveal>
      </section>
    </>
  );
}

/** Anillo que muestra la proporción de la anualidad (100 % o 50 %). */
function ShareRing({ share, dark }: { share: number; dark: boolean }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="absolute right-6 top-6 h-28 w-28 sm:right-8 sm:top-8 sm:h-32 sm:w-32" aria-hidden>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" className={dark ? "stroke-ink/15" : "stroke-white/10"} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(c * share) / 100} ${c}`}
          className={dark ? "stroke-ink" : "stroke-celeste"}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-3xl">{share}%</span>
    </div>
  );
}
