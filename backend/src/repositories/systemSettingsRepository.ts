import { query } from '../config/db';

export type SettingRow = {
  id: number;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  company_logo: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  max_distance_meters: number | null;
  auto_alert_violation: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type ShiftRow = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  late_threshold_minutes: number | null;
  early_leave_minutes: number | null;
  is_active: boolean;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

const ensureSettingsRow = async (): Promise<SettingRow> => {
  const existing = await query('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
  if (existing.rows[0]) return existing.rows[0] as SettingRow;

  const inserted = await query(
    `INSERT INTO settings (company_name, auto_alert_violation)
     VALUES ($1, $2) RETURNING *`,
    ['Công ty', true]
  );
  return inserted.rows[0] as SettingRow;
};

export const getSettings = async (): Promise<SettingRow> => {
  return await ensureSettingsRow();
};

export const updateSettings = async (data: Partial<SettingRow>): Promise<SettingRow> => {
  const current = await ensureSettingsRow();
  const allowed: (keyof SettingRow)[] = [
    'company_name',
    'company_email',
    'company_phone',
    'company_address',
    'company_logo',
    'gps_latitude',
    'gps_longitude',
    'max_distance_meters',
    'auto_alert_violation',
  ];

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = $${idx}`);
      // @ts-ignore dynamic access
      values.push((data as any)[key]);
      idx++;
    }
  }

  if (fields.length === 0) return current;

  values.push(current.id);
  const res = await query(
    `UPDATE settings SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
    values
  );
  return res.rows[0] as SettingRow;
};

export const listShifts = async (activeOnly = true): Promise<ShiftRow[]> => {
  const res = await query(
    activeOnly
      ? 'SELECT * FROM shifts WHERE is_active = true ORDER BY start_time'
      : 'SELECT * FROM shifts ORDER BY start_time'
  );
  return res.rows as ShiftRow[];
};

export const createShift = async (data: Partial<ShiftRow>): Promise<ShiftRow> => {
  const res = await query(
    `INSERT INTO shifts (name, start_time, end_time, late_threshold_minutes, early_leave_minutes, is_active, description)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, true), $7)
     RETURNING *`,
    [
      data.name,
      data.start_time,
      data.end_time,
      data.late_threshold_minutes ?? 15,
      data.early_leave_minutes ?? 10,
      data.is_active ?? true,
      data.description ?? null,
    ]
  );
  return res.rows[0] as ShiftRow;
};

export const updateShift = async (id: string, data: Partial<ShiftRow>): Promise<ShiftRow | null> => {
  const allowed: (keyof ShiftRow)[] = [
    'name',
    'start_time',
    'end_time',
    'late_threshold_minutes',
    'early_leave_minutes',
    'is_active',
    'description',
  ];
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`${key} = $${idx}`);
      // @ts-ignore
      values.push((data as any)[key]);
      idx++;
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  const res = await query(
    `UPDATE shifts SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
    values
  );
  return res.rows[0] as ShiftRow;
};

export const deactivateShift = async (id: string): Promise<ShiftRow | null> => {
  const res = await query(
    `UPDATE shifts SET is_active = false, updated_at = now() WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.rows[0] as ShiftRow;
};
