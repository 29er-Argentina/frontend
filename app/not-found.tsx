import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grain relative grid min-h-[80svh] place-items-center overflow-hidden px-5 pt-24 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none font-display text-[40vw] leading-none text-outline [--outline:rgba(116,172,223,0.12)]">
        404
      </div>
      <div className="relative">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Fuera de la cancha</div>
        <h1 className="mt-4 font-display text-[clamp(3rem,9vw,7rem)] uppercase leading-[0.88]">
          Esta boya <br />
          no existe
        </h1>
        <p className="mx-auto mt-5 max-w-md text-foam/70">La página que buscás no está o cambió de lugar. Volvé a la línea de largada.</p>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-sol px-7 py-4 font-bold text-ink transition hover:-translate-y-0.5">
          Volver al inicio →
        </Link>
      </div>
    </section>
  );
}
