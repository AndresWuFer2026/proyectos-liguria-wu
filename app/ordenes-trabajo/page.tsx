import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OrdenesTrabajoPage } from "@/components/mantenimiento/OrdenesTrabajoPage";

export default function OrdenesTrabajoRoute() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <Header />
          <Suspense fallback={<div className="p-8 text-slate-500">Cargando OT...</div>}>
            <OrdenesTrabajoPage />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
