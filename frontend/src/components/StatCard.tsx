import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

export default function StatCard({ title, value, icon: Icon, bgColor}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`w-10 md:w-12 h-10 md:h-14 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 md:w-6 h-5 md:h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-xs md:text-sm text-gray-600 mb-1 truncate">{title}</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 truncate">{value}</div>
        </div>
      </div>
    </div>
  );
}
