import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { cache } from "react";
import type { SectionKey, SiteContent } from "./content";
import { DEFAULT_CONTENT } from "./defaults";

/* ------------------------------------------------------------------
 * Dónde se guarda lo que se edita en el panel. Hay dos modos:
 *
 * GitHub (si están GITHUB_TOKEN y GITHUB_REPO): cada guardado es un
 *   commit al repo. El historial de git es el registro de cambios y
 *   la copia de seguridad. Variables:
 *     GITHUB_TOKEN      token fine-grained con Contents: read/write
 *     GITHUB_REPO       "usuario/repo"
 *     GITHUB_BRANCH     rama (por defecto "main")
 *     GITHUB_DATA_PATH  carpeta dentro del repo (por defecto "data")
 *
 * Disco (si no): archivos en DATA_DIR (por defecto ./data).
 *   content.json, activity.json, backups/ y uploads/.
 * ------------------------------------------------------------------ */

export type Activity = { at: string; user: string; summary: string };

/** Etiqueta de caché del contenido: se invalida al guardar. */
export const CONTENT_TAG = "site-content";

/* ------------------------------ Archivos ------------------------------ */

export const UPLOAD_TYPES: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 8 * 1024 * 1024 },
  "image/png": { ext: "png", max: 8 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 8 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", max: 25 * 1024 * 1024 },
};

export const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

/** Nombres válidos de archivos subidos: generados por el servidor, sin rutas. */
export const UPLOAD_NAME = /^[a-z0-9-]{1,80}\.(jpg|png|webp|pdf)$/;

/** Comprueba la firma real del archivo (no solo el tipo que declara el navegador). */
function matchesSignature(type: string, b: Buffer) {
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === "image/png") return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
  if (type === "application/pdf") return b.subarray(0, 5).toString("latin1") === "%PDF-";
  return false;
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/* --------------------------- Backend: disco --------------------------- */

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw e;
  }
}

/** Escritura atómica: escribe a un temporal y lo renombra. */
async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

const disk = {
  readContent: () => readJson<Partial<SiteContent>>(CONTENT_FILE, {}),

  async writeSection(key: SectionKey, value: unknown, user: string, summary: string) {
    const saved = await readJson<Partial<SiteContent>>(CONTENT_FILE, {});
    const stamp = new Date().toISOString();
    await writeJson(path.join(BACKUP_DIR, `${stamp.replace(/[:.]/g, "-")}-${key}.json`), saved[key] ?? DEFAULT_CONTENT[key]);
    await writeJson(CONTENT_FILE, { ...saved, [key]: value });
    const activity = await readJson<Activity[]>(ACTIVITY_FILE, []);
    await writeJson(ACTIVITY_FILE, [{ at: stamp, user, summary }, ...activity].slice(0, 200));
  },

  async activity(limit: number) {
    return (await readJson<Activity[]>(ACTIVITY_FILE, [])).slice(0, limit);
  },

  async putUpload(name: string, buf: Buffer) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  },

  async getUpload(name: string) {
    try {
      return await fs.readFile(path.join(UPLOAD_DIR, name));
    } catch {
      return null;
    }
  },
};

/* -------------------------- Backend: GitHub --------------------------- */

const GH = {
  token: process.env.GITHUB_TOKEN ?? "",
  repo: process.env.GITHUB_REPO ?? "",
  branch: process.env.GITHUB_BRANCH || "main",
  dir: (process.env.GITHUB_DATA_PATH || "data").replace(/^\/+|\/+$/g, ""),
  api: (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, ""),
};

class GitHubError extends Error {}

