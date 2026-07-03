import { supabase } from "@/lib/supabase";
import {
  getServiceErrorMessage,
  isMissingColumnError,
  isMissingTableError,
} from "@/services/supabase-error";

export const estadosOrdenTrabajo = [
  "BORRADOR",
  "PENDIENTE_APROBACION",
  "APROBADA",
  "ASIGNADA",
  "EN_EJECUCION",
  "PENDIENTE_VALIDACION",
  "CERRADA",
  "RECHAZADA",
  "REPROGRAMADA",
  "CANCELADA",
] as const;

export type EstadoOrdenTrabajo = (typeof estadosOrdenTrabajo)[number];

export type OrdenTrabajo = {
  id: string;
  codigo: string;
  activoId: string | null;
  activoCodigo: string | null;
  activoNombre: string | null;
  tipoMantenimiento: string | null;
  especialidad: string | null;
  responsable: string | null;
  tecnicoAsignado: string | null;
  prioridad: string | null;
  descripcion: string | null;
  fechaProgramada: string | null;
  fechaReprogramada: string | null;
  duracionEstimadaHoras: number | null;
  horaInicio: string | null;
  horaFin: string | null;
  horasHombre: number | null;
  estadoFinal: string | null;
  observacionesEjecucion: string | null;
  estado: EstadoOrdenTrabajo | string;
};

export type OrdenTrabajoInput = {
  activoId: string;
  tipoMantenimiento: string;
  especialidad: string;
  responsable: string;
  fechaProgramada: string;
  duracionEstimadaHoras: string;
  descripcion: string;
  prioridad: string;
};

export type ProgramaMantenimientoInput = {
  activoId: string;
  tipoMantenimiento: string;
  especialidad: string;
  frecuencia: string;
  fechaInicial: string;
  responsable: string;
  duracionEstimadaHoras: string;
  prioridad: string;
  descripcion: string;
  estado: string;
};

export type ProgramaMantenimientoResult = {
  persistido: boolean;
  message: string;
  programa?: ProgramaMantenimiento | null;
};

export type ProgramaMantenimiento = {
  id: string;
  activoId: string | null;
  activoCodigo: string | null;
  activoNombre: string | null;
  tipoMantenimiento: string | null;
  especialidad: string | null;
  frecuencia: string | null;
  fechaInicio: string | null;
  responsable: string | null;
  duracionEstimadaHoras: number | null;
  prioridad: string | null;
  descripcion: string | null;
  estado: string | null;
};

export type EjecucionOrdenTrabajoInput = {
  ordenId: string;
  horaInicio: string;
  horaFin: string;
  horasHombre: string;
  checklist: string;
  hallazgos: string;
  observaciones: string;
  fotografias: string;
  repuestos: string;
  herramientas: string;
  materiales: string;
  fotoAntes: string;
  fotoDespues: string;
  estadoFinal: string;
  firmaDigital: string;
};

export type FichaMantenimientoData = {
  orden: OrdenTrabajo;
  ficha: DbRow | null;
  checklist: DbRow[];
  evidencias: DbRow[];
  hallazgos: DbRow[];
  repuestos: DbRow[];
  manoObra: DbRow[];
  herramientas: DbRow[];
  materiales: DbRow[];
};

type DbRow = Record<string, unknown>;
type InsertValue = string | number | null;
type InsertPayload = Record<string, InsertValue>;

