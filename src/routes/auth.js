const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
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
      
      // Если пользователя нет
      if (!rows.length) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      const admin = rows[0];

      // ПРЯМОЕ СРАВНЕНИЕ ТЕКСТА (пароль из базы должен быть равен паролю из запроса)
      if (password !== admin.password_hash) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      // Если всё ок — создаём токен
      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET || 'super-secret-key', // Фоллбэк если переменная не задана
        { expiresIn: '7d' }
      );

      res.json({ token, username: admin.username });
    }
  );
});

// Регистрация без хеширования
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
    [username, password],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ status: 'создан' });
    }
  );
});

module.exports = router;
