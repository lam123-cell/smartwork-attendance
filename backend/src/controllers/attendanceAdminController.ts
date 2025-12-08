import { Request, Response, NextFunction } from 'express';
import { getAllAttendanceWithEmployee, countAllAttendance, searchAttendanceAdmin, updateAttendanceRecord } from '../repositories/attendanceAdminRepository';
import ExcelJS from 'exceljs';

// Helper format ngày 
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN'); // 01/12/2025
}

// Lấy tất cả bản ghi chấm công (admin)
export const getAllAttendanceAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //console.log('Admin API /all được gọi');
    const limit = parseInt(String(req.query.limit ?? '1000'), 10);
    const offset = parseInt(String(req.query.offset ?? '0'), 10);
    
    //console.log('Query params:', { limit, offset });
    const rows = await getAllAttendanceWithEmployee(limit, offset);
    //console.log('Đã lấy được', rows.length, 'bản ghi');
    
    const total = await countAllAttendance();
    //console.log('Tổng số bản ghi:', total);
    
    return res.json({
      attendances: rows,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('Lỗi trong getAllAttendanceAdmin:', err);
    next(err);
  }
};

// Tìm kiếm chấm công (admin)
export const searchAttendanceRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee_name, work_date, status } = req.query;
    const limit = parseInt(String(req.query.limit ?? '1000'), 10);
    const offset = parseInt(String(req.query.offset ?? '0'), 10);

    const rows = await searchAttendanceAdmin(
      employee_name as string | undefined,
      work_date as string | undefined,
      status as string | undefined,
      limit,
      offset
    );

    return res.json({
      attendances: rows,
      total: rows.length,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
};

// Xuất tất cả chấm công ra Excel (admin)
export const exportAllAttendanceExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee_name, work_date, status } = req.query;

    // Lấy dữ liệu
    const rows = await searchAttendanceAdmin(
      employee_name as string | undefined,
      work_date as string | undefined,
      status as string | undefined,
      999999,
      0
    );

    // Tạo workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Danh sách chấm công', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Tiêu đề
    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'DANH SÁCH CHẤM CÔNG TOÀN CÔNG TY';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E40DF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Filter info
    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `Ngày: ${work_date || 'Tất cả'} | Nhân viên: ${employee_name || 'Tất cả'} | Trạng thái: ${status || 'Tất cả'}`;
    sheet.addRow([]);

    // Header bảng
    const headerRow = sheet.addRow([
      'STT',
      'Tên nhân viên',
      'Ngày',
      'Check-in',
      'Check-out',
      'Tổng giờ',
      'Trạng thái',
      'Muộn (phút)',
      'Ghi chú',
    ]);

    // Style header
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Dữ liệu
    rows.forEach((row: any, idx: number) => {
      const statusText =
        row.status === 'late'
          ? 'Đi muộn'
          : row.status === 'present'
            ? 'Có mặt'
            : 'Vắng';

      sheet.addRow([
        idx + 1,
        row.employee_name,
        formatDate(row.work_date),
        row.check_in ? new Date(row.check_in).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--',
        row.check_out ? new Date(row.check_out).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--',
        row.total_hours ? Number(row.total_hours).toFixed(1) : '--',
        statusText,
        row.late_minutes > 0 ? row.late_minutes : '',
        row.note || '',
      ]);
    });

    // Style dữ liệu
    const dataStartRow = 5;
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

        // Color by status
        if (colNumber === 7) {
          const val = cell.value;
          if (val === 'Đi muộn') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE6A5' } };
            cell.font = { color: { argb: 'FFCA8A04' }, bold: true };
          } else if (val === 'Vắng') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
            cell.font = { color: { argb: 'FFDC2626' }, bold: true };
          } else if (val === 'Có mặt') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
            cell.font = { color: { argb: 'FF16A34A' } };
          }
        }
      });
    }

    // Độ rộng cột
    sheet.columns = [
      { width: 6 },
      { width: 20 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 15 },
      { width: 14 },
      { width: 25 },
    ];

    // Gửi file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="danh-sach-cham-cong-${new Date().toISOString().slice(0, 10)}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Cập nhật chấm công (admin)
export const updateAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, status, late_minutes, total_hours, note } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID bản ghi không hợp lệ' });
    }

    const updated = await updateAttendanceRecord(id, {
      check_in: check_in || undefined,
      check_out: check_out || undefined,
      status,
      late_minutes,
      total_hours,
      note,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
    }

    return res.json({
      message: 'Cập nhật thành công',
      attendance: updated,
    });
  } catch (err) {
    console.error('Lỗi cập nhật chấm công:', err);
    next(err);
  }
};
