import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const envPort = process.env.DB_PORT;
const envLimit = process.env.DB_CONNECTION_LIMIT;
const port = envPort != null && envPort !== '' ? parseInt(envPort, 10) : 3306;
const connectionLimit =
  envLimit != null && envLimit !== '' && !isNaN(parseInt(envLimit, 10))
    ? Math.max(1, Math.min(100, parseInt(envLimit, 10)))
    : 20;

// Configuration optimisée du pool de connexions (options conformes à mysql2 PoolOptions)
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.isNaN(port) ? 3306 : port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: false,
  decimalNumbers: true,
});
