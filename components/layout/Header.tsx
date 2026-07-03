"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getDefaultDemoUser,
  getDemoUser,
  type DemoUser,
} from "@/services/auth.service";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/gerencia": "Dashboard Ejecutivo",
  "/organizacion": "Organización",
  "/activos": "Gestión de Activos",
  "/ordenes-trabajo": "Órdenes de Trabajo",
  "/programa-anual": "Programa Anual",
  "/supervisor": "Centro del Supervisor",
  "/tecnico": "Centro Técnico",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
};

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<DemoUser>(getDefaultDemoUser());
  const title = pathname.startsWith("/activos/")
    ? "Expediente del Activo"
    : pathname.startsWith("/fichas/")
      ? "Ficha de Mantenimiento"
      : titles[pathname] || "Proyecto WU";

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getDemoUser());
    });
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500">
          Sistema Integral de Gestión de Activos y Mantenimiento
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-slate-700">{user.name}</p>
        <p className="text-xs text-slate-500">{user.role}</p>
      </div>
    </header>
  );
}
