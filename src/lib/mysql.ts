import mysql from 'mysql2/promise';

type MysqlEnv = {
  MYSQL_HOST?: string;
  MYSQL_PORT?: string;
  MYSQL_DATABASE?: string;
  MYSQL_USER?: string;
  MYSQL_PASSWORD?: string;
  VITE_MYSQL_HOST?: string;
  VITE_MYSQL_PORT?: string;
  VITE_MYSQL_DATABASE?: string;
  VITE_MYSQL_USER?: string;
  VITE_MYSQL_PASSWORD?: string;
};

function readEnv(): MysqlEnv {
  if (typeof process !== 'undefined' && process.env) {
    return process.env as MysqlEnv;
  }

  return (import.meta as any)?.env ?? {};
}

export function getMysqlConfig() {
  const env = readEnv();

  return {
    host: env.MYSQL_HOST || env.VITE_MYSQL_HOST || 'localhost',
    port: Number(env.MYSQL_PORT || env.VITE_MYSQL_PORT || 3306),
    user: env.MYSQL_USER || env.VITE_MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || env.VITE_MYSQL_PASSWORD || '',
    database: env.MYSQL_DATABASE || env.VITE_MYSQL_DATABASE || 'pcshsksn_ps',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00',
  };
}

export async function getMysqlConnection() {
  return mysql.createPool(getMysqlConfig());
}

export async function testMysqlConnection() {
  const pool = await getMysqlConnection();
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows;
}
