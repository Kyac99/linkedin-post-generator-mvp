// backend/routes/hashtags.js
const express = require('express');
const router = express.Router();
const HashtagService = require('../services/HashtagService');

// Initialiser le service de hashtags
const hashtagService = new HashtagService();

// Route pour obtenir des hashtags populaires
router.get('/popular', async (req, res) => {
  try {
    const category = req.query.category || null;
    const limit = parseInt(req.query.limit) || 10;
    
    const hashtags = await hashtagService.getPopularHashtags(category, limit);
    
    res.json({ hashtags });
  } catch (error) {
    console.error('Erreur récupération hashtags populaires:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Route pour obtenir des suggestions de hashtags basées sur un contenu
router.post('/suggest', async (req, res) => {
  try {
    const { content } = req.body;
    const limit = parseInt(req.query.limit) || 5;
    
    if (!content) {
      return res.status(400).json({ message: 'Contenu manquant' });
    }
    
    const hashtags = await hashtagService.suggestHashtags(content, limit);
    
    res.json({ hashtags });
  } catch (error) {
    console.error('Erreur suggestion hashtags:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Route pour obtenir la liste des catégories de hashtags disponibles
router.get('/categories', (req, res) => {
  try {
    const categories = [
      { id: 'technology', name: 'Technologie' },
      { id: 'business', name: 'Business' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'career', name: 'Carrière' },
      { id: 'leadership', name: 'Leadership' },
      { id: 'development', name: 'Développement' },
      { id: 'datascience', name: 'Data Science' },
      { id: 'programming', name: 'Programmation' },
      { id: 'ai', name: 'Intelligence Artificielle' },
      { id: 'education', name: 'Éducation' },
      { id: 'productivity', name: 'Productivité' },
      { id: 'networking', name: 'Réseautage' },
      { id: 'entrepreneurship', name: 'Entrepreneuriat' },
      { id: 'innovation', name: 'Innovation' }
    ];
    
    res.json({ categories });
  } catch (error) {
    console.error('Erreur récupération catégories de hashtags:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

module.exports = router;