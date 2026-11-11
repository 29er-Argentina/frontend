import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import Reveal from "@/components/Reveal";
import { Logo, LogoMark } from "@/components/Logo";
import { asset } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Manual de marca",
  description: "Logo, colores, tipografías y uso de la marca 29er Argentina.",
};

/* ───────── Datos de marca ───────── */

const PRIMARY = [
  { name: "Celeste 29er", hex: "#26A9E0", rgb: "38 · 169 · 224", token: "celeste", use: "Color de marca. Franjas de la bandera del logo, acentos, links y fondos de llamada.", ink: true },
  { name: "Sol", hex: "#FAAF40", rgb: "250 · 175 · 64", token: "sol", use: "El sol de la bandera. Botón principal y un solo detalle por pantalla.", ink: true },
  { name: "Blanco", hex: "#FFFFFF", rgb: "255 · 255 · 255", token: "white", use: "El logo siempre en blanco. Titulares sobre fondos oscuros.", ink: true },
  { name: "Ink", hex: "#040B15", rgb: "4 · 11 · 21", token: "ink", use: "Fondo principal: agua de noche. Es la base de toda la web.", ink: false },
];

const SUPPORT = [
  { name: "Abyss", hex: "#071426", token: "abyss" },
  { name: "Navy", hex: "#0B1D33", token: "navy" },
  { name: "Tide", hex: "#12304F", token: "tide" },
  { name: "Celeste claro", hex: "#88D0EE", token: "celeste-light" },
  { name: "Foam", hex: "#EEF5FB", token: "foam" },
  { name: "Boya", hex: "#FF6A1A", token: "buoy" },
];

const BENZIN = [
  { w: 400, n: "Regular" },
  { w: 500, n: "Medium" },
  { w: 600, n: "Semibold" },
  { w: 700, n: "Bold" },
  { w: 800, n: "ExtraBold" },
];

const SCALE = [
  { role: "Display / H1", font: "Benzin Bold · mayúsculas", size: "clamp(2.1rem, 5.9vw, 5.2rem)", lh: "0.86", sample: "Volar sobre el agua", cls: "font-display text-[clamp(1.7rem,4.6vw,3.6rem)] uppercase leading-[0.9]" },
  { role: "H2 de sección", font: "Benzin Bold · mayúsculas", size: "clamp(1.8rem, 4.6vw, 3.9rem)", lh: "0.88", sample: "Lo último de la flota", cls: "font-display text-[clamp(1.4rem,3.4vw,2.6rem)] uppercase leading-[0.9]" },
  { role: "H3 / tarjeta", font: "Benzin Bold · mayúsculas", size: "1.25–1.5rem", lh: "1", sample: "Trapecio simple", cls: "font-display text-xl uppercase leading-none sm:text-2xl" },
  { role: "Etiqueta", font: "Acumin ancha · mayúsculas · +0.3em", size: "11px", lh: "1.4", sample: "Clase internacional 29er · Argentina", cls: "font-mono text-[11px] uppercase tracking-[0.3em] text-celeste" },
  { role: "Cuerpo", font: "Acumin Regular", size: "16–18px", lh: "1.65", sample: "La comunidad argentina del 29er, el skiff juvenil de alto rendimiento. Dos tripulantes, un trapecio, un asimétrico y muchas ganas de ir rápido.", cls: "max-w-xl text-base leading-relaxed text-foam/80 sm:text-lg" },
];

const DONTS: { label: string; style?: React.CSSProperties; light?: boolean }[] = [
  { label: "No cambiar los colores del logo", style: { filter: "hue-rotate(140deg) saturate(2)" } },
  { label: "No deformarlo", style: { transform: "scaleX(1.45)" } },
  { label: "No rotarlo", style: { transform: "rotate(-14deg)" } },
  { label: "No ponerlo sobre fondos claros", light: true },
];

/* ───────── Página ───────── */

