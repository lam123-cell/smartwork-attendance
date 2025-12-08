import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { findUserById, findUserByIdWithDepartment, updateUserProfile, updateUserPassword } from '../repositories/userRepository';
import { query } from '../config/db';
import { logActivity } from '../utils/logger';
import cloudinary from '../config/cloudinary';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const user = await findUserByIdWithDepartment(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const safe = { ...user } as any;
    if (safe.password) delete safe.password;
    return res.json({ user: safe });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const payload = req.body || {};
    // only allow certain fields
    const allowed: any = {
      full_name: payload.full_name,
      phone: payload.phone,
      department_id: payload.department_id,
      position: payload.position,
      avatar_url: payload.avatar_url,
      address: payload.address,
      date_of_birth: payload.date_of_birth,
    };

    const updated = await updateUserProfile(userId, allowed as any);
    // log activity
    try {
      await logActivity(userId, 'PROFILE_UPDATE', 'Cập nhật thông tin cá nhân', 'profile', userId, req.ip, req.get('user-agent') || undefined);
    } catch (e) {
      // ignore logging error
    }

    if (!updated) return res.status(400).json({ message: 'Không có trường hợp hợp lệ để cập nhật' });
    const safe = { ...updated } as any; if (safe.password) delete safe.password;
    return res.json({ message: 'Cập nhật thành công', user: safe });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.password) return res.status(400).json({ message: 'Tài khoản không có mật khẩu' });

    const ok = await bcrypt.compare(String(currentPassword || ''), user.password);
    if (!ok) {
      // log failed attempt
      try { await logActivity(userId, 'PASSWORD_CHANGE', 'Đổi mật khẩu thất bại - mật khẩu hiện tại không đúng', 'password', userId, req.ip, req.get('user-agent') || undefined); } catch(e){}
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(userId, hashed);

    try { await logActivity(userId, 'PASSWORD_CHANGE', 'Đổi mật khẩu thành công', 'password', userId, req.ip, req.get('user-agent') || undefined); } catch(e){}

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    next(err);
  }
};

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const offset = parseInt(String(req.query.offset ?? '0'), 10);
    const q = `SELECT id, action_type, action, description, entity_type, entity_id, ip_address, user_agent, status, device_info, created_at
               FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    const r = await query(q, [userId, limit, offset]);
    return res.json({ items: r.rows });
  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id as string;
    const { image } = req.body || {};
    if (!image || typeof image !== 'string') return res.status(400).json({ message: 'image (dataURL) required' });

    // Optional: basic size check (base64 length)
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ message: 'Invalid image data' });
    const b64 = matches[2];
    const sizeInBytes = Buffer.from(b64, 'base64').length;
    const MAX = 2 * 1024 * 1024; // 2 MB
    if (sizeInBytes > MAX) return res.status(413).json({ message: 'File quá lớn (max 2MB)' });

    // Upload to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder: 'avatars',
      transformation: [{ width: 400, height: 400, crop: 'limit' }],
      resource_type: 'image',
    });

    const url = uploadRes.secure_url;
    // update user profile avatar_url
    const updated = await updateUserProfile(userId, { avatar_url: url } as any);

    try {
      await logActivity(userId, 'AVATAR_UPLOAD', 'Cập nhật ảnh đại diện', 'profile', userId, req.ip, req.get('user-agent') || undefined);
    } catch (e) {}

    const safe = { ...updated } as any; if (safe && safe.password) delete safe.password;
    return res.json({ message: 'Upload thành công', url, user: safe });
  } catch (err) {
    next(err);
  }
};
