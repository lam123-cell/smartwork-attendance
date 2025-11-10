import EmployeeLayout from "@/layouts/EmployeeLayout";
import { Clock, MapPin, Timer, Calendar } from "lucide-react";

export default function EmployeeDashboard() {
  return (
    <EmployeeLayout title="Xin chào, Nguyễn Nhật Lâm 👋">
      <div className="p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Check-in Time */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#DBEAFE] rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-sm text-[#4B5563]">Giờ Check-in hôm nay</p>
                <p className="text-2xl font-bold text-[#2563EB]">08:14 AM</p>
              </div>
            </div>
          </div>

          {/* Check-out Time */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFEDD5] rounded-xl flex items-center justify-center">
                <MapPin className="w-[18px] h-5 text-[#F97316]" />
              </div>
              <div>
                <p className="text-sm text-[#4B5563]">Giờ Check-out</p>
                <p className="text-2xl font-bold text-[#9CA3AF]">Chưa Check-out</p>
              </div>
            </div>
          </div>

          {/* Total Hours */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#DCFCE7] rounded-xl flex items-center justify-center">
                <Timer className="w-[18px] h-5 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-sm text-[#4B5563]">Tổng giờ làm hôm nay</p>
                <p className="text-2xl font-bold text-[#16A34A]">7.5h</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F3E8FF] rounded-xl flex items-center justify-center">
                <Calendar className="w-[18px] h-5 text-[#A855F7]" />
              </div>
              <div>
                <p className="text-sm text-[#4B5563]">Trạng thái ca làm</p>
                <p className="text-2xl font-bold text-[#16A34A]">Đúng giờ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Hours Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-6">
              Tổng quan giờ làm trong tuần
            </h3>
            <div className="h-64 flex items-end justify-around gap-4 px-4">
              {[
                { day: "T2", hours: 7 },
                { day: "T3", hours: 7.5 },
                { day: "T4", hours: 7 },
                { day: "T5", hours: 8 },
                { day: "T6", hours: 7 },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-[#93C5FD] rounded-t-lg border border-white transition-all hover:bg-[#2563EB]" style={{ height: `${(item.hours / 10) * 100}%` }} />
                  <span className="mt-2 text-sm text-[#333333]">{item.day}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-[#666666]">
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10</span>
            </div>
          </div>

          {/* Reminder Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FEF9C3] rounded-xl flex items-center justify-center">
                <svg className="w-[14px] h-4 text-[#EAB308]" viewBox="0 0 14 16" fill="currentColor">
                  <path d="M6.99989 0C6.44676 0 5.99989 0.446875 5.99989 1V1.6C3.71864 2.0625 1.99989 4.08125 1.99989 6.5V7.0875C1.99989 8.55625 1.45927 9.975 0.484265 11.075L0.253015 11.3344C-0.00948489 11.6281 -0.0719849 12.05 0.0873901 12.4094C0.246765 12.7688 0.60614 13 0.99989 13H12.9999C13.3936 13 13.7499 12.7688 13.9124 12.4094C14.0749 12.05 14.0093 11.6281 13.7468 11.3344L13.5155 11.075C12.5405 9.975 11.9999 8.55937 11.9999 7.0875V6.5C11.9999 4.08125 10.2811 2.0625 7.99989 1.6V1C7.99989 0.446875 7.55301 0 6.99989 0ZM8.41551 15.4156C8.79051 15.0406 8.99989 14.5312 8.99989 14H6.99989H4.99989C4.99989 14.5312 5.20926 15.0406 5.58426 15.4156C5.95926 15.7906 6.46864 16 6.99989 16C7.53114 16 8.04051 15.7906 8.41551 15.4156Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#111827]">Nhắc nhở hôm nay</h3>
            </div>
            <p className="text-base text-[#4B5563] mb-4">
              Bạn chưa check-out. Hãy bấm nút Check-out trước 18:00 để hoàn tất ngày làm việc.
            </p>
            <button className="w-full bg-[#2563EB] text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Đi đến trang Chấm công
            </button>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#111827]">Hoạt động gần đây</h3>
            <button className="text-base font-medium text-[#2563EB] hover:underline">
              Xem chi tiết lịch sử
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-center py-3 text-base font-medium text-[#4B5563]">Ngày</th>
                  <th className="text-center py-3 text-base font-medium text-[#4B5563]">Giờ check-in</th>
                  <th className="text-center py-3 text-base font-medium text-[#4B5563]">Giờ check-out</th>
                  <th className="text-center py-3 text-base font-medium text-[#4B5563]">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "Hôm nay (25/11)", checkIn: "08:14 AM", checkOut: "-", status: "Đúng giờ", statusColor: "bg-[#DCFCE7] text-[#15803D]" },
                  { date: "24/11/2024", checkIn: "08:05 AM", checkOut: "17:30 PM", status: "Đúng giờ", statusColor: "bg-[#DCFCE7] text-[#15803D]" },
                  { date: "23/11/2024", checkIn: "08:25 AM", checkOut: "17:45 PM", status: "Đi muộn", statusColor: "bg-[#FEE2E2] text-[#B91C1C]" },
                  { date: "22/11/2024", checkIn: "08:10 AM", checkOut: "17:20 PM", status: "Đúng giờ", statusColor: "bg-[#DCFCE7] text-[#15803D]" },
                  { date: "21/11/2024", checkIn: "-", checkOut: "-", status: "Vắng", statusColor: "bg-[#F3F4F6] text-[#4B5563]" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-[#F3F4F6] last:border-0">
                    <td className="text-center py-4 text-base text-[#111827]">{row.date}</td>
                    <td className="text-center py-4 text-base text-[#111827]">{row.checkIn}</td>
                    <td className="text-center py-4 text-base text-[#9CA3AF]">{row.checkOut}</td>
                    <td className="text-center py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
