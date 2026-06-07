/**
 * pool.ts
 *
 * Shared MySQL connection pool for the backend, configured from
 * environment variables (with local-dev defaults) via `dotenv`.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'campus_park_2_path',
  waitForConnections: true,
  connectionLimit: 10,
});
