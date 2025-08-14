import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros nas respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erro de autenticação (token expirado)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Função utilitária para construir URLs completas das imagens
export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return null;
  
  // Se já é uma URL completa (http/https), retorna como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Se é um caminho relativo, constrói a URL completa
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const apiBaseURL = baseURL.replace('/api', ''); // Remove /api se existir
  
  // Adiciona um timestamp para evitar cache
  const timestamp = new Date().getTime();
  const separator = imagePath.includes('?') ? '&' : '?';
  
  return `${apiBaseURL}${imagePath}${separator}t=${timestamp}`;
};

// Serviços específicos para cada entidade

// Serviço para Funcionários (Colaboradores)
export const funcionariosService = {
  getAll: (params) => api.get('/funcionarios', { params }),
  getById: (id) => api.get(`/funcionarios/${id}`),
  create: (data) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.post('/funcionarios', data, config);
  },
  update: (id, data) => {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.put(`/funcionarios/${id}`, data, config);
  },
  delete: (id) => api.delete(`/funcionarios/${id}`),
  getResumoMes: () => api.get('/relatorios/resumo-mensal'),
  getResumoMensal: () => api.get('/relatorios/resumo-mensal'),
  getFuncionariosPorSetor: () => api.get('/relatorios/servidores-por-setor'),
  exportarPDF: (params) => {
    return api.get('/relatorios/exportar/funcionarios-pdf', { params, responseType: 'blob' });
  },
  exportCSV: (params) => {
    return api.get('/relatorios/exportar/funcionarios-csv', { params, responseType: 'blob' });
  },
  importCSV: (formData) => api.post('/funcionarios/importar-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadFoto: (id, formData) => api.post(`/funcionarios/${id}/foto`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  associarFotos: () => api.post('/funcionarios/associar-fotos'),
};

// Serviço para Férias
export const feriasService = {
  getAll: (params) => api.get('/ferias', { params }),
  getById: (id) => api.get(`/ferias/${id}`),
  create: (data) => api.post('/ferias', data),
  update: (id, data) => api.put(`/ferias/${id}`, data),
  delete: (id) => api.delete(`/ferias/${id}`),
  getFeriasAtivas: () => api.get('/ferias/ativas'),
  getFeriasMesAtual: () => api.get('/ferias/mes-atual'),
};

// Serviço para Aniversariantes
export const aniversariantesService = {
  getByMes: (mes) => api.get(`/aniversariantes/${mes}`),
  getAniversariantesSemana: () => api.get('/aniversariantes/semana'),
  getByAno: (ano) => api.get(`/aniversariantes/ano/${ano || new Date().getFullYear()}`),
  exportarPDF: (mes) => {
    return api.get(`/aniversariantes/${mes}/pdf`, { responseType: 'blob' });
  },
};

// Serviço para Endereços
export const enderecosService = {
  getAll: (params) => api.get('/enderecos', { params }),
  getById: (id) => api.get(`/enderecos/${id}`),
  create: (data) => api.post('/enderecos', data),
  update: (id, data) => api.put(`/enderecos/${id}`, data),
  delete: (id) => api.delete(`/enderecos/${id}`),
};

// Serviço para Relatórios
export const relatoriosService = {
  getResumoMensal: () => api.get('/funcionarios/resumo-mensal'),
  getRelatorio: (tipo, params) => api.get(`/relatorios/${tipo}`, { params }),
  getFuncionariosPorSetor: () => api.get('/relatorios/funcionarios-por-setor'),
  getFeriasPorMes: (ano) => api.get(`/relatorios/ferias-por-mes/${ano}`),
  exportarRelatorio: (tipo, params) => api.get(`/relatorios/exportar/${tipo}`, { 
    params,
    responseType: 'blob' 
  }),
};

// Serviço para Usuários
export const usuariosService = {
  getAll: (params) => api.get('/usuarios', { params }),
  getById: (id) => api.get(`/usuarios/${id}`),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`),
  getNotificationConfig: () => api.get('/usuarios/notification-config'),
  updateNotificationConfig: (data) => api.put('/usuarios/notification-config', data),
  updateProfile: (data) => api.put('/usuarios/profile', data),
  changePassword: (data) => api.put('/usuarios/change-password', data),
};

// Alias para compatibilidade com componentes existentes
export const servidoresService = funcionariosService;
export const servidorService = funcionariosService;