export default function MarcaPage() {
  return (
    <>
      <PageHeader
        index="—"
        kicker="Manual de marca"
        sail="29ER"
        title={
          <>
            Manual <br />
            de <span className="text-celeste">marca</span>
          </>
        }
        intro="Cómo usar el logo, los colores y las tipografías de 29er Argentina. Todo sale del logo: la bandera, el sol, el 29er en itálica y la palabra ARGENTINA."
        links={[
          { href: "#logo", label: "Logo" },
          { href: "#color", label: "Color" },
          { href: "#tipografia", label: "Tipografía" },
          { href: "#aplicacion", label: "Aplicación" },
        ]}
      />

      {/* ───── 01 · Logo ───── */}
      <section id="logo" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading index="01" kicker="Logo" title={<>El <span className="text-celeste">logo</span></>}>
            Es una sola pieza: el 29er en itálica, la bandera argentina en movimiento y ARGENTINA en Acumin. Se usa siempre en blanco y nunca se redibuja.
          </SectionHeading>

          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            <Reveal className="relative grid min-h-[340px] place-items-center overflow-hidden rounded-[28px] bg-ink ring-1 ring-white/10 lg:col-span-7">
              {/* área de resguardo */}
              <div className="relative mt-6 p-6 sm:p-8">
                <div className="pointer-events-none absolute inset-0 rounded-md border border-dashed border-celeste/50" />
                <div className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] text-celeste/80">Área de resguardo = altura de la “e”</div>
                <Logo className="h-32 sm:h-40" />
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              <Reveal delay={80} className="grid min-h-[160px] place-items-center rounded-[28px] bg-celeste">
                <Logo className="h-20" />
              </Reveal>
              <Reveal delay={140} className="relative grid min-h-[160px] place-items-center overflow-hidden rounded-[28px]">
                <img src={asset("/videos/barcos-hero.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-ink/45" />
                <Logo className="relative h-20" />
              </Reveal>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Reveal className="rounded-[22px] bg-white/[0.03] p-6 ring-1 ring-white/10">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foam/50">Fondos permitidos</div>
              <p className="mt-3 text-sm leading-relaxed text-foam/75">Ink, Navy, Celeste 29er o una foto oscurecida. Contraste suficiente para que el blanco se lea entero.</p>
            </Reveal>
            <Reveal delay={60} className="rounded-[22px] bg-white/[0.03] p-6 ring-1 ring-white/10">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foam/50">Tamaño mínimo</div>
              <p className="mt-3 text-sm leading-relaxed text-foam/75">80 px de ancho en pantalla, 22 mm en impresión. Más chico, usar el sello circular.</p>
            </Reveal>
            <Reveal delay={120} className="flex items-center gap-5 rounded-[22px] bg-white/[0.03] p-6 ring-1 ring-white/10">
              <LogoMark className="h-16 w-16" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foam/50">Sello</div>
                <p className="mt-2 text-sm leading-relaxed text-foam/75">Para avatares, favicon y fondos claros: el logo dentro del círculo Ink.</p>
              </div>
            </Reveal>
          </div>

          <h3 className="mt-16 font-mono text-[11px] uppercase tracking-[0.3em] text-buoy">No hacer</h3>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {DONTS.map((d, i) => (
              <Reveal key={d.label} delay={i * 60}>
                <div className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[22px] ring-1 ${d.light ? "bg-[#f1f3f5] ring-black/5" : "bg-navy ring-white/10"}`}>
                  <div style={d.style}>
                    <Logo className="h-14 sm:h-16" />
                  </div>
                  <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-buoy text-sm font-bold text-ink" aria-hidden>
                    ✕
                  </span>
                </div>
                <p className="mt-3 text-sm text-foam/70">{d.label}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <a
              href={asset("/logo-29er.png")}
              download="29er-argentina-logo.png"
              className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 font-bold text-ink transition hover:bg-celeste"
            >
              Descargar logo (PNG transparente)
              <span aria-hidden>↓</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ───── 02 · Color ───── */}
      <section id="color" className="scroll-mt-24 border-t border-white/10 bg-abyss py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading index="02" kicker="Color" title={<>Cielo, sol <br />y <span className="text-celeste">agua</span></>}>
            El celeste y el sol salen de la bandera del logo. El resto de la paleta son azules de agua profunda que dejan que esos dos brillen.
          </SectionHeading>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRIMARY.map((c, i) => (
              <Reveal key={c.hex} delay={i * 60} className="overflow-hidden rounded-[24px] ring-1 ring-white/10">
                <div className="flex aspect-[5/4] items-end p-5" style={{ background: c.hex }}>
                  <span className={`font-display text-xl uppercase ${c.ink ? "text-ink" : "text-white"}`}>{c.name}</span>
                </div>
                <div className="bg-ink p-5">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em]">
                    <dt className="text-foam/40">Hex</dt>
                    <dd className="select-all text-foam">{c.hex}</dd>
                    <dt className="text-foam/40">RGB</dt>
                    <dd className="text-foam/80">{c.rgb}</dd>
                    <dt className="text-foam/40">Token</dt>
                    <dd className="text-celeste normal-case tracking-normal">{c.token}</dd>
                  </dl>
                  <p className="mt-4 text-sm leading-relaxed text-foam/65">{c.use}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <h3 className="mt-14 font-mono text-[11px] uppercase tracking-[0.3em] text-foam/50">Apoyo</h3>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SUPPORT.map((c) => (
              <div key={c.hex} className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                <div className="h-20" style={{ background: c.hex }} />
                <div className="bg-ink px-4 py-3">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="mt-0.5 select-all font-mono text-[11px] uppercase tracking-[0.15em] text-foam/50">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>

          {/* proporción */}
          <h3 className="mt-14 font-mono text-[11px] uppercase tracking-[0.3em] text-foam/50">Proporción en pantalla</h3>
          <div className="mt-5 flex h-14 overflow-hidden rounded-2xl ring-1 ring-white/10" role="img" aria-label="Ink 60 %, azules de apoyo 20 %, celeste 12 %, blanco 6 %, sol 2 %">
            <div className="grid basis-[60%] place-items-center bg-ink font-mono text-[10px] uppercase tracking-[0.2em] text-foam/50">Ink 60</div>
            <div className="grid basis-[20%] place-items-center bg-tide font-mono text-[10px] uppercase tracking-[0.2em] text-foam/60">Azules 20</div>
            <div className="grid basis-[12%] place-items-center bg-celeste font-mono text-[10px] uppercase tracking-[0.2em] text-ink">12</div>
            <div className="basis-[6%] bg-white" />
            <div className="basis-[2%] bg-sol" />
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foam/60">
            La Boya (naranja) es solo para alertas: penalidades, errores y avisos. No es color de marca.
          </p>
        </div>
      </section>

      {/* ───── 03 · Tipografía ───── */}
      <section id="tipografia" className="scroll-mt-24 border-t border-white/10 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading index="03" kicker="Tipografía" title={<>Dos familias, <br /><span className="text-celeste">una voz</span></>}>
            Benzin para lo que se grita: ancha, moderna, con velocidad. Acumin para lo que se lee: es la letra de ARGENTINA en el logo, y en su versión ancha arma las etiquetas.
          </SectionHeading>

          <div className="mt-14 grid gap-4 lg:grid-cols-2">
            {/* Benzin */}
            <Reveal className="rounded-[28px] bg-white/[0.03] p-7 ring-1 ring-white/10 sm:p-10">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Titulares</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foam/40">5 pesos</span>
              </div>
              <div className="mt-6 font-display text-[clamp(3.2rem,9vw,6rem)] leading-none">Aa</div>
              <div className="mt-2 font-display text-3xl uppercase">Benzin</div>
              <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
                {BENZIN.map((b) => (
                  <li key={b.w} className="flex items-baseline justify-between gap-4">
                    <span className="truncate font-display text-xl uppercase sm:text-2xl" style={{ fontWeight: b.w }}>
                      Planeo
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-foam/45">
                      {b.n} · {b.w}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-foam/60">
                Siempre en mayúsculas, Bold para titulares y ExtraBold para números grandes. Interletrado −1 %. No usar para párrafos.
              </p>
            </Reveal>

            {/* Acumin */}
            <Reveal delay={100} className="rounded-[28px] bg-white/[0.03] p-7 ring-1 ring-white/10 sm:p-10">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Texto y etiquetas</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foam/40">Variable</span>
              </div>
              <div className="mt-6 text-[clamp(3.2rem,9vw,6rem)] font-semibold leading-none">Aa</div>
              <div className="mt-2 text-3xl font-semibold">Acumin Variable Concept</div>
              <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
                <p className="text-lg leading-relaxed text-foam/85">Dos tripulantes, un trapecio y un asimétrico. Así se vuela en 29er.</p>
                <p className="text-lg font-bold">Bold para destacar dentro del texto.</p>
                <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-foam/80">Ancha · mayúsculas · +0.3em</p>
                <p className="font-mono text-2xl text-sol">4,45 m · 74 kg · 15 m²</p>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-foam/60">
                Es de Adobe Fonts. En la web, mientras no esté el kit de Adobe, se muestra <strong className="text-foam/80">Archivo Variable</strong>, que tiene las mismas proporciones y el mismo eje de ancho.
              </p>
            </Reveal>
          </div>

          <h3 className="mt-14 font-mono text-[11px] uppercase tracking-[0.3em] text-foam/50">Jerarquía</h3>
          <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {SCALE.map((s) => (
              <div key={s.role} className="grid gap-4 py-7 md:grid-cols-12 md:items-center">
                <div className="md:col-span-3">
                  <div className="text-sm font-semibold">{s.role}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foam/45">{s.font}</div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.1em] text-foam/35">
                    {s.size} · lh {s.lh}
                  </div>
                </div>
                <div className={`md:col-span-9 ${s.cls}`}>{s.sample}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 04 · Aplicación ───── */}
      <section id="aplicacion" className="scroll-mt-24 border-t border-white/10 bg-abyss py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading index="04" kicker="Aplicación" title={<>Todo junto, <br /><span className="text-celeste">a favor del viento</span></>}>
            Fondos oscuros, mucho aire, un titular grande en Benzin y un solo toque de sol. Las fotos de regata van siempre oscurecidas para que el texto blanco respire.
          </SectionHeading>

          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            {/* Post / portada */}
            <Reveal className="relative overflow-hidden rounded-[28px] lg:col-span-7">
              <img src={asset("/videos/barcos-hero.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-ink via-ink/70 to-ink/10" />
              <div className="relative flex min-h-[420px] flex-col justify-between p-7 sm:p-10">
                <Logo className="h-12 self-start" />
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Sudamericano · Marzo</div>
                  <div className="mt-3 font-display text-[clamp(2rem,5vw,3.6rem)] uppercase leading-[0.9]">
                    A volar <br />
                    en <span className="text-celeste">Mar del Plata</span>
                    <span className="text-sol">.</span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-3 rounded-full bg-sol px-6 py-3 font-bold text-ink">Inscribite →</span>
                </div>
              </div>
            </Reveal>

            <div className="grid gap-4 lg:col-span-5">
              {/* Bandera */}
              <Reveal delay={80} className="rounded-[28px] bg-ink p-7 ring-1 ring-white/10">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foam/50">Recurso gráfico · la franja</div>
                <div className="mt-5 overflow-hidden">
                  <div className="ml-auto h-16 w-[85%] [clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]">
                    <div className="h-1/3 bg-celeste" />
                    <div className="relative h-1/3 bg-white">
                      <span className="absolute right-[22%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-sol" />
                    </div>
                    <div className="h-1/3 bg-celeste" />
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-foam/65">La bandera del logo, cortada en diagonal como una vela. Sirve como separador o cierre de piezas.</p>
              </Reveal>

              {/* Voz */}
              <Reveal delay={140} className="rounded-[28px] bg-celeste p-7 text-ink">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60">Voz</div>
                <p className="mt-4 font-display text-2xl uppercase leading-[0.95]">Directa, de vos, con viento.</p>
                <ul className="mt-5 space-y-2 text-sm font-medium leading-relaxed text-ink/80">
                  <li>Sí: “Sumate a la flota”, “Jugá la regata”.</li>
                  <li>No: “Le invitamos a participar de la actividad”.</li>
                  <li>Términos de náutica sin miedo: ceñida, trasluchada, planeo.</li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
