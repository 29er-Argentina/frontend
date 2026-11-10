import type { PanelSecret } from "./panel-crypto";
import { COMMIT_PREFIX } from "./panel-config";

/* Cliente mínimo de la API de GitHub para el panel (corre en el navegador). */

export class GitHubError extends Error {
  constructor(
    message: string,
    public status = 0
  ) {
    super(message);
  }
}

export type Activity = { at: string; user: string; summary: string };
export type DeployRun = { status: string; conclusion: string | null; createdAt: string; url: string };

const dec = new TextDecoder();
const enc = new TextEncoder();

function toB64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fromB64(s: string) {
  return Uint8Array.from(atob(s.replace(/\s/g, "")), (c) => c.charCodeAt(0));
}

export function textToB64(text: string) {
  return toB64(enc.encode(text));
}

export async function fileToB64(file: Blob) {
  return toB64(new Uint8Array(await file.arrayBuffer()));
}

export function createGitHub(s: PanelSecret) {
  const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

  async function req(route: string, init: RequestInit = {}) {
    let res: Response;
    try {
      res = await fetch(`${s.api}/repos/${s.repo}${route}`, {
        ...init,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${s.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new GitHubError("No hay conexión con GitHub. Revisá internet y probá de nuevo.");
    }
    if (res.status === 401) throw new GitHubError("El token de GitHub del panel venció o fue revocado. Hay que generar uno nuevo.", 401);
    return res;
  }

  return {
    repo: s.repo,
    branch: s.branch,

    /** Lee un archivo de texto del repo con su sha (null si no existe). */
    async getText(path: string): Promise<{ text: string; sha: string } | null> {
      const res = await req(`/contents/${encPath(path)}?ref=${encodeURIComponent(s.branch)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new GitHubError(`GitHub respondió ${res.status} al leer ${path}.`, res.status);
      const data = (await res.json()) as { content?: string; sha: string };
      return { text: dec.decode(fromB64(data.content ?? "")), sha: data.sha };
    },

    /** Crea o reemplaza un archivo. "conflict" si cambió desde que se leyó. */
    async put(path: string, base64: string, message: string, sha?: string): Promise<"ok" | "conflict"> {
      const res = await req(`/contents/${encPath(path)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, content: base64, branch: s.branch, ...(sha ? { sha } : {}) }),
      });
      if (res.status === 409 || res.status === 422) return "conflict";
      if (res.status === 403 || res.status === 404) throw new GitHubError("El token de GitHub no tiene permiso para escribir en el repo.", res.status);
      if (!res.ok) throw new GitHubError(`GitHub respondió ${res.status} al guardar.`, res.status);
      return "ok";
    },

    /** "Últimos cambios": commits que tocaron el contenido. */
    async activity(path: string, limit: number): Promise<Activity[]> {
      const res = await req(`/commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(s.branch)}&per_page=${limit}`);
      if (!res.ok) return [];
      const commits = (await res.json()) as { commit: { message: string; author?: { date?: string; name?: string } } }[];
      return commits.map((c) => {
        const first = c.commit.message.split("\n")[0];
        const m = first.match(new RegExp(`^${COMMIT_PREFIX}(.*) \\[(.+)\\]$`));
        return { at: c.commit.author?.date ?? "", user: m?.[2] ?? c.commit.author?.name ?? "", summary: m?.[1] ?? first };
      });
    },

    /** Última publicación (GitHub Actions). null si el token no puede verlas. */
    async latestDeploy(): Promise<DeployRun | null> {
      const res = await req(`/actions/runs?branch=${encodeURIComponent(s.branch)}&per_page=1`);
      if (!res.ok) return null;
      const run = ((await res.json()) as { workflow_runs?: { status: string; conclusion: string | null; created_at: string; html_url: string }[] }).workflow_runs?.[0];
      return run ? { status: run.status, conclusion: run.conclusion, createdAt: run.created_at, url: run.html_url } : null;
    },
  };
}

export type GitHub = ReturnType<typeof createGitHub>;
