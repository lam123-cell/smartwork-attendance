import { Link, useLocation, useNavigate } from "react-router-dom";
import { Clock, Home, History, FileText, User, LogOut } from "lucide-react";
import { useEffect, useState } from 'react';
import { http } from '@/services/http';
import { toast } from '@/components/ui/use-toast';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showUser?: boolean;
  currentTime?: string;
  subtitle?: string;
}

const menuItems = [
  { path: "/employee-dashboard", label: "Trang chủ", icon: Home },
  { path: "/checkin", label: "Chấm công", icon: Clock },
  { path: "/history", label: "Lịch sử chấm công", icon: History },
  { path: "/personal-report", label: "Báo cáo cá nhân", icon: FileText },
  { path: "/employee-profile", label: "Hồ sơ cá nhân", icon: User },
];

export default function EmployeeLayout({ children, title, showUser = true, currentTime, subtitle }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

  const isActive = (path: string) => location.pathname === path;


  const handleLogout = async () => {
    try {
      await http.post('/auth/logout');
    } catch (e) {
      // ignore error
    }
    localStorage.removeItem('auth');
    sessionStorage.removeItem('auth');
    toast({ title: 'Đã đăng xuất thành công', variant: 'success' });
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <div className="w-60 bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col">
        {/* Logo */}
        <div className="h-[105px] px-6 py-6 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
            <Clock className="w-[14px] h-[14px] text-white" />
          </div>
          <div className="text-[#2563EB] font-bold text-[18px] leading-7">
            Smart<br />Attendance
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] font-medium"
                      : "bg-transparent text-[#374151] hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-base">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">{title || "Lịch sử chấm công"}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {currentTime && (
              <div className="text-[18px] font-semibold text-[#2563EB] tracking-tight">
                {currentTime}
              </div>
            )}
            {showUser && (
              <>
                <img
                  src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=2563EB&color=fff`}
                  alt={user?.full_name || 'Profile'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-base font-medium text-[#374151]">
                  {user?.full_name || 'Người dùng'}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
