import Link from "next/link";

/** Encabezado de las páginas internas: número de vela gigante de fondo, título y accesos rápidos. */
export default function PageHeader({
  index,
  kicker,
  title,
  intro,
  sail,
  links,
}: {
  index: string;
  kicker: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** Texto gigante de fondo, como el número de una vela. */
  sail: string;
  links?: { href: string; label: string }[];
}) {
  return (
    <header className="grain relative overflow-hidden border-b border-white/10 pb-14 pt-36 sm:pb-20 sm:pt-44 print:hidden">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-celeste/15 blur-[140px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-sol/10 blur-[120px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 top-24 select-none font-display text-[clamp(9rem,26vw,24rem)] uppercase leading-[0.8] text-outline [--outline:rgba(116,172,223,0.14)] sm:top-20"
      >
        {sail}
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <nav aria-label="Ruta" className="animate-rise font-mono text-[11px] uppercase tracking-[0.25em] text-foam/40">
          <Link href="/" className="hover:text-white">
            Inicio
          </Link>
          <span className="mx-3 text-foam/20">/</span>
          <span className="text-celeste">{kicker}</span>
        </nav>
        <div className="mt-8 flex animate-rise items-center gap-4 font-mono text-[11px] uppercase tracking-[0.3em] text-celeste [animation-delay:80ms]">
          <span className="text-foam/40">{index}</span>
          <span className="h-px w-10 bg-celeste/50" />
          {kicker}
        </div>
        <h1 className="mt-5 max-w-5xl animate-rise font-display text-[clamp(3.2rem,9vw,8rem)] uppercase leading-[0.86] [animation-delay:160ms]">{title}</h1>
        {intro && <p className="mt-7 max-w-2xl animate-rise text-base leading-relaxed text-foam/75 sm:text-lg [animation-delay:240ms]">{intro}</p>}
        {links && links.length > 0 && (
          <ul className="mt-9 flex animate-rise flex-wrap gap-2 [animation-delay:320ms]">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-foam/85 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                >
                  {l.label} <span className="text-sol">↓</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
