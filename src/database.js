// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sezydb', 'sezydb_user', 'SvfXGPdXPK46HzmjGnIixilCFbn49abE', {
  host: 'dpg-cphrd2ect0pc73fihjbg-a',
  dialect: 'postgres',
  port: 5432, // Par défaut pour PostgreSQL
});

const Admin = require('./models/Admin');
const Message = require('./models/Message');
const DateModel = require('./models/Date');

module.exports = {
  sequelize,
  Admin,
  Message,
  DateModel,
};
