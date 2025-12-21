import { useState, useEffect } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { Plus, AlertCircle, Eye, X } from 'lucide-react';
import { http } from '@/services/http';
import { useToast } from '@/hooks/use-toast';

interface LeaveType {
  id: number;
  name: string;
  is_paid: boolean;
  max_days_per_year?: number;
}

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type_id: number;
  leave_type_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason?: string;
  created_at: string;
}

export default function EmployeeLeave() {
  const { toast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveTypeId: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaveTypes();
    fetchMyLeaveRequests();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const res = await http.get<{ items: LeaveType[] }>('/leave-requests/types');
      setLeaveTypes(res.data?.items || []);
    } catch (err) {
      console.error('Lỗi tải loại phép:', err);
    }
  };

  const fetchMyLeaveRequests = async () => {
    try {
      const res = await http.get<{ items: LeaveRequest[] }>('/leave-requests/my-requests');
      setLeaveRequests(res.data?.items || []);
    } catch (err) {
      console.error('Lỗi tải đơn xin phép:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate || !formData.leaveTypeId) {
      toast({ title: 'Lỗi', description: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast({ title: 'Lỗi', description: 'Ngày kết thúc phải sau ngày bắt đầu', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await http.post('/leave-requests', {
        startDate: formData.startDate,
        endDate: formData.endDate,
        leaveTypeId: parseInt(formData.leaveTypeId),
        reason: formData.reason,
      });

      toast({ title: 'Thành công', description: 'Gửi đơn xin phép thành công' });
      setFormData({ startDate: '', endDate: '', leaveTypeId: '', reason: '' });
      setShowForm(false);
      fetchMyLeaveRequests();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Gửi đơn thất bại',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Chờ duyệt</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Đã duyệt</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Đã từ chối</span>;
      default:
        return null;
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <EmployeeLayout title="Quản lý nghỉ phép" subtitle="Tạo và theo dõi đơn xin nghỉ phép">
      <div className="p-3 md:p-6 space-y-4 md:space-y-8">
        {/* Form tạo đơn */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-3 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Tạo đơn xin phép</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5" />
              Tạo mới
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {/* Loại phép */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Loại phép <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.leaveTypeId}
                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                    className="w-full px-2 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm"
                  >
                    <option value="">-- Chọn loại phép --</option>
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-2 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm"
                  />
                </div>

                {/* Ngày kết thúc */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-2 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm"
                  />
                </div>

                {/* Lý do */}
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Lý do xin phép
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Nhập lý do xin phép (không bắt buộc)"
                    rows={3}
                    className="w-full px-2 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-xs md:text-sm"
                  />
                </div>

                {/* Tính năng hiển thị số ngày */}
                {formData.startDate && formData.endDate && (
                  <div className="md:col-span-2 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs md:text-sm text-gray-700">
                      <span className="font-semibold">Số ngày xin phép:</span>{' '}
                      <span className="text-blue-600 font-bold">{calculateDays(formData.startDate, formData.endDate)} ngày</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-end border-t border-gray-100 pt-4 md:pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition text-xs md:text-sm order-2 sm:order-1"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-xs md:text-sm order-1 sm:order-2"
                >
                  {loading ? 'Đang gửi...' : 'Gửi đơn'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Danh sách đơn xin phép */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 md:p-6 border-b border-gray-100">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Lịch sử đơn xin phép</h2>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="p-6 md:p-12 text-center">
              <AlertCircle className="w-8 md:w-12 h-8 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-xs md:text-sm text-gray-500">Bạn chưa có đơn xin phép nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Loại phép</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Từ ngày</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Đến ngày</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Số ngày</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Trạng thái</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-semibold text-gray-900 whitespace-nowrap">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-900 whitespace-nowrap">{req.leave_type_name}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-700 text-xs md:text-sm whitespace-nowrap">
                        {new Date(req.start_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-700 text-xs md:text-sm whitespace-nowrap">
                        {new Date(req.end_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-blue-600 text-xs md:text-sm whitespace-nowrap">
                        {calculateDays(req.start_date, req.end_date)}d
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-sm md:text-base whitespace-nowrap">{getStatusBadge(req.status)}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 min-w-max">
                        {req.status === 'rejected' && req.rejected_reason ? (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowDetailModal(true);
                            }}
                            className="px-3 md:px-4 py-2 md:py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-xs md:text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <Eye className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
                            <span>Xem lý do</span>
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm md:text-base">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal xem lý do từ chối */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-0">
          <div className="relative w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white flex justify-between items-center">
                <h3 className="text-2xl font-bold">Chi tiết từ chối</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-white hover:opacity-75 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">Loại phép</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRequest.leave_type_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium mb-1 md:mb-2">Từ ngày</p>
                    <p className="text-sm md:text-base text-gray-900 font-semibold">
                      {new Date(selectedRequest.start_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium mb-1 md:mb-2">Đến ngày</p>
                    <p className="text-sm md:text-base text-gray-900 font-semibold">
                      {new Date(selectedRequest.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-medium mb-1 md:mb-2">Lý do từ chối</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-4">
                    <p className="text-red-800 whitespace-pre-wrap text-xs md:text-sm">{selectedRequest.rejected_reason}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-3 md:px-8 py-2 md:py-5 flex justify-end border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors text-xs md:text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}
