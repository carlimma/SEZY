const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const DateModel = sequelize.define('Date', {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prix: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

module.exports = DateModel;
