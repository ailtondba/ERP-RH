import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiUser, FiMail, FiPhone, FiHash, FiBriefcase, FiCalendar, 
  FiMapPin, FiEdit, FiArrowLeft, FiDownload, FiPrinter
} from 'react-icons/fi';
import { servidoresService } from '../../services/api';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ServidorDetalhes = () => {
  const { id } = useParams();
  const [servidor, setServidor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServidor();
  }, [id]);

  const fetchServidor = async () => {
    try {
      setLoading(true);
      const response = await servidoresService.getById(id);
      setServidor(response.data);
      setError(null);
    } catch (error) {
      console.error('Erro ao buscar servidor:', error);
      setError('Não foi possível carregar os dados do servidor. Por favor, tente novamente.');
      Swal.fire({
        icon: 'error',
        title: 'Erro ao buscar servidor',
        text: 'Não foi possível carregar os dados do servidor. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  };

  const exportToPDF = () => {
    if (!servidor) return;

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text('Ficha do Servidor', 105, 15, { align: 'center' });
    
    // Informações do servidor
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Foto (se disponível)
    if (servidor.foto) {
      try {
        doc.addImage(servidor.foto, 'JPEG', 155, 25, 40, 40);
      } catch (e) {
        console.error('Erro ao adicionar imagem ao PDF:', e);
      }
    }
    
    // Dados pessoais
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Dados Pessoais', 14, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Nome: ${servidor.nome || '-'}`, 14, 40);
    doc.text(`CPF: ${formatCPF(servidor.cpf) || '-'}`, 14, 48);
    doc.text(`RG: ${servidor.rg || '-'}`, 14, 56);
    doc.text(`Data de Nascimento: ${formatDate(servidor.data_nascimento) || '-'}`, 14, 64);
    doc.text(`E-mail: ${servidor.email || '-'}`, 14, 72);
    doc.text(`Telefone: ${formatPhone(servidor.telefone) || '-'}`, 14, 80);
    
    // Dados profissionais
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Dados Profissionais', 14, 95);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Matrícula: ${servidor.matricula || '-'}`, 14, 105);
    doc.text(`Cargo: ${servidor.cargo || '-'}`, 14, 113);
    doc.text(`Setor: ${servidor.setor || '-'}`, 14, 121);
    doc.text(`Vínculo: ${servidor.vinculo || '-'}`, 14, 129);
    doc.text(`Data de Admissão: ${formatDate(servidor.data_admissao) || '-'}`, 14, 137);
    doc.text(`Status: ${servidor.status === 'ativo' ? 'Ativo' : 'Inativo'}`, 14, 145);
    
    // Endereço
    if (servidor.endereco) {
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Endereço', 14, 160);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Logradouro: ${servidor.endereco.logradouro || '-'}`, 14, 170);
      doc.text(`Número: ${servidor.endereco.numero || '-'}`, 14, 178);
      doc.text(`Complemento: ${servidor.endereco.complemento || '-'}`, 14, 186);
      doc.text(`Bairro: ${servidor.endereco.bairro || '-'}`, 14, 194);
      doc.text(`Cidade: ${servidor.endereco.cidade || '-'}`, 14, 202);
      doc.text(`UF: ${servidor.endereco.uf || '-'}`, 14, 210);
      doc.text(`CEP: ${servidor.endereco.cep || '-'}`, 14, 218);
    }
    
    // Rodapé
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 280);
    
    // Salvar o PDF
    doc.save(`servidor_${servidor.matricula || id}.pdf`);
  };

  const printDetails = () => {
    window.print();
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Erro ao carregar dados</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          <Link to="/servidores" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  if (!servidor) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <svg className="h-16 w-16 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Servidor não encontrado</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Não foi possível encontrar os dados do servidor solicitado.</p>
          <Link to="/servidores" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Voltar para a lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/servidores" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalhes do Servidor
          </h2>
        </div>
        
        <div className="flex flex-wrap mt-4 md:mt-0 space-x-0 space-y-3 md:space-y-0 md:space-x-3">
          <Link
            to={`/servidores/editar/${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiEdit className="-ml-1 mr-2 h-5 w-5" />
            Editar
          </Link>
          
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
            onClick={printDetails}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPrinter className="-ml-1 mr-2 h-5 w-5" />
            Imprimir
          </button>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Foto e Dados Pessoais */}
        <div className="space-y-6">
          {/* Foto */}
          <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
            <div className="p-6 flex flex-col items-center">
              <div className="h-48 w-48 rounded-full overflow-hidden bg-gray-100 dark:bg-secondary-700 mb-4">
                {servidor.foto ? (
                  <img 
                    src={servidor.foto} 
                    alt={`Foto de ${servidor.nome}`} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <FiUser className="h-24 w-24" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                {servidor.nome}
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                {servidor.cargo}
              </p>
              
              <div className={`mt-4 px-3 py-1 rounded-full text-xs font-medium ${servidor.status === 'ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {servidor.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
          
          {/* Dados Pessoais */}
          <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dados Pessoais</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                <FiHash className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CPF</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatCPF(servidor.cpf) || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiHash className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">RG</p>
                  <p className="text-sm text-gray-900 dark:text-white">{servidor.rg || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Nascimento</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(servidor.data_nascimento) || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiMail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">E-mail</p>
                  <p className="text-sm text-gray-900 dark:text-white">{servidor.email || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiPhone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatPhone(servidor.telefone) || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coluna 2: Dados Profissionais */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dados Profissionais</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                <FiHash className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Matrícula</p>
                  <p className="text-sm text-gray-900 dark:text-white">{servidor.matricula || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiBriefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cargo</p>
                  <p className="text-sm text-gray-900 dark:text-white">{servidor.cargo || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiBriefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Setor</p>
                  <p className="text-sm text-gray-900 dark:text-white">{servidor.setor || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiBriefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vínculo</p>
                  <p className="text-sm text-gray-900 dark:text-white">{servidor.vinculo || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Admissão</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(servidor.data_admissao) || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tempo de Serviço</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {servidor.data_admissao ? (
                      (() => {
                        const admissao = new Date(servidor.data_admissao);
                        const hoje = new Date();
                        const diffAnos = hoje.getFullYear() - admissao.getFullYear();
                        const diffMeses = hoje.getMonth() - admissao.getMonth();
                        
                        if (diffMeses < 0 || (diffMeses === 0 && hoje.getDate() < admissao.getDate())) {
                          return `${diffAnos - 1} anos e ${diffMeses + 12} meses`;
                        }
                        
                        return `${diffAnos} anos e ${diffMeses} meses`;
                      })()
                    ) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Férias (se houver) */}
          {servidor.ferias && servidor.ferias.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Histórico de Férias</h3>
              </div>
              
              <div className="p-6">
                <ul className="space-y-4">
                  {servidor.ferias.map((ferias, index) => (
                    <li key={index} className="border-b border-gray-200 dark:border-secondary-700 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(ferias.data_inicio)} a {formatDate(ferias.data_fim)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {(() => {
                              const inicio = new Date(ferias.data_inicio);
                              const fim = new Date(ferias.data_fim);
                              const diffTime = Math.abs(fim - inicio);
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                              return `${diffDays} dias`;
                            })()}
                          </p>
                        </div>
                        
                        {(() => {
                          const hoje = new Date();
                          const inicio = new Date(ferias.data_inicio);
                          const fim = new Date(ferias.data_fim);
                          
                          if (hoje >= inicio && hoje <= fim) {
                            return (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                Em férias
                              </span>
                            );
                          } else if (hoje < inicio) {
                            return (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                Agendada
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                Concluída
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Coluna 3: Endereço */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Endereço</h3>
            </div>
            
            {servidor.endereco ? (
              <div className="p-6 space-y-4">
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Logradouro</p>
                    <p className="text-sm text-gray-900 dark:text-white">{servidor.endereco.logradouro || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Número</p>
                    <p className="text-sm text-gray-900 dark:text-white">{servidor.endereco.numero || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Complemento</p>
                    <p className="text-sm text-gray-900 dark:text-white">{servidor.endereco.complemento || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bairro</p>
                    <p className="text-sm text-gray-900 dark:text-white">{servidor.endereco.bairro || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cidade/UF</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {servidor.endereco.cidade ? `${servidor.endereco.cidade}/${servidor.endereco.uf || '-'}` : '-'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CEP</p>
                    <p className="text-sm text-gray-900 dark:text-white">{servidor.endereco.cep || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum endereço cadastrado.</p>
              </div>
            )}
          </div>
          
          {/* Observações (se houver) */}
          {servidor.observacoes && (
            <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-secondary-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Observações</h3>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {servidor.observacoes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServidorDetalhes;