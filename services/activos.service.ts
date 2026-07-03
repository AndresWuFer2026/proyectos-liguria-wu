import { supabase } from "@/lib/supabase";
import {
  isMissingColumnError,
  isMissingTableError,
} from "@/services/supabase-error";
import {
  listarNodosOrganizacion,
  type NodoOrganizacion,
} from "@/services/organizacion.service";
import {
  listarOrdenesTrabajo,
  listarProgramasMantenimiento,
  type OrdenTrabajo,
  type ProgramaMantenimiento,
} from "@/services/mantenimiento.service";

export type FamiliaActivo = {
  id: string;
  nombre: string;
  codigo: string;
  estado?: boolean | null;
};

export type TipoEquipo = {
  id: string;
  familia_id: string;
  nombre: string;
  codigo: string;
  codigo_corto?: string | null;
  estado?: boolean | null;
};

export type Activo = {
  id: string;
  codigo_activo: string;
  nombre: string;
  descripcion: string | null;
  nodo_organizacion_id: string | null;
  familia: string | null;
  tipo_equipo: string | null;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  fabricante: string | null;
  proveedor: string | null;
  estado_operativo: string | null;
  criticidad: string | null;
  responsable: string | null;
  qr_token?: string | null;
  qr_data?: string | null;
  foto_url?: string | null;
  imagen_url?: string | null;
  ultimo_mantenimiento?: string | null;
  proximo_mantenimiento?: string | null;
  ubicacion_codigo?: string | null;
  ubicacion_nombre?: string | null;
};

export type DocumentoActivoTipo =
  | "FICHA_TECNICA"
  | "FOTO"
  | "MANUAL"
  | "CERTIFICADO"
  | "OTRO";

export type DocumentoActivo = {
  id: string;
  activoId: string | null;
  tipo: string | null;
  nombre: string | null;
  archivoUrl: string | null;
  storagePath: string | null;
  bucket: string | null;
  mimeType: string | null;
  observaciones: string | null;
  estado: string | null;
  uploadedBy: string | null;
  createdAt: string | null;
  sourceTable: string | null;
};

export type DocumentoActivoInput = {
  activoId: string;
  tipo: DocumentoActivoTipo;
  nombre: string;
  observaciones: string;
  file: File;
};

export type CriticidadParteActivo = "Alta" | "Media" | "Baja";
export type EstadoParteActivo = "Activo" | "Inactivo";

