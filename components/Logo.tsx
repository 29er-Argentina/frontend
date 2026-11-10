export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="29er Argentina">
      <circle cx="60" cy="60" r="60" fill="#1f1d1c" />
      <text x="54" y="66" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="700" fontSize="44" fill="#fff">
        29
      </text>
      <text x="86" y="46" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="700" fontSize="20" fill="#fff">
        er
      </text>
      <g transform="translate(74 52)">
        <rect width="24" height="4" fill="#74acdf" />
        <rect y="4" width="24" height="4" fill="#fff" />
        <rect y="8" width="24" height="4" fill="#74acdf" />
        <circle cx="12" cy="6" r="1.4" fill="#f6b40e" />
      </g>
      <text x="60" y="86" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="10" letterSpacing="2.4" fill="#fff">
        ARGENTINA
      </text>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className="h-10 w-10" />
      <span className="leading-none">
        <span className="block font-display text-xl tracking-wide">
          29<span className="text-celeste">er</span>
        </span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.35em] text-foam/60">Argentina</span>
      </span>
    </span>
  );
}
