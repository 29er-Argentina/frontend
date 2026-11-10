import Link from "next/link";
import { LogoMark } from "./Logo";
import { NAV } from "@/lib/content";
import { getContent } from "@/lib/store";

export default async function Footer() {
  const { general: LINKS } = await getContent();
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/5 bg-ink print:hidden">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <LogoMark className="h-20 w-20" />
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
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 font-mono text-[11px] text-foam/40 sm:flex-row sm:justify-between sm:px-8">
          <span>© {year} 29er Argentina</span>
          <span>Clase Internacional 29er · Diseño Julian Bethwaite</span>
        </div>
      </div>
    </footer>
  );
}
