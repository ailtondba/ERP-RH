import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiEdit, FiTrash2, FiCalendar, FiMail, 
  FiPhone, FiMapPin, FiUser, FiDollarSign, FiBriefcase, 
  FiClock, FiAward, FiFileText, FiTag, FiExternalLink 
} from 'react-icons/fi';
import { servidorService } from '../../services/api';
import Swal from 'sweetalert2';

const ServidorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [servidor, setServidor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServidor = async () => {
      try {
        const response = await servidorService.getById(id);
        const data = response.data.data || response.data;
        setServidor(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar servidor:', err);
        setError('Erro ao carregar os dados do servidor');
        setLoading(false);
      }
    };

    fetchServidor();
  }, [id]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await servidorService.delete(id);
        Swal.fire(
          'Excluído!',
          'O servidor foi excluído com sucesso.',
          'success'
        );
        navigate('/servidores');
      } catch (err) {
        console.error('Erro ao excluir servidor:', err);
        Swal.fire(
          'Erro!',
          'Ocorreu um erro ao tentar excluir o servidor.',
          'error'
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!servidor) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Servidor não encontrado</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          O servidor solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
        </p>
        <div className="mt-6">
          <Link
            to="/servidores"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Voltar para a lista de servidores
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes do Servidor</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualize e gerencie as informações do servidor
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/servidores/editar/${servidor.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiEdit className="-ml-1 mr-2 h-5 w-5" />
            Editar
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiTrash2 className="-ml-1 mr-2 h-5 w-5" />
            Excluir
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <FiUser className="h-8 w-8 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {servidor.nome}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                {servidor.cargo} • {servidor.matricula}
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl>
            {/* Informações Pessoais */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Informações Pessoais
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FiCalendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Data de Nascimento</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {new Date(servidor.dataNascimento).toLocaleDateString('pt-BR')}
                        {servidor.idade && ` (${servidor.idade} anos)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiMail className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <a 
                        href={`mailto:${servidor.email}`} 
                        className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {servidor.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiPhone className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Telefone</p>
                      <a 
                        href={`tel:${servidor.telefone}`}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {servidor.telefone}
                      </a>
                    </div>
                  </div>
                  {servidor.cpf && (
                    <div className="flex items-start">
                      <FiFileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">CPF</p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {servidor.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </dd>
            </div>

            {/* Informações Profissionais */}
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Informações Profissionais
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FiBriefcase className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Cargo</p>
                      <p className="text-gray-500 dark:text-gray-400">{servidor.cargo}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiTag className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Matrícula</p>
                      <p className="text-gray-500 dark:text-gray-400">{servidor.matricula}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiCalendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Data de Admissão</p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {new Date(servidor.dataAdmissao).toLocaleDateString('pt-BR')}
                        {servidor.tempoCasa && ` (${servidor.tempoCasa})`}
                      </p>
                    </div>
                  </div>
                  {servidor.salario && (
                    <div className="flex items-start">
                      <FiDollarSign className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Salário</p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(servidor.salario)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </dd>
            </div>

            {/* Endereço */}
            {servidor.endereco && (
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  Endereço
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <FiMapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Endereço</p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {servidor.endereco.logradouro}, {servidor.endereco.numero}
                          {servidor.endereco.complemento && `, ${servidor.endereco.complemento}`}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {servidor.endereco.bairro} - {servidor.endereco.cidade}/{servidor.endereco.estado}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          CEP: {servidor.endereco.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                        </p>
                      </div>
                    </div>
                  </div>
                </dd>
              </div>
            )}

            {/* Documentos */}
            {servidor.documentos && servidor.documentos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
                  Documentos
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
                    {servidor.documentos.map((doc, index) => (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <FiFileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                          <span className="ml-2 flex-1 w-0 truncate">
                            {doc.titulo || `Documento ${index + 1}`}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <a 
                            href={doc.arquivo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <FiExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          to="/servidores"
          className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FiArrowLeft className="-ml-1 mr-2 h-5 w-5 inline" />
          Voltar para a lista
        </Link>
      </div>
    </div>
  );
};

export default ServidorDetail;
