import { useEffect, useState } from "react";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Download, Printer, Clock, AlertTriangle, X } from "lucide-react";
import { format, subMonths } from 'date-fns';
import { http } from '@/services/http';
import { useToast } from '@/hooks/use-toast';

export default function Report() {
  const now = new Date();
  const defaultMonth = format(now, 'yyyy-MM');
  const currentMonthValue = format(now, 'yyyy-MM');
  const [month, setMonth] = useState(defaultMonth);
  const [monthOptions] = useState(() => Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(now, i);
    return { label: `Tháng ${format(d, 'M')} / ${format(d, 'yyyy')}`, value: format(d, 'yyyy-MM') };
  }));

  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const { toast } = useToast();

  const isCurrentMonth = month === currentMonthValue;

  // Derived values for charts
  const workedDays = days.filter(d => (d.hours || 0) > 0).length;
  const lateDays = summary?.lateDays ?? 0;
  const absentDays = summary?.absentDays ?? 0;
  const onTimeCount = Math.max(0, workedDays - lateDays);
  const pieData = [
    { name: 'Đúng giờ', value: onTimeCount, fill: '#16A34A' },
    { name: 'Đi muộn', value: lateDays, fill: '#FACC15' },
    { name: 'Vắng', value: absentDays, fill: '#DC2626' },
  ].filter(d => d.value > 0);

  const fetchReport = async (m: string) => {
    setLoading(true);
    try {
      const res = await http.get<any>('/reports/personal', { params: { month: m } });
      setDays(res.data.days || []);
      setSummary(res.data.summary || null);
      setWeekly(res.data.weekly || []);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không lấy được báo cáo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(month); }, [month]);

  const handleExport = async () => {
    try {
      const res = await http.get<Blob>('/reports/personal/export', { params: { month }, responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không xuất được báo cáo', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    try {
      const title = `Báo cáo cá nhân - ${month}`;
      const monthLabel = month ? format(new Date(month + '-01'), 'MM/yyyy') : '';
      const style = `
        body{font-family: Arial, Helvetica, sans-serif; color:#111827; padding:20px}
        h1{font-size:18px}
        table{width:100%; border-collapse:collapse; margin-top:12px}
        th,td{border:1px solid #e5e7eb; padding:8px; text-align:center}
        th{background:#2563EB; color:#fff}
        .summary{margin-top:12px}
        .legend{display:flex; gap:12px; margin-top:8px}
        .legend div{display:flex; gap:8px; align-items:center}
      `;

      const rowsHtml = days.map(d => `
        <tr>
          <td>${d.date}</td>
          <td>${d.hours ? Number(d.hours).toFixed(1) : ''}</td>
          <td>${d.status === 'late' ? 'Đi muộn' : d.status === 'present' ? 'Đúng giờ' : 'Vắng'}</td>
          <td>${d.late_minutes || ''}</td>
          <td>${(d.note || '').replace(/\n/g, '<br/>')}</td>
        </tr>
      `).join('');

      const weeklyHtml = weekly.map(w => `
        <tr>
          <td style="text-align:left">${w.week}</td>
          <td>${Math.round(w.totalHours * 10) / 10}</td>
          <td>${w.onTime}</td>
          <td>${w.late}</td>
          <td>${w.absent}</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <head>
            <title>${title}</title>
            <style>${style}</style>
          </head>
          <body>
            <h1>Báo cáo cá nhân</h1>
            <div>Tháng: <strong>${monthLabel}</strong></div>

            <div class="summary">
              <div class="legend">
                <div><span style="width:12px;height:12px;background:#16A34A;display:inline-block"></span> Đúng giờ: <strong>${onTimeCount} ngày</strong></div>
                <div><span style="width:12px;height:12px;background:#FACC15;display:inline-block"></span> Đi muộn: <strong>${lateDays} ngày</strong></div>
                <div><span style="width:12px;height:12px;background:#DC2626;display:inline-block"></span> Vắng: <strong>${absentDays} ngày</strong></div>
              </div>
            </div>

            <h2 style="margin-top:18px;font-size:14px">Chi tiết ngày</h2>
            <table>
              <thead>
                <tr><th>Ngày</th><th>Giờ làm (h)</th><th>Trạng thái</th><th>Muộn (phút)</th><th>Ghi chú</th></tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <h2 style="margin-top:18px;font-size:14px">Tổng hợp tuần</h2>
            <table>
              <thead>
                <tr><th style="text-align:left">Tuần</th><th>Tổng giờ</th><th>Đúng giờ</th><th>Đi muộn</th><th>Vắng</th></tr>
              </thead>
              <tbody>
                ${weeklyHtml}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const w = window.open('', '_blank');
      if (!w) {
        toast({ title: 'Lỗi', description: 'Trình duyệt chặn popup. Vui lòng cho phép popup để in.', variant: 'destructive' });
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      // Give browser a moment to render
      setTimeout(() => {
        w.focus();
        w.print();
      }, 300);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không thể mở trang in', variant: 'destructive' });
    }
  };

  return (
    <EmployeeLayout
      title="Báo cáo cá nhân"
      subtitle="Báo cáo chi tiết cá nhân."
    >
      <div className="p-3 md:p-6 space-y-6">
        {/* Filters and Actions */}
        <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-3 md:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-4">
          <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-xs md:text-base text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB] flex-1 sm:flex-none">
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full sm:w-auto">
            <button onClick={handleExport} disabled={loading} className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm">
              <Download className="w-3 md:w-4 h-3 md:h-4" />
              <span>{loading ? 'Đang tải...' : 'Tải báo cáo'}</span>
            </button>
            <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2 border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors text-xs md:text-sm">
              <Printer className="w-3 md:w-4 h-3 md:h-4" />
              <span>In báo cáo</span>
            </button>
          </div>
        </div>

        {/* Charts - Đã sửa layout: Pie ở trên, Bar ở dưới */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biểu đồ tròn tỷ lệ chấm công - để bên trái, nhỏ gọn */}
          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6 lg:col-span-1">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Tỷ lệ chấm công tháng {month ? format(new Date(month + '-01'), 'M/yyyy') : ''}
            </h3>
            {isCurrentMonth ? (
              <div className="h-64 flex items-center justify-center text-center text-[#6B7280] px-4">
                Dữ liệu tổng hợp sẽ hiển thị khi kết thúc tháng. Bạn có thể xem biểu đồ giờ làm mỗi ngày bên dưới.
              </div>
            ) : summary ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name?: string) => {
                      const total = pieData.reduce((s, p) => s + p.value, 0);
                      const percent = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
                      return [`${value} ngày (${percent}%)`, name ?? ''];
                    }} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-[#111827]">
                      {summary ? `${onTimeCount} ngày` : '—'}
                    </text>
                    <text x="50%" y="65%" textAnchor="middle" className="text-sm fill-[#6B7280]">
                      Đúng giờ
                    </text>
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#16A34A] rounded-sm" />
                      <span>Đúng giờ</span>
                    </div>
                    <span className="font-medium">{onTimeCount} ngày</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#FACC15] rounded-sm" />
                      <span>Đi muộn</span>
                    </div>
                    <span className="font-medium">{lateDays} ngày</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#DC2626] rounded-sm" />
                      <span>Vắng mặt</span>
                    </div>
                    <span className="font-medium">{absentDays} ngày</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-[#9CA3AF]">Đang tải dữ liệu...</div>
            )}
          </div>

          {/* Biểu đồ cột giờ làm việc mỗi ngày - chuyển xuống dưới, full width */}
          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Số giờ làm việc mỗi ngày
            </h3>
            {days.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={days} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    label={{ value: 'Giờ làm việc', angle: -90, position: 'insideLeft' }}
                    domain={[0, 12]}
                  />
                  <Tooltip 
                    formatter={(value: number) => `${value} giờ`}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-[#9CA3AF]">Không có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {!isCurrentMonth && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#2563EB]">{summary ? `${summary.totalHours} giờ` : '—'}</div>
                    <div className="text-base text-[#4B5563]">Tổng giờ làm</div>
                    <div className="text-sm text-[#6B7280]">Trung bình {summary ? `${summary.avgHours}h` : '—'}/ngày</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FEFCE8] rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[#EAB308]" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#EAB308]">{summary ? `${summary.lateDays} ngày` : '—'}</div>
                    <div className="text-base text-[#4B5563]">Số ngày đi muộn</div>
                    <div className="text-sm text-[#6B7280]">{summary ? `${summary.onTimeRate}% đúng giờ` : '—'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center">
                    <X className="w-[15px] h-5 text-[#EF4444]" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#EF4444]">{summary ? `${summary.absentDays} ngày` : '—'}</div>
                    <div className="text-base text-[#4B5563]">Số ngày vắng</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Weekly Summary Table - Always visible */}
        <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm overflow-hidden">
          <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-3 md:px-6 py-3 md:py-4">
            <h3 className="text-base md:text-lg font-semibold text-[#111827]">
              Bảng tổng hợp {isCurrentMonth ? 'tuần (cập nhật theo tuần)' : 'chi tiết tháng'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tuần</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tổng giờ</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Đúng giờ</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Đi muộn</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Vắng</th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E7EB]">
                {weekly.map((row: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-[#F9FAFB]" : ""}>
                    <td className="px-2 md:px-4 py-2 md:py-4 text-center text-xs md:text-sm font-medium text-[#111827] whitespace-nowrap">{row.week}</td>
                    <td className="px-2 md:px-4 py-2 md:py-4 text-center text-xs md:text-sm text-[#111827] whitespace-nowrap">{Math.round(row.totalHours * 10) / 10}</td>
                    <td className="px-2 md:px-4 py-2 md:py-4 text-center text-xs md:text-sm text-[#111827] whitespace-nowrap">{row.onTime}</td>
                    <td className="px-2 md:px-4 py-2 md:py-4 text-center text-xs md:text-sm text-[#111827] whitespace-nowrap">{row.late}</td>
                    <td className="px-2 md:px-4 py-2 md:py-4 text-center text-xs md:text-sm text-[#111827] whitespace-nowrap">{row.absent}</td>
                    <td className="px-2 md:px-4 py-2 md:py-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${row.totalHours >= 40 ? 'bg-[#DCFCE7] text-[#166534]' : row.totalHours >= 36 ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                        {row.totalHours >= 40 ? 'Tốt' : row.totalHours >= 36 ? 'Khá' : 'Cần cải thiện'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <button onClick={handleExport} disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 2C0 0.896875 0.896875 0 2 0H7V4C7 4.55312 7.44688 5 8 5H12V9.5H5.5C4.39687 9.5 3.5 10.3969 3.5 11.5V16H2C0.896875 16 0 15.1031 0 14V2ZM12 4H8V0L12 4Z" />
            </svg>
            <span>{loading ? 'Đang xuất...' : 'Xuất báo cáo chi tiết tháng này (Excel)'}</span>
          </button>
        </div>
      </div>
    </EmployeeLayout>
  );
}
