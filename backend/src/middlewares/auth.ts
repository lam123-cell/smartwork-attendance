import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { findUserById } from '../repositories/userRepository';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = (req as any).cookies?.token;
    // Ưu tiên token từ Authorization header (Bearer)
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;
    if (!token) return res.status(401).json({ message: 'Yêu cầu đăng nhập' });

    // Xác minh token
    const payload = verifyAccessToken(token);
    if (!payload) return res.status(401).json({ message: 'Token không hợp lệ' });

    const user = await findUserById((payload as any).sub);
    if (!user) return res.status(401).json({ message: 'Người dùng không tồn tại' });

    // Gắn thông tin người dùng vào request để sử dụng trong các middleware/route sau
    (req as any).user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

//Hàm tạo ra middleware kiểm tra vai trò người dùng
export const requireRole = (roles: string | string[]) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    // Kiểm tra xem đã có thông tin user từ requireAuth chưa
    if (!user) return res.status(401).json({ message: 'Yêu cầu đăng nhập' });
    // Kiểm tra vai trò của người dùng có nằm trong danh sách được phép không
    if (!allowed.includes(user.role)) return res.status(403).json({ message: 'Không có quyền truy cập' });
    next();
  };
};

// Middleware kiểm tra quyền admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Yêu cầu đăng nhập' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin có thể truy cập' });
  next();
};