function stringField(row: DbRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function numberField(row: DbRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function parseHoras(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIsoDate(date: string, days: number) {
  const base = date ? new Date(date) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function normalizeEstado(value: string | null) {
  return value || "BORRADOR";
}

function normalizeFichaTipo(value: string | null | undefined) {
  const normalized = String(value ?? "").toUpperCase();

  if (normalized.includes("CORRECTIVO")) {
    return "CORRECTIVO";
  }

  if (normalized.includes("PREDICTIVO")) {
    return "PREDICTIVO";
  }

  return "PREVENTIVO";
}

function extractMissingColumn(error: unknown) {
  const message = getServiceErrorMessage(error);
  const match = message.match(/'([^']+)'\s+column/i);
  return match?.[1] ?? null;
}

async function insertWithColumnFallback(
  table: string,
  payload: InsertPayload,
  requiredColumns: string[] = []
) {
  let currentPayload = { ...payload };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .insert(currentPayload)
      .select()
      .single();

    if (!error) {
      return data as DbRow;
    }

    const missingColumn = extractMissingColumn(error);

    if (
      missingColumn &&
      missingColumn in currentPayload &&
      !requiredColumns.includes(missingColumn)
    ) {
      const nextPayload = { ...currentPayload };
      delete nextPayload[missingColumn];
      currentPayload = nextPayload;
      continue;
    }

    throw error;
  }

  throw new Error("No se pudo adaptar el payload al esquema disponible.");
}

async function safeInsertWithColumnFallback(
  table: string,
  payload: InsertPayload,
  requiredColumns: string[] = []
) {
  try {
    return await insertWithColumnFallback(table, payload, requiredColumns);
  } catch {
    return null;
  }
}

async function updateWithColumnFallback(
  table: string,
  id: string,
  payload: InsertPayload,
  requiredColumns: string[] = []
) {
  let currentPayload = { ...payload };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (Object.keys(currentPayload).length === 0) {
      return null;
    }

    const { data, error } = await supabase
      .from(table)
      .update(currentPayload)
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      return data as DbRow;
    }

    const missingColumn = extractMissingColumn(error);

    if (
      missingColumn &&
      missingColumn in currentPayload &&
      !requiredColumns.includes(missingColumn)
    ) {
      const nextPayload = { ...currentPayload };
      delete nextPayload[missingColumn];
      currentPayload = nextPayload;
      continue;
    }

    throw error;
  }

  throw new Error("No se pudo adaptar la actualización al esquema disponible.");
}

async function obtenerActivosMap(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, { codigo: string | null; nombre: string | null }>();
  }

  const { data, error } = await supabase
    .from("equipos")
    .select("id,codigo_activo,nombre")
    .in("id", ids);

  if (error) {
    return new Map<string, { codigo: string | null; nombre: string | null }>();
  }

  return new Map(
    ((data ?? []) as DbRow[]).map((row) => [
      String(row.id),
      {
        codigo: stringField(row, ["codigo_activo"]),
        nombre: stringField(row, ["nombre"]),
      },
    ])
  );
}

function normalizeOrdenTrabajo(row: DbRow, activos: Map<string, {
  codigo: string | null;
  nombre: string | null;
}>): OrdenTrabajo {
  const activoId = stringField(row, ["equipo_id", "activo_id", "equipo"]);
  const activo = activoId ? activos.get(activoId) : null;

  return {
    id: String(row.id),
    codigo:
      stringField(row, ["codigo_ot", "codigo", "numero_ot"]) ||
      `OT-${String(row.id).slice(0, 8)}`,
    activoId,
    activoCodigo: activo?.codigo ?? null,
    activoNombre:
      activo?.nombre ?? stringField(row, ["activo", "equipo_nombre"]),
    tipoMantenimiento: stringField(row, [
      "tipo_mantenimiento",
      "tipo",
      "tipo_ot",
    ]),
    especialidad: stringField(row, ["especialidad"]),
    responsable: stringField(row, ["responsable", "asignado_a"]),
    tecnicoAsignado: stringField(row, [
      "tecnico_asignado",
      "tecnico",
      "asignado_a",
    ]),
    prioridad: stringField(row, ["prioridad"]),
    descripcion: stringField(row, ["descripcion", "observaciones"]),
    fechaProgramada: stringField(row, [
      "fecha_programada",
      "fecha_inicio",
      "fecha",
    ]),
    fechaReprogramada: stringField(row, [
      "fecha_reprogramada",
      "reprogramado_para",
    ]),
    duracionEstimadaHoras: numberField(row, [
      "duracion_estimada_horas",
      "duracion_estimada",
      "duracion",
    ]),
    horaInicio: stringField(row, ["hora_inicio"]),
    horaFin: stringField(row, ["hora_fin"]),
    horasHombre: numberField(row, ["horas_hombre"]),
    estadoFinal: stringField(row, ["estado_final", "condicion_final"]),
    observacionesEjecucion: stringField(row, [
      "observaciones_ejecucion",
      "observaciones",
    ]),
    estado: normalizeEstado(stringField(row, ["estado"])),
  };
}

