// backend/routes/generate.js
const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');

// Middleware pour extraire et vérifier la clé API
const validateAIKey = (req, res, next) => {
  const { aiApiKey, aiApiType } = req.headers;
  
  // Vérifier si une clé API est présente dans les en-têtes
  if (!aiApiKey) {
    return res.status(401).json({ message: 'Clé API IA manquante' });
  }
  
  // Déterminer le type d'API à utiliser
  if (!['claude', 'openai'].includes(aiApiType)) {
    req.aiApiType = process.env.DEFAULT_AI_PROVIDER || 'claude'; // Valeur par défaut
  } else {
    req.aiApiType = aiApiType;
  }
  
  // Créer le service AI avec la clé fournie dans les en-têtes
  // Forcer l'utilisation de cette clé uniquement, pas celle du .env
  req.aiService = new AIService(aiApiKey, req.aiApiType);
  
  next();
};

// Middleware de validation du ton
const validateTone = (req, res, next) => {
  const validTones = ['professionnel', 'casual', 'inspirant', 'informatif', 'humoristique', 'formel', 'storytelling'];
  
  if (req.body.tone && !validTones.includes(req.body.tone)) {
    return res.status(400).json({ 
      message: 'Ton non valide', 
      validTones 
    });
  }
  
  next();
};

// Appliquer le middleware à toutes les routes
router.use(validateAIKey);
router.use(validateTone);

// Route pour générer un post à partir d'un article
router.post('/article-to-post', async (req, res) => {
  try {
    const { article, inputType, tone = 'professionnel' } = req.body;
    
    if (!article) {
      return res.status(400).json({ message: 'Article manquant' });
    }
    
    if (!['text', 'url'].includes(inputType)) {
      return res.status(400).json({ message: 'Type d\'input non valide' });
    }
    
    const generatedPost = await req.aiService.generatePostFromArticle(article, inputType, tone);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'article',
        tone,
        apiType: req.aiApiType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis article:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour générer un post à partir d'une idée
router.post('/idea-to-post', async (req, res) => {
  try {
    const { idea, tone = 'professionnel' } = req.body;
    
    if (!idea) {
      return res.status(400).json({ message: 'Idée manquante' });
    }
    
    const generatedPost = await req.aiService.generatePostFromIdea(idea, tone);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'idea',
        tone,
        apiType: req.aiApiType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis idée:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour générer un post à partir d'une vidéo YouTube
router.post('/youtube-to-post', async (req, res) => {
  try {
    const { videoUrl, transcription, tone = 'professionnel' } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ message: 'URL de la vidéo manquante' });
    }
    
    // Vérifier si l'URL a un format YouTube valide
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*$/;
    if (!youtubeRegex.test(videoUrl)) {
      return res.status(400).json({ message: 'URL YouTube non valide' });
    }
    
    const generatedPost = await req.aiService.generatePostFromYouTube(videoUrl, transcription, tone);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'youtube',
        videoUrl,
        tone,
        hasTranscription: !!transcription,
        apiType: req.aiApiType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis YouTube:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour générer un post à partir d'un code Python
router.post('/python-to-post', async (req, res) => {
  try {
    const { pythonCode, tone = 'professionnel' } = req.body;
    
    if (!pythonCode) {
      return res.status(400).json({ message: 'Code Python manquant' });
    }
    
    const generatedPost = await req.aiService.generatePostFromPythonCode(pythonCode, tone);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'python',
        codeLength: pythonCode.length,
        tone,
        apiType: req.aiApiType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis code Python:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour vérifier la validité d'une clé API
router.post('/verify-key', async (req, res) => {
  try {
    const isValid = await req.aiService.verifyApiKey();
    res.json({ isValid });
  } catch (error) {
    console.error('Erreur de vérification de clé API:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de la clé API',
      isValid: false
    });
  }
});

module.exports = router;