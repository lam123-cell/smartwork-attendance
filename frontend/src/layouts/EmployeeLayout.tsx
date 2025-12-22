import { Link, useLocation, useNavigate } from "react-router-dom";
import { Clock, Home, History, FileText, User, LogOut, AlertCircle, Menu, X } from "lucide-react";
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
  { path: "/leave", label: "Nghỉ phép", icon: AlertCircle },
  { path: "/personal-report", label: "Báo cáo cá nhân", icon: FileText },
  { path: "/employee-profile", label: "Hồ sơ cá nhân", icon: User },
];

export default function EmployeeLayout({ children, title, showUser = true, currentTime, subtitle }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div
        className={`fixed md:sticky md:top-0 w-60 h-screen bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col transition-all duration-300 z-[1200] ${
          isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-[105px] px-6 py-6 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Clock className="w-[14px] h-[14px] text-white" />
            </div>
            <div className="text-[#2563EB] font-bold text-[18px] leading-7">
              Smart<br />Attendance
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                    isActive(item.path)
                      ? "bg-[#EFF6FF] text-[#2563EB] border-l-4 border-[#2563EB] font-medium"
                      : "bg-transparent text-[#374151] hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
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
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[1100] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        {/* Header */}
        <header className="h-16 md:h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-[#111827] truncate">{title || "Lịch sử chấm công"}</h1>
              {subtitle && <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {currentTime && (
              <div className="text-sm md:text-[18px] font-semibold text-[#2563EB] tracking-tight hidden sm:block">
                {currentTime}
              </div>
            )}
            {showUser && (
              <>
                <img
                  src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=2563EB&color=fff`}
                  alt={user?.full_name || 'Profile'}
                  className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover"
                />
                <span className="text-sm md:text-base font-medium text-[#374151] hidden sm:inline">
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
