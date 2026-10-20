import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '20mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'naruephat',
  password: process.env.MYSQL_PASSWORD || 'bgv3gooll',
  database: process.env.MYSQL_DATABASE || 'pcshsksn_ps',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, mysql: rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

app.get('/api/teachers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM teachers ORDER BY Teacher_ID ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const teacher = req.body;
    const sql = `
      INSERT INTO teachers (
        Teacher_ID, Name, Email, Pass, Learning_Area, photo, national_id, phone,
        signature_url, birth_date, position, academic_standing, department, role,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        Name = VALUES(Name),
        Email = VALUES(Email),
        Pass = VALUES(Pass),
        Learning_Area = VALUES(Learning_Area),
        photo = VALUES(photo),
        national_id = VALUES(national_id),
        phone = VALUES(phone),
        signature_url = VALUES(signature_url),
        birth_date = VALUES(birth_date),
        position = VALUES(position),
        academic_standing = VALUES(academic_standing),
        department = VALUES(department),
        role = VALUES(role),
        updated_at = NOW()
    `;

    await pool.query(sql, [
      teacher.Teacher_ID,
      teacher.Name,
      teacher.Email,
      teacher.Pass,
      teacher.Learning_Area,
      teacher.photo || '',
      teacher.national_id || '',
      teacher.phone || '',
      teacher.signature_url || '',
      teacher.birth_date || '',
      teacher.position || '',
      teacher.academic_standing || '',
      teacher.department || '',
      teacher.role || 'teacher',
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.get('/api/plans', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lesson_plans ORDER BY submitted_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/api/plans', async (req, res) => {
  try {
    const plan = req.body;
    const sql = `
      INSERT INTO lesson_plans (
        id, teacher_id, teacher_name, teacher_photo, learning_area, subject_code,
        subject_name, grade_level, semester, academic_year, plan_title, plan_type,
        total_hours, file_url, file_name, file_size, notes, submitted_at, status,
        is_late, submission_delay_text, deadline_at, admin_notes, reviewed_by,
        reviewer_name, reviewed_at, review_comment, rubric_scores, total_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        teacher_id = VALUES(teacher_id),
        teacher_name = VALUES(teacher_name),
        teacher_photo = VALUES(teacher_photo),
        learning_area = VALUES(learning_area),
        subject_code = VALUES(subject_code),
        subject_name = VALUES(subject_name),
        grade_level = VALUES(grade_level),
        semester = VALUES(semester),
        academic_year = VALUES(academic_year),
        plan_title = VALUES(plan_title),
        plan_type = VALUES(plan_type),
        total_hours = VALUES(total_hours),
        file_url = VALUES(file_url),
        file_name = VALUES(file_name),
        file_size = VALUES(file_size),
        notes = VALUES(notes),
        submitted_at = VALUES(submitted_at),
        status = VALUES(status),
        is_late = VALUES(is_late),
        submission_delay_text = VALUES(submission_delay_text),
        deadline_at = VALUES(deadline_at),
        admin_notes = VALUES(admin_notes),
        reviewed_by = VALUES(reviewed_by),
        reviewer_name = VALUES(reviewer_name),
        reviewed_at = VALUES(reviewed_at),
        review_comment = VALUES(review_comment),
        rubric_scores = VALUES(rubric_scores),
        total_score = VALUES(total_score)
    `;

    await pool.query(sql, [
      plan.id,
      plan.teacher_id,
      plan.teacher_name,
      plan.teacher_photo || '',
      plan.learning_area,
      plan.subject_code,
      plan.subject_name,
      plan.grade_level,
      plan.semester,
      plan.academic_year,
      plan.plan_title,
      plan.plan_type,
      Number(plan.total_hours) || 40,
      plan.file_url,
      plan.file_name,
      plan.file_size || '2.5 MB',
      plan.notes || '',
      plan.submitted_at || new Date().toISOString(),
      plan.status || 'submitted',
      plan.is_late ?? false,
      plan.submission_delay_text || null,
      plan.deadline_at || null,
      plan.admin_notes || null,
      plan.reviewed_by || null,
      plan.reviewer_name || null,
      plan.reviewed_at || null,
      plan.review_comment || null,
      plan.rubric_scores ? JSON.stringify(plan.rubric_scores) : null,
      plan.total_score ?? null,
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`MySQL API server listening on http://localhost:${PORT}`);
});
