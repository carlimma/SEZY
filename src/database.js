// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sezydb', 'sezydb_user', 'SvfXGPdXPK46HzmjGnIixilCFbn49abE', {
  host: 'dpg-cphrd2ect0pc73fihjbg-a',
  dialect: 'postgres',
  port: 5432, // Par défaut pour PostgreSQL
});

module.exports = sequelize;
