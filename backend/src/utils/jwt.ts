import jwt from 'jsonwebtoken';

//Đọc các biến môi trường từ process.env
const ACCESS_SECRET = process.env.JWT_SECRET || 'replace_this_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'replace_this_refresh_secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRATION || '7d';

//Tạo access token
export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, ACCESS_SECRET as any, { expiresIn: ACCESS_EXPIRES } as any);
};

//Tạo refresh token
export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, REFRESH_SECRET as any, { expiresIn: REFRESH_EXPIRES } as any);
};

//Xác thực access token
export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as any;
  } catch (err) {
    return null;
  }
};

//Xác thực refresh token
export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as any;
  } catch (err) {
    return null;
  }
};

