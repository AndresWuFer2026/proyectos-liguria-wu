"use client";

import { useEffect, useState } from "react";
import { DashboardCard } from "./DashboardCard";
import {
  obtenerMetricasDashboard,
  type DashboardMetricas,
} from "@/services/dashboard.service";
import {
  getDefaultDemoUser,
  getDemoUser,
  type DemoUser,
} from "@/services/auth.service";

const initialMetricas: DashboardMetricas = {
  equiposTotales: 0,
  otPendientes: 0,
  pmMes: 0,
  pmVencidos: 0,
  equiposFueraServicio: 0,
  disponibilidad: "0%",
  correctivos: 0,
  preventivos: 0,
};

export function DashboardPage() {
  const [metricas, setMetricas] = useState<DashboardMetricas>(initialMetricas);
  const [user, setUser] = useState<DemoUser>(getDefaultDemoUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function cargarMetricas() {
      try {
        setUser(getDemoUser());
        const data = await obtenerMetricasDashboard();
        if (mounted) {
          setMetricas(data);
        }
      } catch (error) {
        console.error("Error cargando dashboard:", error);
        if (mounted) {
          setMetricas(initialMetricas);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    cargarMetricas();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-teal-600">{user.role}</p>
        <h1 className="text-2xl font-bold text-slate-800">
          {user.role === "GERENCIA" ? "Dashboard Ejecutivo" : "Dashboard"}
        </h1>
        <p className="text-sm text-slate-500">
          Vista integral de activos, programa preventivo y órdenes de trabajo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DashboardCard
          title="Equipos totales"
          value={loading ? "..." : String(metricas.equiposTotales)}
          icon="factory"
        />
        <DashboardCard
          title="OT pendientes"
          value={loading ? "..." : String(metricas.otPendientes)}
          icon="clipboard"
        />
        <DashboardCard
          title="PM del mes"
          value={loading ? "..." : String(metricas.pmMes)}
          icon="calendar"
        />
        <DashboardCard
          title="PM vencidos"
          value={loading ? "..." : String(metricas.pmVencidos)}
          icon="activity"
        />
        <DashboardCard
          title="Fuera de servicio"
          value={loading ? "..." : String(metricas.equiposFueraServicio)}
          icon="wrench"
        />
        <DashboardCard
          title="Disponibilidad"
          value={loading ? "..." : metricas.disponibilidad}
          icon="gauge"
        />
        <DashboardCard
          title="Correctivos"
          value={loading ? "..." : String(metricas.correctivos)}
          icon="briefcase"
        />
        <DashboardCard
          title="Preventivos"
          value={loading ? "..." : String(metricas.preventivos)}
          icon="check-circle"
        />
      </div>
    </div>
  );
}
