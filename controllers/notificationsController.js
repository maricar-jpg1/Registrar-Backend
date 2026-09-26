const pool = require('../config/db');

exports.getMy = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );

    res.json({ success: true, data: rows });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.markRead = async (req, res) => {
  await pool.query(
    'UPDATE notifications SET is_read=TRUE WHERE id=$1',
    [req.params.id]
  );

  res.json({
    success: true,
    message: 'Marked as read'
  });
};