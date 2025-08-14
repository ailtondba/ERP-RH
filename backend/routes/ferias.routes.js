const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getFerias,
  getFeriasAtivas,
  getFeriasServidor,
  createFerias,
  updateFerias,
  deleteFerias,
  getFeriasPorPeriodo,
  getFeriasMesAtual
} = require('../controllers/ferias.controller');

// Rotas protegidas
router.use(protect);

// Rotas GET
router.get('/', getFerias);
router.get('/ativas', getFeriasAtivas);
router.get('/mes-atual', getFeriasMesAtual);
router.get('/servidor/:servidorId', getFeriasServidor);
router.get('/periodo', getFeriasPorPeriodo);

// Rotas de escrita (apenas admin)
router.use(authorize('admin'));
router.post('/', createFerias);
router.put('/:id', updateFerias);
router.delete('/:id', deleteFerias);

module.exports = router;
