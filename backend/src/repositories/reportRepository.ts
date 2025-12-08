import { query } from '../config/db';
import { AttendanceRow } from './attendanceRepository';

export const getAttendanceRowsForRange = async (userId: string, fromDate: string, toDate: string) => {
  const res = await query(
    `SELECT work_date, check_in, check_out, total_hours, status, late_minutes, note
     FROM attendance
     WHERE user_id = $1 AND work_date >= $2 AND work_date <= $3
     ORDER BY work_date ASC`,
    [userId, fromDate, toDate]
  );
  return res.rows as AttendanceRow[];
};

export const countAttendanceForRange = async (userId: string, fromDate: string, toDate: string) => {
  const res = await query(
    `SELECT COUNT(*) AS cnt FROM attendance WHERE user_id = $1 AND work_date >= $2 AND work_date <= $3`,
    [userId, fromDate, toDate]
  );
  return Number(res.rows[0]?.cnt ?? 0);
};
