import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FiHome, FiUsers, FiCalendar, FiGift, 
  FiPieChart, FiSettings, FiLogOut, FiMenu, FiX, 
  FiMoon, FiSun, FiBell, FiUser
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (userMenuOpen) setUserMenuOpen(false);
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { path: '/funcionarios', name: 'Funcionários', icon: <FiUsers className="w-5 h-5" /> },
    { path: '/ferias', name: 'Férias', icon: <FiCalendar className="w-5 h-5" /> },
    { path: '/aniversariantes', name: 'Aniversariantes', icon: <FiGift className="w-5 h-5" /> },
    { path: '/relatorios', name: 'Relatórios', icon: <FiPieChart className="w-5 h-5" /> },
    { path: '/configuracoes', name: 'Configurações', icon: <FiSettings className="w-5 h-5" /> },
  ];

  // Exemplo de notificações
  const notifications = [
    { id: 1, text: 'João Silva está de férias hoje', time: '5 min atrás' },
    { id: 2, text: '3 aniversariantes esta semana', time: '1 hora atrás' },
    { id: 3, text: 'Novo funcionário cadastrado', time: '3 horas atrás' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-secondary-900">
      {/* Sidebar para mobile (overlay) */}
      <div 
        className={`fixed inset-0 z-20 transition-opacity bg-black bg-opacity-50 lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transition duration-300 transform bg-white dark:bg-secondary-800 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backgroundImage: 'url(/images/pic03.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay para melhor legibilidade */}
        <div className="absolute inset-0 bg-white bg-opacity-70 dark:bg-secondary-800 dark:bg-opacity-70"></div>
        <div className="relative z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-secondary-700">
          <div className="flex items-center">
            <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400">Gestão de Pessoas – IOA</span>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-secondary-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-secondary-700'}`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 mt-4 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            <span>Sair</span>
          </button>
        </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header 
          className="relative flex items-center justify-between px-6 py-4 bg-white dark:bg-secondary-800 border-b dark:border-secondary-700"
          style={{
            backgroundImage: 'url(/images/pic04.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Overlay para melhor legibilidade */}
          <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-secondary-800 dark:bg-opacity-75"></div>
          <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-1 mr-4 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-secondary-700"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Botão de tema */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <FiSun className="w-5 h-5 text-yellow-400" />
              ) : (
                <FiMoon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Notificações */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={toggleNotifications}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
                aria-label="Notifications"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                <FiBell className="w-5 h-5" />
              </button>

              {/* Dropdown de notificações */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-lg shadow-lg py-2 z-10 border dark:border-secondary-700">
                  <div className="px-4 py-2 border-b dark:border-secondary-700">
                    <h3 className="text-sm font-semibold">Notificações</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map(notification => (
                      <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-secondary-700 border-b dark:border-secondary-700 last:border-0">
                        <p className="text-sm">{notification.text}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t dark:border-secondary-700">
                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil do usuário */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 focus:outline-none"
                aria-label="User Menu"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium">{user?.nome || 'Usuário'}</span>
              </button>

              {/* Dropdown de usuário */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg py-2 z-10 border dark:border-secondary-700">
                  <Link 
                    to="/configuracoes/perfil" 
                    className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-secondary-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FiUser className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </div>
                  </Link>
                  <Link 
                    to="/configuracoes" 
                    className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-secondary-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FiSettings className="w-4 h-4 mr-2" />
                      Configurações
                    </div>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-secondary-700"
                  >
                    <div className="flex items-center">
                      <FiLogOut className="w-4 h-4 mr-2" />
                      Sair
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-secondary-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;