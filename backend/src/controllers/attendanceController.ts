import { Request, Response, NextFunction } from 'express';
import { getClientForTx, findTodayByUser, createAttendance, updateAttendance, getHistory, getShiftById } from '../repositories/attendanceRepository';
import { query } from '../config/db';
import { logActivity } from '../utils/logger';
import ExcelJS from 'exceljs';


const FIXED_SHIFT_ID = '00000000-0000-0000-0000-000000000001';

// Hàm kiểm tra giờ check-in: Chỉ cho đến 9:30 AM giờ Việt Nam
const isCheckInAllowed = () => {
  const now = new Date();
  const vnHour = (now.getUTCHours() + 7) % 24; // Giờ Việt Nam (UTC+7)
  const vnMinute = now.getUTCMinutes();
  if (vnHour > 9) return false;
  if (vnHour === 9 && vnMinute > 30) return false;
  return true;
};

// Tiện ích lấy ngày theo định dạng YYYY-MM-DD
const utcDateString = (d = new Date()) => d.toISOString().slice(0, 10);

const parseTimeToMinutes = (timeStr: string) => {
  const parts = timeStr.split(':').map((s) => parseInt(s, 10));
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id as string;
  let {latitude, longitude, note } = req.body as any;
  // Kiểm tra giờ check-in (thêm mới)
  if (!isCheckInAllowed()) {
    return res.status(400).json({ 
      message: 'Quá giờ check-in cho phép (9:30 sáng). Vui lòng liên hệ quản lý.' 
    });
  }

  // Luôn gán ca hành chính 
  const shift_id = FIXED_SHIFT_ID;

  const client = await getClientForTx();
  try {
    await client.query('BEGIN');

    const workDate = utcDateString();
    // Khóa bản ghi chấm công trong ngày để tránh race condition
    const existing = await client.query('SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2 FOR UPDATE', [userId, workDate]);
    const now = new Date();

    // Tìm thông tin ca làm việc
    let shift: any = null;
    if (shift_id) {
      shift = await getShiftById(shift_id);
    }

    if (existing.rows[0]) {
      const row = existing.rows[0];
      if (row.check_in) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Bạn đã check-in hôm nay' });
      }
      // cập nhật bản ghi hiện có với check_in
      // tính toán muộn
      let lateMinutes = 0;
      let status = 'present';
      if (shift && shift.start_time) {
        const checkInMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const shiftStart = parseTimeToMinutes(shift.start_time);
        lateMinutes = Math.max(0, checkInMinutes - shiftStart);
        if (lateMinutes > (shift.late_threshold_minutes ?? 15)) status = 'late';
      }
      const updated = await updateAttendance(client, row.id, {
        check_in: now.toISOString(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        late_minutes: lateMinutes,
        status,
        note: note ?? null,
      });
      await client.query('COMMIT');
      //Ghi log hoạt động
      try {
        await logActivity(
          userId,
          'ATTENDANCE_CHECKIN',
          `Check-in lúc ${new Date().toLocaleTimeString('vi-VN')} ${lateMinutes > 0 ? `(muộn ${lateMinutes} phút)` : ''}`,
          'attendance',
          updated?.id ?? row.id,
          req.ip,
          req.get('user-agent') || undefined
        );
      } catch (e) {
        // bỏ qua lỗi ghi log
      }
      return res.json({ attendance: updated });
    }

    // Tạo bản ghi chấm công mới
    let lateMinutes = 0;
    let status = 'present';
    if (shift && shift.start_time) {
      const checkInMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      const shiftStart = parseTimeToMinutes(shift.start_time);
      lateMinutes = Math.max(0, checkInMinutes - shiftStart);
      if (lateMinutes > (shift.late_threshold_minutes ?? 15)) status = 'late';
    }

    const created = await createAttendance(client, {
      user_id: userId,
      shift_id: shift_id ?? null,
      check_in: now.toISOString(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status,
      work_date: workDate,
      late_minutes: lateMinutes,
      note: note ?? null,
    });

    await client.query('COMMIT');
    // Ghi log hoạt động cho tạo mới
    try {
      await logActivity(
        userId,
        'ATTENDANCE_CHECKIN',
        `Check-in lúc ${new Date().toLocaleTimeString('vi-VN')} ${lateMinutes > 0 ? `(muộn ${lateMinutes} phút)` : ''}`,
        'attendance',
        created?.id,
        req.ip,
        req.get('user-agent') || undefined
      );
    } catch (e) {
      // bỏ qua lỗi ghi log
    }
    return res.json({ attendance: created });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// Check-out
export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id as string;
  const client = await getClientForTx();
  try {
    await client.query('BEGIN');
    const workDate = utcDateString();
    const existingRes = await client.query('SELECT * FROM attendance WHERE user_id = $1 AND work_date = $2 FOR UPDATE', [userId, workDate]);
    const row = existingRes.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Chưa có bản ghi check-in hôm nay' });
    }
    if (!row.check_in) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Chưa check-in, không thể check-out' });
    }
    if (row.check_out) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Bạn đã check-out rồi' });
    }

    const now = new Date();
    const checkInDate = new Date(row.check_in);
    const diffMs = now.getTime() - checkInDate.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // 2 decimals

    const updated = await updateAttendance(client, row.id, {
      check_out: now.toISOString(),
      total_hours: hours,
    });

    await client.query('COMMIT');
    // Ghi log hoạt động khi check-out
    try {
      await logActivity(
        userId,
        'ATTENDANCE_CHECKOUT',
        `Check-out lúc ${new Date().toLocaleTimeString('vi-VN')} - Tổng ${hours} giờ`,
        'attendance',
        updated?.id,
        req.ip,
        req.get('user-agent') || undefined
      );
    } catch (e) {
      // ignore
    }
    return res.json({ attendance: updated });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// Lấy bản ghi chấm công hôm nay
export const getToday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const workDate = utcDateString(); // YYYY-MM-DD

    const row = await findTodayByUser(userId, workDate);

    const attendanceWithShiftName = row
      ? {
          ...row,
          shift_name: 'Ca hành chính', 
          shift_time: '08:00 - 17:00',
        }
      : null;

    return res.json({ attendance: attendanceWithShiftName });
  } catch (err) {
    next(err);
  }
};

