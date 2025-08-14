const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getAniversariantesPorMes,
  getAniversariantesSemana,
  getAniversariantesPorAno,
  exportarAniversariantesPDF
} = require('../controllers/aniversariante.controller');

// Rotas protegidas
router.use(protect);

// Rotas para aniversariantes
router.get('/semana', getAniversariantesSemana);
router.get('/ano/:ano?', getAniversariantesPorAno);
router.get('/:mes', getAniversariantesPorMes);
router.get('/:mes/pdf', exportarAniversariantesPDF);

module.exports = router;
