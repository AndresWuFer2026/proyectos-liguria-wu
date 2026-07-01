export function ActivosPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Gestión de Activos
          </h1>
          <p className="text-sm text-slate-500">
            Registro, consulta y control de activos industriales.
          </p>
        </div>

        <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Nuevo Activo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm"
            placeholder="Buscar activo..."
          />

          <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm">
            <option>Planta</option>
            <option>Congelado</option>
            <option>Conservas</option>
            <option>Harina Residual</option>
          </select>

          <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm">
            <option>Estado</option>
            <option>Operativo</option>
            <option>Observado</option>
            <option>Fuera de servicio</option>
          </select>

          <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm">
            <option>Criticidad</option>
            <option>A - Crítico</option>
            <option>B - Importante</option>
            <option>C - Secundario</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-6 py-3">Código</th>
              <th className="text-left px-6 py-3">Activo</th>
              <th className="text-left px-6 py-3">Ubicación</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-left px-6 py-3">Criticidad</th>
              <th className="text-right px-6 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            <ActivoRow
              codigo="LIG-CG-SM-CMP-001"
              activo="Compresor NH3-01"
              ubicacion="Congelado / Sala de Máquinas"
              estado="Operativo"
              criticidad="A"
            />

            <ActivoRow
              codigo="LIG-CG-SM-BOM-002"
              activo="Bomba NH3-02"
              ubicacion="Congelado / Sala de Máquinas"
              estado="Observado"
              criticidad="B"
            />

            <ActivoRow
              codigo="LIG-CV-AU-ACL-001"
              activo="Autoclave 01"
              ubicacion="Conservas / Autoclaves"
              estado="Operativo"
              criticidad="A"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ActivoRowProps = {
  codigo: string;
  activo: string;
  ubicacion: string;
  estado: string;
  criticidad: string;
};

function ActivoRow({
  codigo,
  activo,
  ubicacion,
  estado,
  criticidad,
}: ActivoRowProps) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-6 py-4 font-medium text-[#0F3D56]">{codigo}</td>
      <td className="px-6 py-4 text-slate-700">{activo}</td>
      <td className="px-6 py-4 text-slate-500">{ubicacion}</td>
      <td className="px-6 py-4">
        <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-medium">
          {estado}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
          {criticicidadLabel(criticidad)}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-[#0F3D56] font-medium hover:underline">
          Ver expediente
        </button>
      </td>
    </tr>
  );
}

function criticicidadLabel(value: string) {
  if (value === "A") return "A - Crítico";
  if (value === "B") return "B - Importante";
  return "C - Secundario";
}