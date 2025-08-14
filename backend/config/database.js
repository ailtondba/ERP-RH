const { Sequelize } = require('sequelize');
const path = require('path');
const os = require('os');

// Determinar o tipo de banco de dados
const dbType = process.env.DB_TYPE || 'sqlite'; // 'mysql' ou 'sqlite'

// Configuração para SQLite (Desktop)
const getSQLiteConfig = () => {
  // Usar caminho definido no server.js ou fallback para desenvolvimento
  let dbPath = process.env.DATABASE_PATH;
  
  if (!dbPath) {
    // Fallback para diferentes cenários
    if (process.pkg || process.env.TAURI_PLATFORM) {
      // Se executando como aplicação compilada (pkg ou Tauri)
      dbPath = path.join(path.dirname(process.execPath), 'database.sqlite');
      
      // Para Tauri, também tentar na pasta de recursos
      const fs = require('fs');
      if (!fs.existsSync(dbPath)) {
        // Tentar na pasta atual
        dbPath = path.join(process.cwd(), 'database.sqlite');
        
        if (!fs.existsSync(dbPath)) {
          // Tentar na pasta do script
          dbPath = path.join(__dirname, '..', 'database.sqlite');
        }
      }
    } else {
      // Se executando em desenvolvimento, usar banco local
      dbPath = path.join(__dirname, '..', 'database.sqlite');
    }
  }
  
  return {
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true
    }
  };
};

// Configuração para MySQL (Web)
const getMySQLConfig = () => {
  return {
    database: process.env.DB_NAME || 'erp_rh',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
};

// Selecionar configuração baseada no tipo de banco
const config = dbType === 'sqlite' ? getSQLiteConfig() : getMySQLConfig();

// Criar instância do Sequelize
const sequelize = new Sequelize(config);

// Testar a conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
  Op: Sequelize.Op
};
