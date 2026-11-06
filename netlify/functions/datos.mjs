// Guarda y entrega los datos de los programas para todos los que abren la página.
// Lectura libre; para guardar se necesita la clave (variable CLAVE_EDICION en Netlify).
import { getStore } from "@netlify/blobs";

const PROGRAMAS = ["programa", "fallas", "dynamix"];
const json = (body, status = 200) =>
  new Response(body, { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req) => {
  const url = new URL(req.url);
  const clave = process.env.CLAVE_EDICION || "";
  const ok = clave && req.headers.get("x-clave") === clave;

  if (url.searchParams.has("check")) return json(ok ? "true" : "false", ok ? 200 : 401);

  const k = url.searchParams.get("k");
  if (!PROGRAMAS.includes(k)) return json('"programa no válido"', 400);
  const store = getStore({ name: "mantenimiento-envase", consistency: "strong" });

  if (req.method === "GET") return json((await store.get(k)) || "null");

  if (req.method === "PUT") {
    if (!clave) return json('"falta CLAVE_EDICION"', 403);
    if (!ok) return json('"clave incorrecta"', 401);
    const body = await req.text();
    try { JSON.parse(body); } catch { return json('"datos no válidos"', 400); }
    await store.set(k, body);
    return json("true");
  }
  return json('"método no permitido"', 405);
};

export const config = { path: "/api/datos" };
