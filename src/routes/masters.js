const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Проверяем, существует ли папка, если нет — создаем
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Делаем уникальное имя: timestamp + случайное число
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// РОУТ: Добавление мастера
router.post('/', upload.single('photo'), (req, res) => {
  const { full_name, phone, code } = req.body;
  
  // Формируем путь, который сохранится в базу
  // Будет сохранено имя файла, например: 1773816123179-331012675.jpg
  const fileName = req.file ? req.file.filename : null;

  const sql = 'INSERT INTO masters (full_name, phone, code, photo_url, is_active) VALUES (?, ?, ?, ?, 1)';
  db.query(sql, [full_name, phone, code, fileName], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, fileName });
  });
});

module.exports = router;