import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiMapPin, FiUser, FiX } from 'react-icons/fi';
import { enderecosService } from '../../services/api';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const EnderecosList = () => {
  const [enderecos, setEnderecos] = useState([]);
  const [filteredEnderecos, setFilteredEnderecos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCidade, setFilterCidade] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [cidades, setCidades] = useState([]);
  const [setores, setSetores] = useState([]);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchEnderecos();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [enderecos, searchTerm, filterCidade, filterSetor]);
  
  useEffect(() => {
    setTotalPages(Math.ceil(filteredEnderecos.length / itemsPerPage));
  }, [filteredEnderecos, itemsPerPage]);

  const fetchEnderecos = async () => {
    try {
      setLoading(true);
      const response = await enderecosService.getAll();
      const enderecosData = response.data.data || response.data || [];
      setEnderecos(enderecosData);
      setFilteredEnderecos(enderecosData);
      
      // Extrair cidades e setores únicos para os filtros
      const uniqueCidades = [...new Set(enderecosData.map(item => item.cidade))];
      const uniqueSetores = [...new Set(enderecosData.map(item => item.servidor.setor))];
      
      setCidades(uniqueCidades.filter(Boolean).sort());
      setSetores(uniqueSetores.filter(Boolean).sort());
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao carregar dados',
        text: 'Não foi possível carregar os endereços. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!enderecos.length) return;
    
    let result = [...enderecos];
    
    // Aplicar filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.servidor.nome.toLowerCase().includes(searchLower) ||
        (item.logradouro && item.logradouro.toLowerCase().includes(searchLower)) ||
        (item.bairro && item.bairro.toLowerCase().includes(searchLower))
      );
    }
    
    // Aplicar filtro de cidade
    if (filterCidade) {
      result = result.filter(item => item.cidade === filterCidade);
    }
    
    // Aplicar filtro de setor
    if (filterSetor) {
      result = result.filter(item => item.servidor.setor === filterSetor);
    }
    
    setFilteredEnderecos(result);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterCidadeChange = (e) => {
    setFilterCidade(e.target.value);
  };

  const handleFilterSetorChange = (e) => {
    setFilterSetor(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCidade('');
    setFilterSetor('');
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
    return filteredEnderecos.slice(indexOfFirstItem, indexOfLastItem);
  };

  const formatarEndereco = (endereco) => {
    const { logradouro, numero, complemento, bairro, cidade, uf, cep } = endereco;
    let enderecoFormatado = '';
    
    if (logradouro) enderecoFormatado += logradouro;
    if (numero) enderecoFormatado += `, ${numero}`;
    if (complemento) enderecoFormatado += `, ${complemento}`;
    if (bairro) enderecoFormatado += `, ${bairro}`;
    if (cidade) enderecoFormatado += `, ${cidade}`;
    if (uf) enderecoFormatado += ` - ${uf}`;
    if (cep) enderecoFormatado += `, CEP: ${cep}`;
    
    return enderecoFormatado || 'Endereço não cadastrado';
  };

  const formatarCEP = (cep) => {
    if (!cep) return '-';
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('Relatório de Endereços', 105, 15, { align: 'center' });
    
    // Filtros aplicados
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let filtrosTexto = 'Filtros: ';
    
    if (searchTerm) filtrosTexto += `Busca: "${searchTerm}", `;
    if (filterCidade) filtrosTexto += `Cidade: ${filterCidade}, `;
    if (filterSetor) filtrosTexto += `Setor: ${filterSetor}, `;
    
    if (filtrosTexto === 'Filtros: ') filtrosTexto += 'Nenhum';
    else filtrosTexto = filtrosTexto.slice(0, -2); // Remover a última vírgula e espaço
    
    doc.text(filtrosTexto, 14, 25);
    
    // Data de geração
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Tabela
    const tableColumn = ['Servidor', 'Setor', 'Logradouro', 'Número', 'Bairro', 'Cidade', 'UF', 'CEP'];
    const tableRows = [];
    
    filteredEnderecos.forEach(item => {
      const rowData = [
        item.servidor.nome,
        item.servidor.setor || '-',
        item.logradouro || '-',
        item.numero || '-',
        item.bairro || '-',
        item.cidade || '-',
        item.uf || '-',
        formatarCEP(item.cep)
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
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 30 }, // Servidor
        1: { cellWidth: 20 }, // Setor
        2: { cellWidth: 35 }, // Logradouro
        3: { cellWidth: 10 }, // Número
        4: { cellWidth: 20 }, // Bairro
        5: { cellWidth: 20 }, // Cidade
        6: { cellWidth: 10 }, // UF
        7: { cellWidth: 15 }  // CEP
      }
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
    doc.save('relatorio_enderecos.pdf');
  };

  const exportToCSV = () => {
    // Cabeçalho
    let csvContent = 'Servidor,Setor,Logradouro,Número,Complemento,Bairro,Cidade,UF,CEP\n';
    
    // Dados
    filteredEnderecos.forEach(item => {
      const row = [
        item.servidor.nome.replace(/,/g, ' '),
        (item.servidor.setor || '-').replace(/,/g, ' '),
        (item.logradouro || '-').replace(/,/g, ' '),
        item.numero || '-',
        (item.complemento || '-').replace(/,/g, ' '),
        (item.bairro || '-').replace(/,/g, ' '),
        (item.cidade || '-').replace(/,/g, ' '),
        item.uf || '-',
        formatarCEP(item.cep)
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio_enderecos.csv');
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
          Endereços dos Funcionários
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
      
      {/* Filtros */}
      <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            {/* Busca */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar por servidor, logradouro ou bairro
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
            
            {/* Filtro de Cidade */}
            <div className="w-full md:w-48">
              <label htmlFor="filterCidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cidade
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="filterCidade"
                  value={filterCidade}
                  onChange={handleFilterCidadeChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Todas as cidades</option>
                  {cidades.map((cidade, index) => (
                    <option key={index} value={cidade}>
                      {cidade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Filtro de Setor */}
            <div className="w-full md:w-48">
              <label htmlFor="filterSetor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Setor
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="filterSetor"
                  value={filterSetor}
                  onChange={handleFilterSetorChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Todos os setores</option>
                  {setores.map((setor, index) => (
                    <option key={index} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
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
        ) : filteredEnderecos.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Nenhum endereço encontrado</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Não foram encontrados endereços com os filtros aplicados.
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
                    Endereço
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cidade/UF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    CEP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                {getCurrentItems().map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-secondary-700 flex items-center justify-center">
                          {item.servidor.foto ? (
                            <img 
                              src={item.servidor.foto} 
                              alt={item.servidor.nome} 
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <FiUser className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.servidor.nome}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Matrícula: {item.servidor.matricula || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{item.servidor.setor || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.logradouro ? (
                          <>
                            {item.logradouro}, {item.numero || 'S/N'}
                            {item.complemento && <span>, {item.complemento}</span>}
                          </>
                        ) : (
                          'Não informado'
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.bairro || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {item.cidade ? (
                          <>
                            {item.cidade}{item.uf && <span> - {item.uf}</span>}
                          </>
                        ) : (
                          'Não informado'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatarCEP(item.cep)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Paginação */}
        {!loading && filteredEnderecos.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-secondary-700 border-t border-gray-200 dark:border-secondary-600 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando
                <span className="font-medium mx-1">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredEnderecos.length)}</span>
                a
                <span className="font-medium mx-1">{Math.min(currentPage * itemsPerPage, filteredEnderecos.length)}</span>
                de
                <span className="font-medium mx-1">{filteredEnderecos.length}</span>
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
      
      {/* Mapa de Distribuição (Opcional - Poderia ser implementado com uma biblioteca como react-leaflet) */}
      {!loading && filteredEnderecos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição por Cidade
          </h3>
          
          <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cidades.map((cidade, index) => {
                const count = filteredEnderecos.filter(item => item.cidade === cidade).length;
                if (count === 0) return null;
                
                return (
                  <div 
                    key={index} 
                    className="bg-gray-50 dark:bg-secondary-700 rounded-lg p-4 flex items-center justify-between"
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300">
                        <FiMapPin className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{cidade}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {count} {count === 1 ? 'funcionário' : 'funcionários'}
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white dark:bg-secondary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium text-sm">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnderecosList;