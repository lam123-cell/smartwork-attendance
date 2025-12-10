import { query } from '../config/db';
import { logActivity } from '../utils/logger';

export const runAutoCheckout = async () => {
  // Lấy giờ Việt Nam hiện tại
  const nowVn = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const todayVn = nowVn.toISOString().slice(0, 10); // '2025-12-03'

  // Tạo đúng 17:00:00 hôm nay theo giờ Việt Nam
  const autoTimeVn = new Date(`${todayVn}T17:00:00+07:00`);

  // Chuyển về UTC để lưu vào DB (nếu cột là timestamptz)
  const autoTimeForDb = autoTimeVn.toISOString();

  console.log('Auto checkout sẽ diễn ra lúc (giờ VN):', autoTimeVn.toLocaleString('vi-VN'));

  // Chỉ chạy khi đã qua 17:00 VN
  if (nowVn < autoTimeVn) {
    console.log('Chưa đến 17:00 VN, bỏ qua auto checkout');
    return;
  }

  try {
    // ========== Auto checkout cho những người đã check-in nhưng chưa check-out ==========
    const res = await query(`
      SELECT id, user_id, check_in 
      FROM attendance
      WHERE work_date = $1 
        AND check_in IS NOT NULL 
        AND check_out IS NULL
        AND is_auto_checkout = FALSE
    `, [todayVn]);

    for (const row of res.rows) {
      const checkInVn = new Date(row.check_in);
      const diffMs = autoTimeVn.getTime() - checkInVn.getTime();
      const hours = diffMs > 0 ? Number((diffMs / (3600000)).toFixed(2)) : 0;

      await query(`
        UPDATE attendance 
        SET check_out = $1,
            total_hours = $2,
            is_auto_checkout = TRUE,
            updated_at = NOW()
        WHERE id = $3
      `, [autoTimeForDb, hours, row.id]);

      await logActivity(
        row.user_id,
        'ATTENDANCE_AUTO_CHECKOUT',
        `Tự động check-out lúc ${autoTimeVn.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - Tổng ${hours} giờ`,
        'attendance',
        row.id
      );
    }

    console.log(`Auto checkout thành công: ${res.rows.length} bản ghi ngày ${todayVn}`);

    // ========== Mark absent/on_leave cho những nhân viên chưa check-in ==========
    // Lấy danh sách tất cả nhân viên active
    const allEmployees = await query(`
      SELECT id, full_name, email
      FROM users
      WHERE is_active = true AND role = 'employee'
    `);

    // Lấy danh sách nhân viên đã có attendance hôm nay
    const existingAttendance = await query(`
      SELECT DISTINCT user_id
      FROM attendance
      WHERE work_date = $1
    `, [todayVn]);

    const existingUserIds = new Set(existingAttendance.rows.map((r: any) => r.user_id));

    // Xác định xem hôm nay có phải Chủ nhật không
    const dayOfWeek = nowVn.getDay(); // 0 = Chủ nhật, 1-6 = Thứ 2-7
    const isSunday = dayOfWeek === 0;

    let insertedCount = 0;

    for (const emp of allEmployees.rows) {
      // Nếu nhân viên chưa có attendance hôm nay → chèn record
      if (!existingUserIds.has(emp.id)) {
        const status = isSunday ? 'on_leave' : 'absent';
        const note = isSunday ? 'Nghỉ cuối tuần' : 'Vắng mặt';

        await query(`
          INSERT INTO attendance (user_id, work_date, status, note, check_in, check_out, total_hours, is_auto_checkout, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NULL, NULL, 0, FALSE, NOW(), NOW())
        `, [emp.id, todayVn, status, note]);

        await logActivity(
          emp.id,
          'ATTENDANCE_AUTO_MARK',
          `Tự động đánh dấu ${status === 'absent' ? 'vắng mặt' : 'nghỉ cuối tuần'} ngày ${todayVn}`,
          'attendance',
          undefined
        );

        insertedCount++;
      }
    }

    console.log(`Đánh dấu absent/on_leave: ${insertedCount} nhân viên chưa check-in ngày ${todayVn}${isSunday ? ' (Chủ nhật)' : ''}`);

  } catch (err) {
    console.error('Auto checkout/mark absent lỗi:', err);
  }
};