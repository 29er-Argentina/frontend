/** Prefijo del sitio cuando se publica en una subcarpeta (GitHub Pages: /frontend). */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

/**
 * Agrega el prefijo a rutas propias ("/videos/x.mp4", "/uploads/x.jpg").
 * <Link> lo hace solo; esto es para <img>, <video> y <a> comunes.
 */
export function asset(url: string | undefined | null): string {
  if (!url) return "";
  return url.startsWith("/") && !url.startsWith("//") ? BASE_PATH + url : url;
}
