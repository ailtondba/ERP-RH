import React, { useState, useEffect } from 'react';
import { 
  FiBarChart2, FiPieChart, FiUsers, FiCalendar, 
  FiDownload, FiFilter, FiRefreshCw, FiMapPin, FiCheck
} from 'react-icons/fi';
import { relatoriosService, funcionariosService } from '../../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Relatorios = () => {
  const [loading, setLoading] = useState(true);
  const [tipoRelatorio, setTipoRelatorio] = useState('lista_funcionarios');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [dadosRelatorio, setDadosRelatorio] = useState(null);
  const [resumoMensal, setResumoMensal] = useState(null);
  
  // Opções de relatórios
  const opcoesRelatorios = [
    { id: 'lista_funcionarios', nome: 'Lista de Funcionários', icone: <FiUsers /> },
    { id: 'funcionarios_por_setor', nome: 'Funcionários por Setor', icone: <FiUsers /> },
    { id: 'funcionarios_por_status', nome: 'Funcionários por Status', icone: <FiPieChart /> },
    { id: 'funcionarios_por_cidade', nome: 'Funcionários por Cidade', icone: <FiMapPin /> },
    { id: 'ferias_por_mes', nome: 'Férias por Mês', icone: <FiCalendar /> },
    { id: 'aniversariantes_por_mes', nome: 'Aniversariantes por Mês', icone: <FiCalendar /> },
    { id: 'admissoes_demissoes', nome: 'Admissões e Demissões', icone: <FiBarChart2 /> },
    { id: 'funcionarios_por_cargo', nome: 'Funcionários por Cargo', icone: <FiUsers /> },
    { id: 'ferias_por_setor', nome: 'Férias por Setor', icone: <FiCalendar /> },
    { id: 'idade_funcionarios', nome: 'Distribuição de Idade', icone: <FiBarChart2 /> },
    { id: 'tempo_servico', nome: 'Tempo de Serviço', icone: <FiPieChart /> }
  ];
  
  useEffect(() => {
    fetchResumoMensal();
  }, []);
  
  useEffect(() => {
    if (tipoRelatorio) {
      gerarRelatorio();
    }
  }, [tipoRelatorio, periodoInicio, periodoFim]);

  const fetchResumoMensal = async () => {
    try {
      setLoading(true);
      const response = await funcionariosService.getResumoMensal();
      setResumoMensal(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao buscar resumo mensal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao carregar dados',
        text: 'Não foi possível carregar o resumo mensal. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorio = async () => {
    try {
      setLoading(true);
      
      let params = {};
      if (periodoInicio) params.data_inicio = periodoInicio;
      if (periodoFim) params.data_fim = periodoFim;
      
      const response = await relatoriosService.getRelatorio(tipoRelatorio, params);
      setDadosRelatorio(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro ao gerar relatório',
        text: 'Não foi possível gerar o relatório solicitado. Por favor, tente novamente.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTipoRelatorioChange = (tipo) => {
    setTipoRelatorio(tipo);
  };

  const handlePeriodoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'periodoInicio') {
      setPeriodoInicio(value);
    } else if (name === 'periodoFim') {
      setPeriodoFim(value);
    }
  };

  const limparFiltros = () => {
    setPeriodoInicio('');
    setPeriodoFim('');
  };

  const exportarPDF = () => {
    if (!dadosRelatorio) return;
    
    const doc = new jsPDF();
    
    // Título
    const relatorioSelecionado = opcoesRelatorios.find(opcao => opcao.id === tipoRelatorio);
    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text(`Relatório: ${relatorioSelecionado.nome}`, 105, 15, { align: 'center' });
    
    // Filtros aplicados
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    let filtrosTexto = 'Filtros: ';
    
    if (periodoInicio) filtrosTexto += `Período de: ${formatarData(periodoInicio)}, `;
    if (periodoFim) filtrosTexto += `Período até: ${formatarData(periodoFim)}, `;
    
    if (filtrosTexto === 'Filtros: ') filtrosTexto += 'Nenhum';
    else filtrosTexto = filtrosTexto.slice(0, -2); // Remover a última vírgula e espaço
    
    doc.text(filtrosTexto, 14, 25);
    
    // Data de geração
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Tabela
    const tableColumn = getTableColumns();
    const tableRows = getTableRows();
    
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
    doc.save(`relatorio_${tipoRelatorio}.pdf`);
  };

  const prepararDadosParaCSV = () => {
    if (!dadosRelatorio || dadosRelatorio.length === 0) return [];
    
    const cabecalhos = getTableColumns();
    const linhas = getTableRows();
    
    return [cabecalhos, ...linhas];
  };
  
  const calcularPercentual = (dados) => {
    const total = dados.reduce((sum, item) => sum + item.quantidade, 0);
    return dados.map(item => ({
      ...item,
      percentual: total > 0 ? (item.quantidade / total) * 100 : 0
    }));
  };

  const exportarCSV = () => {
    if (!dadosRelatorio) return;
    
    // Cabeçalho
    const headers = getTableColumns();
    let csvContent = headers.join(',') + '\n';
    
    // Dados
    const rows = getTableRows();
    rows.forEach(row => {
      const formattedRow = row.map(cell => {
        // Escapar vírgulas e quebras de linha
        if (typeof cell === 'string') {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });
      csvContent += formattedRow.join(',') + '\n';
    });
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${tipoRelatorio}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTableColumns = () => {
    if (!dadosRelatorio) return [];
    
    switch (tipoRelatorio) {
      case 'lista_funcionarios':
        return ['Matrícula', 'Nome', 'Setor', 'Admissão'];
      case 'funcionarios_por_setor':
        return ['Setor', 'Quantidade', 'Percentual'];
      case 'funcionarios_por_status':
        return ['Status', 'Quantidade', 'Percentual'];
      case 'ferias_por_mes':
        return ['Mês', 'Quantidade'];
      case 'aniversariantes_por_mes':
        return ['Mês', 'Quantidade'];
      case 'funcionarios_por_cidade':
        return ['Cidade', 'UF', 'Quantidade', 'Percentual'];
      case 'admissoes_demissoes':
        return ['Mês', 'Admissões', 'Demissões', 'Saldo'];
      case 'funcionarios_por_cargo':
        return ['Cargo', 'Quantidade', 'Percentual'];
      case 'ferias_por_setor':
        return ['Setor', 'Quantidade'];
      case 'idade_funcionarios':
        return ['Faixa Etária', 'Quantidade', 'Percentual'];
      case 'tempo_servico':
        return ['Tempo de Serviço', 'Quantidade', 'Percentual'];
      default:
        return [];
    }
  };

  const getTableRows = () => {
    if (!dadosRelatorio || !Array.isArray(dadosRelatorio)) return [];
    
    switch (tipoRelatorio) {
      case 'lista_funcionarios':
        return dadosRelatorio.map(item => [
          item.matricula,
          item.nome,
          item.setor,
          formatarData(item.data_admissao)
        ]);
      case 'funcionarios_por_setor':
        return dadosRelatorio.map(item => [
          item.setor,
          item.quantidade,
          `${item.percentual.toFixed(2)}%`
        ]);
      case 'funcionarios_por_status':
        return dadosRelatorio.map(item => [
          item.status === 'ativo' ? 'Ativo' : 'Inativo',
          item.quantidade,
          `${item.percentual.toFixed(2)}%`
        ]);
      case 'ferias_por_mes':
        return dadosRelatorio.map(item => [
          getNomeMes(item.mes),
          item.quantidade
        ]);
      case 'aniversariantes_por_mes':
        return dadosRelatorio.map(item => [
          getNomeMes(item.mes),
          item.quantidade
        ]);
      case 'funcionarios_por_cidade':
        return dadosRelatorio.map(item => [
          item.cidade,
          item.uf,
          item.quantidade,
          `${item.percentual.toFixed(2)}%`
        ]);
      case 'admissoes_demissoes':
        return dadosRelatorio.map(item => [
          getNomeMes(item.mes),
          item.admissoes,
          item.demissoes,
          item.admissoes - item.demissoes
        ]);
      case 'funcionarios_por_cargo':
        return dadosRelatorio.map(item => [
          item.cargo,
          item.quantidade,
          `${item.percentual.toFixed(2)}%`
        ]);
      case 'ferias_por_setor':
        return dadosRelatorio.map(item => [
          item.setor,
          item.quantidade
        ]);
      case 'idade_funcionarios':
        return dadosRelatorio.map(item => [
          item.faixa_etaria,
          item.quantidade
        ]);
      case 'tempo_servico':
        return dadosRelatorio.map(item => [
          item.tempo_servico,
          item.quantidade
        ]);
      default:
        return [];
    }
  };

  const getNomeMes = (numeroMes) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[numeroMes - 1];
  };

  const formatarData = (dataString) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const getChartData = () => {
    if (!dadosRelatorio || !Array.isArray(dadosRelatorio) || dadosRelatorio.length === 0) return null;
    
    // Não mostrar gráfico para lista de funcionários
    if (tipoRelatorio === 'lista_funcionarios') return null;
    
    const cores = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(40, 159, 64, 0.8)',
      'rgba(210, 199, 199, 0.8)',
      'rgba(78, 52, 199, 0.8)',
      'rgba(225, 109, 64, 0.8)'
    ];
    
    switch (tipoRelatorio) {
      case 'funcionarios_por_setor':
      case 'funcionarios_por_status':
      case 'funcionarios_por_cidade':
      case 'funcionarios_por_cargo':
      case 'idade_funcionarios':
      case 'tempo_servico':
        return {
          type: 'pie',
          data: {
            labels: dadosRelatorio.map(item => {
              if (tipoRelatorio === 'funcionarios_por_setor') return item.setor;
              if (tipoRelatorio === 'funcionarios_por_status') return item.status === 'ativo' ? 'Ativo' : 'Inativo';
              if (tipoRelatorio === 'funcionarios_por_cidade') return `${item.cidade} - ${item.uf}`;
              if (tipoRelatorio === 'funcionarios_por_cargo') return item.cargo;
              if (tipoRelatorio === 'idade_funcionarios') return item.faixa_etaria;
              if (tipoRelatorio === 'tempo_servico') return item.tempo_servico;
              return item.nome || item.label;
            }),
            datasets: [{
              data: dadosRelatorio.map(item => item.quantidade),
              backgroundColor: cores.slice(0, dadosRelatorio.length),
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const dataset = context.dataset;
                    const total = dataset.data.reduce((acc, data) => acc + data, 0);
                    const percentage = ((value / total) * 100).toFixed(2);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        };
      case 'ferias_por_mes':
      case 'aniversariantes_por_mes':
      case 'ferias_por_setor':
      case 'admissoes_demissoes':
        if (tipoRelatorio === 'admissoes_demissoes') {
          return {
            type: 'bar',
            data: {
              labels: dadosRelatorio.map(item => getNomeMes(item.mes)),
              datasets: [
                {
                  label: 'Admissões',
                  data: dadosRelatorio.map(item => item.admissoes),
                  backgroundColor: 'rgba(54, 162, 235, 0.8)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Demissões',
                  data: dadosRelatorio.map(item => item.demissoes),
                  backgroundColor: 'rgba(255, 99, 132, 0.8)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
                  },
                  grid: {
                    color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
                  },
                  grid: {
                    color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
                  }
                }
              }
            }
          };
        } else {
          let labels, labelField, dataLabel, backgroundColor, borderColor;
          
          if (tipoRelatorio === 'ferias_por_setor') {
            labels = dadosRelatorio.map(item => item.setor);
            dataLabel = 'Funcionários em Férias por Setor';
            backgroundColor = 'rgba(75, 192, 192, 0.8)';
            borderColor = 'rgba(75, 192, 192, 1)';
          } else {
            labels = dadosRelatorio.map(item => getNomeMes(item.mes));
            dataLabel = tipoRelatorio === 'ferias_por_mes' ? 'Funcionários em Férias' : 'Aniversariantes';
            backgroundColor = tipoRelatorio === 'ferias_por_mes' ? 'rgba(54, 162, 235, 0.8)' : 'rgba(255, 99, 132, 0.8)';
            borderColor = tipoRelatorio === 'ferias_por_mes' ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)';
          }
          
          return {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: dataLabel,
                data: dadosRelatorio.map(item => item.quantidade),
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  ticks: {
                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
                  },
                  grid: {
                    color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
                  },
                  grid: {
                    color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                  }
                }
              },
              plugins: {
                legend: {
                  labels: {
                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#333'
                  }
                }
              }
            }
          };
        }
      default:
        return null;
    }
  };

  const renderChart = () => {
    if (!dadosRelatorio || dadosRelatorio.length === 0) return null;
    
    const chartData = getChartData();
    if (!chartData) return null;
    
    if (chartData.type === 'pie') {
      return <Pie data={chartData.data} options={chartData.options} />;
    } else if (chartData.type === 'bar') {
      return <Bar data={chartData.data} options={chartData.options} />;
    }
    
    return null;
  };

  const renderResumoMensal = () => {
    if (!resumoMensal) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
            <FiUsers className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Funcionários Ativos</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumoMensal.ativos}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
            <FiCalendar className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Em Férias</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumoMensal.em_ferias}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
            <FiCheck className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Admitidos no Mês</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumoMensal.admitidos}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-3 mr-4">
            <FiUsers className="h-6 w-6 text-red-600 dark:text-red-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Demitidos no Mês</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumoMensal.demitidos}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Relatórios
        </h2>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportarPDF}
            disabled={!dadosRelatorio}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Exportar PDF
          </button>
          
          <button
            type="button"
            onClick={exportarCSV}
            disabled={!dadosRelatorio}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Exportar CSV
          </button>
        </div>
      </div>
      
      {/* Resumo Mensal */}
      {renderResumoMensal()}
      
      {/* Seleção de Relatório e Filtros */}
      <div className="bg-white dark:bg-secondary-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Selecione o Tipo de Relatório
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {opcoesRelatorios.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => handleTipoRelatorioChange(opcao.id)}
                className={`flex items-center p-4 border rounded-lg transition-all ${tipoRelatorio === opcao.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-gray-300 dark:border-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-gray-300'}`}
              >
                <div className={`rounded-full p-2 mr-3 ${tipoRelatorio === opcao.id ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300' : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-gray-400'}`}>
                  {opcao.icone}
                </div>
                <span className="font-medium">{opcao.nome}</span>
              </button>
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            {/* Período Início */}
            <div className="w-full md:w-48">
              <label htmlFor="periodoInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Período de
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="periodoInicio"
                  name="periodoInicio"
                  value={periodoInicio}
                  onChange={handlePeriodoChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Período Fim */}
            <div className="w-full md:w-48">
              <label htmlFor="periodoFim" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Período até
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="periodoFim"
                  name="periodoFim"
                  value={periodoFim}
                  onChange={handlePeriodoChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Botões */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={gerarRelatorio}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiRefreshCw className="-ml-1 mr-2 h-5 w-5" />
                Atualizar
              </button>
              
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiFilter className="-ml-1 mr-2 h-5 w-5" />
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visualização do Relatório */}
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
        ) : !dadosRelatorio || !Array.isArray(dadosRelatorio) || dadosRelatorio.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Nenhum dado encontrado</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Não foram encontrados dados para o relatório selecionado com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              {opcoesRelatorios.find(opcao => opcao.id === tipoRelatorio)?.nome}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfico */}
              <div className="bg-white dark:bg-secondary-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-secondary-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Visualização Gráfica</h4>
                <div className="h-80">
                  {renderChart()}
                </div>
              </div>
              
              {/* Tabela */}
              <div className="bg-white dark:bg-secondary-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-secondary-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Dados Detalhados</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                    <thead className="bg-gray-50 dark:bg-secondary-800">
                      <tr>
                        {getTableColumns().map((column, index) => (
                          <th 
                            key={index} 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-secondary-700">
                      {getTableRows().map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-secondary-800">
                          {row.map((cell, cellIndex) => (
                            <td 
                              key={cellIndex} 
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Relatorios;