// db.js
const { Sequelize } = require('sequelize');

// Créer une instance Sequelize
const sequelize = new Sequelize('sezydb', 'sezydb_user', 'SvfXGPdXPK46HzmjGnIixilCFbn49abE', {
  host: 'dpg-cphrd2ect0pc73fihjbg-a',
  dialect: 'postgres',
  port: 5432, // Par défaut pour PostgreSQL
});

// Importer les modèles après avoir créé l'instance Sequelize
const Admin = require('./models/Admin');
const Message = require('./models/Message');
const DateModel = require('./models/Date');

// Définir les associations entre les modèles ici si nécessaire

// Exporter l'instance Sequelize et les modèles
module.exports = {
  sequelize,
  Admin,
  Message,
  DateModel,
};
