export function ExpedienteActivo() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between">
          <div>
            <p className="text-sm text-slate-500">LIG-CG-SM-CMP-001</p>
            <h1 className="text-2xl font-bold text-slate-800">
              Compresor NH3-01
            </h1>
            <p className="text-sm text-slate-500">
              Planta Congelado / Sala de Máquinas
            </p>
          </div>

          <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Registrar mantenimiento
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          <div className="lg:col-span-1">
            <div className="h-52 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              Foto del activo
            </div>

            <div className="mt-4 h-32 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm">
              QR del equipo
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            <InfoCard title="Estado" value="Operativo" color="text-teal-600" />
            <InfoCard title="Criticidad" value="A - Crítico" color="text-red-600" />
            <InfoCard title="Próximo PM" value="15/07/2026" color="text-amber-600" />
            <InfoCard title="Disponibilidad" value="97.5%" color="text-[#0F3D56]" />

            <div className="md:col-span-4 bg-slate-50 rounded-xl p-5">
              <h3 className="font-semibold text-slate-800 mb-4">
                Información interna del activo
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <Field label="Marca" value="MYCOM" />
                <Field label="Modelo" value="Por completar" />
                <Field label="Serie" value="Por completar" />
                <Field label="Fabricante" value="Mayekawa" />
                <Field label="Año fabricación" value="Por completar" />
                <Field label="Responsable" value="Mantenimiento" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
            {[
              "Información",
              "Documentación Técnica",
              "Componentes",
              "Mantenimientos",
              "Programa Anual",
              "Fotografías",
              "Indicadores",
              "QR",
            ].map((tab, index) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm rounded-t-lg ${
                  index === 1
                    ? "bg-[#0F3D56] text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">
              Documentación Técnica del Fabricante / Proveedor
            </h3>

            <div className="flex justify-between mb-4">
              <p className="text-sm text-slate-500">
                Archivos PDF asociados al activo: ficha técnica, manuales,
                planos, certificados y garantías.
              </p>

              <button className="bg-[#0F3D56] hover:bg-[#0c3145] text-white px-4 py-2 rounded-lg text-sm">
                + Subir documento
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-5 py-3">Tipo</th>
                    <th className="text-left px-5 py-3">Nombre</th>
                    <th className="text-left px-5 py-3">Versión</th>
                    <th className="text-left px-5 py-3">Fecha</th>
                    <th className="text-right px-5 py-3">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  <DocRow
                    tipo="Ficha técnica fabricante"
                    nombre="Datasheet Compresor MYCOM"
                    version="1.0"
                    fecha="01/07/2026"
                  />
                  <DocRow
                    tipo="Manual de operación"
                    nombre="Manual Operación MYCOM"
                    version="2.1"
                    fecha="01/07/2026"
                  />
                  <DocRow
                    tipo="Plano eléctrico"
                    nombre="Plano tablero compresor"
                    version="Rev. 03"
                    fecha="01/07/2026"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

function DocRow({
  tipo,
  nombre,
  version,
  fecha,
}: {
  tipo: string;
  nombre: string;
  version: string;
  fecha: string;
}) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-4 text-slate-700">{tipo}</td>
      <td className="px-5 py-4 font-medium text-[#0F3D56]">{nombre}</td>
      <td className="px-5 py-4 text-slate-500">{version}</td>
      <td className="px-5 py-4 text-slate-500">{fecha}</td>
      <td className="px-5 py-4 text-right">
        <button className="text-[#0F3D56] font-medium hover:underline mr-3">
          Ver
        </button>
        <button className="text-teal-600 font-medium hover:underline">
          Descargar
        </button>
      </td>
    </tr>
  );
}