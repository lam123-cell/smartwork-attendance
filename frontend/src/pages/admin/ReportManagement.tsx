import AdminLayout from "@/layouts/AdminLayout";
import StatCard from "@/components/StatCard";
import ChartCard from "@/components/ChartCard";
import { Users, Clock, AlertTriangle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const barChartData = [
  { department: "IT", hours: 1250 },
  { department: "Kế toán", hours: 1000 },
  { department: "Marketing", hours: 1100 },
  { department: "HR", hours: 900 },
  { department: "Sales", hours: 850 },
];

const pieChartData = [
  { name: "Đúng giờ", value: 75.5, color: "#16A34A" },
  { name: "Đi muộn", value: 18.2, color: "#F59E0B" },
  { name: "Vắng mặt", value: 6.3, color: "#DC2626" },
];

const detailedReports = [
  { name: "Nguyễn Văn A", department: "IT", workDays: 22, lateDays: 2, totalHours: 176, efficiency: 95 },
  { name: "Trần Thị B", department: "Kế toán", workDays: 21, lateDays: 1, totalHours: 168, efficiency: 98 },
  { name: "Lê Văn C", department: "Marketing", workDays: 20, lateDays: 3, totalHours: 160, efficiency: 87 },
];

export default function Reports() {
  return (
    <AdminLayout
      title="Báo cáo thống kê"
      subtitle="Trang báo cáo cung cấp số liệu tổng hợp theo tháng và theo phòng ban."
    >
      <div className="space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <Select defaultValue="11-2025">
              <SelectTrigger className="w-[282px] h-10">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="11-2025">Tháng 11/2025</SelectItem>
                <SelectItem value="10-2025">Tháng 10/2025</SelectItem>
                <SelectItem value="09-2025">Tháng 09/2025</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[282px] h-10">
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-6">
              Áp dụng bộ lọc
            </Button>

            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 h-10 ml-auto">
              <FileText className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>

            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 h-10">
              <Download className="w-4 h-4 mr-2" />
              Xuất PDF
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Tổng số nhân viên"
            value="32 nhân viên"
            icon={Users}
            bgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Tổng giờ làm trong tháng"
            value="5,120 giờ"
            icon={Clock}
            bgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Số lượt đi muộn"
            value="45 lượt"
            icon={AlertTriangle}
            bgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <ChartCard title="Tổng giờ làm theo phòng ban">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#93C5FD" name="Giờ làm" />
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

        {/* Detailed Report Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Báo cáo chi tiết</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số ngày làm
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số ngày đi muộn
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng giờ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hiệu suất (%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailedReports.map((report, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      {report.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      {report.workDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      {report.lateDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      {report.totalHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="text-sm text-gray-600">{report.efficiency}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${report.efficiency}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
            Báo cáo được tổng hợp tự động theo dữ liệu chấm công trong tháng.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
