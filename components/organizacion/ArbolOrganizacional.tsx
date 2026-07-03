"use client";

import { useEffect, useState } from "react";
import {
  listarOrganizacionCompleta,
  type Empresa,
  type NodoOrganizacion,
} from "@/services/organizacion.service";
import { getServiceErrorMessage } from "@/services/supabase-error";

export function ArbolOrganizacional() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [nodos, setNodos] = useState<NodoOrganizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function cargarInicial() {
      try {
        const data = await listarOrganizacionCompleta();
        if (mounted) {
          setEmpresas(data.empresas);
          setNodos(data.nodos);
        }
      } catch (error) {
        console.error("Error cargando organización:", error);
        if (mounted) {
          setErrorMessage(getServiceErrorMessage(error));
          setEmpresas([]);
          setNodos([]);
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

  const raices = nodos.filter((nodo) => nodo.nodo_padre_id === null);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Organización</h1>
      <p className="text-sm text-slate-500 mb-6">
        Empresa, sedes, plantas, áreas, sistemas y ubicaciones de Liguria.
      </p>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        {loading ? (
          <p className="text-slate-500">Cargando organización...</p>
        ) : errorMessage ? (
          <p className="text-red-600">{errorMessage}</p>
        ) : nodos.length === 0 ? (
          <p className="text-slate-500">No hay nodos organizacionales.</p>
        ) : (
          <div className="space-y-6">
            {empresas.length > 0
              ? empresas.map((empresa) => (
                  <EmpresaItem
                    key={empresa.id}
                    empresa={empresa}
                    nodos={nodos.filter(
                      (nodo) => nodo.empresa_id === empresa.id
                    )}
                  />
                ))
              : raices.map((nodo) => (
                  <NodoItem key={nodo.id} nodo={nodo} nodos={nodos} nivel={0} />
                ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmpresaItem({
  empresa,
  nodos,
}: {
  empresa: Empresa;
  nodos: NodoOrganizacion[];
}) {
  const raices = nodos.filter((nodo) => nodo.nodo_padre_id === null);
  const nombre = empresa.razon_social || empresa.nombre || "Empresa";

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <TipoBadge tipo="EMPRESA" />
        <div>
          <p className="font-semibold text-slate-800">{nombre}</p>
          {empresa.codigo && (
            <p className="text-xs text-slate-500">{empresa.codigo}</p>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {raices.length === 0 ? (
          <p className="text-sm text-slate-500">No hay nodos para esta empresa.</p>
        ) : (
          raices.map((nodo) => (
            <NodoItem key={nodo.id} nodo={nodo} nodos={nodos} nivel={0} />
          ))
        )}
      </div>
    </div>
  );
}

function NodoItem({
  nodo,
  nodos,
  nivel,
}: {
  nodo: NodoOrganizacion;
  nodos: NodoOrganizacion[];
  nivel: number;
}) {
  const hijos = nodos.filter((item) => item.nodo_padre_id === nodo.id);

  return (
    <div style={{ marginLeft: nivel * 24 }}>
      <div className="flex items-center gap-2 py-2 text-sm">
        <TipoBadge tipo={nodo.tipo} />
        <span className="font-medium text-slate-800">{nodo.nombre}</span>
        <span className="text-xs text-slate-400">({nodo.codigo})</span>
      </div>

      {hijos.map((hijo) => (
        <NodoItem key={hijo.id} nodo={hijo} nodos={nodos} nivel={nivel + 1} />
      ))}
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      {tipo}
    </span>
  );
}
