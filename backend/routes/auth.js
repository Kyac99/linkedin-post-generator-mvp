// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const querystring = require('querystring');

// Routes pour l'authentification LinkedIn
router.get('/linkedin/url', (req, res) => {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return res.status(500).json({ 
        message: 'Configuration LinkedIn manquante sur le serveur. Veuillez contacter l\'administrateur.' 
      });
    }
    
    // Définir les paramètres pour l'URL d'authentification
    const params = {
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: 'random_state_string',
      scope: 'r_liteprofile r_emailaddress w_member_social'
    };
    
    // Construire l'URL d'authentification
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${querystring.stringify(params)}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Erreur génération URL LinkedIn:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Route pour échanger le code d'autorisation contre un token
router.post('/linkedin/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Code d\'autorisation manquant' });
    }
    
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({ 
        message: 'Configuration LinkedIn manquante sur le serveur. Veuillez contacter l\'administrateur.' 
      });
    }
    
    // Paramètres pour l'échange du code
    const params = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    };
    
    // Faire la requête à LinkedIn
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      querystring.stringify(params),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, expires_in } = response.data;
    
    res.json({
      accessToken: access_token,
      expiresIn: expires_in
    });
  } catch (error) {
    console.error('Erreur échange token LinkedIn:', error);
    
    if (error.response) {
      console.error('LinkedIn API response error:', error.response.data);
    }
    
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Vérifier la configuration des API IA
router.get('/api-config', (req, res) => {
  try {
    const defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'claude';
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    // Vérifier simplement si les clés sont configurées
    // La validité réelle des clés sera vérifiée par le service AI
    const apiConfig = {
      defaultProvider,
      claudeConfigured: !!claudeApiKey,
      claudeValid: !!claudeApiKey, // Pour simplifier, on suppose que si elle est configurée, elle est valide
      openaiConfigured: !!openaiApiKey,
      openaiValid: !!openaiApiKey // Pour simplifier, on suppose que si elle est configurée, elle est valide
    };
    
    res.json(apiConfig);
  } catch (error) {
    console.error('Erreur vérification config API:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

module.exports = router;