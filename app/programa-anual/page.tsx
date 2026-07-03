import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProgramaMantenimientoPage } from "@/components/mantenimiento/ProgramaMantenimientoPage";

export default function ProgramaAnualPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <Header />
          <Suspense fallback={<div className="p-8 text-slate-500">Cargando programa...</div>}>
            <ProgramaMantenimientoPage />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