function normalizeProgramaMantenimiento(row: DbRow, activos: Map<string, {
  codigo: string | null;
  nombre: string | null;
}>): ProgramaMantenimiento {
  const activoId = stringField(row, ["equipo_id", "activo_id", "equipo"]);
  const activo = activoId ? activos.get(activoId) : null;

  return {
    id: String(row.id),
    activoId,
    activoCodigo: activo?.codigo ?? null,
    activoNombre: activo?.nombre ?? stringField(row, ["activo", "equipo_nombre"]),
    tipoMantenimiento: stringField(row, ["tipo_mantenimiento", "tipo"]),
    especialidad: stringField(row, ["especialidad"]),
    frecuencia: stringField(row, ["frecuencia"]),
    fechaInicio: stringField(row, ["fecha_inicial", "fecha_inicio", "fecha"]),
    responsable: stringField(row, ["responsable"]),
    duracionEstimadaHoras: numberField(row, [
      "duracion_estimada_horas",
      "duracion_estimada",
      "duracion",
    ]),
    prioridad: stringField(row, ["prioridad"]),
    descripcion: stringField(row, ["descripcion"]),
    estado: stringField(row, ["estado"]),
  };
}

export async function listarOrdenesTrabajo() {
  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .select("*")
    .limit(200);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as DbRow[];
  const activoIds = Array.from(
    new Set(
      rows
        .map((row) => stringField(row, ["equipo_id", "activo_id", "equipo"]))
        .filter((id): id is string => Boolean(id))
    )
  );
  const activos = await obtenerActivosMap(activoIds);

  return rows
    .map((row) => normalizeOrdenTrabajo(row, activos))
    .sort((a, b) => b.codigo.localeCompare(a.codigo));
}

export async function obtenerOrdenTrabajoPorId(id: string) {
  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as DbRow;
  const activoId = stringField(row, ["equipo_id", "activo_id", "equipo"]);
  const activos = await obtenerActivosMap(activoId ? [activoId] : []);

  return normalizeOrdenTrabajo(row, activos);
}

export async function listarProgramasMantenimiento() {
  const tableCandidates = ["programas_mantenimiento", "programa_mantenimiento"];
  let rows: DbRow[] = [];

  for (const table of tableCandidates) {
    const { data, error } = await supabase.from(table).select("*").limit(200);

    if (!error) {
      rows = (data ?? []) as DbRow[];
      break;
    }

    if (!isMissingTableError(error, table)) {
      throw error;
    }
  }

  const activoIds = Array.from(
    new Set(
      rows
        .map((row) => stringField(row, ["equipo_id", "activo_id", "equipo"]))
        .filter((id): id is string => Boolean(id))
    )
  );
  const activos = await obtenerActivosMap(activoIds);

  return rows
    .map((row) => normalizeProgramaMantenimiento(row, activos))
    .sort((a, b) => (b.fechaInicio ?? "").localeCompare(a.fechaInicio ?? ""));
}

export async function generarCodigoOrdenTrabajo() {
  const year = new Date().getFullYear();
  const prefijo = `OT-${year}`;

  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .select("codigo_ot")
    .like("codigo_ot", `${prefijo}-%`);

  if (error && !isMissingColumnError(error, "codigo_ot")) {
    throw error;
  }

  if (error) {
    return `${prefijo}-${String(Date.now()).slice(-4)}`;
  }

  const mayorCorrelativo = ((data ?? []) as { codigo_ot: string }[]).reduce(
    (mayor, item) => {
      const match = item.codigo_ot?.match(/-(\d+)$/);
      const correlativo = match ? Number(match[1]) : 0;
      return Number.isFinite(correlativo)
        ? Math.max(mayor, correlativo)
        : mayor;
    },
    0
  );

  return `${prefijo}-${String(mayorCorrelativo + 1).padStart(4, "0")}`;
}

