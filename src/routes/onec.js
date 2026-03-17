const express = require('express');
const router = express.Router();
const db = require('../db');

// ─────────────────────────────────────────
// POST /api/1c/request — принять заявку от 1С
//
// 1С присылает JSON:
// {
//   "number_1c": "1577162",
//   "category": "Сантехника",
//   "date_received": "2026-03-16T15:19:20",
//   "deadline": "2026-03-23",
//   "branch": "К-56",
//   "address": "Красноярск ул. Вавилова, д. 1",
//   "contact_person": "+7 391 252-45-55",
//   "content": "Почистить жироуловитель",
//   "dispatcher": "Петрова Е.В."
// }
// ─────────────────────────────────────────
router.post('/request', (req, res) => {
  const {
    number_1c, category, date_received, deadline,
    branch, address, contact_person, content, dispatcher
  } = req.body;

  // Проверяем обязательные поля
  if (!number_1c || !date_received) {
    return res.status(400).json({ error: 'number_1c и date_received обязательны' });
  }

  const sql = `
    INSERT INTO requests
      (number_1c, category, date_received, deadline, branch, address, contact_person, content, dispatcher)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      category=VALUES(category),
      deadline=VALUES(deadline),
      address=VALUES(address),
      content=VALUES(content)
  `;

  db.query(sql, [
    number_1c, category, date_received, deadline || null,
    branch, address, contact_person, content, dispatcher
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      success: true,
      id: result.insertId,
      number_1c,
      message: 'Заявка принята'
    });
  });
});

// GET /api/1c/status/:number — 1С спрашивает статус заявки
router.get('/status/:number', (req, res) => {
  db.query(
    `SELECT r.status, r.taken_at, r.done_at, m.full_name AS master_name
     FROM requests r LEFT JOIN masters m ON r.master_id = m.id
     WHERE r.number_1c = ?`,
    [req.params.number],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: 'Не найдена' });
      res.json(rows[0]);
    }
  );
});

module.exports = router;