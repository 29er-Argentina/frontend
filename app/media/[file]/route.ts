import { MIME_BY_EXT, readUpload } from "@/lib/store";

/** Sirve las fotos y PDFs subidos desde el panel. */
export async function GET(_request: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  const data = await readUpload(file);
  if (!data) return new Response("No encontrado", { status: 404 });
  const ext = file.split(".").pop()!;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME_BY_EXT[ext],
      // el nombre lleva un sufijo aleatorio: si cambia el archivo, cambia la URL
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(ext === "pdf" ? { "Content-Disposition": `inline; filename="${file}"` } : {}),
    },
  });
}
