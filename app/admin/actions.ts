"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { SECTIONS } from "@/lib/admin-schema";
import type { SectionKey, SiteContent } from "@/lib/content";
import { getSession } from "@/lib/auth";
import { sanitizeSection } from "@/lib/sanitize";
import { CONTENT_TAG, saveSection } from "@/lib/store";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  checkPassword,
  clearFailures,
  createToken,
  credentials,
  loginBlocked,
  registerFailure,
} from "@/lib/session";

export type LoginState = { error?: string; user?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const user = String(form.get("user") ?? "").slice(0, 100);
  const password = String(form.get("password") ?? "").slice(0, 200);
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";

  if (!credentials()) return { error: "El panel no está configurado: faltan ADMIN_USER y ADMIN_PASSWORD en el servidor.", user };
  if (loginBlocked(ip)) return { error: "Demasiados intentos. Esperá unos minutos y probá de nuevo.", user };

  if (!checkPassword(user, password)) {
    registerFailure(ip);
    await new Promise((r) => setTimeout(r, 600)); // frena intentos automáticos
    return { error: "Usuario o contraseña incorrectos.", user };
  }

  clearFailures(ip);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createToken(user.trim().toLowerCase()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });

  const next = String(form.get("next") ?? "");
  // solo redirecciones internas del panel
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export type SaveResult = { ok: true; value: unknown; savedAt: string } | { ok: false; errors: string[] };

export async function saveSectionAction(key: SectionKey, raw: unknown): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, errors: ["Tu sesión venció. Volvé a entrar para guardar."] };

  const schema = SECTIONS[key];
  if (!schema) return { ok: false, errors: ["Sección desconocida."] };

  const { value, errors } = sanitizeSection(schema, raw);
  if (errors.length || value === undefined) return { ok: false, errors };

  const summary = schema.kind === "list" ? `${schema.title}: ${(value as unknown[]).length} ${schema.itemName}${(value as unknown[]).length === 1 ? "" : "s"}` : schema.title;
  try {
    await saveSection(key, value as SiteContent[typeof key], session.user, summary);
  } catch (e) {
    console.error("[panel] error al guardar:", e);
    return { ok: false, errors: [e instanceof Error && e.message.startsWith("No se pudo") ? e.message : "No se pudo guardar. Probá de nuevo en un momento."] };
  }

  // actualizar todo el sitio público con el contenido nuevo
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
  return { ok: true, value, savedAt: new Date().toISOString() };
}
