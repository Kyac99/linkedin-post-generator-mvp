// backend/routes/generate.js
const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');

// Middleware pour extraire et vérifier la clé API
const validateAIKey = (req, res, next) => {
  const { aiApiKey, aiApiType } = req.headers;
  
  if (!aiApiKey) {
    return res.status(401).json({ message: 'Clé API IA manquante' });
  }
  
  if (!['claude', 'openai'].includes(aiApiType)) {
    req.aiApiType = 'claude'; // Valeur par défaut
  } else {
    req.aiApiType = aiApiType;
  }
  
  req.aiService = new AIService(aiApiKey, req.aiApiType);
  next();
};

// Appliquer le middleware à toutes les routes
router.use(validateAIKey);

// Route pour générer un post à partir d'un article
router.post('/article-to-post', async (req, res) => {
  try {
    const { article, inputType } = req.body;
    
    if (!article) {
      return res.status(400).json({ message: 'Article manquant' });
    }
    
    if (!['text', 'url'].includes(inputType)) {
      return res.status(400).json({ message: 'Type d\'input non valide' });
    }
    
    const generatedPost = await req.aiService.generatePostFromArticle(article, inputType);
    
    res.json({ generatedPost });
  } catch (error) {
    console.error('Erreur génération de post depuis article:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Route pour générer un post à partir d'une idée
router.post('/idea-to-post', async (req, res) => {
  try {
    const { idea } = req.body;
    
    if (!idea) {
      return res.status(400).json({ message: 'Idée manquante' });
    }
    
    const generatedPost = await req.aiService.generatePostFromIdea(idea);
    
    res.json({ generatedPost });
  } catch (error) {
    console.error('Erreur génération de post depuis idée:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Route pour générer un post à partir d'une vidéo YouTube
router.post('/youtube-to-post', async (req, res) => {
  try {
    const { videoUrl, transcription } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ message: 'URL de la vidéo manquante' });
    }
    
    // Vérifier si l'URL a un format YouTube valide
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*$/;
    if (!youtubeRegex.test(videoUrl)) {
      return res.status(400).json({ message: 'URL YouTube non valide' });
    }
    
    const generatedPost = await req.aiService.generatePostFromYouTube(videoUrl, transcription);
    
    res.json({ generatedPost });
  } catch (error) {
    console.error('Erreur génération de post depuis YouTube:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Route pour générer un post à partir d'un code Python
router.post('/python-to-post', async (req, res) => {
  try {
    const { pythonCode } = req.body;
    
    if (!pythonCode) {
      return res.status(400).json({ message: 'Code Python manquant' });
    }
    
    const generatedPost = await req.aiService.generatePostFromPythonCode(pythonCode);
    
    res.json({ generatedPost });
  } catch (error) {
    console.error('Erreur génération de post depuis code Python:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

module.exports = router;
