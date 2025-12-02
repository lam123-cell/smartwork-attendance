import { Pool, PoolClient } from 'pg';
import { config } from './index';

//Tùy chọn SSL (chỉ bật cho Supabase)
const sslOption = config.database.host.includes('supabase') ? { rejectUnauthorized: false } : false;

//Tạo pool kết nối PostgreSQL
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 10,// Số kết nối tối đa trong pool
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  //Tương thích với Supabase pooler
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Tùy chọn SSL (chỉ bật cho Supabase)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ssl: sslOption as any,
});

pool.on('error', (err, client) => {
  // Bỏ qua các thông báo ngắt kết nối bình thường
  if (err.message?.includes('termination')) {
    // Silent - this is normal for Supabase pooler
    return;
  }
  console.error('Unexpected error on idle client', err);
});

// Kết nối đến DB và kiểm tra
export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    client.release();// Trả lại client về pool
    console.log('Database connected (pg pool)');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Could not connect to DB, continuing in-memory (if used):', message);
  }
};

// Hàm truy vấn tiện lợi
export const query = async (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Lấy client từ pool để thực hiện nhiều truy vấn trong cùng một transaction
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

export default pool;