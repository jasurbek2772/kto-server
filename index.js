const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('./src/db'); // запускает проверку подключения

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
app.listen(PORT, () => console.log(`✓ Сервер: http://localhost:${PORT} почему?`));
