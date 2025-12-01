// src/app.ts
import 'express-async-errors';//Bắt lỗi bất đồng bộ trong express
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import cron from 'node-cron';
import { runAutoCheckout } from './jobs/autoCheckout';

const app: Application = express();

// Middlewares
app.use(
  cors({
    // Cấu hình CORS để cho phép frontend truy cập
    origin: config.frontendUrl,
    credentials: true,// Cho phép gửi cookie cùng với yêu cầu
  })
);
app.use(express.json());// Phân tích JSON trong body của yêu cầu
app.use(express.urlencoded({ extended: true }));// Phân tích URL-encoded data
app.use(cookieParser(process.env.COOKIE_SECRET));// Phân tích cookie với bảo mật

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Định tuyến API
const apiPrefix = config.apiPrefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/attendance`, attendanceRoutes);

cron.schedule('0 10 * * *', async () => {
  console.log('Bắt đầu chạy Auto Checkout lúc 17:00:00...');
  try {
    await runAutoCheckout();
    console.log('Auto Checkout hoàn tất thành công.');
  } catch (error) {
    console.error('Lỗi khi chạy Auto Checkout:', error);
  }
});

// Bộ xử lý lỗi toàn cục
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
