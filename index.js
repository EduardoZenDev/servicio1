require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT), // asegúrate que sea número
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000
});

connection.connect(error => {
  if (error) {
    console.error('Error conectando a la base de datos:', error);
  } else {
    console.log('Conectado correctamente a la base de datos Railway');
  }
});
console.log('DB_HOST:', process.env.DB_HOST);