export async function crearOrdenTrabajo(input: OrdenTrabajoInput) {
  const codigoOt = await generarCodigoOrdenTrabajo();
  const basePayload: InsertPayload = {
    codigo_ot: codigoOt,
    tipo_mantenimiento: input.tipoMantenimiento,
    especialidad: input.especialidad,
    responsable: input.responsable,
    fecha_programada: input.fechaProgramada || null,
    duracion_estimada_horas: parseHoras(input.duracionEstimadaHoras),
    descripcion: input.descripcion,
    prioridad: input.prioridad || "MEDIA",
    estado: "PENDIENTE_APROBACION",
  };

  const payloads: Array<{
    data: InsertPayload;
    requiredColumns: string[];
  }> = [
    {
      data: { ...basePayload, equipo_id: input.activoId },
      requiredColumns: ["equipo_id"],
    },
    {
      data: { ...basePayload, activo_id: input.activoId },
      requiredColumns: ["activo_id"],
    },
  ];

  let lastError: unknown = null;

  for (const payload of payloads) {
    try {
      return await insertWithColumnFallback(
        "ordenes_trabajo",
        payload.data,
        payload.requiredColumns
      );
    } catch (error) {
      lastError = error;
      if (
        !isMissingColumnError(error, "equipo_id") &&
        !isMissingColumnError(error, "activo_id")
      ) {
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(getServiceErrorMessage(lastError));
}

export async function actualizarEstadoOrdenTrabajo(
  id: string,
  estado: EstadoOrdenTrabajo
) {
  return updateWithColumnFallback("ordenes_trabajo", id, { estado });
}

export async function asignarTecnicoOrdenTrabajo(id: string, tecnico: string) {
  return updateWithColumnFallback("ordenes_trabajo", id, {
    tecnico_asignado: tecnico,
    tecnico,
    asignado_a: tecnico,
    estado: "ASIGNADA",
  });
}

export async function actualizarPrioridadOrdenTrabajo(
  id: string,
  prioridad: string
) {
  return updateWithColumnFallback("ordenes_trabajo", id, { prioridad });
}

export async function reprogramarOrdenTrabajo(id: string, fecha: string) {
  return updateWithColumnFallback("ordenes_trabajo", id, {
    fecha_reprogramada: fecha,
    fecha_programada: fecha,
    estado: "REPROGRAMADA",
  });
}

export async function iniciarEjecucionOrdenTrabajo(id: string) {
  return actualizarEstadoOrdenTrabajo(id, "EN_EJECUCION");
}

export async function generarOrdenTrabajoDesdePrograma(
  input: ProgramaMantenimiento | ProgramaMantenimientoInput
) {
  const activoId = "activoId" in input ? input.activoId ?? "" : "";
  const fechaProgramada =
    "fechaInicial" in input ? input.fechaInicial : input.fechaInicio ?? "";
  const duracion =
    "duracionEstimadaHoras" in input
      ? String(input.duracionEstimadaHoras ?? "")
      : "";

  return crearOrdenTrabajo({
    activoId,
    tipoMantenimiento: input.tipoMantenimiento ?? "PREVENTIVO",
    especialidad: input.especialidad ?? "",
    responsable: input.responsable ?? "",
    fechaProgramada,
    duracionEstimadaHoras: duracion,
    descripcion: input.descripcion ?? "",
    prioridad: input.prioridad ?? "MEDIA",
  });
}

export async function programarMantenimientoPreventivo(
  input: ProgramaMantenimientoInput
): Promise<ProgramaMantenimientoResult> {
  const payload: InsertPayload = {
    equipo_id: input.activoId,
    tipo_mantenimiento: input.tipoMantenimiento,
    especialidad: input.especialidad,
    frecuencia: input.frecuencia,
    fecha_inicial: input.fechaInicial || null,
    responsable: input.responsable,
    duracion_estimada_horas: parseHoras(input.duracionEstimadaHoras),
    prioridad: input.prioridad,
    descripcion: input.descripcion,
    estado: input.estado || "PROGRAMADO",
  };

  const tableCandidates = ["programas_mantenimiento", "programa_mantenimiento"];
  let lastError: unknown = null;

  for (const table of tableCandidates) {
    try {
      const programa = await insertWithColumnFallback(table, payload, [
        "equipo_id",
      ]);
      const activos = await obtenerActivosMap([input.activoId]);
      return {
        persistido: true,
        message: "Programa de mantenimiento guardado correctamente.",
        programa: normalizeProgramaMantenimiento(programa, activos),
      };
    } catch (error) {
      lastError = error;
      if (!isMissingTableError(error, table)) {
        break;
      }
    }
  }

  return {
    persistido: false,
    message: `Service preparado. Falta crear una tabla de programa PM o ajustar RLS: ${getServiceErrorMessage(
      lastError
    )}`,
    programa: null,
  };
}

async function crearOActualizarFichaAutomatica(
  ordenId: string,
  orden: OrdenTrabajo | null,
  ejecucion?: EjecucionOrdenTrabajoInput
) {
  const codigoFicha = `FM-${new Date().getFullYear()}-${String(Date.now()).slice(
    -6
  )}`;
  const fichaExistente = await fetchFicha(ordenId);
  const payload = {
    codigo_ficha: codigoFicha,
    tipo: normalizeFichaTipo(orden?.tipoMantenimiento),
    orden_trabajo_id: ordenId,
    equipo_id: orden?.activoId ?? null,
    activo_id: orden?.activoId ?? null,
    fecha: todayIsoDate(),
    especialidad: orden?.especialidad ?? null,
    responsable: orden?.tecnicoAsignado ?? orden?.responsable ?? null,
    descripcion: orden?.descripcion ?? null,
    hora_inicio: ejecucion?.horaInicio || orden?.horaInicio || null,
    hora_fin: ejecucion?.horaFin || orden?.horaFin || null,
    horas_hombre:
      parseHoras(ejecucion?.horasHombre ?? "") ?? orden?.horasHombre ?? null,
    estado_final: ejecucion?.estadoFinal || orden?.estadoFinal || null,
    observaciones:
      ejecucion?.observaciones || orden?.observacionesEjecucion || null,
    firma_digital: ejecucion?.firmaDigital ?? null,
    estado: "GENERADA",
  };

  if (fichaExistente?.id) {
    return updateWithColumnFallback(
      "fichas_mantenimiento",
      String(fichaExistente.id),
      payload
    );
  }

  return safeInsertWithColumnFallback("fichas_mantenimiento", payload);
}

export async function registrarEjecucionOrdenTrabajo(
  input: EjecucionOrdenTrabajoInput
) {
  const orden = await obtenerOrdenTrabajoPorId(input.ordenId);

  await updateWithColumnFallback("ordenes_trabajo", input.ordenId, {
    hora_inicio: input.horaInicio || null,
    hora_fin: input.horaFin || null,
    horas_hombre: parseHoras(input.horasHombre),
    observaciones: input.observaciones,
    observaciones_ejecucion: input.observaciones,
    estado_final: input.estadoFinal || null,
    estado: "PENDIENTE_VALIDACION",
  });

  if (input.checklist.trim()) {
    await safeInsertWithColumnFallback("checklist_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.checklist,
      resultado: "REGISTRADO",
    });
  }

  if (input.hallazgos.trim()) {
    await safeInsertWithColumnFallback("hallazgos_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.hallazgos,
    });
  }

  if (input.fotografias.trim()) {
    await safeInsertWithColumnFallback("evidencias_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.fotografias,
      tipo: "FOTOGRAFIA",
    });
  }

  if (input.fotoAntes.trim()) {
    await safeInsertWithColumnFallback("evidencias_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.fotoAntes,
      tipo: "FOTO_ANTES",
    });
  }

  if (input.fotoDespues.trim()) {
    await safeInsertWithColumnFallback("evidencias_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.fotoDespues,
      tipo: "FOTO_DESPUES",
    });
  }

  if (input.repuestos.trim()) {
    await safeInsertWithColumnFallback("repuestos_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.repuestos,
    });
  }

  if (input.horasHombre.trim()) {
    await safeInsertWithColumnFallback("mano_obra_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      horas: parseHoras(input.horasHombre),
      descripcion: orden?.tecnicoAsignado ?? orden?.responsable ?? "Técnico",
    });
  }

  if (input.herramientas.trim()) {
    await safeInsertWithColumnFallback("herramientas_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.herramientas,
    });
  }

  if (input.materiales.trim()) {
    await safeInsertWithColumnFallback("materiales_mantenimiento", {
      orden_trabajo_id: input.ordenId,
      descripcion: input.materiales,
    });
  }

  return obtenerFichaMantenimientoPorOrden(input.ordenId);
}

