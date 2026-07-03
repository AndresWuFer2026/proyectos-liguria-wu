"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  obtenerActivoPorId,
  obtenerResumenExpedienteActivo,
  subirDocumentoActivo,
  type Activo,
  type DocumentoActivo,
  type DocumentoActivoTipo,
  type ResumenExpedienteActivo,
} from "@/services/activos.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

const tabs = [
  "Información",
  "Documentación",
  "Programa PM",
  "OT",
  "Historial",
  "Fotografías",
  "Indicadores",
  "QR",
];

const initialUpload = {
  tipo: "FICHA_TECNICA" as DocumentoActivoTipo,
  nombre: "",
  observaciones: "",
};

export function ExpedienteActivo({ activoId }: { activoId: string }) {
  const [activo, setActivo] = useState<Activo | null>(null);
  const [resumen, setResumen] = useState<ResumenExpedienteActivo | null>(null);
  const [activeTab, setActiveTab] = useState("Información");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState(initialUpload);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function cargarInicial() {
      await Promise.resolve();

      if (!mounted) {
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      if (!activoId || activoId === "undefined") {
        setErrorMessage("ID de activo inválido.");
        setActivo(null);
        setResumen(null);
        setLoading(false);
        return;
      }

      try {
        const [activoData, resumenData] = await Promise.all([
          obtenerActivoPorId(activoId),
          obtenerResumenExpedienteActivo(activoId),
        ]);

        if (!mounted) {
          return;
        }

        if (!activoData) {
          setErrorMessage("Activo no encontrado.");
          setActivo(null);
          setResumen(null);
          return;
        }

        setActivo(activoData);
        setResumen(resumenData);
      } catch (error) {
        console.error("Error cargando activo:", error);
        if (mounted) {
          setErrorMessage(getServiceErrorMessage(error));
          setActivo(null);
          setResumen(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    cargarInicial();

    return () => {
      mounted = false;
    };
  }, [activoId]);

  async function recargarResumen() {
    const resumenData = await obtenerResumenExpedienteActivo(activoId);
    setResumen(resumenData);
  }

  async function subirDocumento() {
    setStatusMessage(null);

    if (!documentFile) {
      setStatusMessage("Selecciona un PDF o documento técnico.");
      return;
    }

    try {
      setUploading(true);
      await subirDocumentoActivo({
        activoId,
        tipo: uploadForm.tipo,
        nombre: uploadForm.nombre || documentFile.name,
        observaciones: uploadForm.observaciones,
        file: documentFile,
      });
      setUploadForm(initialUpload);
      setDocumentFile(null);
      setStatusMessage("Documento cargado correctamente.");
      await recargarResumen();
    } catch (error) {
      console.error("Error subiendo documento:", error);
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function subirFoto() {
    setStatusMessage(null);

    if (!photoFile) {
      setStatusMessage("Selecciona una foto del equipo.");
      return;
    }

    try {
      setUploading(true);
      await subirDocumentoActivo({
        activoId,
        tipo: "FOTO",
        nombre: photoFile.name,
        observaciones: "Fotografía del expediente del activo.",
        file: photoFile,
      });
      setPhotoFile(null);
      setStatusMessage("Foto cargada correctamente.");
      await recargarResumen();
    } catch (error) {
      console.error("Error subiendo foto:", error);
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Cargando expediente...</div>;
  }

  if (!activo) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage || "Activo no encontrado."}
        </div>
      </div>
    );
  }

  const ubicacion =
    activo.ubicacion_nombre && activo.ubicacion_codigo
      ? `${activo.ubicacion_codigo} - ${activo.ubicacion_nombre}`
      : activo.ubicacion_nombre || "No registrado";
  const fotoPrincipal = resumen?.fotografias[0]?.archivoUrl;

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{activo.codigo_activo}</p>
            <h1 className="text-2xl font-bold text-slate-800">
              {activo.nombre}
            </h1>
            <p className="text-sm text-slate-500">
              {displayValue(activo.familia)} / {displayValue(activo.tipo_equipo)}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/programa-anual?activoId=${activo.id}`}
              className="border border-[#0F3D56] text-[#0F3D56] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              + Programa PM
            </Link>
            <Link
              href={`/ordenes-trabajo?activoId=${activo.id}`}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Crear OT
            </Link>
          </div>
        </div>

        {statusMessage && (
          <div className="mx-6 mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          <div className="lg:col-span-1">
            <div className="h-52 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden text-slate-400">
              {fotoPrincipal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotoPrincipal}
                  alt={activo.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                "Foto del activo"
              )}
            </div>

            <div className="mt-4 h-32 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-sm px-4 text-center">
              QR: {activo.qr_token || "No registrado"}
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            <InfoCard title="Estado" value={displayValue(activo.estado_operativo)} />
            <InfoCard title="Criticidad" value={displayValue(activo.criticidad)} />
            <InfoCard
              title="Próximo PM"
              value={displayValue(activo.proximo_mantenimiento)}
            />
            <InfoCard
              title="Disponibilidad"
              value={resumen?.indicadores.disponibilidad || "0%"}
            />

            <div className="md:col-span-4 bg-slate-50 rounded-lg p-5">
              <h3 className="font-semibold text-slate-800 mb-4">
                Información del activo
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <Field label="Código" value={activo.codigo_activo} />
                <Field label="Nombre" value={activo.nombre} />
                <Field label="Ubicación" value={ubicacion} />
                <Field label="Familia" value={activo.familia} />
                <Field label="Tipo" value={activo.tipo_equipo} />
                <Field label="Marca" value={activo.marca} />
                <Field label="Modelo" value={activo.modelo} />
                <Field label="Serie" value={activo.serie} />
                <Field label="Fabricante" value={activo.fabricante} />
                <Field label="Proveedor" value={activo.proveedor} />
                <Field label="Responsable" value={activo.responsable} />
                <Field
                  label="Último mantenimiento"
                  value={activo.ultimo_mantenimiento}
                />
                <Field label="Estado" value={activo.estado_operativo} />
                <Field label="Criticidad" value={activo.criticidad} />
              </div>

              <div className="mt-4">
                <Field label="Descripción" value={activo.descripcion} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-t-lg whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#0F3D56] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            <TabContent
              tab={activeTab}
              activo={activo}
              resumen={resumen}
              uploading={uploading}
              uploadForm={uploadForm}
              onUploadChange={setUploadForm}
              onDocumentFile={setDocumentFile}
              onPhotoFile={setPhotoFile}
              onUploadDocument={subirDocumento}
              onUploadPhoto={subirFoto}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabContent({
  tab,
  activo,
  resumen,
  uploading,
  uploadForm,
  onUploadChange,
  onDocumentFile,
  onPhotoFile,
  onUploadDocument,
  onUploadPhoto,
}: {
  tab: string;
  activo: Activo;
  resumen: ResumenExpedienteActivo | null;
  uploading: boolean;
  uploadForm: typeof initialUpload;
  onUploadChange: (value: typeof initialUpload) => void;
  onDocumentFile: (file: File | null) => void;
  onPhotoFile: (file: File | null) => void;
  onUploadDocument: () => void;
  onUploadPhoto: () => void;
}) {
  if (tab === "Información") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <Field label="Código" value={activo.codigo_activo} />
        <Field label="Familia" value={activo.familia} />
        <Field label="Tipo" value={activo.tipo_equipo} />
      </div>
    );
  }

  if (tab === "Documentación") {
    return (
      <div className="space-y-6">
        <UploadDocumento
          uploading={uploading}
          form={uploadForm}
          onChange={onUploadChange}
          onFile={onDocumentFile}
          onUpload={onUploadDocument}
        />
        <DocumentosList documentos={resumen?.documentos ?? []} />
      </div>
    );
  }

  if (tab === "Programa PM") {
    return <ProgramasList programas={resumen?.programas ?? []} />;
  }

  if (tab === "OT") {
    return <OrdenesList ordenes={resumen?.ordenes ?? []} />;
  }

  if (tab === "Historial") {
    return (
      <OrdenesList ordenes={resumen?.historial ?? []} empty="Sin historial cerrado." />
    );
  }

  if (tab === "Fotografías") {
    return (
      <div className="space-y-6">
        <UploadFoto
          uploading={uploading}
          onFile={onPhotoFile}
          onUpload={onUploadPhoto}
        />
        <FotosList fotos={resumen?.fotografias ?? []} />
      </div>
    );
  }

  if (tab === "Indicadores") {
    const indicadores = resumen?.indicadores;
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard title="Disponibilidad" value={indicadores?.disponibilidad ?? "0%"} />
        <InfoCard title="MTBF" value={indicadores?.mtbf ?? "Sin datos"} />
        <InfoCard title="MTTR" value={indicadores?.mttr ?? "Sin datos"} />
        <InfoCard title="Cantidad PM" value={String(indicadores?.cantidadPm ?? 0)} />
        <InfoCard
          title="Correctivos"
          value={String(indicadores?.cantidadCorrectivos ?? 0)}
        />
        <InfoCard
          title="Horas hombre"
          value={String(indicadores?.horasHombre ?? 0)}
        />
        <InfoCard
          title="Costo mano de obra"
          value={`S/ ${indicadores?.costoManoObra ?? 0}`}
        />
        <InfoCard
          title="Costo repuestos"
          value={`S/ ${indicadores?.costoRepuestos ?? 0}`}
        />
        <InfoCard title="Costo total" value={`S/ ${indicadores?.costoTotal ?? 0}`} />
      </div>
    );
  }

  if (tab === "QR") {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
        <Field label="Token QR" value={activo.qr_token} />
        <p className="mt-3 text-xs text-slate-500">
          El técnico puede pegar este token o el código del activo en su centro de
          trabajo para abrir el expediente.
        </p>
      </div>
    );
  }

  return <p className="text-sm text-slate-500">No se ingresó información.</p>;
}

function UploadDocumento({
  uploading,
  form,
  onChange,
  onFile,
  onUpload,
}: {
  uploading: boolean;
  form: typeof initialUpload;
  onChange: (value: typeof initialUpload) => void;
  onFile: (file: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-800">Subir documento técnico</h3>
      <p className="text-sm text-slate-500">
        Fichas técnicas del fabricante, manuales, certificados o documentos PDF.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <select
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
          value={form.tipo}
          onChange={(event) =>
            onChange({ ...form, tipo: event.target.value as DocumentoActivoTipo })
          }
        >
          <option value="FICHA_TECNICA">Ficha técnica</option>
          <option value="MANUAL">Manual</option>
          <option value="CERTIFICADO">Certificado</option>
          <option value="OTRO">Otro</option>
        </select>
        <input
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
          value={form.nombre}
          onChange={(event) => onChange({ ...form, nombre: event.target.value })}
          placeholder="Nombre del documento"
        />
        <input
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
        <button
          onClick={onUpload}
          disabled={uploading}
          className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          {uploading ? "Subiendo..." : "Subir PDF"}
        </button>
      </div>
    </div>
  );
}

function UploadFoto({
  uploading,
  onFile,
  onUpload,
}: {
  uploading: boolean;
  onFile: (file: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-800">Subir foto del equipo</h3>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mt-4">
        <input
          className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
          type="file"
          accept="image/*"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
        <button
          onClick={onUpload}
          disabled={uploading}
          className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          {uploading ? "Subiendo..." : "Subir foto"}
        </button>
      </div>
    </div>
  );
}

function DocumentosList({ documentos }: { documentos: DocumentoActivo[] }) {
  if (documentos.length === 0) {
    return <p className="text-sm text-slate-500">No se ingresó información.</p>;
  }

  return (
    <div className="space-y-3">
      {documentos.map((documento) => (
        <div
          key={documento.id}
          className="rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-4"
        >
          <div>
            <p className="font-semibold text-slate-800">
              {documento.nombre || "Documento técnico"}
            </p>
            <p className="text-sm text-slate-500">
              {documento.tipo || "OTRO"} / {documento.observaciones || "Sin observaciones"}
            </p>
          </div>
          {documento.archivoUrl && (
            <a
              href={documento.archivoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[#0F3D56] hover:underline"
            >
              Ver archivo
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function FotosList({ fotos }: { fotos: DocumentoActivo[] }) {
  if (fotos.length === 0) {
    return <p className="text-sm text-slate-500">No se ingresó información.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {fotos.map((foto) => (
        <div key={foto.id} className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="h-48 bg-slate-100">
            {foto.archivoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto.archivoUrl}
                alt={foto.nombre || "Foto del activo"}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="p-4">
            <p className="font-semibold text-slate-800">
              {foto.nombre || "Foto del activo"}
            </p>
            <p className="text-sm text-slate-500">
              {foto.observaciones || "Sin observaciones"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramasList({
  programas,
}: {
  programas: ResumenExpedienteActivo["programas"];
}) {
  if (programas.length === 0) {
    return <p className="text-sm text-slate-500">No se ingresó información.</p>;
  }

  return (
    <div className="space-y-3">
      {programas.map((programa) => (
        <div key={programa.id} className="rounded-lg border border-slate-200 p-4">
          <p className="font-semibold text-slate-800">
            {programa.tipoMantenimiento || "Programa PM"}
          </p>
          <p className="text-sm text-slate-500">
            {programa.frecuencia || "Sin frecuencia"} /{" "}
            {programa.prioridad || "Sin prioridad"} / {programa.estado || "PROGRAMADO"}
          </p>
        </div>
      ))}
    </div>
  );
}

function OrdenesList({
  ordenes,
  empty = "No se ingresó información.",
}: {
  ordenes: ResumenExpedienteActivo["ordenes"];
  empty?: string;
}) {
  if (ordenes.length === 0) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {ordenes.map((orden) => (
        <div key={orden.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#0F3D56]">{orden.codigo}</p>
              <p className="text-sm text-slate-500">
                {orden.tipoMantenimiento || "Tipo no registrado"} / {orden.estado}
              </p>
            </div>
            <Link
              href={`/fichas/${orden.id}`}
              className="text-sm font-medium text-[#0F3D56] hover:underline"
            >
              Ver ficha
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-lg font-bold mt-1 text-[#0F3D56]">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{displayValue(value)}</p>
    </div>
  );
}

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : "No registrado";
}
