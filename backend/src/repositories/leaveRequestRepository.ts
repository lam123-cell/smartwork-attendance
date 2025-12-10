import { query, getClient } from '../config/db';
import { PoolClient } from 'pg';

export interface LeaveRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type_id: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  leave_type_name?: string;
  full_name?: string;
  employee_code?: string;
  approved_by_name?: string;
}

// Tạo đơn xin phép
export const createLeaveRequest = async (
  userId: string,
  startDate: string,
  endDate: string,
  leaveTypeId: number,
  reason: string
): Promise<LeaveRequest> => {
  const res = await query(
    `INSERT INTO leave_requests (user_id, start_date, end_date, leave_type_id, reason, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
     RETURNING *`,
    [userId, startDate, endDate, leaveTypeId, reason]
  );
  return res.rows[0];
};

// Lấy danh sách đơn xin phép của nhân viên
export const getLeaveRequestsByUser = async (userId: string): Promise<LeaveRequest[]> => {
  const res = await query(
    `SELECT lr.*, lt.name as leave_type_name, u.full_name as approved_by_name
     FROM leave_requests lr
     LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
     LEFT JOIN users u ON lr.approved_by = u.id
     WHERE lr.user_id = $1
     ORDER BY lr.created_at DESC`,
    [userId]
  );
  return res.rows;
};

// Lấy danh sách tất cả đơn xin phép (admin)
export const getAllLeaveRequests = async (
  status?: string,
  userId?: string
): Promise<LeaveRequest[]> => {
  let sql = `SELECT lr.*, lt.name as leave_type_name, usr.full_name, usr.employee_code, adm.full_name as approved_by_name
             FROM leave_requests lr
             LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
             LEFT JOIN users usr ON lr.user_id = usr.id
             LEFT JOIN users adm ON lr.approved_by = adm.id
             WHERE 1=1`;
  const params: any[] = [];

  if (status) {
    sql += ` AND lr.status = $${params.length + 1}`;
    params.push(status);
  }

  if (userId) {
    sql += ` AND lr.user_id = $${params.length + 1}`;
    params.push(userId);
  }

  sql += ` ORDER BY lr.created_at DESC`;

  const res = await query(sql, params);
  return res.rows;
};

// Lấy chi tiết một đơn xin phép
export const getLeaveRequestById = async (id: string): Promise<LeaveRequest> => {
  const res = await query(
    `SELECT lr.*, lt.name as leave_type_name, usr.full_name, usr.email
     FROM leave_requests lr
     LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
     LEFT JOIN users usr ON lr.user_id = usr.id
     WHERE lr.id = $1`,
    [id]
  );
  return res.rows[0];
};

// Duyệt đơn xin phép
export const approveLeaveRequest = async (
  id: string,
  approvedBy: string
): Promise<LeaveRequest> => {
  const res = await query(
    `UPDATE leave_requests 
     SET status = 'approved', approved_by = $1, approved_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [approvedBy, id]
  );
  return res.rows[0];
};

// Từ chối đơn xin phép
export const rejectLeaveRequest = async (
  id: string,
  rejectedReason: string
): Promise<LeaveRequest> => {
  const res = await query(
    `UPDATE leave_requests 
     SET status = 'rejected', rejected_reason = $1
     WHERE id = $2
     RETURNING *`,
    [rejectedReason, id]
  );
  return res.rows[0];
};

// Lấy danh sách loại phép
export const getLeaveTypes = async () => {
  const res = await query(`SELECT * FROM leave_types ORDER BY name`);
  return res.rows;
};

// Tạo các bản ghi attendance tự động khi duyệt phép
export const createAttendanceForApprovedLeave = async (
  client: PoolClient,
  userId: string,
  startDate: string,
  endDate: string,
  leaveTypeId: number
): Promise<void> => {
  // Lấy tên loại phép
  const leaveTypeRes = await client.query(`SELECT name FROM leave_types WHERE id = $1`, [leaveTypeId]);
  const leaveTypeName = leaveTypeRes.rows[0]?.name || 'Nghỉ phép';

  // Tạo attendance cho từng ngày từ startDate đến endDate
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);

    // Kiểm tra xem đã có attendance cho ngày này chưa
    const existing = await client.query(
      `SELECT id FROM attendance WHERE user_id = $1 AND work_date = $2`,
      [userId, dateStr]
    );

    if (!existing.rows[0]) {
      // Tạo attendance mới với status = 'on_leave'
      await client.query(
        `INSERT INTO attendance (user_id, work_date, status, note, created_at, updated_at)
         VALUES ($1, $2, 'on_leave', $3, NOW(), NOW())`,
        [userId, dateStr, `Nghỉ phép: ${leaveTypeName}`]
      );
    } else {
      // Cập nhật status thành on_leave nếu chưa check-in
      await client.query(
        `UPDATE attendance 
         SET status = 'on_leave', note = $1, updated_at = NOW()
         WHERE id = $2 AND check_in IS NULL`,
        [`Nghỉ phép: ${leaveTypeName}`, existing.rows[0].id]
      );
    }
  }
};
