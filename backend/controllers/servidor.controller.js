const { Servidor } = require('../models');
const { Op } = require('sequelize');
const { ErrorResponse } = require('../utils/errorResponse');
const { SuccessResponse } = require('../utils/successResponse');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require('fs');
    const uploadPath = 'uploads/fotos/';
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Gerar nome baseado no nome do funcionário + ID para evitar conflitos
    const ext = path.extname(file.originalname);
    
    // Se temos o nome do funcionário no body da requisição
    if (req.body.nome) {
      // Sanitizar o nome para usar como nome do arquivo
      const nomeLimpo = req.body.nome
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w_]/g, '')
        .substring(0, 50); // Limitar tamanho
      
      // Adicionar ID se disponível para evitar conflitos
      const id = req.params.id || Date.now();
      cb(null, `${nomeLimpo}_${id}${ext}`);
    } else {
      // Fallback para o método antigo se não tiver nome
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'servidor-' + uniqueSuffix + ext);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

// @desc    Obter todos os servidores
// @route   GET /api/servidores
// @access  Privado
exports.getServidores = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'nome',
      sortOrder = 'ASC',
      status,
      setor
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filtro de busca
    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { cargo: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtros específicos
    if (status) whereClause.status = status;
    if (setor) whereClause.setor = setor;

    const { count, rows: servidores } = await Servidor.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json(new SuccessResponse({
      items: servidores,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit)
    }));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter servidor por ID
// @route   GET /api/servidores/:id
// @access  Privado
exports.getServidor = async (req, res, next) => {
  try {
    const servidor = await Servidor.findByPk(req.params.id);

    if (!servidor) {
      return next(new ErrorResponse('Servidor não encontrado', 404));
    }

    res.status(200).json(new SuccessResponse(servidor));
  } catch (error) {
    next(error);
  }
};

// @desc    Criar novo servidor
// @route   POST /api/servidores
// @access  Privado (Admin)
exports.createServidor = [upload.single('foto'), async (req, res, next) => {
  try {
    const dadosServidor = { ...req.body };
    
    // Se foi enviada uma foto, adicionar o caminho
    if (req.file) {
      dadosServidor.foto = `/uploads/fotos/${req.file.filename}`;
    }
    
    // Parse do endereço se for string JSON
    if (typeof dadosServidor.endereco === 'string') {
      try {
        dadosServidor.endereco = JSON.parse(dadosServidor.endereco);
      } catch (e) {
        // Se não conseguir fazer parse, manter como string
      }
    }

    const servidor = await Servidor.create(dadosServidor);

    res.status(201).json(new SuccessResponse(servidor, 'Servidor criado com sucesso'));
  } catch (error) {
    next(error);
  }
}];

// @desc    Atualizar servidor
// @route   PUT /api/servidores/:id
// @access  Privado (Admin)
exports.updateServidor = [upload.single('foto'), async (req, res, next) => {
  try {
    const servidor = await Servidor.findByPk(req.params.id);

    if (!servidor) {
      return next(new ErrorResponse('Servidor não encontrado', 404));
    }

    const dadosAtualizacao = { ...req.body };
    
    // Se foi enviada uma nova foto
    if (req.file) {
      // Remover foto antiga se existir
      if (servidor.foto) {
        const fs = require('fs');
        const fotoAntigaPath = path.join(process.cwd(), servidor.foto.replace('/', path.sep));
        if (fs.existsSync(fotoAntigaPath) && !servidor.foto.includes('default')) {
          fs.unlinkSync(fotoAntigaPath);
        }
      }
      dadosAtualizacao.foto = `/uploads/fotos/${req.file.filename}`;
    }
    
    // Parse do endereço se for string JSON
    if (typeof dadosAtualizacao.endereco === 'string') {
      try {
        dadosAtualizacao.endereco = JSON.parse(dadosAtualizacao.endereco);
      } catch (e) {
        // Se não conseguir fazer parse, manter como string
      }
    }

    await servidor.update(dadosAtualizacao);

    res.status(200).json(new SuccessResponse(servidor, 'Servidor atualizado com sucesso'));
  } catch (error) {
    next(error);
  }
}];

// @desc    Deletar servidor
// @route   DELETE /api/servidores/:id
// @access  Privado (Admin)
exports.deleteServidor = async (req, res, next) => {
  try {
    const servidor = await Servidor.findByPk(req.params.id);

    if (!servidor) {
      return next(new ErrorResponse('Servidor não encontrado', 404));
    }

    await servidor.destroy();

    res.status(200).json(new SuccessResponse(null, 'Servidor deletado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Upload de foto do servidor
// @route   POST /api/servidores/:id/foto
// @access  Privado (Admin)
exports.uploadFoto = [upload.single('foto'), async (req, res, next) => {
  try {
    const servidor = await Servidor.findByPk(req.params.id);

    if (!servidor) {
      return next(new ErrorResponse('Servidor não encontrado', 404));
    }

    if (!req.file) {
      return next(new ErrorResponse('Nenhum arquivo foi enviado', 400));
    }

    // Atualizar caminho da foto
    await servidor.update({ foto: `/uploads/fotos/${req.file.filename}` });

    res.status(200).json(new SuccessResponse(servidor, 'Foto atualizada com sucesso'));
  } catch (error) {
    next(error);
  }
}];

// @desc    Associar fotos automaticamente baseado no nome
// @route   POST /api/servidores/associar-fotos
// @access  Privado (Admin)
exports.associarFotos = async (req, res, next) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    
    // Verificar se o diretório existe
    if (!fs.existsSync(uploadsPath)) {
      return next(new ErrorResponse('Diretório de uploads não encontrado', 404));
    }

    // Listar todos os arquivos de imagem no diretório uploads
    const files = fs.readdirSync(uploadsPath).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext);
    });

    let associacoes = 0;
    let erros = [];

    for (const file of files) {
      try {
        // Extrair o nome do arquivo sem extensão
        const nomeArquivo = path.parse(file).name;
        
        // Buscar funcionário com nome similar
        const servidor = await Servidor.findOne({
          where: {
            nome: {
              [Op.like]: `%${nomeArquivo}%`
            }
          }
        });

        if (servidor) {
          // Verificar se já tem foto associada
          if (!servidor.foto || servidor.foto === null) {
            await servidor.update({ foto: `/uploads/${file}` });
            associacoes++;
          }
        } else {
          // Tentar busca mais flexível (por partes do nome)
          const partesNome = nomeArquivo.split(/[\s_-]+/);
          if (partesNome.length >= 2) {
            const primeiroNome = partesNome[0];
            const ultimoNome = partesNome[partesNome.length - 1];
            
            const servidorFlexivel = await Servidor.findOne({
              where: {
                [Op.and]: [
                  {
                    nome: {
                      [Op.like]: `%${primeiroNome}%`
                    }
                  },
                  {
                    nome: {
                      [Op.like]: `%${ultimoNome}%`
                    }
                  }
                ]
              }
            });

            if (servidorFlexivel && (!servidorFlexivel.foto || servidorFlexivel.foto === null)) {
              await servidorFlexivel.update({ foto: `/uploads/${file}` });
              associacoes++;
            }
          }
        }
      } catch (fileError) {
        erros.push(`Erro ao processar ${file}: ${fileError.message}`);
      }
    }

    const resultado = {
      totalArquivos: files.length,
      associacoesRealizadas: associacoes,
      erros: erros
    };

    res.status(200).json(new SuccessResponse(resultado, 
      `Processo concluído: ${associacoes} fotos associadas de ${files.length} arquivos processados`
    ));
  } catch (error) {
    next(error);
  }
};