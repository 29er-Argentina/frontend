"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";

export default function LoginScreen({ onLogin }: { onLogin: (user: string, password: string) => Promise<string | null> }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    const err = await onLogin(String(form.get("user") ?? "").slice(0, 100), String(form.get("password") ?? "").slice(0, 200));
    if (err) {
      setError(err);
      setPending(false);
    }
  }

  return (
    <main className="grain relative grid min-h-svh place-items-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-celeste/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[460px] w-[460px] rounded-full bg-sol/10 blur-[120px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-6vw] select-none text-center font-display text-[30vw] leading-none text-outline [--outline:rgba(38,169,224,0.08)]"
      >
        29ER
      </div>

      <div className="relative w-full max-w-sm animate-rise">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-16 w-16" />
          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Panel de administración</div>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none">Entrar</h1>
        </div>
        <div className="mt-8 rounded-[28px] bg-navy/70 p-7 ring-1 ring-white/10 backdrop-blur-xl sm:p-8">
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-foam/85">Usuario</span>
              <input name="user" autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus className="admin-input mt-2" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-foam/85">Contraseña</span>
              <span className="relative mt-2 block">
                <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="admin-input pr-20" />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-xs font-semibold text-foam/60 transition hover:bg-white/10 hover:text-white"
                >
                  {show ? "Ocultar" : "Mostrar"}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-buoy/15 px-4 py-3 text-sm text-[#ffb48a] ring-1 ring-buoy/30">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-sol px-6 py-3.5 font-bold text-ink transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            >
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-foam/40">
          <Link href="/" className="hover:text-foam">
            ← Volver al sitio
          </Link>
        </p>
      </div>
    </main>
  );
}
