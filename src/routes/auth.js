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
        console.log('❌ Пользователь не найден:', username); // ← отладка
        return res.status(401).json({ error: 'Неверный логин или пароль' });
      }

      const admin = rows[0];
      
      // ✅ ВАЖНО: смотрим, что сравнивается
      console.log('🔍 Попытка входа:');
      console.log('   Логин из запроса:', username);
      console.log('   Пароль из запроса:', `"${password}"`); // Кавычки покажут пробелы
      console.log('   Пароль из БД:     ', `"${admin.password_hash}"`);
      console.log('   Совпадают?:', password === admin.password_hash);
      
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

      console.log('✅ Вход успешен для:', username); // ← отладка
      
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
      
      // ✅ ПРАВИЛЬНО: console.log ДО отправки ответа
      console.log('✅ Регистрация нового администратора:');
      console.log('   Логин:', username);
      console.log('   Пароль (как сохранен):', password);
      console.log('   ID нового админа:', result.insertId);
      
      // ✅ А это уже отправка ответа клиенту
      res.status(201).json({ 
        id: result.insertId, 
        username,
        password,
        message: 'Администратор успешно создан' 
      });
    }
  );
});

module.exports = router;
