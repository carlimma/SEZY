const { DataTypes } = require('sequelize');
// Créer une instance Sequelize
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sezydb', 'sezydb_user', 'SvfXGPdXPK46HzmjGnIixilCFbn49abE', {
  host: 'dpg-cphrd2ect0pc73fihjbg-a',
    dialect: 'postgres',
    port: 5432, // Par défaut pour PostgreSQL
  });
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
