const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { ErrorResponse, SuccessResponse } = require('../utils/response');

// @desc    Registrar um novo usuário
// @route   POST /api/auth/register
// @access  Público
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return next(new ErrorResponse('E-mail já cadastrado', 400));
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Gerar token JWT
    const token = user.getSignedJwtToken();

    // Remover a senha do retorno
    user.password = undefined;

    res.status(201).json(new SuccessResponse({
      token,
      user
    }, 'Usuário registrado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Fazer login
// @route   POST /api/auth/login
// @access  Público
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar e-mail e senha
    if (!email || !password) {
      return next(new ErrorResponse('Por favor, informe e-mail e senha', 400));
    }

    // Verificar usuário (incluindo senha para comparação)
    const user = await User.findOne({ 
      where: { email },
      attributes: { include: ['password'] }
    });
    if (!user) {
      return next(new ErrorResponse('Credenciais inválidas', 401));
    }

    // Verificar senha
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Credenciais inválidas', 401));
    }

    // Criar token
    const token = user.getSignedJwtToken();

    // Remover a senha do retorno
    user.password = undefined;

    res.status(200).json(new SuccessResponse({
      token,
      user
    }, 'Login realizado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Obter perfil do usuário logado
// @route   GET /api/auth/me
// @access  Privado
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json(new SuccessResponse(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar perfil do usuário
// @route   PUT /api/auth/updatedetails
// @access  Privado
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    await user.update(fieldsToUpdate);

    // Remover a senha do retorno
    user.password = undefined;

    res.status(200).json(new SuccessResponse(user, 'Perfil atualizado com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Atualizar senha
// @route   PUT /api/auth/updatepassword
// @access  Privado
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return next(new ErrorResponse('Usuário não encontrado', 404));
    }

    // Verificar senha atual
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Senha atual incorreta', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    // Remover a senha do retorno
    user.password = undefined;

    res.status(200).json(new SuccessResponse(null, 'Senha atualizada com sucesso'));
  } catch (error) {
    next(error);
  }
};

// @desc    Esqueci minha senha
// @route   POST /api/auth/forgotpassword
// @access  Público
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      return next(new ErrorResponse('Não há usuário com esse e-mail', 404));
    }

    // Gerar token de redefinição
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // URL de redefinição
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    // TODO: Implementar envio de e-mail
    console.log(`Token de redefinição: ${resetToken}`);
    console.log(`URL de redefinição: ${resetUrl}`);

    res.status(200).json(new SuccessResponse(
      { token: resetToken },
      'E-mail com as instruções para redefinição de senha enviado com sucesso'
    ));
  } catch (error) {
    console.error(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    next(error);
  }
};

// @desc    Redefinir senha
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Público
exports.resetPassword = async (req, res, next) => {
  try {
    // Obter token hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return next(new ErrorResponse('Token inválido ou expirado', 400));
    }

    // Definir nova senha
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Gerar novo token JWT
    const token = user.getSignedJwtToken();

    res.status(200).json(new SuccessResponse(
      { token },
      'Senha redefinida com sucesso'
    ));
  } catch (error) {
    next(error);
  }
};
