type DashboardCardProps = {
  title: string;
  value: string;
};

export function DashboardCard({ title, value }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold text-[#0F3D56] mt-2">{value}</p>
    </div>
  );
}