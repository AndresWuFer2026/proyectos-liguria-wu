"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getDemoRoles,
  getHomePathForRole,
  loginDemo,
  type DemoRole,
} from "@/services/auth.service";
import { AppIcon } from "@/components/ui/AppIcon";

export function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<DemoRole>("ADMIN");
  const [usuario, setUsuario] = useState("admin@liguria.demo");
  const [password, setPassword] = useState("demo");

  function ingresar() {
    const user = loginDemo(role);
    router.push(getHomePathForRole(user.role));
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden lg:flex bg-[#0F3D56] text-white p-12 flex-col justify-between">
        <div className="rounded-lg bg-white p-5 w-fit shadow-sm">
          <Image
            src="/liguria-logo.webp"
            alt="Inversiones Pesqueras Liguria S.A.C."
            width={260}
            height={130}
            priority
          />
        </div>

        <div className="max-w-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-teal-200">
            Proyecto para area de mantenimiento - Elab. A. Wu 
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">
            Gestión de activos y mantenimiento para operación industrial.
          </h1>
          <p className="mt-4 text-slate-200">
            Demo funcional para gerencia, supervisión, técnicos y administración.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm text-slate-200">
          <Badge label="Gestion" />
          <Badge label="Mantenimiento" />
          <Badge label="Activos" />
        </div>
      </section>

      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <Image
              src="/liguria-logo.webp"
              alt="Liguria"
              width={120}
              height={60}
              priority
              className="rounded bg-white"
            />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Proyecto WU</h2>
              <p className="text-sm text-slate-500">Acceso corporativo</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Usuario"
              value={usuario}
              onChange={setUsuario}
              placeholder="usuario@liguria.com"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            <div>
              <label className="text-sm text-slate-600">Rol demo</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
                value={role}
                onChange={(event) => setRole(event.target.value as DemoRole)}
              >
                {getDemoRoles().map((demoRole) => (
                  <option key={demoRole} value={demoRole}>
                    {demoRole}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={ingresar}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-lg px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <AppIcon name="shield" className="h-4 w-4" />
              Ingresar
            </button>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            Preparado para Supabase Auth. En esta beta se usa login demo por rol.
          </p>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <input
        type={type}
        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm mt-1"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
      {label}
    </span>
  );
}
