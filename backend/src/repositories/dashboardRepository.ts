import { query } from '../config/db';

// Lấy tổng số nhân viên
export const getTotalEmployees = async () => {
  const res = await query('SELECT COUNT(*) AS count FROM users WHERE role = $1', ['employee']);
  return Number(res.rows[0]?.count ?? 0);
};

// Lấy số nhân viên đã chấm công hôm nay (theo giờ Việt Nam)
export const getCheckedInToday = async () => {
  
  // Get current date in Vietnam timezone (formatted as YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  const res = await query(`
    SELECT COUNT(DISTINCT user_id) AS count
    FROM attendance 
    WHERE work_date::text LIKE $1 || '%'
    AND check_in IS NOT NULL
  `, [today]);
  
  return Number(res.rows[0]?.count ?? 0);
};

// Lấy số nhân viên đi muộn hôm nay (theo giờ Việt Nam)
export const getLateToday = async () => {
  
  // Get current date in Vietnam timezone (formatted as YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  const res = await query(`
    SELECT COUNT(*) AS count
    FROM attendance 
    WHERE work_date::text LIKE $1 || '%'
    AND status = 'late'
  `, [today]);
  
  return Number(res.rows[0]?.count ?? 0);
};

// Lấy giờ làm trung bình hôm nay (theo giờ Việt Nam)
export const getAverageHoursToday = async () => {
  
  // Get current date in Vietnam timezone (formatted as YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  const res = await query(`
    SELECT ROUND(AVG(CAST(total_hours AS FLOAT))::numeric, 2) AS avg_hours
    FROM attendance 
    WHERE work_date::text LIKE $1 || '%'
    AND total_hours IS NOT NULL
  `, [today]);
  const avgHours = res.rows[0]?.avg_hours ? Number(res.rows[0].avg_hours).toFixed(1) : '0';
  
  return avgHours;
};

// Lấy dữ liệu giờ làm trung bình theo ngày trong tuần (7 ngày gần đây)
export const getHoursByDay = async () => {
  // Tính 7 ngày gần đây (từ 6 ngày trước đến hôm nay)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  const res = await query(`
    SELECT 
      CASE 
        WHEN EXTRACT(DOW FROM (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) = 0 THEN 'CN'
        WHEN EXTRACT(DOW FROM (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) = 1 THEN 'Thứ 2'
        WHEN EXTRACT(DOW FROM (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) = 2 THEN 'Thứ 3'
        WHEN EXTRACT(DOW FROM (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) = 3 THEN 'Thứ 4'
        WHEN EXTRACT(DOW FROM (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) = 4 THEN 'Thứ 5'
        WHEN EXTRACT(DOW FROM (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) = 5 THEN 'Thứ 6'
        WHEN EXTRACT(DOW FROM (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) = 6 THEN 'Thứ 7'
      END AS day,
      ROUND(AVG(CAST(total_hours AS FLOAT))::NUMERIC, 2)::FLOAT AS hours,
      (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date as date_val
    FROM attendance
    WHERE work_date::text >= $1
    AND total_hours IS NOT NULL
    GROUP BY (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
    ORDER BY (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ASC
  `, [startDate]);
  
  // Tạo map dữ liệu từ DB theo ngày
  const dataMap = new Map<string, { day: string; hours: number }>();
  res.rows.forEach((row: any) => {
    dataMap.set(row.date_val.toISOString().split('T')[0], {
      day: row.day,
      hours: row.hours || 0,
    });
  });
  
  // Tạo danh sách 7 ngày đầy đủ
  const result = [];
  const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - (6 - i));
    const dateStr = currentDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const dayOfWeek = currentDate.getDay();
    const dayName = dayNames[dayOfWeek];
    
    // Lấy dữ liệu từ map hoặc dùng giá trị mặc định
    const data = dataMap.get(dateStr) || { day: dayName, hours: 0 };
    result.push({
      day: dayName,
      hours: data.hours,
      date_val: dateStr,
    });
  }
  
  return result;
};

// Lấy tỉ lệ chấm công (có mặt, đi muộn, nghỉ phép) trong 30 ngày gần đây
// KHÔNG tính absent vì: absent = không có ý nghĩa thống kê
export const getAttendanceRatio = async () => {
  const res = await query(`
    SELECT 
      CASE 
        WHEN status = 'on_leave' THEN 'on_leave'
        WHEN status = 'late' THEN 'late'
        ELSE 'present'
      END as status_final,
      COUNT(*) AS count
    FROM attendance
    WHERE (work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date 
          BETWEEN (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh') - INTERVAL '29 days'
              AND (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh')
    AND status != 'absent'
    GROUP BY status_final
  `);
  
  const data = res.rows;
  const total = data.reduce((sum, row) => sum + Number(row.count), 0);
  
  return data.map(row => ({
    status: row.status_final,
    count: Number(row.count),
    percentage: total > 0 ? Math.round((Number(row.count) / total) * 100) : 0,
  }));
};

// Lấy hoạt động gần đây (10 bản ghi check-in gần nhất)
export const getRecentActivity = async (limit = 10) => {
  const res = await query(`
    SELECT 
      a.id,
      u.full_name as employee_name,
      d.name as department,
      a.work_date,
      a.check_in,
      a.status,
      a.late_minutes,
      a.created_at
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE a.check_in IS NOT NULL
    ORDER BY a.created_at DESC
    LIMIT $1
  `, [limit]);
  
  return res.rows;
};
