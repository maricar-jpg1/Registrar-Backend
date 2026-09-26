const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM faculty WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (faculty_id ILIKE $${params.length}
                   OR first_name ILIKE $${params.length}
                   OR last_name ILIKE $${params.length}
                   OR department ILIKE $${params.length})`;
    }

    if (department) { params.push(department); query += ` AND department = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, (page - 1) * limit);

    const { rows } = await pool.query(query, params);

    let cq = 'SELECT COUNT(*) FROM faculty WHERE 1=1';
    const cp = [];

    if (search) {
      cp.push(`%${search}%`);
      cq += ` AND (faculty_id ILIKE $${cp.length} OR first_name ILIKE $${cp.length} OR last_name ILIKE $${cp.length} OR department ILIKE $${cp.length})`;
    }

    if (department) { cp.push(department); cq += ` AND department = $${cp.length}`; }
    if (status) { cp.push(status); cq += ` AND status = $${cp.length}`; }

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
    'SELECT * FROM faculty WHERE id=$1',
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({
      success: false,
      message: 'Not found'
    });
  }

  res.json({
    success: true,
    data: rows[0]
  });
};

exports.create = async (req, res) => {
  try {
    const {
      faculty_id,
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      specialization,
      status
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO faculty (faculty_id, first_name, last_name, email, phone, department, position, specialization, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        faculty_id,
        first_name,
        last_name,
        email || null,
        phone || null,
        department,
        position || null,
        specialization || null,
        status || 'Active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Faculty created',
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
    const {
      faculty_id,
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      specialization,
      status
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE faculty SET faculty_id=$1, first_name=$2, last_name=$3, email=$4, phone=$5,
        department=$6, position=$7, specialization=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [
        faculty_id,
        first_name,
        last_name,
        email,
        phone,
        department,
        position,
        specialization,
        status,
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
      message: 'Faculty updated',
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
    'DELETE FROM faculty WHERE id=$1',
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
    message: 'Faculty deleted'
  });
};