export function Header() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Sistema Integral de Gestión de Activos y Mantenimiento
        </p>
      </div>

      <div className="text-sm text-slate-600">👤 Administrador</div>
    </header>
  );
}