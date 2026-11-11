import HeroVideo from "./HeroVideo";
import { getContent } from "@/lib/store";

const STATS = [
  ["4,45 m", "Eslora"],
  ["74 kg", "Casco"],
  ["2", "Tripulantes"],
  ["15 m²", "Asimétrico"],
];

export default async function Hero() {
  const { home } = await getContent();
  return (
    <section id="top" className="grain relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink">
      <HeroVideo />

      {/* viñetas para legibilidad */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-ink via-ink/70 to-transparent md:h-56 md:via-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/60 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-32 pt-24 sm:px-8 md:justify-center md:pb-28">
        <p className="animate-rise font-mono text-[11px] uppercase tracking-[0.35em] text-celeste-light [animation-delay:200ms]">
          {home.heroKicker}
        </p>
        <h1 className="mt-5 font-display uppercase leading-[0.9] tracking-tight">
          <span className="block animate-rise text-[clamp(2.4rem,6.2vw,5.8rem)] [animation-delay:350ms]">Volar</span>
          <span className="block animate-rise text-[clamp(2.4rem,6.2vw,5.8rem)] [animation-delay:450ms]">sobre el</span>
          <span className="block animate-rise text-[clamp(2.4rem,6.2vw,5.8rem)] [animation-delay:550ms]">
            <span className="text-outline [--outline:#88d0ee]">agua</span>
            <span className="text-sol">.</span>
          </span>
        </h1>
        <p className="mt-5 max-w-md animate-rise text-[15px] md:mt-7 md:text-base leading-relaxed text-foam/85 sm:text-lg [animation-delay:650ms]">
          {home.heroIntro}
        </p>
        <div className="mt-7 flex animate-rise flex-wrap md:mt-9 items-center gap-4 [animation-delay:800ms]">
          <a
            href="#regata"
            className="group inline-flex items-center gap-3 rounded-full bg-sol px-7 py-4 font-bold text-ink transition hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-12px_rgba(250,175,64,0.9)]"
          >
            Jugá la regata
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-sol transition group-hover:translate-x-1">→</span>
          </a>
          <a href="#clase" className="rounded-full px-6 py-4 font-bold text-white ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/10">
            Conocé la clase
          </a>
        </div>
      </div>

      {/* barra inferior tipo instrumento */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-5 pb-7 sm:px-8">
          <dl className="grid grid-cols-4 gap-5 sm:gap-10">
            {STATS.map(([v, l]) => (
              <div key={l}>
                <dt className="font-mono text-[9px] uppercase tracking-[0.25em] text-foam/55 sm:text-[10px]">{l}</dt>
                <dd className="font-display text-lg sm:text-2xl">{v}</dd>
              </div>
            ))}
          </dl>
          <a href="#clase" className="hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-foam/60 transition hover:text-white sm:flex">
            Scroll
            <span className="relative block h-10 w-px overflow-hidden bg-white/20">
              <span className="absolute left-0 top-0 h-4 w-px animate-drip bg-celeste" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
