export function Sidebar() {
  const items = [
    "📊 Dashboard",
    "🏭 Gestión de Activos",
    "🛠 Mantenimiento",
    "📅 Programa Anual",
    "📄 Documentación",
    "📈 Reportes",
    "👥 Usuarios",
    "⚙️ Configuración",
  ];

  return (
    <aside className="w-72 bg-[#0F3D56] text-white">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">WU EAM</h1>
        <p className="text-sm text-slate-200">Proyecto Liguria WU</p>
      </div>

      <nav className="p-4 space-y-2 text-sm">
        {items.map((item, index) => (
          <div
            key={item}
            className={`rounded-lg px-4 py-3 cursor-pointer ${
              index === 0 ? "bg-white/10" : "hover:bg-white/10"
            }`}
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
}