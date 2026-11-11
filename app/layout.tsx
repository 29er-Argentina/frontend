import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { asset } from "@/lib/paths";

export const metadata: Metadata = {
  title: {
    default: "29er Argentina — Clase Internacional 29er",
    template: "%s · 29er Argentina",
  },
  description:
    "La comunidad argentina del 29er, el skiff juvenil de alto rendimiento: agenda de regatas, novedades, anualidad, reglamentos, barcos y clubes.",
  openGraph: {
    title: "29er Argentina",
    description: "Volar sobre el agua. La comunidad argentina del skiff 29er.",
    locale: "es_AR",
    type: "website",
  },
  icons: { icon: asset("/favicon.svg") },
};

export const viewport: Viewport = {
  themeColor: "#040b15",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
