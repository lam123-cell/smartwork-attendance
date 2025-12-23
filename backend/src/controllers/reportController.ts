import { Request, Response, NextFunction } from 'express';
import { getAttendanceRowsForRange } from '../repositories/reportRepository';
import ExcelJS from 'exceljs';

// Helper to format YYYY-MM-DD using local date (avoid timezone shift from toISOString)
function formatDateIso(d: Date) {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Compute hours from check_in/check_out if total_hours is missing
function computeHours(row: any) {
  if (row.total_hours != null) return Number(row.total_hours);
  if (row.check_in && row.check_out) {
    const ci = new Date(row.check_in);
    const co = new Date(row.check_out);
    const diff = (co.getTime() - ci.getTime()) / 1000 / 3600;
    return Math.round(diff * 100) / 100;
  }
  return 0;
}

export const getPersonalReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const month = String(req.query.month || ''); // expected YYYY-MM
    if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) {
      return res.status(400).json({ message: 'month parameter required in YYYY-MM format' });
    }

    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0); // last day of month
    const fromDate = formatDateIso(start);
    const toDate = formatDateIso(end);

    const rows = await getAttendanceRowsForRange(userId, fromDate, toDate);

    // Map rows by work_date for quick lookup
    const byDate: Record<string, any> = {};
    rows.forEach((r: any) => {
      byDate[formatDateIso(new Date(r.work_date))] = r;
    });

    const days: any[] = [];
    for (let d = 1; d <= end.getDate(); d++) {
      const dt = new Date(y, m - 1, d);
      const iso = formatDateIso(dt);
      const row = byDate[iso];
      const hours = row ? computeHours(row) : 0;
      const status = row ? (row.status || 'present') : 'absent';
      days.push({ day: d, date: iso, hours, status, late_minutes: row ? row.late_minutes ?? 0 : 0, note: row ? row.note : '' });
    }

    const totalHours = days.reduce((s, r) => s + (r.hours || 0), 0);
    const workedDays = days.filter(d => d.hours > 0).length;
    const lateDays = days.filter(d => d.status === 'late').length;
    const absentDays = days.filter(d => d.status === 'absent').length;
    const avgHours = workedDays > 0 ? Math.round((totalHours / workedDays) * 10) / 10 : 0;
    const onTimeRate = days.length > 0 ? Math.round(((workedDays - lateDays) / days.length) * 1000) / 10 : 0;

    // Weekly summary: split month into 4 groups: 1-7, 8-14, 15-21, 22-end
    // This ensures the report always shows 4 weeks regardless of month length (28/30/31 days)
    const weeklyMap: Record<number, any> = {};
    days.forEach(d => {
      const weekIndex = d.day <= 7 ? 1 : d.day <= 14 ? 2 : d.day <= 21 ? 3 : 4;
      if (!weeklyMap[weekIndex]) weeklyMap[weekIndex] = { week: `Tuần ${weekIndex}`, totalHours: 0, onTime: 0, late: 0, absent: 0 };
      weeklyMap[weekIndex].totalHours += d.hours || 0;
      if (d.status === 'present') weeklyMap[weekIndex].onTime += 1;
      if (d.status === 'late') weeklyMap[weekIndex].late += 1;
      if (d.status === 'absent') weeklyMap[weekIndex].absent += 1;
    });
    const weekly = [1, 2, 3, 4].map(i => weeklyMap[i] || { week: `Tuần ${i}`, totalHours: 0, onTime: 0, late: 0, absent: 0 });

    return res.json({ month, fromDate, toDate, days, summary: { totalHours: Math.round(totalHours * 10) / 10, avgHours, lateDays, absentDays, onTimeRate }, weekly });
  } catch (err) {
    next(err);
  }
};

export const exportPersonalReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const month = String(req.query.month || '');
    if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) {
      return res.status(400).json({ message: 'month parameter required in YYYY-MM format' });
    }
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    const fromDate = formatDateIso(start);
    const toDate = formatDateIso(end);

    const rows = await getAttendanceRowsForRange(userId, fromDate, toDate);

    // Build days like in getPersonalReport
    const byDate: Record<string, any> = {};
    rows.forEach((r: any) => { byDate[formatDateIso(new Date(r.work_date))] = r; });
    const days: any[] = [];
    for (let d = 1; d <= end.getDate(); d++) {
      const dt = new Date(y, m - 1, d);
      const iso = formatDateIso(dt);
      const row = byDate[iso];
      const hours = row ? computeHours(row) : 0;
      const status = row ? (row.status || 'present') : 'absent';
      days.push({ day: d, date: iso, hours, status, late_minutes: row ? row.late_minutes ?? 0 : 0, note: row ? row.note : '' });
    }

    // Create Excel (styled similar to exportHistoryExcel)
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Báo cáo cá nhân', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Title
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'BÁO CÁO CÁ NHÂN';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E40DF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    // Month / From - To
    sheet.mergeCells('A2:B2');
    sheet.getCell('A2').value = 'Tháng:';
    sheet.getCell('B2').value = month;

    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = 'Từ ngày:';
    sheet.getCell('B3').value = fromDate;

    sheet.mergeCells('A4:B4');
    sheet.getCell('A4').value = 'Đến ngày:';
    sheet.getCell('B4').value = toDate;

    // Empty row
    sheet.addRow([]);

    // Header
    const headerRow = sheet.addRow(['Ngày', 'Giờ làm (h)', 'Trạng thái', 'Muộn (phút)', 'Ghi chú']);
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Chữ trắng
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }, // Xanh dương
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    // Data rows
    days.forEach(d => {
      // Helper format ngày Việt Nam
      const formatVietnamDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        const day = String(vnDate.getUTCDate()).padStart(2, '0');
        const month = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
        const year = vnDate.getUTCFullYear();
        return `${day}/${month}/${year}`;
      };
      const displayDate = formatVietnamDate(d.date);
      const statusText = d.status === 'late' ? 'Đi muộn' : d.status === 'present' ? 'Đúng giờ' : 'Vắng';
      sheet.addRow([displayDate, d.hours ? Number(d.hours).toFixed(1) : '', statusText, d.late_minutes || '', d.note || '']);
    });

    // Style data table
    const dataStartRow = headerRow.number + 1;
    const lastRow = sheet.rowCount;
    for (let i = dataStartRow; i <= lastRow; i++) {
      const r = sheet.getRow(i);
      r.height = 22;
      r.alignment = { horizontal: 'center', vertical: 'middle' };
      r.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (colNumber === 3) {
          const val = String(cell.value || '');
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

    // Column widths
    sheet.columns = [
      { width: 14 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 30 },
    ];

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-ca-nhan-${month}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
