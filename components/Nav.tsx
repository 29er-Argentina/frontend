"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "./Logo";
import { NAV } from "@/lib/content";

export default function Nav({ instagram }: { instagram: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // cerrar el menú al navegar y bloquear el scroll mientras está abierto
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? isHome : pathname.startsWith(href));
  const solid = scrolled || !isHome || open;

  // Ojo: con el menú abierto el header NO puede tener backdrop-blur: backdrop-filter convierte al header en el
  // contenedor de los hijos `fixed`, y el menú quedaba encerrado en los 68px del header (con el video encima).
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,padding,box-shadow] duration-500 print:hidden ${
        open
          ? "bg-ink py-3 shadow-[0_1px_0_rgba(255,255,255,0.06)]"
          : solid
            ? "bg-ink/80 py-3 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
            : "py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 sm:px-8" aria-label="Principal">
        <Link href="/" aria-label="29er Argentina — inicio" className="shrink-0">
          <Wordmark />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.href} className="group relative">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                  isActive(item.href) ? "text-white" : "text-foam/70 hover:text-white"
                }`}
              >
                {item.label}
                {item.children && (
                  <svg viewBox="0 0 10 6" className="h-1.5 w-2.5 opacity-60 transition group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden>
                    <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
                <span
                  className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-sol transition-transform duration-300 ${
                    isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-hover:bg-celeste"
                  }`}
                />
              </Link>
              {item.children && (
                <div className="invisible absolute left-1/2 top-full z-10 w-72 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="overflow-hidden rounded-2xl bg-navy/95 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 backdrop-blur-xl">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="group/sub flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition hover:bg-white/[0.06]">
                          <span>
                            <span className="block text-sm font-semibold text-white">{c.label}</span>
                            {c.hint && <span className="mt-0.5 block text-xs text-foam/50">{c.hint}</span>}
                          </span>
                          <span className="text-foam/30 transition group-hover/sub:translate-x-0.5 group-hover/sub:text-sol">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink transition hover:bg-celeste sm:inline-flex"
          >
            <InstagramIcon className="h-4 w-4" /> Seguinos
          </a>
          <button
            className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-white/20 transition hover:bg-white/10 lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 h-0.5 w-5 bg-white transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-0.5 w-5 bg-white transition ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div id="menu-movil" className="fixed inset-x-0 bottom-0 top-[68px] overflow-y-auto overscroll-contain bg-ink px-5 pb-10 pt-4 sm:px-8 lg:hidden">
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {NAV.map((item, i) => (
              <li key={item.href} className="animate-rise py-4" style={{ animationDelay: `${i * 40}ms` }}>
                <Link href={item.href} className="flex items-baseline justify-between">
                  <span className={`font-display text-3xl uppercase ${isActive(item.href) ? "text-sol" : "text-white"}`}>{item.label}</span>
                  <span className="font-mono text-[11px] text-foam/30">0{i + 1}</span>
                </Link>
                {item.children && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="inline-block rounded-full bg-white/[0.06] px-3.5 py-2 text-sm text-foam/80 ring-1 ring-white/10">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <a href={instagram} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-ink">
            <InstagramIcon className="h-4 w-4" /> @29er_argentina
          </a>
        </div>
      )}
    </header>
  );
}

export function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
