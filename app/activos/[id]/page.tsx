import { ExpedienteActivo } from "@/components/activos/ExpedienteActivo";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function ExpedienteActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1">
          <Header />
          <ExpedienteActivo activoId={id} />
        </section>
      </div>
    </main>
  );
}
