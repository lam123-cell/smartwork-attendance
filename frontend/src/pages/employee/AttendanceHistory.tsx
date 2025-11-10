import EmployeeLayout from "@/layouts/EmployeeLayout";
import { CalendarDays, Clock, X, Search, FileDown } from "lucide-react";

export default function AttendanceHistory() {
  return (
    <EmployeeLayout title="Lịch sử chấm công">
      <div className="p-6 space-y-6">
        {/* Bộ lọc tìm kiếm */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <select className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              <option>Tháng 11 / 2025</option>
              <option>Tháng 10 / 2025</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#4B5563]">Từ ngày:</span>
              <input
                type="date"
                defaultValue="2025-11-01"
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#4B5563]">Đến ngày:</span>
              <input
                type="date"
                defaultValue="2025-11-30"
                className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <select className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              <option>Tất cả trạng thái</option>
              <option>Đúng giờ</option>
              <option>Đi muộn</option>
              <option>Vắng</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Search className="w-4 h-4" />
              <span>Tìm kiếm</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors">
              <FileDown className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Bảng lịch sử chấm công */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4">
            <h3 className="text-lg font-semibold text-[#111827]">
              Lịch sử chấm công tháng 11 / 2025
            </h3>
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
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  {
                    date: "04/11/2025",
                    shift: "Sáng (08:00–12:00)",
                    checkIn: "08:05",
                    checkOut: "12:01",
                    status: "Đúng giờ",
                    color: "bg-[#DCFCE7] text-[#15803D]",
                    note: "-",
                  },
                  {
                    date: "03/11/2025",
                    shift: "Chiều (13:00–17:00)",
                    checkIn: "13:15",
                    checkOut: "17:00",
                    status: "Đi muộn",
                    color: "bg-[#FEF9C3] text-[#CA8A04]",
                    note: "Giao thông",
                  },
                  {
                    date: "02/11/2025",
                    shift: "Sáng",
                    checkIn: "--",
                    checkOut: "--",
                    status: "Vắng",
                    color: "bg-[#FEE2E2] text-[#B91C1C]",
                    note: "Nghỉ phép",
                  },
                  {
                    date: "01/11/2025",
                    shift: "Sáng (08:00–12:00)",
                    checkIn: "07:58",
                    checkOut: "12:05",
                    status: "Đúng giờ",
                    color: "bg-[#DCFCE7] text-[#15803D]",
                    note: "-",
                  },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-[#F9FAFB]" : ""}>
                    <td className="px-4 py-3 text-center">{row.date}</td>
                    <td className="px-4 py-3 text-center">{row.shift}</td>
                    <td className="px-4 py-3 text-center">{row.checkIn}</td>
                    <td className="px-4 py-3 text-center">{row.checkOut}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${row.color}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#4B5563]">
                      {row.note}
                    </td>
                  </tr>
                ))}
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
              <div className="text-lg font-bold text-[#2563EB]">28</div>
              <div className="text-base text-[#4B5563]">Tổng số ngày làm</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FEFCE8] rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#EAB308]">2</div>
              <div className="text-base text-[#4B5563]">Số ngày đi muộn</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center">
              <X className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#EF4444]">1</div>
              <div className="text-base text-[#4B5563]">Số ngày vắng</div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
