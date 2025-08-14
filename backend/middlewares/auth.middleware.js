const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ErrorResponse } = require('../utils/errorResponse');

// Middleware para proteger rotas que requerem autenticação
exports.protect = async (req, res, next) => {
  let token;

  // Verificar se o token está no cabeçalho de autorização
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Verificar se o token está nos cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse('Não autorizado. Faça login para acessar.', 401));
  }

  try {
    // Verificar se é um token simples (test-token-)
    if (token.startsWith('test-token-')) {
      // Extrair ID do usuário do token simples
      const tokenParts = token.replace('test-token-', '').split('_');
      const userId = parseInt(tokenParts[0]);
      
      if (!userId) {
        return next(new ErrorResponse('Token inválido.', 401));
      }
      
      // Buscar usuário pelo ID
      req.user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (!req.user || !req.user.active) {
        return next(new ErrorResponse('Usuário não encontrado ou inativo.', 401));
      }
      
      next();
    } else {
      // Tentar verificar como JWT (para compatibilidade futura)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!req.user) {
        return next(new ErrorResponse('Usuário não encontrado.', 404));
      }
      
      next();
    }
  } catch (err) {
    return next(new ErrorResponse('Não autorizado. Token inválido.', 401));
  }
};

// Middleware para autorização baseada em funções/permissoões
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Usuário com a função ${req.user.role} não está autorizado a acessar esta rota`,
          403
        )
      );
    }
    next();
  };
};
