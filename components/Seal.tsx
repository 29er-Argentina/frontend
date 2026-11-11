/** Sello circular para cada cargo de la comisión directiva. */
export default function Seal({ role, name, index }: { role: string; name: string | null; index: number }) {
  const id = `seal-path-${index}`;
  const ring = `29ER ARGENTINA · COMISIÓN DIRECTIVA · `;
  return (
    <figure className="group flex flex-col items-center text-center">
      <div className="relative aspect-square w-full max-w-[220px]">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full transition duration-[1200ms] ease-out group-hover:rotate-[24deg]" aria-hidden>
          <defs>
            <path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-celeste/50" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" className="text-celeste/40" />
          <text fontFamily="var(--font-mono)" fontSize="10.5" letterSpacing="3.2" fill="currentColor" className="text-foam/60">
            <textPath href={`#${id}`}>{ring + ring.slice(0, 18)}</textPath>
          </text>
        </svg>
        <div className="absolute inset-[24%] grid place-items-center rounded-full bg-gradient-to-br from-tide to-navy ring-1 ring-white/10 transition group-hover:from-celeste/40">
          <span className="font-display text-3xl text-sol">0{index + 1}</span>
        </div>
      </div>
      <figcaption className="mt-5">
        <div className="font-display text-xl uppercase">{role}</div>
        <div className={`mt-1 text-sm ${name ? "text-foam/75" : "font-mono text-[11px] uppercase tracking-[0.2em] text-foam/40"}`}>{name ?? "A confirmar"}</div>
      </figcaption>
    </figure>
  );
}
