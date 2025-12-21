import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm w-full overflow-x-auto">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="w-full h-64 md:h-80 min-w-full">
        {children}
      </div>
    </div>
  );
}
