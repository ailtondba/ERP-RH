import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4">
            404
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Página não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiHome className="mr-2" />
              Ir para o Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiArrowLeft className="mr-2" />
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;