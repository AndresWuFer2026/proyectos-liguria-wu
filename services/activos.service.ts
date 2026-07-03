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
  createdAt: string | null;
};

export type DocumentoActivoInput = {
  activoId: string;
  tipo: DocumentoActivoTipo;
  nombre: string;
  observaciones: string;
  file: File;
};

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

function normalizeDocumento(row: Record<string, unknown>): DocumentoActivo {
  return {
    id: String(row.id),
    activoId: getString(row, ["equipo_id", "activo_id"]),
    tipo: getString(row, ["tipo_documento", "tipo"]),
    nombre: getString(row, ["nombre", "titulo"]),
    archivoUrl: getString(row, ["archivo_url", "url", "public_url"]),
    storagePath: getString(row, ["storage_path", "ruta_archivo", "path"]),
    bucket: getString(row, ["storage_bucket", "bucket"]),
    mimeType: getString(row, ["mime_type", "tipo_mime"]),
    observaciones: getString(row, ["observaciones", "descripcion"]),
    createdAt: getString(row, ["created_at", "fecha_carga"]),
  };
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
  const tableCandidates = ["documentos_activos", "documentos_equipo"];

  for (const table of tableCandidates) {
    for (const column of ["equipo_id", "activo_id"]) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, activoId)
        .limit(100);

      if (!error) {
        return ((data ?? []) as Record<string, unknown>[]).map(normalizeDocumento);
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
  const payload = {
    equipo_id: input.activoId,
    tipo_documento: input.tipo,
    nombre: cleanText(input.nombre) || input.file.name,
    archivo_url: publicUrl,
    storage_bucket: bucket,
    storage_path: storagePath,
    mime_type: input.file.type || null,
    observaciones: cleanText(input.observaciones),
  };

  const { data, error } = await supabase
    .from("documentos_activos")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeDocumento(data as Record<string, unknown>);
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
