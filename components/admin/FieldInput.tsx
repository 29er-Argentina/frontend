"use client";

import { useId, useRef, useState } from "react";
import Icon from "./Icon";
import { previewUrl, usePanel } from "./PanelProvider";
import type { Field } from "@/lib/admin-schema";
import { UPLOAD_URL_PREFIX } from "@/lib/panel-config";

type Props = { field: Field; value: unknown; onChange: (v: unknown) => void };

export default function FieldInput({ field, value, onChange }: Props) {
  const id = useId();
  const helpId = `${id}-help`;
  const common = {
    id,
    "aria-describedby": field.help ? helpId : undefined,
    className: "admin-input",
    placeholder: field.placeholder,
  };

  let input: React.ReactNode;
  switch (field.type) {
    case "textarea":
      input = <textarea {...common} rows={3} value={String(value ?? "")} maxLength={field.max} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "paragraphs":
      input = (
        <textarea
          {...common}
          rows={8}
          value={Array.isArray(value) ? value.join("\n\n") : String(value ?? "")}
          onChange={(e) => onChange(e.target.value.split(/\n[ \t]*\n/))}
        />
      );
      break;
    case "lines":
      input = (
        <textarea
          {...common}
          rows={Math.max(3, (Array.isArray(value) ? value.length : 0) + 1)}
          value={Array.isArray(value) ? value.join("\n") : String(value ?? "")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
        />
      );
      break;
    case "select":
      input = (
        <select {...common} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "number":
      input = (
        <input
          {...common}
          type="number"
          inputMode="decimal"
          step="any"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
      break;
    case "image":
    case "pdf":
      input = <UploadInput field={field} value={String(value ?? "")} onChange={onChange} id={id} />;
      break;
    default:
      input = (
        <input
          {...common}
          type={field.type === "text" ? "text" : field.type}
          value={String(value ?? "")}
          maxLength={field.max}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      );
  }

  const empty = value === "" || value === null || value === undefined || (Array.isArray(value) && value.every((v) => !String(v).trim()));

  return (
    <div className={field.wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-semibold text-foam/85">
        {field.label}
        {field.required && <span className="text-sol" aria-label="obligatorio">*</span>}
        {field.important && empty && (
          <span className="rounded-full bg-sol/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sol ring-1 ring-sol/25">Falta</span>
        )}
      </label>
      {input}
      {field.help && (
        <p id={helpId} className="mt-1.5 text-xs leading-relaxed text-foam/45">
          {field.help}
        </p>
      )}
    </div>
  );
}

function UploadInput({ field, value, onChange, id }: { field: Field; value: string; onChange: (v: unknown) => void; id: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isImage = field.type === "image";
  const { upload: uploadFile } = usePanel();

  async function upload(file: File) {
    setError("");
    setBusy(true);
    try {
      onChange(await uploadFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const accept = isImage ? "image/jpeg,image/png,image/webp" : "application/pdf";
  const fileName = value.startsWith(UPLOAD_URL_PREFIX) ? value.slice(UPLOAD_URL_PREFIX.length) : value;

  return (
    <div
      className="rounded-2xl p-3 ring-1 ring-white/10"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) upload(f);
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        {isImage ? (
          <div className="grid h-24 w-36 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink ring-1 ring-white/10">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl(value)} alt="Vista previa" className="h-full w-full object-cover" />
            ) : (
              <span className="px-3 text-center text-[11px] text-foam/40">Sin foto</span>
            )}
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className={`grid h-12 w-10 shrink-0 place-items-center rounded-lg font-mono text-[10px] font-bold ${value ? "bg-sol text-ink" : "bg-white/[0.06] text-foam/40"}`}>
              {value && /^https?:/.test(value) ? "LINK" : "PDF"}
            </span>
            <span className="min-w-0 truncate text-sm text-foam/70">{value ? fileName : "Sin documento"}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="admin-focus inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink transition hover:bg-celeste disabled:opacity-60"
          >
            <Icon name="upload" className="h-4 w-4" /> {busy ? "Subiendo…" : value ? "Cambiar" : isImage ? "Subir foto" : "Subir PDF"}
          </button>
          {value && (
            <>
              <a href={previewUrl(value)} target="_blank" rel="noreferrer" className="admin-focus inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-foam/70 ring-1 ring-white/15 hover:text-white">
                Ver <Icon name="external" className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => onChange("")}
                className="admin-focus inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-foam/60 ring-1 ring-white/15 hover:text-white"
              >
                Quitar
              </button>
            </>
          )}
        </div>
        <input ref={fileRef} id={id} type="file" accept={accept} className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {!isImage && (
        <input
          className="admin-input mt-3"
          type="url"
          placeholder="…o pegá un link: https://"
          value={value.startsWith(UPLOAD_URL_PREFIX) ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${field.label}: link`}
        />
      )}
      <p className="mt-2 text-xs text-foam/40">
        {isImage ? "JPG, PNG o WEBP de hasta 8 MB. También podés arrastrarla acá." : "PDF de hasta 25 MB. También podés arrastrarlo acá."}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#ffb48a]">
          {error}
        </p>
      )}
    </div>
  );
}
