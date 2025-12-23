// src/app.ts
import 'express-async-errors';//Bắt lỗi bất đồng bộ trong express
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import attendanceAdminRoutes from './routes/attendanceAdmin';
import reportsRoutes from './routes/reports';
import reportAdminRoutes from './routes/reportAdmin';
import profileRoutes from './routes/profile';
import departmentsRoutes from './routes/departments';
import employeesRoutes from './routes/employees';
import dashboardRoutes from './routes/dashboard';
import systemSettingsRoutes from './routes/systemSettings';
import leaveRequestRoutes from './routes/leaveRequests';
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
app.use(express.json({ limit: '50mb' }));// Phân tích JSON trong body của yêu cầu (với giới hạn 50MB)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));// Phân tích URL-encoded data (với giới hạn 50MB)
app.use(cookieParser(process.env.COOKIE_SECRET));// Phân tích cookie với bảo mật

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Định tuyến API
const apiPrefix = config.apiPrefix;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/attendance/admin`, attendanceAdminRoutes);
app.use(`${apiPrefix}/attendance`, attendanceRoutes);
app.use(`${apiPrefix}/reports`, reportsRoutes);
app.use(`${apiPrefix}/reports/admin`, reportAdminRoutes);
app.use(`${apiPrefix}/profile`, profileRoutes);
app.use(`${apiPrefix}/departments`, departmentsRoutes);
app.use(`${apiPrefix}/employees`, employeesRoutes);
app.use(`${apiPrefix}/settings`, systemSettingsRoutes);
app.use(`${apiPrefix}/leave-requests`, leaveRequestRoutes);

// Auto checkout đúng 17:00:00 giờ Việt Nam – dù server ở đâu cũng đúng!
cron.schedule('30 19 * * *', async () => {
  const nowVn = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  console.log(`Bắt đầu Auto Checkout - Hiện tại: ${nowVn}`);
 
  try {
    await runAutoCheckout();
    console.log('Auto Checkout hoàn tất thành công!');
  } catch (error) {
    console.error('Lỗi khi chạy Auto Checkout:', error);
  }
}, {
  timezone: "Asia/Ho_Chi_Minh"  // Bắt buộc phải có dòng này!
});


// Bộ xử lý lỗi toàn cục
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
