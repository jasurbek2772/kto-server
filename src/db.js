const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'mysql.railway.internal',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'CyZIdMhYVIkVzeNdvpVOZirDydktQoDu',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10
});

// Проверяем подключение при старте
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Ошибка БД:2', err.message);
  } else {
    console.log('✓ MySQL подключён2');
    connection.release();
  }
});

module.exports = db;