async function gh(route: string, init: RequestInit & { next?: { tags?: string[] } } = {}) {
  const res = await fetch(`${GH.api}/repos/${GH.repo}${route}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GH.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "29er-argentina-panel",
      ...(init.headers ?? {}),
    },
  });
  return res;
}

const ghPath = (file: string) => `/contents/${GH.dir}/${file}`.split("/").map(encodeURIComponent).join("/");
const ref = () => `?ref=${encodeURIComponent(GH.branch)}`;

/** Lee un archivo del repo. `fresh` evita la caché (para escribir con el sha actual). */
async function ghGetFile(file: string, fresh = false): Promise<{ text: string; sha: string } | null> {
  const res = await gh(ghPath(file) + ref(), fresh ? { cache: "no-store" } : { cache: "force-cache", next: { tags: [CONTENT_TAG] } });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(`GitHub respondió ${res.status} al leer ${file}`);
  const data = (await res.json()) as { content?: string; sha: string; encoding?: string };
  return { text: Buffer.from(data.content ?? "", "base64").toString("utf8"), sha: data.sha };
}

async function ghPutFile(file: string, content: Buffer, message: string, sha?: string) {
  const res = await gh(ghPath(file), {
    method: "PUT",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, content: content.toString("base64"), branch: GH.branch, ...(sha ? { sha } : {}) }),
  });
  if (res.status === 409 || res.status === 422) return "conflict" as const;
  if (!res.ok) throw new GitHubError(`GitHub respondió ${res.status} al guardar ${file}`);
  return "ok" as const;
}

const COMMIT_PREFIX = "panel: ";

const github = {
  async readContent(): Promise<Partial<SiteContent>> {
    const f = await ghGetFile("content.json");
    return f ? (JSON.parse(f.text) as Partial<SiteContent>) : {};
  },

  async writeSection(key: SectionKey, value: unknown, user: string, summary: string) {
    // si otro guardado se metió en el medio (sha distinto), se relee y se reintenta
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await ghGetFile("content.json", true);
      const saved = current ? (JSON.parse(current.text) as Partial<SiteContent>) : {};
      const body = Buffer.from(JSON.stringify({ ...saved, [key]: value }, null, 2) + "\n", "utf8");
      const r = await ghPutFile("content.json", body, `${COMMIT_PREFIX}${summary} [${user}]`, current?.sha);
      if (r === "ok") return;
    }
    throw new GitHubError("No se pudo guardar: el contenido cambió mientras guardabas. Probá de nuevo.");
  },

  /** El registro de cambios sale de los commits del archivo de contenido. */
  async activity(limit: number): Promise<Activity[]> {
    const res = await gh(`/commits?path=${encodeURIComponent(`${GH.dir}/content.json`)}&sha=${encodeURIComponent(GH.branch)}&per_page=${limit}`, {
      cache: "force-cache",
      next: { tags: [CONTENT_TAG] },
    });
    if (!res.ok) return [];
    const commits = (await res.json()) as { commit: { message: string; author?: { date?: string; name?: string } } }[];
    return commits.map((c) => {
      const m = c.commit.message.match(/^panel: (.*) \[(.+)\]$/);
      return { at: c.commit.author?.date ?? "", user: m?.[2] ?? c.commit.author?.name ?? "", summary: m?.[1] ?? c.commit.message.split("\n")[0] };
    });
  },

  async putUpload(name: string, buf: Buffer) {
    const r = await ghPutFile(`uploads/${name}`, buf, `${COMMIT_PREFIX}archivo ${name}`);
    if (r !== "ok") throw new GitHubError("No se pudo subir el archivo.");
    rememberUpload(name, buf);
  },

  async getUpload(name: string) {
    // los archivos subidos no cambian nunca (el nombre lleva un sufijo aleatorio): se guardan en memoria
    const hit = uploadCache.get(name);
    if (hit) return hit;
    const res = await gh(ghPath(`uploads/${name}`) + ref(), {
      cache: "no-store",
      headers: { Accept: "application/vnd.github.raw+json" },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    rememberUpload(name, buf);
    return buf;
  },
};

// caché en memoria de archivos subidos, con tope de 64 MB (se descartan los más viejos)
const uploadCache = new Map<string, Buffer>();
let uploadCacheBytes = 0;
function rememberUpload(name: string, buf: Buffer) {
  if (buf.length > 32 * 1024 * 1024) return;
  uploadCache.set(name, buf);
  uploadCacheBytes += buf.length;
  for (const [k, v] of uploadCache) {
    if (uploadCacheBytes <= 64 * 1024 * 1024) break;
    uploadCache.delete(k);
    uploadCacheBytes -= v.length;
  }
}

/* ------------------------------ API pública ----------------------------- */

export const storageMode = GH.token && GH.repo ? ("github" as const) : ("disk" as const);
const backend = storageMode === "github" ? github : disk;

// Serializa las escrituras de este proceso para que dos guardados no se pisen.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

/** Contenido completo del sitio: lo guardado reemplaza a los valores por defecto, sección por sección. */
export const getContent = cache(async (): Promise<SiteContent> => {
  let saved: Partial<SiteContent> = {};
  try {
    saved = await backend.readContent();
  } catch (e) {
    // si GitHub no responde, el sitio sigue andando con el contenido por defecto
    console.error("[store] no se pudo leer el contenido:", e);
  }
  return { ...DEFAULT_CONTENT, ...saved };
});

export async function getActivity(limit = 12): Promise<Activity[]> {
  try {
    return await backend.activity(limit);
  } catch {
    return [];
  }
}

export function saveSection<K extends SectionKey>(key: K, value: SiteContent[K], user: string, summary: string) {
  return serialized(() => backend.writeSection(key, value, user, summary));
}

export async function saveUpload(file: File): Promise<{ url: string } | { error: string }> {
  const kind = UPLOAD_TYPES[file.type];
  if (!kind) return { error: "Formato no permitido. Usá JPG, PNG, WEBP o PDF." };
  if (file.size > kind.max) return { error: `El archivo es muy pesado (máximo ${kind.max / 1024 / 1024} MB).` };
  const buf = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(file.type, buf)) return { error: "El archivo no coincide con su formato." };

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "archivo";
  const name = `${base}-${crypto.randomBytes(4).toString("hex")}.${kind.ext}`;
  try {
    await backend.putUpload(name, buf);
  } catch (e) {
    return { error: e instanceof GitHubError ? e.message : "No se pudo guardar el archivo." };
  }
  return { url: `/media/${name}` };
}

export async function readUpload(name: string) {
  if (!UPLOAD_NAME.test(name)) return null;
  return backend.getUpload(name);
}
