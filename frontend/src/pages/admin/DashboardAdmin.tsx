import AdminLayout from "@/layouts/AdminLayout";
import StatCard from "@/components/StatCard";
import ChartCard from "@/components/ChartCard";
import { Users, Clock, AlertTriangle, FileText } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const barChartData = [
  { day: "Thứ 2", hours: 8.5 },
  { day: "Thứ 3", hours: 8.2 },
  { day: "Thứ 4", hours: 8.5 },
  { day: "Thứ 5", hours: 8.3 },
  { day: "Thứ 6", hours: 8.5 },
  { day: "Thứ 7", hours: 7.0 },
  { day: "CN", hours: 4.6 },
];

const pieChartData = [
  { name: "Đúng giờ", value: 75, color: "#16A34A" },
  { name: "Đi muộn", value: 15, color: "#DC2626" },
  { name: "Vắng mặt", value: 10, color: "#F59E0B" },
];

const recentActivity = [
  { name: "Nguyễn Văn A", department: "IT", time: "08:15", status: "on-time" },
  { name: "Trần Thị B", department: "Marketing", time: "08:45", status: "late" },
  { name: "Lê Văn C", department: "Sales", time: "08:00", status: "on-time" },
  { name: "Phạm Thị D", department: "HR", time: "08:30", status: "on-time" },
  { name: "Hoàng Văn E", department: "Finance", time: "09:15", status: "late" },
];

export default function Dashboard() {
  return (
    <AdminLayout
      title="Tổng quan hệ thống"
      subtitle="Trang tổng quan hệ thống."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tổng số nhân viên"
            value="32"
            icon={Users}
            bgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Đã chấm công hôm nay"
            value="28/32"
            icon={Clock}
            bgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Đi muộn hôm nay"
            value="4"
            icon={AlertTriangle}
            bgColor="bg-red-100"
            iconColor="text-red-600"
          />
          <StatCard
            title="Giờ làm TB/ngày"
            value="7.6h"
            icon={FileText}
            bgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <ChartCard title="Giờ làm trung bình theo ngày">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#2563EB" name="Giờ làm" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pie Chart */}
          <ChartCard title="Tỉ lệ chấm công">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            <button className="text-sm font-medium text-blue-600 hover:underline">
              Xem tất cả
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activity.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {activity.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          activity.status === "on-time"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {activity.status === "on-time" ? "Đúng giờ" : "Đi muộn"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
