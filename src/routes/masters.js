const express    = require('express');
const router     = express.Router();
const db         = require('../db');
const multer     = require('multer');
const cloudinary = require('../cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `kto/${folder}`, resource_type: 'image' },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    stream.end(buffer);
  });
}

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
    'SELECT id, full_name, code, phone, photo_url, is_active FROM masters ORDER BY full_name',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// POST /api/masters — добавить мастера
// POST /api/masters — добавить мастера
router.post('/', upload.single('photo'), async (req, res) => {
  console.log('POST body:', req.body); 
  const { full_name, code, phone } = req.body;

  if (!full_name) return res.status(400).json({ error: 'full_name обязателен' });

  try {
    let photoUrl = null;

    // Если при создании мастера сразу передали файл фото
    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'masters');
      photoUrl = cloudinaryResult.secure_url;
    }

    // Сохраняем в базу (с фото или без него)
    // Обратите внимание: добавлено поле photo_url в запрос
    db.query(
      'INSERT INTO masters (full_name, code, phone, photo_url) VALUES (?, ?, ?, ?)',
      [full_name, code || null, phone || null, photoUrl],
      (err, result) => {
        if (err) {
          console.error('DB error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
          id: result.insertId, 
          full_name, 
          code, 
          phone, 
          photo_url: photoUrl 
        });
      }
    );
  } catch (e) {
    console.error('Cloudinary upload error:', e);
    res.status(500).json({ error: 'Ошибка загрузки фото: ' + e.message });
  }
});

// POST /api/masters/:id/photo — загрузить/обновить фото мастера
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не передан' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, 'masters');
    db.query(
      'UPDATE masters SET photo_url = ? WHERE id = ?',
      [result.secure_url, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, photo_url: result.secure_url });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Ошибка Cloudinary: ' + e.message });
  }
});

// PUT /api/masters/:id — изменить данные мастера
router.put('/:id', (req, res) => {
  const { full_name, phone, code, is_active } = req.body;
  db.query(
    'UPDATE masters SET full_name=?, phone=?, code=?, is_active=? WHERE id=?',
    [full_name, phone, code, is_active, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

module.exports = router;
