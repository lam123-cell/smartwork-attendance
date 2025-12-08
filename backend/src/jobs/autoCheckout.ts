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
  // → In ra xem thử: 03/12/2025, 17:00:00 → đúng!

  try {
    const res = await query(`
      SELECT id, user_id, check_in 
      FROM attendance
      WHERE work_date = $1 
        AND check_in IS NOT NULL 
        AND check_out IS NULL
        AND is_auto_checkout = FALSE
    `, [todayVn]);

    // Chỉ chạy khi đã qua 17:00 VN
    if (nowVn < autoTimeVn) {
      console.log('Chưa đến 17:00 VN, bỏ qua auto checkout');
      return;
    }

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
  } catch (err) {
    console.error('Auto checkout lỗi:', err);
  }
};