// backend/routes/generate.js
const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');

// Middleware pour initialiser le service AI avec la configuration du fichier .env
const initializeAIService = (req, res, next) => {
  try {
    // Obtenir le type d'API préféré depuis la requête (optionnel)
    const preferredApiType = req.query.apiType || req.body.apiType;
    
    // Créer le service AI avec le type spécifié ou la valeur par défaut de .env
    req.aiService = new AIService(preferredApiType);
    
    // Vérifier que le service a bien une clé API valide
    if (!req.aiService.apiKey) {
      return res.status(500).json({ 
        message: 'Aucune clé API IA configurée sur le serveur. Veuillez configurer une clé API dans le fichier .env',
        code: 'API_KEY_MISSING'
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du service AI:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'initialisation du service AI',
      error: error.message,
      code: 'SERVICE_INIT_ERROR'
    });
  }
};

// Middleware de validation du ton
const validateTone = (req, res, next) => {
  const validTones = ['professionnel', 'casual', 'inspirant', 'informatif', 'humoristique', 'formel', 'storytelling'];
  
  if (req.body.tone && !validTones.includes(req.body.tone)) {
    console.warn(`Ton non valide fourni: ${req.body.tone}`);
    return res.status(400).json({ 
      message: 'Ton non valide', 
      validTones,
      code: 'INVALID_TONE'
    });
  }
  
  next();
};

// Appliquer les middlewares à toutes les routes
router.use(initializeAIService);
router.use(validateTone);

// Route pour générer un post à partir d'un article
router.post('/article-to-post', async (req, res) => {
  try {
    console.log('Traitement de la demande de génération de post à partir d\'un article');
    
    const { article, inputType, tone = 'professionnel' } = req.body;
    
    if (!article) {
      return res.status(400).json({ 
        message: 'Article manquant',
        code: 'MISSING_ARTICLE'
      });
    }
    
    if (!['text', 'url'].includes(inputType)) {
      return res.status(400).json({ 
        message: 'Type d\'input non valide. Valeurs acceptées: text, url',
        code: 'INVALID_INPUT_TYPE'
      });
    }
    
    console.log(`Génération d'un post LinkedIn à partir d'un ${inputType === 'text' ? 'texte' : 'URL'}`);
    console.log(`- Ton: ${tone}`);
    console.log(`- Longueur de l'article: ${article.length} caractères`);
    console.log(`- Service AI: ${req.aiService.apiType}`);
    
    const startTime = Date.now();
    const generatedPost = await req.aiService.generatePostFromArticle(article, inputType, tone);
    const duration = Date.now() - startTime;
    
    console.log(`Post généré en ${duration}ms (longueur: ${generatedPost.length} caractères)`);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'article',
        tone,
        inputType,
        apiType: req.aiService.apiType,
        processingTimeMs: duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis article:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      code: 'GENERATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour générer un post à partir d'une idée
router.post('/idea-to-post', async (req, res) => {
  try {
    console.log('Traitement de la demande de génération de post à partir d\'une idée');
    
    const { idea, tone = 'professionnel' } = req.body;
    
    if (!idea) {
      return res.status(400).json({ 
        message: 'Idée manquante',
        code: 'MISSING_IDEA'
      });
    }
    
    console.log(`Génération d'un post LinkedIn à partir d'une idée`);
    console.log(`- Ton: ${tone}`);
    console.log(`- Longueur de l'idée: ${idea.length} caractères`);
    console.log(`- Service AI: ${req.aiService.apiType}`);
    
    const startTime = Date.now();
    const generatedPost = await req.aiService.generatePostFromIdea(idea, tone);
    const duration = Date.now() - startTime;
    
    console.log(`Post généré en ${duration}ms (longueur: ${generatedPost.length} caractères)`);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'idea',
        tone,
        apiType: req.aiService.apiType,
        processingTimeMs: duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis idée:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      code: 'GENERATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour générer un post à partir d'une vidéo YouTube
router.post('/youtube-to-post', async (req, res) => {
  try {
    console.log('Traitement de la demande de génération de post à partir d\'une vidéo YouTube');
    
    const { videoUrl, transcription, tone = 'professionnel' } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ 
        message: 'URL de la vidéo manquante',
        code: 'MISSING_VIDEO_URL'
      });
    }
    
    // Vérifier si l'URL a un format YouTube valide
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*$/;
    if (!youtubeRegex.test(videoUrl)) {
      return res.status(400).json({ 
        message: 'URL YouTube non valide',
        code: 'INVALID_YOUTUBE_URL'
      });
    }
    
    console.log(`Génération d'un post LinkedIn à partir d'une vidéo YouTube`);
    console.log(`- URL: ${videoUrl}`);
    console.log(`- Ton: ${tone}`);
    console.log(`- Transcription fournie: ${transcription ? 'Oui' : 'Non'}`);
    console.log(`- Service AI: ${req.aiService.apiType}`);
    
    const startTime = Date.now();
    const generatedPost = await req.aiService.generatePostFromYouTube(videoUrl, transcription, tone);
    const duration = Date.now() - startTime;
    
    console.log(`Post généré en ${duration}ms (longueur: ${generatedPost.length} caractères)`);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'youtube',
        videoUrl,
        tone,
        hasTranscription: !!transcription,
        apiType: req.aiService.apiType,
        processingTimeMs: duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis YouTube:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      code: 'GENERATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour générer un post à partir d'un code Python
router.post('/python-to-post', async (req, res) => {
  try {
    console.log('Traitement de la demande de génération de post à partir de code Python');
    
    const { pythonCode, tone = 'professionnel' } = req.body;
    
    if (!pythonCode) {
      return res.status(400).json({ 
        message: 'Code Python manquant',
        code: 'MISSING_PYTHON_CODE'
      });
    }
    
    console.log(`Génération d'un post LinkedIn à partir de code Python`);
    console.log(`- Ton: ${tone}`);
    console.log(`- Longueur du code: ${pythonCode.length} caractères`);
    console.log(`- Service AI: ${req.aiService.apiType}`);
    
    const startTime = Date.now();
    const generatedPost = await req.aiService.generatePostFromPythonCode(pythonCode, tone);
    const duration = Date.now() - startTime;
    
    console.log(`Post généré en ${duration}ms (longueur: ${generatedPost.length} caractères)`);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'python',
        codeLength: pythonCode.length,
        tone,
        apiType: req.aiService.apiType,
        processingTimeMs: duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération de post depuis code Python:', error);
    res.status(500).json({ 
      message: `Erreur: ${error.message}`,
      code: 'GENERATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour vérifier l'état des API IA configurées
router.get('/api-status', async (req, res) => {
  try {
    console.log('Vérification de l\'état des API IA configurées');
    
    const aiService = new AIService();
    const status = await aiService.verifyApiKeys();
    
    res.json({
      status,
      defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'claude',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'état des API:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de l\'état des API',
      error: error.message,
      code: 'STATUS_CHECK_ERROR'
    });
  }
});

module.exports = router;