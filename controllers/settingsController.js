const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getSettings = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM settings'
    );

    const obj = {};

    rows.forEach(r => obj[r.key] = r.value);

    res.json({
      success: true,
      data: obj
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const entries = Object.entries(req.body);

    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        [key, value]
      );
    }

    res.json({
      success: true,
      message: 'Settings updated'
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const {
      current_password,
      new_password
    } = req.body;

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id=$1',
      [req.user.id]
    );

    const user = rows[0];

    const valid = await bcrypt.compare(
      current_password,
      user.password
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Current password incorrect'
      });
    }

    const hashed = await bcrypt.hash(
      new_password,
      10
    );

    await pool.query(
      'UPDATE users SET password=$1 WHERE id=$2',
      [hashed, user.id]
    );

    res.json({
      success: true,
      message: 'Password updated'
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};