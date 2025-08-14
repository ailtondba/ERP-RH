const { Servidor, Ferias, User } = require('../models');
const { ErrorResponse } = require('../utils/errorResponse');
const { SuccessResponse } = require('../utils/successResponse');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// @desc    Obter resumo mensal
// @route   GET /api/relatorios/resumo-mensal
// @access  Privado
exports.getResumoMensal = async (req, res, next) => {
  try {
    const { mes, ano } = req.query;
    const dataAtual = new Date();
    const mesAtual = mes || dataAtual.getMonth() + 1;
    const anoAtual = ano || dataAtual.getFullYear();

    // Total de servidores
    const totalServidores = await Servidor.count({
      where: { status: 'ativo' }
    });

    // Férias no mês
    const feriasNoMes = await Ferias.count({
      where: {
        [Op.or]: [
          {
            data_inicio: {
              [Op.between]: [
                new Date(anoAtual, mesAtual - 1, 1),
                new Date(anoAtual, mesAtual, 0)
              ]
            }
          },
          {
            data_fim: {
              [Op.between]: [
                new Date(anoAtual, mesAtual - 1, 1),
                new Date(anoAtual, mesAtual, 0)
              ]
            }
          }
        ],
        status: 'aprovado'
      }
    });

    // Aniversariantes do mês
    const aniversariantes = await Servidor.count({
      where: {
        status: 'ativo',
        data_nascimento: {
          [Op.ne]: null
        }
      }
    });

    const resumo = {
      mes: mesAtual,
      ano: anoAtual,
      totalServidores,
      feriasNoMes,
      aniversariantes
    };

    res.status(200).json(new SuccessResponse(resumo));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter servidores por setor
// @route   GET /api/relatorios/servidores-por-setor
// @access  Privado
exports.getServidoresPorSetor = async (req, res, next) => {
  try {
    const servidoresPorSetor = await Servidor.findAll({
      attributes: [
        'setor',
        [Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'total']
      ],
      where: { status: 'ativo' },
      group: ['setor'],
      order: [[Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'DESC']]
    });

    res.status(200).json(new SuccessResponse(servidoresPorSetor));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter férias por mês do ano
// @route   GET /api/relatorios/ferias-por-mes/:ano
// @access  Privado
exports.getFeriasPorMes = async (req, res, next) => {
  try {
    const { ano } = req.params;
    const anoAtual = ano || new Date().getFullYear();

    const feriasPorMes = [];

    for (let mes = 1; mes <= 12; mes++) {
      const count = await Ferias.count({
        where: {
          [Op.or]: [
            {
              data_inicio: {
                [Op.between]: [
                  new Date(anoAtual, mes - 1, 1),
                  new Date(anoAtual, mes, 0)
                ]
              }
            },
            {
              data_fim: {
                [Op.between]: [
                  new Date(anoAtual, mes - 1, 1),
                  new Date(anoAtual, mes, 0)
                ]
              }
            }
          ],
          status: 'aprovado'
        }
      });

      feriasPorMes.push({
        mes,
        total: count
      });
    }

    res.status(200).json(new SuccessResponse(feriasPorMes));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter relatório por tipo
// @route   GET /api/relatorios/:tipo
// @access  Privado
exports.getRelatorio = async (req, res, next) => {
  try {
    const { tipo } = req.params;
    const { mes, ano, data_inicio, data_fim } = req.query;

    let dados;
    let titulo;

    switch (tipo) {
      case 'lista_funcionarios':
        dados = await Servidor.findAll({
          where: { status: 'ativo' },
          order: [['nome', 'ASC']]
        });
        titulo = 'Lista de Funcionários';
        break;

      case 'funcionarios_por_setor':
        dados = await Servidor.findAll({
          attributes: [
            'setor',
            [Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'total']
          ],
          where: { status: 'ativo' },
          group: ['setor'],
          order: [[Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'DESC']]
        });
        titulo = 'Funcionários por Setor';
        break;

      case 'funcionarios_por_status':
        dados = await Servidor.findAll({
          attributes: [
            'status',
            [Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'total']
          ],
          group: ['status'],
          order: [[Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'DESC']]
        });
        titulo = 'Funcionários por Status';
        break;

      case 'funcionarios_por_cidade':
        dados = await Servidor.findAll({
          attributes: [
            'cidade',
            [Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'total']
          ],
          where: { status: 'ativo' },
          group: ['cidade'],
          order: [[Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'DESC']]
        });
        titulo = 'Funcionários por Cidade';
        break;

      case 'funcionarios_por_cargo':
        dados = await Servidor.findAll({
          attributes: [
            'cargo',
            [Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'total']
          ],
          where: { status: 'ativo' },
          group: ['cargo'],
          order: [[Servidor.sequelize.fn('COUNT', Servidor.sequelize.col('id')), 'DESC']]
        });
        titulo = 'Funcionários por Cargo';
        break;

      case 'ferias_por_mes':
        const anoAtual = ano || new Date().getFullYear();
        const feriasPorMes = [];

        for (let mesNum = 1; mesNum <= 12; mesNum++) {
          const count = await Ferias.count({
            where: {
              [Op.or]: [
                {
                  data_inicio: {
                    [Op.between]: [
                      new Date(anoAtual, mesNum - 1, 1),
                      new Date(anoAtual, mesNum, 0)
                    ]
                  }
                },
                {
                  data_fim: {
                    [Op.between]: [
                      new Date(anoAtual, mesNum - 1, 1),
                      new Date(anoAtual, mesNum, 0)
                    ]
                  }
                }
              ],
              status: 'aprovado'
            }
          });

          feriasPorMes.push({
            mes: mesNum,
            total: count
          });
        }
        dados = feriasPorMes;
        titulo = `Férias por Mês - ${anoAtual}`;
        break;

      case 'aniversariantes_por_mes':
        const mesAtual = mes || new Date().getMonth() + 1;
        const todosServidores = await Servidor.findAll({
          where: {
            status: 'ativo',
            data_nascimento: {
              [Op.ne]: null
            }
          },
          order: [['data_nascimento', 'ASC']]
        });
        
        // Filtrar por mês no JavaScript
        dados = todosServidores.filter(servidor => {
          const dataNascimento = new Date(servidor.data_nascimento);
          return dataNascimento.getMonth() + 1 === parseInt(mesAtual);
        });
        titulo = `Aniversariantes - Mês ${mesAtual}`;
        break;

      case 'admissoes_demissoes':
        const anoConsulta = ano || new Date().getFullYear();
        const admissoes = await Servidor.count({
          where: {
            data_admissao: {
              [Op.between]: [
                new Date(anoConsulta, 0, 1),
                new Date(anoConsulta, 11, 31)
              ]
            }
          }
        });
        
        const demissoes = await Servidor.count({
          where: {
            status: 'inativo',
            data_demissao: {
              [Op.between]: [
                new Date(anoConsulta, 0, 1),
                new Date(anoConsulta, 11, 31)
              ]
            }
          }
        });
        
        dados = {
          admissoes,
          demissoes,
          ano: anoConsulta
        };
        titulo = `Admissões e Demissões - ${anoConsulta}`;
        break;

      case 'ferias_por_setor':
        dados = await Ferias.findAll({
          include: [{
            model: Servidor,
            as: 'servidor',
            attributes: ['setor']
          }],
          where: { status: 'aprovado' },
          order: [['data_inicio', 'DESC']]
        });
        titulo = 'Férias por Setor';
        break;

      case 'idade_funcionarios':
        const servidoresComIdade = await Servidor.findAll({
          where: {
            status: 'ativo',
            data_nascimento: {
              [Op.ne]: null
            }
          }
        });
        
        // Calcular idades e agrupar
        const faixasEtarias = {
          '18-25': 0,
          '26-35': 0,
          '36-45': 0,
          '46-55': 0,
          '56+': 0
        };
        
        servidoresComIdade.forEach(servidor => {
          const idade = new Date().getFullYear() - new Date(servidor.data_nascimento).getFullYear();
          if (idade <= 25) faixasEtarias['18-25']++;
          else if (idade <= 35) faixasEtarias['26-35']++;
          else if (idade <= 45) faixasEtarias['36-45']++;
          else if (idade <= 55) faixasEtarias['46-55']++;
          else faixasEtarias['56+']++;
        });
        
        dados = Object.entries(faixasEtarias).map(([faixa, total]) => ({ faixa, total }));
        titulo = 'Distribuição de Idade';
        break;

      case 'tempo_servico':
        const servidoresComAdmissao = await Servidor.findAll({
          where: {
            status: 'ativo',
            data_admissao: {
              [Op.ne]: null
            }
          }
        });
        
        // Calcular tempo de serviço e agrupar
        const faixasServico = {
          '0-1 ano': 0,
          '1-5 anos': 0,
          '5-10 anos': 0,
          '10-20 anos': 0,
          '20+ anos': 0
        };
        
        servidoresComAdmissao.forEach(servidor => {
          const anos = (new Date() - new Date(servidor.data_admissao)) / (1000 * 60 * 60 * 24 * 365);
          if (anos <= 1) faixasServico['0-1 ano']++;
          else if (anos <= 5) faixasServico['1-5 anos']++;
          else if (anos <= 10) faixasServico['5-10 anos']++;
          else if (anos <= 20) faixasServico['10-20 anos']++;
          else faixasServico['20+ anos']++;
        });
        
        dados = Object.entries(faixasServico).map(([faixa, total]) => ({ faixa, total }));
        titulo = 'Tempo de Serviço';
        break;

      default:
        return next(new ErrorResponse('Tipo de relatório inválido', 400));
    }

    res.status(200).json(new SuccessResponse({
      titulo,
      dados,
      geradoEm: new Date().toLocaleDateString('pt-BR'),
      total: Array.isArray(dados) ? dados.length : 1
    }));
  } catch (error) {
    next(error);
  }
};

// @desc    Exportar relatório em PDF
// @route   GET /api/relatorios/exportar/:tipo
// @access  Privado
exports.exportarRelatorio = async (req, res, next) => {
  try {
    const { tipo } = req.params;
    const { mes, ano } = req.query;

    let dados;
    let titulo;

    switch (tipo) {
      case 'servidores':
        dados = await Servidor.findAll({
          where: { status: 'ativo' },
          order: [['nome', 'ASC']]
        });
        titulo = 'Relatório de Servidores';
        break;

      case 'ferias':
        dados = await Ferias.findAll({
          include: [{
            model: Servidor,
            as: 'servidor',
            attributes: ['nome', 'setor']
          }],
          order: [['data_inicio', 'DESC']]
        });
        titulo = 'Relatório de Férias';
        break;

      case 'aniversariantes':
        const mesAtual = mes || new Date().getMonth() + 1;
        const todosServidores = await Servidor.findAll({
          where: {
            status: 'ativo',
            data_nascimento: {
              [Op.ne]: null
            }
          },
          order: [['data_nascimento', 'ASC']]
        });
        
        // Filtrar por mês no JavaScript
        dados = todosServidores.filter(servidor => {
          const dataNascimento = new Date(servidor.data_nascimento);
          return dataNascimento.getMonth() + 1 === mesAtual;
        });
        titulo = `Aniversariantes - Mês ${mesAtual}`;
        break;

      default:
        return next(new ErrorResponse('Tipo de relatório inválido', 400));
    }

    // Retornar dados em JSON para download
    res.status(200).json(new SuccessResponse({
      titulo,
      dados,
      geradoEm: new Date().toLocaleDateString('pt-BR'),
      total: dados.length
    }, 'Relatório gerado com sucesso'));
  } catch (error) {
    next(error);
  }
};