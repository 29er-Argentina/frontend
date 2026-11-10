/** Lista de datos de contacto; los vacíos se muestran como "a confirmar". */
export default function ContactList({
  rows,
  dark = true,
}: {
  rows: { label: string; value: string | null; href?: string | null }[];
  dark?: boolean;
}) {
  return (
    <dl className={`divide-y ${dark ? "divide-white/10" : "divide-ink/10"}`}>
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-6 py-3.5">
          <dt className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] ${dark ? "text-foam/45" : "text-ink/50"}`}>{r.label}</dt>
          <dd className="min-w-0 text-right [overflow-wrap:anywhere]">
            {r.value ? (
              r.href ? (
                <a
                  href={r.href}
                  target={r.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`font-semibold underline underline-offset-4 ${dark ? "text-white decoration-celeste/60 hover:decoration-sol" : "text-ink decoration-ink/30 hover:decoration-ink"}`}
                >
                  {r.value}
                </a>
              ) : (
                <span className="font-semibold">{r.value}</span>
              )
            ) : (
              <span className={`font-mono text-[11px] uppercase tracking-[0.2em] ${dark ? "text-foam/35" : "text-ink/40"}`}>A confirmar</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
