import { Request, Response, NextFunction } from 'express';
import { findTodayByUser, getHistory } from '../repositories/attendanceRepository';
import { query } from '../config/db';

// Tính toán thống kê (dành cho dashboard)
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

// Lấy dữ liệu dashboard tổng hợp
export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const historyLimit = parseInt(String(req.query.historyLimit ?? '7'), 10);

    const today = await findTodayByUser(userId, new Date().toISOString().slice(0,10));
    const history = await getHistory(userId, historyLimit, 0);
    const stats = await computeStatsForUser(userId);

    return res.json({ today: today ? { ...today } : null, history, stats });
  } catch (err) {
    next(err);
  }
};

export default { getDashboard };
