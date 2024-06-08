const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*', // Vous pouvez remplacer '*' par l'origine spécifique que vous souhaitez autoriser, comme 'http://localhost:3000'
    methods: ['GET', 'POST']
  }
});
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cors = require('cors');
const { sequelize, Admin, Message, DateModel } = require('./database'); // Importer Sequelize et les modèles

app.use(cors());

// Middleware pour traiter les données JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));

// Gestion des connexions socket
io.on('connection', (socket) => {
  
  // Réception d'un nouveau message
  socket.on('nouveauMessage', async (data) => {
    try {
      const { name, email, phone, message } = data;
      await Message.create({ name, email, phone, content: message });
      socket.emit('nouveauMessage', { success: true });
    } catch (err) {
      console.error(err.message);
      socket.emit('nouveauMessage', { success: false });
    }
  });

  // Réception d'une demande de connexion
  socket.on('connexionAdmin', async (data) => {
    try {
      const { username, password } = data;
      const admin = await Admin.findOne({ where: { username } });
      if (admin && await bcrypt.compare(password, admin.password)) {
        console.log('Un utilisateur est connecté');
        socket.emit('connexionReussie');
      } else {
        socket.emit('erreurConnexion');
      }
    } catch (err) {
      socket.emit('erreurConnexion');
    }
  });

  // Réception d'une demande d'ajout de date
  socket.on('nouvelleLivraison', async (data) => {
    try {
      const { date, destination, prix } = data;
      await DateModel.create({ date, destination, prix });
      socket.emit('dateAjoutee');
    } catch (err) {
      console.error(err.message);
      socket.emit('erreurAjoutDate');
    }
  });

  // Réception d'une demande de suppression de date
  socket.on('suppressionDate', async (id) => {
    try {
      await DateModel.destroy({ where: { id } });
      socket.emit('dateSupprimee');
    } catch (err) {
      console.error(err.message);
      socket.emit('erreurSuppressionDate');
    }
  });

  // Envoi de toutes les dates présentes dans la base de données
  socket.on('obtenirDates', async () => {
    try {
      const dates = await DateModel.findAll();
      socket.emit('toutesDates', dates);
    } catch (err) {
      console.error(err.message);
    }
  });

  // Envoi de tous les messages
  socket.on('getMessages', async () => {
    try {
      const messages = await Message.findAll();
      socket.emit('getMessages', messages);
    } catch (err) {
      console.error(err.message);
    }
  });

  // Marquer un message comme lu
  socket.on('marquerLu', async (id) => {
    try {
      await Message.update({ read: true }, { where: { id } });
      socket.emit('marquerLu', id);
    } catch (err) {
      console.error(err.message);
    }
  });

  // Gestion de la déconnexion de l'utilisateur
  socket.on('logout', () => {
    socket.emit('logoutSuccess');
    console.log('Utilisateur déconnecté: ', socket.id);
  });

  // Réception d'une demande de messages filtrés
  socket.on('filterMessages', async (filter) => {
    try {
      let where = {};
      if (filter === 'read') {
        where.read = true;
      } else if (filter === 'unread') {
        where.read = false;
      }
      const messages = await Message.findAll({ where });
      socket.emit('getMessages', messages);
    } catch (err) {
      console.error(err.message);
    }
  });

  // Gestion de la déconnexion de socket
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté: ', socket.id);
  });
});

// Créer un admin par défaut (à utiliser uniquement pour initialiser la base de données)
const createDefaultAdmin = async () => {
  const username = 'admin@admin.com';
  const password = 'password';
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    await Admin.create({ username, password: hashedPassword });
    console.log('Admin créé');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.log('Admin déjà créé');
    } else {
      console.log('ICI');
      console.error(err.message);
    }
  }
};

// Synchroniser la base de données et démarrer le serveur
sequelize.sync().then(async () => {
  console.log('Database & tables created!');
  await createDefaultAdmin();

  server.listen(8080, () => {
    console.log('Le serveur écoute sur le port 8080');
  });
});
