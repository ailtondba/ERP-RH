import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { useAuth } from './contexts/AuthContext';
import AOS from 'aos';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Páginas de autenticação
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Páginas do dashboard
import Dashboard from './pages/dashboard/Dashboard';
import FuncionariosList from './pages/funcionarios/funcionarioList';
import FuncionarioForm from './pages/funcionarios/funcionario';
import FuncionarioDetail from './pages/funcionarios/funcionarioDetalhes';
import FeriasList from './pages/ferias/FeriasList';
import AniversariantesList from './pages/aniversariantes/AniversariantesList';

import Relatorios from './pages/relatorios/Relatorios';
import Configuracoes from './pages/configuracoes/Configuracoes';
import NotFound from './pages/NotFound';

// Rota protegida por autenticação
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  useEffect(() => {
    // Inicializa a biblioteca AOS para animações de scroll
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <Routes>
      {/* Redirecionamento automático */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
      } />
      
      {/* Rotas de autenticação */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
      
      {/* Rotas do dashboard (protegidas) */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/funcionarios" element={<FuncionariosList />} />
        <Route path="/funcionarios/novo" element={<FuncionarioForm />} />
        <Route path="/funcionarios/editar/:id" element={<FuncionarioForm />} />
        <Route path="/funcionarios/:id" element={<FuncionarioDetail />} />
        <Route path="/ferias" element={<FeriasList />} />
        <Route path="/aniversariantes" element={<AniversariantesList />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      
      {/* Página 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;