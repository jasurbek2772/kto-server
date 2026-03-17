const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Проверяем БД перед запуском сервера
const db = require('./src/db');

const mastersRouter = require('./src/routes/masters');
const requestsRouter = require('./src/routes/requests');
const onecRouter = require('./src/routes/onec');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public')));

app.use('/api/masters', mastersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/1c', onecRouter);

app.get('/', (req, res) => res.json({ status: 'ok', message: 'КТО API работает' }));

const PORT = process.env.PORT || 3000;

// Запускаем сервер только если БД подключилась
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Критическая ошибка: сервер не запущен из-за проблем с БД');
    process.exit(1);
  } else {
    connection.release();
    app.listen(PORT, () => console.log(`✓ Сервер: http://localhost:${PORT}`));
  }
});
