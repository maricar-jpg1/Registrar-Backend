const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const schema = `
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS enrollment_subjects CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150),
  role VARCHAR(30) DEFAULT 'registrar',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(30) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  email VARCHAR(100),
  phone VARCHAR(30),
  address TEXT,
  program VARCHAR(150),
  year_level INTEGER,
  section VARCHAR(30),
  status VARCHAR(30) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE faculty (
  id SERIAL PRIMARY KEY,
  faculty_id VARCHAR(30) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(30),
  department VARCHAR(100),
  position VARCHAR(100),
  specialization VARCHAR(150),
  status VARCHAR(30) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  subject_code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  units INTEGER NOT NULL,
  department VARCHAR(100),
  year_level INTEGER,
  semester VARCHAR(30),
  prerequisite VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  enrollment_id VARCHAR(50) UNIQUE NOT NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  academic_year VARCHAR(20),
  semester VARCHAR(30),
  program VARCHAR(150),
  year_level INTEGER,
  section VARCHAR(30),
  total_units INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enrollment_subjects (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
  semester VARCHAR(30),
  academic_year VARCHAR(20),
  prelim NUMERIC(5,2),
  midterm NUMERIC(5,2),
  final NUMERIC(5,2),
  final_grade NUMERIC(5,2),
  remarks VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL,
  section VARCHAR(30),
  room VARCHAR(50),
  day VARCHAR(20),
  start_time TIME,
  end_time TIME,
  semester VARCHAR(30),
  academic_year VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

async function seed() {
  try {
    await pool.query(schema);
    console.log('Schema created');

    const hashed = await bcrypt.hash('admin123', 10);

    await pool.query(
      `INSERT INTO users (username, email, password, full_name, role)
       VALUES ('admin','admin@registrar.edu',$1,'System Administrator','admin')`,
      [hashed]
    );

    // Students
    const students = [
      ['2026-0001','Aiko','M.','Fujimoto','2005-03-12','Female','aiko@school.edu','09171234001','Tokyo St, Manila','Bachelor of Science in Computer Science',2,'A','Active'],
      ['2026-0002','Riku','','Matsuda','2004-07-22','Male','riku@school.edu','09171234002','Osaka Ave, QC','Bachelor of Science in Information Technology',3,'B','Active'],
      ['2026-0003','Hana','L.','Sato','2005-11-05','Female','hana@school.edu','09171234003','Kyoto Rd, Makati','Bachelor of Science in Computer Science',2,'A','Active'],
      ['2026-0004','Yuto','K.','Tanaka','2004-01-30','Male','yuto@school.edu','09171234004','Nara Blvd, Pasig','Bachelor of Science in Information Technology',3,'A','Active'],
      ['2026-0005','Mei','P.','Yamamoto','2005-09-18','Female','mei@school.edu','09171234005','Sapporo Lane, Taguig','Bachelor of Science in Computer Science',1,'B','Active'],
    ];

    for (const s of students) {
      await pool.query(
        `INSERT INTO students (student_id, first_name, middle_name, last_name, date_of_birth, gender, email, phone, address, program, year_level, section, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        s
      );
    }

    // Faculty
    const faculty = [
      ['FAC-001','John','Doe','john@school.edu','09180000001','Computer Science','Professor','Software Engineering','Active'],
      ['FAC-002','Maria','Santos','maria@school.edu','09180000002','Information Technology','Associate Professor','Networking','Active'],
      ['FAC-003','Carlos','Reyes','carlos@school.edu','09180000003','Computer Science','Instructor','Database Systems','Active'],
      ['FAC-004','Ana','Cruz','ana@school.edu','09180000004','Mathematics','Professor','Discrete Math','Active'],
    ];

    for (const f of faculty) {
      await pool.query(
        `INSERT INTO faculty (faculty_id, first_name, last_name, email, phone, department, position, specialization, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        f
      );
    }

    // Subjects
    const subjects = [
      ['CS101','Introduction to Computing','Fundamentals of computing',3,'Computer Science',1,'1st Semester',null,'Active'],
      ['CS102','Programming 1','Intro to programming using Python',3,'Computer Science',1,'1st Semester',null,'Active'],
      ['CS201','Data Structures','Advanced data structures',3,'Computer Science',2,'1st Semester','CS102','Active'],
      ['CS202','Database Systems','Relational databases and SQL',3,'Computer Science',2,'2nd Semester','CS102','Active'],
      ['IT101','Web Development','HTML, CSS, JS basics',3,'Information Technology',1,'1st Semester',null,'Active'],
      ['IT201','Networking Fundamentals','Network protocols',3,'Information Technology',2,'2nd Semester',null,'Active'],
      ['MATH101','Discrete Mathematics','Logic, sets, graphs',3,'Mathematics',1,'1st Semester',null,'Active'],
    ];

    for (const s of subjects) {
      await pool.query(
        `INSERT INTO subjects (subject_code, name, description, units, department, year_level, semester, prerequisite, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        s
      );
    }

    // Enrollments
    await pool.query(
      `INSERT INTO enrollments (enrollment_id, student_id, academic_year, semester, program, year_level, section, total_units, status)
       VALUES ('ENR-2024-001',1,'2024-2025','1st Semester','Bachelor of Science in Computer Science',2,'A',9,'Enrolled')`
    );

    await pool.query(
      `INSERT INTO enrollments (enrollment_id, student_id, academic_year, semester, program, year_level, section, total_units, status)
       VALUES ('ENR-2024-002',2,'2024-2025','1st Semester','Bachelor of Science in Information Technology',3,'B',6,'Enrolled')`
    );

    await pool.query(
      `INSERT INTO enrollments (enrollment_id, student_id, academic_year, semester, program, year_level, section, total_units, status)
       VALUES ('ENR-2024-003',3,'2024-2025','1st Semester','Bachelor of Science in Computer Science',2,'A',9,'Pending')`
    );

    // Enrollment subjects
    await pool.query(
      `INSERT INTO enrollment_subjects (enrollment_id, subject_id) VALUES (1,3),(1,4),(1,7)`
    );

    await pool.query(
      `INSERT INTO enrollment_subjects (enrollment_id, subject_id) VALUES (2,6)`
    );

    // Grades
    await pool.query(
      `INSERT INTO grades (student_id, subject_id, faculty_id, semester, academic_year, prelim, midterm, final, final_grade, remarks)
       VALUES (1,1,1,'1st Semester','2024-2025',85,88,90,87.67,'Passed')`
    );

    await pool.query(
      `INSERT INTO grades (student_id, subject_id, faculty_id, semester, academic_year, prelim, midterm, final, final_grade, remarks)
       VALUES (2,5,2,'1st Semester','2024-2025',78,80,82,80.00,'Passed')`
    );

    // Schedules
    await pool.query(
      `INSERT INTO schedules (subject_id, faculty_id, section, room, day, start_time, end_time, semester, academic_year)
       VALUES (1,1,'A','Room 101','Monday','08:00','10:00','1st Semester','2024-2025')`
    );

    await pool.query(
      `INSERT INTO schedules (subject_id, faculty_id, section, room, day, start_time, end_time, semester, academic_year)
       VALUES (2,1,'A','Room 102','Tuesday','10:00','12:00','1st Semester','2024-2025')`
    );

    await pool.query(
      `INSERT INTO schedules (subject_id, faculty_id, section, room, day, start_time, end_time, semester, academic_year)
       VALUES (5,2,'B','Room 201','Wednesday','13:00','15:00','1st Semester','2024-2025')`
    );

    // Settings
    const settings = [
      ['school_name','Registrar University'],
      ['school_address','123 Academic St, Metro Manila'],
      ['registrar_name','Dr. Admin'],
      ['academic_year','2024-2025'],
      ['current_semester','1st Semester'],
    ];

    for (const [k, v] of settings) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1,$2)`,
        [k, v]
      );
    }

    // Notifications
    await pool.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES (1,'New Enrollment','A new enrollment is pending approval.')`
    );

    await pool.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES (1,'Grade Submitted','Grades for CS101 have been submitted.')`
    );

    console.log('Seed complete');
    process.exit(0);

  } catch (e) {
    console.error('Seed error:', e);
    process.exit(1);
  }
}

seed();