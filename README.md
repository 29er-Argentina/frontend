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

## Build de producción

```bash
npm run build
npm run start
```

## Panel de administración

Todo el contenido (agenda, noticias, barcos, anualidad, documentos, clubes, comisión,
textos del inicio y datos de contacto) se edita desde **/admin**, sin tocar código.
Los cambios se publican al guardar.

- Usuario y contraseña: variables `ADMIN_USER` y `ADMIN_PASSWORD`.
- `SESSION_SECRET`: clave para firmar la sesión (32 caracteres o más).

En local están en `.env.local` (no se sube a git). Para generar un `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

El contenido inicial está en `lib/defaults.ts`. Lo que se guarda desde el panel lo reemplaza sección por sección.

### Dónde se guarda

**En GitHub** (recomendado para producción): si están `GITHUB_TOKEN` y `GITHUB_REPO`, cada guardado
es un commit al repo, en `data/content.json`, y las fotos y PDFs van a `data/uploads/`. El historial
de git es el registro de cambios y la copia de seguridad.

| Variable | Valor |
|---|---|
| `GITHUB_TOKEN` | Token *fine-grained* con permiso **Contents: Read and write** solo sobre este repo |
| `GITHUB_REPO` | `usuario/repo` |
| `GITHUB_BRANCH` | Rama (por defecto `main`) |
| `GITHUB_DATA_PATH` | Carpeta dentro del repo (por defecto `data`) |

El token va **solo** en las variables de entorno del servidor: nunca en el código ni en el repo.

**En disco** (si no hay token): archivos en `DATA_DIR` (por defecto `./data`), con una copia de la
versión anterior en `DATA_DIR/backups` antes de cada guardado. Sirve para trabajar en local.

## Deploy

- **Render**: el repo incluye `render.yaml`. En el dashboard hay que cargar `ADMIN_PASSWORD`,
  `GITHUB_TOKEN` y `GITHUB_REPO`. Los commits del panel en `data/` no disparan un deploy nuevo
  (`buildFilter`): el sitio lee el contenido actualizado directo de GitHub.
- Sin las variables de GitHub, el plan *free* de Render pierde lo editado en cada deploy o reinicio.

## Estructura

```
app/(site)/          páginas públicas
app/admin/           panel: login, resumen y editores
app/media/           sirve las fotos y PDFs subidos
proxy.ts             protege /admin
components/          secciones del sitio; components/admin/ el panel
lib/content.ts       tipos del contenido y menú
lib/defaults.ts      contenido inicial
lib/admin-schema.ts  qué se edita en cada sección del panel
lib/store.ts         lectura y guardado del contenido
lib/three/, lib/game/  escena 3D y juego de regata
```
