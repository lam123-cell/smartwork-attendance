import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  getAttendanceRatioForMonth,
  getDetailedEmployeeReport,
  getDepartments,
  getHoursByDepartment,
  getReportStats,
} from '../repositories/adminReportRepository';

//Ham định dạng nhãn tháng
const formatMonthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return `Tháng ${String(m).padStart(2, '0')}/${y}`;
};

//Tạo danh sách lựa chọn tháng trong 6 tháng gần nhất
const buildMonthOptions = () => {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    months.push({ value, label: `Tháng ${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}` });
  }
  return months;
};

// Chuyển trạng thái sang nhãn hiển thị
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    present: 'Đúng giờ',
    late: 'Đi muộn',
    on_leave: 'Nghỉ phép',
    absent: 'Vắng mặt',
  };
  return map[status] || status;
};

// Lấy các bộ lọc cho báo cáo
export const getReportFilters = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await getDepartments();
    const months = buildMonthOptions();
    return res.json({ months, departments });
  } catch (err) {
    next(err);
  }
};

// Chuẩn hóa tỉ lệ chấm công để tổng bằng 100%
const normalizeRatios = (raw: { status: string; count: number }[]) => {
  const total = raw.reduce((s, r) => s + Number(r.count), 0);
  if (total === 0) {
    return raw.map(r => ({ status: r.status, count: Number(r.count), percentage: 0 }));
  }

  const rounded = raw.map(r => ({
    status: r.status,
    count: Number(r.count),
    percentage: Math.round((Number(r.count) / total) * 100),
  }));

  const sumPerc = rounded.reduce((s, r) => s + r.percentage, 0);
  const diff = 100 - sumPerc;
  if (diff !== 0 && rounded.length > 0) {
    const idx = rounded.reduce((best, curr, i, arr) => (curr.count > arr[best].count ? i : best), 0);
    rounded[idx].percentage += diff;
  }

  return rounded;
};

// Lấy thống kê báo cáo
export const getReportStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = String(req.query.month || '').trim();
    const departmentId = req.query.departmentId ? String(req.query.departmentId) : null;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month is required in format YYYY-MM' });
    }
    const stats = await getReportStats(month, departmentId === 'all' ? null : departmentId);
    return res.json(stats);
  } catch (err) {
    next(err);
  }
};

// Lấy giờ làm theo phòng ban
export const getHoursByDepartmentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = String(req.query.month || '').trim();
    const departmentId = req.query.departmentId ? String(req.query.departmentId) : null;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month is required in format YYYY-MM' });
    }
    const data = await getHoursByDepartment(month, departmentId === 'all' ? null : departmentId);
    return res.json({ data });
  } catch (err) {
    next(err);
  }
};

// Lấy tỉ lệ chấm công
export const getAttendanceRatioController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = String(req.query.month || '').trim();
    const departmentId = req.query.departmentId ? String(req.query.departmentId) : null;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month is required in format YYYY-MM' });
    }
    const raw = await getAttendanceRatioForMonth(month, departmentId === 'all' ? null : departmentId);
    const mapped = normalizeRatios(raw);
    return res.json({ data: mapped });
  } catch (err) {
    next(err);
  }
};

// Lấy báo cáo chi tiết nhân viên
export const getDetailedReportController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = String(req.query.month || '').trim();
    const departmentId = req.query.departmentId ? String(req.query.departmentId) : null;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month is required in format YYYY-MM' });
    }
    const rows = await getDetailedEmployeeReport(month, departmentId === 'all' ? null : departmentId);
    const mapped = rows.map(r => {
      const efficiency = r.workDays > 0 ? Math.round(((r.totalHours / (r.workDays * 8)) * 1000)) / 10 : 0;
      return { ...r, efficiency };
    });
    return res.json({ data: mapped });
  } catch (err) {
    next(err);
  }
};

