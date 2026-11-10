import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import Icon from "@/components/admin/Icon";
import { LogoMark } from "@/components/Logo";
import { requireSession } from "@/lib/auth";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel 29er" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  const name = user.charAt(0).toUpperCase() + user.slice(1);

  return (
    <div className="min-h-svh bg-[#050d19] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Barra lateral (escritorio) / superior (celular) */}
      <aside className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-xl lg:h-svh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
            <Link href="/admin" className="admin-focus flex items-center gap-3 rounded-xl">
              <LogoMark className="h-9 w-9" />
              <span className="leading-none">
                <span className="block font-display text-lg tracking-wide">
                  29<span className="text-celeste">er</span> · Panel
                </span>
                <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.3em] text-foam/50">Argentina</span>
              </span>
            </Link>
            <div className="flex items-center gap-1 lg:hidden">
              <a href="/" target="_blank" rel="noreferrer" className="admin-focus grid h-10 w-10 place-items-center rounded-full text-foam/70 hover:bg-white/10" aria-label="Ver el sitio">
                <Icon name="external" className="h-[18px] w-[18px]" />
              </a>
              <form action={logout}>
                <button className="admin-focus grid h-10 w-10 place-items-center rounded-full text-foam/70 hover:bg-white/10" aria-label="Salir">
                  <Icon name="logout" className="h-[18px] w-[18px]" />
                </button>
              </form>
            </div>
          </div>

          <AdminNav />

          <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-focus flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foam/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              Ver el sitio <Icon name="external" className="h-4 w-4" />
            </a>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-3 ring-1 ring-white/10">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-celeste font-display text-lg text-ink">{name.charAt(0)}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{name}</div>
                  <div className="text-xs text-foam/45">Administración</div>
                </div>
              </div>
              <form action={logout}>
                <button className="admin-focus grid h-9 w-9 place-items-center rounded-full text-foam/60 transition hover:bg-white/10 hover:text-white" aria-label="Salir" title="Salir">
                  <Icon name="logout" className="h-[18px] w-[18px]" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
