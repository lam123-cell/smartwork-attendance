import { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { Camera, Save, Eye, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  return (
    <AdminLayout
      title="Hồ sơ cá nhân"
      subtitle="Trang hồ sơ cá nhân cho quản lý thông tin của tài khoản quản trị."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col items-center mb-8">
            {/* Profile Picture */}
            <div className="relative mb-4">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/ac1aac557bf82438b88efea8de46ffa65da13d7a?width=1012"
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-800">Nguyễn Nhật Lâm</h2>
            <p className="text-gray-600">Quản trị viên hệ thống</p>
          </div>

          {/* Form */}
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Họ và tên
              </Label>
              <Input
                id="name"
                type="text"
                defaultValue="Nguyễn Nhật Lâm"
                className="h-[50px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue="admin@smartattendance.com"
                className="h-[50px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                defaultValue="0123 456 789"
                className="h-[50px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                Phòng ban
              </Label>
              <Input
                id="department"
                type="text"
                defaultValue="Phòng Công nghệ thông tin"
                className="h-[50px]"
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Lưu thông tin
            </Button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Đổi mật khẩu</h3>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm font-medium text-gray-700">
                Mật khẩu hiện tại
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword.current ? "text" : "password"}
                  className="h-[50px] pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({ ...prev, current: !prev.current }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword.new ? "text" : "password"}
                  className="h-[50px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                Xác nhận mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword.confirm ? "text" : "password"}
                  className="h-[50px] pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
              <Key className="w-4 h-4 mr-2" />
              Cập nhật mật khẩu
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8">
        © 2025 Smart Attendance System
      </div>
    </AdminLayout>
  );
}
