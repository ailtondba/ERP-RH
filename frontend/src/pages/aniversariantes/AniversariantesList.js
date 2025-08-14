import React, { useState, useEffect } from 'react';
import { FiCalendar, FiSearch, FiDownload, FiGift, FiUser, FiFilter, FiClock, FiUsers } from 'react-icons/fi';
import { aniversariantesService } from '../../services/api';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AniversariantesList = () => {
  const [aniversariantes, setAniversariantes] = useState([]);
  const [filteredAniversariantes, setFilteredAniversariantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('mes'); // 'mes', 'semana', 'ano'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [aniversariantesPorMes, setAniversariantesPorMes] = useState({});
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchAniversariantes();
  }, [viewMode, selectedMonth, selectedYear]);
  
  useEffect(() => {
    applyFilters();
  }, [aniversariantes, searchTerm]);
  
  useEffect(() => {
    setTotalPages(Math.ceil(filteredAniversariantes.length / itemsPerPage));
  }, [filteredAniversariantes, itemsPerPage]);

  const fetchAniversariantes = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (viewMode) {
        case 'semana':
          response = await aniversariantesService.getAniversariantesSemana();
          const semanaData = response.data.data || response.data || [];
          setAniversariantes(semanaData);
          setFilteredAniversariantes(semanaData);
          break;
        case 'ano':
          response = await aniversariantesService.getByAno(selectedYear);
          const anoData = response.data.data || response.data || {};
          setAniversariantes(anoData.aniversariantes || []);
          setFilteredAniversariantes(anoData.aniversariantes || []);
          setAniversariantesPorMes(anoData.porMes || {});
          break;
        case 'mes':
        default:
          response = await aniversariantesService.getByMes(selectedMonth);
          const mesData = response.data.data || response.data || [];
          setAniversariantes(mesData);
          setFilteredAniversariantes(mesData);
          break;
      }
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao carregar dados',
        text: 'Não foi possível carregar os aniversariantes. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!aniversariantes.length) return;
    
    let result = [...aniversariantes];
    
    // Aplicar filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.nome.toLowerCase().includes(searchLower) ||
        item.setor.toLowerCase().includes(searchLower) ||
        (item.cargo && item.cargo.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredAniversariantes(result);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAniversariantes.slice(indexOfFirstItem, indexOfLastItem);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const calculateAge = (dateString) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getMonthName = (month) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const getDayOfMonth = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.getDate();
  };

  const getViewModeTitle = () => {
    switch (viewMode) {
      case 'semana':
        return 'Aniversariantes da Semana';
      case 'ano':
        return `Aniversariantes de ${selectedYear}`;
      case 'mes':
      default:
        return `Aniversariantes de ${getMonthName(selectedMonth)}`;
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text(getViewModeTitle(), 105, 15, { align: 'center' });
    
    // Filtros aplicados
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let filtrosTexto = 'Filtros: ';
    
    if (searchTerm) filtrosTexto += `Busca: "${searchTerm}", `;
    
    if (filtrosTexto === 'Filtros: ') filtrosTexto += 'Nenhum';
    else filtrosTexto = filtrosTexto.slice(0, -2);
    
    doc.text(filtrosTexto, 14, 25);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Tabela
    const tableColumn = ['Dia', `Aniversariantes do ${viewMode === 'mes' ? getMonthName(selectedMonth) : viewMode === 'semana' ? 'Semana' : 'Ano'}`, 'Data de Nascimento', 'Idade Atual'];
    const tableRows = [];
    
    filteredAniversariantes.forEach(item => {
      const rowData = [
        getDayOfMonth(item.data_nascimento),
        `${item.nome} - ${item.setor || 'Setor não informado'} • ${item.cargo || 'Cargo não informado'}`,
        formatDate(item.data_nascimento),
        `${calculateAge(item.data_nascimento)} anos`
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
    const fileName = `aniversariantes_${viewMode}_${viewMode === 'mes' ? getMonthName(selectedMonth).toLowerCase() : viewMode === 'ano' ? selectedYear : 'semana'}.pdf`;
    doc.save(fileName);
  };

  const exportToCSV = () => {
    // Cabeçalho
    let csvContent = `Dia,Aniversariantes do ${viewMode === 'mes' ? getMonthName(selectedMonth) : viewMode === 'semana' ? 'Semana' : 'Ano'},Data de Nascimento,Idade Atual\n`;
    
    // Dados
    filteredAniversariantes.forEach(item => {
      const row = [
        getDayOfMonth(item.data_nascimento),
        `${item.nome.replace(/,/g, ' ')} - ${(item.setor || 'Setor não informado').replace(/,/g, ' ')} • ${(item.cargo || 'Cargo não informado').replace(/,/g, ' ')}`,
        formatDate(item.data_nascimento),
        `${calculateAge(item.data_nascimento)} anos`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `aniversariantes_${viewMode}_${viewMode === 'mes' ? getMonthName(selectedMonth).toLowerCase() : viewMode === 'ano' ? selectedYear : 'semana'}.csv`;
    link.setAttribute('download', fileName);
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
          {getViewModeTitle()}
        </h2>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
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

      {/* Modos de Visualização */}
      <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleViewModeChange('mes')}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'mes'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
              }`}
            >
              <FiCalendar className="mr-2 h-4 w-4" />
              Aniversariantes do Mês
            </button>
            
            <button
              onClick={() => handleViewModeChange('semana')}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'semana'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
              }`}
            >
              <FiClock className="mr-2 h-4 w-4" />
              Aniversariantes da Semana
            </button>
            
            <button
              onClick={() => handleViewModeChange('ano')}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'ano'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
              }`}
            >
              <FiUsers className="mr-2 h-4 w-4" />
              Aniversariantes do Ano
            </button>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            {/* Busca */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar por nome, setor ou cargo
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
            
            {/* Seleção de Mês (apenas para modo mês) */}
            {viewMode === 'mes' && (
              <div className="w-full md:w-48">
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mês
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Seleção de Ano (apenas para modo ano) */}
            {viewMode === 'ano' && (
              <div className="w-full md:w-32">
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ano
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="year"
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Resumo por Mês (apenas para modo ano) */}
      {viewMode === 'ano' && !loading && Object.keys(aniversariantesPorMes).length > 0 && (
        <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Resumo por Mês - {selectedYear}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Object.entries(aniversariantesPorMes).map(([mes, aniversariantes]) => (
                <div key={mes} className="bg-gray-50 dark:bg-secondary-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {aniversariantes.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {mes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
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
        ) : filteredAniversariantes.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Nenhum aniversariante encontrado</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Não foram encontrados aniversariantes para {getViewModeTitle().toLowerCase()} com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center text-sm font-bold uppercase tracking-wider border-r border-blue-500 w-16">
                    Dia
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider border-r border-blue-500">
                    Aniversariantes do {viewMode === 'mes' ? getMonthName(selectedMonth) : viewMode === 'semana' ? 'Semana' : 'Ano'}
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-sm font-bold uppercase tracking-wider border-r border-blue-500 w-40">
                    Data de Nascimento
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-sm font-bold uppercase tracking-wider w-24">
                    Idade Atual
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentItems().map((item, index) => (
                  <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 text-center border-r border-gray-200">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 mx-auto">
                        <span className="text-sm font-bold">{getDayOfMonth(item.data_nascimento)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          {item.foto ? (
                            <img 
                              src={item.foto} 
                              alt={item.nome} 
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <FiUser className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.setor || 'Setor não informado'} • {item.cargo || 'Cargo não informado'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(item.data_nascimento)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm font-bold text-blue-600">
                        {calculateAge(item.data_nascimento)} anos
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Paginação */}
        {!loading && filteredAniversariantes.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-secondary-700 border-t border-gray-200 dark:border-secondary-600 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando
                <span className="font-medium mx-1">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredAniversariantes.length)}</span>
                a
                <span className="font-medium mx-1">{Math.min(currentPage * itemsPerPage, filteredAniversariantes.length)}</span>
                de
                <span className="font-medium mx-1">{filteredAniversariantes.length}</span>
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
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === pageNum 
                        ? 'bg-primary-600 text-white' 
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700'
                    }`}
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
      
      {/* Cartões de Aniversariantes */}
      {!loading && filteredAniversariantes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Cartões - {getViewModeTitle()}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getCurrentItems().map((item, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-secondary-700 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="bg-primary-600 dark:bg-primary-700 px-4 py-2 text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <FiGift className="h-5 w-5 mr-2" />
                    <span className="font-medium">Dia {getDayOfMonth(item.data_nascimento)}</span>
                  </div>
                  <div className="bg-white dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-full h-8 w-8 flex items-center justify-center font-bold">
                    {getDayOfMonth(item.data_nascimento)}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-secondary-700 flex items-center justify-center overflow-hidden">
                      {item.foto ? (
                        <img 
                          src={item.foto} 
                          alt={item.nome} 
                          className="h-16 w-16 object-cover"
                        />
                      ) : (
                        <FiUser className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">{item.nome}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.setor}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-secondary-700 pt-3">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiCalendar className="h-4 w-4 mr-2" />
                      <span>Nascimento: {formatDate(item.data_nascimento)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <FiFilter className="h-4 w-4 mr-2" />
                      <span>Cargo: {item.cargo || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AniversariantesList;