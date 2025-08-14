import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, FiSearch, FiFilter, FiPlus, FiEdit, 
  FiTrash2, FiDownload, FiX, FiCheck, FiUser
} from 'react-icons/fi';
import { feriasService, funcionariosService } from '../../services/api';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FeriasList = () => {
  const [ferias, setFerias] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredFerias, setFilteredFerias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterPeriodo, setFilterPeriodo] = useState({
    dataInicio: '',
    dataFim: ''
  });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal de cadastro/edição
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
  const [currentFerias, setCurrentFerias] = useState(null);
  const [formData, setFormData] = useState({
    servidor_id: '',
    data_inicio: '',
    data_fim: '',
    observacoes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [ferias, searchTerm, filterStatus, filterPeriodo]);
  
  useEffect(() => {
    setTotalPages(Math.ceil(filteredFerias.length / itemsPerPage));
  }, [filteredFerias, itemsPerPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feriasResponse, servidoresResponse] = await Promise.all([
      feriasService.getAll(),
      funcionariosService.getAll()
      ]);
      
      // O backend já retorna as férias com as informações do servidor incluídas
      const servidoresList = servidoresResponse.data.data?.items || servidoresResponse.data?.items || servidoresResponse.data?.data || servidoresResponse.data || [];
      const feriasData = feriasResponse.data.data || feriasResponse.data || [];
      
      setFerias(feriasData);
      setFilteredFerias(feriasData);
      setServidores(servidoresList);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao carregar dados',
        text: 'Não foi possível carregar os dados de férias. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...ferias];
    
    // Aplicar filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.servidor?.nome?.toLowerCase().includes(searchLower) ||
        item.servidor?.setor?.toLowerCase().includes(searchLower)
      );
    }
    
    // Aplicar filtro de status
    if (filterStatus !== 'todos') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filterStatus === 'ativas') {
        result = result.filter(item => {
          const dataInicio = new Date(item.data_inicio);
          const dataFim = new Date(item.data_fim);
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(0, 0, 0, 0);
          return dataInicio <= today && dataFim >= today;
        });
      } else if (filterStatus === 'futuras') {
        result = result.filter(item => {
          const dataInicio = new Date(item.data_inicio);
          dataInicio.setHours(0, 0, 0, 0);
          return dataInicio > today;
        });
      } else if (filterStatus === 'passadas') {
        result = result.filter(item => {
          const dataFim = new Date(item.data_fim);
          dataFim.setHours(0, 0, 0, 0);
          return dataFim < today;
        });
      }
    }
    
    // Aplicar filtro de período
    if (filterPeriodo.dataInicio) {
      const dataInicio = new Date(filterPeriodo.dataInicio);
      dataInicio.setHours(0, 0, 0, 0);
      result = result.filter(item => {
        const itemDataFim = new Date(item.data_fim);
        itemDataFim.setHours(0, 0, 0, 0);
        return itemDataFim >= dataInicio;
      });
    }
    
    if (filterPeriodo.dataFim) {
      const dataFim = new Date(filterPeriodo.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const itemDataInicio = new Date(item.data_inicio);
        itemDataInicio.setHours(0, 0, 0, 0);
        return itemDataInicio <= dataFim;
      });
    }
    
    setFilteredFerias(result);
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleFilterPeriodoChange = (e) => {
    const { name, value } = e.target;
    setFilterPeriodo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setFilterPeriodo({
      dataInicio: '',
      dataFim: ''
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Resetar para a primeira página ao mudar itens por página
  };

  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredFerias.slice(indexOfFirstItem, indexOfLastItem);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusFerias = (dataInicio, dataFim) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(0, 0, 0, 0);
    
    if (inicio <= today && fim >= today) {
      return { status: 'ativa', label: 'Em férias', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    } else if (inicio > today) {
      return { status: 'futura', label: 'Agendada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    } else {
      return { status: 'passada', label: 'Concluída', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
  };

  const getDuracaoFerias = (dataInicio, dataFim) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia final
    return `${diffDays} dias`;
  };

  const openCreateModal = () => {
    setFormData({
      servidor_id: '',
      data_inicio: '',
      data_fim: '',
      observacoes: ''
    });
    setFormErrors({});
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (ferias) => {
    setCurrentFerias(ferias);
    setFormData({
      servidor_id: ferias.servidor_id,
      data_inicio: formatDateForInput(ferias.data_inicio),
      data_fim: formatDateForInput(ferias.data_fim),
      observacoes: ferias.observacoes || ''
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.servidor_id) {
      errors.servidor_id = 'Servidor é obrigatório';
    }
    
    if (!formData.data_inicio) {
      errors.data_inicio = 'Data de início é obrigatória';
    }
    
    if (!formData.data_fim) {
      errors.data_fim = 'Data de fim é obrigatória';
    }
    
    if (formData.data_inicio && formData.data_fim) {
      const dataInicio = new Date(formData.data_inicio);
      const dataFim = new Date(formData.data_fim);
      
      if (dataFim < dataInicio) {
        errors.data_fim = 'Data de fim não pode ser anterior à data de início';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (modalMode === 'create') {
        await feriasService.create(formData);
        Swal.fire({
          icon: 'success',
          title: 'Férias cadastradas com sucesso!',
          confirmButtonColor: '#3B82F6'
        });
      } else {
        await feriasService.update(currentFerias.id, formData);
        Swal.fire({
          icon: 'success',
          title: 'Férias atualizadas com sucesso!',
          confirmButtonColor: '#3B82F6'
        });
      }
      
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar férias:', error);
      Swal.fire({
        icon: 'error',
        title: modalMode === 'create' ? 'Erro ao cadastrar férias' : 'Erro ao atualizar férias',
        text: error.response?.data?.message || 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não poderá ser revertida!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#3B82F6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await feriasService.delete(id);
          
          Swal.fire({
            icon: 'success',
            title: 'Excluído!',
            text: 'Registro de férias excluído com sucesso.',
            confirmButtonColor: '#3B82F6'
          });
          
          fetchData();
        } catch (error) {
          console.error('Erro ao excluir férias:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erro ao excluir',
            text: error.response?.data?.message || 'Ocorreu um erro ao excluir o registro de férias. Por favor, tente novamente.',
            confirmButtonColor: '#3B82F6'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('Relatório de Férias', 105, 15, { align: 'center' });
    
    // Filtros aplicados
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let filtrosTexto = 'Filtros: ';
    
    if (searchTerm) filtrosTexto += `Busca: "${searchTerm}", `;
    if (filterStatus !== 'todos') {
      const statusMap = {
        ativas: 'Em férias',
        futuras: 'Agendadas',
        passadas: 'Concluídas'
      };
      filtrosTexto += `Status: ${statusMap[filterStatus]}, `;
    }
    if (filterPeriodo.dataInicio) filtrosTexto += `Período a partir de: ${formatDate(filterPeriodo.dataInicio)}, `;
    if (filterPeriodo.dataFim) filtrosTexto += `Período até: ${formatDate(filterPeriodo.dataFim)}, `;
    
    if (filtrosTexto === 'Filtros: ') filtrosTexto += 'Nenhum';
    else filtrosTexto = filtrosTexto.slice(0, -2); // Remover a última vírgula e espaço
    
    doc.text(filtrosTexto, 14, 25);
    
    // Data de geração
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Tabela
    const tableColumn = ['Servidor', 'Setor', 'Início', 'Fim', 'Duração', 'Status'];
    const tableRows = [];
    
    filteredFerias.forEach(item => {
      const status = getStatusFerias(item.data_inicio, item.data_fim);
      const rowData = [
        item.servidor?.nome || 'Servidor não encontrado',
        item.servidor?.setor || '-',
        formatDate(item.data_inicio),
        formatDate(item.data_fim),
        getDuracaoFerias(item.data_inicio, item.data_fim),
        status.label
      ];
      tableRows.push(rowData);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    // Salvar o PDF
    doc.save('relatorio_ferias.pdf');
  };

  const exportToCSV = () => {
    // Cabeçalho
    let csvContent = 'Servidor,Setor,Data Início,Data Fim,Duração,Status,Observações\n';
    
    // Dados
    filteredFerias.forEach(item => {
      const status = getStatusFerias(item.data_inicio, item.data_fim);
      const row = [
        (item.servidor?.nome || 'Servidor não encontrado').replace(/,/g, ' '),
        (item.servidor?.setor || '-').replace(/,/g, ' '),
        formatDate(item.data_inicio),
        formatDate(item.data_fim),
        getDuracaoFerias(item.data_inicio, item.data_fim),
        status.label,
        (item.observacoes || '').replace(/,/g, ' ').replace(/\n/g, ' ')
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_ferias.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gerenciamento de Férias
        </h2>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Nova Férias
          </button>
          
          <button
            type="button"
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Exportar PDF
          </button>
          
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Exportar CSV
          </button>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            {/* Busca */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar por servidor ou setor
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Digite para buscar..."
                />
              </div>
            </div>
            
            {/* Filtro de Status */}
            <div className="w-full md:w-48">
              <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={handleFilterStatusChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="ativas">Em férias</option>
                  <option value="futuras">Agendadas</option>
                  <option value="passadas">Concluídas</option>
                </select>
              </div>
            </div>
            
            {/* Filtro de Período - Data Início */}
            <div className="w-full md:w-48">
              <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                A partir de
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dataInicio"
                  name="dataInicio"
                  value={filterPeriodo.dataInicio}
                  onChange={handleFilterPeriodoChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Filtro de Período - Data Fim */}
            <div className="w-full md:w-48">
              <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Até
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dataFim"
                  name="dataFim"
                  value={filterPeriodo.dataFim}
                  onChange={handleFilterPeriodoChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Botão Limpar Filtros */}
            <div className="w-full md:w-auto">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiX className="-ml-1 mr-2 h-5 w-5" />
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabela */}
      <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="animate-pulse text-center">
              <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Carregando dados...</p>
            </div>
          </div>
        ) : filteredFerias.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Nenhum registro encontrado</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Não foram encontrados registros de férias com os filtros aplicados.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiX className="-ml-1 mr-2 h-5 w-5" />
                Limpar Filtros
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
              <thead className="bg-gray-50 dark:bg-secondary-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Servidor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Setor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Período
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duração
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                {getCurrentItems().map((item) => {
                  const status = getStatusFerias(item.data_inicio, item.data_fim);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-secondary-700 flex items-center justify-center">
                            {item.servidor?.foto ? (
                              <img 
                                src={item.servidor.foto} 
                                alt={item.servidor?.nome || 'Servidor'} 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <FiUser className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.servidor?.nome || 'Servidor não encontrado'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{item.servidor?.setor || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(item.data_inicio)} a {formatDate(item.data_fim)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getDuracaoFerias(item.data_inicio, item.data_fim)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <FiEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Paginação */}
        {!loading && filteredFerias.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-secondary-700 border-t border-gray-200 dark:border-secondary-600 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando
                <span className="font-medium mx-1">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredFerias.length)}</span>
                a
                <span className="font-medium mx-1">{Math.min(currentPage * itemsPerPage, filteredFerias.length)}</span>
                de
                <span className="font-medium mx-1">{filteredFerias.length}</span>
                resultados
              </span>
              
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="ml-4 border-gray-300 dark:border-secondary-600 dark:bg-secondary-800 dark:text-white rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={5}>5 por página</option>
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Primeira
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === pageNum ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Última
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-secondary-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {modalMode === 'create' ? 'Cadastrar Férias' : 'Editar Férias'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                  {/* Servidor */}
                  <div>
                    <label htmlFor="servidor_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Servidor *
                    </label>
                    <select
                      id="servidor_id"
                      name="servidor_id"
                      value={formData.servidor_id}
                      onChange={handleFormChange}
                      className={`block w-full py-2 px-3 border ${formErrors.servidor_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                    >
                      <option value="">Selecione um servidor</option>
                      {servidores.filter(s => s.status === 'ativo').map((servidor) => (
                        <option key={servidor.id} value={servidor.id}>
                          {servidor.nome} - {servidor.setor}
                        </option>
                      ))}
                    </select>
                    {formErrors.servidor_id && <p className="mt-1 text-sm text-red-600">{formErrors.servidor_id}</p>}
                  </div>
                  
                  {/* Data de Início */}
                  <div>
                    <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Início *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="data_inicio"
                        name="data_inicio"
                        value={formData.data_inicio}
                        onChange={handleFormChange}
                        className={`block w-full pl-10 pr-3 py-2 border ${formErrors.data_inicio ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                      />
                    </div>
                    {formErrors.data_inicio && <p className="mt-1 text-sm text-red-600">{formErrors.data_inicio}</p>}
                  </div>
                  
                  {/* Data de Fim */}
                  <div>
                    <label htmlFor="data_fim" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Data de Fim *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="data_fim"
                        name="data_fim"
                        value={formData.data_fim}
                        onChange={handleFormChange}
                        className={`block w-full pl-10 pr-3 py-2 border ${formErrors.data_fim ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white focus:ring-primary-500 focus:border-primary-500'} rounded-md shadow-sm placeholder-gray-400 sm:text-sm`}
                      />
                    </div>
                    {formErrors.data_fim && <p className="mt-1 text-sm text-red-600">{formErrors.data_fim}</p>}
                  </div>
                  
                  {/* Observações */}
                  <div>
                    <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observações
                    </label>
                    <textarea
                      id="observacoes"
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleFormChange}
                      rows={3}
                      className="block w-full py-2 px-3 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Observações sobre as férias"
                    />
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-secondary-700 border-t border-gray-200 dark:border-secondary-600 flex flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <FiCheck className="-ml-1 mr-2 h-5 w-5" />
                        {modalMode === 'create' ? 'Cadastrar' : 'Atualizar'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-secondary-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FiX className="-ml-1 mr-2 h-5 w-5" />
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeriasList;