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
const db = require('./database');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cors = require('cors');
app.use(cors());

// Middleware pour traiter les données JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));

// Gestion des connexions socket
io.on('connection', (socket) => {
  
  // Réception d'un nouveau message
  socket.on('nouveauMessage', (data) => {
    const { name, email, phone, message } = data;
    const stmt = db.prepare('INSERT INTO messages (name, email, phone, content) VALUES (?, ?, ?, ?)');
    stmt.run(name, email, phone, message, function (err) {
      if (err) {
        console.error(err.message);
        socket.emit('nouveauMessage', { "success": false });

      } else {
        socket.emit('nouveauMessage', { "success": true });

      }
    });
    stmt.finalize();
  });

  // Réception d'une demande de connexion
  socket.on('connexionAdmin', (data) => {
    const { username, password } = data;
    const stmt = db.prepare('SELECT * FROM admin WHERE username = ?');
    stmt.get(username, (err, row) => {
      if (err || !row) {
        socket.emit('erreurConnexion');
      } else {
        bcrypt.compare(password, row.password, (err, result) => {
          if (result) {
            console.log('Un utilisateur est connecté');
            socket.emit('connexionReussie');
          } else {
            socket.emit('erreurConnexion');
          }
        });
      }
    });
    stmt.finalize();
  });

  // Réception d'une demande d'ajout de date
  socket.on('nouvelleLivraison', (data) => {
    const { date, destination, prix } = data;
    const stmt = db.prepare('INSERT INTO dates (date, destination, prix) VALUES (?, ?, ?)');
    stmt.run(date, destination, prix, function (err) {
      if (err) {
        console.error(err.message);
        socket.emit('erreurAjoutDate');
      } else {
        socket.emit('dateAjoutee');
      }
    });
    stmt.finalize();
  });

  // Réception d'une demande de suppression de date
  socket.on('suppressionDate', (id) => {
    const stmt = db.prepare('DELETE FROM dates WHERE id = ?');
    stmt.run(id, function (err) {
      if (err) {
        console.error(err.message);
        socket.emit('erreurSuppressionDate');
      } else {
        socket.emit('dateSupprimee');
      }
    });
    stmt.finalize();
  });

  // Envoi de toutes les dates présentes dans la base de données
  socket.on('obtenirDates', () => {
    db.all('SELECT * FROM dates', (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        socket.emit('toutesDates', rows);
      }
    });
  });

  // Envoi de tous les messages
  socket.on('getMessages', () => {
    db.all('SELECT * FROM messages', (err, rows) => {
      if (err) {
        console.error(err.message);
      } else {
        socket.emit('getMessages', rows);
      }
    });
  });

  // Marquer un message comme lu
  socket.on('marquerLu', (id) => {
    const stmt = db.prepare('UPDATE messages SET read = 1 WHERE id = ?');
    stmt.run(id, function (err) {
      if (err) {
        console.error(err.message);
      } else {
        socket.emit('marquerLu', id);
      }
    });
    stmt.finalize();
  });

  socket.on('logout', () => {
    // Logique de déconnexion ici, par exemple :
    // - Invalider le token de session de l'utilisateur
    // - Supprimer la session utilisateur côté serveur
    // - Autres tâches de nettoyage nécessaires

    socket.emit('logoutSuccess');
    console.log('Utilisateur déconnecté: ', socket.id);

  });

  // Réception d'une demande de messages filtrés
  socket.on('filterMessages', (filter) => {
    let query = 'SELECT * FROM messages';
    if (filter === 'read') {
        query += ' WHERE read = 1';
    } else if (filter === 'unread') {
        query += ' WHERE read = 0';
    }
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error(err.message);
        } else {
            socket.emit('getMessages', rows);
        }
    });
});

  socket.on('disconnect', () => {
  });

});

// Créer un admin par défaut (à utiliser uniquement pour initialiser la base de données)
const createDefaultAdmin = async () => {
  const username = 'admin@admin.com';
  const password = 'password';
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const stmt = db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)');
  stmt.run(username, hashedPassword, function (err) {
    if (err && err.message.includes('UNIQUE constraint failed')) {
      console.log('Admin déjà créé');
    } else if (err) {
      console.error(err.message);
    } else {
      console.log('Admin créé');
    }
  });
  stmt.finalize();
};

createDefaultAdmin();




server.listen(8080, () => {
  console.log('Le serveur écoute sur le port 8080');
});
