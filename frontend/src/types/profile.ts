export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  position?: string | null;
  avatar_url?: string | null;
  employee_code?: string | null;
  start_date?: string | null;
  work_days_this_month?: number | null;
  department_name?: string | null;
  department_id?: string | null;
  total_hours?: number | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  
}

export interface ProfileResponse {
  user: Profile;
}

export interface Activity {
  id: string;
  action_type?: string;
  action?: string;
  description?: string;
  entity_type?: string;
  entity_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status?: string | null;
  device_info?: any;
  created_at: string;
}

export interface ActivitiesResponse {
  items: Activity[];
}

export interface AvatarUploadResponse {
  message: string;
  url: string;
  user?: Profile;
}

export interface UpdateProfileResponse {
  message: string;
  user?: Profile;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
}

export interface DepartmentsResponse {
  items: Department[];
}
