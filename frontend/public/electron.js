const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Cria a janela do navegador.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Carrega a URL do app React em desenvolvimento ou o build em produção.
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  win.loadURL(startUrl);

  // Opcional: Abre o DevTools (ferramentas de desenvolvedor).
  // win.webContents.openDevTools();
}

// Este método será chamado quando o Electron tiver finalizado
// a inicialização e estiver pronto para criar janelas do navegador.
app.whenReady().then(createWindow);

// Encerra quando todas as janelas forem fechadas, exceto no macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // No macOS, é comum recriar uma janela no aplicativo quando o
  // ícone do dock é clicado e não há outras janelas abertas.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

