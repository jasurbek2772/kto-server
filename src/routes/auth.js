const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken'); // bcrypt больше не нужен
const db       = require('../db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  db.query(
    'SELECT * FROM admins WHERE username = ?',
    [username],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });

      const admin = rows[0];

      // ПРЯМОЕ СРАВНЕНИЕ СТРОК (без bcrypt)
      if (password !== admin.password_hash) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ token, username: admin.username });
    }
  );
});

module.exports = router;
