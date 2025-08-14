'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const { sequelize } = require('../config/database');
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      // Importar e inicializar o modelo
      const modelDefiner = require(path.join(__dirname, file));
      
      // Verificar se é uma função (padrão sequelize-cli) ou um modelo já definido
        let model;
        
        // Verificar se é um modelo Sequelize já definido
        if (modelDefiner && modelDefiner.sequelize && modelDefiner.tableName) {
          // Modelo já definido (como User, Endereco, Ferias)
          model = modelDefiner;
        } else if (typeof modelDefiner === 'function') {
          // É uma função de definição de modelo (como Servidor)
          if (modelDefiner.length === 1) {
            // Função que recebe apenas sequelize
            model = modelDefiner(sequelize);
          } else {
            // Função que recebe sequelize e DataTypes (padrão sequelize-cli)
            model = modelDefiner(sequelize, Sequelize.DataTypes);
          }
        } else {
          // Pular se não for um modelo válido
          console.log(`Pulando arquivo ${file} - não é um modelo válido`);
          return;
        }
      
      db[model.name] = model;
    } catch (error) {
      console.error(`Erro ao carregar modelo do arquivo ${file}:`, error.message);
      // Continuar com outros modelos
    }
  });

// Definir associações
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// As associações serão definidas pelos próprios modelos se necessário
// Removidas as associações manuais para evitar conflitos com campos existentes

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;