export async function cerrarOrdenTrabajo(id: string) {
  const orden = await obtenerOrdenTrabajoPorId(id);
  await actualizarEstadoOrdenTrabajo(id, "CERRADA");
  await crearOActualizarFichaAutomatica(id, orden);

  if (orden?.activoId) {
    await updateWithColumnFallback("equipos", orden.activoId, {
      ultimo_mantenimiento: todayIsoDate(),
      fecha_ultimo_mantenimiento: todayIsoDate(),
      proximo_mantenimiento: addDaysIsoDate(todayIsoDate(), 30),
      fecha_proximo_mantenimiento: addDaysIsoDate(todayIsoDate(), 30),
    });

    await safeInsertWithColumnFallback("historial_mantenimiento", {
      equipo_id: orden.activoId,
      activo_id: orden.activoId,
      orden_trabajo_id: id,
      fecha: todayIsoDate(),
      tipo_mantenimiento: orden.tipoMantenimiento,
      descripcion: orden.descripcion,
      estado: "CERRADA",
    });
  }

  return obtenerOrdenTrabajoPorId(id);
}

async function fetchSection(table: string, ordenId: string, fichaId?: string) {
  const byOrden = await supabase
    .from(table)
    .select("*")
    .eq("orden_trabajo_id", ordenId)
    .limit(100);

  if (!byOrden.error && byOrden.data && byOrden.data.length > 0) {
    return byOrden.data as DbRow[];
  }

  if (!fichaId) {
    return [];
  }

  const byFicha = await supabase
    .from(table)
    .select("*")
    .eq("ficha_mantenimiento_id", fichaId)
    .limit(100);

  if (byFicha.error) {
    return [];
  }

  return (byFicha.data ?? []) as DbRow[];
}

