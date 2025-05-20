require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json()); // Para parsear JSON

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
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

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Servicio INE activo desde Render!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
