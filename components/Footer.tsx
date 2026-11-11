import Link from "next/link";
import { Logo } from "./Logo";
import { NAV } from "@/lib/content";
import { getContent } from "@/lib/store";

export default async function Footer() {
  const { general: LINKS } = await getContent();
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/5 bg-ink print:hidden">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo className="h-20" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-foam/60">
            Cuenta oficial de la clase 29er en Argentina. Deportes y recreación, con viento a favor.
          </p>
        </div>
        <nav className="md:col-span-4" aria-label="Mapa del sitio">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Sitio</h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {NAV.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-foam/80 transition hover:text-white">
                  {i.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/agenda/imprimir" className="text-foam/80 transition hover:text-white">
                Calendario imprimible
              </Link>
            </li>
          </ul>
        </nav>
        <div className="md:col-span-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Contacto</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a href={`mailto:${LINKS.email}`} className="text-foam/80 hover:text-white">
                {LINKS.email}
              </a>
            </li>
            <li>
              <a href={LINKS.instagram} target="_blank" rel="noreferrer" className="text-foam/80 hover:text-white">
                @29er_argentina
              </a>
            </li>
            <li>
              <a href={LINKS.taplink} target="_blank" rel="noreferrer" className="text-foam/80 hover:text-white">
                {LINKS.taplink.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </li>
            <li className="pt-2 text-foam/60">
              Media Manager{" "}
              <a href={LINKS.mediaManagerUrl} target="_blank" rel="noreferrer" className="text-white underline decoration-celeste underline-offset-4">
                {LINKS.mediaManagerHandle}
              </a>
            </li>
          </ul>
          <Link
            href="/#regata"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 font-mono text-xs text-foam/80 ring-1 ring-white/10 hover:text-white"
          >
            ⛵ ¿Una regata más?
          </Link>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 font-mono text-[11px] text-foam/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>
            © {year} 29er Argentina
            <span className="mx-2 text-foam/20">·</span>
            <Link href="/marca" className="text-foam/40 transition hover:text-foam/70">
              Manual de marca
            </Link>
          </span>
          <RestrictedLink />
          <span>
            Diseño y desarrollo{" "}
            <a href="https://raven3.com.ar" target="_blank" rel="noreferrer" className="text-foam/70 underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-white/60">
              Raven3
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Entrada al panel: con cinta de peligro para que nadie más se anime a tocarla. */
function RestrictedLink() {
  return (
    <Link
      href="/admin"
      prefetch={false}
      rel="nofollow"
      aria-label="Panel de administración — solo comisión"
      title="Solo comisión"
      className="group inline-flex self-start rounded-full p-[2px] transition hover:animate-shake motion-reduce:hover:animate-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sol sm:self-auto"
      style={{ background: "repeating-linear-gradient(-45deg, #5b6472 0 7px, #040b15 7px 14px)" }}
    >
      <span className="flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 uppercase tracking-[0.2em] text-sol">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition group-hover:-rotate-12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <span className="group-hover:hidden">Zona restringida · Solo comisión</span>
        <span className="hidden text-buoy group-hover:inline">¿Seguro? No es para vos</span>
      </span>
    </Link>
  );
}
