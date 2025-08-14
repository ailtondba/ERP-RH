const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  updatePerfil,
  atualizarSenha
} = require('../controllers/usuario.controller');

// Rotas protegidas
router.use(protect);

// Rotas de perfil do usuário logado
router.put('/profile', updatePerfil);
router.put('/change-password', atualizarSenha);

// Rotas de administração (apenas admin)
router.use(authorize('admin'));
router.get('/', getUsuarios);
router.get('/:id', getUsuario);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

module.exports = router;
