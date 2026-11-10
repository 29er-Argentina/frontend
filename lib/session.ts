import crypto from "node:crypto";

/* ------------------------------------------------------------------
 * Sesión del panel: cookie firmada con HMAC-SHA256.
 * Usuario y contraseña salen de ADMIN_USER / ADMIN_PASSWORD
 * y la firma de SESSION_SECRET (ver .env.local).
 * ------------------------------------------------------------------ */

export const SESSION_COOKIE = "admin_session";
export const SESSION_DAYS = 7;

const isProd = process.env.NODE_ENV === "production";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (isProd) throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en las variables de entorno.");
  return "solo-para-desarrollo-cambiar-en-produccion-0000";
}

/** Credenciales configuradas. En producción no hay valores por defecto. */
export function credentials() {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  if (user && password) return { user, password };
  if (isProd) return null;
  return { user: "delfi", password: "admin123" };
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(user: string, password: string) {
  const c = credentials();
  if (!c) return false;
  // comparar las dos cosas siempre, para no filtrar cuál falló
  const okUser = safeEqual(user.trim().toLowerCase(), c.user.toLowerCase());
  const okPass = safeEqual(password, c.password);
  return okUser && okPass;
}

export function createToken(user: string) {
  const payload = b64(JSON.stringify({ u: user, exp: Date.now() + SESSION_DAYS * 864e5 }));
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): { user: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u: string; exp: number };
    if (typeof data.u !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { user: data.u };
  } catch {
    return null;
  }
}

/* --------------- Límite de intentos de login (en memoria) --------------- */

const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

export function loginBlocked(key: string) {
  const a = attempts.get(key);
  return Boolean(a && a.count >= MAX_ATTEMPTS && a.until > Date.now());
}

export function registerFailure(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.until < now) attempts.set(key, { count: 1, until: now + WINDOW_MS });
  else a.count += 1;
}

export function clearFailures(key: string) {
  attempts.delete(key);
}
