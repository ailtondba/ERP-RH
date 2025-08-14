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

module.exports = { SuccessResponse };