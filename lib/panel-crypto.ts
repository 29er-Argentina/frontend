/*
 * Llave del panel. En el build, scripts/seal-panel-key.mjs cifra el token de
 * GitHub con el usuario y la contraseña (PBKDF2 + AES-GCM) y lo deja en
 * /panel-key.json. Al entrar, el navegador lo descifra con lo que escribe
 * Delfi: sin la contraseña correcta el archivo no sirve para nada.
 * Este archivo y el script tienen que derivar la clave igual.
 */

export type PanelSecret = { token: string; repo: string; branch: string; api: string };
export type SealedKey = { v: 1; iter: number; salt: string; iv: string; data: string };

const enc = new TextEncoder();

function fromB64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function deriveKey(user: string, password: string, salt: Uint8Array, iter: number) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const fullSalt = new Uint8Array([...salt, ...enc.encode(`|${user.trim().toLowerCase()}`)]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: fullSalt, iterations: iter }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}

/** Devuelve el secreto si usuario y contraseña son correctos, o null. */
export async function unseal(sealed: SealedKey, user: string, password: string): Promise<PanelSecret | null> {
  try {
    const key = await deriveKey(user, password, fromB64(sealed.salt), sealed.iter);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(sealed.iv) }, key, fromB64(sealed.data));
    return JSON.parse(new TextDecoder().decode(plain)) as PanelSecret;
  } catch {
    return null;
  }
}
