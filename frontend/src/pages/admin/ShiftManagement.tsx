import { useState } from "react";
import { Search, Plus, Edit2, Trash2, Link2, X } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";

export default function ShiftManagement() {
  const [shifts] = useState([
    {
      id: 1,
      name: "Ca sáng",
      start: "08:00",
      end: "12:00",
      total: "4 giờ",
      note: "Ca làm việc buổi sáng",
    },
    {
      id: 2,
      name: "Ca chiều",
      start: "13:00",
      end: "17:00",
      total: "4 giờ",
      note: "Ca làm việc buổi chiều",
    },
    {
      id: 3,
      name: "Ca tối",
      start: "18:00",
      end: "22:00",
      total: "4 giờ",
      note: "Ca làm việc buổi tối",
    },
  ]);

  const [assignments] = useState([
    { id: 1, name: "Nguyễn Văn A", shift: "Ca sáng (08:00–12:00)" },
    { id: 2, name: "Trần Thị B", shift: "Ca chiều (13:00–17:00)" },
  ]);

  return (
    <AdminLayout
      title="Quản lý ca làm"
      subtitle="Thiết lập và quản lý ca làm việc cho nhân viên."
    >
      <div className="space-y-8">
        {/* Search and sort */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center w-full sm:w-1/2 relative">
            <Search className="absolute left-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm ca làm..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option>Sắp xếp theo</option>
              <option>Tên ca</option>
              <option>Giờ bắt đầu</option>
              <option>Tổng giờ</option>
            </select>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> Thêm ca làm mới
            </button>
          </div>
        </div>

        {/* Danh sách ca làm hiện có */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Danh sách ca làm hiện có</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Tên ca</th>
                  <th className="px-6 py-3 text-left">Giờ bắt đầu</th>
                  <th className="px-6 py-3 text-left">Giờ kết thúc</th>
                  <th className="px-6 py-3 text-left">Tổng giờ</th>
                  <th className="px-6 py-3 text-left">Ghi chú</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{shift.name}</td>
                    <td className="px-6 py-3">{shift.start}</td>
                    <td className="px-6 py-3">{shift.end}</td>
                    <td className="px-6 py-3">{shift.total}</td>
                    <td className="px-6 py-3 text-gray-600">{shift.note}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phân công lịch làm việc */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Phân công lịch làm việc</h3>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <select className="flex-1 border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option>Chọn nhân viên...</option>
              <option>Nguyễn Văn A</option>
              <option>Trần Thị B</option>
            </select>
            <select className="flex-1 border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option>Chọn ca làm...</option>
              <option>Ca sáng (08:00–12:00)</option>
              <option>Ca chiều (13:00–17:00)</option>
              <option>Ca tối (18:00–22:00)</option>
            </select>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <Link2 className="w-4 h-4" /> Gán ca làm
            </button>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Danh sách phân công hiện tại</h4>
            <ul className="space-y-2">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300" />
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{a.name}</span> →{" "}
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {a.shift}
                      </span>
                    </p>
                  </div>
                  <button className="text-red-600 hover:text-red-800">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
