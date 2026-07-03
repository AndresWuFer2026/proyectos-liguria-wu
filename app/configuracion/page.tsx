import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppIcon } from "@/components/ui/AppIcon";

const modules = [
  "Usuarios",
  "Roles",
  "Catálogos",
  "Familias",
  "Tipos de equipo",
  "Especialidades",
  "Estados",
  "Tipos de documento",
];

export default function ConfiguracionPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <section className="flex-1">
          <Header />
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
              <p className="text-sm text-slate-500">
                Base administrativa para usuarios, roles y catálogos del sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {modules.map((module) => (
                <div
                  key={module}
                  className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm"
                >
                  <div className="rounded-lg bg-slate-100 text-[#0F3D56] w-fit p-3 mb-4">
                    <AppIcon name="cog" className="h-5 w-5" />
                  </div>
                  <h2 className="font-semibold text-slate-800">{module}</h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Configuración base preparada para la siguiente etapa.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
