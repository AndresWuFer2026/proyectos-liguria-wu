"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getDefaultDemoUser,
  getDemoUser,
  logoutDemo,
  type DemoRole,
  type DemoUser,
} from "@/services/auth.service";
import { AppIcon, type IconName } from "@/components/ui/AppIcon";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  roles: DemoRole[];
};

const items: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "layout",
    roles: ["ADMIN", "GERENCIA"],
  },
  {
    label: "Organización",
    href: "/organizacion",
    icon: "factory",
    roles: ["ADMIN"],
  },
  {
    label: "Activos",
    href: "/activos",
    icon: "briefcase",
    roles: ["ADMIN", "GERENCIA", "SUPERVISOR"],
  },
  {
    label: "Programa Anual",
    href: "/programa-anual",
    icon: "calendar",
    roles: ["ADMIN", "GERENCIA", "SUPERVISOR"],
  },
  {
    label: "Órdenes de Trabajo",
    href: "/ordenes-trabajo",
    icon: "clipboard",
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    label: "Centro Supervisor",
    href: "/supervisor",
    icon: "shield",
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    label: "Centro Técnico",
    href: "/tecnico",
    icon: "hard-hat",
    roles: ["ADMIN", "TECNICO"],
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: "bar-chart",
    roles: ["ADMIN", "GERENCIA"],
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: "cog",
    roles: ["ADMIN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<DemoUser>(getDefaultDemoUser());

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getDemoUser());
    });
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => item.roles.includes(user.role)),
    [user.role]
  );

  function salir() {
    logoutDemo();
    router.push("/login");
  }

  return (
    <aside className="w-72 bg-[#0F3D56] text-white min-h-screen shrink-0 flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="rounded-lg bg-white p-3 mb-4">
          <Image
            src="/liguria-logo.webp"
            alt="Inversiones Pesqueras Liguria S.A.C."
            width={190}
            height={95}
            priority
          />
        </div>
        <h1 className="text-xl font-bold">Proyecto WU</h1>
        <p className="text-sm text-slate-200">Beta v1.0 Enterprise</p>
      </div>

      <nav className="p-4 space-y-2 text-sm flex-1">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/activos" && pathname.startsWith("/activos/")) ||
            (item.href === "/ordenes-trabajo" && pathname.startsWith("/fichas/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                active ? "bg-white/15 font-semibold" : "hover:bg-white/10"
              }`}
            >
              <AppIcon name={item.icon} className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="rounded-lg bg-white/10 p-3 mb-3">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-slate-200">{user.role}</p>
        </div>
        <button
          onClick={salir}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
        >
          <AppIcon name="log-out" className="h-4 w-4" />
          Salir
        </button>
      </div>
    </aside>
  );
}
