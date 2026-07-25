import { getStore } from "@netlify/blobs";

// Esta función funciona como una pequeña "base de datos" en la nube.
// Guarda cada clave (cdm_lugares, cdm_datos_Viche, etc.) como un registro
// dentro de un "store" de Netlify Blobs llamado "cdm-datos".
//
// Rutas que atiende (todas bajo /api/datos):
//   GET    /api/datos             -> devuelve TODAS las claves guardadas (para sincronizar al abrir la app)
//   GET    /api/datos?key=X       -> devuelve solo la clave X
//   POST   /api/datos  {key,value}-> guarda/actualiza una clave
//   DELETE /api/datos?key=X       -> borra una clave

export default async (req) => {
  const store = getStore("cdm-datos");
  const url = new URL(req.url);

  const headersJSON = { "Content-Type": "application/json" };

  try {
    if (req.method === "GET") {
      const key = url.searchParams.get("key");

      if (key) {
        const valor = await store.get(key);
        return new Response(JSON.stringify({ key, value: valor }), { headers: headersJSON });
      }

      // Sin "key": devolvemos todo lo guardado, para que la app sincronice de una sola vez
      const { blobs } = await store.list();
      const resultado = {};
      for (const b of blobs) {
        resultado[b.key] = await store.get(b.key);
      }
      return new Response(JSON.stringify(resultado), { headers: headersJSON });
    }

    if (req.method === "POST") {
      const { key, value } = await req.json();
      if (!key) {
        return new Response(JSON.stringify({ error: "Falta 'key'" }), { status: 400, headers: headersJSON });
      }
      await store.set(key, value ?? "");
      return new Response(JSON.stringify({ ok: true }), { headers: headersJSON });
    }

    if (req.method === "DELETE") {
      const key = url.searchParams.get("key");
      if (!key) {
        return new Response(JSON.stringify({ error: "Falta 'key'" }), { status: 400, headers: headersJSON });
      }
      await store.delete(key);
      return new Response(JSON.stringify({ ok: true }), { headers: headersJSON });
    }

    return new Response(JSON.stringify({ error: "Método no soportado" }), { status: 405, headers: headersJSON });
  } catch (err) {
    console.error("Error en función datos:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: headersJSON });
  }
};

export const config = {
  path: "/api/datos",
};
