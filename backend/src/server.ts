import app from './app';
import { config } from './config';
import { connectDB } from './config/db';

// Khơi động server
const startServer = async () => {
  try {
    // Kết nối đến cơ sở dữ liệu
    await connectDB();

    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${config.env}`);
      console.log(`API Base URL: http://localhost:${PORT}${config.apiPrefix}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);// Thoát quá trình với mã lỗi 1
  }
};

startServer();
