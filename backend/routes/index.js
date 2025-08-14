const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./auth.routes');
const usuarioRoutes = require('./usuario.routes');
const servidorRoutes = require('./servidor.routes');
const feriasRoutes = require('./ferias.routes');
const relatorioRoutes = require('./relatorio.routes');
const aniversarianteRoutes = require('./aniversariante.routes');
const enderecoRoutes = require('./endereco.routes');

// Configurar rotas
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/servidores', servidorRoutes);
router.use('/funcionarios', servidorRoutes); // Alias para compatibilidade
router.use('/ferias', feriasRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/aniversariantes', aniversarianteRoutes);
router.use('/enderecos', enderecoRoutes);

// Rota de teste
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
