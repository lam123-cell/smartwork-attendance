import { query } from '../config/db';
import { logActivity } from '../utils/logger';

export const runAutoCheckout = async () => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const autoTime = new Date();
  autoTime.setUTCHours(10, 0, 0, 0); // 17:00 giờ VN (UTC+7 = UTC 10:00)

  try {
    const res = await query(`
      SELECT id, user_id, check_in 
      FROM attendance
      WHERE work_date = $1 
        AND check_in IS NOT NULL 
        AND check_out IS NULL
        AND is_auto_checkout = FALSE
    `, [today]);

    for (const row of res.rows) {
      const checkIn = new Date(row.check_in);
      const diffMs = autoTime.getTime() - checkIn.getTime();
      const hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

      await query(`
        UPDATE attendance 
        SET check_out = $1,
            total_hours = $2,
            is_auto_checkout = TRUE,
            updated_at = NOW()
        WHERE id = $3
      `, [autoTime.toISOString(), hours, row.id]);

      // Log activity
      await logActivity(
        row.user_id,
        'ATTENDANCE_AUTO_CHECKOUT',
        `Tự động check-out lúc 17:00 - Tổng ${hours} giờ`,
        'attendance',
        row.id
      );
    }
    console.log(`Auto checkout: ${res.rows.length} records.`);
  } catch (err) {
    console.error('Auto checkout failed:', err);
  }
};