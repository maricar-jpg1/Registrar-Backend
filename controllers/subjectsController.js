const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const {
      search,
      department,
      year_level,
      semester,
      page = 1,
      limit = 10
    } = req.query;

    let q = 'SELECT * FROM subjects WHERE 1=1';
    const p = [];

    if (search) {
      p.push(`%${search}%`);
      q += ` AND (subject_code ILIKE $${p.length} OR name ILIKE $${p.length})`;
    }

    if (department) {
      p.push(department);
      q += ` AND department = $${p.length}`;
    }

    if (year_level) {
      p.push(year_level);
      q += ` AND year_level = $${p.length}`;
    }

    if (semester) {
      p.push(semester);
      q += ` AND semester = $${p.length}`;
    }

    q += ` ORDER BY created_at DESC LIMIT $${p.length + 1} OFFSET $${p.length + 2}`;

    p.push(limit, (page - 1) * limit);

    const { rows } = await pool.query(q, p);

    let cq = 'SELECT COUNT(*) FROM subjects WHERE 1=1';
    const cp = [];

    if (search) {
      cp.push(`%${search}%`);
      cq += ` AND (subject_code ILIKE $${cp.length} OR name ILIKE $${cp.length})`;
    }

    if (department) {
      cp.push(department);
      cq += ` AND department = $${cp.length}`;
    }

    if (year_level) {
      cp.push(year_level);
      cq += ` AND year_level = $${cp.length}`;
    }

    if (semester) {
      cp.push(semester);
      cq += ` AND semester = $${cp.length}`;
    }

    const total = parseInt(
      (await pool.query(cq, cp)).rows[0].count
    );

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

exports.create = async (req, res) => {
  try {
    const {
      subject_code,
      name,
      description,
      units,
      department,
      year_level,
      semester,
      prerequisite,
      status
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO subjects
       (subject_code, name, description, units, department, year_level, semester, prerequisite, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        subject_code,
        name,
        description || null,
        units,
        department,
        year_level,
        semester,
        prerequisite || null,
        status || 'Active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Subject created',
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
      subject_code,
      name,
      description,
      units,
      department,
      year_level,
      semester,
      prerequisite,
      status
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE subjects
       SET subject_code=$1,
           name=$2,
           description=$3,
           units=$4,
           department=$5,
           year_level=$6,
           semester=$7,
           prerequisite=$8,
           status=$9,
           updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [
        subject_code,
        name,
        description,
        units,
        department,
        year_level,
        semester,
        prerequisite,
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
      message: 'Subject updated',
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
    'DELETE FROM subjects WHERE id=$1',
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
    message: 'Subject deleted'
  });
};