const WORDS = ["Skiff", "Trapecio", "Asimétrico", "Planeo", "Ceñida", "Trasluchada", "Mundial", "Sudamericano", "Equipo"];

export default function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative -rotate-1 overflow-hidden border-y border-white/10 bg-celeste py-4 text-ink" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-3xl uppercase sm:text-4xl">
            {w}
            <Sun />
          </span>
        ))}
      </div>
    </div>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7 text-sol" aria-hidden>
      <g fill="currentColor">
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d="M18.6 6 L20 0 L21.4 6Z" transform={`rotate(${i * 22.5} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="9" />
      </g>
    </svg>
  );
}
