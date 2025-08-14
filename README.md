# 🏢 ERP-RH - Sistema de Gestão de Recursos Humanos

<div align="center">
  <img src="https://img.shields.io/badge/Version-28.3.3-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Windows-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-Latest-47848f.svg" alt="Electron">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</div>

## 📋 Sobre o Projeto

O **ERP-RH** é um sistema completo de gestão de recursos humanos desenvolvido com tecnologias modernas. O sistema oferece uma solução integrada para gerenciamento de funcionários, folha de pagamento, controle de ponto e muito mais.

### ✨ Características Principais

- 🎯 **Interface Moderna**: Design intuitivo e responsivo
- ⚡ **Performance**: Aplicação desktop otimizada com Electron
- 🔒 **Segurança**: Controle de acesso e criptografia de dados
- 📊 **Relatórios**: Dashboards e relatórios detalhados
- 🔄 **Integração**: APIs para integração com outros sistemas

## 🚀 Funcionalidades

### 👥 Gestão de Funcionários
- Cadastro completo de colaboradores
- Controle de cargos e departamentos
- Histórico profissional
- Documentos digitais

### 💰 Folha de Pagamento
- Cálculo automático de salários
- Descontos e benefícios
- Impostos e contribuições
- Relatórios fiscais

### ⏰ Controle de Ponto
- Registro de entrada/saída
- Controle de horas extras
- Banco de horas
- Relatórios de frequência

### 📈 Relatórios e Analytics
- Dashboard executivo
- Relatórios personalizáveis
- Métricas de RH
- Exportação em múltiplos formatos

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5/CSS3**: Interface moderna e responsiva
- **JavaScript**: Lógica de negócio no cliente
- **Electron**: Framework para aplicações desktop

### Backend
- **Node.js**: Runtime JavaScript no servidor
- **Express.js**: Framework web minimalista
- **SQLite/PostgreSQL**: Banco de dados

### Ferramentas de Desenvolvimento
- **Git**: Controle de versão
- **npm**: Gerenciador de pacotes
- **Electron Builder**: Empacotamento da aplicação

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Git

### Instalação do Código Fonte

```bash
# Clone o repositório
git clone https://github.com/ailtondba/ERP-RH.git

# Entre no diretório
cd ERP-RH

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Para build de produção
npm run build
```



## 🎮 Como Usar

1. **Primeira Execução**
   - Execute o arquivo `ERP-RH.exe`
   - Configure o banco de dados inicial
   - Crie o usuário administrador

2. **Login no Sistema**
   - Use as credenciais criadas na configuração
   - Acesse o dashboard principal

3. **Configuração Inicial**
   - Configure sua empresa
   - Cadastre departamentos e cargos
   - Importe funcionários (se necessário)

## 📁 Estrutura do Projeto

```
ERP-RH/
├── frontend/           # Interface do usuário
│   ├── css/           # Estilos
│   ├── js/            # Scripts do cliente
│   └── pages/         # Páginas HTML
├── backend/           # Servidor Node.js
│   ├── controllers/   # Controladores
│   ├── models/        # Modelos de dados
│   ├── routes/        # Rotas da API
│   └── utils/         # Utilitários
├── scripts/           # Scripts de build
├── uploads/           # Arquivos enviados
├── dist/              # Build de produção
└── dist-packager-new/ # Executável empacotado
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia em modo desenvolvimento
npm run start        # Inicia a aplicação
npm run build        # Build de produção
npm run package      # Empacota para distribuição
npm run test         # Executa testes
```

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Criado por ailtondba**
- GitHub: [@ailtondba](https://github.com/ailtondba)
- Email: ailtonazure@gmail.com

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas:

- 🐛 [Reporte um bug](https://github.com/ailtondba/ERP-RH/issues)
- 💡 [Solicite uma feature](https://github.com/ailtondba/ERP-RH/issues)
- 📧 Entre em contato: ailtonazure@gmail.com

## 🎯 Roadmap

- [ ] Módulo de Recrutamento e Seleção
- [ ] Integração com APIs de bancos
- [ ] App mobile para funcionários
- [ ] Módulo de Treinamentos
- [ ] Dashboard em tempo real
- [ ] Integração com sistemas de ponto biométrico

---

<div align="center">
  <p>Feito com ❤️ por <a href="https://github.com/ailtondba">Ailton DBA</a></p>
  <p>⭐ Se este projeto te ajudou, considere dar uma estrela!</p>
</div>