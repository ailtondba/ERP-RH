const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getResumoMensal,
  getServidoresPorSetor,
  getFeriasPorMes,
  getRelatorio,
  exportarRelatorio
} = require('../controllers/relatorio.controller');

// Rotas protegidas
router.use(protect);

// Rotas de relatórios
router.get('/resumo-mensal', getResumoMensal);
router.get('/servidores-por-setor', getServidoresPorSetor);
router.get('/ferias-por-mes/:ano', getFeriasPorMes);
router.get('/:tipo', getRelatorio);
router.get('/exportar/:tipo', exportarRelatorio);

module.exports = router;
