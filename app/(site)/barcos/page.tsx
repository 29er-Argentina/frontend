import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import ContactList from "@/components/ContactList";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "Barcos",
  description: "Barcos 29er usados a la venta en Argentina, astillero Riotecna y qué revisar antes de comprar.",
};

const CHECKLIST = [
  { t: "Casco", d: "Buscá zonas blandas en el fondo y la cubierta, fisuras en el gelcoat y el estado del pozo de orza." },
  { t: "Alas y trapecio", d: "Que las alas no tengan juego y que los cables y herrajes del trapecio estén sanos." },
  { t: "Mástil", d: "Tramos derechos, sin corrosión en las uniones, con crucetas y obenques en buen estado." },
  { t: "Orza y timón", d: "Bordes sin golpes ni delaminado. Revisá que la pala del timón no tenga juego en la caña." },
  { t: "Velas", d: "Mayor, foque y asimétrico: año, estado de los sables y si están dentro de las reglas de clase." },
  { t: "Papeles", d: "Número de vela, certificado de medición y que la anualidad del barco esté al día." },
];

export default async function BarcosPage() {
  const { boats: BOATS, general: LINKS, specs: SPECS } = await getContent();
  const s = { name: BOATS.shipyardName, text: BOATS.shipyardText, contactName: BOATS.contactName, phone: BOATS.phone, email: BOATS.email, web: BOATS.web };
  const sheetHref = BOATS.usedSheet || `mailto:${LINKS.email}?subject=${encodeURIComponent("Planilla de barcos usados")}`;
  return (
    <>
      <PageHeader
        index="02"
        kicker="Barcos"
        sail="29"
        title={
          <>
            Tu próximo <br />
            <span className="text-celeste">29er</span>
          </>
        }
        intro="Un barco de dos tripulantes, liviano y explosivo. Acá encontrás los usados que están a la venta en el país y el contacto del astillero para barcos nuevos, repuestos y reparaciones."
        links={[
          { href: "#venta", label: "Venta de usados" },
          { href: "#astillero", label: "Astillero" },
          { href: "#checklist", label: "Qué revisar" },
        ]}
      />

      {/* Ficha rápida */}
      <section className="mx-auto max-w-7xl px-5 pt-16 sm:px-8">
        <Reveal className="grid grid-cols-3 gap-px overflow-hidden rounded-[24px] bg-white/10 ring-1 ring-white/10 sm:grid-cols-6">
          {SPECS.map((sp) => (
            <div key={sp.label} className="bg-ink p-5">
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-foam/45">{sp.label}</div>
              <div className="mt-2 font-display text-3xl">
                {(sp.value ?? 0).toLocaleString("es-AR", { minimumFractionDigits: sp.decimals ?? 0, maximumFractionDigits: sp.decimals ?? 0 })}
                <span className="ml-1 font-mono text-xs text-celeste">{sp.unit}</span>
              </div>
            </div>
          ))}
        </Reveal>
        <p className="mt-4 font-mono text-[11px] text-foam/40">
          Más sobre el barco en{" "}
          <Link href="/#clase" className="underline decoration-white/20 underline-offset-4 hover:text-foam">
            la clase
          </Link>
          .
        </p>
      </section>

      {/* Venta */}
      <section id="venta" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8">
        <Reveal>
          <a
            href={sheetHref}
            target={BOATS.usedSheet ? "_blank" : undefined}
            rel="noreferrer"
            className="group relative grid overflow-hidden rounded-[28px] bg-celeste text-ink lg:grid-cols-12"
          >
            <div className="relative p-8 sm:p-12 lg:col-span-7">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-navy/70">Barcos usados a la venta</div>
              <h2 className="mt-4 font-display text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[0.88]">
                La planilla <br />
                de usados
              </h2>
              <p className="mt-5 max-w-md font-medium text-navy/80">
                Todos los 29er a la venta en Argentina en una hoja de cálculo: número de vela, año, estado, precio y contacto del dueño.
              </p>
              <span className="mt-8 inline-flex items-center gap-3 rounded-full bg-ink px-6 py-4 font-bold text-white transition group-hover:gap-5">
                {BOATS.usedSheet ? "Abrir la hoja de cálculo" : "Pedir la planilla por mail"} <span>↗</span>
              </span>
              <p className="mt-5 text-sm text-navy/70">¿Vendés el tuyo? Mandanos los datos a {LINKS.email} y lo sumamos.</p>
            </div>
            <div className="relative hidden min-h-[320px] lg:col-span-5 lg:block">
              <SheetArt />
            </div>
          </a>
        </Reveal>
      </section>

      {/* Astillero */}
      <section id="astillero" className="mx-auto max-w-7xl scroll-mt-28 px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <Reveal className="relative overflow-hidden rounded-[28px] bg-navy p-8 ring-1 ring-white/10 sm:p-12 lg:col-span-7">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "linear-gradient(rgba(116,172,223,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(116,172,223,.18) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Astillero</div>
              <h2 className="mt-4 font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.85]">{s.name}</h2>
              <p className="mt-5 max-w-md leading-relaxed text-foam/75">{s.text}</p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {BOATS.shipyardServices.map((t) => (
                  <li key={t} className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-sm text-foam/80 ring-1 ring-white/10">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120} className="rounded-[28px] bg-white/[0.03] p-8 ring-1 ring-white/10 sm:p-10 lg:col-span-5">
            <h3 className="font-display text-3xl uppercase">Contacto</h3>
            <div className="mt-4">
              <ContactList
                rows={[
                  { label: "Nombre", value: s.contactName },
                  { label: "Teléfono", value: s.phone, href: s.phone ? `tel:${s.phone.replace(/\s/g, "")}` : null },
                  { label: "Mail", value: s.email, href: s.email ? `mailto:${s.email}` : null },
                  { label: "Web", value: s.web.replace(/^https?:\/\//, ""), href: s.web },
                ]}
              />
            </div>
            {s.phone && (
              <a
                href={`https://wa.me/${s.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-ink transition hover:bg-celeste"
              >
                Escribir por WhatsApp
              </a>
            )}
          </Reveal>
        </div>
      </section>

      {/* Checklist */}
      <section id="checklist" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-4xl uppercase leading-none sm:text-6xl">
            Antes de comprar <span className="text-sol">un usado</span>
          </h2>
          <p className="max-w-sm text-sm text-foam/60">Seis cosas para revisar con alguien que conozca el barco antes de cerrar la compra.</p>
        </div>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-[24px] bg-white/10 ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKLIST.map((c, i) => (
            <Reveal as="li" key={c.t} delay={i * 60} className="bg-ink p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full ring-1 ring-sol/60 font-mono text-xs text-sol">{i + 1}</span>
                <h3 className="font-display text-2xl uppercase">{c.t}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foam/65">{c.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>
    </>
  );
}

/** Ilustración de planilla con filas de barcos. */
function SheetArt() {
  // ilustrativa: no son barcos reales
  const rows = Array.from({ length: 5 }, () => ["ARG ····", "20··", "$ ···"]);
  return (
    <div className="absolute inset-y-10 -right-10 left-6 rotate-[-4deg] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(4,11,21,0.5)] transition duration-500 group-hover:rotate-[-2deg]">
      <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-tide px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
        <span>Vela</span>
        <span>Año</span>
        <span>Precio</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`grid grid-cols-[1.4fr_1fr_1fr] px-4 py-3 font-mono text-sm ${i % 2 ? "bg-foam" : "bg-white"}`}>
          {r.map((c, j) => (
            <span key={j} className={j === 0 ? "font-bold" : "text-ink/60"}>
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
