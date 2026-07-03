import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppIcon } from "@/components/ui/AppIcon";

const reportes = [
  {
    title: "Reporte de OT",
    description: "Seguimiento por estado, responsable, especialidad y activo.",
    icon: "clipboard" as const,
  },
  {
    title: "Reporte de programa anual",
    description: "Programaciones PM, vencidos, reprogramados y ejecutados.",
    icon: "calendar" as const,
  },
  {
    title: "Historial por activo",
    description: "Trazabilidad de mantenimiento por expediente de activo.",
    icon: "file-text" as const,
  },
  {
    title: "Fichas de mantenimiento",
    description: "Fichas validadas por supervisor para exportar en PDF o Excel.",
    icon: "check-circle" as const,
  },
];

export default function ReportesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <Header />
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
              <p className="text-sm text-slate-500">
                Reportes operativos y ejecutivos para mantenimiento y activos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {reportes.map((reporte) => (
                <div
                  key={reporte.title}
                  className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                >
                  <div className="rounded-lg bg-teal-50 text-teal-600 w-fit p-3 mb-4">
                    <AppIcon name={reporte.icon} className="h-5 w-5" />
                  </div>
                  <h2 className="font-semibold text-slate-800">{reporte.title}</h2>
                  <p className="text-sm text-slate-500 mt-2">
                    {reporte.description}
                  </p>
                  <div className="flex gap-3 mt-5">
                    <button className="px-3 py-2 rounded-lg border text-sm text-slate-600">
                      PDF
                    </button>
                    <button className="px-3 py-2 rounded-lg border text-sm text-slate-600">
                      Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
