import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import StatCard from "@/components/StatCard";
import ChartCard from "@/components/ChartCard";
import { Users, Clock, AlertTriangle, FileText, Download, Loader2 } from "lucide-react";
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
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";

type MonthOption = { value: string; label: string };
type DepartmentOption = { id: string; name: string };
type RatioItem = { status: string; count: number; percentage: number };
type DetailRow = { id: string; name: string; department: string; workDays: number; lateDays: number; totalHours: number; efficiency: number };
type StatsResponse = { employeeCount: number; totalHours: number; lateCount: number };
type HoursByDepartmentResponse = { data: { department: string; hours: number }[] };
type AttendanceRatioResponse = { data: RatioItem[] };
type DetailedReportResponse = { data: DetailRow[] };

const statusMap: Record<string, { name: string; color: string }> = {
  present: { name: "Đúng giờ", color: "#16A34A" },
  late: { name: "Đi muộn", color: "#DC2626" },
  on_leave: { name: "Nghỉ phép", color: "#8B5CF6" },
  absent: { name: "Vắng mặt", color: "#F59E0B" },
};

const formatNumber = (n: number) => n.toLocaleString("vi-VN");

export default function Reports() {
  const { toast } = useToast();

  const [months, setMonths] = useState<MonthOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const [stats, setStats] = useState({ employeeCount: 0, totalHours: 0, lateCount: 0 });
  const [barData, setBarData] = useState<{ department: string; hours: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string; count: number }[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchFilters = async () => {
    try {
      const res = await http.get<{ months: MonthOption[]; departments: DepartmentOption[] }>("/reports/admin/filters");
      setMonths(res.data.months || []);
      setDepartments([{ id: "all", name: "Tất cả phòng ban" }, ...(res.data.departments || [])]);
      if (res.data.months?.length) {
        setSelectedMonth(res.data.months[0].value);
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Không tải được bộ lọc", variant: "destructive" });
    }
  };

  const fetchReport = async (month: string, dept: string) => {
    setLoading(true);
    try {
      const [statsRes, barRes, pieRes, detailRes] = await Promise.all([
        http.get<StatsResponse>("/reports/admin/stats", { params: { month, departmentId: dept } }),
        http.get<HoursByDepartmentResponse>("/reports/admin/hours-by-department", { params: { month, departmentId: dept } }),
        http.get<AttendanceRatioResponse>("/reports/admin/attendance-ratio", { params: { month, departmentId: dept } }),
        http.get<DetailedReportResponse>("/reports/admin/detailed", { params: { month, departmentId: dept } }),
      ]);

      setStats({
        employeeCount: statsRes.data.employeeCount || 0,
        totalHours: statsRes.data.totalHours || 0,
        lateCount: statsRes.data.lateCount || 0,
      });

      setBarData((barRes.data?.data || []).map(d => ({ department: d.department, hours: Number(d.hours || 0) })));

      setPieData((pieRes.data?.data || []).map(r => {
        const meta = statusMap[r.status] || { name: r.status, color: "#6B7280" };
        return { name: meta.name, value: r.percentage || 0, color: meta.color, count: r.count };
      }));

      setDetails(detailRes.data?.data || []);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Không tải được báo cáo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      await fetchFilters();
      setInitialLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchReport(selectedMonth, selectedDept);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedDept]);

  const handleExport = async (type: "excel" | "pdf") => {
    if (!selectedMonth) {
      toast({ title: "Lỗi", description: "Vui lòng chọn tháng trước khi xuất báo cáo", variant: "destructive" });
      return;
    }

    const setLoadingFn = type === "excel" ? setExportingExcel : setExportingPdf;
    setLoadingFn(true);
    try {
      const ext = type === "excel" ? "xlsx" : "pdf";
      const mime = type === "excel"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

      const res = await http.get<Blob>(`/reports/admin/export/${type}`, {
        params: { month: selectedMonth, departmentId: selectedDept },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao-cao-${selectedMonth}-${selectedDept}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Xuất báo cáo thất bại", variant: "destructive" });
    } finally {
      setLoadingFn(false);
    }
  };

  const pieChartData = useMemo(() => pieData, [pieData]);

  if (initialLoading) {
    return (
      <AdminLayout title="Báo cáo thống kê" subtitle="Trang báo cáo cung cấp số liệu tổng hợp theo tháng và theo phòng ban.">
        <div className="flex items-center justify-center py-16 text-gray-600">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang tải...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Báo cáo thống kê"
      subtitle="Trang báo cáo cung cấp số liệu tổng hợp theo tháng và theo phòng ban."
    >
      <div className="space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[282px] h-10">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-[282px] h-10">
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="bg-blue-600 hover:bg-blue-700 h-10 px-6"
              onClick={() => fetchReport(selectedMonth, selectedDept)}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Áp dụng bộ lọc
            </Button>

            <div className="flex-1" />

            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 h-10"
              onClick={() => handleExport("excel")}
              disabled={loading || exportingExcel || !selectedMonth}
            >
              {exportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Xuất Excel
            </Button>

            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 h-10"
              onClick={() => handleExport("pdf")}
              disabled={loading || exportingPdf || !selectedMonth}
            >
              {exportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Xuất PDF
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          <StatCard
            title="Tổng số nhân viên"
            value={`${formatNumber(stats.employeeCount)} nhân viên`}
            icon={Users}
            bgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Tổng giờ làm trong tháng"
            value={`${formatNumber(Math.round(stats.totalHours))} giờ`}
            icon={Clock}
            bgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Số lượt đi muộn"
            value={`${formatNumber(stats.lateCount)} lượt`}
            icon={AlertTriangle}
            bgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
          {/* Bar Chart */}
          <ChartCard title="Tổng giờ làm theo phòng ban">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#6B7280" }} />
                {/* Hiển thị nhãn rút gọn với dấu chấm lửng để tránh tràn chữ */}
                <YAxis
                  dataKey="department"
                  type="category"
                  tickFormatter={(v: string) => truncateDept(v)}
                  width={160}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <Tooltip content={<CustomTooltip />} />
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
                  <th className="px-2 md:px-4 lg:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="hidden sm:table-cell px-2 md:px-4 lg:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-2 md:px-4 lg:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số ngày làm
                  </th>
                  <th className="hidden md:table-cell px-2 md:px-4 lg:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số ngày đi muộn
                  </th>
                  <th className="hidden lg:table-cell px-2 md:px-4 lg:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng giờ
                  </th>
                  <th className="px-2 md:px-4 lg:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hiệu suất (%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
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

// Tooltip tùy biến: hiển thị tên phòng ban và giờ làm khi hover
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const dept = payload[0]?.payload?.department ?? '';
    const hours = payload[0]?.value ?? 0;
    return (
      <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
        <div className="text-sm font-medium text-gray-900">{dept}</div>
        <div className="text-xs text-gray-600">Giờ làm: {hours}</div>
      </div>
    );
  }
  return null;
}

// Rút gọn tên phòng ban nếu quá dài
function truncateDept(name: string, max = 18) {
  if (!name) return '';
  const plain = String(name);
  if (plain.length <= max) return plain;
  return plain.slice(0, Math.max(0, max - 1)) + '…';
}