export type ParteActivo = {
  id: string;
  activoId: string;
  nombre: string;
  tipoParte: string | null;
  descripcion: string | null;
  criticidad: CriticidadParteActivo | null;
  frecuenciaRevisionSugerida: string | null;
  estado: EstadoParteActivo | string;
  observaciones: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ParteActivoInput = {
  activoId: string;
  nombre: string;
  tipoParte: string;
  descripcion: string;
  criticidad: CriticidadParteActivo | "";
  frecuenciaRevisionSugerida: string;
  estado: EstadoParteActivo;
  observaciones: string;
};

export type ParteActivoUpdateInput = Partial<
  Omit<ParteActivoInput, "activoId">
>;

export type IndicadoresActivo = {
  disponibilidad: string;
  mtbf: string;
  mttr: string;
  cantidadPm: number;
  cantidadCorrectivos: number;
  horasHombre: number;
  costoManoObra: number;
  costoRepuestos: number;
  costoTotal: number;
};

export type ResumenExpedienteActivo = {
  programas: ProgramaMantenimiento[];
  ordenes: OrdenTrabajo[];
  historial: OrdenTrabajo[];
  documentos: DocumentoActivo[];
  fotografias: DocumentoActivo[];
  indicadores: IndicadoresActivo;
};

export type ActivoInput = {
  codigo_activo: string;
  nombre: string;
  descripcion: string;
  nodo_organizacion_id: string;
  familia: string;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  serie: string;
  fabricante: string;
  proveedor: string;
  estado_operativo: string;
  criticidad: string;
  responsable: string;
};

export type CatalogosActivo = {
  nodos: NodoOrganizacion[];
  familias: FamiliaActivo[];
  tiposEquipo: TipoEquipo[];
};

function cleanCodeSegment(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

function cleanText(value: string) {
  return value.trim();
}

function createQrToken() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

function getString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function normalizeDocumento(
  row: Record<string, unknown>,
  sourceTable: string | null = null
): DocumentoActivo {
  return {
    id: String(row.id),
    activoId: getString(row, ["activo_id", "equipo_id"]),
    tipo: getString(row, ["tipo_archivo", "tipo_documento", "tipo"]),
    nombre: getString(row, ["nombre_archivo", "nombre", "titulo"]),
    archivoUrl: getString(row, ["url", "archivo_url", "public_url"]),
    storagePath: getString(row, ["storage_path", "ruta_archivo", "path"]),
    bucket: getString(row, ["storage_bucket", "bucket"]),
    mimeType: getString(row, ["mime_type", "tipo_mime"]),
    observaciones: getString(row, ["observaciones", "descripcion"]),
    estado: getString(row, ["estado"]),
    uploadedBy: getString(row, ["uploaded_by"]),
    createdAt: getString(row, ["created_at", "fecha_carga"]),
    sourceTable,
  };
}

function isDocumentoActivoVisible(documento: DocumentoActivo) {
  return documento.estado !== "Inactivo";
}

function normalizeParteActivo(row: Record<string, unknown>): ParteActivo {
  return {
    id: String(row.id),
    activoId: String(row.activo_id ?? ""),
    nombre: String(row.nombre ?? ""),
    tipoParte: getString(row, ["tipo_parte"]),
    descripcion: getString(row, ["descripcion"]),
    criticidad: getString(row, ["criticidad"]) as CriticidadParteActivo | null,
    frecuenciaRevisionSugerida: getString(row, [
      "frecuencia_revision_sugerida",
    ]),
    estado: getString(row, ["estado"]) || "Activo",
    observaciones: getString(row, ["observaciones"]),
    createdAt: getString(row, ["created_at"]),
    updatedAt: getString(row, ["updated_at"]),
  };
}

function nullableText(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = cleanText(value);
  return cleaned || null;
}

function buildParteActivoPayload(
  data: Partial<ParteActivoInput>
): Record<string, string | null> {
  const payload: Record<string, string | null> = {};

  if (typeof data.activoId === "string") {
    payload.activo_id = data.activoId;
  }

  if (typeof data.nombre === "string") {
    payload.nombre = cleanText(data.nombre);
  }

  if (typeof data.tipoParte === "string") {
    payload.tipo_parte = nullableText(data.tipoParte) ?? null;
  }

  if (typeof data.descripcion === "string") {
    payload.descripcion = nullableText(data.descripcion) ?? null;
  }

  if (typeof data.criticidad === "string") {
    payload.criticidad = data.criticidad || null;
  }

  if (typeof data.frecuenciaRevisionSugerida === "string") {
    payload.frecuencia_revision_sugerida =
      nullableText(data.frecuenciaRevisionSugerida) ?? null;
  }

  if (typeof data.estado === "string") {
    payload.estado = data.estado || "Activo";
  }

  if (typeof data.observaciones === "string") {
    payload.observaciones = nullableText(data.observaciones) ?? null;
  }

  return payload;
}

async function fetchCatalogoActivo<T>(
  table: "familias_activos" | "tipos_equipo",
  columns: string
) {
  const activeResult = await supabase
    .from(table)
    .select(columns)
    .eq("estado", true)
    .order("nombre");

  if (!activeResult.error) {
    return (activeResult.data ?? []) as T[];
  }

  if (!isMissingColumnError(activeResult.error, "estado")) {
    throw activeResult.error;
  }

  const fallbackResult = await supabase.from(table).select(columns).order("nombre");

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  return (fallbackResult.data ?? []) as T[];
}

async function obtenerUbicacionesPorId(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, NodoOrganizacion>();
  }

  const { data, error } = await supabase
    .from("organizacion_nodos")
    .select("id,empresa_id,nodo_padre_id,nombre,codigo,tipo")
    .in("id", ids);

  if (error) {
    return new Map<string, NodoOrganizacion>();
  }

  return new Map(
    ((data ?? []) as NodoOrganizacion[]).map((nodo) => [nodo.id, nodo])
  );
}

async function hidratarActivo(activo: Activo): Promise<Activo> {
  const ubicaciones = await obtenerUbicacionesPorId(
    activo.nodo_organizacion_id ? [activo.nodo_organizacion_id] : []
  );
  const ubicacion = activo.nodo_organizacion_id
    ? ubicaciones.get(activo.nodo_organizacion_id)
    : null;

  return {
    ...activo,
    ubicacion_codigo: ubicacion?.codigo ?? null,
    ubicacion_nombre: ubicacion?.nombre ?? null,
  };
}

export async function listarCatalogosActivo(): Promise<CatalogosActivo> {
  const [nodos, familias, tiposEquipo] = await Promise.all([
    listarNodosOrganizacion(),
    fetchCatalogoActivo<FamiliaActivo>(
      "familias_activos",
      "id,nombre,codigo,estado"
    ),
    fetchCatalogoActivo<TipoEquipo>(
      "tipos_equipo",
      "id,familia_id,nombre,codigo,codigo_corto,estado"
    ),
  ]);

  return { nodos, familias, tiposEquipo };
}

export async function crearActivo(data: ActivoInput) {
  const payload = {
    codigo_activo: cleanText(data.codigo_activo),
    nombre: cleanText(data.nombre),
    descripcion: cleanText(data.descripcion),
    nodo_organizacion_id: data.nodo_organizacion_id,
    familia: cleanText(data.familia),
    tipo_equipo: cleanText(data.tipo_equipo),
    marca: cleanText(data.marca),
    modelo: cleanText(data.modelo),
    serie: cleanText(data.serie),
    fabricante: cleanText(data.fabricante),
    proveedor: cleanText(data.proveedor),
    estado_operativo: data.estado_operativo || "OPERATIVO",
    criticidad: data.criticidad || "B",
    responsable: cleanText(data.responsable),
  };

  const { data: activo, error } = await supabase
    .from("equipos")
    .insert({ ...payload, qr_token: createQrToken() })
    .select()
    .single();

  if (!error) {
    return activo as Activo;
  }

  if (!isMissingColumnError(error, "qr_token")) {
    throw error;
  }

  const fallbackResult = await supabase
    .from("equipos")
    .insert(payload)
    .select()
    .single();

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  return fallbackResult.data as Activo;
}

export async function listarActivos() {
  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .order("codigo_activo");

  if (error) {
    throw error;
  }

  const activos = (data ?? []) as Activo[];
  const ubicacionIds = Array.from(
    new Set(
      activos
        .map((activo) => activo.nodo_organizacion_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const ubicaciones = await obtenerUbicacionesPorId(ubicacionIds);

  return activos.map((activo) => {
    const ubicacion = activo.nodo_organizacion_id
      ? ubicaciones.get(activo.nodo_organizacion_id)
      : null;

    return {
      ...activo,
      ubicacion_codigo: ubicacion?.codigo ?? null,
      ubicacion_nombre: ubicacion?.nombre ?? null,
    };
  });
}

export async function obtenerActivoPorId(id: string) {
  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return hidratarActivo(data as Activo);
}

export async function buscarActivoPorQrOCodigo(valor: string) {
  const termino = cleanText(valor);

  if (!termino) {
    return null;
  }

  const porQr = await supabase
    .from("equipos")
    .select("*")
    .eq("qr_token", termino)
    .maybeSingle();

  if (!porQr.error && porQr.data) {
    return hidratarActivo(porQr.data as Activo);
  }

  if (porQr.error && !isMissingColumnError(porQr.error, "qr_token")) {
    throw porQr.error;
  }

  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .eq("codigo_activo", termino)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hidratarActivo(data as Activo) : null;
}

export async function listarDocumentosActivo(activoId: string) {
  const tableCandidates = [
    "documentos_activo",
    "documentos_activos",
    "documentos_equipo",
  ];

  for (const table of tableCandidates) {
    for (const column of ["activo_id", "equipo_id"]) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, activoId)
        .limit(100);

      if (!error) {
        return ((data ?? []) as Record<string, unknown>[])
          .map((row) => normalizeDocumento(row, table))
          .filter(isDocumentoActivoVisible);
      }

      if (
        !isMissingTableError(error, table) &&
        !isMissingColumnError(error, column)
      ) {
        throw error;
      }
    }
  }

  return [];
}

async function actualizarFotoPrincipalActivo(activoId: string, publicUrl: string) {
  let payload: Record<string, string> = {
    foto_url: publicUrl,
    imagen_url: publicUrl,
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (Object.keys(payload).length === 0) {
      return;
    }

    const { error } = await supabase
      .from("equipos")
      .update(payload)
      .eq("id", activoId);

    if (!error) {
      return;
    }

    const missingColumn = Object.keys(payload).find((column) =>
      isMissingColumnError(error, column)
    );

    if (!missingColumn) {
      console.warn("No se pudo actualizar foto principal:", error);
      return;
    }

    const nextPayload = { ...payload };
    delete nextPayload[missingColumn];
    payload = nextPayload;
  }
}

async function insertarDocumentoActivoMetadata(input: {
  activoId: string;
  tipo: DocumentoActivoTipo;
  nombre: string;
  publicUrl: string;
  bucket: string;
  storagePath: string;
  mimeType: string | null;
  observaciones: string;
}) {
  const nuevoPayload = {
    activo_id: input.activoId,
    nombre_archivo: input.nombre,
    tipo_archivo: input.tipo,
    url: input.publicUrl,
    storage_path: input.storagePath,
    storage_bucket: input.bucket,
    mime_type: input.mimeType,
    observaciones: input.observaciones,
    estado: "Activo",
  };

  const nuevo = await supabase
    .from("documentos_activo")
    .insert(nuevoPayload)
    .select()
    .single();

  if (!nuevo.error) {
    return normalizeDocumento(
      nuevo.data as Record<string, unknown>,
      "documentos_activo"
    );
  }

  const nuevoSchemaNoDisponible =
    isMissingTableError(nuevo.error, "documentos_activo") ||
    [
      "activo_id",
      "nombre_archivo",
      "tipo_archivo",
      "url",
      "storage_path",
      "storage_bucket",
      "mime_type",
      "observaciones",
      "estado",
    ].some((column) => isMissingColumnError(nuevo.error, column));

  if (!nuevoSchemaNoDisponible) {
    throw nuevo.error;
  }

  let anteriorPayload: Record<string, string | null> = {
    equipo_id: input.activoId,
    activo_id: input.activoId,
    tipo_documento: input.tipo,
    nombre: input.nombre,
    archivo_url: input.publicUrl,
    storage_bucket: input.bucket,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    observaciones: input.observaciones,
  };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const anterior = await supabase
      .from("documentos_activos")
      .insert(anteriorPayload)
      .select()
      .single();

    if (!anterior.error) {
      return normalizeDocumento(
        anterior.data as Record<string, unknown>,
        "documentos_activos"
      );
    }

    const missingColumn = Object.keys(anteriorPayload).find((column) =>
      isMissingColumnError(anterior.error, column)
    );

    if (!missingColumn) {
      throw anterior.error;
    }

    const nextPayload = { ...anteriorPayload };
    delete nextPayload[missingColumn];
    anteriorPayload = nextPayload;
  }

  throw new Error("No se pudo registrar el documento del activo.");
}

export async function listarPartesActivo(activoId: string) {
  const { data, error } = await supabase
    .from("partes_activo")
    .select("*")
    .eq("activo_id", activoId)
    .order("estado", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "partes_activo")) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).map(normalizeParteActivo);
}

