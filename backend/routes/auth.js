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

// Vérifier la validité d'une clé API IA (Claude/OpenAI)
router.post('/verify-ai-key', async (req, res) => {
  try {
    console.log('Traitement de la demande de vérification de clé API');
    
    const { apiKey, keyType } = req.body;
    
    if (!apiKey) {
      console.error('Aucune clé API fournie dans la requête');
      return res.status(400).json({ 
        message: 'Clé API manquante',
        valid: false,
        code: 'API_KEY_MISSING'
      });
    }
    
    if (!['claude', 'openai'].includes(keyType)) {
      console.error('Type de clé API non valide:', keyType);
      return res.status(400).json({ 
        message: 'Type de clé API non valide. Valeurs acceptées: claude, openai',
        valid: false,
        code: 'INVALID_API_TYPE'
      });
    }

    // Vérification rapide du format de la clé API
    let formatWarning = null;
    if (keyType === 'claude' && !apiKey.startsWith('sk-ant-')) {
      formatWarning = 'Le format de la clé ne correspond pas au format standard Claude (sk-ant-...)';
      console.warn(formatWarning);
    } else if (keyType === 'openai' && !apiKey.startsWith('sk-')) {
      formatWarning = 'Le format de la clé ne correspond pas au format standard OpenAI (sk-...)';
      console.warn(formatWarning);
    }
    
    // Journaliser de manière sécuritaire
    const firstChars = apiKey.substring(0, 5);
    const lastChars = apiKey.substring(apiKey.length - 3);
    console.log(`Vérification de la clé API ${keyType}: ${firstChars}...${lastChars} (longueur: ${apiKey.length})`);
    
    // Initialiser le service AI avec la clé fournie
    const aiService = new AIService(apiKey, keyType);
    
    // Mesurer le temps de vérification
    const startTime = Date.now();
    
    // Vérifier la validité de la clé
    const isValid = await aiService.verifyApiKey();
    
    const duration = Date.now() - startTime;
    console.log(`Vérification terminée en ${duration}ms, résultat: ${isValid ? 'valide' : 'invalide'}`);
    
    if (isValid) {
      res.json({ 
        valid: true, 
        message: 'Clé API valide',
        provider: keyType,
        formatWarning: formatWarning
      });
    } else {
      res.status(401).json({ 
        valid: false, 
        message: 'Clé API invalide ou expirée',
        provider: keyType,
        formatWarning: formatWarning
      });
    }
  } catch (error) {
    console.error('Erreur vérification clé API:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de la clé API',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      valid: false,
      code: 'VERIFICATION_ERROR'
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