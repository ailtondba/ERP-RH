const { Servidor } = require('../models');
const { ErrorResponse } = require('../utils/errorResponse');
const { SuccessResponse } = require('../utils/successResponse');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// @desc    Obter aniversariantes por mês
// @route   GET /api/aniversariantes/:mes
// @access  Privado
exports.getAniversariantesPorMes = async (req, res, next) => {
  try {
    const { mes } = req.params;
    const mesNumero = parseInt(mes);

    if (mesNumero < 1 || mesNumero > 12) {
      return next(new ErrorResponse('Mês inválido. Use valores de 1 a 12', 400));
    }

    const aniversariantes = await Servidor.findAll({
      where: {
        status: 'ativo',
        data_nascimento: {
          [Op.ne]: null
        }
      },
      order: [['data_nascimento', 'ASC']]
    });

    // Filtrar por mês no JavaScript
    const aniversariantesFiltrados = aniversariantes.filter(servidor => {
      const dataNascimento = new Date(servidor.data_nascimento);
      return dataNascimento.getMonth() + 1 === mesNumero;
    });

    // Adicionar informações extras
    const aniversariantesComIdade = aniversariantesFiltrados.map(servidor => {
      const dataNascimento = new Date(servidor.data_nascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      
      // Ajustar idade se ainda não fez aniversário este ano
      const mesAniversario = dataNascimento.getMonth();
      const diaAniversario = dataNascimento.getDate();
      
      if (hoje.getMonth() < mesAniversario || 
          (hoje.getMonth() === mesAniversario && hoje.getDate() < diaAniversario)) {
        idade--;
      }

      return {
        ...servidor.toJSON(),
        idade,
        diaAniversario: diaAniversario,
        proximaIdade: idade + 1
      };
    });

    res.status(200).json(new SuccessResponse(aniversariantesComIdade));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter aniversariantes da semana
// @route   GET /api/aniversariantes/semana
// @access  Privado
exports.getAniversariantesSemana = async (req, res, next) => {
  try {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);

    const aniversariantes = await Servidor.findAll({
      where: {
        status: 'ativo',
        data_nascimento: {
          [Op.ne]: null
        }
      },
      order: [['data_nascimento', 'ASC']]
    });

    // Filtrar aniversariantes da semana
    const aniversariantesSemana = aniversariantes.filter(servidor => {
      const dataNascimento = new Date(servidor.data_nascimento);
      const mesNascimento = dataNascimento.getMonth();
      const diaNascimento = dataNascimento.getDate();
      
      // Criar data de aniversário para o ano atual
      const aniversarioEsteAno = new Date(hoje.getFullYear(), mesNascimento, diaNascimento);
      
      return aniversarioEsteAno >= inicioSemana && aniversarioEsteAno <= fimSemana;
    });

    // Adicionar informações extras
    const aniversariantesComIdade = aniversariantesSemana.map(servidor => {
      const dataNascimento = new Date(servidor.data_nascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      
      // Ajustar idade se ainda não fez aniversário este ano
      const mesAniversario = dataNascimento.getMonth();
      const diaAniversario = dataNascimento.getDate();
      
      if (hoje.getMonth() < mesAniversario || 
          (hoje.getMonth() === mesAniversario && hoje.getDate() < diaAniversario)) {
        idade--;
      }

      return {
        ...servidor.toJSON(),
        idade,
        diaAniversario: diaAniversario,
        proximaIdade: idade + 1
      };
    });

    res.status(200).json(new SuccessResponse(aniversariantesComIdade));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter aniversariantes por ano
// @route   GET /api/aniversariantes/ano/:ano
// @access  Privado
exports.getAniversariantesPorAno = async (req, res, next) => {
  try {
    const { ano } = req.params;
    const anoConsulta = parseInt(ano) || new Date().getFullYear();

    const aniversariantes = await Servidor.findAll({
      where: {
        status: 'ativo',
        data_nascimento: {
          [Op.ne]: null
        }
      },
      order: [['data_nascimento', 'ASC']]
    });

    // Organizar por mês
    const aniversariantesPorMes = {};
    const todosAniversariantes = [];

    aniversariantes.forEach(servidor => {
      const dataNascimento = new Date(servidor.data_nascimento);
      const mes = dataNascimento.getMonth() + 1;
      
      const servidorComIdade = {
        ...servidor.toJSON(),
        idade: anoConsulta - dataNascimento.getFullYear(),
        diaAniversario: dataNascimento.getDate(),
        proximaIdade: anoConsulta - dataNascimento.getFullYear() + 1
      };
      
      if (!aniversariantesPorMes[mes]) {
        aniversariantesPorMes[mes] = [];
      }
      
      aniversariantesPorMes[mes].push(servidorComIdade);
      todosAniversariantes.push(servidorComIdade);
    });

    res.status(200).json(new SuccessResponse({
      aniversariantes: todosAniversariantes,
      porMes: aniversariantesPorMes,
      ano: anoConsulta
    }));
  } catch (error) {
    next(error);
  }
};

// @desc    Exportar aniversariantes em PDF
// @route   GET /api/aniversariantes/:mes/pdf
// @access  Privado
exports.exportarAniversariantesPDF = async (req, res, next) => {
  try {
    const { mes } = req.params;
    const mesNumero = parseInt(mes);

    if (mesNumero < 1 || mesNumero > 12) {
      return next(new ErrorResponse('Mês inválido. Use valores de 1 a 12', 400));
    }

    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const aniversariantes = await Servidor.findAll({
      where: {
        status: 'ativo',
        data_nascimento: {
          [Op.ne]: null
        }
      },
      order: [['data_nascimento', 'ASC']]
    });

    // Filtrar por mês no JavaScript
    const aniversariantesFiltrados = aniversariantes.filter(servidor => {
      const dataNascimento = new Date(servidor.data_nascimento);
      return dataNascimento.getMonth() + 1 === mesNumero;
    });

    // Preparar dados dos aniversariantes com informações extras
    const aniversariantesComDetalhes = aniversariantesFiltrados.map((servidor, index) => {
      const dataNascimento = new Date(servidor.data_nascimento);
      const dia = dataNascimento.getDate();
      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      
      // Ajustar idade se ainda não fez aniversário este ano
      if (hoje.getMonth() < dataNascimento.getMonth() || 
          (hoje.getMonth() === dataNascimento.getMonth() && hoje.getDate() < dia)) {
        idade--;
      }

      return {
        ...servidor.toJSON(),
        dia,
        proximaIdade: idade + 1,
        setor: servidor.setor || 'N/A'
      };
    });

    res.status(200).json(new SuccessResponse({
      titulo: `Aniversariantes de ${mesesNomes[mesNumero - 1]}`,
      mes: mesesNomes[mesNumero - 1],
      dados: aniversariantesComDetalhes,
      geradoEm: new Date().toLocaleDateString('pt-BR'),
      totalAniversariantes: aniversariantesFiltrados.length
    }, 'Relatório de aniversariantes gerado com sucesso'));
  } catch (error) {
    next(error);
  }
};