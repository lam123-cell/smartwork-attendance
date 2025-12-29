import AdminLayout from "@/layouts/AdminLayout";
import { Save, Upload, Clock, Loader2 } from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";

export default function SystemSettings() {
  const { toast } = useToast();

  const [company, setCompany] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    logo: "",
  });

  const [workTime, setWorkTime] = useState({
    start: "08:00",
    end: "17:00",
    late: 15,
    early: 10,
    autoAlert: true, 
  });

  const [checkinPolicy, setCheckinPolicy] = useState({
    enforce: true,
    cutoff: "09:30",
  });

  const [gpsSettings, setGpsSettings] = useState({
    latitude: 0,
    longitude: 0,
    maxDistance: 200,
  });

  const [gpsCheckEnabled, setGpsCheckEnabled] = useState<boolean>(true);

  const [shiftId, setShiftId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchSettings = async () => {
    try {
      const [settingsRes, shiftRes] = await Promise.all([
        http.get<{ settings: any }>("/settings/settings"),
        http.get<{ shifts: any[] }>("/settings/shifts", { params: { activeOnly: false } }),
      ]);
      const s = settingsRes.data.settings;
      setCompany({
        name: s.company_name || "",
        email: s.company_email || "",
        address: s.company_address || "",
        phone: s.company_phone || "",
        logo: s.company_logo || "",
      });
      setGpsSettings({
        latitude: Number(s.gps_latitude ?? 0),
        longitude: Number(s.gps_longitude ?? 0),
        maxDistance: Number(s.max_distance_meters ?? 200),
      });
      setGpsCheckEnabled(Boolean(s.gps_check_enabled ?? true));
      setCheckinPolicy({
        enforce: s.checkin_enforce !== false,
        cutoff: s.checkin_cutoff_time || "09:30",
      });
      const firstShift = shiftRes.data.shifts?.[0];
      setShiftId(firstShift?.id || null);
      setWorkTime({
        start: firstShift?.start_time || "08:00",
        end: firstShift?.end_time || "17:00",
        late: firstShift?.late_threshold_minutes ?? 15,
        early: firstShift?.early_leave_minutes ?? 10,
        autoAlert: !!s.auto_alert_violation,
      });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Không tải được cài đặt", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizeTime = (t: string) => {
        if (!t) return t;
        const parts = String(t).split(":");
        const hh = parts[0].padStart(2, "0");
        const mm = (parts[1] ?? "00").padStart(2, "0");
        return `${hh}:${mm}`;
      };
      await http.put("/settings/settings", {
        company_name: company.name,
        company_email: company.email,
        company_phone: company.phone,
        company_address: company.address,
        company_logo: company.logo,
        gps_latitude: gpsSettings.latitude,
        gps_longitude: gpsSettings.longitude,
        max_distance_meters: gpsSettings.maxDistance,
        auto_alert_violation: workTime.autoAlert,
        gps_check_enabled: gpsCheckEnabled,
        checkin_cutoff_time: normalizeTime(checkinPolicy.cutoff),
        checkin_enforce: checkinPolicy.enforce,
        // optional GPS fields could be added later
      });

      if (shiftId) {
        await http.put(`/settings/shifts/${shiftId}`, {
          name: "Ca hành chính",
          start_time: normalizeTime(workTime.start),
          end_time: normalizeTime(workTime.end),
          late_threshold_minutes: workTime.late,
          early_leave_minutes: workTime.early,
          is_active: true,
        });
      } else {
        const created = await http.post<{ shift: any }>("/settings/shifts", {
          name: "Ca hành chính",
          start_time: normalizeTime(workTime.start),
          end_time: normalizeTime(workTime.end),
          late_threshold_minutes: workTime.late,
          early_leave_minutes: workTime.early,
          is_active: true,
        });
        setShiftId(created.data.shift?.id || null);
      }

      toast({ title: "Đã lưu", description: "Cập nhật cài đặt thành công", variant: "success" });
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message || "Lưu cài đặt thất bại", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Lỗi", description: "Vui lòng chọn file ảnh", variant: "destructive" });
      return;
    }
    const MAX = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX) {
      toast({ title: "Lỗi", description: "Ảnh quá lớn (tối đa 2MB)", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      try {
        setUploadingLogo(true);
        const res = await http.post<any>("/profile/avatar", { image: dataUrl });
        setCompany((prev) => ({ ...prev, logo: res.data?.url || dataUrl }));
        toast({ title: "Thành công", description: "Tải logo thành công", variant: "success" });
      } catch (err: any) {
        toast({ title: "Lỗi", description: "Không upload được logo", variant: "destructive" });
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <AdminLayout
      title="Cài đặt hệ thống"
      subtitle="Cấu hình chung cho hệ thống chấm công."
    >
      <div className="space-y-6 md:space-y-8">
        {/* Thông tin công ty */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 md:p-6 space-y-3 md:space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg md:text-base">Thông tin công ty</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên công ty
              </label>
              <input
                type="text"
                value={company.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCompany({ ...company, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                value={company.email}
                onChange={(e) =>
                  setCompany({ ...company, email: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={company.address}
                onChange={(e) =>
                  setCompany({ ...company, address: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={company.phone}
                onChange={(e) =>
                  setCompany({ ...company, phone: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo công ty
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <Upload className="w-4 h-4 text-gray-500" />}
                  <span>Chọn file</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt="Logo công ty"
                    className="h-10 w-10 object-contain border border-gray-200 rounded"
                  />
                ) : (
                  <span className="text-sm text-gray-600">Chưa có</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu thay đổi
            </button>
          </div>
        </div>

        {/* Cấu hình giờ làm việc */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 md:p-6 space-y-3 md:space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg md:text-base">Cấu hình giờ làm việc</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu làm việc
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  value={workTime.start}
                  onChange={(e) =>
                    setWorkTime({ ...workTime, start: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc làm việc
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  value={workTime.end}
                  onChange={(e) =>
                    setWorkTime({ ...workTime, end: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số phút cho phép đi muộn
              </label>
              <input
                type="number"
                value={workTime.late}
                onChange={(e) =>
                  setWorkTime({ ...workTime, late: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số phút cho phép về sớm
              </label>
              <input
                type="number"
                value={workTime.early}
                onChange={(e) =>
                  setWorkTime({ ...workTime, early: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Giới hạn giờ check-in */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ giới hạn check-in</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="time"
                    value={checkinPolicy.cutoff}
                    onChange={(e) => setCheckinPolicy({ ...checkinPolicy, cutoff: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-6 md:mt-7">
                <input
                  type="checkbox"
                  checked={checkinPolicy.enforce}
                  onChange={(e) => setCheckinPolicy({ ...checkinPolicy, enforce: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Bật giới hạn giờ check-in</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu cấu hình
            </button>
          </div>
        </div>

        {/* Cấu hình GPS chấm công */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 md:p-6 space-y-3 md:space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg md:text-base">Cấu hình GPS chấm công</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gpsCheckEnabled}
              onChange={(e) => setGpsCheckEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Bật kiểm tra GPS khi check-in/check-out</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vĩ độ công ty</label>
              <input
                type="number"
                step="0.000001"
                value={gpsSettings.latitude}
                onChange={(e) => setGpsSettings({ ...gpsSettings, latitude: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kinh độ công ty</label>
              <input
                type="number"
                step="0.000001"
                value={gpsSettings.longitude}
                onChange={(e) => setGpsSettings({ ...gpsSettings, longitude: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng cách tối đa (mét)</label>
              <input
                type="number"
                value={gpsSettings.maxDistance}
                onChange={(e) => setGpsSettings({ ...gpsSettings, maxDistance: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
