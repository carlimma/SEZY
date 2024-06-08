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
const { Client } = require('pg');
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

// Configuration de la base de données PostgreSQL
const db = new Client({
  user: 'adminsezy', // Remplacez par votre nom d'utilisateur PostgreSQL
  host: 'dpg-cpi6bn21hbls73bcu7j0-a', // Remplacez par votre hôte PostgreSQL
  database: 'sezydb_jui6', // Remplacez par le nom de votre base de données
  password: 'AHL4mIilb2gGMqdrAFXKcnQ4y9dxjELe', // Remplacez par votre mot de passe PostgreSQL
  port: 5432, // Par défaut, le port de PostgreSQL est 5432
});

db.connect();

// Fonction pour initialiser la base de données
const initializeDatabase = async () => {
  try {
    // Créer la table "admin" si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    // Créer la table "messages" si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE
      )
    `);

    // Créer la table "dates" si elle n'existe pas
    await db.query(`
      CREATE TABLE IF NOT EXISTS dates (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        destination VARCHAR(255) NOT NULL,
        prix DECIMAL NOT NULL
      )
    `);

    console.log('Tables créées ou existent déjà');
  } catch (err) {
    console.error('Erreur lors de la création des tables:', err.message);
  }
}; 

// Gestion des connexions socket
io.on('connection', (socket) => {
  
  // Réception d'un nouveau message
  socket.on('nouveauMessage', (data) => {
    const { name, email, phone, message } = data;
    const query = 'INSERT INTO messages (name, email, phone, content) VALUES ($1, $2, $3, $4)';
    db.query(query, [name, email, phone, message], (err, res) => {
      if (err) {
        console.error(err.message);
        socket.emit('nouveauMessage', { "success": false });
      } else {
        socket.emit('nouveauMessage', { "success": true });
      }
    });
  });

  // Réception d'une demande de connexion
  socket.on('connexionAdmin', (data) => {
    const { username, password } = data;
    const query = 'SELECT * FROM admin WHERE username = $1';
    db.query(query, [username], (err, result) => {
      if (err || result.rows.length === 0) {
        socket.emit('erreurConnexion');
      } else {
        const row = result.rows[0];
        bcrypt.compare(password, row.password, (err, res) => {
          if (res) {
            console.log('Un utilisateur est connecté');
            socket.emit('connexionReussie');
          } else {
            socket.emit('erreurConnexion');
          }
        });
      }
    });
  });

  // Réception d'une demande d'ajout de date
  socket.on('nouvelleLivraison', (data) => {
    const { date, destination, prix } = data;
    const query = 'INSERT INTO dates (date, destination, prix) VALUES ($1, $2, $3)';
    db.query(query, [date, destination, prix], (err, res) => {
      if (err) {
        console.error(err.message);
        socket.emit('erreurAjoutDate');
      } else {
        socket.emit('dateAjoutee');
      }
    });
  });

  // Réception d'une demande de suppression de date
  socket.on('suppressionDate', (id) => {
    const query = 'DELETE FROM dates WHERE id = $1';
    db.query(query, [id], (err, res) => {
      if (err) {
        console.error(err.message);
        socket.emit('erreurSuppressionDate');
      } else {
        socket.emit('dateSupprimee');
      }
    });
  });

  // Envoi de toutes les dates présentes dans la base de données
  socket.on('obtenirDates', () => {
    const query = 'SELECT * FROM dates';
    db.query(query, (err, result) => {
      if (err) {
        console.error(err.message);
      } else {
        socket.emit('toutesDates', result.rows);
      }
    });
  });

  // Envoi de tous les messages
  socket.on('getMessages', () => {
    const query = 'SELECT * FROM messages';
    db.query(query, (err, result) => {
      if (err) {
        console.error(err.message);
      } else {
        socket.emit('getMessages', result.rows);
      }
    });
  });

  // Marquer un message comme lu
  socket.on('marquerLu', (id) => {
    const query = 'UPDATE messages SET read = TRUE WHERE id = $1';
    db.query(query, [id], (err, res) => {
      if (err) {
        console.error(err.message);
      } else {
        socket.emit('marquerLu', id);
      }
    });
  });

  socket.on('logout', () => {
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
    
    db.query(query, (err, result) => {
        if (err) {
            console.error(err.message);
        } else {
            socket.emit('getMessages', result.rows);
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

  const query = 'INSERT INTO admin (username, password) VALUES ($1, $2) ON CONFLICT DO NOTHING';
  db.query(query, [username, hashedPassword], (err, res) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Admin créé');
    }
  });
};

// Initialiser la base de données et créer l'admin par défaut
const initializeApp = async () => {
  await initializeDatabase();
  await createDefaultAdmin();
};

initializeApp().then(() => {
  server.listen(8080, () => {
    console.log('Le serveur écoute sur le port 8080');
  });
}).catch((err) => {
  console.error('Erreur lors de l\'initialisation de l\'application:', err.message);
});