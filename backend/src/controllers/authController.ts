import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createUser, findUserByEmail, findUserById } from '../repositories/userRepository';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

// Schema cho register (match DB, role enum)
const registerSchema = z.object({
  full_name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'employee']).optional().default('employee'), // default employee, không cho frontend set tự do
});

// Schema cho login
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu bắt buộc'),
  remember: z.boolean().optional().default(false),
});

export const register = async (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: parseResult.error.format() });
  }

  const { full_name, email, password, phone, role } = parseResult.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email đã được sử dụng' });
  }

  // Hash mật khẩu trước khi lưu
  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser({ full_name, email, password: hashed, role, phone });

  // Lấy thông tin user đầy đủ
  const fullUser = await findUserById(user.id);

  // Tạo access token và refresh token
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id });

  // Đặt Refresh Token vào httpOnly cookie (thêm sameSite: 'strict' cho bảo mật)
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });

  // Loại bỏ mật khẩu trước khi gửi về client
  if (fullUser && (fullUser as any).password) delete (fullUser as any).password;

  return res.status(201).json({
    message: 'Đăng ký thành công',
    user: fullUser,
    accessToken,
  });
};

export const login = async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: parseResult.error.format() });
  }

  const { email, password } = parseResult.data;
  const { remember } = parseResult.data;
  const user = await findUserByEmail(email);
  // Kiểm tra xem người dùng có tồn tại không
  if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

  // Từ chối đăng nhập nếu tài khoản đã bị khóa
  if (user.is_active === false) {
    return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa hãy liên hệ quản trị viên' });
  }

  if (!user.password) return res.status(401).json({ message: 'Tài khoản không có mật khẩu' });

  // So sánh mật khẩu
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

  // Tạo access token và refresh token
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id });

  // If remember is true, set persistent cookie according to JWT_REFRESH_EXPIRATION
  try {
    if (remember) {
      const raw = process.env.JWT_REFRESH_EXPIRATION || '7d';
      // simple parser for formats like '7d', '24h', '15m', '30s'
      const num = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 7;
      const unit = raw.replace(/[^a-zA-Z]/g, '') || 'd';
      let maxAge = 7 * 24 * 60 * 60 * 1000; // default 7 days
      if (unit === 'd') maxAge = num * 24 * 60 * 60 * 1000;
      else if (unit === 'h') maxAge = num * 60 * 60 * 1000;
      else if (unit === 'm') maxAge = num * 60 * 1000;
      else if (unit === 's') maxAge = num * 1000;

      res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', maxAge });
    } else {
      // session cookie (cleared when browser closed)
      res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
    }
  } catch (e) {
    // fallback to session cookie
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
  }

  // Loại bỏ mật khẩu trước khi gửi về client
  const safeUser = { ...user } as any;
  if (safeUser.password) delete safeUser.password;

  return res.json({
    message: 'Đăng nhập thành công',
    user: safeUser,
    accessToken,
  });
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');// Xoá cookie refresh token
  return res.json({ message: 'Đã đăng xuất' });
};