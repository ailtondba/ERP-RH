import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, 
  FiCalendar, 
  FiGift, 
  FiUserPlus, 
  FiUserMinus, 
  FiArrowRight,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiClock,
  FiAlertTriangle,
  FiBookOpen,
  FiUserCheck,
  FiHeart,
  FiSearch
} from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { funcionariosService, feriasService, aniversariantesService } from '../../services/api';
import Swal from 'sweetalert2';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalFuncionarios: 0,
    turnoverMes: 3.2,
    faltasAtestados: 18,
    novasContratacoes: 4,
    efetivos: 0,
    terceirizados: 0,
    estagiarios: 0,
    comissionados: 0,
    capacitacoes: 8,
    periodoExperiencia: 5,
    feriasLicenca: 7,
    funcionariosFerias: 0
  });
  const [evolucaoFuncionarios, setEvolucaoFuncionarios] = useState([]);
  const [aniversariantesSemana, setAniversariantesSemana] = useState([]);
  const [alertasImportantes, setAlertasImportantes] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Buscar total de funcionários
        console.log('Buscando total de funcionários...');
        const funcionariosResponse = await funcionariosService.getAll();
        console.log('Resposta da API de funcionários:', funcionariosResponse.data);
        const funcionarios = funcionariosResponse.data.data.items || funcionariosResponse.data.data || funcionariosResponse.data || [];
        const totalFuncionarios = funcionarios.length;
        console.log('Total de funcionários:', totalFuncionarios);
        console.log('Array de funcionários:', funcionarios);
        
        // Contar funcionários por status/tipo
        const efetivos = funcionarios.filter(f => f.status === 'ativo').length;
        const terceirizados = funcionarios.filter(f => f.vinculo === 'terceirizado').length;
        const estagiarios = funcionarios.filter(f => f.vinculo === 'estagiario').length;
        const comissionados = funcionarios.filter(f => f.vinculo === 'comissionado').length;
        
        // Buscar dados de férias do mês atual
        console.log('Buscando férias do mês atual...');
        const feriasDoMes = await feriasService.getFeriasMesAtual();
        console.log('Resposta da API de férias:', feriasDoMes.data);
        const funcionariosEmFeriasNoMes = feriasDoMes.data.data ? feriasDoMes.data.data.length : 0;
        console.log('Funcionários em férias no mês:', funcionariosEmFeriasNoMes);
        
        // Atualizar dados do dashboard com informações reais
        setDashboardData(prev => ({
          ...prev,
          totalFuncionarios,
          efetivos,
          terceirizados,
          estagiarios,
          comissionados,
          funcionariosFerias: funcionariosEmFeriasNoMes,
          feriasLicenca: funcionariosEmFeriasNoMes
        }));
        
        // Simular dados de evolução dos funcionários (últimos 12 meses)
        setEvolucaoFuncionarios([
          { mes: 'Jan', ti: 20, vendas: 15, marketing: 8, rh: 12, financas: 10 },
          { mes: 'Fev', ti: 22, vendas: 18, marketing: 10, rh: 12, financas: 11 },
          { mes: 'Mar', ti: 25, vendas: 20, marketing: 12, rh: 13, financas: 12 },
          { mes: 'Abr', ti: 28, vendas: 22, marketing: 14, rh: 14, financas: 13 },
          { mes: 'Mai', ti: 30, vendas: 25, marketing: 16, rh: 15, financas: 14 },
          { mes: 'Jun', ti: 32, vendas: 28, marketing: 18, rh: 16, financas: 15 },
          { mes: 'Jul', ti: 35, vendas: 30, marketing: 20, rh: 17, financas: 16 },
          { mes: 'Ago', ti: 38, vendas: 32, marketing: 22, rh: 18, financas: 17 },
          { mes: 'Set', ti: 40, vendas: 35, marketing: 24, rh: 19, financas: 18 },
          { mes: 'Out', ti: 42, vendas: 38, marketing: 26, rh: 20, financas: 19 },
          { mes: 'Nov', ti: 45, vendas: 40, marketing: 28, rh: 21, financas: 20 },
          { mes: 'Dez', ti: 48, vendas: 42, marketing: 30, rh: 22, financas: 21 }
        ]);
        
        // Aniversariantes da semana
        setAniversariantesSemana([
          { id: 1, nome: 'Ana Silva', cargo: 'Analista de RH', foto: '/uploads/test-avatar-1.svg' },
          { id: 2, nome: 'Bruno Mendes', cargo: 'Desenvolvedor', foto: '/uploads/test-avatar-2.svg' },
          { id: 3, nome: 'Carla Dias', cargo: 'Gerente de Vendas', foto: '/uploads/test-avatar-3.svg' },
          { id: 4, nome: 'Daniel Santos', cargo: 'Designer', foto: '/uploads/test-avatar-1.svg' }
        ]);
        
        // Alertas importantes
        setAlertasImportantes([
          { id: 1, tipo: 'avaliacao', texto: 'Colaboradores com avaliação de desempenho pendente', count: 8 },
          { id: 2, tipo: 'documentacao', texto: 'Documentação vencendo', count: 3 },
          { id: 3, tipo: 'contratos', texto: 'Contratos temporários próximo do fim', count: 2 }
        ]);
        
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro ao carregar dashboard',
          text: 'Não foi possível carregar os dados do dashboard. Tente novamente.',
          confirmButtonColor: '#3B82F6'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Dados para o gráfico de evolução dos funcionários
  const evolucaoData = {
    labels: evolucaoFuncionarios.map(item => item.mes),
    datasets: [
      {
        label: 'TI',
        data: evolucaoFuncionarios.map(item => item.ti),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Vendas',
        data: evolucaoFuncionarios.map(item => item.vendas),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Marketing',
        data: evolucaoFuncionarios.map(item => item.marketing),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'RH',
        data: evolucaoFuncionarios.map(item => item.rh),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Finanças',
        data: evolucaoFuncionarios.map(item => item.financas),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Dados para o gráfico de barras (tipos de funcionários)
  const tiposFuncionariosData = {
    labels: ['Efetivos', 'Terceirizados', 'Estagiários', 'Comissionados'],
    datasets: [
      {
        label: 'Quantidade de Funcionários',
        data: [dashboardData.efetivos, dashboardData.terceirizados, dashboardData.estagiarios, dashboardData.comissionados],
        backgroundColor: [
          '#3B82F6',   // Azul para Efetivos
          '#10B981',   // Verde para Terceirizados
          '#F59E0B',   // Amarelo para Estagiários
          '#8B5CF6'    // Roxo para Comissionados
        ],
        borderColor: [
          '#2563EB',
          '#059669',
          '#D97706',
          '#7C3AED'
        ],
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: [
          '#2563EB',
          '#059669',
          '#D97706',
          '#7C3AED'
        ],
        hoverBorderWidth: 0,
        barThickness: 35,
        maxBarThickness: 45
      }
    ]
  };

  // Dados para o gráfico de barras (resumo do mês)
  const barData = {
    labels: ['Capacitações', 'Período Experiência', 'Férias/Licença'],
    datasets: [
      {
        label: 'Quantidade',
        data: [dashboardData.capacitacoes, dashboardData.periodoExperiencia, dashboardData.feriasLicenca],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#374151',
          font: {
            size: 13,
            weight: '600'
          },
          padding: 15
        },
        border: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        },
        border: {
          display: false
        }
      },
    },
    elements: {
      bar: {
        borderRadius: 12,
        hoverBorderRadius: 16
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    onHover: (event, activeElements) => {
      event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
    }
  };

  const tiposFuncionariosOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#6B7280',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: '600'
        },
        bodyFont: {
          size: 13,
          weight: '500'
        },
        padding: 12,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed.x / total) * 100).toFixed(1);
            return `${context.parsed.x} funcionários (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        anchor: 'end',
        align: 'right',
        color: '#374151',
        font: {
          size: 14,
          weight: '700'
        },
        formatter: function(value) {
          return value;
        },
        offset: 8
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        display: false,
        grid: {
          display: false,
        },
        ticks: {
          display: false
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#374151',
          font: {
            size: 13,
            weight: '600'
          },
          padding: 12
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Componente para cards de estatísticas principais
  const MainStatCard = ({ title, value, subtitle, bgColor, textColor }) => (
    <div className={`${bgColor} rounded-lg p-6 text-white hover:shadow-xl transition-shadow duration-200 cursor-pointer`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium opacity-90">{title}</h3>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-sm opacity-75 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  // Componente para cards de indicadores
  const IndicatorCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Componente de Avatar
  const Avatar = ({ name, size = 'md' }) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base'
    };
    
    return (
      <div className={`${colors[colorIndex]} ${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold`}>
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Visão geral do sistema de recursos humanos</p>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/funcionarios" className="block">
          <MainStatCard
            title="Total de Funcionários"
            value={dashboardData.totalFuncionarios}
            subtitle="Funcionários ativos"
            bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
          />
        </Link>
        <Link to="/ferias" className="block">
          <MainStatCard
            title="Funcionários em Férias"
            value={dashboardData.funcionariosFerias}
            subtitle="Este mês"
            bgColor="bg-gradient-to-r from-green-500 to-teal-500"
          />
        </Link>
        <MainStatCard
          title="Faltas/Atestados"
          value={dashboardData.faltasAtestados}
          subtitle="Este mês"
          bgColor="bg-gradient-to-r from-yellow-600 to-yellow-700"
        />
        <MainStatCard
          title="Novas Contratações"
          value={dashboardData.novasContratacoes}
          subtitle="Este mês"
          bgColor="bg-gradient-to-r from-purple-600 to-purple-700"
        />
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <IndicatorCard
          title="Capacitações"
          value={dashboardData.capacitacoes}
          icon={FiBookOpen}
          color="bg-blue-500"
        />
        <IndicatorCard
          title="Período de Experiência"
          value={dashboardData.periodoExperiencia}
          icon={FiUserCheck}
          color="bg-green-500"
        />
        <IndicatorCard
          title="Férias/Licença"
          value={dashboardData.feriasLicenca}
          icon={FiHeart}
          color="bg-purple-500"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
        {/* Gráfico de Barras - Distribuição por Vínculo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição por Vínculo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visualização detalhada dos tipos de funcionários</p>
            </div>
            <div className="flex items-center space-x-2">
              <FiUsers className="text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Total: {dashboardData.efetivos + dashboardData.terceirizados + dashboardData.estagiarios + dashboardData.comissionados}
              </span>
            </div>
          </div>
          <div className="h-80 group">
            <div className="opacity-60 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
              <Bar data={tiposFuncionariosData} options={tiposFuncionariosOptions} />
            </div>
          </div>
          {/* Legenda personalizada com cores correspondentes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Efetivos</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">({dashboardData.efetivos})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Terceirizados</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">({dashboardData.terceirizados})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Estagiários</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">({dashboardData.estagiarios})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-purple-500"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Comissionados</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">({dashboardData.comissionados})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aniversariantes da Semana */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FiGift className="mr-2 text-yellow-500" />
              Aniversariantes da Semana
            </h3>
            <Link 
              to="/aniversariantes" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center"
            >
              Ver todos <FiArrowRight className="ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {aniversariantesSemana.length > 0 ? (
              aniversariantesSemana.slice(0, 5).map((aniversariante, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Avatar name={aniversariante.nome} size="md" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{aniversariante.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{aniversariante.cargo}</p>
                  </div>
                  <div className="text-right">
                    <div className="relative inline-block">
                      {/* Bolinho de Aniversário 🎂 */}
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          {/* Base do bolo */}
                          <div className="absolute bottom-0.5 w-5 h-2.5 bg-gradient-to-t from-amber-700 to-amber-500 rounded-b border border-amber-800"></div>
                          
                          {/* Cobertura rosa */}
                          <div className="absolute bottom-2.5 w-4 h-1.5 bg-gradient-to-t from-pink-500 to-pink-300 rounded-t border border-pink-600"></div>
                          
                          {/* Três velas */}
                          <div className="absolute bottom-3.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                            <div className="w-0.5 h-1.5 bg-yellow-400 rounded-full"></div>
                            <div className="w-0.5 h-1.5 bg-red-400 rounded-full"></div>
                            <div className="w-0.5 h-1.5 bg-blue-400 rounded-full"></div>
                          </div>
                          
                          {/* Três chamas */}
                          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                            <div className="w-0.5 h-0.5 bg-orange-400 rounded-full animate-pulse"></div>
                            <div className="w-0.5 h-0.5 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                            <div className="w-0.5 h-0.5 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum aniversariante esta semana</p>
            )}
          </div>
        </div>

        {/* Alertas Importantes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FiAlertTriangle className="mr-2 text-yellow-500" />
              Alertas Importantes
            </h3>
          </div>
          <div className="space-y-4">
            {alertasImportantes.length > 0 ? (
              alertasImportantes.map((alerta, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg mr-3">
                    <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alerta.texto}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      {alerta.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum alerta no momento</p>
            )}
  </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;