import { supabase } from "@/lib/supabase";

export type NodoOrganizacion = {
  id: string;
  empresa_id: string | null;
  nodo_padre_id: string | null;
  nombre: string;
  codigo: string;
  tipo: string;
};

export type Empresa = {
  id: string;
  codigo?: string | null;
  nombre?: string | null;
  razon_social?: string | null;
};

export type OrganizacionData = {
  empresas: Empresa[];
  nodos: NodoOrganizacion[];
};

export async function listarNodosOrganizacion() {
  const { data, error } = await supabase
    .from("organizacion_nodos")
    .select("id,empresa_id,nodo_padre_id,nombre,codigo,tipo")
    .order("codigo");

  if (error) {
    throw error;
  }

  return (data ?? []) as NodoOrganizacion[];
}

export async function listarOrganizacionCompleta(): Promise<OrganizacionData> {
  const [nodos, empresasResult] = await Promise.all([
    listarNodosOrganizacion(),
    supabase.from("empresas").select("*").order("nombre"),
  ]);

  return {
    nodos,
    empresas: empresasResult.error
      ? []
      : ((empresasResult.data ?? []) as Empresa[]),
  };
}
