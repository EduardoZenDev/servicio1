require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('¡Servicio INE activo desde Render!');
});

// --- CREAR persona con transacción ---
app.post('/api/personas', (req, res) => {
  const { id, folio_ine, nombre, curp, sexo, fecha_nacimiento, direccion, documento } = req.body;

  if (!id || !folio_ine || !nombre || !curp || !sexo || !fecha_nacimiento || !direccion || !documento) {
    return res.status(400).json({ error: 'Faltan datos obligatorios, incluyendo id' });
  }

  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ error: 'Error iniciando transacción' });
    }

    // Insert persona con id manual
    const sqlPersona = `
      INSERT INTO personas_ine (id, folio_ine, nombre, curp, sexo, fecha_nacimiento)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(sqlPersona, [id, folio_ine, nombre, curp, sexo, fecha_nacimiento], (err, result) => {
      if (err) {
        return connection.rollback(() => {
          res.status(500).json({ error: 'Error insertando persona', details: err });
        });
      }

      // Insert direccion con mismo id
      const sqlDireccion = `
        INSERT INTO direcciones (id, folio_ine, calle, numero, colonia, municipio, estado, codigo_postal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        sqlDireccion,
        [
          id,
          folio_ine,
          direccion.calle,
          direccion.numero || null,
          direccion.colonia || null,
          direccion.municipio || null,
          direccion.estado || null,
          direccion.codigo_postal || null
        ],
        (err, result) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: 'Error insertando dirección', details: err });
            });
          }

          // Insert documento con mismo id
          const sqlDocumento = `
            INSERT INTO documentos_ine (id, folio_ine, clave_elector, seccion, vigencia)
            VALUES (?, ?, ?, ?, ?)
          `;

          connection.query(
            sqlDocumento,
            [id, folio_ine, documento.clave_elector, documento.seccion || null, documento.vigencia],
            (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ error: 'Error insertando documento', details: err });
                });
              }

              connection.commit(err => {
                if (err) {
                  return connection.rollback(() => {
                    res.status(500).json({ error: 'Error confirmando transacción', details: err });
                  });
                }

                res.status(201).json({ message: 'Datos insertados correctamente', id });
              });
            }
          );
        }
      );
    });
  });
});




// --- CONSULTAR todos ---
app.get('/api/personas', (req, res) => {
  const sql = `
    SELECT p.id, p.folio_ine, p.nombre, p.curp, p.sexo, p.fecha_nacimiento,
           d.calle, d.numero, d.colonia, d.municipio, d.estado, d.codigo_postal,
           doc.clave_elector, doc.seccion, doc.vigencia
    FROM personas_ine p
    LEFT JOIN direcciones d ON p.folio_ine = d.folio_ine
    LEFT JOIN documentos_ine doc ON p.folio_ine = doc.folio_ine
  `;

  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error consultando personas' });
    res.json(results);
  });
});

// --- CONSULTAR por ID ---
app.get('/api/personas/id/:id', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT p.id, p.folio_ine, p.nombre, p.curp, p.sexo, p.fecha_nacimiento,
           d.calle, d.numero, d.colonia, d.municipio, d.estado, d.codigo_postal,
           doc.clave_elector, doc.seccion, doc.vigencia
    FROM personas_ine p
    LEFT JOIN direcciones d ON p.folio_ine = d.folio_ine
    LEFT JOIN documentos_ine doc ON p.folio_ine = doc.folio_ine
    WHERE p.id = ?
  `;

  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error consultando persona' });
    if (results.length === 0) return res.status(404).json({ error: 'Persona no encontrada' });
    res.json(results[0]);
  });
});

// --- CONSULTAR por CURP ---
app.get('/api/personas/curp/:curp', (req, res) => {
  const curp = req.params.curp;

  const sql = `
    SELECT p.id, p.folio_ine, p.nombre, p.curp, p.sexo, p.fecha_nacimiento,
           d.calle, d.numero, d.colonia, d.municipio, d.estado, d.codigo_postal,
           doc.clave_elector, doc.seccion, doc.vigencia
    FROM personas_ine p
    LEFT JOIN direcciones d ON p.folio_ine = d.folio_ine
    LEFT JOIN documentos_ine doc ON p.folio_ine = doc.folio_ine
    WHERE p.curp = ?
  `;

  connection.query(sql, [curp], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error consultando persona' });
    if (results.length === 0) return res.status(404).json({ error: 'Persona no encontrada' });
    res.json(results[0]);
  });
});

// --- ELIMINAR por CURP ---
app.delete('/api/personas/curp/:curp', (req, res) => {
  const curp = req.params.curp;

  // Primero obtener folio_ine para borrar de direcciones y documentos
  connection.query('SELECT folio_ine FROM personas_ine WHERE curp = ?', [curp], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error buscando folio_ine' });
    if (results.length === 0) return res.status(404).json({ error: 'Persona no encontrada' });

    const folio_ine = results[0].folio_ine;

    connection.beginTransaction(err => {
      if (err) return res.status(500).json({ error: 'Error iniciando transacción' });

      // Eliminar en documentos_ine
      connection.query('DELETE FROM documentos_ine WHERE folio_ine = ?', [folio_ine], err => {
        if (err) return connection.rollback(() => res.status(500).json({ error: 'Error eliminando documentos' }));

        // Eliminar en direcciones
        connection.query('DELETE FROM direcciones WHERE folio_ine = ?', [folio_ine], err => {
          if (err) return connection.rollback(() => res.status(500).json({ error: 'Error eliminando direcciones' }));

          // Eliminar en personas_ine
          connection.query('DELETE FROM personas_ine WHERE folio_ine = ?', [folio_ine], err => {
            if (err) return connection.rollback(() => res.status(500).json({ error: 'Error eliminando persona' }));

            connection.commit(err => {
              if (err) return connection.rollback(() => res.status(500).json({ error: 'Error haciendo commit' }));

              res.json({ mensaje: 'Persona eliminada correctamente' });
            });
          });
        });
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
