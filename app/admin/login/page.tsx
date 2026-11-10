import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { LogoMark } from "@/components/Logo";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar al panel", robots: { index: false, follow: false } };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  if (await getSession()) redirect("/admin");
  const { next } = await props.searchParams;
  return (
    <main className="grain relative grid min-h-svh place-items-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-celeste/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full bg-sol/10 blur-[120px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-6vw] select-none text-center font-display text-[30vw] leading-none text-outline [--outline:rgba(116,172,223,0.08)]"
      >
        29ER
      </div>

      <div className="relative w-full max-w-sm animate-rise">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-16 w-16" />
          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Panel de administración</div>
          <h1 className="mt-2 font-display text-5xl uppercase leading-none">Entrar</h1>
        </div>
        <div className="mt-8 rounded-[28px] bg-navy/70 p-7 ring-1 ring-white/10 backdrop-blur-xl sm:p-8">
          <LoginForm next={typeof next === "string" ? next : ""} />
        </div>
        <p className="mt-6 text-center text-xs text-foam/40">
          <a href="/" className="hover:text-foam">
            ← Volver al sitio
          </a>
        </p>
      </div>
    </main>
  );
}
