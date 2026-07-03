"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  actualizarPrioridadOrdenTrabajo,
  actualizarEstadoOrdenTrabajo,
  asignarTecnicoOrdenTrabajo,
  cerrarOrdenTrabajo,
  listarOrdenesTrabajo,
  reprogramarOrdenTrabajo,
  type OrdenTrabajo,
} from "@/services/mantenimiento.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

export function CentroSupervisor() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  const cargarOrdenes = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const data = await listarOrdenesTrabajo();
      setOrdenes(data);
    } catch (error) {
      console.error("Error cargando OT supervisor:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function cargarInicial() {
      try {
        const data = await listarOrdenesTrabajo();
        if (mounted) {
          setOrdenes(data);
        }
      } catch (error) {
        console.error("Error cargando OT supervisor:", error);
        if (mounted) {
          setStatusType("error");
          setStatusMessage(getServiceErrorMessage(error));
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
  }, [cargarOrdenes]);

  const pendientesAprobacion = useMemo(
    () => ordenes.filter((orden) => orden.estado === "PENDIENTE_APROBACION"),
    [ordenes]
  );
  const pendientesValidacion = useMemo(
    () => ordenes.filter((orden) => orden.estado === "PENDIENTE_VALIDACION"),
    [ordenes]
  );
  const aprobadas = useMemo(
    () => ordenes.filter((orden) => orden.estado === "APROBADA"),
    [ordenes]
  );
  const enEjecucion = useMemo(
    () => ordenes.filter((orden) => orden.estado === "EN_EJECUCION"),
    [ordenes]
  );

  async function ejecutarAccion(action: () => Promise<unknown>, message: string) {
    setStatusMessage(null);

    try {
      await action();
      setStatusType("success");
      setStatusMessage(message);
      await cargarOrdenes();
    } catch (error) {
      console.error("Error en acción supervisor:", error);
      setStatusType("error");
      setStatusMessage(getServiceErrorMessage(error));
    }
  }

  const pendientesSupervisor = [
    ...pendientesAprobacion,
    ...aprobadas,
    ...enEjecucion,
    ...pendientesValidacion,
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Centro del Supervisor
        </h1>
        <p className="text-sm text-slate-500">
          Aprobación, asignación, reprogramación y validación de OT.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card
          title="Pendientes de aprobación"
          value={loading ? "..." : String(pendientesAprobacion.length)}
        />
        <Card title="OT aprobadas" value={loading ? "..." : String(aprobadas.length)} />
        <Card
          title="En ejecución"
          value={loading ? "..." : String(enEjecucion.length)}
        />
        <Card
          title="Pendientes de validación"
          value={loading ? "..." : String(pendientesValidacion.length)}
        />
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

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            Órdenes en control del supervisor
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-6 py-3">OT</th>
              <th className="text-left px-6 py-3">Activo</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-left px-6 py-3">Gestión</th>
              <th className="text-right px-6 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Cargando órdenes...
                </td>
              </tr>
            ) : pendientesSupervisor.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No hay OT pendientes de gestión.
                </td>
              </tr>
            ) : (
              pendientesSupervisor.map((orden) => (
                <OtRow
                  key={orden.id}
                  orden={orden}
                  onAprobar={() =>
                    ejecutarAccion(
                      () => actualizarEstadoOrdenTrabajo(orden.id, "APROBADA"),
                      "OT aprobada."
                    )
                  }
                  onRechazar={() =>
                    ejecutarAccion(
                      () => actualizarEstadoOrdenTrabajo(orden.id, "RECHAZADA"),
                      "OT rechazada."
                    )
                  }
                  onAsignar={(tecnico) =>
                    ejecutarAccion(
                      () => asignarTecnicoOrdenTrabajo(orden.id, tecnico),
                      "Técnico asignado."
                    )
                  }
                  onPrioridad={(prioridad) =>
                    ejecutarAccion(
                      () => actualizarPrioridadOrdenTrabajo(orden.id, prioridad),
                      "Prioridad actualizada."
                    )
                  }
                  onReprogramar={(fecha) =>
                    ejecutarAccion(
                      () => reprogramarOrdenTrabajo(orden.id, fecha),
                      "OT reprogramada."
                    )
                  }
                  onValidar={() =>
                    ejecutarAccion(
                      () => cerrarOrdenTrabajo(orden.id),
                      "Cierre validado y ficha generada."
                    )
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold text-[#0F3D56] mt-2">{value}</p>
    </div>
  );
}

function OtRow({
  orden,
  onAprobar,
  onRechazar,
  onAsignar,
  onPrioridad,
  onReprogramar,
  onValidar,
}: {
  orden: OrdenTrabajo;
  onAprobar: () => void;
  onRechazar: () => void;
  onAsignar: (tecnico: string) => void;
  onPrioridad: (prioridad: string) => void;
  onReprogramar: (fecha: string) => void;
  onValidar: () => void;
}) {
  const [tecnico, setTecnico] = useState(orden.tecnicoAsignado || "");
  const [prioridad, setPrioridad] = useState(orden.prioridad || "MEDIA");
  const [fecha, setFecha] = useState(orden.fechaReprogramada || "");

  return (
    <tr className="hover:bg-slate-50 align-top">
      <td className="px-6 py-4 font-medium text-[#0F3D56]">{orden.codigo}</td>
      <td className="px-6 py-4 text-slate-700">
        {orden.activoCodigo && `${orden.activoCodigo} - `}
        {orden.activoNombre || "No registrado"}
        <p className="text-xs text-slate-500 mt-1">
          {orden.tipoMantenimiento || "Tipo no registrado"} /{" "}
          {orden.especialidad || "Especialidad no registrada"}
        </p>
      </td>
      <td className="px-6 py-4">
        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
          {orden.estado}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="grid grid-cols-1 gap-2 min-w-52">
          <input
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs"
            value={tecnico}
            onChange={(event) => setTecnico(event.target.value)}
            placeholder="Técnico asignado"
          />
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs"
            value={prioridad}
            onChange={(event) => setPrioridad(event.target.value)}
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
          <input
            type="date"
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
          />
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href="/ordenes-trabajo"
            className="text-[#0F3D56] font-medium hover:underline"
          >
            Revisar
          </Link>
          <Link
            href={`/fichas/${orden.id}`}
            className="text-slate-600 font-medium hover:underline"
          >
            Ficha
          </Link>
          {orden.estado === "PENDIENTE_APROBACION" && (
            <>
              <button
                onClick={onAprobar}
                className="text-teal-600 font-medium hover:underline"
              >
                Aprobar
              </button>
              <button
                onClick={onRechazar}
                className="text-red-600 font-medium hover:underline"
              >
                Rechazar
              </button>
            </>
          )}
          <button
            onClick={() => onAsignar(tecnico)}
            className="text-[#0F3D56] font-medium hover:underline"
          >
            Asignar
          </button>
          <button
            onClick={() => onPrioridad(prioridad)}
            className="text-[#0F3D56] font-medium hover:underline"
          >
            Prioridad
          </button>
          {fecha && (
            <button
              onClick={() => onReprogramar(fecha)}
              className="text-[#0F3D56] font-medium hover:underline"
            >
              Reprogramar
            </button>
          )}
          {orden.estado === "PENDIENTE_VALIDACION" && (
            <button
              onClick={onValidar}
              className="text-teal-600 font-medium hover:underline"
            >
              Validar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
