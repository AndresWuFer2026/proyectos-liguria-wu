import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CentroTecnico } from "@/components/mantenimiento/CentroTecnico";

export default function TecnicoPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <Header />
          <CentroTecnico />
        </section>
      </div>
    </main>
  );
}
