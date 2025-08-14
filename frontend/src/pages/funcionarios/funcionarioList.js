import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPlus, FiSearch, FiFilter, FiTrash2, 
  FiEye, FiDownload, FiChevronLeft, FiChevronRight,
  FiUser, FiCalendar, FiBriefcase, FiMail, FiPhone, FiGrid, FiList, FiUpload, FiMapPin, FiImage
} from 'react-icons/fi';
import { funcionariosService, getImageUrl } from '../../services/api';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'grid'
  const [filters, setFilters] = useState({
    setor: '',
    status: '',
    vinculo: ''
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);

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
      
      const response = await funcionariosService.getAll(params);
      
      const responseData = response.data.data || response.data;
      setServidores(responseData.items || responseData || []);
      setTotalPages(responseData.totalPages || 1);
      setTotalItems(responseData.totalItems || 0);
    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
      setServidores([]);
      setTotalPages(1);
      setTotalItems(0);
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
      await funcionariosService.delete(id);
      
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

  // Função para exportar dados localmente (seguindo padrão de férias)
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('Relatório de Funcionários', 105, 15, { align: 'center' });
    
    // Filtros aplicados
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let filtrosTexto = 'Filtros: ';
    
    if (searchTerm) filtrosTexto += `Busca: "${searchTerm}", `;
    if (filters.setor) filtrosTexto += `Setor: ${filters.setor}, `;
    if (filters.cargo) filtrosTexto += `Cargo: ${filters.cargo}, `;
    if (filters.status) filtrosTexto += `Status: ${filters.status}, `;
    
    if (filtrosTexto === 'Filtros: ') filtrosTexto += 'Nenhum';
    else filtrosTexto = filtrosTexto.slice(0, -2); // Remover a última vírgula e espaço
    
    doc.text(filtrosTexto, 14, 25);
    
    // Data de geração
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Tabela
    const tableColumn = ['Nome', 'CPF', 'Setor', 'Cargo', 'E-mail', 'Status'];
    const tableRows = [];
    
    servidores.forEach(servidor => {
      const rowData = [
        servidor.nome || '-',
        servidor.cpf || '-',
        servidor.setor || '-',
        servidor.cargo || '-',
        servidor.email || '-',
        servidor.status || 'Ativo'
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
    doc.save('relatorio_funcionarios.pdf');
  };

  const exportToCSV = () => {
    // Cabeçalho
    let csvContent = 'Nome,CPF,RG,E-mail,Telefone,Endereço,Setor,Cargo,Data Admissão,Salário,Status\n';
    
    // Dados
    servidores.forEach(servidor => {
      const row = [
        (servidor.nome || '').replace(/,/g, ' '),
        (servidor.cpf || '').replace(/,/g, ' '),
        (servidor.rg || '').replace(/,/g, ' '),
        (servidor.email || '').replace(/,/g, ' '),
        (servidor.telefone || '').replace(/,/g, ' '),
        (servidor.endereco || '').replace(/,/g, ' '),
        (servidor.setor || '').replace(/,/g, ' '),
        (servidor.cargo || '').replace(/,/g, ' '),
        (servidor.data_admissao || '').replace(/,/g, ' '),
        (servidor.salario || '').replace(/,/g, ' '),
        (servidor.status || 'Ativo').replace(/,/g, ' ')
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_funcionarios.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para lidar com exportação (mantida para compatibilidade)
  const handleExport = (format) => {
    if (format === 'pdf') {
      exportToPDF();
    } else if (format === 'csv') {
      exportToCSV();
    }
  };

  // Função para lidar com seleção de arquivo CSV
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Arquivo inválido',
        text: 'Por favor, selecione um arquivo CSV válido.',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  // Função para importar CSV
  const handleImportCSV = async () => {
    if (!csvFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Nenhum arquivo selecionado',
        text: 'Por favor, selecione um arquivo CSV para importar.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      
      const response = await funcionariosService.importCSV(formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Importação realizada com sucesso!',
        text: `${(response.data.data || response.data).imported} funcionários foram importados.`,
        confirmButtonColor: '#3B82F6'
      });
      
      setShowImportModal(false);
      setCsvFile(null);
      fetchServidores(); // Recarregar a lista
      
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Erro na importação',
        text: error.response?.data?.message || 'Não foi possível importar o arquivo CSV. Verifique o formato e tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setImporting(false);
    }
  };

  // Função para associar fotos automaticamente
  const handleAssociarFotos = async () => {
    try {
      const result = await Swal.fire({
        title: 'Associar Fotos Automaticamente',
        text: 'Esta ação irá associar automaticamente as fotos da pasta uploads aos funcionários baseado no nome do arquivo. Deseja continuar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Sim, associar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setLoading(true);
        
        const response = await funcionariosService.associarFotos();
        const resultado = response.data.data;
        
        Swal.fire({
          icon: 'success',
          title: 'Associação concluída!',
          html: `
            <div class="text-left">
              <p><strong>Total de arquivos processados:</strong> ${resultado.totalArquivos}</p>
              <p><strong>Fotos associadas:</strong> ${resultado.associacoesRealizadas}</p>
              ${resultado.erros.length > 0 ? `<p><strong>Erros:</strong> ${resultado.erros.length}</p>` : ''}
            </div>
          `,
          confirmButtonColor: '#3B82F6'
        });
        
        fetchServidores(); // Recarregar a lista para mostrar as fotos
      }
    } catch (error) {
      console.error('Erro ao associar fotos:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Erro na associação',
        text: error.response?.data?.message || 'Não foi possível associar as fotos automaticamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para baixar template CSV
  const downloadTemplate = () => {
    const csvContent = `nome,email,telefone,cpf,rg,endereco,setor,cargo,vinculo,salario,dataAdmissao,status
João Silva,joao@email.com,(11) 99999-9999,123.456.789-00,12.345.678-9,"Rua das Flores, 123",TI,Desenvolvedor,Efetivo,5000,2024-01-15,ativo
Maria Santos,maria@email.com,(11) 88888-8888,987.654.321-00,98.765.432-1,"Av. Principal, 456",RH,Analista,Efetivo,4500,2024-02-01,ativo`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_funcionarios.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          Mostrando <span className="font-medium">{servidores?.length || 0}</span> de <span className="font-medium">{totalItems}</span> funcionários
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Funcionários</h2>
        
        <div className="flex items-center space-x-3">
          {/* Botões de modo de visualização */}
          <div className="flex items-center bg-gray-100 dark:bg-secondary-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-secondary-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Visualização em Lista"
            >
              <FiList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-secondary-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Visualização em Grid"
            >
              <FiGrid className="h-4 w-4" />
            </button>
          </div>
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
          
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiUpload className="-ml-1 mr-2 h-5 w-5" />
            Importar CSV
          </button>
          
          <button
            onClick={handleAssociarFotos}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiImage className="-ml-1 mr-2 h-5 w-5" />
            Associar Fotos
          </button>
          
          <Link
            to="/funcionarios/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Novo Funcionário
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
      
      {/* Tabela - Modo Lista */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-secondary-800 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
            <thead className="bg-gray-50 dark:bg-secondary-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
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
                  onClick={() => handleSort('cpf')}
                >
                  CPF {renderSortIndicator('cpf')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('rg')}
                >
                  RG {renderSortIndicator('rg')}
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
                  onClick={() => handleSort('endereco')}
                >
                  <div className="flex items-center">
                    <FiMapPin className="mr-1" />
                    Endereço {renderSortIndicator('endereco')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('vinculo')}
                >
                  Vínculo {renderSortIndicator('vinculo')}
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
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Carregando funcionários...</span>
                    </div>
                  </td>
                </tr>
              ) : (servidores?.length || 0) === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum funcionário encontrado
                  </td>
                </tr>
              ) : (
                (servidores || []).map((servidor) => (
                  <tr key={servidor.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/funcionarios/${servidor.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Visualizar"
                        >
                          <FiEye className="h-5 w-5" />
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {servidor.foto && typeof servidor.foto === 'string' ? (
                            <img 
                               className="h-10 w-10 rounded-full" 
                               src={getImageUrl(servidor.foto)} 
                               alt={servidor.nome}
                               onError={(e) => {
                                 // Fallback para mostrar inicial se a imagem falhar
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.style.display = 'flex';
                               }}
                             />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                              {servidor.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/funcionarios/${servidor.id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            {servidor.nome}
                          </Link>
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
                      {servidor.cpf || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.rg || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.telefone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.endereco ? 
                        (typeof servidor.endereco === 'object' ? 
                          `${servidor.endereco.logradouro || ''} ${servidor.endereco.numero || ''}, ${servidor.endereco.bairro || ''}, ${servidor.endereco.cidade || ''} - ${servidor.endereco.uf || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || '-'
                          : servidor.endereco
                        ) : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {servidor.vinculo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(servidor.data_admissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${servidor.status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                        {servidor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Visualização em Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-300 dark:bg-secondary-600 rounded-full mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-secondary-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-secondary-600 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-300 dark:bg-secondary-600 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : servidores.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiUser className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum funcionário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Comece adicionando um novo funcionário.'}
              </p>
            </div>
          ) : (
            (servidores || []).map((servidor) => (
              <div key={servidor.id} className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-gray-200 dark:border-secondary-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center">
                  {/* Foto do funcionário */}
                  <div className="w-20 h-20 mb-4">
                    {servidor.foto && typeof servidor.foto === 'string' ? (
                      <img 
                        className="w-20 h-20 rounded-full object-cover" 
                        src={getImageUrl(servidor.foto)} 
                        alt={servidor.nome}
                        onError={(e) => {
                          // Fallback para mostrar inicial se a imagem falhar
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                        {servidor.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Nome clicável */}
                  <Link
                    to={`/funcionarios/${servidor.id}`}
                    className="text-lg font-medium text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 text-center mb-2"
                  >
                    {servidor.nome}
                  </Link>
                  
                  {/* Informações */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-1">{servidor.cargo}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-3">{servidor.setor}</p>
                  
                  {/* Status */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 ${
                    servidor.status === 'ativo' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {servidor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                  
                  {/* Ações */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/funcionarios/${servidor.id}`}
                      className="p-2 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                      title="Visualizar"
                    >
                      <FiEye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => confirmDelete(servidor.id, servidor.nome)}
                      className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Paginação */}
      {!loading && servidores.length > 0 && renderPagination()}
      
      {/* Modal de Importação CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-[600px] max-w-[90vw] shadow-lg rounded-md bg-white dark:bg-secondary-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Importar Funcionários</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Selecione um arquivo CSV com os dados dos funcionários para importar.
                </p>
                
                <div className="mb-3">
                  <button
                    onClick={downloadTemplate}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Baixar template CSV de exemplo
                  </button>
                </div>
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                />
                
                {csvFile && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Arquivo selecionado: {csvFile.name}
                  </p>
                )}
              </div>
              
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Formato esperado:</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  O CSV deve conter as colunas: nome, email, telefone, cpf, rg, endereco, setor, cargo, vinculo, salario, dataAdmissao, status
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportCSV}
                  disabled={!csvFile || importing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md flex items-center"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-2 h-4 w-4" />
                      Importar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServidoresList;