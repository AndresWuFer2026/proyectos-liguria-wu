import { AppIcon, type IconName } from "@/components/ui/AppIcon";

type DashboardCardProps = {
  title: string;
  value: string;
  icon?: IconName;
};

export function DashboardCard({ title, value, icon = "activity" }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-[#0F3D56] mt-2">{value}</p>
        </div>
        <div className="rounded-lg bg-teal-50 p-3 text-teal-600">
          <AppIcon name={icon} className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
