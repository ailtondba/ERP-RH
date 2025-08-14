# Documentação: Criação do Executável Portátil ERP-RH

## Visão Geral
Este documento explica o processo completo para criar um executável portátil (.exe) que integra o backend Node.js/Express e o frontend React em uma única aplicação Electron.

## Estrutura do Projeto
```
C:\ERP\
├── backend/           # Servidor Node.js/Express + SQLite
├── frontend/          # Aplicação React
├── main.js           # Processo principal do Electron
├── package.json      # Configurações do Electron e scripts
└── dist-packager-new/ # Executável gerado
```

## Passo a Passo para Criação do Executável

### 1. Configuração do Backend (Node.js/Express)

**Localização:** `C:\ERP\backend\server.js`

```javascript
// Configuração para servir tanto API quanto arquivos estáticos
const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Rotas da API
app.use('/api', routes);

// Rota catch-all para SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
```

### 2. Build do Frontend React

**Comando executado:**
```bash
cd C:\ERP\frontend
npm run build
```

**Resultado:** Gera a pasta `frontend/build/` com arquivos estáticos otimizados.

### 3. Configuração do Electron (main.js)

**Localização:** `C:\ERP\main.js`

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    // Inicia o servidor backend
    serverProcess = spawn('node', [path.join(__dirname, 'backend/server.js')], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    // Aguarda o servidor iniciar
    setTimeout(() => resolve(), 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'negocios.ico')
  });
  
  // Carrega a aplicação na porta 5000
  mainWindow.loadURL('http://localhost:5000');
}

app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (error) {
    console.error('Erro ao iniciar:', error);
  }
});
```

### 4. Configuração do package.json Principal

**Localização:** `C:\ERP\package.json`

```json
{
  "name": "erp-rh",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "pack": "electron-packager . ERP-RH --platform=win32 --arch=x64 --out=dist-packager-new --overwrite"
  },
  "devDependencies": {
    "electron": "^latest",
    "electron-packager": "^latest"
  }
}
```

### 5. Instalação das Dependências

```bash
# No diretório raiz (C:\ERP)
npm install

# No backend
cd backend
npm install

# No frontend
cd ../frontend
npm install
npm run build
```

### 6. Geração do Executável

**Comando principal:**
```bash
cd C:\ERP
npm run pack
```

**O que acontece:**
1. O `electron-packager` cria uma versão empacotada da aplicação
2. Inclui o runtime do Node.js e Chromium
3. Empacota todos os arquivos do projeto
4. Gera o executável `ERP-RH.exe`

**Resultado:** `C:\ERP\dist-packager-new\ERP-RH-win32-x64\ERP-RH.exe`

### 7. Estrutura do Executável Gerado

```
dist-packager-new\ERP-RH-win32-x64\
├── ERP-RH.exe              # Executável principal
├── resources\              # Código da aplicação empacotado
│   └── app\               # Seu código (main.js, backend/, frontend/)
├── node_modules\          # Dependências do Node.js
├── *.dll                  # Bibliotecas do Chromium/Electron
└── locales\              # Arquivos de localização
```

## Como Funciona o Executável

### Fluxo de Execução:
1. **Início:** `ERP-RH.exe` é executado
2. **Electron:** Inicia o processo principal (`main.js`)
3. **Backend:** Spawna processo Node.js para `backend/server.js`
4. **Servidor:** Express serve API (porta 5000) + arquivos estáticos do React
5. **Frontend:** Electron carrega `http://localhost:5000`
6. **Interface:** Usuário interage com a aplicação React
7. **Comunicação:** Frontend faz requisições para `/api/*`

### Vantagens desta Arquitetura:
- ✅ **Portátil:** Não requer instalação separada do Node.js
- ✅ **Integrado:** Backend e frontend em um único executável
- ✅ **Offline:** Funciona sem conexão com internet
- ✅ **Nativo:** Interface desktop com Electron
- ✅ **Banco Local:** SQLite embarcado

## Comandos de Teste

### Desenvolvimento:
```bash
cd C:\ERP
npm start  # Testa em modo desenvolvimento
```

### Produção:
```bash
cd C:\ERP\dist-packager-new\ERP-RH-win32-x64
.\ERP-RH.exe  # Executa o aplicativo empacotado
```

## Troubleshooting

### Problemas Comuns:
1. **Porta em uso:** O aplicativo verifica se a porta 5000 está disponível
2. **Dependências:** Certifique-se de que todas as dependências estão instaladas
3. **Build do React:** Execute `npm run build` no frontend antes de empacotar
4. **Permissões:** Execute como administrador se necessário

### Logs de Debug:
- Verifique o console do Electron para erros
- Logs do backend aparecem no terminal
- Use DevTools do Chromium para debug do frontend

## Conclusão

O executável `ERP-RH.exe` é uma aplicação desktop completa que:
- Integra backend Node.js/Express com frontend React
- Usa SQLite como banco de dados local
- Funciona de forma totalmente offline
- Pode ser distribuído como um único arquivo executável

Esta abordagem permite criar aplicações desktop robustas usando tecnologias web modernas.