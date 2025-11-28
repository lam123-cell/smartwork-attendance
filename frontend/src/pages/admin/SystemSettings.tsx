import AdminLayout from "@/layouts/AdminLayout";
import { Save, Upload, Clock } from "lucide-react";
import { useState } from "react";

export default function SystemSettings() {
  const [company, setCompany] = useState({
    name: "Công ty TNHH ABC",
    email: "contact@abc.com",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    phone: "0123 456 789",
    logo: "logo.png",
  });

  const [workTime, setWorkTime] = useState({
    start: "08:00",
    end: "17:00",
    late: 15,
    early: 10,
    autoAlert: true,
  });

  return (
    <AdminLayout
      title="Cài đặt hệ thống"
      subtitle="Cấu hình chung cho hệ thống chấm công."
    >
      <div className="space-y-8">
        {/* Thông tin công ty */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Thông tin công ty</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên công ty
              </label>
              <input
                type="text"
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                value={company.email}
                onChange={(e) =>
                  setCompany({ ...company, email: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={company.address}
                onChange={(e) =>
                  setCompany({ ...company, address: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={company.phone}
                onChange={(e) =>
                  setCompany({ ...company, phone: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo công ty
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span>Chọn file</span>
                  <input type="file" className="hidden" />
                </label>
                <span className="text-sm text-gray-600">{company.logo}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Cấu hình giờ làm việc */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Cấu hình giờ làm việc</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu làm việc
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  value={workTime.start}
                  onChange={(e) =>
                    setWorkTime({ ...workTime, start: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc làm việc
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  value={workTime.end}
                  onChange={(e) =>
                    setWorkTime({ ...workTime, end: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số phút cho phép đi muộn
              </label>
              <input
                type="number"
                value={workTime.late}
                onChange={(e) =>
                  setWorkTime({ ...workTime, late: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số phút cho phép về sớm
              </label>
              <input
                type="number"
                value={workTime.early}
                onChange={(e) =>
                  setWorkTime({ ...workTime, early: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={workTime.autoAlert}
                onChange={(e) =>
                  setWorkTime({ ...workTime, autoAlert: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Tự động cảnh báo khi vi phạm thời gian
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
              <Save className="w-4 h-4" />
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
