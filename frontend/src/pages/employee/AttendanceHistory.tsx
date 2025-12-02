import { useState, useEffect } from "react";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { CalendarDays, Clock, X, FileDown } from "lucide-react";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function AttendanceHistory() {
  // Mặc định: từ đầu tháng đến hôm nay
  const now = new Date();
  const defaultFrom = format(startOfMonth(now), 'yyyy-MM-dd');
  const defaultTo = format(now, 'yyyy-MM-dd');
  // month stores value in `yyyy-MM` to match option values
  const [month, setMonth] = useState<string>(format(now, 'yyyy-MM'));
  const [fromDate, setFromDate] = useState<string>(defaultFrom);
  const [toDate, setToDate] = useState<string>(defaultTo);
  const [status, setStatus] = useState("all");
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDays: 0, lateDays: 0, absentDays: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  // Tùy chọn tháng (3 tháng gần nhất)
  const monthOptions = Array.from({ length: 3 }).map((_, i) => {
    const d = subMonths(now, i);
    return { label: `Tháng ${format(d, 'M')} / ${format(d, 'yyyy')}`, value: format(d, 'yyyy-MM') };
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
        const offset = (page - 1) * pageSize;
        const res = await http.get<{ items: any[]; total?: number }>('/attendance/history/search', {
          params: { from_date: fromDate, to_date: toDate, status, limit: pageSize, offset }
        });
        // Cập nhật dữ liệu bảng và tổng số
        setHistory(res.data.items ?? []);
        setTotal(Number(res.data.total ?? 0));

      // Tính thống kê nhanh từ items trả về
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

  // Tự động fetch khi filter/page/pageSize thay đổi
  useEffect(() => {
    // khi filter thay đổi, reset về trang 1
    setPage(1);
  }, [fromDate, toDate, status]);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, status, page, pageSize]);

  const handleExportExcel = async () => {
    try {
      const res = await http.get<Blob>('/attendance/history/export', {
        params: { from_date: fromDate, to_date: toDate, status },
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
        {/* Bộ lọc*/}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <select 
                value={month}
                onChange={(e) => {
                  const val = e.target.value; // yyyy-MM
                  setMonth(val);
                  // set fromDate = first day of month, toDate = last day of month (or today if current month)
                  const [y, m] = val.split('-').map(Number);
                  const first = `${y}-${String(m).padStart(2, '0')}-01`;
                  const isCurrent = (y === now.getFullYear() && m === (now.getMonth() + 1));
                  const last = isCurrent ? defaultTo : format(endOfMonth(new Date(y, m - 1)), 'yyyy-MM-dd');
                  setFromDate(first);
                  setToDate(last);
                }}
              className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
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

          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6B7280]">Kích thước trang:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <button onClick={handleExportExcel} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <FileDown className="w-4 h-4" />
              <span>{loading ? 'Đang tải...' : 'Xuất Excel'}</span>
            </button>
          </div>
        </div>

        {/* Bảng lịch sử chấm công */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4">
            <h3 className="text-lg font-semibold text-[#111827]">Lịch sử chấm công {monthOptions.find(m => m.value === month)?.label ?? `Tháng ${format(now, 'M')} / ${format(now, 'yyyy')}`}</h3>
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
                  // Only one shift (Ca hành chính 08:00-17:00) is used in this app
                  const shiftName = 'Ca hành chính';
                  let color = 'bg-[#DCFCE7] text-[#15803D]'; // default
                  if (row.status === 'late') color = 'bg-[#FEF9C3] text-[#CA8A04]';
                  if (row.status === 'absent') color = 'bg-[#FEE2E2] text-[#B91C1C]';

                  return (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-[#F9FAFB]" : ""}>
                      <td className="px-4 py-3 text-center">{row.work_date ? new Date(row.work_date).toLocaleDateString('vi-VN') : '--'}</td>
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
                {history.length === 0 && !loading && <tr><td colSpan={6} className="text-center py-4">Không có dữ liệu</td></tr>}
                {loading && history.length === 0 && <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-end gap-3">
          {/** compute total pages based on total count returned by backend */}
          {/** total may be 0 so ensure at least 1 page show */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            return (
              <>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 border rounded ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>Trước</button>
                <div className="text-sm text-[#374151]">Trang {page} / {totalPages}</div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={`px-3 py-1 border rounded ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>Tiếp</button>
              </>
            );
          })()}
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
