"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SECTIONS } from "@/lib/admin-schema";
import type { SectionKey, SiteContent } from "@/lib/content";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import { GitHubError, createGitHub, fileToB64, textToB64, type GitHub } from "@/lib/github";
import { COMMIT_PREFIX, CONTENT_FILE, UPLOAD_DIR, UPLOAD_TYPES, UPLOAD_URL_PREFIX } from "@/lib/panel-config";
import { unseal, type PanelSecret, type SealedKey } from "@/lib/panel-crypto";
import { BASE_PATH, asset } from "@/lib/paths";
import { sanitizeSection } from "@/lib/sanitize";
import LoginScreen from "./LoginScreen";
import PanelShell from "./PanelShell";

export type SaveResult = { ok: true; value: unknown } | { ok: false; errors: string[] };
export type DeployState = { kind: "idle" } | { kind: "building"; url?: string } | { kind: "done"; url?: string } | { kind: "failed"; url?: string };

type Panel = {
  user: string;
  content: SiteContent;
  gh: GitHub;
  deploy: DeployState;
  saveSection: (key: SectionKey, raw: unknown) => Promise<SaveResult>;
  upload: (file: File) => Promise<string>;
  logout: () => void;
};

const PanelContext = createContext<Panel | null>(null);

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel fuera del panel");
  return ctx;
}

const SESSION_KEY = `panel-session:${BASE_PATH || "/"}`;
type Stored = { user: string; secret: PanelSecret };

/* --------------------------- archivos subidos --------------------------- */

// vista previa local de lo recién subido (en el sitio aparece cuando termina de publicarse)
const localPreviews = new Map<string, string>();
export const previewUrl = (url: string) => localPreviews.get(url) ?? asset(url);

async function matchesSignature(type: string, file: File) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x);
  if (type === "image/webp") return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (type === "application/pdf") return ascii(0, 5) === "%PDF-";
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

/* -------------------------------- provider ------------------------------- */

