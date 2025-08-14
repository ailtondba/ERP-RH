const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Servidor = sequelize.define('Servidor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    cargo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cpf: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [11, 14] // CPF com ou sem formatação
      }
    },
    rg: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    data_admissao: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    data_nascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    setor: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo'),
      defaultValue: 'ativo'
    },

    foto: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Caminho para o arquivo da foto do servidor'
    },

  }, {
    tableName: 'servidores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Servidor;
};