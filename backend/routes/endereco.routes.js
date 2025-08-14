const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getEnderecos,
  getEndereco,
  createEndereco,
  updateEndereco,
  deleteEndereco
} = require('../controllers/endereco.controller');

// Rotas protegidas
router.use(protect);

// Rotas de leitura
router.get('/', getEnderecos);
router.get('/:id', getEndereco);

// Rotas de escrita (apenas admin)
router.use(authorize('admin'));
router.post('/', createEndereco);
router.put('/:id', updateEndereco);
router.delete('/:id', deleteEndereco);

module.exports = router;
