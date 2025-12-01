import { useState } from "react";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { CalendarDays, Clock, X, Search, FileDown } from "lucide-react";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";

export default function AttendanceHistory() {
  const [month, setMonth] = useState("Tháng 11 / 2025");
  const [fromDate, setFromDate] = useState("2025-11-01");
  const [toDate, setToDate] = useState("2025-11-30");
  const [status, setStatus] = useState("all");
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDays: 0, lateDays: 0, absentDays: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await http.get<{ items: any[] }>('/attendance/history/search', {
        params: { from_date: fromDate, to_date: toDate, status, limit: 100 }
      });
      setHistory(res.data.items);

      // Tính thống kê nhanh
      const totalDays = res.data.items.length;
      const lateDays = res.data.items.filter((item: any) => item.status === 'late').length;
      const absentDays = res.data.items.filter((item: any) => item.status === 'absent').length;
      setStats({ totalDays, lateDays, absentDays });
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không lấy được dữ liệu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await http.get<Blob>('/attendance/history/export', {
        params: { from_date: fromDate, to_date: toDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lich-su-cham-cong.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không xuất được file', variant: 'destructive' });
    }
  };

  return (
    <EmployeeLayout title="Lịch sử chấm công" subtitle="Xem lịch sử chấm công.">
      <div className="p-6 space-y-6">
        {/* Bộ lọc tìm kiếm */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <select 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              <option>Tháng 11 / 2025</option>
              <option>Tháng 10 / 2025</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#4B5563]">Từ ngày:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#4B5563]">Đến ngày:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              <option value="all">Tất cả trạng thái</option>
              <option value="present">Đúng giờ</option>
              <option value="late">Đi muộn</option>
              <option value="absent">Vắng</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button onClick={fetchHistory} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Search className="w-4 h-4" />
              <span>{loading ? 'Đang tìm...' : 'Tìm kiếm'}</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors">
              <FileDown className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Bảng lịch sử chấm công */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4">
            <h3 className="text-lg font-semibold text-[#111827]">Lịch sử chấm công {month}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#111827]">
              <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-xs font-medium">
                <tr>
                  <th className="px-4 py-3 text-center">Ngày</th>
                  <th className="px-4 py-3 text-center">Ca làm</th>
                  <th className="px-4 py-3 text-center">Giờ Check-in</th>
                  <th className="px-4 py-3 text-center">Giờ Check-out</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, idx) => {
                  let shiftName = 'Ca hành chính';
                  let color = 'bg-[#DCFCE7] text-[#15803D]'; // default
                  if (row.shift_id === '11111111-1111-1111-1111-111111111111') shiftName = 'Sáng (08:00–12:00)';
                  if (row.shift_id === '22222222-2222-2222-2222-222222222222') shiftName = 'Chiều (13:00–17:00)';

                  if (row.status === 'late') color = 'bg-[#FEF9C3] text-[#CA8A04]';
                  if (row.status === 'absent') color = 'bg-[#FEE2E2] text-[#B91C1C]';

                  return (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-[#F9FAFB]" : ""}>
                      <td className="px-4 py-3 text-center">{row.work_date}</td>
                      <td className="px-4 py-3 text-center">{shiftName}</td>
                      <td className="px-4 py-3 text-center">{row.check_in ? new Date(row.check_in).toLocaleTimeString() : '--'}</td>
                      <td className="px-4 py-3 text-center">{row.check_out ? new Date(row.check_out).toLocaleTimeString() : '--'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                          {row.status === 'present' ? 'Đúng giờ' : row.status === 'late' ? 'Đi muộn' : 'Vắng'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#4B5563]">{row.note || '-'}</td>
                    </tr>
                  );
                })}
                {history.length === 0 && <tr><td colSpan={6} className="text-center py-4">Không có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#2563EB]">{stats.totalDays}</div>
              <div className="text-base text-[#4B5563]">Tổng số ngày làm</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FEFCE8] rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#EAB308]">{stats.lateDays}</div>
              <div className="text-base text-[#4B5563]">Số ngày đi muộn</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#EF4444]">{stats.absentDays}</div>
              <div className="text-base text-[#4B5563]">Số ngày vắng</div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
