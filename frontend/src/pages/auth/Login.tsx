import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Mail, Lock, LogIn, Building2 } from "lucide-react";
import { http } from '@/services/http';
import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await http.post('/auth/login', { email, password });
      const data = res.data as any;

      // save token and user
      if (data?.accessToken && data?.user) {
        const auth = { token: data.accessToken, user: data.user };
        // respect "Remember me" checkbox: persist to localStorage if checked, otherwise sessionStorage
        if (rememberMe) {
          localStorage.setItem('auth', JSON.stringify(auth));
        } else {
          sessionStorage.setItem('auth', JSON.stringify(auth));
        }
        // set default header for subsequent requests
        (http.defaults as any).headers = (http.defaults as any).headers || {};
        (http.defaults as any).headers.common = (http.defaults as any).headers.common || {};
        (http.defaults as any).headers.common['Authorization'] = `Bearer ${data.accessToken}`;

        // redirect based on role
        if (data.user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/employee-dashboard');
        }
      } else {
        // fallback
        navigate('/dashboard');
      }
      toast({ title: data?.message || 'Đăng nhập thành công', variant: 'success' });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Đăng nhập thất bại';
      toast({ title: 'Lỗi đăng nhập', description: message, variant: 'destructive' });
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

      {/* Right Panel - Login Form */}
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
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
              Đăng nhập hệ thống
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email công ty của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[50px] pl-4 pr-10"
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[50px] pl-4 pr-10"
                    required
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Ghi nhớ tôi
                  </Label>
                </div>
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-blue-600 font-medium hover:underline">
                  Đăng ký
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
