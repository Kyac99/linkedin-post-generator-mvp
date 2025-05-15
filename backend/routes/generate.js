// backend/routes/generate.js
const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');

// Middleware pour initialiser le service AI avec Claude uniquement
const initializeAIService = (req, res, next) => {
  try {
    // Créer le service AI Claude
    req.aiService = new AIService();
    
    // Vérifier que le service a bien une clé API valide
    if (!req.aiService.apiKey) {
      return res.status(500).json({ 
        message: 'Aucune clé API Claude configurée sur le serveur. Veuillez configurer une clé API dans le fichier .env',
        code: 'API_KEY_MISSING'
      });
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du service AI:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'initialisation du service AI Claude',
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

// [Précédentes routes pour article-to-post, idea-to-post, youtube-to-post]

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
    console.log(`- Service AI: Claude`);
    
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
        apiType: 'claude',
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

// Route pour vérifier l'état de l'API IA configurée
router.get('/api-status', async (req, res) => {
  try {
    console.log('Vérification de l\'état de l\'API IA configurée');
    
    const aiService = new AIService();
    const status = await aiService.verifyApiKeys();
    
    res.json({
      status,
      defaultProvider: 'claude',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'état de l\'API:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la vérification de l\'état de l\'API',
      error: error.message,
      code: 'STATUS_CHECK_ERROR'
    });
  }
});

module.exports = router;