export async function crearParteActivo(data: ParteActivoInput) {
  const payload = buildParteActivoPayload(data);

  if (!payload.activo_id || !payload.nombre) {
    throw new Error("Completa activo y nombre de la parte.");
  }

  const { data: parte, error } = await supabase
    .from("partes_activo")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeParteActivo(parte as Record<string, unknown>);
}

export async function actualizarParteActivo(
  id: string,
  data: ParteActivoUpdateInput
) {
  const payload = buildParteActivoPayload(data);

  if (Object.keys(payload).length === 0) {
    return null;
  }

  const { data: parte, error } = await supabase
    .from("partes_activo")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeParteActivo(parte as Record<string, unknown>);
}

export async function eliminarParteActivo(id: string) {
  const { data: parte, error } = await supabase
    .from("partes_activo")
    .update({ estado: "Inactivo" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeParteActivo(parte as Record<string, unknown>);
}

export async function subirDocumentoActivo(input: DocumentoActivoInput) {
  const bucket = input.tipo === "FOTO" ? "activos-fotos" : "activos-documentos";
  const safeName = sanitizeFileName(input.file.name) || "archivo";
  const storagePath = `${input.activoId}/${Date.now()}-${safeName}`;
  const upload = await supabase.storage
    .from(bucket)
    .upload(storagePath, input.file, {
      contentType: input.file.type || undefined,
      upsert: false,
    });

  if (upload.error) {
    throw upload.error;
  }

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data
    .publicUrl;

  const documento = await insertarDocumentoActivoMetadata({
    activoId: input.activoId,
    tipo: input.tipo,
    nombre: cleanText(input.nombre) || input.file.name,
    publicUrl,
    bucket,
    storagePath,
    mimeType: input.file.type || null,
    observaciones: cleanText(input.observaciones),
  });

  if (input.tipo === "FOTO") {
    await actualizarFotoPrincipalActivo(input.activoId, publicUrl);
  }

  return documento;
}

export async function eliminarDocumentoActivo(documento: DocumentoActivo) {
  const table = documento.sourceTable || "documentos_activo";

  const softDelete = await supabase
    .from(table)
    .update({ estado: "Inactivo" })
    .eq("id", documento.id)
    .select()
    .single();

  if (!softDelete.error) {
    return normalizeDocumento(
      softDelete.data as Record<string, unknown>,
      table
    );
  }

  if (!isMissingColumnError(softDelete.error, "estado")) {
    throw softDelete.error;
  }

  const hardDelete = await supabase.from(table).delete().eq("id", documento.id);

  if (hardDelete.error) {
    throw hardDelete.error;
  }

  return null;
}

function calcularIndicadores(ordenes: OrdenTrabajo[]): IndicadoresActivo {
  const cerradas = ordenes.filter((orden) => orden.estado === "CERRADA");
  const cantidadPm = ordenes.filter((orden) =>
    String(orden.tipoMantenimiento ?? "").includes("PREVENTIVO")
  ).length;
  const cantidadCorrectivos = ordenes.filter((orden) =>
    String(orden.tipoMantenimiento ?? "").includes("CORRECTIVO")
  ).length;
  const horasHombre = ordenes.reduce(
    (total, orden) => total + (orden.duracionEstimadaHoras ?? 0),
    0
  );
  const disponibilidad = ordenes.length === 0
    ? "0%"
    : `${Math.max(0, 100 - cantidadCorrectivos * 2).toFixed(1)}%`;

  return {
    disponibilidad,
    mtbf: cerradas.length > 1 ? "Preparado" : "Sin datos",
    mttr: cerradas.length > 0 ? "Preparado" : "Sin datos",
    cantidadPm,
    cantidadCorrectivos,
    horasHombre,
    costoManoObra: 0,
    costoRepuestos: 0,
    costoTotal: 0,
  };
}

export async function obtenerResumenExpedienteActivo(
  activoId: string
): Promise<ResumenExpedienteActivo> {
  const [ordenes, programas, documentos] = await Promise.all([
    listarOrdenesTrabajo(),
    listarProgramasMantenimiento(),
    listarDocumentosActivo(activoId),
  ]);
  const ordenesActivo = ordenes.filter((orden) => orden.activoId === activoId);
  const programasActivo = programas.filter(
    (programa) => programa.activoId === activoId
  );
  const historial = ordenesActivo.filter((orden) => orden.estado === "CERRADA");

  return {
    programas: programasActivo,
    ordenes: ordenesActivo,
    historial,
    documentos: documentos.filter((documento) => documento.tipo !== "FOTO"),
    fotografias: documentos.filter((documento) => documento.tipo === "FOTO"),
    indicadores: calcularIndicadores(ordenesActivo),
  };
}

export async function generarCodigoActivo(
  nodoCodigo: string,
  tipoCodigoCorto: string
) {
  const prefijo = `LIG-${cleanCodeSegment(nodoCodigo)}-${cleanCodeSegment(
    tipoCodigoCorto
  )}`;

  const { data, error } = await supabase
    .from("equipos")
    .select("codigo_activo")
    .like("codigo_activo", `${prefijo}-%`);

  if (error) {
    throw error;
  }

  const mayorCorrelativo = ((data ?? []) as { codigo_activo: string }[]).reduce(
    (mayor, item) => {
      const match = item.codigo_activo?.match(/-(\d+)$/);
      const correlativo = match ? Number(match[1]) : 0;
      return Number.isFinite(correlativo)
        ? Math.max(mayor, correlativo)
        : mayor;
    },
    0
  );

  const correlativo = String(mayorCorrelativo + 1).padStart(3, "0");

  return `${prefijo}-${correlativo}`;
}
