"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NuevoActivoForm } from "./NuevoActivoForm";
import { listarActivos, type Activo } from "@/services/activos.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

export function ActivosPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [criticidad, setCriticidad] = useState("");

  useEffect(() => {
    cargarActivos();
  }, []);

  async function cargarActivos() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await listarActivos();
      setActivos(data);
    } catch (error) {
      console.error("Error cargando activos:", error);
      setErrorMessage(getServiceErrorMessage(error));
      setActivos([]);
    } finally {
      setLoading(false);
    }
  }

  const activosDisplay = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return activos
      .filter((activo) => Boolean(activo.id) && activo.id !== "undefined")
      .filter((activo) => {
        const matchBusqueda =
          !query ||
          activo.codigo_activo?.toLowerCase().includes(query) ||
          activo.nombre?.toLowerCase().includes(query) ||
          activo.ubicacion_nombre?.toLowerCase().includes(query);
        const matchEstado = !estado || activo.estado_operativo === estado;
        const matchCriticidad = !criticidad || activo.criticidad === criticidad;

        return matchBusqueda && matchEstado && matchCriticidad;
      });
  }, [activos, busqueda, estado, criticidad]);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Gestión de Activos
          </h1>
          <p className="text-sm text-slate-500">
            Registro, consulta y control de activos industriales.
          </p>
        </div>

        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Nuevo Activo
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
            placeholder="Buscar por código, nombre o ubicación..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />

          <select
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="OPERATIVO">Operativo</option>
            <option value="OBSERVADO">Observado</option>
            <option value="FUERA_SERVICIO">Fuera de servicio</option>
          </select>

          <select
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
            value={criticidad}
            onChange={(event) => setCriticidad(event.target.value)}
          >
            <option value="">Todas las criticidades</option>
            <option value="A">A - Crítico</option>
            <option value="B">B - Importante</option>
            <option value="C">C - Secundario</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-6 py-3">Código</th>
              <th className="text-left px-6 py-3">Activo</th>
              <th className="text-left px-6 py-3">Ubicación</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-left px-6 py-3">Criticidad</th>
              <th className="text-right px-6 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Cargando activos...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-red-600">
                  {errorMessage}
                </td>
              </tr>
            ) : activosDisplay.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No hay activos registrados.
                </td>
              </tr>
            ) : (
              activosDisplay.map((activo) => (
                <ActivoRow key={activo.id} activo={activo} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarFormulario && (
        <NuevoActivoForm
          onClose={() => setMostrarFormulario(false)}
          onSaved={cargarActivos}
        />
      )}
    </div>
  );
}

function ActivoRow({ activo }: { activo: Activo }) {
  const ubicacion =
    activo.ubicacion_nombre && activo.ubicacion_codigo
      ? `${activo.ubicacion_codigo} - ${activo.ubicacion_nombre}`
      : activo.ubicacion_nombre || "Sin ubicación";

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-6 py-4 font-medium text-[#0F3D56]">
        {activo.codigo_activo || "Sin código"}
      </td>
      <td className="px-6 py-4 text-slate-700">{activo.nombre}</td>
      <td className="px-6 py-4 text-slate-500">{ubicacion}</td>
      <td className="px-6 py-4">
        <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-medium">
          {activo.estado_operativo || "No registrado"}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
          {activo.criticidad || "No registrado"}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/activos/${activo.id}`}
          className="text-[#0F3D56] font-medium hover:underline"
        >
          Ver expediente
        </Link>
      </td>
    </tr>
  );
}
