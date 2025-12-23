import { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Check, X, AlertCircle, Filter, Eye } from 'lucide-react';
import { http } from '@/services/http';
import { useToast } from '@/hooks/use-toast';

interface LeaveRequest {
  id: string;
  user_id: string;
  full_name: string;
  employee_code: string;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type_name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason?: string;
  created_at: string;
}

export default function AdminLeaveRequests() {
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, [filterStatus]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await http.get<{ items: LeaveRequest[] }>('/leave-requests/all', { params });
      setLeaveRequests(res.data?.items || []);
    } catch (err) {
      toast({ title: 'Lỗi', description: 'Lỗi tải danh sách đơn', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await http.post(`/leave-requests/${id}/approve`, {});
      toast({ title: 'Thành công', description: 'Duyệt đơn thành công' });
      fetchLeaveRequests();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Duyệt đơn thất bại',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId || !rejectReason.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập lý do từ chối', variant: 'destructive' });
      return;
    }

    try {
      await http.post(`/leave-requests/${selectedRequestId}/reject`, {
        rejectedReason: rejectReason,
      });
      toast({ title: 'Thành công', description: 'Từ chối đơn thành công' });
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequestId(null);
      fetchLeaveRequests();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err?.response?.data?.message || 'Từ chối đơn thất bại',
        variant: 'destructive',
      });
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

  const filteredRequests = filterStatus
    ? leaveRequests.filter((r) => r.status === filterStatus)
    : leaveRequests;

  return (
    <AdminLayout title="Quản lý nghỉ phép" subtitle="Xử lý các đơn xin nghỉ phép của nhân viên">
      <div className="p-3 md:p-6 space-y-6">
        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 md:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4">
            <Filter className="w-4 md:w-5 h-4 md:h-5 text-gray-600 flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm flex-1 sm:flex-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
        </div>

        {/* Danh sách */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 md:p-6 border-b border-gray-100">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Danh sách đơn xin phép</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Tổng: {filteredRequests.length} đơn</p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Không có đơn xin phép</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Nhân viên</th>
                    <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Loại phép</th>
                    <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Từ - Đến</th>
                    <th className="px-3 md:px-4 lg:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Số ngày</th>
                    <th className="px-3 md:px-4 lg:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Lý do</th>
                    <th className="px-3 md:px-4 lg:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Trạng thái</th>
                    <th className="px-3 md:px-4 lg:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-3 md:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{req.full_name}</div>
                        <div className="text-xs text-gray-600">{req.employee_code}</div>
                      </td>
                      <td className="px-3 md:px-4 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{req.leave_type_name}</td>
                      <td className="px-3 md:px-4 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(req.start_date).toLocaleDateString('vi-VN')} -{' '}
                        {new Date(req.end_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-3 md:px-4 lg:px-6 py-4 text-sm font-semibold text-blue-600 text-center whitespace-nowrap">
                        {calculateDays(req.start_date, req.end_date)} ngày
                      </td>
                      <td className="px-3 md:px-4 lg:px-6 py-4 text-sm text-gray-700 max-w-xs">
                        <div className="truncate" title={req.reason || '-'}>
                          {req.reason || '-'}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 lg:px-6 py-4 text-center whitespace-nowrap">{getStatusBadge(req.status)}</td>
                      <td className="px-3 md:px-4 lg:px-6 py-4 text-center whitespace-nowrap">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                              title="Duyệt"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setShowRejectModal(true);
                              }}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                              title="Từ chối"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : req.status === 'rejected' && req.rejected_reason ? (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowDetailModal(true);
                            }}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" />
                            Xem lý do
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
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

      {/* Modal từ chối */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
          <div className="relative w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 md:px-8 py-4 md:py-6 text-white">
                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                  <X className="w-5 md:w-7 h-5 md:h-7" />
                  Từ chối đơn xin phép
                </h3>
                <p className="text-red-100 mt-1 text-xs md:text-sm opacity-90">Vui lòng nhập lý do từ chối</p>
              </div>

              <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-8 py-5 flex justify-end gap-4 border-t">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRequestId(null);
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem lý do từ chối */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
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
                  <p className="text-sm text-gray-600 font-medium mb-2">Nhân viên</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRequest.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.employee_code}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">Loại phép</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedRequest.leave_type_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-2">Từ ngày</p>
                    <p className="text-gray-900 font-semibold">
                      {new Date(selectedRequest.start_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-2">Đến ngày</p>
                    <p className="text-gray-900 font-semibold">
                      {new Date(selectedRequest.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-medium mb-2">Lý do từ chối</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 whitespace-pre-wrap">{selectedRequest.rejected_reason}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-8 py-5 flex justify-end border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="px-6 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
