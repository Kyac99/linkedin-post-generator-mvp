// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement en premier
dotenv.config();

// Importer les routes après avoir chargé les variables d'environnement
const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
const linkedinRoutes = require('./routes/linkedin');
const diagnosticRoutes = require('./routes/diagnostic');

// Vérifier que les variables d'environnement critiques sont définies
console.log('Configuration de l\'environnement:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'non défini (utilise développement par défaut)');
console.log('- PORT:', process.env.PORT || '5000 (valeur par défaut)');
console.log('- LINKEDIN_CLIENT_ID:', process.env.LINKEDIN_CLIENT_ID ? 'défini' : 'non défini (IMPORTANT!)');
console.log('- LINKEDIN_CLIENT_SECRET:', process.env.LINKEDIN_CLIENT_SECRET ? 'défini' : 'non défini (IMPORTANT!)');
console.log('- LINKEDIN_REDIRECT_URI:', process.env.LINKEDIN_REDIRECT_URI || 'non défini (IMPORTANT!)');
console.log('- DEBUG_LEVEL:', process.env.DEBUG_LEVEL || 'non défini (utilise none par défaut)');

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://www.linkedin.com'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de journalisation des requêtes pour le débogage
if (process.env.DEBUG_LEVEL && process.env.DEBUG_LEVEL !== 'none') {
  app.use((req, res, next) => {
    const now = new Date().toISOString();
    console.log(`[${now}] ${req.method} ${req.url}`);
    if (process.env.DEBUG_LEVEL === 'verbose') {
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
      }
    }
    next();
  });
}

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/linkedin', linkedinRoutes);
app.use('/api/diagnostic', diagnosticRoutes);

// Route de diagnostic pour vérifier que le serveur fonctionne correctement
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Le serveur fonctionne correctement',
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

// Servir l'application React en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  console.error('Stack trace:', err.stack);
  
  // Fournir plus de détails en mode développement
  res.status(500).json({
    message: 'Une erreur est survenue sur le serveur',
    error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`URL du serveur: http://localhost:${PORT}`);
  console.log(`Routes de diagnostic: http://localhost:${PORT}/api/diagnostic`);
  console.log(`Vérification de l'état: http://localhost:${PORT}/api/health`);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('Erreur non capturée:', err);
  console.error(err.stack);
  process.exit(1);
});

// Gestion des rejets de promesses non gérés
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejet de promesse non géré:', reason);
  // Ne pas quitter le processus, juste logger l'erreur
});
