const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getServidores,
  getServidor,
  createServidor,
  updateServidor,
  deleteServidor,
  uploadFoto,
  associarFotos
} = require('../controllers/servidor.controller');

// Rotas protegidas
router.use(protect);

// Rotas de leitura
router.get('/', getServidores);
router.get('/:id', getServidor);

// Rotas de escrita (apenas admin)
router.use(authorize('admin'));
router.post('/', createServidor);
router.put('/:id', updateServidor);
router.delete('/:id', deleteServidor);
router.post('/:id/foto', uploadFoto);
router.post('/associar-fotos', associarFotos);

module.exports = router;
