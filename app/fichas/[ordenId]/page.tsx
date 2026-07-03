import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { FichaMantenimiento } from "@/components/mantenimiento/FichaMantenimiento";

export default async function FichaMantenimientoPage({
  params,
}: {
  params: Promise<{ ordenId: string }>;
}) {
  const { ordenId } = await params;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <Header />
          <FichaMantenimiento ordenId={ordenId} />
        </section>
      </div>
    </main>
  );
}
