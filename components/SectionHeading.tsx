import Reveal from "./Reveal";

export default function SectionHeading({ index, kicker, title, children }: { index: string; kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
      <Reveal className="lg:col-span-7">
        <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.3em] text-celeste">
          <span className="text-foam/40">{index}</span>
          <span className="h-px w-10 bg-celeste/50" />
          {kicker}
        </div>
        <h2 className="mt-5 font-display text-[clamp(1.8rem,4.6vw,3.9rem)] uppercase leading-[0.88]">{title}</h2>
      </Reveal>
      {children && (
        <Reveal delay={120} className="text-base leading-relaxed text-foam/75 lg:col-span-5 lg:pb-3">
          {children}
        </Reveal>
      )}
    </div>
  );
}
