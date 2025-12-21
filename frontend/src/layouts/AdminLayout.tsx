import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  User,
  LogOut,
  Clock,
  AlertCircle,
  Menu,
  X,
} from "lucide-react";
import { http } from '@/services/http';
import { toast } from '@/components/ui/use-toast';

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/employees", label: "Quản lý nhân viên", icon: Users },
  { path: "/attendance", label: "Quản lý chấm công", icon: Calendar },
  { path: "/leave-requests", label: "Quản lý nghỉ phép", icon: AlertCircle },
  { path: "/reports", label: "Báo cáo", icon: FileText },
  { path: "/settings", label: "Cài đặt hệ thống", icon: Settings },
  { path: "/profile", label: "Hồ sơ cá nhân", icon: User },
];

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AdminLayout({ title, subtitle, children }: AdminLayoutProps) {
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

  const handleLogout = async () => {
    try {
      await http.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('auth');
    sessionStorage.removeItem('auth');
    toast({ title: 'Đã đăng xuất thành công', variant: 'success' });
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40",
          "w-60 md:sticky md:top-0",
          isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-[105px] flex items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="text-lg font-bold text-gray-800 leading-tight">
              Smart
              <br />
              Attendance
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
        <nav className="flex-1 overflow-y-auto py-4 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
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
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="h-16 md:h-[93px] bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">{title}</h1>
              {subtitle && <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=2563EB&color=fff`}
                alt={user?.full_name || 'User'}
                className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover"
              />
              <span className="text-gray-700 font-medium text-sm md:text-base hidden sm:inline">{user?.full_name || 'Người dùng'}</span>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

