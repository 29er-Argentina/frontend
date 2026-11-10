import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readToken } from "./session";

export async function getSession() {
  const jar = await cookies();
  return readToken(jar.get(SESSION_COOKIE)?.value);
}

/** Para páginas del panel: si no hay sesión, al login. */
export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
