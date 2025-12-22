import { Request, Response, NextFunction } from 'express';
import { getClientForTx, findTodayByUser, createAttendance, updateAttendance, getHistory, getShiftById } from '../repositories/attendanceRepository';
import { query } from '../config/db';
import { logActivity } from '../utils/logger';
import ExcelJS from 'exceljs';
import { getSettings } from '../repositories/systemSettingsRepository';
import { getDistance } from 'geolib';

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
  let { latitude, longitude, accuracy, address, note } = req.body as any;
  
  // Kiểm tra giờ check-in TRƯỚC (9:30 sáng)
  if (!isCheckInAllowed()) {
    return res.status(400).json({ 
      message: 'Quá giờ check-in cho phép (9:30 sáng). Vui lòng liên hệ quản lý.' 
    });
  }

  // Luôn gán ca hành chính 
  const shift_id = FIXED_SHIFT_ID;

  // Kiểm tra vị trí GPS SAU
  const settings = await getSettings();
  const requireGps = settings?.gps_latitude != null && settings?.gps_longitude != null && (settings?.max_distance_meters ?? 0) > 0;
  if (requireGps) {
    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: 'Yêu cầu vị trí GPS' });
    }
    const distance = getDistance(
      { latitude: Number(latitude), longitude: Number(longitude) },
      { latitude: Number(settings.gps_latitude), longitude: Number(settings.gps_longitude) }
    );
    if (distance > Number(settings.max_distance_meters)) {
      return res.status(403).json({ message: `Vị trí quá xa công ty (${distance}m > ${settings.max_distance_meters}m)` });
    }
  }

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
        // Convert current UTC time to Vietnam time (UTC+7) before comparing
        const vnHour = (now.getUTCHours() + 7) % 24;
        const checkInMinutes = vnHour * 60 + now.getUTCMinutes();
        const shiftStart = parseTimeToMinutes(shift.start_time);
        lateMinutes = Math.max(0, checkInMinutes - shiftStart);
        if (lateMinutes > (shift.late_threshold_minutes ?? 15)) status = 'late';
      }
      const updated = await updateAttendance(client, row.id, {
        check_in: now.toISOString(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        location_accuracy: accuracy ?? null,
        location_address: address ?? null,
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
      // Convert current UTC time to Vietnam time (UTC+7) before comparing
      const vnHour = (now.getUTCHours() + 7) % 24;
      const checkInMinutes = vnHour * 60 + now.getUTCMinutes();
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
      location_accuracy: accuracy ?? null,
      location_address: address ?? null,
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
  let { latitude, longitude, accuracy, address } = req.body as any;
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

    // Đảm bảo GPS khi có cấu hình
    const settings = await getSettings();
    const requireGps = settings?.gps_latitude != null && settings?.gps_longitude != null && (settings?.max_distance_meters ?? 0) > 0;
    if (requireGps) {
      if (latitude == null || longitude == null) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Yêu cầu vị trí GPS' });
      }
      const distance = getDistance(
        { latitude: Number(latitude), longitude: Number(longitude) },
        { latitude: Number(settings.gps_latitude), longitude: Number(settings.gps_longitude) }
      );
      if (distance > Number(settings.max_distance_meters)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ message: `Vị trí quá xa công ty (${distance}m > ${settings.max_distance_meters}m)` });
      }
    }

    const now = new Date();
    const checkInDate = new Date(row.check_in);
    const diffMs = now.getTime() - checkInDate.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // 2 decimals

    const updated = await updateAttendance(client, row.id, {
      check_out: now.toISOString(),
      total_hours: hours,
      latitude: latitude ?? row.latitude ?? null,
      longitude: longitude ?? row.longitude ?? null,
      location_accuracy: accuracy ?? row.location_accuracy ?? null,
      location_address: address ?? row.location_address ?? null,
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
    const workDate = utcDateString(); // YYYY-MM-DD (Vietnam)

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

// Lấy lịch sử chấm công với phân trang
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

// Lấy thống kê chấm công trong tháng hiện tại
export const getStats = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  const rows = await query(`  
    SELECT a.*
    FROM attendance a
    WHERE a.user_id = $1 AND a.work_date >= $2 AND a.work_date <= CURRENT_DATE
  `, [userId, monthStart]);
  const lateDays = rows.rows.filter(r => r.status === 'late').length;
  // Convert total_hours to Number to avoid issues when DB returns numeric as string
  const totalHours = rows.rows.reduce((sum, r) => sum + Number(r.total_hours ?? 0), 0);
  const workedDays = rows.rows.filter(r => r.check_in != null).length;
  const onTimeRate = workedDays > 0 ? Math.round(((workedDays - lateDays) / workedDays) * 100) : 100;
  //console.log('DEBUG THÁNG 11:', { workedDays, lateDays, totalHours });

  res.json({
    monthlyHours: Number(totalHours.toFixed(1)),
    lateDays,
    onTimeRate: onTimeRate + '%'
  });
};

// Tìm kiếm lịch sử chấm công với bộ lọc
export const searchHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const { from_date, to_date, status } = req.query;
    const limit = parseInt(String(req.query.limit ?? '30'), 10);
    const offset = parseInt(String(req.query.offset ?? '0'), 10);
    // Build base filter SQL and parameters (without limit/offset)
    let baseSql = `FROM attendance WHERE user_id = $1`;
    const params: any[] = [userId];
    let idx = 2;

    if (from_date) {
      baseSql += ` AND work_date >= $${idx}`;
      params.push(String(from_date));
      idx++;
    }
    if (to_date) {
      baseSql += ` AND work_date <= $${idx}`;
      params.push(String(to_date));
      idx++;
    }
    if (status && String(status) !== 'all') {
      baseSql += ` AND status = $${idx}`;
      params.push(String(status));
      idx++;
    }

    // Count total matching rows for pagination
    const countSql = `SELECT COUNT(*) AS cnt ${baseSql}`;
    const countRes = await query(countSql, params);
    const total = Number(countRes.rows[0]?.cnt ?? 0);

    // Fetch page rows with limit/offset
    const dataSql = `SELECT * ${baseSql} ORDER BY work_date DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const dataParams = params.concat([limit, offset]);
    const dataRes = await query(dataSql, dataParams);

    return res.json({ items: dataRes.rows, total });
  } catch (err) {
    next(err);
  }
};


// Xuất lịch sử chấm công ra file Excel
export const exportHistoryExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const { from_date, to_date, status } = req.query;

    // Truy vấn dữ liệu
    let sql = `SELECT work_date, shift_id, check_in, check_out, total_hours, status, late_minutes, note 
               FROM attendance WHERE user_id = $1`;
    const values: any[] = [userId];
    let idx = 2;

    if (from_date) {
      sql += ` AND work_date >= $${idx++}`;
      values.push(from_date);
    }
    if (to_date) {
      sql += ` AND work_date <= $${idx++}`;
      values.push(to_date);
    }
    if (status && String(status) !== 'all') {
      sql += ` AND status = $${idx++}`;
      values.push(String(status));
    }
    sql += ` ORDER BY work_date DESC`;

    const result = await query(sql, values);
    const rows = result.rows;

    // Tạo file Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Lịch sử chấm công', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Tiêu đề lớn
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LỊCH SỬ CHẤM CÔNG CÁ NHÂN';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E40DF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Từ ngày - Đến ngày
    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = 'Từ ngày:';
    sheet.getCell('B2').value = from_date ? formatDate(from_date as string) : 'Không giới hạn';

    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = 'Đến ngày:';
    sheet.getCell('B3').value = to_date ? formatDate(to_date as string) : 'Không giới hạn';

    // Dòng trống
    sheet.addRow([]);

    // Header bảng
    const headerRow = sheet.addRow([
      'Ngày',
      'Ca làm',
      'Check-in',
      'Check-out',
      'Giờ làm',
      'Trạng thái',
      'Muộn (phút)',
      'Ghi chú',
    ]);

    // Style header
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;

    // Thêm viền cho header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Chữ trắng
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }, // Xanh dương
      };

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Dữ liệu
    rows.forEach((row: any) => {
      const shiftName = row.shift_id === '11111111-1111-1111-1111-111111111111'
        ? 'Sáng (08:00–12:00)'
        : row.shift_id === '22222222-2222-2222-2222-222222222222'
          ? 'Chiều (13:00–17:00)'
          : 'Ca hành chính';

      const statusText = row.status === 'late' ? 'Đi muộn' : row.status === 'present' ? 'Đúng giờ' : 'Vắng';

      sheet.addRow([
        formatDate(row.work_date), // Ngày dạng dd/mm/yyyy
        shiftName,
        row.check_in ? new Date(row.check_in).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--',
        row.check_out ? new Date(row.check_out).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--',
        row.total_hours ? Number(row.total_hours).toFixed(1) : '--',
        statusText,
        row.late_minutes > 0 ? row.late_minutes : '',
        row.note || '',
      ]);
    });

    // Style toàn bộ bảng dữ liệu
    const dataStartRow = 6; // vì header ở row 5
    const lastRow = sheet.rowCount;

    for (let i = dataStartRow; i <= lastRow; i++) {
      const r = sheet.getRow(i);
      r.height = 25;
      r.alignment = { horizontal: 'center', vertical: 'middle' };

      r.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        // Tô màu trạng thái
        if (colNumber === 6) {
          const val = cell.value;
          if (val === 'Đi muộn') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE6A5' } };
            cell.font = { color: { argb: 'FFCA8A04' }, bold: true };
          } else if (val === 'Vắng') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
            cell.font = { color: { argb: 'FFDC2626' }, bold: true };
          } else if (val === 'Đúng giờ') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
            cell.font = { color: { argb: 'FF16A34A' } };
          }
        }
      });
    }

    // Đặt độ rộng cột đẹp
    sheet.columns = [
      { width: 14 },
      { width: 20 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 15 },
      { width: 14 },
      { width: 25 },
    ];

    // Gửi file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="lich-su-cham-cong-${from_date || 'all'}-den-${to_date || 'all'}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Helper format ngày đẹp
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN'); // 01/12/2025
}


