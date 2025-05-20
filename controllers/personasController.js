const Persona = require('../models/personaModel');

exports.getAll = (req, res) => {
  Persona.getAllPersonas((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  Persona.getPersonaById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json(results[0]);
  });
};

exports.getByCurp = (req, res) => {
  Persona.getPersonaByCurp(req.params.curp, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json(results[0]);
  });
};

exports.deleteByCurp = (req, res) => {
  Persona.deleteByCurp(req.params.curp, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Eliminado correctamente' });
  });
};

exports.create = (req, res) => {
  Persona.createPersona(req.body, err => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ message: 'Persona creada correctamente' });
  });
};
