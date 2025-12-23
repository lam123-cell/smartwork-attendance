import { Request, Response, NextFunction } from 'express';
import { getClient } from '../config/db';
import {
  createLeaveRequest,
  getLeaveRequestsByUser,
  getAllLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveTypes,
  createAttendanceForApprovedLeave,
} from '../repositories/leaveRequestRepository';
import { logActivity } from '../utils/logger';

// Nhân viên: Tạo đơn xin phép
export const submitLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id as string;
  const { startDate, endDate, leaveTypeId, reason } = req.body;

  try {
    // Validate
    if (!startDate || !endDate || !leaveTypeId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu' });
    }

    const leaveRequest = await createLeaveRequest(userId, startDate, endDate, leaveTypeId, reason || '');

    const formattedStartDate = new Date(startDate).toLocaleDateString('vi-VN');
    const formattedEndDate = new Date(endDate).toLocaleDateString('vi-VN');
    await logActivity(
      userId,
      'LEAVE_REQUEST_SUBMITTED',
      `Tạo đơn xin phép từ ${formattedStartDate} đến ${formattedEndDate}`,
      'leave_requests',
      leaveRequest.id,
      req.ip,
      req.get('user-agent')
    );

    res.status(201).json({ message: 'Gửi đơn xin phép thành công', leaveRequest });
  } catch (err: any) {
    next(err);
  }
};

// Nhân viên: Xem danh sách đơn xin phép của mình
export const getMyLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id as string;

  try {
    const leaveRequests = await getLeaveRequestsByUser(userId);
    res.json({ items: leaveRequests });
  } catch (err: any) {
    next(err);
  }
};

// Admin: Xem danh sách tất cả đơn xin phép
export const listAllLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
  const { status, userId: filteredUserId } = req.query;

  try {
    const leaveRequests = await getAllLeaveRequests(
      status as string,
      filteredUserId as string
    );
    res.json({ items: leaveRequests });
  } catch (err: any) {
    next(err);
  }
};

// Admin: Duyệt đơn xin phép
export const approveLeave = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const adminId = (req as any).user.id as string;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Lấy thông tin đơn xin phép
    const leaveReq = await getLeaveRequestById(id);
    if (!leaveReq) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Không tìm thấy đơn xin phép' });
    }

    if (leaveReq.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Đơn này đã được xử lý rồi' });
    }

    // Cập nhật status thành approved
    const updated = await approveLeaveRequest(id, adminId);

    // Tạo attendance cho từng ngày nghỉ phép
    await createAttendanceForApprovedLeave(
      client,
      leaveReq.user_id,
      leaveReq.start_date,
      leaveReq.end_date,
      leaveReq.leave_type_id
    );

    await client.query('COMMIT');

    // Ghi log
    const formattedStartDate = new Date(leaveReq.start_date).toLocaleDateString('vi-VN');
    const formattedEndDate = new Date(leaveReq.end_date).toLocaleDateString('vi-VN');
    await logActivity(
      adminId,
      'LEAVE_REQUEST_APPROVED',
      `Duyệt đơn xin phép của nhân viên ${leaveReq.full_name} từ ${formattedStartDate} đến ${formattedEndDate}`,
      'leave_requests',
      id,
      req.ip,
      req.get('user-agent')
    );

    res.json({ message: 'Duyệt đơn thành công', leaveRequest: updated });
  } catch (err: any) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// Admin: Từ chối đơn xin phép
export const rejectLeave = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { rejectedReason } = req.body;
  const adminId = (req as any).user.id as string;

  try {
    if (!rejectedReason) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
    }

    const leaveReq = await getLeaveRequestById(id);
    if (!leaveReq) {
      return res.status(404).json({ message: 'Không tìm thấy đơn xin phép' });
    }

    if (leaveReq.status !== 'pending') {
      return res.status(400).json({ message: 'Đơn này đã được xử lý rồi' });
    }

    const updated = await rejectLeaveRequest(id, rejectedReason);

    // Ghi log
    await logActivity(
      adminId,
      'LEAVE_REQUEST_REJECTED',
      `Từ chối đơn xin phép của nhân viên ${leaveReq.full_name}. Lý do: ${rejectedReason}`,
      'leave_requests',
      id,
      req.ip,
      req.get('user-agent')
    );

    res.json({ message: 'Từ chối đơn thành công', leaveRequest: updated });
  } catch (err: any) {
    next(err);
  }
};

// Lấy danh sách loại phép
export const getLeaveTypesList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaveTypes = await getLeaveTypes();
    res.json({ items: leaveTypes });
  } catch (err: any) {
    next(err);
  }
};
