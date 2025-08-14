import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiSave, FiX, FiUpload, FiTrash2, FiArrowLeft,
  FiUser, FiMail, FiPhone, FiHash, FiBriefcase, FiCalendar, FiMapPin
} from 'react-icons/fi';
import { funcionariosService, getImageUrl } from '../../services/api';
import Swal from 'sweetalert2';

const ServidorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    cargo: '',
    cpf: '',
    rg: '',
    email: '',
    telefone: '',
    data_admissao: '',
    data_nascimento: '',
    setor: '',
    status: 'ativo',
    vinculo: 'Efetivo',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: ''
    }
  });
  
  const [errors, setErrors] = useState({});
  
  // Lista de setores e vínculos para os selects
  const setores = ['Administração', 'Financeiro', 'RH', 'TI', 'Jurídico', 'Operacional', 'Comercial'];
  const vinculos = ['Efetivo', 'Comissionado', 'Temporário', 'Estagiário', 'Terceirizado'];
  const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchServidor();
    }
  }, [id]);

  const fetchServidor = async () => {
    try {
      setLoading(true);
      const response = await funcionariosService.getById(id);
      const servidor = response.data.data || response.data;
      
      setFormData({
        ...servidor,
        data_admissao: formatDateForInput(servidor.data_admissao),
        data_nascimento: formatDateForInput(servidor.data_nascimento),
        endereco: servidor.endereco || {
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: '',
          cep: ''
        }
      });
      
      // Definir preview da foto se existir
      if (servidor.foto && typeof servidor.foto === 'string') {
        setPhotoPreview(getImageUrl(servidor.foto));
      }
    } catch (error) {
      console.error('Erro ao buscar servidor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao buscar servidor',
        text: 'Não foi possível carregar os dados do servidor. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
      navigate('/funcionarios');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPhotoFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    
    // Se estiver em modo de edição, adicionar um campo para indicar que a foto deve ser removida
    if (isEditMode) {
      setFormData(prev => ({
        ...prev,
        removePhoto: true
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Campos obrigatórios: apenas nome, email e CPF
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    
    // Validação de CPF
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf) && !/^\d{11}$/.test(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    // Validação de e-mail
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    // Validações opcionais (apenas formato se preenchido)
    if (formData.endereco.cep && !/^\d{5}-\d{3}$/.test(formData.endereco.cep) && !/^\d{8}$/.test(formData.endereco.cep)) {
      newErrors['endereco.cep'] = 'CEP inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: 'error',
        title: 'Erro de validação',
        text: 'Por favor, corrija os erros no formulário antes de salvar.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    setSaving(true);
    
    try {
      let response;
      
      // Criar FormData para envio de arquivo
      const formDataToSend = new FormData();
      
      // Adicionar dados do servidor
      Object.keys(formData).forEach(key => {
        if (key === 'endereco') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Adicionar foto se houver
      if (photoFile) {
        formDataToSend.append('foto', photoFile);
      }
      
      if (isEditMode) {
        response = await funcionariosService.update(id, formDataToSend);
      } else {
        response = await funcionariosService.create(formDataToSend);
      }
      
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'Servidor atualizado com sucesso!' : 'Servidor cadastrado com sucesso!',
        confirmButtonColor: '#3B82F6'
      }).then(() => {
        navigate('/funcionarios');
      });
    } catch (error) {
      console.error('Erro ao salvar servidor:', error);
      
      Swal.fire({
        icon: 'error',
        title: isEditMode ? 'Erro ao atualizar servidor' : 'Erro ao cadastrar servidor',
        text: error.response?.data?.message || 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/funcionarios');
  };

  const buscarCep = async () => {
    const cep = formData.endereco.cep.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      setErrors(prev => ({
        ...prev,
        'endereco.cep': 'CEP inválido'
      }));
      return;
    }
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setErrors(prev => ({
          ...prev,
          'endereco.cep': 'CEP não encontrado'
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        }
      }));
      
      // Limpar erro de CEP se existir
      if (errors['endereco.cep']) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors['endereco.cep'];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setErrors(prev => ({
        ...prev,
        'endereco.cep': 'Erro ao buscar CEP'
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-center">
          <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Carregando dados do servidor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/funcionarios" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiX className="-ml-1 mr-2 h-5 w-5" />
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <FiSave className="-ml-1 mr-2 h-5 w-5" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Formulário */}
      <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Seção de Foto */}
          <div className="flex flex-col md:flex-row md:space-x-6">
            <div className="flex-shrink-0 mb-6 md:mb-0">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Foto</div>
              <div className="flex flex-col items-center">
                <div className="h-40 w-40 rounded-full overflow-hidden bg-gray-100 dark:bg-secondary-700 mb-4">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Foto do servidor" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <FiUser className="h-20 w-20" />
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <label className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 cursor-pointer">
                    <FiUpload className="-ml-1 mr-2 h-5 w-5" />
                    {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      className="hidden" 
                    />
                  </label>
                  
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700"
                    >
                      <FiTrash2 className="-ml-1 mr-2 h-5 w-5" />
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dados Pessoais */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dados Pessoais</h3>
              </div>
              
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.nome ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                    placeholder="Nome completo do servidor"
                  />
                </div>
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
              </div>
              
              {/* Data de Nascimento */}
              <div>
                <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Nascimento
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="data_nascimento"
                    name="data_nascimento"
                    value={formData.data_nascimento}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.data_nascimento ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                  />
                </div>
                {errors.data_nascimento && <p className="mt-1 text-sm text-red-600">{errors.data_nascimento}</p>}
              </div>
              
              {/* CPF */}
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CPF *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.cpf ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                    placeholder="000.000.000-00"
                  />
                </div>
                {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
              </div>
              
              {/* RG */}
              <div>
                <label htmlFor="rg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RG
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="rg"
                    name="rg"
                    value={formData.rg}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="00.000.000-0"
                  />
                </div>
              </div>
              
              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                    placeholder="email@exemplo.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              
              {/* Telefone */}
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <hr className="border-gray-200 dark:border-secondary-700" />
          
          {/* Dados Profissionais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dados Profissionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Matrícula */}
              <div>
                <label htmlFor="matricula" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Matrícula *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="matricula"
                    name="matricula"
                    value={formData.matricula}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.matricula ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                    placeholder="Número de matrícula"
                  />
                </div>
                {errors.matricula && <p className="mt-1 text-sm text-red-600">{errors.matricula}</p>}
              </div>
              
              {/* Cargo */}
              <div>
                <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.cargo ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                    placeholder="Cargo do servidor"
                  />
                </div>
                {errors.cargo && <p className="mt-1 text-sm text-red-600">{errors.cargo}</p>}
              </div>
              
              {/* Data de Admissão */}
              <div>
                <label htmlFor="data_admissao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Admissão *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="data_admissao"
                    name="data_admissao"
                    value={formData.data_admissao}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.data_admissao ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                  />
                </div>
                {errors.data_admissao && <p className="mt-1 text-sm text-red-600">{errors.data_admissao}</p>}
              </div>
              
              {/* Setor */}
              <div>
                <label htmlFor="setor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Setor *
                </label>
                <select
                  id="setor"
                  name="setor"
                  value={formData.setor}
                  onChange={handleChange}
                  className={`block w-full py-2 px-3 border ${errors.setor ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                >
                  <option value="">Selecione um setor</option>
                  {setores.map((setor) => (
                    <option key={setor} value={setor}>{setor}</option>
                  ))}
                </select>
                {errors.setor && <p className="mt-1 text-sm text-red-600">{errors.setor}</p>}
              </div>
              
              {/* Vínculo */}
              <div>
                <label htmlFor="vinculo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vínculo
                </label>
                <select
                  id="vinculo"
                  name="vinculo"
                  value={formData.vinculo}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  {vinculos.map((vinculo) => (
                    <option key={vinculo} value={vinculo}>{vinculo}</option>
                  ))}
                </select>
              </div>
              
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
          </div>
          
          <hr className="border-gray-200 dark:border-secondary-700" />
          
          {/* Endereço */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              {/* CEP */}
              <div className="md:col-span-2">
                <label htmlFor="endereco.cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CEP
                </label>
                <div className="flex">
                  <div className="relative flex-grow rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="endereco.cep"
                      name="endereco.cep"
                      value={formData.endereco.cep}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${errors['endereco.cep'] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-l-md shadow-sm placeholder-gray-400 sm:text-sm`}
                      placeholder="00000-000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={buscarCep}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-secondary-700 rounded-r-md bg-gray-50 dark:bg-secondary-700 text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-100 dark:hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Buscar
                  </button>
                </div>
                {errors['endereco.cep'] && <p className="mt-1 text-sm text-red-600">{errors['endereco.cep']}</p>}
              </div>
              
              {/* Logradouro */}
              <div className="md:col-span-4">
                <label htmlFor="endereco.logradouro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  id="endereco.logradouro"
                  name="endereco.logradouro"
                  value={formData.endereco.logradouro}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              
              {/* Número */}
              <div className="md:col-span-1">
                <label htmlFor="endereco.numero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  id="endereco.numero"
                  name="endereco.numero"
                  value={formData.endereco.numero}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Nº"
                />
              </div>
              
              {/* Complemento */}
              <div className="md:col-span-2">
                <label htmlFor="endereco.complemento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  id="endereco.complemento"
                  name="endereco.complemento"
                  value={formData.endereco.complemento}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Apto, Bloco, etc."
                />
              </div>
              
              {/* Bairro */}
              <div className="md:col-span-3">
                <label htmlFor="endereco.bairro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  id="endereco.bairro"
                  name="endereco.bairro"
                  value={formData.endereco.bairro}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Bairro"
                />
              </div>
              
              {/* Cidade */}
              <div className="md:col-span-4">
                <label htmlFor="endereco.cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  id="endereco.cidade"
                  name="endereco.cidade"
                  value={formData.endereco.cidade}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Cidade"
                />
              </div>
              
              {/* UF */}
              <div className="md:col-span-2">
                <label htmlFor="endereco.uf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  UF
                </label>
                <select
                  id="endereco.uf"
                  name="endereco.uf"
                  value={formData.endereco.uf}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Selecione</option>
                  {ufs.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Botões de ação (versão mobile) */}
          <div className="md:hidden">
            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <FiSave className="-ml-1 mr-2 h-5 w-5" />
                    Salvar
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiX className="-ml-1 mr-2 h-5 w-5" />
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServidorForm;