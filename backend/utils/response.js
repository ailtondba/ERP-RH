// Classe para respostas de sucesso
class SuccessResponse {
  constructor(data = null, message = 'Operação realizada com sucesso') {
    this.success = true;
    this.message = message;
    this.data = data;
  }

  // Método estático para respostas de sucesso
  static send(res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
}

// Classe para respostas de erro
class ErrorResponse extends Error {
  constructor(message = 'Erro interno do servidor', statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Método estático para respostas de erro
  static send(res, message = 'Erro interno do servidor', statusCode = 500, details = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined
    });
  }
}

// Middleware para tratamento de erros
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Erros do Mongoose para campos obrigatórios
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return ErrorResponse.send(
      res, 
      'Erro de validação', 
      400, 
      messages
    );
  }

  // Erro de chave duplicada
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Valor duplicado para o campo: ${field}`;
    return ErrorResponse.send(res, message, 400);
  }

  // Erro de token JWT inválido
  if (err.name === 'JsonWebTokenError') {
    return ErrorResponse.send(res, 'Token inválido', 401);
  }

  // Erro de token JWT expirado
  if (err.name === 'TokenExpiredError') {
    return ErrorResponse.send(res, 'Sessão expirada. Faça login novamente', 401);
  }

  // Erro de autenticação
  if (err.name === 'UnauthorizedError') {
    return ErrorResponse.send(res, 'Não autorizado', 401);
  }

  // Erro personalizado
  if (err.isOperational) {
    return ErrorResponse.send(
      res, 
      err.message, 
      err.statusCode || 500, 
      err.details
    );
  }

  // Erro não tratado (500)
  console.error('Erro não tratado:', err);
  ErrorResponse.send(res, 'Erro interno do servidor', 500);
};

// Middleware para rota não encontrada
exports.notFound = (req, res, next) => {
  ErrorResponse.send(res, `Rota não encontrada: ${req.originalUrl}`, 404);
};

// Exportar classes
module.exports.SuccessResponse = SuccessResponse;
module.exports.ErrorResponse = ErrorResponse;
