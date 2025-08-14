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

module.exports = { ErrorResponse };