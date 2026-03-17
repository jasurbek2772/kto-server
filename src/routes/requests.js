const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Настройка загрузки фото
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // макс 10МБ

// ─────────────────────────────────────────
// GET /api/requests — список всех заявок
// ?status=free|taken|done — фильтр по статусу
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  let sql = `
    SELECT r.*, m.full_name AS master_name, m.phone AS master_phone
    FROM requests r
    LEFT JOIN masters m ON r.master_id = m.id
  `;
  const params = [];

  if (req.query.status) {
    sql += ' WHERE r.status = ?';
    params.push(req.query.status);
  }

  sql += ' ORDER BY r.date_received DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ─────────────────────────────────────────
// GET /api/requests/:id — одна заявка с фото
// ─────────────────────────────────────────
router.get('/:id', (req, res) => {
  db.query(
    `SELECT r.*, m.full_name AS master_name, m.phone AS master_phone
     FROM requests r
     LEFT JOIN masters m ON r.master_id = m.id
     WHERE r.id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: 'Заявка не найдена' });

      const request = rows[0];

      // Подгружаем фото к заявке
      db.query(
        'SELECT id, filename, uploaded_at FROM photos WHERE request_id = ?',
        [req.params.id],
        (err2, photos) => {
          if (err2) return res.status(500).json({ error: err2.message });
          request.photos = photos;
          res.json(request);
        }
      );
    }
  );
});

// ─────────────────────────────────────────
// POST /api/requests/:id/take — взять заявку
// body: { master_id: 5 }
// ─────────────────────────────────────────
router.post('/:id/take', (req, res) => {
  const { master_id } = req.body;
  if (!master_id) return res.status(400).json({ error: 'master_id обязателен' });

  // Проверяем что заявка ещё свободна
  db.query('SELECT status FROM requests WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Заявка не найдена' });
    if (rows[0].status !== 'free') return res.status(409).json({ error: 'Заявка уже взята' });

    db.query(
      'UPDATE requests SET status="taken", master_id=?, taken_at=NOW() WHERE id=?',
      [master_id, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true, message: 'Заявка взята в работу' });
      }
    );
  });
});

// ─────────────────────────────────────────
// POST /api/requests/:id/return — вернуть в буфер
// ─────────────────────────────────────────
router.post('/:id/return', (req, res) => {
  db.query(
    'UPDATE requests SET status="free", master_id=NULL, taken_at=NULL WHERE id=? AND status="taken"',
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(400).json({ error: 'Нельзя вернуть эту заявку' });
      res.json({ success: true, message: 'Заявка возвращена в буфер' });
    }
  );
});

// ─────────────────────────────────────────
// POST /api/requests/:id/done — отметить выполненной
// ─────────────────────────────────────────
router.post('/:id/done', (req, res) => {
  db.query(
    'UPDATE requests SET status="done", done_at=NOW() WHERE id=? AND status="taken"',
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(400).json({ error: 'Заявка не в работе' });
      res.json({ success: true, message: 'Заявка выполнена!' });
    }
  );
});

// ─────────────────────────────────────────
// POST /api/requests/:id/photos — загрузить фото
// form-data: photos (можно несколько файлов)
// ─────────────────────────────────────────
router.post('/:id/photos', upload.array('photos', 10), (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Файлы не переданы' });
  }

  const values = files.map(f => [req.params.id, f.filename]);

  db.query(
    'INSERT INTO photos (request_id, filename) VALUES ?',
    [values],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        success: true,
        uploaded: files.length,
        files: files.map(f => f.filename)
      });
    }
  );
});

// PUT /api/requests/:id — редактировать заявку (из админки)
router.put('/:id', (req, res) => {
  const { category, address, branch, contact_person, deadline, dispatcher, content } = req.body;
  db.query(
    `UPDATE requests SET
      category=?, address=?, branch=?, contact_person=?,
      deadline=?, dispatcher=?, content=?
     WHERE id=?`,
    [category, address, branch, contact_person, deadline || null, dispatcher, content, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

module.exports = router;
