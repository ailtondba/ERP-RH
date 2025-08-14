const { Endereco } = require('../models');
const { ErrorResponse } = require('../utils/errorResponse');
const { SuccessResponse } = require('../utils/successResponse');

// @desc    Obter todos os endereços
// @route   GET /api/enderecos
// @access  Privado
exports.getEnderecos = async (req, res, next) => {
  try {
    const enderecos = await Endereco.findAll();

    res.status(200).json(new SuccessResponse({
      items: enderecos,
      totalItems: enderecos.length,
      totalPages: Math.ceil(enderecos.length / 10),
      currentPage: 1
    }));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter endereço por ID
// @route   GET /api/enderecos/:id
// @access  Privado
exports.getEndereco = async (req, res, next) => {
  try {
    const endereco = await Endereco.findByPk(req.params.id);

    if (!endereco) {
      return next(new ErrorResponse('Endereço não encontrado', 404));
    }

    res.status(200).json(new SuccessResponse(endereco));
  } catch (error) {
    next(error);
  }
};

// @desc    Criar novo endereço
// @route   POST /api/enderecos
// @access  Privado (Admin)
exports.createEndereco = async (req, res, next) => {
  try {
    const endereco = await Endereco.create(req.body);

    res.status(201).json(new SuccessResponse(endereco, 'Endereço criado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar endereço
// @route   PUT /api/enderecos/:id
// @access  Privado (Admin)
exports.updateEndereco = async (req, res, next) => {
  try {
    const endereco = await Endereco.findByPk(req.params.id);

    if (!endereco) {
      return next(new ErrorResponse('Endereço não encontrado', 404));
    }

    await endereco.update(req.body);

    res.status(200).json(new SuccessResponse(endereco, 'Endereço atualizado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar endereço
// @route   DELETE /api/enderecos/:id
// @access  Privado (Admin)
exports.deleteEndereco = async (req, res, next) => {
  try {
    const endereco = await Endereco.findByPk(req.params.id);

    if (!endereco) {
      return next(new ErrorResponse('Endereço não encontrado', 404));
    }

    await endereco.destroy();

    res.status(200).json(new SuccessResponse(null, 'Endereço deletado com sucesso'));
  } catch (error) {
    next(error);
  }
};