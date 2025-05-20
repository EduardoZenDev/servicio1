const db = require('../db/connection');

exports.getAllPersonas = callback => {
  const query = `
    SELECT p.*, d.*, doc.*
    FROM personas_ine p
    LEFT JOIN direcciones d ON p.folio_ine = d.folio_ine
    LEFT JOIN documentos_ine doc ON p.folio_ine = doc.folio_ine
  `;
  db.query(query, callback);
};

exports.getPersonaById = (id, callback) => {
  const query = `
    SELECT p.*, d.*, doc.*
    FROM personas_ine p
    LEFT JOIN direcciones d ON p.folio_ine = d.folio_ine
    LEFT JOIN documentos_ine doc ON p.folio_ine = doc.folio_ine
    WHERE p.id = ?
  `;
  db.query(query, [id], callback);
};

exports.getPersonaByCurp = (curp, callback) => {
  const query = `
    SELECT p.*, d.*, doc.*
    FROM personas_ine p
    LEFT JOIN direcciones d ON p.folio_ine = d.folio_ine
    LEFT JOIN documentos_ine doc ON p.folio_ine = doc.folio_ine
    WHERE p.curp = ?
  `;
  db.query(query, [curp], callback);
};

exports.deleteByCurp = (curp, callback) => {
  db.query(`SELECT folio_ine FROM personas_ine WHERE curp = ?`, [curp], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(null, { affectedRows: 0 });

    const folio = results[0].folio_ine;

    const queries = [
      `DELETE FROM documentos_ine WHERE folio_ine = ?`,
      `DELETE FROM direcciones WHERE folio_ine = ?`,
      `DELETE FROM personas_ine WHERE curp = ?`
    ];

    db.beginTransaction(err => {
      if (err) return callback(err);
      db.query(queries[0], [folio], err => {
        if (err) return db.rollback(() => callback(err));
        db.query(queries[1], [folio], err => {
          if (err) return db.rollback(() => callback(err));
          db.query(queries[2], [curp], (err, result) => {
            if (err) return db.rollback(() => callback(err));
            db.commit(err => {
              if (err) return db.rollback(() => callback(err));
              callback(null, result);
            });
          });
        });
      });
    });
  });
};

exports.createPersona = (data, callback) => {
  const { folio_ine, persona, direccion, documento } = data;

  db.beginTransaction(err => {
    if (err) return callback(err);

    db.query(
      `INSERT INTO personas_ine SET ?`,
      { ...persona, folio_ine },
      (err) => {
        if (err) return db.rollback(() => callback(err));

        db.query(
          `INSERT INTO direcciones SET ?`,
          { ...direccion, folio_ine },
          err => {
            if (err) return db.rollback(() => callback(err));

            db.query(
              `INSERT INTO documentos_ine SET ?`,
              { ...documento, folio_ine },
              err => {
                if (err) return db.rollback(() => callback(err));
                db.commit(callback);
              }
            );
          }
        );
      }
    );
  });
};