// Lấy báo cáo chi tiết nhân viên
export const exportReportExcelController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = String(req.query.month || '').trim();
    const departmentId = req.query.departmentId ? String(req.query.departmentId) : null;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month is required in format YYYY-MM' });
    }

    const departmentList = await getDepartments();
    const departmentName = departmentId && departmentId !== 'all'
      ? (departmentList.find(d => d.id === departmentId)?.name || 'Không rõ')
      : 'Tất cả phòng ban';

    const stats = await getReportStats(month, departmentId === 'all' ? null : departmentId);
    const hours = await getHoursByDepartment(month, departmentId === 'all' ? null : departmentId);
    const ratioRaw = await getAttendanceRatioForMonth(month, departmentId === 'all' ? null : departmentId);
    const ratio = normalizeRatios(ratioRaw);
    const details = (await getDetailedEmployeeReport(month, departmentId === 'all' ? null : departmentId)).map(r => ({
      ...r,
      efficiency: r.workDays > 0 ? Math.round(((r.totalHours / (r.workDays * 8)) * 1000)) / 10 : 0,
    }));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bao cao', { pageSetup: { paperSize: 9, orientation: 'landscape' } });

    const borderAllThin = (row: number, colCount: number) => {
      for (let c = 1; c <= colCount; c++) {
        const cell = sheet.getRow(row).getCell(c);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      }
    };

    const styleHeaderRow = (row: number, fill = 'FF2563EB') => {
      const r = sheet.getRow(row);
      r.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      r.alignment = { horizontal: 'center', vertical: 'middle' };
      r.height = 24;
      r.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
      });
    };

    sheet.columns = [
      { width: 26 },
      { width: 24 },
      { width: 18 },
      { width: 18 },
      { width: 14 },
      { width: 16 },
    ];

    sheet.mergeCells('A1:F1');
    const title = sheet.getCell('A1');
    title.value = 'BÁO CÁO CHẤM CÔNG';
    title.font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.addRow([]);
    const infoStart = sheet.lastRow?.number || 2;
    sheet.addRow(['Tháng', formatMonthLabel(month)]);
    sheet.addRow(['Phòng ban', departmentName]);
    sheet.getRows(infoStart, 2)?.forEach((r) => {
      r.getCell(1).font = { bold: true, color: { argb: 'FF0F172A' } };
    });
    sheet.addRow([]);

    const statsHeaderRow = sheet.addRow(['Chỉ số', 'Giá trị']);
    styleHeaderRow(statsHeaderRow.number, 'FF1D4ED8');
    borderAllThin(statsHeaderRow.number, 2);
    [
      ['Tổng số nhân viên', stats.employeeCount],
      ['Tổng giờ làm trong tháng', stats.totalHours],
      ['Số lượt đi muộn', stats.lateCount],
    ].forEach((item) => {
      const row = sheet.addRow(item as any);
      row.alignment = { vertical: 'middle' };
      borderAllThin(row.number, 2);
    });

    sheet.addRow([]);
    const hoursHeaderRow = sheet.addRow(['Phòng ban', 'Giờ làm']);
    styleHeaderRow(hoursHeaderRow.number, 'FF0EA5E9');
    borderAllThin(hoursHeaderRow.number, 2);
    if (hours.length === 0) {
      const row = sheet.addRow(['(Không có dữ liệu)', 0]);
      borderAllThin(row.number, 2);
      row.getCell(1).alignment = { horizontal: 'left' };
    } else {
      hours.forEach(h => {
        const row = sheet.addRow([h.department, h.hours]);
        borderAllThin(row.number, 2);
      });
    }

    sheet.addRow([]);
    const ratioHeaderRow = sheet.addRow(['Trạng thái', 'Số lượt', 'Tỉ lệ (%)']);
    styleHeaderRow(ratioHeaderRow.number, 'FF16A34A');
    borderAllThin(ratioHeaderRow.number, 3);
    if (ratio.length === 0) {
      const row = sheet.addRow(['(Không có dữ liệu)', 0, 0]);
      borderAllThin(row.number, 3);
      row.getCell(1).alignment = { horizontal: 'left' };
    } else {
      ratio.forEach(r => {
        const row = sheet.addRow([statusLabel(r.status), r.count, r.percentage]);
        borderAllThin(row.number, 3);
      });
    }

    sheet.addRow([]);
    const detailHeaderRow = sheet.addRow(['Nhân viên', 'Phòng ban', 'Số ngày làm', 'Số ngày đi muộn', 'Tổng giờ', 'Hiệu suất (%)']);
    styleHeaderRow(detailHeaderRow.number, 'FF475569');
    borderAllThin(detailHeaderRow.number, 6);
    if (details.length === 0) {
      const row = sheet.addRow(['(Không có dữ liệu)', '', '', '', '', '']);
      borderAllThin(row.number, 6);
      row.getCell(1).alignment = { horizontal: 'left' };
    } else {
      details.forEach(d => {
        const row = sheet.addRow([
          d.name,
          d.department,
          d.workDays,
          d.lateDays,
          d.totalHours,
          d.efficiency,
        ]);
        row.alignment = { vertical: 'middle' };
        borderAllThin(row.number, 6);
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-${month}-${departmentId || 'all'}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

const pad = (value: string, len: number) => {
  const safe = value || '';
  return safe.length > len ? safe.slice(0, len) : safe.padEnd(len, ' ');
};

// Lấy báo cáo chi tiết nhân viên
export const exportReportPdfController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = String(req.query.month || '').trim();
    const departmentId = req.query.departmentId ? String(req.query.departmentId) : null;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month is required in format YYYY-MM' });
    }

    const departmentList = await getDepartments();
    const departmentName = departmentId && departmentId !== 'all'
      ? (departmentList.find(d => d.id === departmentId)?.name || 'Không rõ')
      : 'Tất cả phòng ban';

    const stats = await getReportStats(month, departmentId === 'all' ? null : departmentId);
    const hours = await getHoursByDepartment(month, departmentId === 'all' ? null : departmentId);
    const ratioRaw = await getAttendanceRatioForMonth(month, departmentId === 'all' ? null : departmentId);
    const ratio = normalizeRatios(ratioRaw);
    const details = (await getDetailedEmployeeReport(month, departmentId === 'all' ? null : departmentId)).map(r => ({
      ...r,
      efficiency: r.workDays > 0 ? Math.round(((r.totalHours / (r.workDays * 8)) * 1000)) / 10 : 0,
    }));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-${month}-${departmentId || 'all'}.pdf"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(16).text('BÁO CÁO CHẤM CÔNG', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tháng: ${formatMonthLabel(month)}`);
    doc.text(`Phòng ban: ${departmentName}`);
    doc.moveDown();

    doc.fontSize(13).text('1) Chỉ số tổng quan');
    doc.fontSize(11).list([
      `Tổng số nhân viên: ${stats.employeeCount}`,
      `Tổng giờ làm trong tháng: ${stats.totalHours}`,
      `Số lượt đi muộn: ${stats.lateCount}`,
    ], { bulletIndent: 14 });
    doc.moveDown();

    doc.fontSize(13).text('2) Tổng giờ theo phòng ban');
    doc.fontSize(11);
    if (hours.length === 0) {
      doc.text('• Không có dữ liệu');
    } else {
      hours.forEach(h => doc.text(`• ${h.department}: ${h.hours} giờ`));
    }
    doc.moveDown();

    doc.fontSize(13).text('3) Tỉ lệ chấm công');
    doc.fontSize(11);
    if (ratio.length === 0) {
      doc.text('• Không có dữ liệu');
    } else {
      ratio.forEach(r => doc.text(`• ${statusLabel(r.status)}: ${r.percentage}% (${r.count} lượt)`));
    }
    doc.moveDown();

    doc.fontSize(13).text('4) Chi tiết nhân viên');
    if (details.length === 0) {
      doc.fontSize(11).text('Không có dữ liệu');
    } else {
      doc.moveDown(0.5);
      doc.font('Courier').fontSize(9);
      doc.text('Tên                  | Phòng ban           | Ngày | Muộn | Giờ | Hiệu suất');
      doc.text('----------------------------------------------------------------------------');
      const maxRows = 80;
      details.slice(0, maxRows).forEach(d => {
        const line = `${pad(d.name, 20)} | ${pad(d.department, 18)} | ${String(d.workDays).padStart(4, ' ')} | ${String(d.lateDays).padStart(4, ' ')} | ${String(Math.round(d.totalHours)).padStart(3, ' ')} | ${String(d.efficiency).padStart(10, ' ')}%`;
        doc.text(line);
      });
      if (details.length > maxRows) {
        doc.text(`... (còn ${details.length - maxRows} dòng)`, { continued: false });
      }
      doc.font('Helvetica').fontSize(11);
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};
