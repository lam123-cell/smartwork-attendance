import EmployeeLayout from "@/layouts/EmployeeLayout";
import { Download, Printer, Clock, AlertTriangle, X } from "lucide-react";

export default function Report() {
  return (
    <EmployeeLayout title="Báo cáo cá nhân">
      <div className="p-6 space-y-6">
        {/* Filters and Actions */}
        <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <select className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-base text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              <option>Tháng 11 / 2025</option>
            </select>
            <select className="px-3 py-2 border border-[#D1D5DB] rounded-lg text-base text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
              <option>Tất cả ca làm</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Tải báo cáo</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors">
              <Printer className="w-4 h-4" />
              <span>In báo cáo</span>
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Hours Chart */}
          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Số giờ làm việc mỗi ngày
            </h3>
            <div className="h-64 flex items-end justify-around gap-2">
              {[7, 7.5, 7, 8, 6.5, 7, 5.5].map((hours, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-[#2563EB] rounded-t border border-white hover:bg-[#1d4ed8] transition-colors"
                    style={{ height: `${(hours / 10) * 100}%` }}
                  />
                  <span className="mt-2 text-xs text-[#333333]">{idx === 0 ? "1" : idx === 1 ? "5" : idx === 2 ? "10" : idx === 3 ? "15" : idx === 4 ? "20" : idx === 5 ? "25" : "30"}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-[#666666]">Ngày</div>
          </div>

          {/* Attendance Pie Chart */}
          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">
              Tỷ lệ chấm công tháng này
            </h3>
            <div className="relative h-64 flex items-center justify-center">
              <svg className="w-64 h-64" viewBox="0 0 200 200">
                {/* Green slice - 80% */}
                <path
                  d="M100,100 L100,20 A80,80 0 1,1 36,64 Z"
                  fill="#16A34A"
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Yellow slice - 15% */}
                <path
                  d="M100,100 L36,64 A80,80 0 0,1 78,30 Z"
                  fill="#FACC15"
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Red slice - 5% */}
                <path
                  d="M100,100 L78,30 A80,80 0 0,1 100,20 Z"
                  fill="#DC2626"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
              <div className="absolute top-4 right-4 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#16A34A] rounded-sm" />
                  <span className="font-bold">Đúng giờ: 80.0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#FACC15] rounded-sm" />
                  <span className="font-bold">Đi muộn: 15.0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#DC2626] rounded-sm" />
                  <span className="font-bold">Vắng: 5.0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <div className="text-lg font-bold text-[#2563EB]">168 giờ</div>
                <div className="text-base text-[#4B5563]">Tổng giờ làm</div>
                <div className="text-sm text-[#6B7280]">Trung bình 7.2h/ngày</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FEFCE8] rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EAB308]" />
              </div>
              <div>
                <div className="text-lg font-bold text-[#EAB308]">3 ngày</div>
                <div className="text-base text-[#4B5563]">Số ngày đi muộn</div>
                <div className="text-sm text-[#6B7280]">Chiếm 10% tổng ca</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center">
                <X className="w-[15px] h-5 text-[#EF4444]" />
              </div>
              <div>
                <div className="text-lg font-bold text-[#EF4444]">1 ngày</div>
                <div className="text-base text-[#4B5563]">Số ngày vắng</div>
                <div className="text-sm text-[#6B7280]">Có phép</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary Table */}
        <div className="bg-white rounded-xl border border-[#F3F4F6] shadow-sm overflow-hidden">
          <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4">
            <h3 className="text-lg font-semibold text-[#111827]">
              Bảng tổng hợp chi tiết tháng
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider">Tuần</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider">Tổng giờ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider">Số ngày đúng giờ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider">Số ngày đi muộn</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider">Số ngày vắng</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E7EB]">
                {[
                  { week: "Tuần 1", hours: 40, onTime: 5, late: 1, absent: 0, rating: "Tốt", ratingColor: "bg-[#DCFCE7] text-[#166534]" },
                  { week: "Tuần 2", hours: 38, onTime: 4, late: 1, absent: 0, rating: "Khá", ratingColor: "bg-[#DBEAFE] text-[#1E40AF]" },
                  { week: "Tuần 3", hours: 42, onTime: 5, late: 0, absent: 0, rating: "Xuất sắc", ratingColor: "bg-[#DCFCE7] text-[#166534]" },
                  { week: "Tuần 4", hours: 36, onTime: 4, late: 1, absent: 1, rating: "Cần cải thiện", ratingColor: "bg-[#FEE2E2] text-[#991B1B]" },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-[#F9FAFB]" : ""}>
                    <td className="px-4 py-4 text-center text-sm font-medium text-[#111827]">{row.week}</td>
                    <td className="px-4 py-4 text-center text-sm text-[#111827]">{row.hours}</td>
                    <td className="px-4 py-4 text-center text-sm text-[#111827]">{row.onTime}</td>
                    <td className="px-4 py-4 text-center text-sm text-[#111827]">{row.late}</td>
                    <td className="px-4 py-4 text-center text-sm text-[#111827]">{row.absent}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${row.ratingColor}`}>
                        {row.rating}
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
          <button className="flex items-center gap-2 px-8 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 2C0 0.896875 0.896875 0 2 0H7V4C7 4.55312 7.44688 5 8 5H12V9.5H5.5C4.39687 9.5 3.5 10.3969 3.5 11.5V16H2C0.896875 16 0 15.1031 0 14V2ZM12 4H8V0L12 4Z" />
            </svg>
            <span>Xuất báo cáo chi tiết tháng này (PDF)</span>
          </button>
        </div>
      </div>
    </EmployeeLayout>
  );
}