type Phase = { kind: "checking" } | { kind: "login" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready" };

export default function PanelProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>({ kind: "checking" });
  const [session, setSession] = useState<Stored | null>(null);
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [deploy, setDeploy] = useState<DeployState>({ kind: "idle" });
  const [deploySince, setDeploySince] = useState(0);
  const failures = useRef(0);

  const gh = useMemo(() => (session ? createGitHub(session.secret) : null), [session]);

  const load = useCallback(async (s: Stored) => {
    setPhase({ kind: "loading" });
    try {
      const file = await createGitHub(s.secret).getText(CONTENT_FILE);
      setContent({ ...DEFAULT_CONTENT, ...(file ? (JSON.parse(file.text) as Partial<SiteContent>) : {}) });
      setPhase({ kind: "ready" });
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "No se pudo cargar el contenido." });
    }
  }, []);

  // sesión guardada en esta pestaña
  useEffect(() => {
    let stored: Stored | null = null;
    try {
      stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    } catch {}
    if (stored?.secret?.token) {
      setSession(stored);
      load(stored);
    } else setPhase({ kind: "login" });
  }, [load]);

  const login = useCallback(
    async (user: string, password: string): Promise<string | null> => {
      let sealed: SealedKey;
      try {
        const res = await fetch(asset("/panel-key.json"), { cache: "no-store" });
        if (!res.ok) return "El panel todavía no está configurado: falta cargar la contraseña y el token de GitHub en el repo.";
        sealed = await res.json();
      } catch {
        return "No se pudo conectar. Revisá internet y probá de nuevo.";
      }
      const secret = await unseal(sealed, user, password);
      if (!secret) {
        failures.current++;
        await new Promise((r) => setTimeout(r, Math.min(600 * failures.current, 5000)));
        return "Usuario o contraseña incorrectos.";
      }
      failures.current = 0;
      const s = { user: user.trim().toLowerCase(), secret };
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      } catch {}
      setSession(s);
      await load(s);
      return null;
    },
    [load]
  );

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setSession(null);
    setDeploy({ kind: "idle" });
    setPhase({ kind: "login" });
  }, []);

  const startDeployWatch = useCallback(() => {
    setDeploySince(Date.now());
    setDeploy({ kind: "building" });
  }, []);

  // seguir la publicación en GitHub Actions hasta que termine
  useEffect(() => {
    if (!gh || !deploySince) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stop) return;
      const run = await gh.latestDeploy().catch(() => null);
      if (stop) return;
      if (!run) {
        // el token no puede ver Actions: no se muestra el estado
        if (Date.now() - deploySince > 30_000) return setDeploy({ kind: "idle" });
      } else if (new Date(run.createdAt).getTime() >= deploySince - 10_000) {
        if (run.status === "completed") return setDeploy({ kind: run.conclusion === "success" ? "done" : "failed", url: run.url });
        setDeploy({ kind: "building", url: run.url });
      }
      if (Date.now() - deploySince < 15 * 60_000) timer = setTimeout(tick, 8000);
      else setDeploy({ kind: "idle" });
    };
    timer = setTimeout(tick, 4000);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [gh, deploySince]);

  const saveSection = useCallback(
    async (key: SectionKey, raw: unknown): Promise<SaveResult> => {
      if (!gh || !session) return { ok: false, errors: ["Tu sesión se cerró. Volvé a entrar para guardar."] };
      const schema = SECTIONS[key];
      const { value, errors } = sanitizeSection(schema, raw);
      if (errors.length || value === undefined) return { ok: false, errors };

      const n = Array.isArray(value) ? value.length : 0;
      const summary = schema.kind === "list" ? `${schema.title}: ${n} ${schema.itemName}${n === 1 ? "" : "s"}` : schema.title;
      try {
        // si otro guardado se metió en el medio (sha distinto), se relee y se reintenta
        for (let attempt = 0; attempt < 3; attempt++) {
          const current = await gh.getText(CONTENT_FILE);
          const saved = current ? (JSON.parse(current.text) as Partial<SiteContent>) : {};
          const next = { ...saved, [key]: value };
          const r = await gh.put(CONTENT_FILE, textToB64(JSON.stringify(next, null, 2) + "\n"), `${COMMIT_PREFIX}${summary} [${session.user}]`, current?.sha);
          if (r === "ok") {
            setContent({ ...DEFAULT_CONTENT, ...next });
            startDeployWatch();
            return { ok: true, value };
          }
        }
        return { ok: false, errors: ["El contenido cambió mientras guardabas. Probá de nuevo."] };
      } catch (e) {
        if (e instanceof GitHubError && e.status === 401) logout();
        return { ok: false, errors: [e instanceof GitHubError ? e.message : "No se pudo guardar. Probá de nuevo en un momento."] };
      }
    },
    [gh, session, startDeployWatch, logout]
  );

  const upload = useCallback(
    async (file: File): Promise<string> => {
      if (!gh || !session) throw new Error("Tu sesión se cerró. Volvé a entrar.");
      const kind = UPLOAD_TYPES[file.type];
      if (!kind) throw new Error("Formato no permitido. Usá JPG, PNG, WEBP o PDF.");
      if (file.size > kind.max) throw new Error(`El archivo es muy pesado (máximo ${kind.max / 1024 / 1024} MB).`);
      if (!(await matchesSignature(file.type, file))) throw new Error("El archivo no coincide con su formato.");

      const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => x.toString(16).padStart(2, "0")).join("");
      const name = `${slugify(file.name.replace(/\.[^.]+$/, "")) || "archivo"}-${rand}.${kind.ext}`;
      const r = await gh.put(`${UPLOAD_DIR}/${name}`, await fileToB64(file), `${COMMIT_PREFIX}archivo ${name} [${session.user}]`);
      if (r !== "ok") throw new Error("No se pudo subir el archivo. Probá de nuevo.");
      const url = UPLOAD_URL_PREFIX + name;
      localPreviews.set(url, URL.createObjectURL(file));
      startDeployWatch();
      return url;
    },
    [gh, session, startDeployWatch]
  );

  if (phase.kind === "checking") return <div className="min-h-svh bg-ink" />;
  if (phase.kind === "login" || !session || !gh) return <LoginScreen onLogin={login} />;
  if (phase.kind === "loading")
    return (
      <div className="grid min-h-svh place-items-center bg-ink">
        <div className="flex items-center gap-3 text-sm text-foam/60" role="status">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-celeste border-t-transparent" /> Cargando contenido…
        </div>
      </div>
    );
  if (phase.kind === "error")
    return (
      <div className="grid min-h-svh place-items-center bg-ink px-5">
        <div className="max-w-md rounded-[24px] bg-white/[0.03] p-8 text-center ring-1 ring-white/10">
          <h1 className="font-display text-3xl uppercase">No se pudo cargar</h1>
          <p className="mt-3 text-sm text-foam/65">{phase.message}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => load(session)} className="admin-focus rounded-full bg-sol px-5 py-2.5 text-sm font-bold text-ink">
              Reintentar
            </button>
            <button onClick={logout} className="admin-focus rounded-full px-5 py-2.5 text-sm font-semibold ring-1 ring-white/20">
              Salir
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <PanelContext.Provider value={{ user: session.user, content, gh, deploy, saveSection, upload, logout }}>
      <PanelShell>{children}</PanelShell>
    </PanelContext.Provider>
  );
}
