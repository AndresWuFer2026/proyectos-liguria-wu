import { ActivosPage } from "@/components/activos/ActivosPage";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Activos() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <Header />
          <ActivosPage />
        </section>
      </div>
    </main>
  );
}