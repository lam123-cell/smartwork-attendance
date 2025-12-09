import { query } from '../config/db';

export type DepartmentRow = {
  id: string;
  name: string;
};

// Hàm định dạng khoảng thời gian từ tháng
const formatRange = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: toIso(start), to: toIso(end) };
};

export const getDepartments = async (): Promise<DepartmentRow[]> => {
  const res = await query('SELECT id, name FROM departments ORDER BY name');
  return res.rows;
};

// Lấy thống kê báo cáo theo tháng và phòng ban
export const getReportStats = async (month: string, departmentId: string | null) => {
  const { from, to } = formatRange(month);
  const res = await query(
    `SELECT 
        COUNT(DISTINCT u.id) AS employee_count,
        COALESCE(SUM(a.total_hours), 0) AS total_hours,
        COALESCE(SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END), 0) AS late_count
     FROM users u
     LEFT JOIN attendance a ON a.user_id = u.id
       AND (a.work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $1 AND $2
     WHERE u.role = 'employee'
       AND ($3::text IS NULL OR u.department_id = $3::uuid)` ,
    [from, to, departmentId]
  );
  const row = res.rows[0];
  return {
    employeeCount: Number(row?.employee_count ?? 0),
    totalHours: Number(row?.total_hours ?? 0),
    lateCount: Number(row?.late_count ?? 0),
  };
};

// Lấy giờ làm việc theo phòng ban trong tháng
export const getHoursByDepartment = async (month: string, departmentId: string | null) => {
  const { from, to } = formatRange(month);
  const res = await query(
    `SELECT 
        d.id,
        d.name,
        COALESCE(SUM(a.total_hours), 0) AS hours
     FROM departments d
     LEFT JOIN users u ON u.department_id = d.id
     LEFT JOIN attendance a ON a.user_id = u.id
       AND (a.work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $1 AND $2
     WHERE ($3::text IS NULL OR d.id = $3::uuid)
     GROUP BY d.id, d.name
     ORDER BY hours DESC`
    , [from, to, departmentId]
  );
  return res.rows.map(r => ({
    id: r.id,
    department: r.name,
    hours: Number(r.hours ?? 0),
  }));
};

// Lấy tỉ lệ chấm công trong tháng theo phòng ban
export const getAttendanceRatioForMonth = async (month: string, departmentId: string | null) => {
  const { from, to } = formatRange(month);
  const res = await query(
    `SELECT a.status, COUNT(*) AS count
     FROM attendance a
     JOIN users u ON u.id = a.user_id
     WHERE (a.work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $1 AND $2
       AND ($3::text IS NULL OR u.department_id = $3::uuid)
     GROUP BY a.status`,
    [from, to, departmentId]
  );
  return res.rows.map(r => ({ status: r.status, count: Number(r.count ?? 0) }));
};

// Lấy báo cáo chi tiết nhân viên trong tháng
export const getDetailedEmployeeReport = async (month: string, departmentId: string | null) => {
  const { from, to } = formatRange(month);
  const res = await query(
    `SELECT 
        u.id,
        u.full_name,
        d.name AS department,
        COUNT(a.id) AS work_days,
        COALESCE(SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END), 0) AS late_days,
        COALESCE(SUM(a.total_hours), 0) AS total_hours
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN attendance a ON a.user_id = u.id 
       AND (a.work_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN $1 AND $2
     WHERE u.role = 'employee'
       AND ($3::text IS NULL OR u.department_id = $3::uuid)
     GROUP BY u.id, u.full_name, d.name
     HAVING COUNT(a.id) > 0
     ORDER BY total_hours DESC, u.full_name ASC`,
    [from, to, departmentId]
  );
  return res.rows.map(r => ({
    id: r.id,
    name: r.full_name,
    department: r.department || 'N/A',
    workDays: Number(r.work_days ?? 0),
    lateDays: Number(r.late_days ?? 0),
    totalHours: Number(r.total_hours ?? 0),
  }));
};
