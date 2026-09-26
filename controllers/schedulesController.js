const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sc.*, sub.subject_code, sub.name AS subject_name,
              f.first_name || ' ' || f.last_name AS faculty_name
       FROM schedules sc
       JOIN subjects sub ON sub.id = sc.subject_id
       JOIN faculty f ON f.id = sc.faculty_id
       ORDER BY
         CASE sc.day
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
         END,
         sc.start_time`
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

exports.create = async (req, res) => {
  try {
    const {
      subject_id,
      faculty_id,
      section,
      room,
      day,
      start_time,
      end_time,
      semester,
      academic_year
    } = req.body;

    // Conflict detection
    const conflict = await pool.query(
      `SELECT id FROM schedules
       WHERE day=$1 AND (
         (faculty_id=$2 AND ($3::time, $4::time) OVERLAPS (start_time::time, end_time::time))
         OR (room=$5 AND ($3::time, $4::time) OVERLAPS (start_time::time, end_time::time))
         OR (section=$6 AND ($3::time, $4::time) OVERLAPS (start_time::time, end_time::time))
       )`,
      [
        day,
        faculty_id,
        start_time,
        end_time,
        room,
        section
      ]
    );

    if (conflict.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict detected'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO schedules (subject_id, faculty_id, section, room, day, start_time, end_time, semester, academic_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        subject_id,
        faculty_id,
        section,
        room,
        day,
        start_time,
        end_time,
        semester,
        academic_year
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Schedule created',
      data: rows[0]
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.remove = async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM schedules WHERE id=$1',
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
    message: 'Schedule deleted'
  });
};