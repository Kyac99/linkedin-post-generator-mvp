// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const LinkedInService = require('../services/LinkedInService');
const AIService = require('../services/AIService');

// Initialiser les services
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
      expiresIn: tokenData.expires_in
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
      res.json({ valid: true, message: 'Clé API valide' });
    } else {
      res.status(401).json({ valid: false, message: 'Clé API invalide ou expirée' });
    }
  } catch (error) {
    console.error('Erreur vérification clé API:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de la clé API' });
  }
});

module.exports = router;
