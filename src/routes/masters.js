const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  db.query(
    'SELECT id, full_name, code, phone FROM masters WHERE is_active = 1 ORDER BY full_name',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.get('/all', (req, res) => {
  db.query(
    'SELECT id, full_name, code, phone, is_active FROM masters ORDER BY full_name',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { full_name, code, phone } = req.body;
  if (!full_name) return res.status(400).json({ error: 'full_name обязателен' });
  db.query(
    'INSERT INTO masters (full_name, code, phone) VALUES (?, ?, ?)',
    [full_name, code || null, phone || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, full_name, code, phone });
    }
  );
});

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