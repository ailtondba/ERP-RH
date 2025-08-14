import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, 
  FiEye, FiDownload, FiChevronLeft, FiChevronRight,
  FiUser, FiCalendar, FiBriefcase, FiMail, FiPhone
} from 'react-icons/fi';
import { servidoresService, getImageUrl } from '../../services/api';
import Swal from 'sweetalert2';

const ServidoresList = () => {
  const [servidores, setServidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState('nome');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    setor: '',
    status: '',
    vinculo: ''
  });

  // Lista de setores e vínculos para os filtros
  const setores = ['Administração', 'Financeiro', 'RH', 'TI', 'Jurídico', 'Operacional', 'Comercial'];
  const vinculos = ['Efetivo', 'Comissionado', 'Temporário', 'Estagiário', 'Terceirizado'];

  // Função para buscar servidores
  const fetchServidores = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortField,
        order: sortDirection,
        search: searchTerm,
        ...filters
      };
      
      const response = await servidoresService.getAll(params);
      
      const responseData = response.data.data || response.data;
      setServidores(responseData.items || responseData || []);
      setTotalPages(responseData.totalPages || 1);
      setTotalItems(responseData.totalItems || 0);
    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao buscar servidores',
        text: 'Não foi possível carregar a lista de servidores. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortField, sortDirection, searchTerm, filters]);

  useEffect(() => {
    fetchServidores();
  }, [fetchServidores]);

  // Função para lidar com a mudança de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Função para lidar com a mudança de ordenação
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para lidar com a mudança de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para aplicar filtros
  const applyFilters = () => {
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
    fetchServidores();
    setFilterOpen(false);
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      setor: '',
      status: '',
      vinculo: ''
    });
    setCurrentPage(1);
  };

  // Função para confirmar exclusão
  const confirmDelete = (id, nome) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: `Você está prestes a excluir o servidor ${nome}. Esta ação não pode ser desfeita!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(id);
      }
    });
  };

  // Função para excluir servidor
  const handleDelete = async (id) => {
    try {
      await servidoresService.delete(id);
      
      Swal.fire({
        icon: 'success',
        title: 'Servidor excluído com sucesso!',
        confirmButtonColor: '#3B82F6'
      });
      
      fetchServidores(); // Recarregar a lista após exclusão
    } catch (error) {
      console.error('Erro ao excluir servidor:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Erro ao excluir servidor',
        text: error.response?.data?.message || 'Não foi possível excluir o servidor. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  // Função para exportar dados
  const handleExport = async (format) => {
    try {
      let response;
      
      if (format === 'pdf') {
        response = await servidoresService.exportPDF({
          search: searchTerm,
          ...filters
        });
      } else if (format === 'csv') {
        response = await servidoresService.exportCSV({
          search: searchTerm,
          ...filters
        });
      }
      
      // Criar um link para download do arquivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `servidores.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Erro ao exportar para ${format}:`, error);
      
      Swal.fire({
        icon: 'error',
        title: `Erro ao exportar para ${format}`,
        text: `Não foi possível exportar os dados para ${format}. Por favor, tente novamente.`,
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  // Renderizar indicador de ordenação
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  // Renderizar paginação
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${currentPage === i ? 'bg-primary-600 text-white' : 'bg-white dark:bg-secondary-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700'}`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Mostrando <span className="font-medium">{servidores.length}</span> de <span className="font-medium">{totalItems}</span> servidores
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-white dark:bg-secondary-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft />
          </button>
          
          {pages}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-white dark:bg-secondary-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Servidores</h2>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiFilter className="-ml-1 mr-2 h-5 w-5" />
              Filtros
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-secondary-800 rounded-md shadow-lg z-10 border dark:border-secondary-700">
                <div className="p-4 space-y-4">
                  <div>
                    <label htmlFor="setor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Setor
                    </label>
                    <select
                      id="setor"
                      name="setor"
                      value={filters.setor}
                      onChange={handleFilterChange}
                      className="block w-full border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Todos</option>
                      {setores.map((setor) => (
                        <option key={setor} value={setor}>{setor}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="block w-full border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Todos</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="vinculo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vínculo
                    </label>
                    <select
                      id="vinculo"
                      name="vinculo"
                      value={filters.vinculo}
                      onChange={handleFilterChange}
                      className="block w-full border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Todos</option>
                      {vinculos.map((vinculo) => (
                        <option key={vinculo} value={vinculo}>{vinculo}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
                    >
                      Limpar filtros
                    </button>
                    
                    <button
                      onClick={applyFilters}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => document.getElementById('exportDropdown').classList.toggle('hidden')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiDownload className="-ml-1 mr-2 h-5 w-5" />
              Exportar
            </button>
            
            <div id="exportDropdown" className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-md shadow-lg z-10 border dark:border-secondary-700">
              <div className="py-1">
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700"
                >
                  Exportar como PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700"
                >
                  Exportar como CSV
                </button>
              </div>
            </div>
          </div>
          
          <Link
            to="/servidores/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Novo Servidor
          </Link>
        </div>
      </div>
      
      {/* Barra de pesquisa */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, matrícula, cargo ou setor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && fetchServidores()}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
      </div>
      
      {/* Tabela de servidores */}
      <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
            <thead className="bg-gray-50 dark:bg-secondary-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nome')}
                >
                  <div className="flex items-center">
                    <FiUser className="mr-1" />
                    Nome {renderSortIndicator('nome')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('matricula')}
                >
                  Matrícula {renderSortIndicator('matricula')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cargo')}
                >
                  <div className="flex items-center">
                    <FiBriefcase className="mr-1" />
                    Cargo {renderSortIndicator('cargo')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('setor')}
                >
                  Setor {renderSortIndicator('setor')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    <FiMail className="mr-1" />
                    E-mail {renderSortIndicator('email')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('telefone')}
                >
                  <div className="flex items-center">
                    <FiPhone className="mr-1" />
                    Telefone {renderSortIndicator('telefone')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('data_admissao')}
                >
                  <div className="flex items-center">
                    <FiCalendar className="mr-1" />
                    Admissão {renderSortIndicator('data_admissao')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status {renderSortIndicator('status')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Carregando servidores...</span>
                    </div>
                  </td>
                </tr>
              ) : servidores.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum servidor encontrado
                  </td>
                </tr>
              ) : (
                servidores.map((servidor) => (
                  <tr key={servidor.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {servidor.foto ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={getImageUrl(servidor.foto)} 
                              alt={servidor.nome}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white ${
                              servidor.foto ? 'hidden' : 'flex'
                            }`}
                          >
                            {servidor.nome.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {servidor.nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.matricula}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.cargo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.setor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.telefone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(servidor.data_admissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${servidor.status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                        {servidor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/servidores/${servidor.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Visualizar"
                        >
                          <FiEye className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/servidores/${servidor.id}/editar`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Editar"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(servidor.id, servidor.nome)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Excluir"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Paginação */}
      {!loading && servidores.length > 0 && renderPagination()}
    </div>
  );
};

export default ServidoresList;