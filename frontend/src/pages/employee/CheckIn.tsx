import { useState, useEffect } from "react";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { Clock, AlertTriangle, CheckCircle, Play } from "lucide-react";

export default function CheckIn() {
  const [currentTime, setCurrentTime] = useState("06:20:29");

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
              Thứ Ba, 4 tháng 11, 2025
            </div>
          </div>

          {/* Check-in Button */}
          <div className="flex flex-col items-center gap-4">
            <button className="w-40 h-40 bg-[#2563EB] rounded-full shadow-lg hover:shadow-xl transition-shadow flex flex-col items-center justify-center gap-1 group hover:bg-blue-700">
              <Play className="w-[18px] h-6 text-white fill-white" />
              <span className="text-lg font-semibold text-white">Check In</span>
            </button>
            <p className="text-base text-[#374151]">Nhấn để bắt đầu ca làm việc</p>
          </div>

          {/* Today's Info */}
          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
            <h3 className="text-xl font-semibold text-[#111827] mb-6">Thông tin hôm nay</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Ca làm:</span>
                  <span className="text-base font-medium text-[#111827]">Sáng (08:00 – 12:00)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Giờ check-in:</span>
                  <span className="text-base font-medium text-[#111827]">--</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Giờ check-out:</span>
                  <span className="text-base font-medium text-[#111827]">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base text-[#4B5563]">Trạng thái:</span>
                  <span className="text-base font-medium text-[#6B7280]">🔴 Chưa vào ca</span>
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
                  <div className="text-2xl font-bold text-[#111827]">120h</div>
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
                  <div className="text-2xl font-bold text-[#111827]">2</div>
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
                  <div className="text-2xl font-bold text-[#111827]">94%</div>
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
