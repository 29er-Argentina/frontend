import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionEditor from "@/components/admin/SectionEditor";
import { ADMIN_PAGES, SECTIONS } from "@/lib/admin-schema";
import { requireSession } from "@/lib/auth";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/admin/[page]">): Promise<Metadata> {
  const { page } = await props.params;
  return { title: ADMIN_PAGES.find((p) => p.slug === page)?.label ?? "Panel" };
}

export default async function AdminSectionPage(props: PageProps<"/admin/[page]">) {
  await requireSession();
  const { page } = await props.params;
  const { nuevo } = await props.searchParams;
  const def = ADMIN_PAGES.find((p) => p.slug === page);
  if (!def) notFound();
  const content = await getContent();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="animate-rise">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Editar</div>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">{def.label}</h1>
      </header>
      <div className="mt-10 space-y-14">
        {def.sections.map((key, i) => (
          <SectionEditor key={key} sectionKey={key} initial={content[key]} autoNew={i === 0 && nuevo === "1"} showTitle={def.sections.length > 1 || SECTIONS[key].kind === "list"} />
        ))}
      </div>
    </div>
  );
}
