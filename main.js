const path = require('path');

// ===== A CORREÇÃO FINAL =====
// Adicionamos o dotenv aqui para garantir que ele carregue as variáveis de ambiente
// para todo o processo, antes de qualquer outra coisa ser executada.
// Especificamos o caminho para o .env dentro da pasta do backend.
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
// =============================

const { app, BrowserWindow } = require('electron');
const { startServer } = require('./backend/server.js');

let mainWindow;

async function createWindow() {
  try {
    console.log('Iniciando servidor backend no mesmo processo...');
    await startServer();
    console.log('Servidor backend iniciado com sucesso.');

    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      icon: path.join(__dirname, 'negocios.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false
      }
    });

    console.log('Carregando URL: http://localhost:5000');
    
    // Aguardar um pouco para garantir que o servidor esteja pronto
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5000');
    }, 3000);
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
  }
}

app.whenReady().then(createWindow).catch(error => {
  console.error('❌ Erro ao inicializar aplicação:', error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(error => {
      console.error('❌ Erro ao reativar aplicação:', error);
    });
  }
});