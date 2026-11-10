"use client";

import { usePanel } from "./PanelProvider";
import SectionEditor from "./SectionEditor";
import { ADMIN_PAGES, SECTIONS } from "@/lib/admin-schema";

export default function SectionPage({ slug }: { slug: string }) {
  const { content } = usePanel();
  const def = ADMIN_PAGES.find((p) => p.slug === slug);
  if (!def) return null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="animate-rise">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">Editar</div>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">{def.label}</h1>
      </header>
      <div className="mt-10 space-y-14">
        {def.sections.map((key, i) => (
          <SectionEditor key={key} sectionKey={key} initial={content[key]} autoNew={i === 0} showTitle={def.sections.length > 1 || SECTIONS[key].kind === "list"} />
        ))}
      </div>
    </div>
  );
}
