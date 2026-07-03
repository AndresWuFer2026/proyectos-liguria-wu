#!/usr/bin/env node
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  const args = process.argv.slice(2);
  const doDelete = args.includes("--delete");
  const doFix = args.includes("--fix");

  console.log(
    "Buscando registros sospechosos en 'equipos' (campos con valor 'undefined')..."
  );

  const query =
    "id.eq.undefined,codigo_activo.eq.undefined,nombre.eq.undefined,nodo_organizacion_id.eq.undefined,proveedor.eq.undefined,responsable.eq.undefined";

  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .or(query)
    .limit(1000);

  if (error) {
    console.error("Error consultando equipos:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No se encontraron registros sospechosos.");
    process.exit(0);
  }

  console.log(`Encontrados ${data.length} registros sospechosos:`);

  data.forEach((r) => console.log(JSON.stringify(r, null, 2)));

  if (doFix) {
    console.log(
      "Intentando limpiar campos 'undefined' (se reemplazarán por NULL)..."
    );

    for (const row of data) {
      const updates = {};

      [
        "codigo_activo",
        "nombre",
        "nodo_organizacion_id",
        "proveedor",
        "responsable",
      ].forEach((f) => {
        if (row[f] === "undefined") {
          updates[f] = null;
        }
      });

      if (Object.keys(updates).length === 0) continue;

      const { error: upErr } = await supabase
        .from("equipos")
        .update(updates)
        .eq("id", row.id);

      if (upErr) {
        console.error(`Error actualizando ID ${row.id}:`, upErr);
      } else {
        console.log(`✅ Actualizado ID ${row.id}`);
      }
    }
  }

  if (doDelete) {
    console.log("⚠️ Borrando registros listados...");

    const ids = data.map((r) => r.id).filter(Boolean);

    const { error: delErr } = await supabase
      .from("equipos")
      .delete()
      .in("id", ids);

    if (delErr) {
      console.error("Error borrando registros:", delErr);
      process.exit(1);
    }

    console.log(`✅ Registros borrados: ${ids.length}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});