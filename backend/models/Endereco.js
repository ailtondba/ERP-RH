const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Endereco = sequelize.define('Endereco', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  servidor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servidores',
      key: 'id'
    }
  },
  cep: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  logradouro: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numero: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  complemento: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  pais: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Brasil'
  }
}, {
  tableName: 'enderecos',
  timestamps: true,
  underscored: true
});

module.exports = Endereco;