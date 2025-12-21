import AdminLayout from "@/layouts/AdminLayout";
import { Mail, Briefcase, Edit, KeyRound, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";
import type {
  Activity,
  ActivitiesResponse,
  AvatarUploadResponse,
  ChangePasswordResponse,
  Department,
  DepartmentsResponse,
  Profile,
  ProfileResponse,
  UpdateProfileResponse,
} from "@/types/profile";

export default function AdminProfile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch dữ liệu
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await http.get<ProfileResponse>("/profile");
      const user = res.data?.user ?? null;
      setProfile(user);
      setEditForm(user ?? {});
    } catch (err) {
      toast({ title: "Lỗi", description: "Không thể tải thông tin", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await http.get<ActivitiesResponse>("/profile/activities", { params: { limit: 10 } });
      setActivities(res.data?.items || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchActivities();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await http.get<DepartmentsResponse>("/departments");
      setDepartments(res.data?.items || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Lỗi", description: "Chỉ chấp nhận file ảnh", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Ảnh tối đa 2MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        setUploading(true);
        const res = await http.post<AvatarUploadResponse>("/profile/avatar", { image: base64 });
        const updatedUser = res.data?.user;
        if (updatedUser) {
          setProfile(updatedUser);
          // Cập nhật localStorage/sessionStorage
          try {
            const authData = localStorage.getItem("auth") || sessionStorage.getItem("auth");
            if (authData) {
              const parsed = JSON.parse(authData);
              parsed.user = { ...parsed.user, ...updatedUser };
              if (localStorage.getItem("auth")) {
                localStorage.setItem("auth", JSON.stringify(parsed));
              } else {
                sessionStorage.setItem("auth", JSON.stringify(parsed));
              }
            }
          } catch (e) {
            // ignore
          }
          toast({ title: "Thành công", description: "Cập nhật ảnh đại diện thành công" });
          fetchActivities();
          setTimeout(() => location.reload(), 600);
        }
      } catch (err) {
        toast({ title: "Lỗi", description: "Upload ảnh thất bại", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Chỉnh sửa thông tin
  const handleSubmitEdit = async () => {
    try {
      setLoading(true);

      const payload: Partial<Profile> = {
        full_name: editForm.full_name?.trim(),
        phone: editForm.phone?.trim() || undefined,
        address: editForm.address?.trim() || undefined,
        date_of_birth: editForm.date_of_birth || undefined,
      };

      if (!profile?.position && editForm.position?.trim()) {
        payload.position = editForm.position.trim();
      }
      if (!profile?.department_name && editForm.department_id) {
        payload.department_id = editForm.department_id;
      }

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined && v !== "")
      );

      if (Object.keys(cleanPayload).length === 0) {
        toast({ title: "Thông báo", description: "Bạn chưa thay đổi gì" });
        return;
      }

      const res = await http.put<UpdateProfileResponse>("/profile", cleanPayload);
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setProfile(updatedUser);

        // Cập nhật auth storage
        try {
          const authData = localStorage.getItem("auth") || sessionStorage.getItem("auth");
          if (authData) {
            const parsed = JSON.parse(authData);
            parsed.user = { ...parsed.user, ...updatedUser };
            if (localStorage.getItem("auth")) {
              localStorage.setItem("auth", JSON.stringify(parsed));
            } else {
              sessionStorage.setItem("auth", JSON.stringify(parsed));
            }
          }
        } catch (e) {
          // ignore
        }

        toast({
          title: "Thành công",
          description: profile?.department_name ? "Cập nhật thông tin thành công" : "Hoàn thiện hồ sơ thành công!",
        });
        setShowEditModal(false);
        setTimeout(() => location.reload(), 600);
      }
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message || "Cập nhật thất bại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu mới không khớp", variant: "destructive" });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu ít nhất 6 ký tự", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      await http.post<ChangePasswordResponse>("/profile/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast({ title: "Thành công", description: "Đổi mật khẩu thành công" });
      setShowChangePassword(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message || "Đổi mật khẩu thất bại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Hồ sơ quản trị viên" subtitle="Quản lý thông tin tài khoản quản trị hệ thống.">
      <div className="p-3 md:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">

          {/* CARD THÔNG TIN CHÍNH */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header gradient xanh đậm */}
            <div className="h-40 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />

            <div className="relative px-10 pb-12 -mt-20">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={profile?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80"}
                    alt="Admin"
                    className="w-40 h-40 rounded-full object-cover border-8 border-white shadow-2xl"
                  />
                  <label className="absolute bottom-2 right-2 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileRef}
                      onChange={handleAvatarUpload}
                    />
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition">
                      {uploading ? (
                        <svg className="w-6 h-6 text-white animate-spin">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        </svg>
                      ) : (
                        <Edit className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </label>
                </div>

                <h1 className="mt-6 text-3xl font-bold text-gray-900">{profile?.full_name || "Quản trị viên"}</h1>
                <p className="text-xl text-blue-600 font-medium">{profile?.position || "Quản trị viên hệ thống"}</p>
                <div className="flex items-center gap-2 mt-3 text-green-600 font-semibold">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Đang hoạt động</span>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div className="grid grid-cols-2 gap-8 mt-10 text-sm">
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-blue-600 font-medium">Mã tài khoản</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">{profile?.employee_code || "—"}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-blue-600 font-medium">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-900">{profile?.email || "—"}</span>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-blue-600 font-medium">Số điện thoại</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">{profile?.phone || "—"}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-blue-600 font-medium">Phòng ban</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-blue-900">{profile?.department_name || "Quản trị"}</span>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-blue-600 font-medium">Ngày vào làm</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">
                    {profile?.start_date ? new Date(profile.start_date).toLocaleDateString("vi-VN") : "—"}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-blue-600 font-medium">Ngày sinh</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">
                    {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("vi-VN") : "—"}
                  </p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-center gap-6 mt-12">
                <button
                  onClick={() => {
                    setEditForm(profile || {});
                    setShowEditModal(true);
                  }}
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center gap-3"
                >
                  <Edit className="w-5 h-5" /> Chỉnh sửa thông tin
                </button>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition flex items-center gap-3"
                >
                  <KeyRound className="w-5 h-5" /> Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          {/* HOẠT ĐỘNG GẦN ĐÂY */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Hoạt động gần đây</h3>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Chưa có hoạt động nào</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id || act.created_at} className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{act.description || act.action || "Hoạt động"}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(act.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

        
      {/* ====================== MODAL CHỈNH SỬA THÔNG TIN ====================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-8 py-4 md:py-6 text-white">
                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                  <Edit className="w-5 md:w-7 h-5 md:h-7" />
                  {profile?.department_name && profile?.position 
                    ? "Chỉnh sửa thông tin cá nhân" 
                    : "Hoàn thiện hồ sơ cá nhân"}
                </h3>
                <p className="text-blue-100 mt-1 text-xs md:text-sm opacity-90">
                  {profile?.department_name && profile?.position 
                    ? "Bạn chỉ có thể cập nhật thông tin cá nhân" 
                    : "Vui lòng chọn phòng ban và chức vụ để hoàn tất đăng ký"}
                </p>
              </div>

              <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
                  {/* Họ và tên */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      value={editForm.full_name || ''}
                      onChange={e => setEditForm(s => ({ ...s, full_name: e.target.value }))}
                    />
                  </div>

                  {/* Email - chỉ hiển thị */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email công ty</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                      value={profile?.email || ''}
                      disabled
                    />
                  </div>

                  {/* Phòng ban - CHO PHÉP CHỌN NẾU CHƯA CÓ */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phòng ban {(!profile?.department_name) && <span className="text-red-500">*</span>}
                    </label>
                    {profile?.department_name ? (
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                        value={profile.department_name}
                        disabled
                      />
                    ) : (
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        value={editForm.department_id || ''}
                        onChange={e => setEditForm(s => ({ ...s, department_id: e.target.value }))}
                      >
                        <option value="">-- Chọn phòng ban --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    )}
                    {profile?.department_name && (
                      <p className="text-xs text-gray-500 mt-1.5">Phòng ban chỉ được thay đổi bởi Quản trị viên</p>
                    )}
                  </div>

                  {/* Chức vụ - CHO PHÉP NHẬP NẾU CHƯA CÓ */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Chức vụ {(!profile?.position) && <span className="text-red-500">*</span>}
                    </label>
                    {profile?.position ? (
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                        value={profile.position}
                        disabled
                      />
                    ) : (
                      <input
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        placeholder="VD: Lập trình viên, Nhân viên kinh doanh..."
                        value={editForm.position || ''}
                        onChange={e => setEditForm(s => ({ ...s, position: e.target.value }))}
                      />
                    )}
                    {profile?.position && (
                      <p className="text-xs text-gray-500 mt-1.5">Chức vụ chỉ được thay đổi bởi Quản trị viên</p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      value={editForm.phone || ''}
                      onChange={e => setEditForm(s => ({ ...s, phone: e.target.value }))}
                    />
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày sinh</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      value={(editForm.date_of_birth || '').split('T')[0]}
                      onChange={e => setEditForm(s => ({ ...s, date_of_birth: e.target.value }))}
                    />
                  </div>

                  {/* Địa chỉ - full width */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      value={editForm.address || ''}
                      onChange={e => setEditForm(s => ({ ...s, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-8 py-5 flex justify-end gap-4 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmitEdit}
                  disabled={loading || (!profile?.department_name && !editForm.department_id) || (!profile?.position && !editForm.position?.trim())}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>Đang lưu...</>
                  ) : (
                    <>{profile?.department_name && profile?.position ? "Lưu thay đổi" : "Hoàn thiện hồ sơ"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================== MODAL ĐỔI MẬT KHẨU ====================== */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
          <div className="relative w-full max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 md:px-8 py-4 md:py-6 text-white">
                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                  <KeyRound className="w-5 md:w-7 h-5 md:h-7" />
                  Đổi mật khẩu
                </h3>
                <p className="text-emerald-100 mt-1 text-xs md:text-sm opacity-90">
                  Đảm bảo mật khẩu mới đủ mạnh và chưa từng sử dụng
                </p>
              </div>

              <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(s => ({ ...s, currentPassword: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="Ít nhất 6 ký tự"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(s => ({ ...s, newPassword: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                      placeholder="Nhập lại mật khẩu mới"
                      value={pwForm.confirmNewPassword}
                      onChange={e => setPwForm(s => ({ ...s, confirmNewPassword: e.target.value }))}
                    />
                  </div>

                  {/* Hiển thị sức mạnh mật khẩu (tùy chọn nâng cao) */}
                  {pwForm.newPassword && (
                    <div className="text-sm">
                      <span className={`font-medium ${pwForm.newPassword.length >= 8 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        Độ mạnh: {pwForm.newPassword.length >= 12 ? 'Rất mạnh' : pwForm.newPassword.length >= 8 ? 'Mạnh' : 'Yếu'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-8 py-5 flex justify-end gap-4 border-t">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirmNewPassword}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Xác nhận đổi mật khẩu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}