import { Request, Response, NextFunction } from 'express';
import {
  getSettings,
  updateSettings,
  listShifts,
  createShift,
  updateShift,
  deactivateShift,
} from '../repositories/systemSettingsRepository';

const isValidTime = (value?: string) => !!value && /^\d{2}:\d{2}$/.test(value);

export const getSystemSettingsController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettings();
    return res.json({ settings });
  } catch (err) {
    next(err);
  }
};

export const updateSystemSettingsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body || {};
    const updated = await updateSettings({
      company_name: payload.company_name,
      company_email: payload.company_email,
      company_phone: payload.company_phone,
      company_address: payload.company_address,
      company_logo: payload.company_logo,
      gps_latitude: payload.gps_latitude,
      gps_longitude: payload.gps_longitude,
      max_distance_meters: payload.max_distance_meters,
      auto_alert_violation: payload.auto_alert_violation,
    });
    return res.json({ settings: updated });
  } catch (err) {
    next(err);
  }
};

export const listShiftsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.activeOnly === undefined ? true : String(req.query.activeOnly) !== 'false';
    const shifts = await listShifts(activeOnly);
    return res.json({ shifts });
  } catch (err) {
    next(err);
  }
};

export const createShiftController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, start_time, end_time, late_threshold_minutes, early_leave_minutes, is_active, description } = req.body || {};
    if (!name || !isValidTime(start_time) || !isValidTime(end_time)) {
      return res.status(400).json({ message: 'name, start_time, end_time là bắt buộc (định dạng HH:MM)' });
    }
    const shift = await createShift({
      name,
      start_time,
      end_time,
      late_threshold_minutes,
      early_leave_minutes,
      is_active,
      description,
    });
    return res.status(201).json({ shift });
  } catch (err) {
    next(err);
  }
};

export const updateShiftController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, start_time, end_time, late_threshold_minutes, early_leave_minutes, is_active, description } = req.body || {};
    if (start_time && !isValidTime(start_time)) {
      return res.status(400).json({ message: 'start_time phải định dạng HH:MM' });
    }
    if (end_time && !isValidTime(end_time)) {
      return res.status(400).json({ message: 'end_time phải định dạng HH:MM' });
    }
    const shift = await updateShift(id, {
      name,
      start_time,
      end_time,
      late_threshold_minutes,
      early_leave_minutes,
      is_active,
      description,
    });
    if (!shift) {
      return res.status(404).json({ message: 'Không tìm thấy ca làm' });
    }
    return res.json({ shift });
  } catch (err) {
    next(err);
  }
};

export const deleteShiftController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shift = await deactivateShift(id);
    if (!shift) {
      return res.status(404).json({ message: 'Không tìm thấy ca làm' });
    }
    return res.json({ shift });
  } catch (err) {
    next(err);
  }
};
