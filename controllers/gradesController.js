const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { student_id, subject_id, semester, academic_year, page = 1, limit = 20 } = req.query;
    let q = `SELECT g.*, s.first_name || ' ' || s.last_name AS student_name,
                    sub.subject_code, sub.name AS subject_name
             FROM grades g
             JOIN students s ON s.id = g.student_id
             JOIN subjects sub ON sub.id = g.subject_id WHERE 1=1`;
    const p = [];

    if (student_id) { p.push(student_id); q += ` AND g.student_id = $${p.length}`; }
    if (subject_id) { p.push(subject_id); q += ` AND g.subject_id = $${p.length}`; }
    if (semester) { p.push(semester); q += ` AND g.semester = $${p.length}`; }
    if (academic_year) { p.push(academic_year); q += ` AND g.academic_year = $${p.length}`; }

    q += ` ORDER BY g.created_at DESC LIMIT $${p.length + 1} OFFSET $${p.length + 2}`;
    p.push(limit, (page - 1) * limit);

    const { rows } = await pool.query(q, p);

    res.json({ success: true, data: rows });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      student_id,
      subject_id,
      faculty_id,
      semester,
      academic_year,
      prelim,
      midterm,
      final
    } = req.body;

    const final_grade =
      ((parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3).toFixed(2);

    const remarks = final_grade >= 75 ? 'Passed' : 'Failed';

    const { rows } = await pool.query(
      `INSERT INTO grades (student_id, subject_id, faculty_id, semester, academic_year, prelim, midterm, final, final_grade, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        student_id,
        subject_id,
        faculty_id,
        semester,
        academic_year,
        prelim,
        midterm,
        final,
        final_grade,
        remarks
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Grade saved',
      data: rows[0]
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { prelim, midterm, final } = req.body;

    const final_grade =
      ((parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3).toFixed(2);

    const remarks = final_grade >= 75 ? 'Passed' : 'Failed';

    const { rows } = await pool.query(
      `UPDATE grades SET prelim=$1, midterm=$2, final=$3, final_grade=$4, remarks=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [
        prelim,
        midterm,
        final,
        final_grade,
        remarks,
        req.params.id
      ]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    res.json({
      success: true,
      message: 'Grade updated',
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
  const { rowCount } = await pool.query(
    'DELETE FROM grades WHERE id=$1',
    [req.params.id]
  );

  if (!rowCount) {
    return res.status(404).json({
      success: false,
      message: 'Not found'
    });
  }

  res.json({
    success: true,
    message: 'Grade deleted'
  });
};