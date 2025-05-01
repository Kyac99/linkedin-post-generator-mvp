// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');
const LinkedInService = require('../services/LinkedInService');

// Initialiser le service LinkedIn
const linkedInService = new LinkedInService();

// Obtenir l'URL d'authentification LinkedIn
router.get('/linkedin/url', (req, res) => {
  try {
    const authUrl = linkedInService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Erreur URL auth LinkedIn:', error);
    res.status(500).json({ message: 'Erreur lors de la génération de l\'URL d\'authentification LinkedIn' });
  }
});

// Callback pour l'authentification LinkedIn
router.post('/linkedin/callback', async (req, res) => {
  const startTime = new Date().getTime();
  console.log(`[${new Date().toISOString()}] Début du traitement du callback LinkedIn`);
  
  try {
    const { code } = req.body;
    
    if (!code) {
      console.error('Code d\'autorisation manquant dans la requête');
      return res.status(400).json({ message: 'Code d\'autorisation manquant' });
    }
    
    console.log(`Traitement du code d'autorisation: ${code.substring(0, 10)}...`);
    console.log(`Utilisation de l'URI de redirection: ${process.env.LINKEDIN_REDIRECT_URI}`);
    
    try {
      // Traitement du token sans délai supplémentaire car déjà intégré dans le service
      const tokenData = await linkedInService.getAccessToken(code);
      
      const endTime = new Date().getTime();
      console.log(`Traitement terminé en ${endTime - startTime}ms`);
      
      // Vérifier que nous avons bien reçu un token
      if (!tokenData.access_token) {
        throw new Error('Token d\'accès manquant dans la réponse');
      }
      
      res.json({ 
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token || null,
        success: true
      });
    } catch (tokenError) {
      console.error('Erreur lors de l\'échange du code contre un token:', tokenError);
      
      if (tokenError.response) {
        console.error('Réponse d\'erreur:', JSON.stringify({
          status: tokenError.response.status,
          data: tokenError.response.data,
          headers: tokenError.response.headers
        }, null, 2));
      }
      
      res.status(500).json({ 
        message: 'Erreur lors de l\'authentification LinkedIn',
        error: tokenError.message,
        success: false
      });
    }
  } catch (error) {
    console.error('Erreur générale dans le callback LinkedIn:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'authentification LinkedIn',
      error: error.message,
      success: false
    });
  }
});

// Récupérer les informations sur la configuration de l'API IA
router.get('/api-config', async (req, res) => {
  try {
    // Créer le service AI pour vérifier les clés configurées
    const aiService = new AIService();
    
    // Vérifier la validité des clés API
    const apiStatus = await aiService.verifyApiKeys();
    
    res.json({
      defaultAIProvider: process.env.DEFAULT_AI_PROVIDER || 'claude',
      claudeConfigured: apiStatus.claude.configured,
      claudeValid: apiStatus.claude.valid,
      openaiConfigured: apiStatus.openai.configured,
      openaiValid: apiStatus.openai.valid,
      linkedinConfigured: !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET,
      env: process.env.NODE_ENV,
      version: '1.0.0-MVP'
    });
  } catch (error) {
    console.error('Erreur récupération config:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la configuration' });
  }
});

// Route pour vérifier si la session est toujours valide
router.get('/check-session', (req, res) => {
  try {
    // Dans ce MVP, on vérifie simplement si le serveur est en ligne
    // Dans une version complète, on vérifierait la validité des tokens stockés en base de données
    res.json({
      serverStatus: 'online',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Erreur vérification session:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de la session' });
  }
});

module.exports = router;