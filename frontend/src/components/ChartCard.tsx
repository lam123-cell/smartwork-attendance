import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-6 shadow-sm w-full">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">{title}</h3>
      <div className="w-full h-48 md:h-64 lg:h-80 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
