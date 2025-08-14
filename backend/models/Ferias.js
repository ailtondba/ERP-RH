const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ferias = sequelize.define('Ferias', {
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
  data_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  data_fim: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dias: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ano_referencia: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'programadas'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'ferias',
  timestamps: true,
  underscored: true
});

module.exports = Ferias;