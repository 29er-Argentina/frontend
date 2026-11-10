import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NewsCard, { NewsCover } from "@/components/NewsCard";
import { getContent } from "@/lib/store";
import { newsDate } from "@/lib/dates";

// las notas nuevas que se crean desde el panel también se generan
export const dynamicParams = true;

export async function generateStaticParams() {
  const { news: NEWS } = await getContent();
  return NEWS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata(props: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { news: NEWS } = await getContent();
  const item = NEWS.find((n) => n.slug === slug);
  if (!item) return {};
  return { title: item.title, description: item.excerpt };
}

export default async function NewsArticle(props: PageProps<"/news/[slug]">) {
  const { slug } = await props.params;
  const { news: NEWS } = await getContent();
  const item = NEWS.find((n) => n.slug === slug);
  if (!item) notFound();
  const more = NEWS.filter((n) => n.slug !== slug)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <article className="pt-32 sm:pt-40">
      <header className="mx-auto max-w-3xl px-5 sm:px-8">
        <nav aria-label="Ruta" className="animate-rise font-mono text-[11px] uppercase tracking-[0.25em] text-foam/40">
          <Link href="/" className="hover:text-white">
            Inicio
          </Link>
          <span className="mx-3 text-foam/20">/</span>
          <Link href="/news" className="hover:text-white">
            News
          </Link>
        </nav>
        <div className="mt-8 flex animate-rise items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] [animation-delay:80ms]">
          <span className="rounded-full bg-celeste px-3 py-1 font-bold text-ink">{item.tag}</span>
          <time dateTime={item.date} className="text-foam/60">
            {newsDate(item.date)}
          </time>
        </div>
        <h1 className="mt-5 animate-rise font-display text-[clamp(2.6rem,7vw,5.5rem)] uppercase leading-[0.9] [animation-delay:160ms]">{item.title}</h1>
        <p className="mt-6 animate-rise text-lg leading-relaxed text-foam/75 [animation-delay:240ms]">{item.excerpt}</p>
      </header>

      <div className="mx-auto mt-12 max-w-5xl animate-rise px-5 sm:px-8 [animation-delay:320ms]">
        <NewsCover item={item} className="aspect-[16/8] rounded-[28px] ring-1 ring-white/10" />
      </div>

      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <div className="space-y-6 text-lg leading-[1.75] text-foam/85 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-sol">
          {item.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <Link href="/news" className="mt-12 inline-flex items-center gap-2 rounded-full px-5 py-3 font-bold ring-1 ring-white/20 transition hover:bg-white/10">
          ← Todas las noticias
        </Link>
      </div>

      {more.length > 0 && (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <h2 className="font-display text-4xl uppercase">Seguí leyendo</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((n) => (
                <li key={n.slug}>
                  <NewsCard item={n} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
