// Genera public/panel-key.json: el token de GitHub cifrado con el usuario y la
// contraseña del panel. Corre antes de cada build (ver package.json).
//
// Variables:
//   ADMIN_USER      usuario del panel (por defecto "delfi")
//   ADMIN_PASSWORD  contraseña del panel
//   PANEL_TOKEN     token fine-grained de GitHub (Contents: Read and write)
//   PANEL_REPO      "org/repo" (en GitHub Actions sale solo de GITHUB_REPOSITORY)
//   PANEL_BRANCH    rama (por defecto la del build, o "main")

import { mkdir, rm, writeFile } from "node:fs/promises";

const OUT = "public/panel-key.json";
const ITERATIONS = 600_000;
const MIN_PASSWORD = 14;

const user = (process.env.ADMIN_USER || "delfi").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const token = process.env.PANEL_TOKEN || "";
const repo = process.env.PANEL_REPO || process.env.GITHUB_REPOSITORY || "";
const branch = process.env.PANEL_BRANCH || process.env.GITHUB_REF_NAME || "main";
const api = (process.env.PANEL_API_URL || "https://api.github.com").replace(/\/+$/, "");

if (!password || !token || !repo) {
  await rm(OUT, { force: true });
  console.log("[panel] sin ADMIN_PASSWORD / PANEL_TOKEN / repo: el sitio se publica, pero el panel no va a poder guardar.");
  process.exit(0);
}

// el archivo cifrado es público: una contraseña corta se adivina por fuerza bruta
if (password.length < MIN_PASSWORD) {
  const msg = `[panel] ADMIN_PASSWORD tiene que tener al menos ${MIN_PASSWORD} caracteres (por ejemplo, una frase de 4 o 5 palabras).`;
  if (process.env.CI) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`${msg} Se acepta solo porque es un build local.`);
}

const enc = new TextEncoder();
const b64 = (bytes) => Buffer.from(bytes).toString("base64");

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array([...salt, ...enc.encode(`|${user}`)]), iterations: ITERATIONS },
  base,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"]
);
const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify({ token, repo, branch, api })));

await mkdir("public", { recursive: true });
await writeFile(OUT, JSON.stringify({ v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) }));
console.log(`[panel] llave generada para "${user}" → ${repo}@${branch}`);