async function fetchFicha(ordenId: string) {
  const { data, error } = await supabase
    .from("fichas_mantenimiento")
    .select("*")
    .eq("orden_trabajo_id", ordenId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as DbRow | null) ?? null;
}

export async function obtenerFichaMantenimientoPorOrden(
  ordenId: string
): Promise<FichaMantenimientoData | null> {
  const orden = await obtenerOrdenTrabajoPorId(ordenId);

  if (!orden) {
    return null;
  }

  const ficha = await fetchFicha(ordenId);
  const fichaId = ficha?.id ? String(ficha.id) : undefined;
  const [
    checklist,
    evidencias,
    hallazgos,
    repuestos,
    manoObra,
    herramientas,
    materiales,
  ] = await Promise.all([
    fetchSection("checklist_mantenimiento", ordenId, fichaId),
    fetchSection("evidencias_mantenimiento", ordenId, fichaId),
    fetchSection("hallazgos_mantenimiento", ordenId, fichaId),
    fetchSection("repuestos_mantenimiento", ordenId, fichaId),
    fetchSection("mano_obra_mantenimiento", ordenId, fichaId),
    fetchSection("herramientas_mantenimiento", ordenId, fichaId),
    fetchSection("materiales_mantenimiento", ordenId, fichaId),
  ]);

  return {
    orden,
    ficha,
    checklist,
    evidencias,
    hallazgos,
    repuestos,
    manoObra,
    herramientas,
    materiales,
  };
}
