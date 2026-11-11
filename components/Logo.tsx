import { asset } from "@/lib/paths";

const LOGO_SRC = "/logo-29er.png"; // 468×322, blanco sobre transparente

/** Logo oficial tal cual (blanco): para fondos oscuros. */
export function Logo({ className = "" }: { className?: string }) {
  return <img src={asset(LOGO_SRC)} alt="29er Argentina" width={468} height={322} className={`w-auto ${className}`} />;
}

/** Logo dentro de un círculo oscuro: se ve sobre cualquier fondo (también en la hoja blanca de impresión). */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span role="img" aria-label="29er Argentina" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#1f1d1c] ${className}`}>
      <img src={asset(LOGO_SRC)} alt="" width={468} height={322} className="h-auto w-[68%] translate-x-[-2%]" />
    </span>
  );
}

export function Wordmark() {
  return <Logo className="h-10 sm:h-11" />;
}
