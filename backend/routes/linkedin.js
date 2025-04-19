// backend/routes/linkedin.js
const express = require('express');
const router = express.Router();
const LinkedInService = require('../services/LinkedInService');

// Initialiser le service LinkedIn
const linkedInService = new LinkedInService();

// Middleware pour vérifier le token LinkedIn
const validateLinkedInToken = (req, res, next) => {
  const { linkedintoken } = req.headers;
  
  if (!linkedintoken) {
    return res.status(401).json({ message: 'Token LinkedIn manquant' });
  }
  
  req.linkedinToken = linkedintoken;
  next();
};

// Route pour obtenir l'URL d'authentification LinkedIn
router.get('/auth-url', (req, res) => {
  try {
    console.log("Génération de l'URL d'authentification LinkedIn...");
    console.log("LINKEDIN_CLIENT_ID:", process.env.LINKEDIN_CLIENT_ID ? "Défini" : "Non défini");
    console.log("LINKEDIN_REDIRECT_URI:", process.env.LINKEDIN_REDIRECT_URI);
    
    const authUrl = linkedInService.getAuthUrl();
    console.log("URL générée:", authUrl);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Erreur génération URL d\'authentification:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Route pour échanger le code d'autorisation contre un token
router.post('/exchange-code', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Code d\'autorisation manquant' });
    }
    
    console.log("Échange du code contre un token d'accès...");
    console.log("Code reçu:", code.substring(0, 10) + "...");
    console.log("LINKEDIN_REDIRECT_URI:", process.env.LINKEDIN_REDIRECT_URI);
    
    try {
      const tokenData = await linkedInService.getAccessToken(code);
      
      console.log("Token obtenu avec succès");
      
      res.json({
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        refreshToken: tokenData.refresh_token || null,
        success: true
      });
    } catch (tokenError) {
      console.error('Erreur lors de l\'échange du code:', tokenError);
      
      if (tokenError.response) {
        console.error('Détails de la réponse:', JSON.stringify({
          status: tokenError.response.status,
          data: tokenError.response.data
        }, null, 2));
      }
      
      res.status(500).json({ 
        message: `Erreur lors de l'échange du code: ${tokenError.message}`,
        details: process.env.NODE_ENV === 'development' ? tokenError.stack : undefined,
        success: false
      });
    }
  } catch (error) {
    console.error('Erreur échange code d\'autorisation:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      success: false
    });
  }
});

// Publier un post sur LinkedIn
router.post('/publish', validateLinkedInToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Contenu du post manquant' });
    }
    
    // Vérifier d'abord si le token est valide
    const isTokenValid = await linkedInService.verifyAccessToken(req.linkedinToken);
    
    if (!isTokenValid) {
      return res.status(401).json({ message: 'Token LinkedIn invalide ou expiré' });
    }
    
    // Publier le post
    const result = await linkedInService.publishPost(req.linkedinToken, content);
    
    res.json({
      success: true,
      message: 'Post publié avec succès',
      postData: result
    });
  } catch (error) {
    console.error('Erreur publication LinkedIn:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Publier un post avec un lien sur LinkedIn
router.post('/publish-with-link', validateLinkedInToken, async (req, res) => {
  try {
    const { content, linkUrl, linkTitle, linkDescription } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Contenu du post manquant' });
    }
    
    if (!linkUrl) {
      return res.status(400).json({ message: 'URL du lien manquant' });
    }
    
    // Vérifier d'abord si le token est valide
    const isTokenValid = await linkedInService.verifyAccessToken(req.linkedinToken);
    
    if (!isTokenValid) {
      return res.status(401).json({ message: 'Token LinkedIn invalide ou expiré' });
    }
    
    // Publier le post avec lien
    const result = await linkedInService.publishPostWithLink(
      req.linkedinToken, 
      content, 
      linkUrl, 
      linkTitle, 
      linkDescription
    );
    
    res.json({
      success: true,
      message: 'Post avec lien publié avec succès',
      postData: result
    });
  } catch (error) {
    console.error('Erreur publication LinkedIn avec lien:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtenir les informations du profil LinkedIn de l'utilisateur
router.get('/profile', validateLinkedInToken, async (req, res) => {
  try {
    // Récupérer les informations du profil
    const profile = await linkedInService.getUserProfile(req.linkedinToken);
    
    // Essayer de récupérer l'email si possible
    let email = null;
    try {
      email = await linkedInService.getUserEmail(req.linkedinToken);
    } catch (emailError) {
      console.warn('Impossible de récupérer l\'email:', emailError.message);
    }
    
    res.json({ 
      profile,
      email
    });
  } catch (error) {
    console.error('Erreur récupération profil LinkedIn:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Vérifier la validité du token LinkedIn
router.get('/verify-token', validateLinkedInToken, async (req, res) => {
  try {
    const isValid = await linkedInService.verifyAccessToken(req.linkedinToken);
    
    if (isValid) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, message: 'Token LinkedIn invalide ou expiré' });
    }
  } catch (error) {
    console.error('Erreur vérification token LinkedIn:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Rafraîchir un token d'accès expiré
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token manquant' });
    }
    
    const tokenData = await linkedInService.refreshAccessToken(refreshToken);
    
    res.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token || refreshToken
    });
  } catch (error) {
    console.error('Erreur rafraîchissement token:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

module.exports = router;