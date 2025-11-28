import { query } from '../config/db';

// Định nghĩa kiểu dữ liệu cho một hàng (row) người dùng trong DB
export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  role: string;
  phone?: string;
  department_id?: string | null;
  position?: string | null;
  avatar_url?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const findUserByEmail = async (email: string): Promise<UserRow | null> => {
  const res = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return res.rows[0] ?? null;
};

export const findUserById = async (id: string): Promise<UserRow | null> => {
  const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return res.rows[0] ?? null;
};

// Tạo người dùng mới
export const createUser = async (user: {
  full_name: string;
  email: string;
  password?: string | null;
  role?: string;
  phone?: string | null;
}): Promise<UserRow> => {
  const res = await query(
    `INSERT INTO users (full_name, email, password, role, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user.full_name, user.email, user.password ?? null, user.role ?? 'employee', user.phone ?? null]
  );
  return res.rows[0];
};
