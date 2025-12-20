import { useState, useEffect } from "react";
import { Search, Download, Eye, Calendar, Edit2 } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { http } from "@/services/http";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type AttendanceRecord = {
  id: string;
  user_id: string;
  employee_name?: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  late_minutes: number;
  total_hours: number | null;
  note: string | null;
};

export default function AttendanceManagement() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchQuery, dateFilter, statusFilter]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const res = await http.get<{ attendances: AttendanceRecord[] }>(
        "/attendance/admin/all?limit=1000"
      );
      
      setAttendanceRecords(res.data.attendances || []);
      toast({
        title: "Thành công",
        description: `Đã tải ${res.data.attendances?.length || 0} bản ghi`,
        duration: 3000,
      });
    } catch (err: any) {
      console.error(' Error fetching attendance:', err);
      const msg = err?.message || "Lỗi tải dữ liệu chấm công";
      toast({
        title: "Lỗi",
        description: msg,
        duration: 5000,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    // Filter by search query (employee name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.employee_name?.toLowerCase().includes(query) || false
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter((record) => {
        // work_date có format: "2025-12-02T17:00:00.000Z"
        // Lấy 10 ký tự đầu để được: "2025-12-02"
        const recordDate = record.work_date?.substring(0, 10);
        // dateFilter có format: "2025-12-03"
        return recordDate === dateFilter;
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  };

  const handleOpenEdit = (record: AttendanceRecord) => {

    // Convert UTC to Vietnam time for display in datetime-local input
    const convertUTCtoVietnamTimeString = (isoString: string | null) => {
      if (!isoString) return '';
      const utcDate = new Date(isoString);
      // Create a new date by adjusting for Vietnam timezone (UTC+7)
      const vietnamDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
      // Format as YYYY-MM-DDTHH:mm
      const result = vietnamDate.toISOString().slice(0, 16);
      return result;
    };

    setSelectedRecord(record);
    setEditFormData({
      check_in: convertUTCtoVietnamTimeString(record.check_in),
      check_out: convertUTCtoVietnamTimeString(record.check_out),
      status: record.status,
      late_minutes: record.late_minutes,
      total_hours: record.total_hours || '',
      note: record.note || '',
    });
    setShowEditModal(true);
  };

  // Helper: Calculate total hours from check_in and check_out
  const calculateTotalHours = (checkInStr: string, checkOutStr: string) => {
    if (!checkInStr || !checkOutStr) return 0;
    
    try {
      const checkIn = new Date(checkInStr + ':00');
      const checkOut = new Date(checkOutStr + ':00');
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.max(0, parseFloat(diffHours.toFixed(2)));
    } catch {
      return 0;
    }
  };

  // Helper: Calculate late minutes (if status is "late", calculate from check_in time)
  const calculateLateMinutes = (checkInStr: string, status: string) => {
    if (status !== 'late' || !checkInStr) return 0;
    
    try {
      // Assume work starts at 08:00 (8 AM)
      const checkIn = new Date(checkInStr + ':00');
      const workStart = new Date(checkIn);
      workStart.setHours(8, 0, 0, 0);
      
      const diffMs = checkIn.getTime() - workStart.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      return Math.max(0, Math.round(diffMinutes));
    } catch {
      return 0;
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;
    
    setEditLoading(true);
    try {
      const payload: any = { ...editFormData };
      
      // Convert from datetime-local (which represents Vietnam time) back to UTC
      const convertVietnamTimeToUTC = (datetimeLocalString: string) => {
        if (!datetimeLocalString) return null;
        
        // datetime-local format: "2025-12-03T10:13"
        // This represents Vietnam local time, so we need to:
        // 1. Parse it as UTC initially (to get the exact values)
        // 2. Then subtract 7 hours to get actual UTC
        
        const [datePart, timePart] = datetimeLocalString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');
        
        // Create UTC date with these values
        const vietnamDate = new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          0
        ));
        
        console.log('🇻🇳 Vietnam Date (as UTC):', vietnamDate.toISOString());
        
        // Now subtract 7 hours to get actual UTC
        const utcDate = new Date(vietnamDate.getTime() - (7 * 60 * 60 * 1000));
        return utcDate.toISOString();
      };
      
      // Convert datetime back to ISO string (UTC)
      if (payload.check_in) {
        payload.check_in = convertVietnamTimeToUTC(payload.check_in);
      } else {
        payload.check_in = null;
      }
      
      if (payload.check_out) {
        payload.check_out = convertVietnamTimeToUTC(payload.check_out);
      } else {
        payload.check_out = null;
      }

      // Convert total_hours to number
      if (payload.total_hours) {
        payload.total_hours = parseFloat(payload.total_hours);
      } else {
        payload.total_hours = null;
      }

      payload.late_minutes = parseInt(payload.late_minutes) || 0;

      const res = await http.put<{ attendance: AttendanceRecord }>(
        `/attendance/admin/${selectedRecord.id}`,
        payload
      );
      // Update local state
      setAttendanceRecords(attendanceRecords.map(r => 
        r.id === selectedRecord.id ? res.data.attendance : r
      ));

      setShowEditModal(false);
      toast({
        title: "Thành công",
        description: "Đã cập nhật chấm công",
        duration: 3000,
      });
    } catch (err: any) {
      const msg = err?.message || "Lỗi cập nhật chấm công";
      console.error(' Error saving:', err);
      toast({
        title: "Lỗi",
        description: msg,
        duration: 5000,
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('employee_name', searchQuery);
      if (dateFilter) params.append('work_date', dateFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await http.get<Blob>(`/attendance/admin/export${params.toString() ? '?' + params.toString() : ''}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement?.removeChild(link);
      toast({
        title: "Thành công",
        description: "Xuất file Excel thành công",
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: "Không thể xuất file Excel",
        duration: 5000,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Có mặt";
      case "late":
        return "Đi muộn";
      case "absent":
        return "Vắng";
      default:
        return status;
    }
  };

  return (
    <AdminLayout
      title="Quản lý chấm công"
      subtitle="Theo dõi và quản lý chấm công của nhân viên."
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 flex items-center relative">
                <Search className="absolute left-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên nhân viên"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="present">Có mặt</option>
                <option value="late">Đi muộn</option>
                <option value="absent">Vắng</option>
              </select>

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Tìm thấy {filteredRecords.length} bản ghi
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Danh sách chấm công</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Tên nhân viên</th>
                  <th className="px-6 py-3 text-left">Ngày</th>
                  <th className="px-6 py-3 text-left">Giờ check-in</th>
                  <th className="px-6 py-3 text-left">Giờ check-out</th>
                  <th className="px-6 py-3 text-left">Trạng thái</th>
                  <th className="px-6 py-3 text-left">Muộn (phút)</th>
                  <th className="px-6 py-3 text-left">Tổng giờ</th>
                  <th className="px-6 py-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="text-gray-500">Đang tải...</div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="text-gray-500">Không có dữ liệu chấm công</div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {record.employee_name || "N/A"}
                      </td>
                      <td className="px-6 py-3">
                        {record.work_date ? format(new Date(record.work_date), "dd/MM/yyyy") : "--"}
                      </td>
                      <td className="px-6 py-3">
                        {record.check_in
                          ? new Date(record.check_in).toLocaleTimeString("vi-VN")
                          : "--"}
                      </td>
                      <td className="px-6 py-3">
                        {record.check_out
                          ? new Date(record.check_out).toLocaleTimeString("vi-VN")
                          : "--"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {getStatusLabel(record.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {record.late_minutes > 0 ? `${record.late_minutes}` : "0"}
                      </td>
                      <td className="px-6 py-3">
                        {record.total_hours != null ? `${Number(record.total_hours).toFixed(1)}h` : "--"}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="text-green-600 hover:text-green-800"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Chi tiết chấm công</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRecord.employee_name} - {format(new Date(selectedRecord.work_date), "dd/MM/yyyy")}
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Check-in</span>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {selectedRecord.check_in
                        ? new Date(selectedRecord.check_in).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                        : "--"}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-600">Check-out</span>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {selectedRecord.check_out
                        ? new Date(selectedRecord.check_out).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                        : "--"}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-600">Trạng thái</span>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.status)}`}>
                        {getStatusLabel(selectedRecord.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-600">Đi muộn</span>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {selectedRecord.late_minutes > 0 ? `${selectedRecord.late_minutes} phút` : "0 phút"}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-600">Tổng giờ làm</span>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {selectedRecord.total_hours != null
                        ? `${Number(selectedRecord.total_hours).toFixed(1)} giờ`
                        : "--"}
                    </p>
                  </div>

                  {selectedRecord.note && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ghi chú</span>
                      <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedRecord.note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa chấm công</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRecord.employee_name} - {format(new Date(selectedRecord.work_date), "dd/MM/yyyy")}
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in</label>
                    <input
                      type="datetime-local"
                      value={editFormData.check_in || ""}
                      onChange={(e) => {
                        const newCheckIn = e.target.value;
                        const totalHours = calculateTotalHours(newCheckIn, editFormData.check_out);
                        const lateMinutes = calculateLateMinutes(newCheckIn, editFormData.status);
                        setEditFormData({
                          ...editFormData,
                          check_in: newCheckIn,
                          total_hours: totalHours,
                          late_minutes: lateMinutes,
                        });
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-out</label>
                    <input
                      type="datetime-local"
                      value={editFormData.check_out || ""}
                      onChange={(e) => {
                        const newCheckOut = e.target.value;
                        const totalHours = calculateTotalHours(editFormData.check_in, newCheckOut);
                        setEditFormData({
                          ...editFormData,
                          check_out: newCheckOut,
                          total_hours: totalHours,
                        });
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                  <select
                    value={editFormData.status || "present"}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      const lateMinutes = calculateLateMinutes(editFormData.check_in, newStatus);
                      setEditFormData({
                        ...editFormData,
                        status: newStatus,
                        late_minutes: lateMinutes,
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="present">Đúng giờ</option>
                    <option value="late">Đi muộn</option>
                    <option value="absent">Vắng mặt</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Đi muộn (phút)</label>
                    <input
                      type="number"
                      value={editFormData.late_minutes || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, late_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tổng giờ làm</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.total_hours || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, total_hours: parseFloat(e.target.value) || "" })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                  <textarea
                    value={editFormData.note || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Nhập ghi chú (nếu có)..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition font-medium disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
