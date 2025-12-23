import { useState, useEffect } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import StatCard from "@/components/StatCard";
import ChartCard from "@/components/ChartCard";
import { Users, Clock, AlertTriangle, FileText } from "lucide-react";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";
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

type DashboardStats = {
  totalEmployees: number;
  checkedInToday: number;
  lateToday: number;
  avgHours: number;
};

type BarChartDataType = {
  day: string;
  hours: number;
};

type PieChartDataType = {
  name: string;
  value: number;
  color: string;
};

type RecentActivityType = {
  id: string;
  name: string;
  department: string;
  time: string;
  status: 'on-time' | 'late';
  workDate: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    checkedInToday: 0,
    lateToday: 0,
    avgHours: 0,
  });
  const [barChartData, setBarChartData] = useState<BarChartDataType[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartDataType[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, hoursRes, attendanceRes, activityRes] = await Promise.all([
        http.get<{ stats: DashboardStats }>('/dashboard/stats'),
        http.get<{ data: BarChartDataType[] }>('/dashboard/hours-chart'),
        http.get<{ data: PieChartDataType[] }>('/dashboard/attendance-chart'),
        http.get<{ data: RecentActivityType[] }>('/dashboard/recent-activity'),
      ]);

      setStats(statsRes.data.stats);
      setBarChartData(hoursRes.data.data);
      setPieChartData(attendanceRes.data.data);
      setRecentActivity(activityRes.data.data);
    } catch (err: any) {

      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard",
        duration: 5000,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <AdminLayout
      title="Tổng quan hệ thống"
      subtitle="Trang tổng quan hệ thống."
    >
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Đang tải dữ liệu...</div>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
              title="Tổng số nhân viên"
              value={String(stats.totalEmployees)}
              icon={Users}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Đã chấm công hôm nay"
              value={`${stats.checkedInToday}/${stats.totalEmployees}`}
              icon={Clock}
              bgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              title="Đi muộn hôm nay"
              value={String(stats.lateToday)}
              icon={AlertTriangle}
              bgColor="bg-red-100"
              iconColor="text-red-600"
            />
            <StatCard
              title="Giờ làm TB/ngày"
              value={`${stats.avgHours}h`}
              icon={FileText}
              bgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tên nhân viên
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Phòng ban
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Giờ check-in
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentActivity.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 md:px-6 py-8 text-center text-gray-500">
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    recentActivity.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.name}
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.department}
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {activity.time}
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 md:px-3 py-1 text-xs font-semibold rounded-full ${
                              activity.status === "on-time"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {activity.status === "on-time" ? "Đúng giờ" : "Đi muộn"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
