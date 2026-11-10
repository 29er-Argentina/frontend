import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { SiteContent } from "./content";
import { DEFAULT_CONTENT } from "./defaults";
import { CONTENT_FILE } from "./panel-config";

/**
 * Contenido del sitio, leído al momento del build desde content/site.json
 * (lo escribe el panel con un commit). Lo guardado reemplaza a los valores
 * por defecto sección por sección.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  let saved: Partial<SiteContent> = {};
  try {
    saved = JSON.parse(await fs.readFile(path.join(process.cwd(), CONTENT_FILE), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  return { ...DEFAULT_CONTENT, ...saved };
});
