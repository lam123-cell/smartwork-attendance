import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, UserPlus, Search, MoreVertical, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Camera, User, Briefcase, Shield} from "lucide-react";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";
import type { 
  Employee, 
  EmployeesResponse, 
  EmployeeStatsResponse, 
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  CreateEmployeeResponse,
  UpdateEmployeeResponse,
  ToggleStatusResponse,
  DeleteEmployeeResponse
} from "@/types/employee";
import type { Department, DepartmentsResponse } from "@/types/profile";

// Format date to DD/MM/YYYY
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
};

export default function EmployeeManagement() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, locked: 0 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'toggle' | 'delete', employee: Employee | null }>({ type: 'toggle', employee: null });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateEmployeeRequest | UpdateEmployeeRequest>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    department_id: "",
    position: "",
    role: "employee",
    employee_code: "",
    start_date: ""
  });
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [_uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 10;

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (departmentFilter !== "all") params.append("department_id", departmentFilter);
      
      const response = await http.get<EmployeesResponse>(`/employees?${params.toString()}`);
      setEmployees(response.data.items);
      setTotalEmployees(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data?.message || "Lỗi khi tải danh sách nhân viên", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await http.get<EmployeeStatsResponse>("/employees/stats");
      setStats(response.data);
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data?.message || "Lỗi khi tải thống kê", variant: "destructive" });
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await http.get<DepartmentsResponse>("/departments");
      setDepartments(response.data.items);
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data?.message || "Lỗi khi tải danh sách phòng ban", variant: "destructive" });
    }
  };

  // Create employee
  const handleCreateEmployee = async () => {
    try {
      const dataToSubmit = { ...formData, avatar_url: avatarUrl || undefined };
      const response = await http.post<CreateEmployeeResponse>("/employees", dataToSubmit);
      toast({ title: "Thành công", description: response.data.message || "Thêm nhân viên thành công", variant: "success" });
      setIsAddModalOpen(false);
      resetForm();
      fetchEmployees();
      fetchStats();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data?.message || "Lỗi khi thêm nhân viên", variant: "destructive" });
    }
  };

  // Update employee
  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      const dataToSubmit = { ...formData, avatar_url: avatarUrl || undefined };
      const response = await http.put<UpdateEmployeeResponse>(`/employees/${selectedEmployee.id}`, dataToSubmit);
      toast({ title: "Thành công", description: response.data.message || "Cập nhật thành công", variant: "success" });
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      resetForm();
      setAvatarUrl("");
      fetchEmployees();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data?.message || "Lỗi khi cập nhật nhân viên", variant: "destructive" });
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn file ảnh', variant: 'destructive' });
      return;
    }
    
    const MAX = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX) {
      toast({ title: 'Lỗi', description: 'Ảnh quá lớn (max 2MB)', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      try {
        setUploading(true);
        const res = await http.post<any>('/profile/avatar', { image: dataUrl });
        setAvatarUrl(res.data?.url || dataUrl);
        toast({ title: 'Thành công', description: 'Tải lên ảnh thành công', variant: 'success' });
      } catch (err: any) {
        toast({ title: 'Lỗi', description: 'Không upload được ảnh', variant: 'destructive' });
        setAvatarUrl("");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle employee status
  const handleToggleStatus = async () => {
    if (!confirmAction.employee) return;
    try {
      const response = await http.patch<ToggleStatusResponse>(`/employees/${confirmAction.employee.id}/toggle-status`);
      toast({ title: "Thành công", description: response.data.message || "Cập nhật trạng thái thành công", variant: "success" });
      setIsConfirmDialogOpen(false);
      setConfirmAction({ type: 'toggle', employee: null });
      fetchEmployees();
      fetchStats();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data?.message || "Lỗi khi cập nhật trạng thái", variant: "destructive" });
    }
  };

  // Delete employee
  const handleDeleteEmployee = async () => {
    if (!confirmAction.employee) return;
    try {
      const response = await http.delete<DeleteEmployeeResponse>(`/employees/${confirmAction.employee.id}`);
      toast({ title: "Thành công", description: response.data.message || "Xóa nhân viên thành công", variant: "success" });
      setIsConfirmDialogOpen(false);
      setConfirmAction({ type: 'delete', employee: null });
      fetchEmployees();
      fetchStats();
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.response?.data?.message || "Lỗi khi xóa nhân viên", variant: "destructive" });
    }
  };

  // Open edit modal
  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAvatarUrl(employee.avatar_url || "");
    setFormData({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone || "",
      address: employee.address || "",
      date_of_birth: employee.date_of_birth || "",
      department_id: employee.department_id || "",
      position: employee.position || "",
      role: employee.role,
      employee_code: employee.employee_code || "",
      start_date: employee.start_date || ""
    });
    setIsEditModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      date_of_birth: "",
      department_id: "",
      position: "",
      role: "employee",
      employee_code: "",
      start_date: ""
    });
    setAvatarUrl("");
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchQuery, statusFilter, departmentFilter]);

  useEffect(() => {
    fetchStats();
    fetchDepartments();
  }, []);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEmployees);

  return (
    <AdminLayout
      title="Quản lý nhân viên"
      subtitle="Trang quản lý danh sách nhân viên của công ty."
    >
      <div className="space-y-4 md:space-y-6">
        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-2 md:gap-4 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 md:w-5 h-4 md:h-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm theo tên nhân viên"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] h-10 text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="locked">Bị khóa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={(value: any) => {
              setDepartmentFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[170px] md:w-[220px] h-10 text-sm">
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 md:px-6 whitespace-nowrap flex-shrink-0 text-sm"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Thêm nhân viên</span>
            <span className="sm:hidden">Thêm</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
          {/* Tổng nhân viên */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 truncate">Tổng nhân viên</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 md:w-12 h-10 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Đang hoạt động */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 truncate">Đang hoạt động</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 md:w-12 h-10 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Đang bị khóa */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 truncate">Đang bị khóa</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.locked}</p>
              </div>
              <div className="w-10 md:w-12 h-10 md:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    Nhân viên
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    Phòng ban
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    Vị trí
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 md:px-6 py-4 md:py-8 text-center text-gray-500 text-sm">
                      Đang tải...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 md:px-6 py-4 md:py-8 text-center text-gray-500 text-sm">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 md:gap-3">
                          <img
                            src={employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name)}&background=2563EB&color=fff`}
                            alt={employee.full_name}
                            className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover"
                          />
                          <span className="text-xs md:text-sm font-medium text-gray-900 truncate">{employee.full_name}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className="text-xs md:text-sm text-gray-600 break-all">{employee.email}</span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className="text-xs md:text-sm text-gray-600">{employee.department_name || "—"}</span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span className="text-xs md:text-sm text-gray-600">{employee.position || "—"}</span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 md:px-3 py-1 text-xs font-medium rounded-full ${
                            employee.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {employee.is_active ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 md:h-8 w-7 md:w-8 p-0">
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedEmployee(employee);
                              setIsDetailModalOpen(true);
                            }}>
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(employee)}>
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setConfirmAction({ type: 'toggle', employee });
                              setIsConfirmDialogOpen(true);
                            }}>
                              {employee.is_active ? "Khóa tài khoản" : "Mở khóa"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setConfirmAction({ type: 'delete', employee });
                                setIsConfirmDialogOpen(true);
                              }}
                            >
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs md:text-sm">
            <div className="text-gray-600">
              Hiển thị {employees.length > 0 ? startIndex + 1 : 0}-{endIndex} trong tổng số {totalEmployees} nhân viên
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 md:h-8 w-7 md:w-8 p-0"
              >
                <ChevronLeft className="w-3 md:w-4 h-3 md:h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 md:h-8 w-7 md:w-8 p-0 text-xs ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ==================== MODAL THÊM & SỬA NHÂN VIÊN ==================== */}
        <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={isAddModalOpen ? setIsAddModalOpen : setIsEditModalOpen}>
          <DialogContent className="w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 mx-auto">
            {/* Header cố định */}
            <DialogHeader className="shrink-0 border-b bg-white px-4 md:px-8 py-4 md:py-6">
              <DialogTitle className="text-lg md:text-2xl font-bold">
                {isAddModalOpen ? "Thêm nhân viên mới" : "Chỉnh sửa nhân viên"}
              </DialogTitle>
            </DialogHeader>

            {/* Nội dung cuộn được */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6 md:mb-8">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-24 md:w-32 h-24 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                    <img
                      src={
                        avatarUrl ||
                        selectedEmployee?.avatar_url ||
                        (formData.full_name
                          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name)}&background=2563EB&color=fff&size=256`
                          : `https://ui-avatars.com/api/?name=NV&background=2563EB&color=fff&size=256`)
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Camera className="w-6 md:w-8 h-6 md:h-8 text-white" />
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="mt-2 md:mt-3 text-xs md:text-sm text-gray-500">Nhấp để tải lên ảnh đại diện</p>
              </div>

              <div className="space-y-6 md:space-y-8">
                {/* Thông tin cá nhân */}
                <section>
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-3 md:mb-5">
                    <User className="w-4 md:w-5 h-4 md:h-5 text-blue-600" />
                    Thông tin cá nhân
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="h-9 md:h-11 text-xs md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nv.a@company.com"
                        className="h-9 md:h-11 text-xs md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">Số điện thoại</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0123456789"
                        className="h-9 md:h-11 text-xs md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">Ngày sinh</label>
                      <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="h-9 md:h-11 text-xs md:text-sm" />
                    </div>
                  </div>
                  <div className="mt-3 md:mt-5 space-y-2">
                    <label className="text-xs md:text-sm font-medium text-gray-700">Địa chỉ</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Đường Láng, Đống Đa, Hà Nội"
                      className="h-9 md:h-11 text-xs md:text-sm"
                    />
                  </div>
                </section>

                <div className="border-t pt-6 md:pt-8" />

                <section>
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-3 md:mb-5">
                    <Briefcase className="w-4 md:w-5 h-4 md:h-5 text-blue-600" />
                    Thông tin công việc
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">Mã nhân viên</label>
                      <Input
                        value={formData.employee_code || ""}
                        onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                        placeholder="NV001"
                        className="h-9 md:h-11 text-xs md:text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">Ngày vào làm</label>
                      <Input type="date" value={formData.start_date || ""} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="h-9 md:h-11 text-xs md:text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">Phòng ban</label>
                      <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                        <SelectTrigger className="h-9 md:h-11 text-xs md:text-sm">
                          <SelectValue placeholder="Chọn phòng ban" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs md:text-sm font-medium text-gray-700">Chức vụ</label>
                      <Input
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="Nhân viên kinh doanh"
                        className="h-9 md:h-11 text-xs md:text-sm"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t pt-6 md:pt-8" />

                <section>
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-3 md:mb-5">
                    <Shield className="w-4 md:w-5 h-4 md:h-5 text-blue-600" />
                    Phân quyền hệ thống
                  </h3>
                  <div className="max-w-md">
                    <label className="text-xs md:text-sm font-medium text-gray-700">Vai trò</label>
                    <Select value={formData.role} onValueChange={(v: "employee" | "admin") => setFormData({ ...formData, role: v })}>
                      <SelectTrigger className="h-9 md:h-11 text-xs md:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Nhân viên</SelectItem>
                        <SelectItem value="admin">Quản trị viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer cố định */}
            <DialogFooter className="shrink-0 border-t bg-gray-50 px-4 md:px-8 py-3 md:py-5 flex flex-col sm:flex-row gap-2 md:gap-3">
              <Button variant="outline" onClick={() => isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false)} className="text-xs md:text-sm order-2 sm:order-1">
                Hủy bỏ
              </Button>
              <Button
                onClick={isAddModalOpen ? handleCreateEmployee : handleUpdateEmployee}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-8 text-xs md:text-sm order-1 sm:order-2"
              >
                {isAddModalOpen ? "Thêm nhân viên" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== XEM CHI TIẾT NHÂN VIÊN==================== */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl">
            {selectedEmployee && (
              <>
                {/* Header với ảnh bìa + avatar */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                  <div className="absolute -bottom-12 left-8">
                    <img
                      src={selectedEmployee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee.full_name)}&background=2563EB&color=fff&size=192`}
                      alt={selectedEmployee.full_name}
                      className="w-28 h-28 rounded-full border-8 border-white shadow-xl object-cover"
                    />
                  </div>
                </div>

                <div className="pt-16 px-8 pb-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.full_name}</h2>
                      <p className="text-lg text-gray-600 mt-1">{selectedEmployee.position || "Nhân viên"}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          selectedEmployee.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {selectedEmployee.is_active ? "Đang hoạt động" : "Bị khóa"}
                        </span>
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          selectedEmployee.role === 'admin' ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {selectedEmployee.role === 'admin' ? "Quản trị viên" : "Nhân viên"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mt-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{selectedEmployee.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Số điện thoại</p>
                        <p className="font-medium text-gray-900">{selectedEmployee.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phòng ban</p>
                        <p className="font-medium text-gray-900">{selectedEmployee.department_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mã nhân viên</p>
                        <p className="font-medium text-gray-900">{selectedEmployee.employee_code || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ngày sinh</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedEmployee.date_of_birth)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ngày vào làm</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedEmployee.start_date)}</p>
                      </div>
                    </div>

                    {selectedEmployee.address && (
                      <div>
                        <p className="text-sm text-gray-500">Địa chỉ</p>
                        <p className="font-medium text-gray-900">{selectedEmployee.address}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex gap-3">
                    <Button onClick={() => {
                      openEditModal(selectedEmployee);
                      setIsDetailModalOpen(false);
                    }} className="flex-1">
                      Chỉnh sửa
                    </Button>
                    <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                      Đóng
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Xác nhận hành động</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {confirmAction.type === 'toggle' ? (
                <p>Bạn có chắc chắn muốn {confirmAction.employee?.is_active ? 'khóa' : 'mở khóa'} tài khoản nhân viên <strong>{confirmAction.employee?.full_name}</strong>?</p>
              ) : (
                <p>Bạn có chắc chắn muốn xóa nhân viên <strong>{confirmAction.employee?.full_name}</strong>? Hành động này không thể hoàn tác.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsConfirmDialogOpen(false);
                setConfirmAction({ type: 'toggle', employee: null });
              }}>
                Hủy
              </Button>
              <Button 
                onClick={() => {
                  if (confirmAction.type === 'toggle') {
                    handleToggleStatus();
                  } else {
                    handleDeleteEmployee();
                  }
                }}
                className={confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
              >
                {confirmAction.type === 'toggle' ? 'Xác nhận' : 'Xóa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

