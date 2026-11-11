# 29er Argentina — sitio web

Sitio de la clase 29er en Argentina hecho con **Next.js 16**, **Tailwind CSS 4** y **Three.js**.

## Qué tiene

- **Hero 3D en tiempo real**: un 29er procedural (casco, alas, mayor con sables, foque autovirante,
  asimétrico con los colores de la bandera y tripulación en el trapecio) navegando sobre un océano
  con olas de Gerstner, cielo de atardecer con nubes, reflejos, espuma, estela y bloom.
  El barco alterna una popa con asimétrico y una ceñida.
- **Juego "Regata 29er"**: recorrido barlovento-sotavento con largada, boya 1, boya 2 y llegada.
  Polar de velocidades realista (zona de proa al viento, asimétrico automático de popa), viento que rola,
  ráfagas visibles en el agua, minimapa, rosa de viento, parciales y récord guardado en el navegador.
  Controles: ← → o A/D, `C` cambia la cámara; en celular, botones táctiles.
- Secciones: la clase (plano técnico + especificaciones), temporada (basada en las historias
  destacadas de Instagram), sumate y contacto.

## Correr en local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Build

```bash
npm run build   # genera el sitio estático en out/
npm run start   # lo sirve en local para revisarlo
```

Es un sitio **100 % estático** (`output: "export"`): no necesita servidor.

## Publicación (GitHub Pages)

`.github/workflows/deploy.yml` construye y publica el sitio en GitHub Pages:

- con cada push a `gh-pages`, la única rama del repo (incluidos los guardados del panel);
- todos los días a las 3 AM, para que la agenda pase solos los eventos terminados a "pasados";
- a mano, desde la pestaña *Actions* → *Publicar sitio* → *Run workflow*.

En *Settings → Pages* la fuente tiene que ser **GitHub Actions**.

## Panel de administración

Todo el contenido (agenda, noticias, barcos, anualidad, documentos, clubes, comisión,
textos del inicio y datos de contacto) se edita desde **/admin**, sin tocar código.

Cómo funciona sin servidor:

1. Al guardar, el panel hace un commit al repo desde el navegador: el contenido va a
   `content/site.json` y las fotos y PDFs a `public/uploads/`. El historial de git es el
   registro de cambios y la copia de seguridad.
2. Ese commit dispara el workflow, que reconstruye el sitio. En 1 o 2 minutos está publicado
   (el panel muestra un aviso cuando termina).

Para hacer commits, el panel necesita un token de GitHub. En cada build,
`scripts/seal-panel-key.mjs` lo **cifra con el usuario y la contraseña** del panel
(PBKDF2 de 600.000 iteraciones + AES-GCM) y lo deja en `/panel-key.json`. Al entrar, el
navegador lo descifra con lo que se escribe en el login. Sin la contraseña correcta, el
archivo no sirve.

Como ese archivo es público, **la contraseña tiene que ser larga** (una frase de 4 o 5
palabras): el build en GitHub falla si tiene menos de 14 caracteres.

### Configuración (Settings → Secrets and variables → Actions)

| Nombre | Tipo | Valor |
|---|---|---|
| `ADMIN_PASSWORD` | Secret | Contraseña del panel (14 caracteres o más) |
| `PANEL_TOKEN` | Secret | Token *fine-grained* solo sobre este repo, con **Contents: Read and write** y **Actions: Read** |
| `ADMIN_USER` | Variable (opcional) | Usuario del panel (por defecto `delfi`) |

Si faltan, el sitio se publica igual, pero el panel no deja entrar.

Para cambiar la contraseña o renovar el token: se actualiza el secret y se vuelve a correr el
workflow. La llave vieja deja de servir.

En local, las mismas variables van en `.env.local` (no se sube a git).

El contenido inicial está en `lib/defaults.ts`. Lo que se guarda desde el panel lo reemplaza sección por sección.

## Estructura

```
app/(site)/            páginas públicas
app/admin/             panel: resumen y editores
components/            secciones del sitio; components/admin/ el panel
content/site.json      contenido guardado desde el panel (lo crea el primer guardado)
public/uploads/        fotos y PDFs subidos desde el panel
lib/content.ts         tipos del contenido y menú
lib/defaults.ts        contenido inicial
lib/admin-schema.ts    qué se edita en cada sección del panel
lib/store.ts           lectura del contenido al momento del build
lib/github.ts          commits desde el panel
scripts/seal-panel-key.mjs  cifra el token del panel en cada build
lib/three/, lib/game/  escena 3D y juego de regata
```
