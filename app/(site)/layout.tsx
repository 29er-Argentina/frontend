import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getContent } from "@/lib/store";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getContent();
  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-sol px-5 py-3 font-bold text-ink transition focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <Nav instagram={general.instagram} />
      <main id="contenido">{children}</main>
      <Footer />
    </>
  );
}