// Tính toán thống kê
const computeStatsForUser = async (userId: string) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  const rows = await query(`
    SELECT status, late_minutes, total_hours, check_in
    FROM attendance
    WHERE user_id = $1 AND work_date >= $2
  `, [userId, monthStart.toISOString().slice(0,10)]);

  const lateDays = rows.rows.filter((r:any) => r.status === 'late').length;
  const totalHours = rows.rows.reduce((sum: number, r: any) => sum + (r.total_hours || 0), 0);
  const workedDays = rows.rows.filter((r: any) => r.check_in).length;
  const onTimeRate = workedDays > 0 ? Math.round(((workedDays - lateDays) / workedDays) * 100) : 0;

  return {
    monthlyHours: Number(totalHours.toFixed(1)),
    lateDays,
    onTimeRate: onTimeRate + '%'
  };
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const historyLimit = parseInt(String(req.query.historyLimit ?? '7'), 10);

    const today = await findTodayByUser(userId, utcDateString());
    const history = await getHistory(userId, historyLimit, 0);
    const stats = await computeStatsForUser(userId);

    return res.json({ today: today ? { ...today } : null, history, stats });
  } catch (err) {
    next(err);
  }
};

export const history = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const limit = parseInt(String(req.query.limit ?? '30'), 10);
    const offset = parseInt(String(req.query.offset ?? '0'), 10);
    const rows = await getHistory(userId, limit, offset);
    return res.json({ items: rows });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  const rows = await query(`
    SELECT status, late_minutes, total_hours 
    FROM attendance 
    WHERE user_id = $1 AND work_date >= $2
  `, [userId, monthStart.toISOString().slice(0,10)]);

  const lateDays = rows.rows.filter(r => r.status === 'late').length;
  const totalHours = rows.rows.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const workedDays = rows.rows.filter(r => r.check_in).length;
  const onTimeRate = workedDays > 0 ? Math.round(((workedDays - lateDays) / workedDays) * 100) : 0;

  res.json({
    monthlyHours: Number(totalHours.toFixed(1)),
    lateDays,
    onTimeRate: onTimeRate + '%'
  });
};

export const searchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const { from_date, to_date, status } = req.query;
    const limit = parseInt(String(req.query.limit ?? '30'), 10);
    const offset = parseInt(String(req.query.offset ?? '0'), 10);

    let sql = `SELECT * FROM attendance WHERE user_id = $1`;
    const values: any[] = [userId];
    let idx = 2;

    if (from_date) {
      sql += ` AND work_date >= $${idx}`;
      values.push(String(from_date));
      idx++;
    }
    if (to_date) {
      sql += ` AND work_date <= $${idx}`;
      values.push(String(to_date));
      idx++;
    }
    if (status && String(status) !== 'all') {
      sql += ` AND status = $${idx}`;
      values.push(String(status));
      idx++;
    }

    sql += ` ORDER BY work_date DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    values.push(limit, offset);

    const rows = await query(sql, values);
    return res.json({ items: rows.rows });
  } catch (err) {
    next(err);
  }
};

export const exportHistoryExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const { from_date, to_date } = req.query;

    let sql = `SELECT work_date, shift_id, check_in, check_out, total_hours, status, late_minutes, note 
               FROM attendance WHERE user_id = $1`;
    const values: any[] = [userId];
    let idx = 2;

    if (from_date) {
      sql += ` AND work_date >= $${idx}`;
      values.push(String(from_date));
      idx++;
    }
    if (to_date) {
      sql += ` AND work_date <= $${idx}`;
      values.push(String(to_date));
      idx++;
    }

    sql += ` ORDER BY work_date DESC`;

    const result = await query(sql, values);
    const rows = result.rows;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Lịch sử chấm công');

    sheet.addRow(['LỊCH SỬ CHẤM CÔNG CÁ NHÂN']);
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.addRow(['Từ ngày: ', from_date || 'Không giới hạn']);
    sheet.addRow(['Đến ngày: ', to_date || 'Không giới hạn']);
    sheet.addRow([]);

    const header = sheet.addRow(['Ngày', 'Ca làm', 'Check-in', 'Check-out', 'Giờ làm', 'Trạng thái', 'Muộn (phút)', 'Ghi chú']);
    header.font = { bold: true };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } } as any;

    rows.forEach((row: any) => {
      let shiftName = 'Ca hành chính';

      sheet.addRow([
        row.work_date,
        shiftName,
        row.check_in ? new Date(row.check_in).toLocaleTimeString('vi-VN') : '--',
        row.check_out ? new Date(row.check_out).toLocaleTimeString('vi-VN') : '--',
        row.total_hours || '--',
        row.status === 'late' ? 'Đi muộn' : (row.status === 'present' ? 'Có mặt' : row.status),
        row.late_minutes || 0,
        row.note || ''
      ]);
    });

    sheet.columns.forEach((col: any) => (col.width = 15));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=lich-su-cham-cong.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};


