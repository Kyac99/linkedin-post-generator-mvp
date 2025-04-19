// backend/routes/diagnostic.js
const express = require('express');
const router = express.Router();
const os = require('os');

// Route pour obtenir des informations de diagnostic
router.get('/', (req, res) => {
  try {
    // Vérification des variables d'environnement critiques
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'non défini',
      PORT: process.env.PORT || 'non défini',
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ? 'défini' : 'non défini',
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'défini' : 'non défini',
      LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'non défini',
      DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER || 'non défini',
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? 'défini' : 'non défini',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'défini' : 'non défini',
      DEBUG_LEVEL: process.env.DEBUG_LEVEL || 'non défini'
    };

    // Informations système
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: Math.floor(os.uptime() / 60) + ' minutes',
      memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      cpus: os.cpus().length + ' cores'
    };

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      system: systemInfo,
      linkedInRedirectUri: {
        configured: process.env.LINKEDIN_REDIRECT_URI,
        expected: 'http://localhost:3000/login'
      }
    });
  } catch (error) {
    console.error('Erreur lors du diagnostic:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erreur lors de la génération du diagnostic',
      error: error.message
    });
  }
});

// Route pour tester la connectivité LinkedIn
router.get('/linkedin-test', async (req, res) => {
  try {
    // Test de base de connectivité avec LinkedIn
    const response = await fetch('https://api.linkedin.com/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token', // Token invalide pour tester la connectivité
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'ok',
      canConnectToLinkedIn: true,
      linkedInResponse: {
        status: response.status,
        statusText: response.statusText
      },
      message: "La connectivité avec LinkedIn fonctionne correctement. Une erreur 401 est attendue car nous avons utilisé un token de test."
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      canConnectToLinkedIn: false,
      message: "Impossible de se connecter à LinkedIn.",
      error: error.message
    });
  }
});

module.exports = router;
