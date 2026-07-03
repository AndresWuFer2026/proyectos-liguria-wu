"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listarActivos, type Activo } from "@/services/activos.service";
import {
  actualizarEstadoOrdenTrabajo,
  cerrarOrdenTrabajo,
  crearOrdenTrabajo,
  getEstadoOrdenTrabajoLabel,
  iniciarEjecucionOrdenTrabajo,
  isEstadoOrdenTrabajoFinal,
  listarOrdenesTrabajo,
  registrarEjecucionOrdenTrabajo,
  type EjecucionOrdenTrabajoInput,
  type EstadoOrdenTrabajo,
  type OrdenTrabajo,
  type OrdenTrabajoInput,
} from "@/services/mantenimiento.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

const initialForm: OrdenTrabajoInput = {
  activoId: "",
  tipoMantenimiento: "PREVENTIVO",
  especialidad: "MECANICA",
  responsable: "",
  fechaProgramada: "",
  duracionEstimadaHoras: "",
  descripcion: "",
  prioridad: "MEDIA",
};

const initialEjecucion: EjecucionOrdenTrabajoInput = {
  ordenId: "",
  horaInicio: "",
  horaFin: "",
  horasHombre: "",
  checklist: "",
  hallazgos: "",
  observaciones: "",
  fotografias: "",
  repuestos: "",
  herramientas: "",
  materiales: "",
  fotoAntes: "",
  fotoDespues: "",
  estadoFinal: "",
  firmaDigital: "",
};

