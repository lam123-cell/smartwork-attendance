import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import bcrypt from 'bcryptjs';
import { logActivity } from '../utils/logger';

// GET /api/v1/employees - List employees with pagination and search
export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search = '', page = '1', limit = '10', status = '', department_id = '' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause = "WHERE u.role = 'employee'";
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR d.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status === 'active') {
      whereClause += ` AND u.is_active = true`;
    } else if (status === 'locked') {
      whereClause += ` AND u.is_active = false`;
    }

    if (department_id) {
      whereClause += ` AND u.department_id = $${paramIndex}`;
      params.push(department_id);
      paramIndex++;
    }

    const sql = `
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.employee_code, u.position, 
        u.avatar_url, u.is_active, u.start_date, u.address, u.date_of_birth,
        u.created_at, u.updated_at,
        d.id as department_id, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit as string), offset);

    const countSql = `SELECT COUNT(*) FROM users u LEFT JOIN departments d ON u.department_id = d.id ${whereClause}`;
    const [dataRes, countRes] = await Promise.all([
      query(sql, params.slice(0, -2).concat(params.slice(-2))),
      query(countSql, params.slice(0, -2))
    ]);

    const total = parseInt(countRes.rows[0]?.count || '0', 10);
    const employees = dataRes.rows.map(row => {
      const { password, ...safe } = row as any;
      return safe;
    });

    return res.json({
      items: employees,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/employees/stats - Get employee statistics
export const getEmployeeStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) FILTER (WHERE role = 'employee') as total,
        COUNT(*) FILTER (WHERE role = 'employee' AND is_active = true) as active,
        COUNT(*) FILTER (WHERE role = 'employee' AND is_active = false) as locked
      FROM users
    `;
    const result = await query(sql);
    const stats = result.rows[0] || { total: 0, active: 0, locked: 0 };
    return res.json(stats);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/employees - Create new employee
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user.id;
    const { full_name, email, password, phone, department_id, position, employee_code, start_date, address, date_of_birth, avatar_url } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ message: 'Tên và email là bắt buộc' });
    }

    // Check if email exists
    const existCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);

    const sql = `
      INSERT INTO users (full_name, email, password, phone, department_id, position, employee_code, start_date, address, date_of_birth, avatar_url, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'employee', true)
      RETURNING *
    `;
    const result = await query(sql, [full_name, email, hashedPassword, phone || null, department_id || null, position || null, employee_code || null, start_date || null, address || null, date_of_birth || null, avatar_url || null]);
    const newEmployee = result.rows[0];

    // Log activity
    try {
      await logActivity(adminId, 'EMPLOYEE_CREATE', `Tạo nhân viên mới: ${full_name}`, 'employee', newEmployee.id, req.ip, req.get('user-agent'));
    } catch (e) {}

    const { password: _, ...safe } = newEmployee;
    return res.status(201).json({ message: 'Tạo nhân viên thành công', employee: safe });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/employees/:id - Update employee
export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user.id;
    const { id } = req.params;
    const { full_name, phone, department_id, position, employee_code, start_date, address, date_of_birth, avatar_url } = req.body;

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (full_name !== undefined) { sets.push(`full_name = $${idx++}`); vals.push(full_name); }
    if (phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(phone); }
    if (department_id !== undefined) { sets.push(`department_id = $${idx++}`); vals.push(department_id); }
    if (position !== undefined) { sets.push(`position = $${idx++}`); vals.push(position); }
    if (employee_code !== undefined) { sets.push(`employee_code = $${idx++}`); vals.push(employee_code); }
    if (start_date !== undefined) { sets.push(`start_date = $${idx++}`); vals.push(start_date); }
    if (address !== undefined) { sets.push(`address = $${idx++}`); vals.push(address); }
    if (date_of_birth !== undefined) { sets.push(`date_of_birth = $${idx++}`); vals.push(date_of_birth); }
    if (avatar_url !== undefined) { sets.push(`avatar_url = $${idx++}`); vals.push(avatar_url); }

    if (sets.length === 0) {
      return res.status(400).json({ message: 'Không có trường nào để cập nhật' });
    }

    sets.push(`updated_at = NOW()`);
    vals.push(id);
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} AND role = 'employee' RETURNING *`;
    const result = await query(sql, vals);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    // Log activity
    try {
      await logActivity(adminId, 'EMPLOYEE_UPDATE', `Cập nhật thông tin nhân viên: ${result.rows[0].full_name}`, 'employee', id, req.ip, req.get('user-agent'));
    } catch (e) {}

    const { password: _, ...safe } = result.rows[0];
    return res.json({ message: 'Cập nhật thành công', employee: safe });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/employees/:id/toggle-status - Lock/Unlock employee
export const toggleEmployeeStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user.id;
    const { id } = req.params;

    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 AND role = 'employee' RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    const employee = result.rows[0];
    const action = employee.is_active ? 'Mở khóa' : 'Khóa';

    // Log activity
    try {
      await logActivity(adminId, 'EMPLOYEE_STATUS_CHANGE', `${action} tài khoản nhân viên: ${employee.full_name}`, 'employee', id, req.ip, req.get('user-agent'));
    } catch (e) {}

    const { password: _, ...safe } = employee;
    return res.json({ message: `${action} tài khoản thành công`, employee: safe });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/employees/:id - Delete employee
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).user.id;
    const { id } = req.params;

    const employee = await query('SELECT full_name FROM users WHERE id = $1 AND role = $2', [id, 'employee']);
    if (employee.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    // Log activity
    try {
      await logActivity(adminId, 'EMPLOYEE_DELETE', `Xóa nhân viên: ${employee.rows[0].full_name}`, 'employee', id, req.ip, req.get('user-agent'));
    } catch (e) {}

    return res.json({ message: 'Xóa nhân viên thành công' });
  } catch (err) {
    next(err);
  }
};
