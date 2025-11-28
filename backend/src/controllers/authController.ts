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
  const user = await findUserByEmail(email);
  // Kiểm tra xem người dùng có tồn tại không
  if (!user) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

  if (!user.password) return res.status(401).json({ message: 'Tài khoản không có mật khẩu' });

  // So sánh mật khẩu
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });

  // Tạo access token và refresh token
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });

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