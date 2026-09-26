const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { search, program, year_level, status, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (student_id ILIKE $${params.length}
                   OR first_name ILIKE $${params.length}
                   OR last_name ILIKE $${params.length}
                   OR program ILIKE $${params.length})`;
    }

    if (program) { params.push(program); query += ` AND program = $${params.length}`; }
    if (year_level) { params.push(year_level); query += ` AND year_level = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, (page - 1) * limit);

    const { rows } = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM students WHERE 1=1';
    const countParams = [];

    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (student_id ILIKE $${countParams.length}
                       OR first_name ILIKE $${countParams.length}
                       OR last_name ILIKE $${countParams.length}
                       OR program ILIKE $${countParams.length})`;
    }

    if (program) { countParams.push(program); countQuery += ` AND program = $${countParams.length}`; }
    if (year_level) { countParams.push(year_level); countQuery += ` AND year_level = $${countParams.length}`; }
    if (status) { countParams.push(status); countQuery += ` AND status = $${countParams.length}`; }

    const countRes = await pool.query(countQuery, countParams);
    const total = parseInt(countRes.rows[0].count);

    res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);

    if (rows.length === 0) return res.status(404).json({
      success: false,
      message: 'Student not found'
    });

    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      student_id, first_name, middle_name, last_name, date_of_birth, gender,
      email, phone, address, program, year_level, section, status
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO students (student_id, first_name, middle_name, last_name, date_of_birth, gender,
        email, phone, address, program, year_level, section, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        student_id,
        middle_name || null,
        first_name,
        last_name,
        date_of_birth || null,
        gender || null,
        email || null,
        phone || null,
        address || null,
        program,
        year_level || null,
        section || null,
        status || 'Active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Student created',
      data: rows[0]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      student_id, first_name, middle_name, last_name, date_of_birth, gender,
      email, phone, address, program, year_level, section, status
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE students SET student_id=$1, first_name=$2, middle_name=$3, last_name=$4,
        date_of_birth=$5, gender=$6, email=$7, phone=$8, address=$9,
        program=$10, year_level=$11, section=$12, status=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [
        student_id,
        first_name,
        middle_name || null,
        last_name,
        date_of_birth || null,
        gender || null,
        email || null,
        phone || null,
        address || null,
        program,
        year_level || null,
        section || null,
        status,
        req.params.id
      ]
    );

    if (rows.length === 0) return res.status(404).json({
      success: false,
      message: 'Not found'
    });

    res.json({
      success: true,
      message: 'Student updated',
      data: rows[0]
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM students WHERE id = $1',
      [req.params.id]
    );

    if (rowCount === 0) return res.status(404).json({
      success: false,
      message: 'Not found'
    });

    res.json({
      success: true,
      message: 'Student deleted'
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};