const mysql = require('mysql2');
require('dotenv').config();

console.log('🔧 Параметры подключения к БД:');
console.log('HOST:', process.env.DB_HOST || 'mysql.railway.internal');
console.log('PORT:', process.env.DB_PORT || 3306);
console.log('USER:', process.env.DB_USER || 'root');
console.log('DATABASE:', process.env.DB_NAME || 'railway');
console.log('PASSWORD:', (process.env.DB_PASSWORD || 'CyZIdMhYVIkVzeNdvpVOZirDydktQoDu') ? '***' : 'не указан');

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
    console.error('❌ Ошибка БД детально:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState
    });
  } else {
    console.log('✓ MySQL подключён');
    connection.release();
  }
});

module.exports = db;
