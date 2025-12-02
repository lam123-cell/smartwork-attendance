import { useState, useEffect } from "react";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { Clock, AlertTriangle, CheckCircle, Play } from "lucide-react";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function CheckIn() {
  const [currentTime, setCurrentTime] = useState("06:20:29");
  const [attendance, setAttendance] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ monthlyHours: number; lateDays: number; onTimeRate: string } | null>(null);
  const { toast } = useToast();
  const today = new Date();
  const formattedDate = format(today, 'EEEE, d MMMM yyyy', { locale: vi });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchToday();
    fetchStats();
  }, []);

  // Reusable fetch functions so handlers can refresh after actions
  const fetchToday = async () => {
    try {
      const res = await http.get<{ attendance: any }>('/attendance/today');
      setAttendance(res.data.attendance ?? null);
    } catch (err: any) {
      // ignore silently
    }
  };

  const fetchStats = async () => {
    try {
      const res = await http.get<{ monthlyHours: number; lateDays: number; onTimeRate: string }>('/attendance/stats');
      setStats(res.data ?? null);
    } catch (e) {
      // ignore
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
    const res = await http.post<{ attendance: any }>('/attendance/checkin', {});
    setAttendance(res.data.attendance);
    toast({ title: 'Check-in thành công', description: 'Bạn đã check-in thành công', duration: 4000 });
    // refresh stats and today's attendance
    await fetchStats();
    await fetchToday();
    } catch (err: any) {
      const msg = err?.message ?? (err?.message || JSON.stringify(err));
      toast({ title: 'Lỗi', description: msg, duration: 6000 , variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await http.post<{ attendance: any }>('/attendance/checkout', {});
      setAttendance(res.data.attendance);
      toast({ title: 'Check-out thành công', description: 'Bạn đã check-out', duration: 4000 });
      // refresh stats and today's attendance
      await fetchStats();
      await fetchToday();
    } catch (err: any) {
      const msg = err?.message ?? (err?.message || JSON.stringify(err));
      toast({ title: 'Lỗi', description: msg, duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployeeLayout title="Chấm công" subtitle="Trang chấm công cho nhân viên." currentTime={currentTime}>
      <div className="flex items-center justify-center min-h-full p-6">
        <div className="w-full max-w-4xl space-y-8">
          {/* Clock Display */}
          <div className="bg-white rounded-2xl border border-[#F3F4F6] shadow-sm p-12 flex flex-col items-center gap-4">
            <div className="text-[60px] font-bold text-[#2563EB] tracking-tight leading-none">
              {currentTime}
            </div>
            <div className="text-lg text-[#6B7280]">
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)} 
            </div>
          </div>

          {/* Check-in / Check-out Button */}
          <div className="flex flex-col items-center gap-4">
            {!attendance || !attendance.check_in ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className={`w-40 h-40 rounded-full shadow-lg transition-shadow flex flex-col items-center justify-center gap-1 group ${loading ? 'bg-gray-300' : 'bg-[#2563EB] hover:bg-blue-700'}`}>
                <Play className="w-[18px] h-6 text-white fill-white" />
                <span className="text-lg font-semibold text-white">{loading ? 'Đang...' : 'Check In'}</span>
              </button>
            ) : attendance && !attendance.check_out ? (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className={`w-40 h-40 rounded-full shadow-lg transition-shadow flex flex-col items-center justify-center gap-1 group ${loading ? 'bg-gray-300' : 'bg-[#EA580C] hover:bg-orange-600'}`}>
                <Play className="w-[18px] h-6 text-white fill-white rotate-90" />
                <span className="text-lg font-semibold text-white">{loading ? 'Đang...' : 'Check Out'}</span>
              </button>
            ) : (
              <div className="w-40 h-40 rounded-full shadow-lg flex items-center justify-center bg-green-600">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            )}
            <p className="text-base text-[#374151]">Nhấn để {attendance && attendance.check_in ? 'kết thúc ca' : 'bắt đầu ca'}</p>
          </div>

          {/* Thông tin hôm nay */}
          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
            <h3 className="text-xl font-semibold text-[#111827] mb-6">Thông tin hôm nay</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Ca làm:</span>
                  <span className="text-base font-medium text-[#111827]">
                    {attendance?.shift_name || 'Ca hành chính'}
                    {attendance?.shift_time && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({attendance.shift_time})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Giờ check-in:</span>
                  <span className="text-base font-medium text-[#111827]">{attendance?.check_in ? new Date(attendance.check_in).toLocaleTimeString() : '--'}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Giờ check-out:</span>
                  <span className="text-base font-medium text-[#111827]">{attendance?.check_out ? new Date(attendance.check_out).toLocaleTimeString() : '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Trạng thái:</span>                  <span className="text-base font-medium text-[#6B7280]">{attendance?.status ? attendance.status : '🔴 Chưa vào ca'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monthly Hours */}
            <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#111827]">{stats ? `${stats.monthlyHours}h` : '—'}</div>
                  <div className="text-sm text-[#6B7280]">Tổng giờ tháng này</div>
                </div>
              </div>
            </div>

            {/* Late Days */}
            <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFF7ED] rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#EA580C]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#111827]">{stats ? stats.lateDays : '—'}</div>
                  <div className="text-sm text-[#6B7280]">Số ngày đi muộn</div>
                </div>
              </div>
            </div>

            {/* On-time Percentage */}
            <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F0FDF4] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#111827]">{stats ? stats.onTimeRate : '—'}</div>
                  <div className="text-sm text-[#6B7280]">Tỷ lệ đúng giờ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
