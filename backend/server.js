const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
// Servir uploads do backend (desenvolvimento)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir uploads da raiz (executável empacotado)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Importar e configurar banco de dados
const { sequelize } = require('./models');

// Importar rotas
const routes = require('./routes');

// Servir arquivos estáticos do frontend React
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Configurar rotas da API
app.use('/api', routes);

// Servir o frontend React para todas as outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Middleware de tratamento de erros
const { errorHandler, notFound } = require('./utils/response');
app.use(notFound);
app.use(errorHandler);

// Função para iniciar o servidor
let serverInstance = null;

const startServer = async () => {
  try {
    // Verificar se o servidor já está rodando
    if (serverInstance) {
      console.log('⚠️ Servidor já está rodando.');
      return serverInstance;
    }

    // Sincronizar banco de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida.');
    
    await sequelize.sync();
    console.log('✅ Modelos sincronizados com o banco de dados.');
    
    // Iniciar servidor
    serverInstance = app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
    
    // Tratar erro de porta em uso
    serverInstance.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Porta ${PORT} já está em uso. Servidor pode já estar rodando.`);
        // Não encerrar o processo, apenas avisar
        return;
      }
      console.error('❌ Erro no servidor:', error);
    });
    
    return serverInstance;
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    // Não encerrar o processo no Electron
    if (process.env.NODE_ENV !== 'electron') {
      process.exit(1);
    }
  }
};

// Exportar para uso no Electron
module.exports = { app, startServer };

// Iniciar servidor se executado diretamente
if (require.main === module) {
  startServer();
}