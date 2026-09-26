const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const students = await pool.query('SELECT COUNT(*) FROM students');
    const faculty = await pool.query('SELECT COUNT(*) FROM faculty');
    const subjects = await pool.query('SELECT COUNT(*) FROM subjects');

    const activeEnrollments = await pool.query(
      "SELECT COUNT(*) FROM enrollments WHERE status IN ('Approved','Enrolled')"
    );

    const pendingEnrollments = await pool.query(
      "SELECT COUNT(*) FROM enrollments WHERE status = 'Pending'"
    );

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long'
    });

    const classesToday = await pool.query(
      'SELECT COUNT(*) FROM schedules WHERE day = $1',
      [today]
    );

    res.json({
      success: true,
      data: {
        totalStudents: parseInt(students.rows[0].count),
        totalFaculty: parseInt(faculty.rows[0].count),
        totalSubjects: parseInt(subjects.rows[0].count),
        activeEnrollments: parseInt(activeEnrollments.rows[0].count),
        pendingEnrollments: parseInt(pendingEnrollments.rows[0].count),
        classesToday: parseInt(classesToday.rows[0].count),
      },
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getRecentStudents = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM students ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getRecentEnrollments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, s.first_name || ' ' || s.last_name AS student_name
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       ORDER BY e.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getTodaySchedule = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long'
    });

    const { rows } = await pool.query(
      `SELECT sc.*, sub.name AS subject_name,
              f.first_name || ' ' || f.last_name AS faculty_name
       FROM schedules sc
       JOIN subjects sub ON sub.id = sc.subject_id
       JOIN faculty f ON f.id = sc.faculty_id
       WHERE sc.day = $1
       ORDER BY sc.start_time`,
      [today]
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};