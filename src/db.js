const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Проверяем подключение при старте
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Ошибка БД:', err.message);
  } else {
    console.log('✓ MySQL подключён');
    connection.release();
  }
});

module.exports = db;