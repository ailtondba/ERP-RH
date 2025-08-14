const { Ferias, Servidor } = require('../models');
// Controlador de férias atualizado
const { ErrorResponse } = require('../utils/errorResponse');
const { SuccessResponse } = require('../utils/successResponse');
const { Op } = require('sequelize');

// @desc    Obter todas as férias
// @route   GET /api/ferias
// @access  Privado
exports.getFerias = async (req, res, next) => {
  try {
    const ferias = await Ferias.findAll();

    res.status(200).json(new SuccessResponse(ferias));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter férias ativas
// @route   GET /api/ferias/ativas
// @access  Privado
exports.getFeriasAtivas = async (req, res, next) => {
  try {
    const hoje = new Date();
    const ferias = await Ferias.findAll({
      where: {
        data_inicio: { [Op.lte]: hoje },
        data_fim: { [Op.gte]: hoje },
        status: 'aprovado'
      }
    });

    res.status(200).json(new SuccessResponse(ferias));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter férias de um servidor
// @route   GET /api/ferias/servidor/:servidorId
// @access  Privado
exports.getFeriasServidor = async (req, res, next) => {
  try {
    const ferias = await Ferias.findAll({
      where: { servidor_id: req.params.servidorId }
    });

    res.status(200).json(new SuccessResponse(ferias));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter férias por período
// @route   GET /api/ferias/periodo
// @access  Privado
exports.getFeriasPorPeriodo = async (req, res, next) => {
  try {
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
      return next(new ErrorResponse('Data de início e fim são obrigatórias', 400));
    }

    const ferias = await Ferias.findAll({
      where: {
        [Op.or]: [
          {
            data_inicio: {
              [Op.between]: [dataInicio, dataFim]
            }
          },
          {
            data_fim: {
              [Op.between]: [dataInicio, dataFim]
            }
          },
          {
            [Op.and]: [
              { data_inicio: { [Op.lte]: dataInicio } },
              { data_fim: { [Op.gte]: dataFim } }
            ]
          }
        ]
      }
    });

    res.status(200).json(new SuccessResponse(ferias));
  } catch (error) {
    next(error);
  }
};

// @desc    Criar nova solicitação de férias
// @route   POST /api/ferias
// @access  Privado (Admin)
exports.createFerias = async (req, res, next) => {
  try {
    const ferias = await Ferias.create(req.body);
    
    const feriasComServidor = await Ferias.findByPk(ferias.id);

    res.status(201).json(new SuccessResponse(feriasComServidor, 'Férias criadas com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar férias
// @route   PUT /api/ferias/:id
// @access  Privado (Admin)
exports.updateFerias = async (req, res, next) => {
  try {
    const ferias = await Ferias.findByPk(req.params.id);

    if (!ferias) {
      return next(new ErrorResponse('Férias não encontradas', 404));
    }

    await ferias.update(req.body);
    
    const feriasComServidor = await Ferias.findByPk(ferias.id, {
      include: [{
        model: Servidor,
        as: 'servidor',
        attributes: ['id', 'nome', 'setor']
      }]
    });

    res.status(200).json(new SuccessResponse(feriasComServidor, 'Férias atualizadas com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Deletar férias
// @route   DELETE /api/ferias/:id
// @access  Privado (Admin)
exports.deleteFerias = async (req, res, next) => {
  try {
    const ferias = await Ferias.findByPk(req.params.id);

    if (!ferias) {
      return next(new ErrorResponse('Férias não encontradas', 404));
    }

    await ferias.destroy();

    res.status(200).json(new SuccessResponse(null, 'Férias removidas com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Buscar férias do mês atual
// @route   GET /api/ferias/mes-atual
// @access  Private
exports.getFeriasMesAtual = async (req, res, next) => {
  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    const ferias = await Ferias.findAll({
      where: {
        [Op.or]: [
          {
            data_inicio: {
              [Op.between]: [inicioMes, fimMes]
            }
          },
          {
            data_fim: {
              [Op.between]: [inicioMes, fimMes]
            }
          },
          {
            [Op.and]: [
              {
                data_inicio: {
                  [Op.lte]: inicioMes
                }
              },
              {
                data_fim: {
                  [Op.gte]: fimMes
                }
              }
            ]
          }
        ]
      },
      order: [['data_inicio', 'ASC']]
    });

    res.status(200).json(new SuccessResponse(ferias));
  } catch (error) {
    next(error);
  }
};