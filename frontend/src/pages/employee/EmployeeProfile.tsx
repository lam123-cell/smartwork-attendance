import EmployeeLayout from "@/layouts/EmployeeLayout";
import { Mail, Calendar, Briefcase, Edit, KeyRound, CheckCircle2, LogOut } from "lucide-react";


const activities = [
  {
    color: "bg-[#DCFCE7]",
    textColor: "text-[#15803D]",
    title: "Check in lúc 08:45",
    date: "04/11/2025",
    icon: <CheckCircle2 size={18} className="text-[#15803D]" />,
  },
  {
    color: "bg-[#DBEAFE]",
    textColor: "text-[#1E40AF]",
    title: "Check out lúc 17:02",
    date: "03/11/2025",
    icon: <LogOut size={18} className="text-[#1E40AF]" />,
  },
  {
    color: "bg-[#F3E8FF]",
    textColor: "text-[#6B21A8]",
    title: "Cập nhật mật khẩu",
    date: "02/11/2025",
    icon: <KeyRound size={18} className="text-[#6B21A8]" />,
  },
  {
    color: "bg-[#FEF3C7]",
    textColor: "text-[#B45309]",
    title: "Nộp yêu cầu nghỉ phép",
    date: "01/11/2025",
    icon: <Calendar size={18} className="text-[#B45309]" />,
  },
];

export default function EmployeeProfile() {
  return (
      <EmployeeLayout title="Hồ sơ cá nhân" subtitle="Thông tin cá nhân nhân viên.">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thông tin cá nhân */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&w=400&q=80"
                alt="Employee Avatar"
                className="w-48 h-48 rounded-full object-cover border-4 border-[#2563EB]"
              />
            </div>

            {/* Tên & chức vụ */}
            <div>
              <h2 className="text-xl font-semibold text-[#1F2937]">
                Nguyễn Nhật Lâm
              </h2>
              <p className="text-[#6B7280] text-sm">Frontend Developer</p>
              <div className="flex items-center justify-center mt-1 gap-2 text-sm text-[#16A34A]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đang hoạt động</span>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm text-[#374151] mt-4">
              <div>
                <span className="font-medium text-[#6B7280]">Mã nhân viên:</span>
                <div className="font-semibold">EMP00123</div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Ngày vào làm:</span>
                <div>12/06/2022</div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Email:</span>
                <div className="flex items-center justify-center gap-1">
                  <Mail className="w-4 h-4 text-[#2563EB]" />
                  <span>lam.nguyen@company.com</span>
                </div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Số ngày công tháng này:</span>
                <div>20</div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Phòng ban:</span>
                <div className="flex items-center justify-center gap-1">
                  <Briefcase className="w-4 h-4 text-[#2563EB]" />
                  <span>IT Department</span>
                </div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Tổng giờ làm:</span>
                <div>160h</div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-4 mt-6">
              <button className="flex items-center gap-2 px-5 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                <Edit className="w-4 h-4" />
                <span>Chỉnh sửa thông tin</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-2 border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
                <KeyRound className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </div>

          {/* Hoạt động gần đây */}
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h4 className="font-semibold mb-4">Hoạt động gần đây</h4>
              <div className="grid gap-3">
                {activities.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-lg ${item.color}`}
                  >
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className={`font-medium ${item.textColor}`}>{item.title}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
