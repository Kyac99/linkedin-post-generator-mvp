// backend/routes/linkedin.js
const express = require('express');
const router = express.Router();
const LinkedInService = require('../services/LinkedInService');

// Initialiser le service LinkedIn
const linkedInService = new LinkedInService();

// Middleware pour vérifier le token LinkedIn
const validateLinkedInToken = (req, res, next) => {
  const { linkedinToken } = req.headers;
  
  if (!linkedinToken) {
    return res.status(401).json({ message: 'Token LinkedIn manquant' });
  }
  
  req.linkedinToken = linkedinToken;
  next();
};

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
      postId: result.id
    });
  } catch (error) {
    console.error('Erreur publication LinkedIn:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Obtenir les informations du profil LinkedIn de l'utilisateur
router.get('/profile', validateLinkedInToken, async (req, res) => {
  try {
    // Récupérer les informations du profil
    const profile = await linkedInService.getUserProfile(req.linkedinToken);
    
    res.json({ profile });
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

module.exports = router;
