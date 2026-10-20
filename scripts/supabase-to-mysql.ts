import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'naruephat',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'pcshsksn_ps',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function ensureTable(tableName: string, columnsSql: string) {
  await mysqlPool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnsSql})`);
}

async function fetchAll(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) throw error;
  return data ?? [];
}

async function upsertMany(tableName: string, rows: Record<string, any>[]) {
  if (!rows.length) return;

  const keys = Object.keys(rows[0]);
  const columns = keys.map((key) => `\`${key}\``).join(', ');
  const valuesPlaceholder = rows
    .map(() => `(${keys.map(() => '?').join(', ')})`)
    .join(', ');

  const flatValues = rows.flatMap((row) => keys.map((key) => row[key] ?? null));

  await mysqlPool.query(
    `INSERT INTO \`${tableName}\` (${columns}) VALUES ${valuesPlaceholder} ON DUPLICATE KEY UPDATE ${keys
      .map((key) => `\`${key}\` = VALUES(\`${key}\`)`)
      .join(', ')}`,
    flatValues,
  );
}

async function migrateTable(tableName: string, schema: string) {
  await ensureTable(tableName, schema);
  const rows = await fetchAll(tableName);
  if (rows.length) await upsertMany(tableName, rows);
  console.log(`Migrated ${rows.length} rows to ${tableName}`);
}

async function main() {
  await migrateTable(
    'teachers',
    `
      Teacher_ID VARCHAR(50) PRIMARY KEY,
      Name TEXT,
      Email TEXT,
      Pass TEXT,
      Learning_Area TEXT,
      photo TEXT,
      national_id VARCHAR(50),
      phone VARCHAR(50),
      signature_url TEXT,
      birth_date VARCHAR(50),
      position TEXT,
      academic_standing TEXT,
      department TEXT,
      role VARCHAR(30),
      created_at TIMESTAMP NULL,
      updated_at TIMESTAMP NULL
    `,
  );

  await migrateTable(
    'lesson_plans',
    `
      id VARCHAR(100) PRIMARY KEY,
      teacher_id VARCHAR(50),
      teacher_name TEXT,
      teacher_photo TEXT,
      learning_area TEXT,
      subject_code VARCHAR(50),
      subject_name TEXT,
      grade_level VARCHAR(50),
      semester VARCHAR(20),
      academic_year VARCHAR(20),
      plan_title TEXT,
      plan_type TEXT,
      total_hours INT,
      file_url TEXT,
      file_name TEXT,
      file_size VARCHAR(50),
      notes TEXT,
      submitted_at TIMESTAMP NULL,
      status VARCHAR(30),
      reviewed_by VARCHAR(50),
      reviewer_name TEXT,
      reviewed_at TIMESTAMP NULL,
      review_comment TEXT,
      rubric_scores JSON,
      total_score DECIMAL(10,2),
      is_late BOOLEAN,
      submission_delay_text TEXT,
      deadline_at TEXT,
      admin_notes TEXT
    `,
  );

  await migrateTable(
    'system_settings',
    `
      key_name VARCHAR(100) PRIMARY KEY,
      value JSON,
      updated_at TIMESTAMP NULL
    `,
  );

  await migrateTable(
    'assignment_submissions',
    `
      id VARCHAR(100) PRIMARY KEY,
      assignment_id VARCHAR(100),
      assignment_name TEXT,
      teacher_id VARCHAR(50),
      teacher_name TEXT,
      learning_area TEXT,
      submitted_at TIMESTAMP NULL,
      status VARCHAR(50),
      answers JSON,
      attachments JSON,
      is_late BOOLEAN,
      submission_delay_text TEXT,
      reviewed_by VARCHAR(50),
      reviewer_name TEXT,
      reviewed_at TIMESTAMP NULL,
      review_comment TEXT,
      admin_notes TEXT
    `,
  );

  console.log('Supabase to MySQL migration completed.');
  await mysqlPool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
