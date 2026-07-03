"use client";

import { useEffect, useMemo, useState } from "react";
import {
  crearActivo,
  generarCodigoActivo,
  listarCatalogosActivo,
  subirImagenActivo,
  type ActivoInput,
  type FamiliaActivo,
  type TipoEquipo,
} from "@/services/activos.service";
import {
  type NodoOrganizacion,
} from "@/services/organizacion.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

const initialForm: ActivoInput = {
  codigo_activo: "",
  nombre: "",
  descripcion: "",
  nodo_organizacion_id: "",
  familia: "",
  tipo_equipo: "",
  marca: "",
  modelo: "",
  serie: "",
  fabricante: "",
  proveedor: "",
  estado_operativo: "OPERATIVO",
  criticidad: "B",
  responsable: "",
};

export function NuevoActivoForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}) {
  const [nodos, setNodos] = useState<NodoOrganizacion[]>([]);
  const [familias, setFamilias] = useState<FamiliaActivo[]>([]);
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [catalogosLoading, setCatalogosLoading] = useState(true);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [plantaId, setPlantaId] = useState("");
  const [familiaId, setFamiliaId] = useState("");
  const [tipoEquipoId, setTipoEquipoId] = useState("");
  const [form, setForm] = useState<ActivoInput>(initialForm);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;

    async function cargarCatalogos() {
      setCatalogosLoading(true);
      setErrorMessage(null);

      try {
        const data = await listarCatalogosActivo();
        if (mounted) {
          setNodos(data.nodos);
          setFamilias(data.familias);
          setTiposEquipo(data.tiposEquipo);
        }
      } catch (error) {
        console.error("Error cargando catálogos:", error);
        if (mounted) {
          setErrorMessage(getServiceErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setCatalogosLoading(false);
        }
      }
    }

    cargarCatalogos();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function actualizarCodigo() {
      if (!form.nodo_organizacion_id || !tipoEquipoId) {
        update("codigo_activo", "");
        return;
      }

      const nodo = nodos.find((item) => item.id === form.nodo_organizacion_id);
      const tipo = tiposEquipo.find((item) => item.id === tipoEquipoId);

      if (!nodo || !tipo) {
        return;
      }

      setGenerandoCodigo(true);

      try {
        const codigo = await generarCodigoActivo(
          nodo.codigo,
          tipo.codigo_corto || tipo.codigo
        );

        if (mounted) {
          update("codigo_activo", codigo);
        }
      } catch (error) {
        console.error("Error generando código:", error);
        if (mounted) {
          setErrorMessage(getServiceErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setGenerandoCodigo(false);
        }
      }
    }

    actualizarCodigo();

    return () => {
      mounted = false;
    };
  }, [form.nodo_organizacion_id, nodos, tipoEquipoId, tiposEquipo]);

  const plantas = useMemo(
    () => nodos.filter((nodo) => nodo.tipo === "PLANTA"),
    [nodos]
  );

  const ubicacionesFiltradas = useMemo(
    () =>
      nodos.filter((nodo) => {
        if (!plantaId || nodo.id === plantaId) {
          return false;
        }

        let actual: NodoOrganizacion | undefined = nodo;

        while (actual) {
          if (actual.nodo_padre_id === plantaId) {
            return true;
          }

          actual = nodos.find((item) => item.id === actual?.nodo_padre_id);
        }

        return false;
      }),
    [nodos, plantaId]
  );

  const tiposFiltrados = useMemo(
    () => tiposEquipo.filter((tipo) => tipo.familia_id === familiaId),
    [familiaId, tiposEquipo]
  );

  function update(campo: keyof ActivoInput, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function seleccionarFamilia(id: string) {
    setFamiliaId(id);
    setTipoEquipoId("");

    const familia = familias.find((item) => item.id === id);

    setForm((prev) => ({
      ...prev,
      familia: familia?.nombre || "",
      tipo_equipo: "",
      codigo_activo: "",
    }));
  }

  function seleccionarTipoEquipo(id: string) {
    setTipoEquipoId(id);

    const tipo = tiposEquipo.find((item) => item.id === id);

    setForm((prev) => ({
      ...prev,
      tipo_equipo: tipo?.nombre || "",
      codigo_activo: "",
    }));
  }

  async function guardarActivo() {
    setErrorMessage(null);

    if (
      !form.nombre.trim() ||
      !form.nodo_organizacion_id ||
      !form.familia ||
      !form.tipo_equipo
    ) {
      setErrorMessage("Completa nombre, ubicación, familia y tipo de equipo.");
      return;
    }

    if (!form.codigo_activo) {
      setErrorMessage("Espera a que se genere el código del activo.");
      return;
    }

    try {
      setGuardando(true);
      const activo = await crearActivo(form);

      if (imagenFile) {
        await subirImagenActivo(activo.id, imagenFile);
      }

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error("Error guardando activo:", error);
      setErrorMessage(getServiceErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nuevo Activo</h2>
            <p className="text-sm text-slate-500">
              Registro maestro del activo industrial.
            </p>
          </div>

          <button onClick={onClose} className="text-slate-500 text-xl leading-none">
            x
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {catalogosLoading ? (
            <p className="text-sm text-slate-500">Cargando catálogos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">Código del activo</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1 bg-slate-100 text-slate-600"
                  value={generandoCodigo ? "Generando..." : form.codigo_activo}
                  readOnly
                  placeholder="Se generará automáticamente"
                />
              </div>

              <Input
                label="Nombre del activo"
                value={form.nombre}
                onChange={(value) => update("nombre", value)}
              />

              <Select
                label="Planta"
                value={plantaId}
                onChange={(value) => {
                  setPlantaId(value);
                  update("nodo_organizacion_id", "");
                  update("codigo_activo", "");
                }}
                options={plantas.map((planta) => ({
                  value: planta.id,
                  label: `${planta.codigo} - ${planta.nombre}`,
                }))}
              />

              <Select
                label="Área / Sistema / Ubicación"
                value={form.nodo_organizacion_id}
                onChange={(value) => {
                  update("nodo_organizacion_id", value);
                  update("codigo_activo", "");
                }}
                options={ubicacionesFiltradas.map((nodo) => ({
                  value: nodo.id,
                  label: `${nodo.codigo} - ${nodo.nombre} (${nodo.tipo})`,
                }))}
              />

              <Select
                label="Familia"
                value={familiaId}
                onChange={seleccionarFamilia}
                options={familias.map((familia) => ({
                  value: familia.id,
                  label: `${familia.codigo} - ${familia.nombre}`,
                }))}
              />

              <Select
                label="Tipo de equipo"
                value={tipoEquipoId}
                onChange={seleccionarTipoEquipo}
                options={tiposFiltrados.map((tipo) => ({
                  value: tipo.id,
                  label: `${tipo.codigo} - ${tipo.nombre}`,
                }))}
              />

              <Input
                label="Marca"
                value={form.marca}
                onChange={(value) => update("marca", value)}
              />
              <Input
                label="Modelo"
                value={form.modelo}
                onChange={(value) => update("modelo", value)}
              />
              <Input
                label="Serie"
                value={form.serie}
                onChange={(value) => update("serie", value)}
              />
              <Input
                label="Fabricante"
                value={form.fabricante}
                onChange={(value) => update("fabricante", value)}
              />
              <Input
                label="Proveedor"
                value={form.proveedor}
                onChange={(value) => update("proveedor", value)}
              />
              <Input
                label="Responsable"
                value={form.responsable}
                onChange={(value) => update("responsable", value)}
              />

              <div>
                <label className="text-sm text-slate-600">
                  Imagen del activo
                </label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setImagenFile(event.target.files?.[0] ?? null)
                  }
                />
                <p className="mt-1 text-xs text-slate-400">
                  Se guardarÃ¡ en el bucket activos / imagenes-activos.
                </p>
              </div>

              <Select
                label="Estado operativo"
                value={form.estado_operativo}
                onChange={(value) => update("estado_operativo", value)}
                options={[
                  { value: "OPERATIVO", label: "Operativo" },
                  { value: "OBSERVADO", label: "Observado" },
                  { value: "FUERA_SERVICIO", label: "Fuera de servicio" },
                ]}
              />

              <Select
                label="Criticidad"
                value={form.criticidad}
                onChange={(value) => update("criticidad", value)}
                options={[
                  { value: "A", label: "A - Crítico" },
                  { value: "B", label: "B - Importante" },
                  { value: "C", label: "C - Secundario" },
                ]}
              />

              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Descripción</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
                  rows={3}
                  value={form.descripcion}
                  onChange={(event) => update("descripcion", event.target.value)}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">
            Cancelar
          </button>

          <button
            onClick={guardarActivo}
            disabled={guardando || catalogosLoading || generandoCodigo}
            className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {guardando ? "Guardando..." : "Guardar Activo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
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
      <input
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
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        value={value}
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
