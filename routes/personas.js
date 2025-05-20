const express = require('express');
const router = express.Router();
const controller = require('../controllers/personasController');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/curp/:curp', controller.getByCurp);
router.delete('/curp/:curp', controller.deleteByCurp);
router.post('/', controller.create);

module.exports = router;
