const express = require('express');
const router  = express.Router();
const db      = require('../db');
const multer  = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 1. Настройка Cloudinary (подтягивает переменные из Railway Variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME, // Проверь, чтобы в Railway было именно такое имя
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Настройка хранилища
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'masters_photos',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// GET /api/masters — только активные
router.get('/', (req, res) => {
  db.query(
    'SELECT id, full_name, code, phone, photo_url FROM masters WHERE is_active = 1 ORDER BY full_name',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// GET /api/masters/all — все мастера
router.get('/all', (req, res) => {
  db.query(
    'SELECT id, full_name, code, phone, photo_url, is_active FROM masters ORDER BY id DESC',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// POST /api/masters — добавить мастера (С ФОТО)
// upload.single('photo') — это магия, которая наполняет req.body и загружает файл
// ПРАВИЛЬНО: upload.single('photo') стоит ПЕРЕД (req, res)
router.post('/', upload.single('photo'), (req, res) => {
  // Теперь multer уже отработал, и req.body больше не undefined!
  const { full_name, code, phone } = req.body; 
  
  if (!full_name) {
    return res.status(400).json({ error: 'full_name обязателен' });
  }

  // Ссылка на фото (если загружено)
  const photo_url = req.file ? req.file.path : null;

  db.query(
    'INSERT INTO masters (full_name, code, phone, photo_url, is_active) VALUES (?, ?, ?, ?, 1)',
    [full_name, code || null, phone || null, photo_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message + 'тут ошибка' });
      res.status(201).json({ id: result.insertId, full_name, photo_url });
    }
  );
});

// PUT /api/masters/:id — изменить
router.put('/:id', (req, res) => {
  const { full_name, phone, is_active } = req.body;
  db.query(
    'UPDATE masters SET full_name=?, phone=?, is_active=? WHERE id=?',
    [full_name, phone, is_active, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

module.exports = router;