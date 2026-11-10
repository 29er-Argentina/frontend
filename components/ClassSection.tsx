import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import CountUp from "./CountUp";
import { getContent } from "@/lib/store";

export default async function ClassSection() {
  const { specs, features, general, home } = await getContent();
  return (
    <section id="clase" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28">
      <SectionHeading
        index="01"
        kicker="La clase"
        title={
          <>
            Un skiff hecho <br className="hidden sm:block" />
            para <span className="text-celeste">volar</span>
          </>
        }
      >
        {home.boatIntro}
      </SectionHeading>

      <div className="mt-16 grid gap-6 lg:grid-cols-12">
        <Reveal className="relative overflow-hidden rounded-[28px] bg-navy ring-1 ring-white/10 lg:col-span-7">
          <Blueprint />
        </Reveal>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] bg-white/10 ring-1 ring-white/10 lg:col-span-5">
          {specs.map((s, i) => (
            <Reveal key={s.label} delay={i * 60} className="bg-ink p-6 sm:p-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foam/50">{s.label}</div>
              <div className="mt-3 font-display text-4xl sm:text-5xl">
                <CountUp to={s.value ?? 0} decimals={s.decimals ?? 0} />
                <span className="ml-1.5 font-mono text-sm text-celeste">{s.unit}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <Reveal as="li" key={f.title} delay={i * 80} className="group rounded-[24px] bg-white/[0.03] p-7 ring-1 ring-white/10 transition hover:bg-white/[0.06]">
            <div className="font-mono text-xs text-sol">0{i + 1}</div>
            <h3 className="mt-4 font-display text-2xl uppercase">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-foam/70">{f.text}</p>
          </Reveal>
        ))}
      </ul>
      <p className="mt-6 font-mono text-[11px] text-foam/40">
        Medidas según la{" "}
        <a href={general.classSite} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-4 hover:text-foam">
          Asociación Internacional 29er
        </a>
        .
      </p>
    </section>
  );
}

/** Plano técnico en planta del 29er. */
function Blueprint() {
  return (
    <div className="relative h-full min-h-[380px]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(116,172,223,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(116,172,223,.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.3em] text-celeste/80">
        Plano · Vista en planta
        <div className="mt-1 text-foam/40">Escala 1:25</div>
      </div>
      <svg viewBox="0 0 640 380" className="relative h-full w-full" fill="none" aria-label="Plano del 29er con eslora de 4,45 m y manga de 1,77 m">
        <g stroke="#a9d3f5" strokeWidth="1.6">
          {/* casco */}
          <path d="M120 190 C 190 130, 330 118, 520 128 L 528 128 L 528 252 L 520 252 C 330 262, 190 250, 120 190 Z" fill="rgba(116,172,223,0.08)" />
          {/* cubierta / cockpit */}
          <path d="M300 152 L 505 146 L 505 234 L 300 228" strokeDasharray="4 5" opacity=".7" />
          {/* alas */}
          <path d="M290 132 L 300 86 L 470 86 L 500 130" />
          <path d="M290 248 L 300 294 L 470 294 L 500 250" />
          <path d="M300 86 L 470 86 L 470 132 M300 294 L 470 294 L 470 248" opacity=".5" />
          {/* mástil y botalón */}
          <circle cx="250" cy="190" r="6" fill="#f6b40e" stroke="none" />
          <path d="M120 190 L 64 190" stroke="#f6b40e" />
          {/* orza y timón */}
          <path d="M290 190 L 330 190" strokeWidth="4" />
          <path d="M520 190 L 548 190" strokeWidth="4" />
        </g>
        {/* cotas */}
        <g stroke="#f6b40e" strokeWidth="1" fill="#f6b40e">
          <path d="M120 330 L 528 330" />
          <path d="M120 322 L 120 338 M528 322 L 528 338" />
          <path d="M600 86 L 600 294" />
          <path d="M592 86 L 608 86 M592 294 L 608 294" />
        </g>
        <g fill="#eef5fb" fontFamily="JetBrains Mono Variable, monospace" fontSize="13">
          <text x="324" y="354" textAnchor="middle">ESLORA 4,45 m</text>
          <text x="620" y="194" textAnchor="middle" transform="rotate(90 620 190)">MANGA 1,77 m</text>
          <text x="64" y="178" textAnchor="middle" fill="#f6b40e" fontSize="10">BOTALÓN</text>
          <text x="250" y="216" textAnchor="middle" fill="#f6b40e" fontSize="10">MÁSTIL</text>
          <text x="385" y="76" textAnchor="middle" fontSize="10" opacity=".7">ALA / TRAPECIO</text>
        </g>
      </svg>
    </div>
  );
}
