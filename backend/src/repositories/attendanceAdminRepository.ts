import { query } from '../config/db';

// Định nghĩa kiểu dữ liệu cho bản ghi chấm công kèm thông tin nhân viên
export type AttendanceRecord = {
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
  created_at?: string;
  updated_at?: string;
};

// Lấy tất cả bản ghi chấm công với thông tin nhân viên
export const getAllAttendanceWithEmployee = async (limit = 1000, offset = 0) => {
  const res = await query(
    `SELECT 
      a.id,
      a.user_id,
      u.full_name as employee_name,
      a.work_date::text as work_date,
      a.check_in,
      a.check_out,
      a.status,
      a.late_minutes,
      a.total_hours,
      a.note,
      a.created_at,
      a.updated_at
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.work_date DESC, a.created_at DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

// Lấy số bản ghi chấm công
export const countAllAttendance = async () => {
  const res = await query('SELECT COUNT(*) AS cnt FROM attendance');
  return Number(res.rows[0]?.cnt ?? 0);
};

// Tìm kiếm chấm công với bộ lọc cho admin
export const searchAttendanceAdmin = async (
  employeeName?: string,
  workDate?: string,
  status?: string,
  limit = 1000,
  offset = 0
) => {
  let sql = `SELECT 
    a.id,
    a.user_id,
    u.full_name as employee_name,
    a.work_date::text as work_date,
    a.check_in,
    a.check_out,
    a.status,
    a.late_minutes,
    a.total_hours,
    a.note,
    a.created_at,
    a.updated_at
  FROM attendance a
  JOIN users u ON a.user_id = u.id
  WHERE 1=1`;
  
  const params: any[] = [];
  let idx = 1;

  if (employeeName) {
    sql += ` AND u.full_name ILIKE $${idx}`;
    params.push(`%${employeeName}%`);
    idx++;
  }

  if (workDate) {
    sql += ` AND a.work_date::text LIKE $${idx}`;
    params.push(`${workDate}%`);
    idx++;
  }

  if (status && status !== 'all') {
    sql += ` AND a.status = $${idx}`;
    params.push(status);
    idx++;
  }

  sql += ` ORDER BY a.work_date DESC, a.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, offset);

  const res = await query(sql, params);
  return res.rows;
};

// Cập nhật bản ghi chấm công (admin)
export const updateAttendanceRecord = async (
  id: string,
  data: {
    check_in?: string | null;
    check_out?: string | null;
    status?: string;
    late_minutes?: number;
    total_hours?: number | null;
    note?: string | null;
  }
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.check_in !== undefined) {
    fields.push(`check_in = $${idx}`);
    values.push(data.check_in ?? null);
    idx++;
  }
  if (data.check_out !== undefined) {
    fields.push(`check_out = $${idx}`);
    values.push(data.check_out ?? null);
    idx++;
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx}`);
    values.push(data.status);
    idx++;
  }
  if (data.late_minutes !== undefined) {
    fields.push(`late_minutes = $${idx}`);
    values.push(data.late_minutes ?? 0);
    idx++;
  }
  if (data.total_hours !== undefined) {
    fields.push(`total_hours = $${idx}`);
    values.push(data.total_hours ?? null);
    idx++;
  }
  if (data.note !== undefined) {
    fields.push(`note = $${idx}`);
    values.push(data.note ?? null);
    idx++;
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  const sql = `UPDATE attendance SET ${fields.join(', ')} WHERE id = $${idx} RETURNING 
    id, user_id, work_date, check_in, check_out, status, late_minutes, total_hours, note, created_at, updated_at`;
  values.push(id);

  const res = await query(sql, values);
  
  if (!res.rows[0]) return null;

  // Join with user to get employee name
  const userRes = await query('SELECT full_name FROM users WHERE id = $1', [res.rows[0].user_id]);
  return {
    ...res.rows[0],
    employee_name: userRes.rows[0]?.full_name || 'N/A',
  };
};
