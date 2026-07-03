"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listarActivos, type Activo } from "@/services/activos.service";
import {
  generarOrdenTrabajoDesdePrograma,
  listarProgramasMantenimiento,
  programarMantenimientoPreventivo,
  type ProgramaMantenimiento,
  type ProgramaMantenimientoInput,
} from "@/services/mantenimiento.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

const initialForm: ProgramaMantenimientoInput = {
  activoId: "",
  tipoMantenimiento: "PREVENTIVO",
  especialidad: "MECANICA",
  frecuencia: "MENSUAL",
  fechaInicial: "",
  responsable: "",
  duracionEstimadaHoras: "",
  prioridad: "MEDIA",
  descripcion: "",
  estado: "PROGRAMADO",
};

const months = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function ProgramaMantenimientoPage() {
  const searchParams = useSearchParams();
  const [activos, setActivos] = useState<Activo[]>([]);
  const [programas, setProgramas] = useState<ProgramaMantenimiento[]>([]);
  const [form, setForm] = useState<ProgramaMantenimientoInput>({
    ...initialForm,
    activoId: searchParams.get("activoId") || "",
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [generandoOt, setGenerandoOt] = useState(false);
  const [anio, setAnio] = useState("2026");
  const [especialidadFiltro, setEspecialidadFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "warning" | "error">(
    "success"
  );

  useEffect(() => {
    let mounted = true;

    async function cargarInicial() {
      try {
        const [activosData, programasData] = await Promise.all([
          listarActivos(),
          listarProgramasMantenimiento(),
        ]);

        if (mounted) {
          setActivos(activosData);
          setProgramas(programasData);
        }
      } catch (error) {
        console.error("Error cargando programa PM:", error);
        if (mounted) {
          setStatusType("error");
          setStatusMessage(getServiceErrorMessage(error));
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
  }, []);

  useEffect(() => {
    const activoId = searchParams.get("activoId");

    if (activoId) {
      queueMicrotask(() => {
        setForm((prev) => ({ ...prev, activoId }));
      });
    }
  }, [searchParams]);

  const programasFiltrados = useMemo(
    () =>
      programas.filter((programa) => {
        const fecha = programa.fechaInicio ?? "";
        const matchAnio = !fecha || fecha.startsWith(anio);
        const matchEspecialidad =
          !especialidadFiltro || programa.especialidad === especialidadFiltro;
        const matchEstado = !estadoFiltro || programa.estado === estadoFiltro;

        return matchAnio && matchEspecialidad && matchEstado;
      }),
    [anio, especialidadFiltro, estadoFiltro, programas]
  );

  async function recargarProgramas() {
    const data = await listarProgramasMantenimiento();
    setProgramas(data);
  }

  function update(campo: keyof ProgramaMantenimientoInput, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function validarPrograma() {
    return Boolean(
      form.activoId &&
        form.tipoMantenimiento &&
        form.especialidad &&
        form.frecuencia &&
        form.fechaInicial
    );
  }

  async function guardarPrograma() {
    setStatusMessage(null);

    if (!validarPrograma()) {
      setStatusType("error");
      setStatusMessage(
        "Completa activo, tipo, especialidad, frecuencia y fecha inicial."
      );
      return;
    }

    try {
      setGuardando(true);
      const result = await programarMantenimientoPreventivo(form);
      setStatusType(result.persistido ? "success" : "warning");
      setStatusMessage(result.message);

      if (result.persistido) {
        setForm(initialForm);
        await recargarProgramas();
      }
    } catch (error) {
      console.error("Error programando mantenimiento:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  }

  async function generarOtDesdeFormulario() {
    setStatusMessage(null);

    if (!validarPrograma()) {
      setStatusType("error");
      setStatusMessage("Completa el programa antes de generar una OT.");
      return;
    }

    try {
      setGenerandoOt(true);
      await generarOrdenTrabajoDesdePrograma(form);
      setStatusType("success");
      setStatusMessage("OT generada desde el programa PM.");
    } catch (error) {
      console.error("Error generando OT:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setGenerandoOt(false);
    }
  }

  async function generarOt(programa: ProgramaMantenimiento) {
    setStatusMessage(null);

    try {
      setGenerandoOt(true);
      await generarOrdenTrabajoDesdePrograma(programa);
      setStatusType("success");
      setStatusMessage("OT generada correctamente desde el programa.");
    } catch (error) {
      console.error("Error generando OT desde programa:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    } finally {
      setGenerandoOt(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Programa de Mantenimiento
        </h1>
        <p className="text-sm text-slate-500">
          Programación operativa y generación automática de órdenes de trabajo.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Nuevo programa PM</h2>
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

          <Select
            label="Frecuencia"
            value={form.frecuencia}
            onChange={(value) => update("frecuencia", value)}
            options={[
              { value: "SEMANAL", label: "Semanal" },
              { value: "MENSUAL", label: "Mensual" },
              { value: "TRIMESTRAL", label: "Trimestral" },
              { value: "SEMESTRAL", label: "Semestral" },
              { value: "ANUAL", label: "Anual" },
            ]}
          />

          <Input
            label="Fecha inicio"
            type="date"
            value={form.fechaInicial}
            onChange={(value) => update("fechaInicial", value)}
          />
          <Input
            label="Responsable"
            value={form.responsable}
            onChange={(value) => update("responsable", value)}
          />
          <Input
            label="Duración (horas)"
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

          <Select
            label="Estado"
            value={form.estado}
            onChange={(value) => update("estado", value)}
            options={[
              { value: "PROGRAMADO", label: "Programado" },
              { value: "ACTIVO", label: "Activo" },
              { value: "PAUSADO", label: "Pausado" },
              { value: "CANCELADO", label: "Cancelado" },
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

        {statusMessage && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              statusType === "success"
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : statusType === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {statusMessage}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={generarOtDesdeFormulario}
            disabled={generandoOt || loading}
            className="border border-[#0F3D56] text-[#0F3D56] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300"
          >
            {generandoOt ? "Generando..." : "Generar OT"}
          </button>
          <button
            onClick={guardarPrograma}
            disabled={guardando || loading}
            className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {guardando ? "Guardando..." : "Guardar programa"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold text-slate-800">
              Programa anual tipo Gantt
            </h2>
            <span className="text-sm text-slate-500">
              {programasFiltrados.length} registros
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select
              label="Año"
              value={anio}
              onChange={setAnio}
              options={[
                { value: "2025", label: "2025" },
                { value: "2026", label: "2026" },
                { value: "2027", label: "2027" },
              ]}
            />
            <Select
              label="Planta"
              value=""
              onChange={() => undefined}
              options={[]}
            />
            <Select
              label="Área"
              value=""
              onChange={() => undefined}
              options={[]}
            />
            <Select
              label="Especialidad"
              value={especialidadFiltro}
              onChange={setEspecialidadFiltro}
              options={[
                { value: "MECANICA", label: "Mecánica" },
                { value: "ELECTRICA", label: "Eléctrica" },
                { value: "REFRIGERACION", label: "Refrigeración" },
                { value: "INSTRUMENTACION", label: "Instrumentación" },
              ]}
            />
            <Select
              label="Estado"
              value={estadoFiltro}
              onChange={setEstadoFiltro}
              options={[
                { value: "PROGRAMADO", label: "Programado" },
                { value: "EJECUTADO", label: "Ejecutado" },
                { value: "VENCIDO", label: "Vencido" },
                { value: "REPROGRAMADO", label: "Reprogramado" },
                { value: "CANCELADO", label: "Cancelado" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto border-b border-slate-100">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[260px_repeat(12,1fr)] bg-slate-50 text-xs font-semibold text-slate-600">
              <div className="px-6 py-3">Activo / actividad</div>
              {months.map((month) => (
                <div key={month} className="px-2 py-3 text-center">
                  {month}
                </div>
              ))}
            </div>

            {programasFiltrados.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">
                No se registraron programaciones para el año seleccionado.
              </div>
            ) : (
              programasFiltrados.map((programa) => (
                <GanttRow key={programa.id} programa={programa} />
              ))
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-6 py-3">Activo</th>
              <th className="text-left px-6 py-3">Tipo</th>
              <th className="text-left px-6 py-3">Frecuencia</th>
              <th className="text-left px-6 py-3">Prioridad</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-right px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Cargando programas...
                </td>
              </tr>
            ) : programasFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No hay programas registrados.
                </td>
              </tr>
            ) : (
              programasFiltrados.map((programa) => (
                <tr key={programa.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-700">
                    {programa.activoCodigo && `${programa.activoCodigo} - `}
                    {programa.activoNombre || "No registrado"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {programa.tipoMantenimiento || "No registrado"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {programa.frecuencia || "No registrado"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {programa.prioridad || "No registrado"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                      {programa.estado || "PROGRAMADO"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => generarOt(programa)}
                      disabled={generandoOt}
                      className="text-[#0F3D56] font-medium hover:underline disabled:text-slate-400"
                    >
                      Generar OT
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GanttRow({ programa }: { programa: ProgramaMantenimiento }) {
  const monthIndex = programa.fechaInicio
    ? Math.max(0, new Date(programa.fechaInicio).getUTCMonth())
    : 0;

  return (
    <div className="grid grid-cols-[260px_repeat(12,1fr)] border-t border-slate-100 text-xs">
      <div className="px-6 py-3">
        <p className="font-semibold text-slate-800">
          {programa.activoCodigo && `${programa.activoCodigo} - `}
          {programa.activoNombre || "Activo no registrado"}
        </p>
        <p className="text-slate-500">{programa.tipoMantenimiento}</p>
      </div>
      {months.map((month, index) => (
        <div key={month} className="px-1 py-3 border-l border-slate-100">
          {index === monthIndex && (
            <div className="h-6 rounded bg-teal-500 text-white flex items-center justify-center px-2">
              {programa.estado || "PROGRAMADO"}
            </div>
          )}
        </div>
      ))}
    </div>
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
