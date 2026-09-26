const pool = require('../config/db');

exports.generate = async (req, res) => {
  try {
    const { type, academic_year, semester, program, year_level } = req.query;

    let data = [];
    let summary = {};

    if (type === 'students') {
      let q = 'SELECT * FROM students WHERE 1=1';
      const p = [];

      if (program) {
        p.push(program);
        q += ` AND program = $${p.length}`;
      }

      if (year_level) {
        p.push(year_level);
        q += ` AND year_level = $${p.length}`;
      }

      const r = await pool.query(q, p);
      data = r.rows;
      summary = { total: data.length };

    } else if (type === 'faculty') {
      const r = await pool.query('SELECT * FROM faculty');
      data = r.rows;
      summary = { total: data.length };

    } else if (type === 'enrollments') {
      let q = `SELECT e.*, s.first_name || ' ' || s.last_name AS student_name FROM enrollments e
               JOIN students s ON s.id = e.student_id WHERE 1=1`;

      const p = [];

      if (academic_year) {
        p.push(academic_year);
        q += ` AND e.academic_year = $${p.length}`;
      }

      if (semester) {
        p.push(semester);
        q += ` AND e.semester = $${p.length}`;
      }

      const r = await pool.query(q, p);
      data = r.rows;
      summary = { total: data.length };

    } else if (type === 'subjects') {
      const r = await pool.query('SELECT * FROM subjects');
      data = r.rows;
      summary = {
        total: data.length,
        total_units: data.reduce(
          (a, b) => a + parseInt(b.units || 0),
          0
        )
      };

    } else if (type === 'grades') {
      let q = `SELECT g.*, s.first_name || ' ' || s.last_name AS student_name, sub.name AS subject_name
               FROM grades g
               JOIN students s ON s.id=g.student_id
               JOIN subjects sub ON sub.id=g.subject_id
               WHERE 1=1`;

      const p = [];

      if (semester) {
        p.push(semester);
        q += ` AND g.semester = $${p.length}`;
      }

      if (academic_year) {
        p.push(academic_year);
        q += ` AND g.academic_year = $${p.length}`;
      }

      const r = await pool.query(q, p);
      data = r.rows;

      const passed = data.filter(
        d => d.remarks === 'Passed'
      ).length;

      summary = {
        total: data.length,
        passed,
        failed: data.length - passed
      };

    } else if (type === 'schedules') {
      const r = await pool.query(
        `SELECT sc.*, sub.name AS subject_name,
                f.first_name || ' ' || f.last_name AS faculty_name
         FROM schedules sc
         JOIN subjects sub ON sub.id=sc.subject_id
         JOIN faculty f ON f.id=sc.faculty_id`
      );

      data = r.rows;
      summary = { total: data.length };
    }

    res.json({
      success: true,
      data,
      summary,
      type
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};