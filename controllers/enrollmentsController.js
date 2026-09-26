const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    let q = `SELECT e.*, s.first_name || ' ' || s.last_name AS student_name
             FROM enrollments e JOIN students s ON s.id = e.student_id WHERE 1=1`;
    const p = [];

    if (search) {
      p.push(`%${search}%`);
      q += ` AND (e.enrollment_id ILIKE $${p.length} OR s.first_name ILIKE $${p.length} OR s.last_name ILIKE $${p.length} OR e.program ILIKE $${p.length})`;
    }

    if (status) {
      p.push(status);
      q += ` AND e.status = $${p.length}`;
    }

    q += ` ORDER BY e.created_at DESC LIMIT $${p.length + 1} OFFSET $${p.length + 2}`;
    p.push(limit, (page - 1) * limit);

    const { rows } = await pool.query(q, p);

    let cq = `SELECT COUNT(*) FROM enrollments e JOIN students s ON s.id=e.student_id WHERE 1=1`;
    const cp = [];

    if (search) {
      cp.push(`%${search}%`);
      cq += ` AND (e.enrollment_id ILIKE $${cp.length} OR s.first_name ILIKE $${cp.length} OR s.last_name ILIKE $${cp.length} OR e.program ILIKE $${cp.length})`;
    }

    if (status) {
      cp.push(status);
      cq += ` AND e.status = $${cp.length}`;
    }

    const total = parseInt((await pool.query(cq, cp)).rows[0].count);

    res.json({
      success: true,
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getById = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT e.*, s.first_name || ' ' || s.last_name AS student_name
     FROM enrollments e JOIN students s ON s.id = e.student_id WHERE e.id=$1`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({
      success: false,
      message: 'Not found'
    });
  }

  const subjects = await pool.query(
    `SELECT es.*, sub.subject_code, sub.name AS subject_name, sub.units
     FROM enrollment_subjects es JOIN subjects sub ON sub.id = es.subject_id
     WHERE es.enrollment_id=$1`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: { ...rows[0], subjects: subjects.rows }
  });
};

exports.create = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      student_id,
      academic_year,
      semester,
      program,
      year_level,
      section,
      total_units,
      subject_ids
    } = req.body;

    const enrollment_id = `ENR-${Date.now()}`;

    const { rows } = await client.query(
      `INSERT INTO enrollments (enrollment_id, student_id, academic_year, semester, program, year_level, section, total_units, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Pending') RETURNING *`,
      [
        enrollment_id,
        student_id,
        academic_year,
        semester,
        program,
        year_level || null,
        section || null,
        total_units || 0
      ]
    );

    const enrollment = rows[0];

    if (subject_ids && subject_ids.length) {
      for (const sid of subject_ids) {
        await client.query(
          'INSERT INTO enrollment_subjects (enrollment_id, subject_id) VALUES ($1,$2)',
          [enrollment.id, sid]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Enrollment created',
      data: enrollment
    });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });

  } finally {
    client.release();
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const { rows } = await pool.query(
      `UPDATE enrollments SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated',
      data: rows[0]
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.remove = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM enrollment_subjects WHERE enrollment_id=$1',
      [req.params.id]
    );

    const { rowCount } = await client.query(
      'DELETE FROM enrollments WHERE id=$1',
      [req.params.id]
    );

    await client.query('COMMIT');

    if (!rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    res.json({
      success: true,
      message: 'Enrollment deleted'
    });

  } catch (e) {
    await client.query('ROLLBACK');

    res.status(500).json({
      success: false,
      message: 'Server error'
    });

  } finally {
    client.release();
  }
};