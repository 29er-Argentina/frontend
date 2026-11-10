/* Dónde guarda el panel cada cosa dentro del repo. */

/** Contenido editable del sitio. Si no existe se usan los valores de lib/defaults.ts. */
export const CONTENT_FILE = "content/site.json";

/** Fotos y PDFs subidos desde el panel. Se publican en /uploads/<archivo>. */
export const UPLOAD_DIR = "public/uploads";
export const UPLOAD_URL_PREFIX = "/uploads/";

export const UPLOAD_TYPES: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 8 * 1024 * 1024 },
  "image/png": { ext: "png", max: 8 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 8 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", max: 25 * 1024 * 1024 },
};

/** Prefijo de los commits que hace el panel (de ahí sale "Últimos cambios"). */
export const COMMIT_PREFIX = "panel: ";
