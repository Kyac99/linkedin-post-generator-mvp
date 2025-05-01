// backend/routes/generate.js
const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');

// Middleware pour extraire et vérifier la clé API
const validateAIKey = (req, res, next) => {
  const { aiApiKey, aiApiType } = req.headers;
  
  console.log(`Vérification des en-têtes de requête pour l'API IA`);
  console.log(`- aiApiType: ${aiApiType || 'non défini'}`);
  
  // Journaliser la présence de la clé API de manière sécurisée
  if (aiApiKey) {
    const firstChars = aiApiKey.substring(0, 3);
    const lastChars = aiApiKey.substring(aiApiKey.length - 3);
    const length = aiApiKey.length;
    console.log(`- aiApiKey présente: Oui (format: ${firstChars}...${lastChars}, longueur: ${length})`);
  } else {
    console.error('- aiApiKey présente: Non');
  }
  
  // Vérifier si une clé API est présente dans les en-têtes
  if (!aiApiKey || aiApiKey.trim() === '') {
    console.error('Aucune clé API fournie dans les en-têtes - Requête rejetée');
    return res.status(401).json({ 
      message: 'Clé API IA manquante. Veuillez configurer une clé API dans les paramètres.',
      code: 'API_KEY_MISSING'
    });
  }
  
  // Vérification rapide du format de la clé API
  if (aiApiType === 'claude' && !aiApiKey.startsWith('sk-ant-')) {
    console.warn('Format de clé Claude potentiellement invalide (ne commence pas par sk-ant-)');
  } else if (aiApiType === 'openai' && !aiApiKey.startsWith('sk-')) {
    console.warn('Format de clé OpenAI potentiellement invalide (ne commence pas par sk-)');
  }
  
  // Déterminer le type d'API à utiliser
  if (!['claude', 'openai'].includes(aiApiType)) {
    req.aiApiType = process.env.DEFAULT_AI_PROVIDER || 'claude'; // Valeur par défaut
    console.log(`Type d'API non spécifié, utilisation de la valeur par défaut: ${req.aiApiType}`);
  } else {
    req.aiApiType = aiApiType;
    console.log(`Type d'API spécifié: ${req.aiApiType}`);
  }
  
  console.log(`Initialisation du service AI avec le type ${req.aiApiType}`);
  
  // Créer le service AI avec la clé fournie dans les en-têtes
  req.aiService = new AIService(aiApiKey, req.aiApiType);
  
  next();
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

// Appliquer le middleware à toutes les routes
router.use(validateAIKey);
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
        apiType: req.aiApiType,
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
    
    const startTime = Date.now();
    const generatedPost = await req.aiService.generatePostFromIdea(idea, tone);
    const duration = Date.now() - startTime;
    
    console.log(`Post généré en ${duration}ms (longueur: ${generatedPost.length} caractères)`);
    
    res.json({ 
      generatedPost,
      metadata: {
        type: 'idea',
        tone,
        apiType: req.aiApiType,
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
        apiType: req.aiApiType,
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
        apiType: req.aiApiType,
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

// Route pour vérifier la validité d'une clé API
router.post('/verify-key', async (req, res) => {
  try {
    console.log('Vérification de la validité de la clé API');
    
    const startTime = Date.now();
    const isValid = await req.aiService.verifyApiKey();
    const duration = Date.now() - startTime;
    
    console.log(`Vérification terminée en ${duration}ms, résultat: ${isValid ? 'valide' : 'invalide'}`);
    
    res.json({ 
      isValid,
      apiType: req.aiApiType,
      processingTimeMs: duration
    });
  } catch (error) {
    console.error('Erreur de vérification de clé API:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de la clé API',
      error: error.message,
      isValid: false,
      code: 'VERIFICATION_ERROR'
    });
  }
});

module.exports = router;