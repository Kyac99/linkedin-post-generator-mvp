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
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Code d\'autorisation manquant' });
    }
    
    const tokenData = await linkedInService.getAccessToken(code);
    
    // Vérifier que nous avons bien reçu un token
    if (!tokenData.access_token) {
      throw new Error('Token d\'accès manquant dans la réponse');
    }
    
    res.json({ 
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token || null
    });
  } catch (error) {
    console.error('Erreur callback LinkedIn:', error);
    res.status(500).json({ message: 'Erreur lors de l\'authentification LinkedIn' });
  }
});

// Vérifier la validité d'une clé API IA (Claude/OpenAI)
router.post('/verify-ai-key', async (req, res) => {
  try {
    const { apiKey, keyType } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ message: 'Clé API manquante' });
    }
    
    if (!['claude', 'openai'].includes(keyType)) {
      return res.status(400).json({ message: 'Type de clé API non valide' });
    }
    
    // Initialiser le service AI avec la clé fournie
    const aiService = new AIService(apiKey, keyType);
    
    // Vérifier la validité de la clé
    const isValid = await aiService.verifyApiKey();
    
    if (isValid) {
      res.json({ 
        valid: true, 
        message: 'Clé API valide',
        provider: keyType
      });
    } else {
      res.status(401).json({ 
        valid: false, 
        message: 'Clé API invalide ou expirée' 
      });
    }
  } catch (error) {
    console.error('Erreur vérification clé API:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de la clé API',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer les informations sur la configuration
router.get('/config', (req, res) => {
  try {
    res.json({
      defaultAIProvider: process.env.DEFAULT_AI_PROVIDER || 'claude',
      linkedinConfigured: !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET,
      claudeConfigured: !!process.env.CLAUDE_API_KEY,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      env: process.env.NODE_ENV,
      version: '1.0.0-MVP'
    });
  } catch (error) {
    console.error('Erreur récupération config:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la configuration' });
  }
});

// Définir la clé API par défaut (pour les administrateurs)
router.post('/set-default-ai-key', async (req, res) => {
  // Dans un MVP, cette fonctionnalité pourrait nécessiter une authentification admin
  // Pour l'instant, on retourne juste un message indiquant que cette fonction sera disponible dans une version future
  res.status(403).json({
    message: 'Cette fonctionnalité sera disponible dans une version future',
    success: false
  });
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
