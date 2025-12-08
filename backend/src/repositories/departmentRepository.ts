import { query } from '../config/db';

export type DepartmentRow = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
};

export const getAllDepartments = async (): Promise<DepartmentRow[]> => {
  const res = await query('SELECT id, name, description, created_at FROM departments ORDER BY name');
  return res.rows;
};
