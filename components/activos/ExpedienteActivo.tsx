"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  actualizarParteActivo,
  crearParteActivo,
  eliminarDocumentoActivo,
  eliminarParteActivo,
  listarPartesActivo,
  obtenerActivoPorId,
  obtenerResumenExpedienteActivo,
  subirDocumentoActivo,
  type Activo,
  type DocumentoActivo,
  type DocumentoActivoTipo,
  type EstadoParteActivo,
  type ParteActivo,
  type ParteActivoInput,
  type ResumenExpedienteActivo,
} from "@/services/activos.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

const tabs = [
  "Información",
  "Partes / Componentes",
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

const initialParteForm: ParteActivoInput = {
  activoId: "",
  nombre: "",
  tipoParte: "",
  descripcion: "",
  criticidad: "Media",
  frecuenciaRevisionSugerida: "",
  estado: "Activo",
  observaciones: "",
};

function buildQrPayload(activo: Activo) {
  const expedientePath = `/activos/${activo.id}`;
  const baseUrl =
    typeof window === "undefined" ? "" : window.location.origin;

  return JSON.stringify({
    codigo: activo.codigo_activo,
    id: activo.id,
    expediente: `${baseUrl}${expedientePath}`,
  });
}

function buildQrImageUrl(payload: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}

export function ExpedienteActivo({ activoId }: { activoId: string }) {
  const [activo, setActivo] = useState<Activo | null>(null);
  const [resumen, setResumen] = useState<ResumenExpedienteActivo | null>(null);
  const [partes, setPartes] = useState<ParteActivo[]>([]);
  const [activeTab, setActiveTab] = useState("Información");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingPart, setSavingPart] = useState(false);
  const [uploadForm, setUploadForm] = useState(initialUpload);
  const [parteForm, setParteForm] = useState<ParteActivoInput>({
    ...initialParteForm,
    activoId,
  });
  const [editingParteId, setEditingParteId] = useState<string | null>(null);
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
        const [activoData, resumenData, partesData] = await Promise.all([
          obtenerActivoPorId(activoId),
          obtenerResumenExpedienteActivo(activoId),
          listarPartesActivo(activoId),
        ]);

        if (!mounted) {
          return;
        }

        if (!activoData) {
          setErrorMessage("Activo no encontrado.");
          setActivo(null);
          setResumen(null);
          setPartes([]);
          return;
        }

        setActivo(activoData);
        setResumen(resumenData);
        setPartes(partesData);
        setParteForm((prev) => ({ ...prev, activoId }));
      } catch (error) {
        console.error("Error cargando activo:", error);
        if (mounted) {
          setErrorMessage(getServiceErrorMessage(error));
          setActivo(null);
          setResumen(null);
          setPartes([]);
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

  async function recargarActivo() {
    const activoData = await obtenerActivoPorId(activoId);
    if (activoData) {
      setActivo(activoData);
    }
  }

  async function recargarPartes() {
    const partesData = await listarPartesActivo(activoId);
    setPartes(partesData);
  }

  function resetParteForm() {
    setParteForm({ ...initialParteForm, activoId });
    setEditingParteId(null);
  }

  function editarParte(parte: ParteActivo) {
    setParteForm({
      activoId,
      nombre: parte.nombre,
      tipoParte: parte.tipoParte ?? "",
      descripcion: parte.descripcion ?? "",
      criticidad: parte.criticidad ?? "",
      frecuenciaRevisionSugerida: parte.frecuenciaRevisionSugerida ?? "",
      estado: parte.estado === "Inactivo" ? "Inactivo" : "Activo",
      observaciones: parte.observaciones ?? "",
    });
    setEditingParteId(parte.id);
    setActiveTab("Partes / Componentes");
  }

  async function guardarParte() {
    setStatusMessage(null);

    if (!parteForm.nombre.trim()) {
      setStatusMessage("Ingresa el nombre de la parte o componente.");
      return;
    }

    try {
      setSavingPart(true);

      if (editingParteId) {
        await actualizarParteActivo(editingParteId, parteForm);
        setStatusMessage("Parte actualizada correctamente.");
      } else {
        await crearParteActivo({ ...parteForm, activoId });
        setStatusMessage("Parte agregada correctamente.");
      }

      resetParteForm();
      await recargarPartes();
    } catch (error) {
      console.error("Error guardando parte:", error);
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setSavingPart(false);
    }
  }

  async function desactivarParte(id: string) {
    setStatusMessage(null);

    try {
      setSavingPart(true);
      await eliminarParteActivo(id);
      setStatusMessage("Parte desactivada correctamente.");
      await recargarPartes();
    } catch (error) {
      console.error("Error desactivando parte:", error);
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setSavingPart(false);
    }
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
      await Promise.all([recargarResumen(), recargarActivo()]);
    } catch (error) {
      console.error("Error subiendo foto:", error);
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function desactivarDocumento(documento: DocumentoActivo) {
    setStatusMessage(null);

    try {
      setUploading(true);
      await eliminarDocumentoActivo(documento);
      setStatusMessage("Archivo desactivado correctamente.");
      await Promise.all([recargarResumen(), recargarActivo()]);
    } catch (error) {
      console.error("Error desactivando documento:", error);
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function descargarQr() {
    if (!activo) {
      return;
    }

    const qrPayload = buildQrPayload(activo);
    const qrImageUrl = buildQrImageUrl(qrPayload, 512);

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `QR-${activo.codigo_activo}.png`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(qrImageUrl, "_blank", "noopener,noreferrer");
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
  const fotoPrincipal =
    activo.foto_url || activo.imagen_url || resumen?.fotografias[0]?.archivoUrl;
  const qrPayload = buildQrPayload(activo);
  const qrImageUrl = buildQrImageUrl(qrPayload);

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

            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt={`QR ${activo.codigo_activo}`}
                className="mx-auto h-32 w-32 rounded bg-white p-1"
              />
              <button
                type="button"
                onClick={descargarQr}
                className="mt-3 text-xs font-medium text-[#0F3D56] hover:underline"
              >
                Descargar QR
              </button>
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
              partes={partes}
              parteForm={parteForm}
              editingParteId={editingParteId}
              savingPart={savingPart}
              uploading={uploading}
              uploadForm={uploadForm}
              onParteFormChange={setParteForm}
              onSaveParte={guardarParte}
              onEditParte={editarParte}
              onDeactivateParte={desactivarParte}
              onCancelParte={resetParteForm}
              onUploadChange={setUploadForm}
              onDocumentFile={setDocumentFile}
              onPhotoFile={setPhotoFile}
              onUploadDocument={subirDocumento}
              onUploadPhoto={subirFoto}
              onDeleteDocumento={desactivarDocumento}
              onDownloadQr={descargarQr}
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
  partes,
  parteForm,
  editingParteId,
  savingPart,
  uploading,
  uploadForm,
  onParteFormChange,
  onSaveParte,
  onEditParte,
  onDeactivateParte,
  onCancelParte,
  onUploadChange,
  onDocumentFile,
  onPhotoFile,
  onUploadDocument,
  onUploadPhoto,
  onDeleteDocumento,
  onDownloadQr,
}: {
  tab: string;
  activo: Activo;
  resumen: ResumenExpedienteActivo | null;
  partes: ParteActivo[];
  parteForm: ParteActivoInput;
  editingParteId: string | null;
  savingPart: boolean;
  uploading: boolean;
  uploadForm: typeof initialUpload;
  onParteFormChange: (value: ParteActivoInput) => void;
  onSaveParte: () => void;
  onEditParte: (parte: ParteActivo) => void;
  onDeactivateParte: (id: string) => void;
  onCancelParte: () => void;
  onUploadChange: (value: typeof initialUpload) => void;
  onDocumentFile: (file: File | null) => void;
  onPhotoFile: (file: File | null) => void;
  onUploadDocument: () => void;
  onUploadPhoto: () => void;
  onDeleteDocumento: (documento: DocumentoActivo) => void;
  onDownloadQr: () => void;
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

  if (tab === "Partes / Componentes") {
    return (
      <PartesActivoSection
        partes={partes}
        form={parteForm}
        editingId={editingParteId}
        saving={savingPart}
        onChange={onParteFormChange}
        onSave={onSaveParte}
        onEdit={onEditParte}
        onDeactivate={onDeactivateParte}
        onCancel={onCancelParte}
      />
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
        <DocumentosList
          documentos={resumen?.documentos ?? []}
          disabled={uploading}
          onDelete={onDeleteDocumento}
        />
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
        <FotosList
          fotos={resumen?.fotografias ?? []}
          disabled={uploading}
          onDelete={onDeleteDocumento}
        />
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
    const qrPayload = buildQrPayload(activo);
    const qrImageUrl = buildQrImageUrl(qrPayload, 260);

    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt={`QR ${activo.codigo_activo}`}
            className="h-40 w-40 rounded-lg border border-slate-200 bg-white p-2"
          />
          <div className="space-y-3">
            <Field label="CÃ³digo" value={activo.codigo_activo} />
            <Field label="ID del activo" value={activo.id} />
            <Field label="Ruta expediente" value={`/activos/${activo.id}`} />
            <button
              type="button"
              onClick={onDownloadQr}
              className="rounded-lg bg-[#0F3D56] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b2c40]"
            >
              Descargar QR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <p className="text-sm text-slate-500">No se ingresó información.</p>;
}

function PartesActivoSection({
  partes,
  form,
  editingId,
  saving,
  onChange,
  onSave,
  onEdit,
  onDeactivate,
  onCancel,
}: {
  partes: ParteActivo[];
  form: ParteActivoInput;
  editingId: string | null;
  saving: boolean;
  onChange: (value: ParteActivoInput) => void;
  onSave: () => void;
  onEdit: (parte: ParteActivo) => void;
  onDeactivate: (id: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-800">
            {editingId ? "Editar parte / componente" : "Agregar parte / componente"}
          </h3>
          <p className="text-sm text-slate-500">
            Registra componentes internos del activo sin crear un nuevo activo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ParteInput
            label="Nombre"
            value={form.nombre}
            onChange={(value) => onChange({ ...form, nombre: value })}
            placeholder="Motor eléctrico"
          />
          <ParteInput
            label="Tipo de parte"
            value={form.tipoParte}
            onChange={(value) => onChange({ ...form, tipoParte: value })}
            placeholder="Eléctrico, mecánico, estructural..."
          />
          <ParteInput
            label="Frecuencia sugerida"
            value={form.frecuenciaRevisionSugerida}
            onChange={(value) =>
              onChange({ ...form, frecuenciaRevisionSugerida: value })
            }
            placeholder="Mensual, trimestral..."
          />

          <ParteSelect
            label="Criticidad"
            value={form.criticidad}
            onChange={(value) =>
              onChange({
                ...form,
                criticidad: value as ParteActivoInput["criticidad"],
              })
            }
            options={[
              { value: "", label: "Sin definir" },
              { value: "Alta", label: "Alta" },
              { value: "Media", label: "Media" },
              { value: "Baja", label: "Baja" },
            ]}
          />
          <ParteSelect
            label="Estado"
            value={form.estado}
            onChange={(value) =>
              onChange({ ...form, estado: value as EstadoParteActivo })
            }
            options={[
              { value: "Activo", label: "Activo" },
              { value: "Inactivo", label: "Inactivo" },
            ]}
          />
          <ParteInput
            label="Observaciones"
            value={form.observaciones}
            onChange={(value) => onChange({ ...form, observaciones: value })}
            placeholder="Notas rápidas"
          />

          <div className="md:col-span-3">
            <ParteTextarea
              label="Descripción"
              value={form.descripcion}
              onChange={(value) => onChange({ ...form, descripcion: value })}
              placeholder="Descripción técnica o ubicación dentro del activo"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          {editingId && (
            <button
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-white disabled:text-slate-300"
            >
              Cancelar edición
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:bg-slate-300"
          >
            {saving ? "Guardando..." : editingId ? "Actualizar parte" : "Agregar parte"}
          </button>
        </div>
      </div>

      <PartesActivoList
        partes={partes}
        saving={saving}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
      />
    </div>
  );
}

function PartesActivoList({
  partes,
  saving,
  onEdit,
  onDeactivate,
}: {
  partes: ParteActivo[];
  saving: boolean;
  onEdit: (parte: ParteActivo) => void;
  onDeactivate: (id: string) => void;
}) {
  if (partes.length === 0) {
    return <p className="text-sm text-slate-500">No se ingresó información.</p>;
  }

  return (
    <div className="space-y-3">
      {partes.map((parte) => (
        <div
          key={parte.id}
          className="rounded-lg border border-slate-200 p-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-800">{parte.nombre}</p>
                <Badge value={parte.criticidad || "Sin criticidad"} />
                <Badge value={parte.estado || "Activo"} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {parte.tipoParte || "Tipo no registrado"} /{" "}
                {parte.frecuenciaRevisionSugerida || "Sin frecuencia sugerida"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {parte.descripcion || "No se ingresó información."}
              </p>
              {parte.observaciones && (
                <p className="mt-2 text-xs text-slate-500">
                  Observaciones: {parte.observaciones}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                onClick={() => onEdit(parte)}
                disabled={saving}
                className="text-sm font-medium text-[#0F3D56] hover:underline disabled:text-slate-300"
              >
                Editar
              </button>
              {parte.estado !== "Inactivo" && (
                <button
                  onClick={() => onDeactivate(parte.id)}
                  disabled={saving}
                  className="text-sm font-medium text-red-600 hover:underline disabled:text-slate-300"
                >
                  Desactivar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const isInactive = value === "Inactivo";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        isInactive
          ? "bg-slate-100 text-slate-500"
          : "bg-teal-50 text-teal-700"
      }`}
    >
      {value}
    </span>
  );
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
      <h3 className="font-semibold text-slate-800">
        Cambiar imagen del equipo
      </h3>
      <p className="text-sm text-slate-500">
        La imagen se guarda en el bucket activos y se muestra como foto principal.
      </p>
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
          {uploading ? "Subiendo..." : "Actualizar imagen"}
        </button>
      </div>
    </div>
  );
}

function DocumentosList({
  documentos,
  disabled,
  onDelete,
}: {
  documentos: DocumentoActivo[];
  disabled: boolean;
  onDelete: (documento: DocumentoActivo) => void;
}) {
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
          <div className="flex items-center gap-3">
            {documento.archivoUrl && (
              <a
                href={documento.archivoUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="text-sm font-medium text-[#0F3D56] hover:underline"
              >
                Descargar
              </a>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDelete(documento)}
              className="text-sm font-medium text-red-600 hover:underline disabled:text-slate-300"
            >
              Desactivar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FotosList({
  fotos,
  disabled,
  onDelete,
}: {
  fotos: DocumentoActivo[];
  disabled: boolean;
  onDelete: (documento: DocumentoActivo) => void;
}) {
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
            <div className="mt-3 flex items-center gap-3">
              {foto.archivoUrl && (
                <a
                  href={foto.archivoUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="text-sm font-medium text-[#0F3D56] hover:underline"
                >
                  Descargar
                </a>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDelete(foto)}
                className="text-sm font-medium text-red-600 hover:underline disabled:text-slate-300"
              >
                Desactivar
              </button>
            </div>
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

function ParteInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <input
        className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ParteTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <textarea
        className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ParteSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <select
        className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
