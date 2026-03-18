const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const db      = require('../db');

// Настройка Cloudinary (берет ключи из твоих Variables в Railway)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Настройка хранилища для фото мастеров
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kto-masters',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// 1. Получить активных мастеров (для мобилки)
router.get('/', (req, res) => {
  db.query(
    'SELECT id, full_name, code, phone, photo_url FROM masters WHERE is_active = 1 ORDER BY full_name',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// 2. Получить всех мастеров (для админки)
router.get('/all', (req, res) => {
  db.query(
    'SELECT * FROM masters ORDER BY full_name',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// 3. ДОБАВИТЬ МАСТЕРА (с загрузкой фото)
// Поле в Form-Data должно называться "photo"
router.post('/', upload.single('photo'), (req, res) => {
  const { full_name, code, phone } = req.body;
  
  // Если файл загружен, Cloudinary вернет прямую ссылку в req.file.path
  const photoUrl = req.file ? req.file.path : null;

  if (!full_name) return res.status(400).json({ error: 'full_name обязателен' });

  db.query(
    'INSERT INTO masters (full_name, code, phone, photo_url, is_active) VALUES (?, ?, ?, ?, 1)',
    [full_name, code || null, phone || null, photoUrl],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, full_name, photo_url: photoUrl });
    }
  );
});

// 4. ИЗМЕНИТЬ МАСТЕРА
router.put('/:id', upload.single('photo'), (req, res) => {
  const { full_name, phone, is_active, code } = req.body;
  let query = 'UPDATE masters SET full_name=?, phone=?, is_active=?, code=?';
  let params = [full_name, phone, is_active, code];

  // Если при редактировании загрузили новое фото
  if (req.file) {
    query += ', photo_url=?';
    params.push(req.file.path);
  }

  query += ' WHERE id=?';
  params.push(req.params.id);

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;