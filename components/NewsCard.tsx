import Link from "next/link";
import type { NewsItem } from "@/lib/content";
import { newsDate } from "@/lib/dates";

const PALETTES = [
  { bg: "#0b1d33", a: "#74acdf", b: "#f6b40e" },
  { bg: "#12304f", a: "#f6b40e", b: "#ff6a1a" },
  { bg: "#071426", a: "#ff6a1a", b: "#a9d3f5" },
  { bg: "#0b1d33", a: "#a9d3f5", b: "#74acdf" },
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Portada gráfica generada a partir de la noticia: velas en los colores de la clase. */
export function NewsCover({ item, className = "" }: { item: NewsItem; className?: string }) {
  if (item.image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
    );
  }
  const h = hash(item.slug);
  const p = PALETTES[h % PALETTES.length];
  const tilt = (h % 9) - 4;
  const sailNo = String(2000 + (h % 900));
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: p.bg }}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(116,172,223,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(116,172,223,.25) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <svg
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-[1.04]"
        aria-hidden
      >
        <g transform={`rotate(${tilt} 200 250)`}>
          {/* agua */}
          <path d="M-20 214 Q 60 204 140 214 T 300 214 T 460 214 L 460 300 L -20 300 Z" fill="#040b15" opacity=".55" />
          {/* mayor */}
          <path d="M196 22 L 198 200 L 120 200 C 140 140, 170 80, 196 22 Z" fill="#eef5fb" opacity=".92" />
          <path d="M196 22 L 198 200 L 120 200 C 140 140, 170 80, 196 22 Z" fill="none" stroke={p.a} strokeWidth="2" />
          {[60, 95, 130, 165].map((y) => (
            <path key={y} d={`M${196 - (y - 22) * 0.43} ${y} L 197 ${y - 6}`} stroke={p.a} strokeWidth="1.5" />
          ))}
          {/* asimétrico */}
          <path d="M204 40 C 290 70, 330 150, 300 206 L 206 196 Z" fill={p.b} opacity=".95" />
          <path d="M204 40 C 250 90, 262 150, 252 200" fill="none" stroke="#040b15" strokeWidth="1" opacity=".25" />
          {/* casco */}
          <path d="M96 202 L 318 206 L 300 220 L 110 216 Z" fill="#eef5fb" />
          <text x="178" y="152" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="17" fill={p.bg}>
            ARG
          </text>
          <text x="174" y="176" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="17" fill={p.bg}>
            {sailNo}
          </text>
        </g>
      </svg>
      <span className="absolute left-4 top-4 rounded-full bg-ink/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
        {item.tag}
      </span>
    </div>
  );
}

export default function NewsCard({ item, size = "md" }: { item: NewsItem; size?: "md" | "lg" }) {
  return (
    <Link
      href={`/news/${item.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] bg-white/[0.03] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06] hover:ring-white/20"
    >
      <NewsCover item={item} className={size === "lg" ? "aspect-[16/10]" : "aspect-[16/11]"} />
      <div className="flex flex-1 flex-col p-6">
        <time dateTime={item.date} className="font-mono text-[10px] uppercase tracking-[0.25em] text-celeste">
          {newsDate(item.date)}
        </time>
        <h3 className={`mt-3 font-display uppercase leading-[1.05] ${size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{item.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foam/65">{item.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-white">
          Leer nota <span className="text-sol transition group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
