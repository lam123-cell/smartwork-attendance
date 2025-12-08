export interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  department_id?: string;
  department_name?: string;
  position?: string;
  employee_code?: string;
  start_date?: string;
  role: 'employee' | 'admin';
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  locked: number;
}

export interface EmployeesResponse {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeStatsResponse {
  total: number;
  active: number;
  locked: number;
}

export interface CreateEmployeeRequest {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  department_id?: string;
  position?: string;
  employee_code?: string;
  start_date?: string;
  avatar_url?: string;
  role?: 'employee' | 'admin';
}

export interface UpdateEmployeeRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  department_id?: string;
  position?: string;
  employee_code?: string;
  start_date?: string;
  avatar_url?: string;
  role?: 'employee' | 'admin';
}

export interface CreateEmployeeResponse {
  message: string;
  employee: Employee;
}

export interface UpdateEmployeeResponse {
  message: string;
  employee: Employee;
}

export interface ToggleStatusResponse {
  message: string;
  employee: Employee;
}

export interface DeleteEmployeeResponse {
  message: string;
}
