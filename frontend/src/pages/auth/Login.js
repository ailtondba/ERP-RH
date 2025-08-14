import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiWifi, FiServer } from 'react-icons/fi';
import Swal from 'sweetalert2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorLog, setErrorLog] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Verificar conectividade ao carregar o componente
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Verificar conectividade com o backend
  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('error');
        setErrorLog({
          type: 'connection',
          message: `Servidor respondeu com status ${response.status}`,
          details: 'O backend está rodando mas retornou um erro',
          timestamp: new Date().toLocaleString(),
          suggestion: 'Verifique se o servidor backend está funcionando corretamente'
        });
        return false;
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setErrorLog({
        type: 'network',
        message: 'Não foi possível conectar ao servidor',
        details: error.message || 'Erro de rede ou servidor offline',
        timestamp: new Date().toLocaleString(),
        suggestion: 'Verifique se o backend está rodando na porta 5000'
      });
      return false;
    }
  };

  // Criar log detalhado de erro de autenticação
  const createAuthErrorLog = (error, email) => {
    const timestamp = new Date().toLocaleString();
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Erro desconhecido';
      
      switch (status) {
        case 401:
          return {
            type: 'auth',
            message: 'Credenciais inválidas',
            details: message.includes('Credenciais') ? 'Email ou senha incorretos' : message,
            timestamp,
            suggestion: 'Verifique se o email e senha estão corretos. Credenciais de teste: admin@sistema.com / admin123'
          };
        case 400:
          return {
            type: 'validation',
            message: 'Dados inválidos',
            details: message,
            timestamp,
            suggestion: 'Verifique se todos os campos foram preenchidos corretamente'
          };
        case 500:
          return {
            type: 'server',
            message: 'Erro interno do servidor',
            details: 'O servidor encontrou um erro inesperado',
            timestamp,
            suggestion: 'Tente novamente em alguns instantes ou contate o suporte'
          };
        default:
          return {
            type: 'unknown',
            message: `Erro HTTP ${status}`,
            details: message,
            timestamp,
            suggestion: 'Erro inesperado. Tente novamente'
          };
      }
    } else if (error.request) {
      return {
        type: 'network',
        message: 'Sem resposta do servidor',
        details: 'A requisição foi enviada mas não houve resposta',
        timestamp,
        suggestion: 'Verifique sua conexão de internet e se o backend está rodando'
      };
    } else {
      return {
        type: 'client',
        message: 'Erro na aplicação',
        details: error.message || 'Erro desconhecido na aplicação',
        timestamp,
        suggestion: 'Recarregue a página e tente novamente'
      };
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrorLog(null);
    
    // Primeiro, verificar conectividade
    const isConnected = await checkBackendConnection();
    
    if (!isConnected) {
      setLoading(false);
      return;
    }
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        setErrorLog(null);
        navigate('/dashboard');
      } else {
        // Criar log de erro baseado na resposta
        const errorLog = {
          type: 'auth',
          message: 'Falha na autenticação',
          details: result.message || 'Credenciais inválidas',
          timestamp: new Date().toLocaleString(),
          suggestion: 'Verifique suas credenciais. Use: admin@sistema.com / admin123 ou user@sistema.com / user123'
        };
        setErrorLog(errorLog);
        
        Swal.fire({
          icon: 'error',
          title: 'Erro ao fazer login',
          text: result.message || 'Credenciais inválidas. Por favor, tente novamente.',
          confirmButtonColor: '#3B82F6'
        });
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      // Criar log detalhado do erro
      const errorLog = createAuthErrorLog(error, email);
      setErrorLog(errorLog);
      
      Swal.fire({
        icon: 'error',
        title: 'Erro ao fazer login',
        text: errorLog.message,
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Fazer Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Entre com suas credenciais
        </p>
      </div>
      
      <div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm`}
                placeholder="Digite seu email"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Senha
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm`}
                placeholder="********"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Lembrar-me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/esqueci-senha" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Rodapé com Status de Conectividade e Logs de Erro */}
      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
        {/* Status de Conectividade */}
        <div className="flex items-center justify-center mb-3">
          <div className="flex items-center space-x-2">
            {connectionStatus === 'checking' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Verificando conexão...</span>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <FiWifi className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Conectado ao servidor</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <FiServer className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Servidor offline</span>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <FiAlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-600">Erro no servidor</span>
              </>
            )}
          </div>
        </div>
        
        {/* Log de Erro Detalhado */}
        {errorLog && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {errorLog.message}
                  </h4>
                  <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-800/30 px-2 py-1 rounded">
                    {errorLog.type.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Detalhes:</strong> {errorLog.details}
                  </p>
                  
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Sugestão:</strong> {errorLog.suggestion}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      <strong>Timestamp:</strong> {errorLog.timestamp}
                    </p>
                    
                    <button
                      onClick={() => setErrorLog(null)}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
                    >
                      Limpar log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Credenciais de Teste */}
        {!errorLog && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-center">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Credenciais de Teste
              </h4>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p><strong>Administrador:</strong> admin / 123456</p>
                <p><strong>Operacional:</strong> usuario@sistema.com / 123456</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;