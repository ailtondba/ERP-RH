import React, { useState, useEffect, useContext } from 'react';
import { 
  FiSave, FiUser, FiLock, FiMail, FiSettings, 
  FiShield, FiDatabase, FiUsers, FiEye, FiEyeOff, 
  FiAlertTriangle, FiCheck, FiEdit, FiEdit2, FiTrash2, FiRefreshCw, FiKey, FiBell,
  FiUserX, FiUserCheck
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Swal from 'sweetalert2';
import { usuariosService } from '../../services/api';

const Configuracoes = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme(); 
  // Estados para as diferentes seções de configurações
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Estados para configurações de perfil
  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    email: '',
    cargo: '',
    telefone: ''
  });
  
  // Estados para configurações de senha
  const [senhaForm, setSenhaForm] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  
  // Estados para configurações do sistema (apenas para administradores)
  const [configSistema, setConfigSistema] = useState({
    nome_sistema: 'Sistema ERP de RH',
    logo_url: '',
    cor_primaria: '#3B82F6',
    cor_secundaria: '#1E40AF',
    max_upload_size: 5,
    timeout_sessao: 30,
    backup_automatico: true,
    intervalo_backup: 'diario'
  });
  
  // Estados para configurações de notificações
  const [configNotificacoes, setConfigNotificacoes] = useState({
    email_aniversarios: true,
    email_ferias_proximas: true,
    email_novos_usuarios: true,
    notificacoes_sistema: true
  });
  
  // Estados para gerenciamento de usuários (apenas para administradores)
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usuarioForm, setUsuarioForm] = useState({
    nome: '',
    usuario: '',
    senha: '',
    nivel_acesso: 'usuario',
    ativo: true
  });
  const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
  
  useEffect(() => {
    // Carregar dados do usuário atual para o formulário de perfil
    if (user) {
      setPerfilForm({
        nome: user.nome || '',
        email: user.email || '',
        cargo: user.cargo || '',
        telefone: user.telefone || ''
      });
    }
    
    // Se o usuário for administrador, carregar lista de usuários
    if (user && user.nivel_acesso === 'admin') {
      carregarUsuarios();
      carregarConfiguracoesDoSistema();
    }
    
    // Carregar configurações de notificações do usuário
    carregarConfiguracoesDeNotificacoes();
  }, [user]);
  
  const carregarUsuarios = async () => {
    try {
      setLoadingUsers(true);
      const response = await usuariosService.getAll();
      // A API retorna { items: [...] } então precisamos acessar response.data.items
      setUsuarios(response.data.items || response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      
      let errorMessage = 'Não foi possível carregar a lista de usuários.';
      let errorTitle = 'Erro ao carregar usuários';
      
      if (!error.response) {
        // Erro de rede ou servidor indisponível
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
        errorTitle = 'Erro de Conexão';
      } else if (error.response.status >= 500) {
        // Erro interno do servidor
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        errorTitle = 'Erro do Servidor';
      } else if (error.response.status === 403) {
        // Acesso negado
        errorMessage = 'Você não tem permissão para acessar a lista de usuários.';
        errorTitle = 'Acesso Negado';
      } else if (error.response.status === 401) {
        // Não autorizado - será tratado pelo interceptor
        return;
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const carregarConfiguracoesDoSistema = async () => {
    try {
      setLoading(true);
      const response = await usuariosService.getSystemConfig();
      setConfigSistema(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações do sistema:', error);
      // Não exibir alerta para não interromper o fluxo do usuário
    } finally {
      setLoading(false);
    }
  };
  
  const carregarConfiguracoesDeNotificacoes = async () => {
    try {
      setLoading(true);
      const response = await usuariosService.getNotificationConfig();
      setConfigNotificacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações de notificações:', error);
      // Não exibir alerta para não interromper o fluxo do usuário
    } finally {
      setLoading(false);
    }
  };
  
  const handlePerfilChange = (e) => {
    const { name, value } = e.target;
    setPerfilForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSenhaChange = (e) => {
    const { name, value } = e.target;
    setSenhaForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleConfigSistemaChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigSistema(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleNotificacoesChange = (e) => {
    const { name, checked } = e.target;
    setConfigNotificacoes(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleUsuarioChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUsuarioForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const salvarPerfil = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!perfilForm.nome || !perfilForm.email) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obrigatórios',
        text: 'Nome e e-mail são campos obrigatórios.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    try {
      setLoading(true);
      await updateProfile(perfilForm);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      Swal.fire({
        icon: 'success',
        title: 'Perfil atualizado',
        text: 'Suas informações de perfil foram atualizadas com sucesso.',
        confirmButtonColor: '#3B82F6'
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      let errorMessage = 'Não foi possível atualizar suas informações.';
      let errorTitle = 'Erro ao atualizar perfil';
      
      if (!error.response) {
        // Erro de rede ou servidor indisponível
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
        errorTitle = 'Erro de Conexão';
      } else if (error.response.status >= 500) {
        // Erro interno do servidor
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        errorTitle = 'Erro do Servidor';
      } else if (error.response.status === 409) {
        // Conflito - email já existe
        errorMessage = 'Este e-mail já está sendo usado por outro usuário.';
        errorTitle = 'E-mail já cadastrado';
      } else if (error.response.status === 400) {
        // Dados inválidos
        errorMessage = error.response.data?.message || 'Dados inválidos. Verifique as informações preenchidas.';
        errorTitle = 'Dados Inválidos';
      } else if (error.response.status === 401) {
        // Não autorizado - será tratado pelo interceptor
        return;
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const alterarSenha = async (e) => {
    e.preventDefault();
    
    // Validação
    if (!senhaForm.senha_atual || !senhaForm.nova_senha || !senhaForm.confirmar_senha) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obrigatórios',
        text: 'Todos os campos são obrigatórios.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    if (senhaForm.nova_senha !== senhaForm.confirmar_senha) {
      Swal.fire({
        icon: 'error',
        title: 'Senhas não conferem',
        text: 'A nova senha e a confirmação devem ser iguais.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    if (senhaForm.nova_senha.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Senha muito curta',
        text: 'A nova senha deve ter pelo menos 6 caracteres.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    try {
      setLoading(true);
      await usuariosService.changePassword(senhaForm);
      
      // Limpar formulário
      setSenhaForm({
        senha_atual: '',
        nova_senha: '',
        confirmar_senha: ''
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      Swal.fire({
        icon: 'success',
        title: 'Senha alterada',
        text: 'Sua senha foi alterada com sucesso.',
        confirmButtonColor: '#3B82F6'
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      let errorMessage = 'Não foi possível alterar sua senha.';
      let errorTitle = 'Erro ao alterar senha';
      
      if (!error.response) {
        // Erro de rede ou servidor indisponível
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
        errorTitle = 'Erro de Conexão';
      } else if (error.response.status >= 500) {
        // Erro interno do servidor
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        errorTitle = 'Erro do Servidor';
      } else if (error.response.status === 400) {
        // Senha atual incorreta ou dados inválidos
        errorMessage = error.response.data?.message || 'Senha atual incorreta ou dados inválidos.';
        errorTitle = 'Dados Inválidos';
      } else if (error.response.status === 401) {
        // Não autorizado - será tratado pelo interceptor
        return;
      } else {
        errorMessage = error.response?.data?.message || 'Verifique se a senha atual está correta.';
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const salvarConfigSistema = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await usuariosService.updateSystemConfig(configSistema);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      Swal.fire({
        icon: 'success',
        title: 'Configurações salvas',
        text: 'As configurações do sistema foram atualizadas com sucesso.',
        confirmButtonColor: '#3B82F6'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações do sistema:', error);
      
      let errorMessage = 'Não foi possível salvar as configurações do sistema.';
      let errorTitle = 'Erro ao salvar configurações';
      
      if (!error.response) {
        // Erro de rede ou servidor indisponível
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
        errorTitle = 'Erro de Conexão';
      } else if (error.response.status >= 500) {
        // Erro interno do servidor
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        errorTitle = 'Erro do Servidor';
      } else if (error.response.status === 403) {
        // Acesso negado
        errorMessage = 'Você não tem permissão para alterar as configurações do sistema.';
        errorTitle = 'Acesso Negado';
      } else if (error.response.status === 400) {
        // Dados inválidos
        errorMessage = error.response.data?.message || 'Dados inválidos nas configurações.';
        errorTitle = 'Dados Inválidos';
      } else if (error.response.status === 401) {
        // Não autorizado - será tratado pelo interceptor
        return;
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const salvarConfigNotificacoes = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await usuariosService.updateNotificationConfig(configNotificacoes);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      Swal.fire({
        icon: 'success',
        title: 'Preferências salvas',
        text: 'Suas preferências de notificação foram atualizadas com sucesso.',
        confirmButtonColor: '#3B82F6'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de notificações:', error);
      
      let errorMessage = 'Não foi possível salvar suas preferências de notificação.';
      let errorTitle = 'Erro ao salvar preferências';
      
      if (!error.response) {
        // Erro de rede ou servidor indisponível
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
        errorTitle = 'Erro de Conexão';
      } else if (error.response.status >= 500) {
        // Erro interno do servidor
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        errorTitle = 'Erro do Servidor';
      } else if (error.response.status === 400) {
        // Dados inválidos
        errorMessage = error.response.data?.message || 'Dados inválidos nas preferências.';
        errorTitle = 'Dados Inválidos';
      } else if (error.response.status === 401) {
        // Não autorizado - será tratado pelo interceptor
        return;
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const limparFormularioUsuario = () => {
    setUsuarioForm({
      nome: '',
      usuario: '',
      senha: '',
      nivel_acesso: 'usuario',
      ativo: true
    });
    setEditandoUsuarioId(null);
  };

  const salvarUsuario = async (e) => {
    e.preventDefault();
    
    // Prevenir múltiplas submissões
    if (loading) {
      return;
    }
    
    // Validações mais robustas
    if (!usuarioForm.nome?.trim() || !usuarioForm.usuario?.trim() || !usuarioForm.senha?.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obrigatórios',
        text: 'Nome, usuário e senha são campos obrigatórios.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    // Validação de usuário mínimo
    if (usuarioForm.usuario.trim().length < 3) {
      Swal.fire({
        icon: 'error',
        title: 'Usuário muito curto',
        text: 'O nome de usuário deve ter pelo menos 3 caracteres.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    // Validação de senha mínima
    if (usuarioForm.senha.trim().length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Senha muito curta',
        text: 'A senha deve ter pelo menos 6 caracteres.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    // Validação de nome mínimo
    if (usuarioForm.nome.trim().length < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Nome muito curto',
        text: 'O nome deve ter pelo menos 2 caracteres.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      if (editandoUsuarioId) {
        // Atualizar usuário existente
        await usuariosService.update(editandoUsuarioId, usuarioForm);
        Swal.fire({
          icon: 'success',
          title: 'Usuário atualizado',
          text: 'As informações do usuário foram atualizadas com sucesso.',
          confirmButtonColor: '#3B82F6'
        });
      } else {
        // Criar novo usuário
        await usuariosService.create(usuarioForm);
        Swal.fire({
          icon: 'success',
          title: 'Usuário criado',
          text: 'O novo usuário foi criado com sucesso.',
          confirmButtonColor: '#3B82F6'
        });
      }
      
      // Limpar formulário e recarregar lista
      limparFormularioUsuario();
      carregarUsuarios();
      
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      
      let errorMessage = 'Não foi possível salvar as informações do usuário.';
      let errorTitle = 'Erro ao salvar usuário';
      
      if (!error.response) {
        // Erro de rede ou servidor indisponível
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
        errorTitle = 'Erro de Conexão';
      } else if (error.response.status >= 500) {
        // Erro interno do servidor
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        errorTitle = 'Erro do Servidor';
      } else if (error.response.status === 409) {
        // Conflito - email já existe
        errorMessage = 'Este e-mail já está sendo usado por outro usuário. Escolha um e-mail diferente.';
        errorTitle = 'E-mail já cadastrado';
      } else if (error.response.status === 400) {
        // Dados inválidos
        errorMessage = error.response.data?.message || 'Dados inválidos. Verifique as informações preenchidas.';
        errorTitle = 'Dados Inválidos';
      } else if (error.response.status === 403) {
        // Acesso negado
        errorMessage = 'Você não tem permissão para realizar esta ação.';
        errorTitle = 'Acesso Negado';
      } else if (error.response.status === 401) {
        // Não autorizado - será tratado pelo interceptor
        return;
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const editarUsuario = (usuario) => {
    // Verificar se há dados não salvos no formulário atual
    const hasUnsavedData = usuarioForm.nome || usuarioForm.usuario || usuarioForm.senha;
    
    if (hasUnsavedData && !editandoUsuarioId) {
      Swal.fire({
        title: 'Dados não salvos',
        text: 'Há dados não salvos no formulário. Deseja continuar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, continuar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          setUsuarioForm({
            nome: usuario.nome || '',
            usuario: usuario.usuario || '',
            senha: '', // Não preencher senha por segurança
            nivel_acesso: usuario.nivel_acesso || 'usuario',
            ativo: usuario.ativo !== undefined ? usuario.ativo : true
          });
          setEditandoUsuarioId(usuario.id);
        }
      });
    } else {
      setUsuarioForm({
        nome: usuario.nome || '',
        usuario: usuario.usuario || '',
        senha: '', // Não preencher senha por segurança
        nivel_acesso: usuario.nivel_acesso || 'usuario',
        ativo: usuario.ativo !== undefined ? usuario.ativo : true
      });
      setEditandoUsuarioId(usuario.id);
    }
  };
  
  const cancelarEdicaoUsuario = () => {
    limparFormularioUsuario();
  };
  
  const excluirUsuario = async (usuarioId) => {
    // Verificar se não está tentando excluir o próprio usuário
    if (user && user.id === usuarioId) {
      Swal.fire({
        icon: 'error',
        title: 'Ação não permitida',
        text: 'Você não pode excluir sua própria conta.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Confirmar exclusão',
      text: 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3B82F6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      try {
        setLoading(true);
        await usuariosService.delete(usuarioId);
        
        Swal.fire({
          icon: 'success',
          title: 'Usuário excluído',
          text: 'O usuário foi excluído com sucesso.',
          confirmButtonColor: '#3B82F6'
        });
        
        // Recarregar lista de usuários
        carregarUsuarios();
        
        // Se estava editando o usuário excluído, limpar formulário
        if (editandoUsuarioId === usuarioId) {
          limparFormularioUsuario();
        }
        
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        
        let errorMessage = 'Não foi possível excluir o usuário.';
        let errorTitle = 'Erro ao excluir usuário';
        
        if (!error.response) {
          // Erro de rede ou servidor indisponível
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
          errorTitle = 'Erro de Conexão';
        } else if (error.response.status >= 500) {
          // Erro interno do servidor
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
          errorTitle = 'Erro do Servidor';
        } else if (error.response.status === 403) {
          // Acesso negado
          errorMessage = 'Você não tem permissão para excluir usuários.';
          errorTitle = 'Acesso Negado';
        } else if (error.response.status === 404) {
          // Usuário não encontrado
          errorMessage = 'Usuário não encontrado. Ele pode já ter sido excluído.';
          errorTitle = 'Usuário não encontrado';
          // Recarregar lista para atualizar
          carregarUsuarios();
        } else if (error.response.status === 400) {
          // Dados inválidos ou restrições
          errorMessage = error.response.data?.message || 'Não é possível excluir este usuário devido a restrições do sistema.';
          errorTitle = 'Exclusão não permitida';
        } else if (error.response.status === 401) {
          // Não autorizado - será tratado pelo interceptor
          return;
        } else {
          errorMessage = error.response?.data?.message || errorMessage;
        }
        
        Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: '#3B82F6'
        });
      } finally {
        setLoading(false);
      }
    }
  };
  

  
  const tabs = [
    { id: 'perfil', name: 'Perfil', icon: FiUser },
    { id: 'senha', name: 'Senha', icon: FiLock },
    { id: 'notificacoes', name: 'Notificações', icon: FiBell },
    ...(user && user.nivel_acesso === 'admin' ? [
      { id: 'sistema', name: 'Sistema', icon: FiSettings },
      { id: 'usuarios', name: 'Usuários', icon: FiUsers }
    ] : [])
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 dark:border-secondary-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="mt-6">
            {/* Seção de Perfil */}
            {activeTab === 'perfil' && (
              <div className="bg-white dark:bg-secondary-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Informações do Perfil
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Atualize suas informações pessoais e de contato.
                  </p>
                  
                  <form onSubmit={salvarPerfil} className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          name="nome"
                          id="nome"
                          value={perfilForm.nome}
                          onChange={handlePerfilChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          E-mail
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={perfilForm.email}
                          onChange={handlePerfilChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Cargo
                        </label>
                        <input
                          type="text"
                          name="cargo"
                          id="cargo"
                          value={perfilForm.cargo}
                          onChange={handlePerfilChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          name="telefone"
                          id="telefone"
                          value={perfilForm.telefone}
                          onChange={handlePerfilChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <FiSave className="-ml-1 mr-2 h-5 w-5" />
                            Salvar Alterações
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Seção de Senha */}
            {activeTab === 'senha' && (
              <div className="bg-white dark:bg-secondary-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Alterar Senha
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Mantenha sua conta segura com uma senha forte.
                  </p>
                  
                  <form onSubmit={alterarSenha} className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="senha_atual" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Senha Atual
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showSenhaAtual ? 'text' : 'password'}
                          name="senha_atual"
                          id="senha_atual"
                          value={senhaForm.senha_atual}
                          onChange={handleSenhaChange}
                          className="block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                        >
                          {showSenhaAtual ? (
                            <FiEyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FiEye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="nova_senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nova Senha
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showNovaSenha ? 'text' : 'password'}
                          name="nova_senha"
                          id="nova_senha"
                          value={senhaForm.nova_senha}
                          onChange={handleSenhaChange}
                          className="block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNovaSenha(!showNovaSenha)}
                        >
                          {showNovaSenha ? (
                            <FiEyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FiEye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmar_senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirmar Nova Senha
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showConfirmarSenha ? 'text' : 'password'}
                          name="confirmar_senha"
                          id="confirmar_senha"
                          value={senhaForm.confirmar_senha}
                          onChange={handleSenhaChange}
                          className="block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                        >
                          {showConfirmarSenha ? (
                            <FiEyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FiEye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Alterando...
                          </>
                        ) : (
                          <>
                            <FiKey className="-ml-1 mr-2 h-5 w-5" />
                            Alterar Senha
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Seção de Notificações */}
            {activeTab === 'notificacoes' && (
              <div className="bg-white dark:bg-secondary-800 shadow rounded-lg">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Preferências de Notificação
                  </h3>
                  
                  <form onSubmit={salvarConfigNotificacoes} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="emailNotificacoes"
                            name="emailNotificacoes"
                            type="checkbox"
                            checked={configNotificacoes.email_aniversarios}
                            onChange={handleNotificacoesChange}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="emailNotificacoes" className="font-medium text-gray-700 dark:text-gray-300">
                            Notificações por E-mail
                          </label>
                          <p className="text-gray-500 dark:text-gray-400">Receba notificações importantes por e-mail.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="pushNotificacoes"
                            name="pushNotificacoes"
                            type="checkbox"
                            checked={configNotificacoes.email_ferias_proximas}
                            onChange={handleNotificacoesChange}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="pushNotificacoes" className="font-medium text-gray-700 dark:text-gray-300">
                            Notificações Push
                          </label>
                          <p className="text-gray-500 dark:text-gray-400">Receba notificações push no navegador.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="aniversarios"
                            name="aniversarios"
                            type="checkbox"
                            checked={configNotificacoes.email_novos_usuarios}
                            onChange={handleNotificacoesChange}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="aniversarios" className="font-medium text-gray-700 dark:text-gray-300">
                            Aniversários
                          </label>
                          <p className="text-gray-500 dark:text-gray-400">Receba lembretes de aniversários dos funcionários.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="ferias"
                            name="ferias"
                            type="checkbox"
                            checked={configNotificacoes.notificacoes_sistema}
                            onChange={handleNotificacoesChange}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="ferias" className="font-medium text-gray-700 dark:text-gray-300">
                            Férias
                          </label>
                          <p className="text-gray-500 dark:text-gray-400">Receba notificações sobre solicitações de férias.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <FiBell className="-ml-1 mr-2 h-5 w-5" />
                            Salvar Preferências
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}


            {activeTab === 'sistema' && user && user.nivel_acesso === 'admin' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                  Configurações do Sistema
                </h3>

                <form onSubmit={salvarConfigSistema} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="nomeEmpresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        id="nomeEmpresa"
                        name="nomeEmpresa"
                        value={configSistema.nome_sistema}
                        onChange={handleConfigSistemaChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        id="cnpj"
                        name="cnpj"
                        value={configSistema.logo_url}
                        onChange={handleConfigSistemaChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        id="endereco"
                        name="endereco"
                        value={configSistema.cor_primaria}
                        onChange={handleConfigSistemaChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="telefoneEmpresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        id="telefoneEmpresa"
                        name="telefoneEmpresa"
                        value={configSistema.cor_secundaria}
                        onChange={handleConfigSistemaChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="manutencao"
                          name="manutencao"
                          type="checkbox"
                          checked={configSistema.backup_automatico}
                          onChange={handleConfigSistemaChange}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="manutencao" className="font-medium text-gray-700 dark:text-gray-300">
                          Modo Manutenção
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Ative para impedir o acesso de usuários não administradores.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="registroPublico"
                          name="registroPublico"
                          type="checkbox"
                          checked={configSistema.timeout_sessao > 0}
                          onChange={handleConfigSistemaChange}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="registroPublico" className="font-medium text-gray-700 dark:text-gray-300">
                          Registro Público
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Permitir que novos usuários se registrem no sistema.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <FiSettings className="-ml-1 mr-2 h-5 w-5" />
                          Salvar Configurações
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Seção de Usuários */}
            {activeTab === 'usuarios' && user && user.nivel_acesso === 'admin' && (
              <div className="bg-white dark:bg-secondary-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Gerenciamento de Usuários
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Adicione, edite ou remova usuários do sistema.
                  </p>
                  
                  {/* Formulário de usuário */}
                  <form onSubmit={salvarUsuario} className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="usuario_nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          name="nome"
                          id="usuario_nome"
                          value={usuarioForm.nome}
                          onChange={handleUsuarioChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="usuario_usuario" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Usuário
                        </label>
                        <input
                          type="text"
                          name="usuario"
                          id="usuario_usuario"
                          value={usuarioForm.usuario}
                          onChange={handleUsuarioChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="usuario_senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Senha
                        </label>
                        <input
                          type="password"
                          name="senha"
                          id="usuario_senha"
                          value={usuarioForm.senha}
                          onChange={handleUsuarioChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="usuario_nivel_acesso" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nível de Usuário
                        </label>
                        <select
                          name="nivel_acesso"
                          id="usuario_nivel_acesso"
                          value={usuarioForm.nivel_acesso}
                          onChange={handleUsuarioChange}
                          className="mt-1 block w-full border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          <option value="usuario">Usuário</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="ativo"
                        id="usuario_ativo"
                        checked={usuarioForm.ativo}
                        onChange={handleUsuarioChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="usuario_ativo" className="ml-2 block text-sm text-gray-900 dark:text-white">
                        Usuário ativo
                      </label>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      {editandoUsuarioId && (
                        <button
                          type="button"
                          onClick={cancelarEdicaoUsuario}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {editandoUsuarioId ? 'Atualizando...' : 'Criando...'}
                          </>
                        ) : (
                          <>
                            <FiSave className="-ml-1 mr-2 h-5 w-5" />
                            {editandoUsuarioId ? 'Atualizar Usuário' : 'Criar Usuário'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  {/* Lista de usuários */}
                  <div className="mt-8">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Usuários Cadastrados
                    </h4>
                    
                    {loadingUsers ? (
                      <div className="flex justify-center py-4">
                        <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-secondary-700">
                          <thead className="bg-gray-50 dark:bg-secondary-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Nome
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Usuário
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Nível
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                            {usuarios.map((usuario) => (
                              <tr key={usuario.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {usuario.nome}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {usuario.usuario}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    usuario.nivel_acesso === 'admin' 
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }`}>
                                    {usuario.nivel_acesso === 'admin' ? 'Admin' : 'Usuário'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    usuario.ativo 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => editarUsuario(usuario)}
                                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                    >
                                      <FiEdit2 className="h-4 w-4" />
                                    </button>
                                    {user && user.id !== usuario.id && (
                                      <button
                                        onClick={() => excluirUsuario(usuario.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                      >
                                        <FiTrash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;