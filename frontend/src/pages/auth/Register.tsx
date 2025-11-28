// src/pages/auth/Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Clock, Mail, Lock, User, Phone, Building2, ArrowLeft } from "lucide-react";
import { http } from '@/services/http';
import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Clear previous field errors
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setFieldErrors((s) => ({ ...s, password: 'Mật khẩu phải có ít nhất 6 ký tự' }));
      setError('Mật khẩu không hợp lệ');
      setLoading(false);
      return;
    }

    // Client-side validation: full_name (>=6, letters and spaces only), email, phone
    const newFieldErrors: Record<string, string> = {};
    const nameRegex = new RegExp('^[\\p{L} ]+$', 'u');
    if (!formData.full_name || formData.full_name.trim().length < 6 || !nameRegex.test(formData.full_name.trim())) {
      newFieldErrors.full_name = 'Họ tên ít nhất 6 ký tự, chỉ chữ và khoảng trắng';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      newFieldErrors.email = 'Email không đúng định dạng';
    }
    const phoneVal = (formData.phone || '').trim();
    if (phoneVal) {
      const phoneRegex = /^\+?\d{9,15}$/;
      if (!phoneRegex.test(phoneVal)) {
        newFieldErrors.phone = 'Số điện thoại không đúng (9-15 chữ số, có thể có +)';
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        phone: formData.phone || null,
      };

      const res = await http.post('/auth/register', payload);
      const data = res.data as any;

      // Thành công → hiển thị toast và chuyển sang login
      toast({ title: data?.message || 'Đăng ký thành công!', description: 'Bạn có thể đăng nhập ngay bây giờ.', variant: 'success' });
      navigate('/login');
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra, vui lòng thử lại';
      setError(message);
      toast({ title: 'Lỗi đăng ký', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-600 rounded-full opacity-10" />
        <div className="absolute top-40 right-40 w-24 h-24 bg-indigo-400 rounded-full opacity-10" />
        <div className="absolute bottom-48 left-16 w-20 h-20 bg-blue-300 rounded-full opacity-10" />
        <div className="absolute bottom-32 right-16 w-16 h-16 bg-blue-600 rounded-full opacity-10" />

        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-gray-700">TechCorp</span>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center w-full p-28">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/55dc1f683be7d158a915edf78d9682268e0aa338?width=896"
            alt="Attendance illustration"
            className="w-full max-w-md mb-8"
          />
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
            Hệ thống chấm công thông minh
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            Quản lý thời gian làm việc hiệu quả với công nghệ hiện đại và giao diện thân thiện
          </p>
        </div>
      </div>


      {/* Right Panel - Register Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Smart Attendance System</h1>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-2">
              Tạo tài khoản mới
            </h2>
            <p className="text-center text-sm text-gray-600 mb-8">
              Điền thông tin để đăng ký tài khoản nhân viên
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ và tên</Label>
                <div className="relative">
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="h-[50px] pl-4 pr-10"
                    required
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                    {fieldErrors.full_name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.full_name}</p>
                    )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email công ty</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ten@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-[50px] pl-4 pr-10"
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại (tùy chọn)</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-[50px] pl-4 pr-10"
                  />
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {fieldErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-[50px] pl-4 pr-10"
                    required
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-[50px] pl-4 pr-10"
                    required
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-70"
              >
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-blue-600 font-medium hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại đăng nhập
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-8">
            © 2025 Smart Attendance System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}