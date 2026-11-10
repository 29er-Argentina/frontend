import { getSession } from "@/lib/auth";
import { saveUpload } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await getSession())) return Response.json({ error: "Tu sesión venció. Volvé a entrar." }, { status: 401 });

  // evitar que otro sitio dispare subidas con la cookie del usuario
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ error: "Origen no permitido." }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "No se pudo leer el archivo." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No llegó ningún archivo." }, { status: 400 });

  const result = await saveUpload(file);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