export function OrdenesTrabajoPage() {
  const searchParams = useSearchParams();
  const [activos, setActivos] = useState<Activo[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [form, setForm] = useState<OrdenTrabajoInput>({
    ...initialForm,
    activoId: searchParams.get("activoId") || "",
  });
  const [ejecucion, setEjecucion] =
    useState<EjecucionOrdenTrabajoInput>(initialEjecucion);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  const cargarDatos = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const [activosData, ordenesData] = await Promise.all([
        listarActivos(),
        listarOrdenesTrabajo(),
      ]);
      setActivos(activosData);
      setOrdenes(ordenesData);
    } catch (error) {
      console.error("Error cargando OT:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
      setActivos([]);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function cargarInicial() {
      try {
        const [activosData, ordenesData] = await Promise.all([
          listarActivos(),
          listarOrdenesTrabajo(),
        ]);

        if (mounted) {
          setActivos(activosData);
          setOrdenes(ordenesData);
        }
      } catch (error) {
        console.error("Error cargando OT:", error);
        if (mounted) {
          setStatusType("error");
          setStatusMessage(getServiceErrorMessage(error));
          setActivos([]);
          setOrdenes([]);
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
  }, [cargarDatos]);

  useEffect(() => {
    const activoId = searchParams.get("activoId");

    if (activoId) {
      queueMicrotask(() => {
        setForm((prev) => ({ ...prev, activoId }));
      });
    }
  }, [searchParams]);

  const ordenesOperativas = useMemo(
    () => ordenes.filter((orden) => !isEstadoOrdenTrabajoFinal(orden.estado)),
    [ordenes]
  );

  const ordenSeleccionada = useMemo(
    () => ordenes.find((orden) => orden.id === ejecucion.ordenId) ?? null,
    [ejecucion.ordenId, ordenes]
  );

  function update(campo: keyof OrdenTrabajoInput, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function updateEjecucion(campo: keyof EjecucionOrdenTrabajoInput, valor: string) {
    setEjecucion((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardarOrdenTrabajo() {
    setStatusMessage(null);

    if (!form.activoId || !form.tipoMantenimiento || !form.especialidad) {
      setStatusType("error");
      setStatusMessage("Completa activo, tipo de mantenimiento y especialidad.");
      return;
    }

    try {
      setGuardando(true);
      await crearOrdenTrabajo(form);
      setStatusType("success");
      setStatusMessage("Orden de trabajo creada correctamente.");
      setForm((prev) => ({
        ...initialForm,
        activoId: prev.activoId,
      }));
      await cargarDatos();
    } catch (error) {
      console.error("Error creando OT:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(id: string, estado: EstadoOrdenTrabajo) {
    setStatusMessage(null);

    try {
      if (estado === "CERRADA") {
        await cerrarOrdenTrabajo(id);
      } else {
        await actualizarEstadoOrdenTrabajo(id, estado);
      }

      setStatusType("success");
      setStatusMessage(`OT actualizada a ${getEstadoOrdenTrabajoLabel(estado)}.`);
      await cargarDatos();
    } catch (error) {
      console.error("Error actualizando OT:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    }
  }

  async function iniciarEjecucion(id: string) {
    setStatusMessage(null);

    try {
      await iniciarEjecucionOrdenTrabajo(id);
      setStatusType("success");
      setStatusMessage("OT en ejecución.");
      await cargarDatos();
      setEjecucion((prev) => ({ ...prev, ordenId: id }));
    } catch (error) {
      console.error("Error iniciando ejecución:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    }
  }

  async function guardarEjecucion() {
    setStatusMessage(null);

    if (!ejecucion.ordenId || !ejecucion.horaInicio || !ejecucion.horaFin) {
      setStatusType("error");
      setStatusMessage("Completa OT, hora inicio y hora fin.");
      return;
    }

    try {
      setGuardando(true);
      await registrarEjecucionOrdenTrabajo(ejecucion);
      setStatusType("success");
      setStatusMessage("Ejecución registrada. La OT queda pendiente de validación.");
      setEjecucion(initialEjecucion);
      await cargarDatos();
    } catch (error) {
      console.error("Error registrando ejecución:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Órdenes de Trabajo
        </h1>
        <p className="text-sm text-slate-500">
          Generación, ejecución técnica y cierre operativo de OT.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Nueva OT</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Activo"
            value={form.activoId}
            onChange={(value) => update("activoId", value)}
            disabled={loading}
            options={activos.map((activo) => ({
              value: activo.id,
              label: `${activo.codigo_activo} - ${activo.nombre}`,
            }))}
          />

          <Select
            label="Tipo mantenimiento"
            value={form.tipoMantenimiento}
            onChange={(value) => update("tipoMantenimiento", value)}
            options={[
              { value: "PREVENTIVO", label: "Preventivo" },
              { value: "CORRECTIVO_PROGRAMADO", label: "Correctivo programado" },
              { value: "INSPECCION", label: "Inspección" },
              { value: "LUBRICACION", label: "Lubricación" },
              { value: "CALIBRACION", label: "Calibración" },
              { value: "OVERHAUL", label: "Overhaul" },
            ]}
          />

          <Select
            label="Especialidad"
            value={form.especialidad}
            onChange={(value) => update("especialidad", value)}
            options={[
              { value: "MECANICA", label: "Mecánica" },
              { value: "ELECTRICA", label: "Eléctrica" },
              { value: "REFRIGERACION", label: "Refrigeración" },
              { value: "INSTRUMENTACION", label: "Instrumentación" },
            ]}
          />

          <Input
            label="Fecha programada"
            type="date"
            value={form.fechaProgramada}
            onChange={(value) => update("fechaProgramada", value)}
          />
          <Input
            label="Responsable"
            value={form.responsable}
            onChange={(value) => update("responsable", value)}
          />
          <Input
            label="Duración estimada (horas)"
            type="number"
            value={form.duracionEstimadaHoras}
            onChange={(value) => update("duracionEstimadaHoras", value)}
          />

          <Select
            label="Prioridad"
            value={form.prioridad}
            onChange={(value) => update("prioridad", value)}
            options={[
              { value: "BAJA", label: "Baja" },
              { value: "MEDIA", label: "Media" },
              { value: "ALTA", label: "Alta" },
              { value: "CRITICA", label: "Crítica" },
            ]}
          />

          <div className="md:col-span-3">
            <label className="text-sm text-slate-600">Descripción</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
              rows={3}
              value={form.descripcion}
              onChange={(event) => update("descripcion", event.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={guardarOrdenTrabajo}
            disabled={guardando || loading}
            className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {guardando ? "Creando..." : "Crear OT"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            statusType === "success"
              ? "border-teal-200 bg-teal-50 text-teal-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">OT operativas</h2>
          <span className="text-sm text-slate-500">
            {ordenesOperativas.length} registros
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-6 py-3">OT</th>
              <th className="text-left px-6 py-3">Activo</th>
              <th className="text-left px-6 py-3">Tipo</th>
              <th className="text-left px-6 py-3">Prioridad</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-right px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Cargando órdenes...
                </td>
              </tr>
            ) : ordenesOperativas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No hay OT operativas.
                </td>
              </tr>
            ) : (
              ordenesOperativas.map((orden) => (
                <OrdenRow
                  key={orden.id}
                  orden={orden}
                  onCambiarEstado={cambiarEstado}
                  onIniciar={iniciarEjecucion}
                  onEjecutar={(id) =>
                    setEjecucion((prev) => ({ ...prev, ordenId: id }))
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {ejecucion.ordenId && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-800">Ejecución técnica</h2>
            <p className="text-sm text-slate-500">
              {ordenSeleccionada?.codigo || "OT seleccionada"} -{" "}
              {ordenSeleccionada?.activoNombre || "Activo no registrado"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Hora inicio"
              type="time"
              value={ejecucion.horaInicio}
              onChange={(value) => updateEjecucion("horaInicio", value)}
            />
            <Input
              label="Hora fin"
              type="time"
              value={ejecucion.horaFin}
              onChange={(value) => updateEjecucion("horaFin", value)}
            />
            <Input
              label="Horas hombre"
              type="number"
              value={ejecucion.horasHombre}
              onChange={(value) => updateEjecucion("horasHombre", value)}
            />

            <Textarea
              label="Checklist"
              value={ejecucion.checklist}
              onChange={(value) => updateEjecucion("checklist", value)}
            />
            <Textarea
              label="Hallazgos"
              value={ejecucion.hallazgos}
              onChange={(value) => updateEjecucion("hallazgos", value)}
            />
            <Textarea
              label="Observaciones"
              value={ejecucion.observaciones}
              onChange={(value) => updateEjecucion("observaciones", value)}
            />
            <Textarea
              label="Fotografías / evidencias"
              value={ejecucion.fotografias}
              onChange={(value) => updateEjecucion("fotografias", value)}
            />
            <Textarea
              label="Repuestos"
              value={ejecucion.repuestos}
              onChange={(value) => updateEjecucion("repuestos", value)}
            />
            <Textarea
              label="Herramientas"
              value={ejecucion.herramientas}
              onChange={(value) => updateEjecucion("herramientas", value)}
            />
            <Textarea
              label="Materiales"
              value={ejecucion.materiales}
              onChange={(value) => updateEjecucion("materiales", value)}
            />
            <Input
              label="Foto antes / URL"
              value={ejecucion.fotoAntes}
              onChange={(value) => updateEjecucion("fotoAntes", value)}
            />
            <Input
              label="Foto después / URL"
              value={ejecucion.fotoDespues}
              onChange={(value) => updateEjecucion("fotoDespues", value)}
            />
            <Input
              label="Estado final del equipo"
              value={ejecucion.estadoFinal}
              onChange={(value) => updateEjecucion("estadoFinal", value)}
            />
            <Input
              label="Firma digital"
              value={ejecucion.firmaDigital}
              onChange={(value) => updateEjecucion("firmaDigital", value)}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setEjecucion(initialEjecucion)}
              className="px-4 py-2 rounded-lg border text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={guardarEjecucion}
              disabled={guardando}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {guardando ? "Guardando..." : "Registrar ejecución"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdenRow({
  orden,
  onCambiarEstado,
  onIniciar,
  onEjecutar,
}: {
  orden: OrdenTrabajo;
  onCambiarEstado: (id: string, estado: EstadoOrdenTrabajo) => void;
  onIniciar: (id: string) => void;
  onEjecutar: (id: string) => void;
}) {
  const puedeIniciar = orden.estado === "PROGRAMADA";
  const puedeEjecutar = orden.estado === "EN_EJECUCION";

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-6 py-4 font-medium text-[#0F3D56]">{orden.codigo}</td>
      <td className="px-6 py-4 text-slate-700">
        {orden.activoCodigo && `${orden.activoCodigo} - `}
        {orden.activoNombre || "No registrado"}
      </td>
      <td className="px-6 py-4 text-slate-500">
        {orden.tipoMantenimiento || "No registrado"}
      </td>
      <td className="px-6 py-4 text-slate-500">
        {orden.prioridad || "MEDIA"}
      </td>
      <td className="px-6 py-4">
        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
          {getEstadoOrdenTrabajoLabel(orden.estado)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-3">
          <Link
            href={`/fichas/${orden.id}`}
            className="text-slate-600 font-medium hover:underline"
          >
            Ficha
          </Link>
          {orden.estado === "PENDIENTE" && (
            <button
              onClick={() => onCambiarEstado(orden.id, "PROGRAMADA")}
              className="text-teal-600 font-medium hover:underline"
            >
              Aprobar
            </button>
          )}
          {puedeIniciar && (
            <button
              onClick={() => onIniciar(orden.id)}
              className="text-[#0F3D56] font-medium hover:underline"
            >
              Iniciar
            </button>
          )}
          {puedeEjecutar && (
            <button
              onClick={() => onEjecutar(orden.id)}
              className="text-teal-600 font-medium hover:underline"
            >
              Ejecutar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <input
        type={type}
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <textarea
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <select
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Seleccione...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
