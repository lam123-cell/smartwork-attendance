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
} from "lucide-react";
import { http } from '@/services/http';
import { toast } from '@/components/ui/use-toast';

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/employees", label: "Quản lý nhân viên", icon: Users },
  { path: "/shifts", label: "Quản lý ca làm", icon: Calendar },
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-60 h-screen bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-[105px] flex items-center justify-center border-b border-gray-200 px-6">
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
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
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
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-60">
        {/* Header */}
        <header className="h-[93px] bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>

          <div className="flex-1 px-6">
            {/* placeholder to keep header spacing */}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar_url || 'https://api.builder.io/api/v1/image/assets/TEMP/72afa06532193de275849f30fedd2b876103a8bd?width=80'}
                alt={user?.full_name || 'User'}
                className="w-10 h-10 rounded-full"
              />
              <span className="text-gray-700 font-medium">{user?.full_name || 'Người dùng'}</span>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

