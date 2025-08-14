const { User } = require('../models');
const { ErrorResponse } = require('../utils/errorResponse');
const { SuccessResponse } = require('../utils/successResponse');

// @desc    Obter todos os usuários
// @route   GET /api/usuarios
// @access  Privado (Admin)
exports.getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    res.status(200).json(new SuccessResponse({
      items: usuarios,
      totalItems: usuarios.length,
      totalPages: 1,
      currentPage: 1
    }));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter usuário por ID
// @route   GET /api/usuarios/:id
// @access  Privado (Admin)
exports.getUsuario = async (req, res, next) => {
  try {
    const usuario = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!usuario) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    res.status(200).json(new SuccessResponse(usuario));
  } catch (error) {
    next(error);
  }
};

// @desc    Criar novo usuário
// @route   POST /api/usuarios
// @access  Privado (Admin)
exports.createUsuario = async (req, res, next) => {
  try {
    const usuario = await User.create(req.body);
    
    // Remover senha do retorno
    usuario.password = undefined;

    res.status(201).json(new SuccessResponse(usuario, 'Usuário criado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar usuário
// @route   PUT /api/usuarios/:id
// @access  Privado (Admin)
exports.updateUsuario = async (req, res, next) => {
  try {
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    await usuario.update(req.body);
    
    // Remover senha do retorno
    usuario.password = undefined;

    res.status(200).json(new SuccessResponse(usuario, 'Usuário atualizado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar usuário
// @route   DELETE /api/usuarios/:id
// @access  Privado (Admin)
exports.deleteUsuario = async (req, res, next) => {
  try {
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    await usuario.destroy();

    res.status(200).json(new SuccessResponse(null, 'Usuário deletado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar perfil do usuário logado
// @route   PUT /api/usuarios/profile
// @access  Privado
exports.updatePerfil = async (req, res, next) => {
  try {
    const usuario = await User.findByPk(req.user.id);

    if (!usuario) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    await usuario.update(fieldsToUpdate);
    
    // Remover senha do retorno
    usuario.password = undefined;

    res.status(200).json(new SuccessResponse(usuario, 'Perfil atualizado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar senha do usuário logado
// @route   PUT /api/usuarios/change-password
// @access  Privado
exports.atualizarSenha = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const usuario = await User.findByPk(req.user.id, {
      attributes: { include: ['password'] }
    });

    if (!usuario) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    // Verificar senha atual
    const isMatch = await usuario.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Senha atual incorreta', 400));
    }

    // Atualizar senha
    usuario.password = newPassword;
    await usuario.save();

    res.status(200).json(new SuccessResponse(null, 'Senha alterada com sucesso'));
  } catch (error) {
    next(error);
  }
};