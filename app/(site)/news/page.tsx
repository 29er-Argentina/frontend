import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import NewsCard from "@/components/NewsCard";
import Reveal from "@/components/Reveal";
import { InstagramIcon } from "@/components/Nav";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "News",
  description: "Noticias de la clase 29er en Argentina: regatas, mundiales, anualidad y novedades de la flota.",
};

export default async function NewsPage() {
  const { news: NEWS, general: LINKS } = await getContent();
  const items = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  const [first, ...rest] = items;
  return (
    <>
      <PageHeader
        index="04"
        kicker="News"
        sail="NEWS"
        title={
          <>
            Noticias <br />
            de la <span className="text-celeste">flota</span>
          </>
        }
        intro="Regatas, mundiales y novedades de la clase. Lo del día a día lo contamos en Instagram."
      />

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        {first && (
          <Reveal className="mb-6 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <NewsCard item={first} size="lg" />
            </div>
            <a
              href={LINKS.instagram}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col justify-between rounded-[24px] bg-gradient-to-br from-buoy to-sol p-8 text-ink lg:col-span-4"
            >
              <InstagramIcon className="h-10 w-10" />
              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-ink/60">@29er_argentina</div>
                <div className="mt-2 font-display text-3xl uppercase leading-[0.9]">
                  El día a día, <br />
                  en historias
                </div>
                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white transition group-hover:gap-4">
                  Seguinos <span>↗</span>
                </span>
              </div>
            </a>
          </Reveal>
        )}
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((n, i) => (
            <Reveal as="li" key={n.slug} delay={(i % 3) * 90} className="h-full">
              <NewsCard item={n} />
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
