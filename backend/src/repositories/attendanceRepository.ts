import { query, getClient } from '../config/db';

// Định nghĩa kiểu dữ liệu cho một hàng (row) chấm công trong DB
export type AttendanceRow = {
  id: string;
  user_id: string;
  shift_id?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  total_hours?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  location_address?: string | null;
  status?: string | null;
  work_date?: string | null;
  late_minutes?: number | null;
  early_minutes?: number | null;
  note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_auto_checkout?: boolean | null;
};

// Tìm bản ghi chấm công của user trong ngày
export const findTodayByUser = async (userId: string, workDate: string) => {
  const res = await query(
    'SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2 LIMIT 1',
    [userId, workDate]
  );
  return res.rows[0] ?? null;
};

// Tạo bản ghi chấm công mới
export const createAttendance = async (
  client: any,
  data: Partial<AttendanceRow>
) => {
  const res = await client.query(
    `INSERT INTO attendance (user_id, shift_id, check_in, latitude, longitude, location_accuracy, location_address, status, work_date, late_minutes, note, is_auto_checkout)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      data.user_id,
      data.shift_id ?? null,
      data.check_in ?? null,
      data.latitude ?? null,
      data.longitude ?? null,
      data.location_accuracy ?? null,
      data.location_address ?? null,
      data.status ?? 'present',
      data.work_date ?? null,
      data.late_minutes ?? 0,
      data.note ?? null,
      data.is_auto_checkout ?? false,
    ]
  );
  return res.rows[0];
};

// Cập nhật bản ghi chấm công
export const updateAttendance = async (client: any, id: string, data: Partial<AttendanceRow>) => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const key of Object.keys(data)) {
    fields.push(`${key} = $${idx}`);
    // @ts-ignore
    values.push((data as any)[key]);
    idx++;
  }
  if (fields.length === 0) return null;
  const sql = `UPDATE attendance SET ${fields.join(',')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
  values.push(id);
  const res = await client.query(sql, values);
  return res.rows[0];
};

// Lấy lịch sử chấm công của user
export const getHistory = async (userId: string, limit = 30, offset = 0) => {
  const res = await query(
    `SELECT * FROM attendance WHERE user_id = $1 ORDER BY work_date DESC, created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return res.rows;
};

export const getShiftById = async (shiftId: string) => {
  const res = await query('SELECT * FROM shifts WHERE id = $1 LIMIT 1', [shiftId]);
  return res.rows[0] ?? null;
};

export const getClientForTx = async () => {
  return await getClient();
};
