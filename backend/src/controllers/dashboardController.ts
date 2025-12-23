import { Request, Response, NextFunction } from 'express';
import {
  getTotalEmployees,
  getCheckedInToday,
  getLateToday,
  getAverageHoursToday,
  getHoursByDay,
  getAttendanceRatio,
  getRecentActivity,
} from '../repositories/dashboardRepository';

// Lấy tổng quan dashboard
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    // Debug: lấy tất cả attendance records hôm nay
    const { query: q } = require('../config/db');
    const debugRes = await q(`
      SELECT 
        a.id,
        a.user_id,
        a.work_date,
        a.work_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh' as work_date_vn,
        DATE(a.work_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') as date_vn,
        a.check_in,
        a.status,
        u.full_name
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE DATE(a.work_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') = CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh'
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    
    const [totalEmployees, checkedInToday, lateToday, avgHours] = await Promise.all([
      getTotalEmployees(),
      getCheckedInToday(),
      getLateToday(),
      getAverageHoursToday(),
    ]);

    return res.json({
      stats: {
        totalEmployees,
        checkedInToday,
        lateToday,
        avgHours: parseFloat(avgHours),
      },
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    next(err);
  }
};

// Lấy dữ liệu biểu đồ giờ làm theo ngày
export const getHoursChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const data = await getHoursByDay();

    return res.json({
      data: data.map(row => ({
        day: row.day,
        hours: parseFloat(String(row.hours)) || 0,
      })),
    });
  } catch (err) {
    console.error('Error fetching hours chart:', err);
    next(err); 
  }
};

// Lấy dữ liệu biểu đồ tỉ lệ chấm công
export const getAttendanceChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const data = await getAttendanceRatio();

    const statusMap: { [key: string]: string } = {
      present: 'Đúng giờ',
      late: 'Đi muộn',
      on_leave: 'Nghỉ phép',
      absent: 'Vắng mặt',
    };

    const colorMap: { [key: string]: string } = {
      present: '#16A34A',
      late: '#DC2626',
      on_leave: '#8B5CF6',
      absent: '#F59E0B',
    };
    const chartData = data.map(row => ({
      name: statusMap[row.status] || row.status,
      value: row.percentage,
      count: row.count,
      color: colorMap[row.status] || '#6B7280',
    }));

    return res.json({ data: chartData });
  } catch (err) {
    console.error('Error fetching attendance chart:', err);
    next(err);
  }
};

// Lấy hoạt động gần đây
export const getRecentActivityData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const limit = parseInt(String(req.query.limit ?? '10'), 10);
    const activities = await getRecentActivity(limit);

    // Helper format giờ Việt Nam
    const formatVietnamTime = (dateStr: string | null): string => {
      if (!dateStr) return '--';
      const date = new Date(dateStr);
      const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return vnDate.toISOString().slice(11, 16); // HH:mm
    };

    return res.json({
      data: activities.map(activity => ({
        id: activity.id,
        name: activity.employee_name,
        department: activity.department || 'N/A',
        time: formatVietnamTime(activity.check_in),
        status: activity.status === 'late' ? 'late' : 'on-time',
        workDate: activity.work_date,
      })),
    });
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    next(err);
  }
};
