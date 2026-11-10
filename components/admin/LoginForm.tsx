"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm font-semibold text-foam/85">Usuario</span>
        <input
          name="user"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.user}
          autoFocus
          className="admin-input mt-2"
        />
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

      {state.error && (
        <p role="alert" className="rounded-xl bg-buoy/15 px-4 py-3 text-sm text-[#ffb48a] ring-1 ring-buoy/30">
          {state.error}
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
  );
}
