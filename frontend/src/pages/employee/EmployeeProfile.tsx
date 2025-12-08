import EmployeeLayout from "@/layouts/EmployeeLayout";
import { Mail, Briefcase, Edit, KeyRound, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useRef } from 'react';
import { http } from '@/services/http';
import { useToast } from '@/hooks/use-toast';
import type { ProfileResponse, ActivitiesResponse, AvatarUploadResponse, Profile, Activity, Department, DepartmentsResponse } from '@/types/profile';
import type { UpdateProfileResponse, ChangePasswordResponse } from '@/types/profile';

export default function EmployeeProfile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await http.get<ProfileResponse>('/profile');
      setProfile(res.data?.user ?? null);
      setEditForm(res.data?.user ?? {});
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Không lấy được thông tin', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const fetchActivities = async () => {
    try {
      const res = await http.get<ActivitiesResponse>('/profile/activities', { params: { limit: 10 } });
      setActivities(res.data?.items || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => { fetchProfile(); fetchActivities(); }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast({ title: 'Lỗi', description: 'Vui lòng chọn file ảnh', variant: 'destructive' }); return; }
    const MAX = 2 * 1024 * 1024; // 2MB
    if (f.size > MAX) { toast({ title: 'Lỗi', description: 'Ảnh quá lớn (max 2MB)', variant: 'destructive' }); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      try {
        setUploading(true);
        const res = await http.post<AvatarUploadResponse>('/profile/avatar', { image: dataUrl });
        setProfile(res.data?.user || profile);
        
        // Cập nhật localStorage/sessionStorage cho avatar
        try {
          const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
          if (authData && res.data?.user) {
            const parsed = JSON.parse(authData);
            parsed.user = { ...parsed.user, ...res.data.user };
            if (localStorage.getItem('auth')) {
              localStorage.setItem('auth', JSON.stringify(parsed));
            } else {
              sessionStorage.setItem('auth', JSON.stringify(parsed));
            }
          }
        } catch (e) {
          // ignore
        }
        
        toast({ title: 'Thành công', description: 'Cập nhật ảnh đại diện thành công' });
        fetchActivities();
        
        // Reload để cập nhật header
        setTimeout(() => window.location.reload(), 500);
      } catch (err) {
        toast({ title: 'Lỗi', description: 'Không upload được ảnh', variant: 'destructive' });
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(f);
  };

  const handleOpenEdit = () => {
    setEditForm(profile || {});
    setShowEditModal(true);
  };

  // Danh sách phòng ban (id, name) -- id sẽ gửi về backend dưới field `department_id`
  const [departments, setDepartments] = useState<Department[]>([]);

  const fetchDepartments = async () => {
    try {
      const res = await http.get<DepartmentsResponse>('/departments');
      setDepartments(res.data?.items || []);
    } catch (err) {
      // ignore, keep select empty
    }
  };
  useEffect(() => { fetchDepartments(); }, []);

  const handleSubmitEdit = async () => {
  try {
    setLoading(true);

    const payload: any = {
      full_name: editForm.full_name?.trim(),
      phone: editForm.phone?.trim() || undefined,
      address: editForm.address?.trim() || undefined,
      date_of_birth: editForm.date_of_birth || undefined,
    };

    // Chỉ gửi position + department nếu chưa có (lần đầu)
    if (!profile?.position && editForm.position?.trim()) {
      payload.position = editForm.position.trim();
    }
    if (!profile?.department_name && editForm.department_id) {
      payload.department_id = editForm.department_id;
    }

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined && v !== '')
    );

    if (Object.keys(cleanPayload).length === 0) {
      toast({ title: 'Thông báo', description: 'Bạn chưa thay đổi gì' });
      return;
    }

    const res = await http.put<UpdateProfileResponse>('/profile', cleanPayload);
      if (res.data?.user) {
        setProfile(res.data.user);
        
        // Cập nhật localStorage/sessionStorage trước khi reload
        try {
          const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            parsed.user = { ...parsed.user, ...res.data.user };
            if (localStorage.getItem('auth')) {
              localStorage.setItem('auth', JSON.stringify(parsed));
            } else {
              sessionStorage.setItem('auth', JSON.stringify(parsed));
            }
          }
        } catch (e) {
          // ignore
        }
        
        toast({ title: 'Thành công', description: profile?.department_name ? 'Cập nhật thành công' : 'Hoàn thiện hồ sơ thành công!' });
        setShowEditModal(false);
        
        // Reload page để cập nhật header
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err?.response?.data?.message || 'Có lỗi xảy ra', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmNewPassword) { toast({ title: 'Lỗi', description: 'Mật khẩu mới không khớp', variant: 'destructive' }); return; }
    if ((pwForm.newPassword || '').length < 6) { toast({ title: 'Lỗi', description: 'Mật khẩu phải có ít nhất 6 ký tự', variant: 'destructive' }); return; }
    try {
      setLoading(true);
      const res = await http.post<ChangePasswordResponse>('/profile/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast({ title: res.data?.message || 'Đổi mật khẩu thành công' });
      setShowChangePassword(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err?.response?.data?.message || 'Không đổi được mật khẩu', variant: 'destructive' });
    } finally { setLoading(false); }
  };
  return (
      <EmployeeLayout title="Hồ sơ cá nhân" subtitle="Thông tin cá nhân nhân viên.">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thông tin cá nhân */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&w=400&q=80'}
                alt="Employee Avatar"
                className="w-48 h-48 rounded-full object-cover border-4 border-[#2563EB]"
              />
              <div className="absolute bottom-0 right-0">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border">
                  <input ref={fileRef} onChange={handleFileChange} type="file" accept="image/*" className="hidden" />
                  {uploading ? (
                    <svg className="w-4 h-4 text-[#2563EB] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg className="w-4 h-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </label>
              </div>
            </div>

            {/* Tên & chức vụ */}
            <div>
              <h2 className="text-xl font-semibold text-[#1F2937]">{profile?.full_name ?? '—'}</h2>
              <p className="text-[#6B7280] text-sm">{profile?.position ?? '—'}</p>
              <div className="flex items-center justify-center mt-1 gap-2 text-sm text-[#16A34A]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đang hoạt động</span>
              </div>
            </div>

            {/* Thông tin chi tiết */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm text-[#374151] mt-4">
              <div>
                <span className="font-medium text-[#6B7280]">Mã nhân viên:</span>
                <div className="font-semibold">{profile?.employee_code ?? '—'}</div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Ngày vào làm:</span>
                <div>{profile?.start_date ? new Date(profile.start_date).toLocaleDateString('vi-VN') : '—'}</div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Email:</span>
                <div className="flex items-center justify-center gap-1">
                  <Mail className="w-4 h-4 text-[#2563EB]" />
                  <span>{profile?.email ?? '—'}</span>
                </div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Số điện thoại:</span>
                <div>{profile?.phone ?? '—'}</div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Phòng ban:</span>
                <div className="flex items-center justify-center gap-1">
                  <Briefcase className="w-4 h-4 text-[#2563EB]" />
                  <span>{profile?.department_name ?? '—'}</span>
                </div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Địa chỉ:</span>
                <div>{profile?.address ?? '—'}</div>
              </div>
              <div>
                <span className="font-medium text-[#6B7280]">Ngày sinh:</span>
                <div>{profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : '—'}</div>
              </div>
            </div>

            {/* Nút hành động */}
              <div className="flex gap-4 mt-6">
              <button onClick={handleOpenEdit} disabled={loading} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium ${loading ? 'bg-[#93C5FD] text-white cursor-not-allowed' : 'bg-[#2563EB] text-white hover:bg-blue-700 transition-colors'}`}>
                <Edit className="w-4 h-4" />
                <span>Chỉnh sửa thông tin</span>
              </button>
              <button onClick={() => setShowChangePassword(true)} disabled={loading} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium ${loading ? 'border-[#93C5FD] text-[#93C5FD] cursor-not-allowed' : 'border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 transition-colors'}`}>
                <KeyRound className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </div>

          {/* Hoạt động gần đây */}
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h4 className="font-semibold mb-4">Hoạt động gần đây</h4>
            <div className="grid gap-3">
              {activities.length === 0 && <div className="text-sm text-[#9CA3AF]">Không có hoạt động</div>}
              {activities.map((it, idx) => (
                <div key={it.id ?? idx} className={`flex items-center gap-4 p-4 rounded-lg bg-white border`}>
                  <div className="flex-shrink-0">
                    <CheckCircle2 size={18} className="text-[#15803D]" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-[#111827]`}>{it.description || it.action || it.action_type}</p>
                    <p className="text-sm text-gray-500">{new Date(it.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====================== MODAL CHỈNH SỬA THÔNG TIN - PHIÊN BẢN THÔNG MINH ====================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Edit className="w-7 h-7" />
                  {profile?.department_name && profile?.position 
                    ? "Chỉnh sửa thông tin cá nhân" 
                    : "Hoàn thiện hồ sơ cá nhân"}
                </h3>
                <p className="text-blue-100 mt-1 text-sm opacity-90">
                  {profile?.department_name && profile?.position 
                    ? "Bạn chỉ có thể cập nhật thông tin cá nhân" 
                    : "Vui lòng chọn phòng ban và chức vụ để hoàn tất đăng ký"}
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <KeyRound className="w-7 h-7" />
                  Đổi mật khẩu
                </h3>
                <p className="text-emerald-100 mt-1 text-sm opacity-90">
                  Đảm bảo mật khẩu mới đủ mạnh và chưa từng sử dụng
                </p>
              </div>

              <div className="p-8 space-y-6">
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
                  onClick={handleSubmitChangePassword}
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
    </EmployeeLayout>
  );
}
