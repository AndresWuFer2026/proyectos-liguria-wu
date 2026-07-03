import { supabase } from "@/lib/supabase";

export type DashboardMetricas = {
  equiposTotales: number;
  otPendientes: number;
  pmMes: number;
  pmVencidos: number;
  equiposFueraServicio: number;
  disponibilidad: string;
  correctivos: number;
  preventivos: number;
};

async function contarEquipos() {
  const { count, error } = await supabase
    .from("equipos")
    .select("id", { count: "exact", head: true });

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function contarOtPendientes() {
  const { count, error } = await supabase
    .from("ordenes_trabajo")
    .select("id", { count: "exact", head: true })
    .not("estado", "in", "(CERRADA,CANCELADA)");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function contarPmMes() {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { count, error } = await supabase
    .from("ordenes_trabajo")
    .select("id", { count: "exact", head: true })
    .gte("fecha_programada", desde)
    .lt("fecha_programada", hasta)
    .ilike("tipo_mantenimiento", "%preventivo%");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function contarPmVencidos() {
  const { count, error } = await supabase
    .from("ordenes_trabajo")
    .select("id", { count: "exact", head: true })
    .lt("fecha_programada", new Date().toISOString())
    .not("estado", "in", "(CERRADA,CANCELADA)");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function contarEquiposFueraServicio() {
  const { count, error } = await supabase
    .from("equipos")
    .select("id", { count: "exact", head: true })
    .eq("estado_operativo", "FUERA_SERVICIO");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function contarTipoMantenimiento(tipo: string) {
  const { count, error } = await supabase
    .from("ordenes_trabajo")
    .select("id", { count: "exact", head: true })
    .ilike("tipo_mantenimiento", `%${tipo}%`);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function calcularDisponibilidad() {
  const { data, error } = await supabase
    .from("equipos")
    .select("estado_operativo");

  if (error || !data || data.length === 0) {
    return "0%";
  }

  const operativos = data.filter(
    (item) => String(item.estado_operativo ?? "").toUpperCase() === "OPERATIVO"
  ).length;

  return `${((operativos / data.length) * 100).toFixed(1)}%`;
}

export async function obtenerMetricasDashboard(): Promise<DashboardMetricas> {
  const [
    equiposTotales,
    otPendientes,
    pmMes,
    pmVencidos,
    equiposFueraServicio,
    disponibilidad,
    correctivos,
    preventivos,
  ] =
    await Promise.all([
      contarEquipos(),
      contarOtPendientes(),
      contarPmMes(),
      contarPmVencidos(),
      contarEquiposFueraServicio(),
      calcularDisponibilidad(),
      contarTipoMantenimiento("CORRECTIVO"),
      contarTipoMantenimiento("PREVENTIVO"),
    ]);

  return {
    equiposTotales,
    otPendientes,
    pmMes,
    pmVencidos,
    equiposFueraServicio,
    disponibilidad,
    correctivos,
    preventivos,
  };
}
