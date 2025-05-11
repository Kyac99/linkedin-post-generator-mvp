// backend/routes/history.js
const express = require('express');
const router = express.Router();
const PostHistoryService = require('../services/PostHistoryService');
const SchedulerService = require('../services/SchedulerService');

// Initialiser les services
const postHistoryService = new PostHistoryService();
const schedulerService = new SchedulerService();

// Middleware pour vérifier le token LinkedIn
const validateLinkedInToken = (req, res, next) => {
  const { linkedintoken } = req.headers;
  
  if (!linkedintoken) {
    return res.status(401).json({ message: 'Token LinkedIn manquant' });
  }
  
  req.linkedinToken = linkedintoken;
  next();
};

// Routes pour l'historique des posts
router.get('/posts', validateLinkedInToken, async (req, res) => {
  try {
    const userId = req.query.userId || 'current';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const history = await postHistoryService.getPostHistory(req.linkedinToken, userId, page, limit);
    
    res.json(history);
  } catch (error) {
    console.error('Erreur récupération historique des posts:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Récupérer les statistiques d'un post spécifique
router.get('/posts/:postId/stats', validateLinkedInToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const stats = await postHistoryService.getPostStats(req.linkedinToken, postId);
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur récupération statistiques du post:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Routes pour la planification des posts
router.post('/schedule', validateLinkedInToken, async (req, res) => {
  try {
    const { content, scheduledTime, linkUrl, linkTitle, linkDescription } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Contenu du post manquant' });
    }
    
    if (!scheduledTime) {
      return res.status(400).json({ message: 'Heure de planification manquante' });
    }
    
    // Vérifier que l'heure de planification est dans le futur
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return res.status(400).json({ message: 'La date de planification doit être dans le futur' });
    }
    
    // Planifier le post
    const scheduledPost = await schedulerService.schedulePost(
      req.linkedinToken,
      content,
      scheduledDate,
      linkUrl,
      linkTitle,
      linkDescription
    );
    
    res.json({
      success: true,
      message: 'Post planifié avec succès',
      scheduledPost
    });
  } catch (error) {
    console.error('Erreur planification du post:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Récupérer la liste des posts planifiés
router.get('/scheduled', validateLinkedInToken, async (req, res) => {
  try {
    const scheduledPosts = await schedulerService.getScheduledPosts(req.linkedinToken);
    
    res.json(scheduledPosts);
  } catch (error) {
    console.error('Erreur récupération posts planifiés:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Annuler un post planifié
router.delete('/scheduled/:postId', validateLinkedInToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    await schedulerService.cancelScheduledPost(req.linkedinToken, postId);
    
    res.json({
      success: true,
      message: 'Post planifié annulé avec succès'
    });
  } catch (error) {
    console.error('Erreur annulation post planifié:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

// Modifier un post planifié
router.put('/scheduled/:postId', validateLinkedInToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, scheduledTime, linkUrl, linkTitle, linkDescription } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Contenu du post manquant' });
    }
    
    if (!scheduledTime) {
      return res.status(400).json({ message: 'Heure de planification manquante' });
    }
    
    // Vérifier que l'heure de planification est dans le futur
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return res.status(400).json({ message: 'La date de planification doit être dans le futur' });
    }
    
    // Mettre à jour le post planifié
    const updatedPost = await schedulerService.updateScheduledPost(
      req.linkedinToken,
      postId,
      content,
      scheduledDate,
      linkUrl,
      linkTitle,
      linkDescription
    );
    
    res.json({
      success: true,
      message: 'Post planifié mis à jour avec succès',
      scheduledPost: updatedPost
    });
  } catch (error) {
    console.error('Erreur mise à jour post planifié:', error);
    res.status(500).json({ message: `Erreur: ${error.message}` });
  }
});

module.exports = router;