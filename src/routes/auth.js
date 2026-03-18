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
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!rows.length) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      const admin = rows[0];
      
      // Прямое сравнение паролей (без хеширования)
      if (password !== admin.password_hash) {
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      // Создаем JWT токен
      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ 
        token, 
        username: admin.username 
      });
    }
  );
});

// POST /api/auth/register — создать админа
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  // Сохраняем пароль как есть (без хеширования)
  db.query(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
    [username, password],
    (err, result) => {
      if (err) {
        // Обработка ошибки дубликата username
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({ 
        id: result.insertId, 
        username,
        message: 'Администратор успешно создан' 
      });
    }
  );
});

module.exports = router;
