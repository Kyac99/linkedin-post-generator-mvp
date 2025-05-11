// backend/services/SchedulerService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const LinkedInService = require('./LinkedInService');

// Chemin vers le fichier de stockage local des posts planifiés (pour le MVP)
// Note: Dans une version production, on utiliserait une base de données
const SCHEDULED_POSTS_PATH = path.join(__dirname, '../data/scheduled_posts.json');

class SchedulerService {
  constructor() {
    this.linkedInService = new LinkedInService();
    
    // S'assurer que le dossier data existe
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // S'assurer que le fichier des posts planifiés existe
    if (!fs.existsSync(SCHEDULED_POSTS_PATH)) {
      fs.writeFileSync(SCHEDULED_POSTS_PATH, JSON.stringify({
        posts: []
      }));
    }
    
    // Initialiser le planificateur de tâches
    this._initScheduler();
  }

  /**
   * Planifier un post LinkedIn
   * @param {string} linkedInToken - Token d'accès LinkedIn
   * @param {string} content - Contenu du post
   * @param {Date} scheduledTime - Date et heure de publication
   * @param {string} linkUrl - URL du lien (optionnel)
   * @param {string} linkTitle - Titre du lien (optionnel)
   * @param {string} linkDescription - Description du lien (optionnel)
   */
  async schedulePost(linkedInToken, content, scheduledTime, linkUrl = null, linkTitle = null, linkDescription = null) {
    try {
      // Vérifier si le token est valide
      const isTokenValid = await this.linkedInService.verifyAccessToken(linkedInToken);
      if (!isTokenValid) {
        throw new Error('Token LinkedIn invalide ou expiré');
      }
      
      // Obtenir le profil de l'utilisateur pour enregistrer son ID
      const profile = await this._getUserProfile(linkedInToken);
      const userId = profile.id;
      
      // Générer un ID unique pour le post planifié
      const postId = uuidv4();
      
      // Créer l'objet du post planifié
      const scheduledPost = {
        id: postId,
        userId,
        content,
        scheduledTime: scheduledTime.toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending', // pending, published, cancelled, failed
        linkedInToken: this._encryptToken(linkedInToken), // Dans un MVP, on stocke le token (encrypté dans une vraie app)
        linkData: linkUrl ? {
          url: linkUrl,
          title: linkTitle,
          description: linkDescription
        } : null
      };
      
      // Ajouter le post à la liste des posts planifiés
      const data = this._readScheduledPosts();
      data.posts.push(scheduledPost);
      this._writeScheduledPosts(data);
      
      // Ne pas retourner le token dans la réponse
      const responsePost = { ...scheduledPost };
      delete responsePost.linkedInToken;
      
      // Planifier la tâche de publication
      this._scheduleTask(scheduledPost);
      
      return responsePost;
    } catch (error) {
      console.error('Erreur lors de la planification du post:', error);
      throw new Error('Impossible de planifier le post: ' + error.message);
    }
  }

  /**
   * Récupérer la liste des posts planifiés
   * @param {string} linkedInToken - Token d'accès LinkedIn
   */
  async getScheduledPosts(linkedInToken) {
    try {
      // Obtenir le profil de l'utilisateur pour filtrer ses posts
      const profile = await this._getUserProfile(linkedInToken);
      const userId = profile.id;
      
      // Lire les données
      const data = this._readScheduledPosts();
      
      // Filtrer les posts de l'utilisateur
      const userPosts = data.posts.filter(post => post.userId === userId);
      
      // Filtrer les posts non publiés et non annulés
      const pendingPosts = userPosts.filter(post => post.status === 'pending');
      
      // Trier par date de publication (du plus proche au plus lointain)
      pendingPosts.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
      
      // Ne pas retourner les tokens dans la réponse
      return pendingPosts.map(post => {
        const { linkedInToken, ...postWithoutToken } = post;
        return postWithoutToken;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des posts planifiés:', error);
      throw new Error('Impossible de récupérer les posts planifiés: ' + error.message);
    }
  }

  /**
   * Annuler un post planifié
   * @param {string} linkedInToken - Token d'accès LinkedIn
   * @param {string} postId - ID du post planifié
   */
  async cancelScheduledPost(linkedInToken, postId) {
    try {
      // Obtenir le profil de l'utilisateur pour vérifier qu'il est bien le propriétaire du post
      const profile = await this._getUserProfile(linkedInToken);
      const userId = profile.id;
      
      // Lire les données
      const data = this._readScheduledPosts();
      
      // Trouver le post
      const postIndex = data.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        throw new Error('Post planifié non trouvé');
      }
      
      // Vérifier que l'utilisateur est bien le propriétaire du post
      if (data.posts[postIndex].userId !== userId) {
        throw new Error('Vous n\'êtes pas autorisé à annuler ce post');
      }
      
      // Vérifier que le post est encore en attente
      if (data.posts[postIndex].status !== 'pending') {
        throw new Error('Ce post ne peut plus être annulé');
      }
      
      // Mettre à jour le statut du post
      data.posts[postIndex].status = 'cancelled';
      data.posts[postIndex].cancelledAt = new Date().toISOString();
      
      // Enregistrer les données
      this._writeScheduledPosts(data);
      
      return { id: postId, status: 'cancelled' };
    } catch (error) {
      console.error('Erreur lors de l\'annulation du post planifié:', error);
      throw new Error('Impossible d\'annuler le post planifié: ' + error.message);
    }
  }

  /**
   * Mettre à jour un post planifié
   * @param {string} linkedInToken - Token d'accès LinkedIn
   * @param {string} postId - ID du post planifié
   * @param {string} content - Contenu du post
   * @param {Date} scheduledTime - Date et heure de publication
   * @param {string} linkUrl - URL du lien (optionnel)
   * @param {string} linkTitle - Titre du lien (optionnel)
   * @param {string} linkDescription - Description du lien (optionnel)
   */
  async updateScheduledPost(linkedInToken, postId, content, scheduledTime, linkUrl = null, linkTitle = null, linkDescription = null) {
    try {
      // Obtenir le profil de l'utilisateur
      const profile = await this._getUserProfile(linkedInToken);
      const userId = profile.id;
      
      // Lire les données
      const data = this._readScheduledPosts();
      
      // Trouver le post
      const postIndex = data.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        throw new Error('Post planifié non trouvé');
      }
      
      // Vérifier que l'utilisateur est bien le propriétaire du post
      if (data.posts[postIndex].userId !== userId) {
        throw new Error('Vous n\'êtes pas autorisé à modifier ce post');
      }
      
      // Vérifier que le post est encore en attente
      if (data.posts[postIndex].status !== 'pending') {
        throw new Error('Ce post ne peut plus être modifié');
      }
      
      // Mettre à jour le post
      data.posts[postIndex].content = content;
      data.posts[postIndex].scheduledTime = scheduledTime.toISOString();
      data.posts[postIndex].updatedAt = new Date().toISOString();
      data.posts[postIndex].linkedInToken = this._encryptToken(linkedInToken);
      
      // Mettre à jour les données du lien
      data.posts[postIndex].linkData = linkUrl ? {
        url: linkUrl,
        title: linkTitle,
        description: linkDescription
      } : null;
      
      // Enregistrer les données
      this._writeScheduledPosts(data);
      
      // Retourner une version sans le token
      const { linkedInToken: token, ...postWithoutToken } = data.posts[postIndex];
      
      return postWithoutToken;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du post planifié:', error);
      throw new Error('Impossible de mettre à jour le post planifié: ' + error.message);
    }
  }

  /**
   * Publier un post planifié (appelé automatiquement à l'heure planifiée)
   * @param {string} postId - ID du post planifié
   * @private
   */
  async _publishScheduledPost(postId) {
    try {
      // Lire les données
      const data = this._readScheduledPosts();
      
      // Trouver le post
      const postIndex = data.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        console.error(`Post planifié non trouvé: ${postId}`);
        return;
      }
      
      // Vérifier que le post est encore en attente
      if (data.posts[postIndex].status !== 'pending') {
        console.log(`Le post ${postId} n'est plus en attente (${data.posts[postIndex].status})`);
        return;
      }
      
      const post = data.posts[postIndex];
      
      // Récupérer le token
      const linkedInToken = this._decryptToken(post.linkedInToken);
      
      // Vérifier que le token est valide
      const isTokenValid = await this.linkedInService.verifyAccessToken(linkedInToken);
      if (!isTokenValid) {
        data.posts[postIndex].status = 'failed';
        data.posts[postIndex].failedAt = new Date().toISOString();
        data.posts[postIndex].failureReason = 'Token LinkedIn invalide ou expiré';
        this._writeScheduledPosts(data);
        console.error(`Impossible de publier le post planifié ${postId}: Token invalide`);
        return;
      }
      
      // Publier le post
      try {
        let result;
        if (post.linkData) {
          result = await this.linkedInService.publishPostWithLink(
            linkedInToken,
            post.content,
            post.linkData.url,
            post.linkData.title,
            post.linkData.description
          );
        } else {
          result = await this.linkedInService.publishPost(linkedInToken, post.content);
        }
        
        // Mettre à jour le statut du post
        data.posts[postIndex].status = 'published';
        data.posts[postIndex].publishedAt = new Date().toISOString();
        data.posts[postIndex].linkedInPostId = result.id || 'unknown';
        this._writeScheduledPosts(data);
        
        console.log(`Post planifié ${postId} publié avec succès sur LinkedIn`);
      } catch (error) {
        // Gérer l'échec de publication
        data.posts[postIndex].status = 'failed';
        data.posts[postIndex].failedAt = new Date().toISOString();
        data.posts[postIndex].failureReason = error.message;
        this._writeScheduledPosts(data);
        
        console.error(`Échec de la publication du post planifié ${postId}:`, error.message);
      }
    } catch (error) {
      console.error('Erreur lors de la publication du post planifié:', error);
    }
  }

  /**
   * Initialiser le planificateur de tâches pour les posts déjà planifiés
   * @private
   */
  _initScheduler() {
    try {
      const data = this._readScheduledPosts();
      
      // Filtrer les posts en attente
      const pendingPosts = data.posts.filter(post => post.status === 'pending');
      
      // Planifier la publication de chaque post
      pendingPosts.forEach(post => {
        this._scheduleTask(post);
      });
      
      console.log(`Planificateur initialisé avec ${pendingPosts.length} posts en attente`);
      
      // Mettre en place une vérification périodique pour les nouveaux posts (toutes les minutes)
      setInterval(() => this._checkScheduledPosts(), 60000);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du planificateur:', error);
    }
  }

  /**
   * Vérifier les posts planifiés et les publier si c'est l'heure
   * @private
   */
  _checkScheduledPosts() {
    try {
      const data = this._readScheduledPosts();
      const now = new Date();
      
      // Filtrer les posts en attente dont l'heure de publication est passée
      const postsToPublish = data.posts.filter(post => 
        post.status === 'pending' && new Date(post.scheduledTime) <= now
      );
      
      // Publier chaque post
      postsToPublish.forEach(post => {
        this._publishScheduledPost(post.id);
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des posts planifiés:', error);
    }
  }

  /**
   * Planifier une tâche de publication
   * @param {Object} post - Le post à publier
   * @private
   */
  _scheduleTask(post) {
    try {
      const scheduledTime = new Date(post.scheduledTime);
      const now = new Date();
      
      // Si l'heure de publication est déjà passée, ne rien faire
      if (scheduledTime <= now) {
        console.log(`Le post ${post.id} est déjà en retard, il sera traité lors de la prochaine vérification`);
        return;
      }
      
      // Calculer le délai avant publication
      const delay = scheduledTime.getTime() - now.getTime();
      
      // Planifier la publication
      setTimeout(() => {
        this._publishScheduledPost(post.id);
      }, delay);
      
      console.log(`Post ${post.id} planifié pour publication dans ${Math.round(delay / 60000)} minutes`);
    } catch (error) {
      console.error('Erreur lors de la planification de la tâche:', error);
    }
  }

  /**
   * Récupérer le profil de l'utilisateur LinkedIn
   * @param {string} token - Token d'accès LinkedIn
   * @private
   */
  async _getUserProfile(token) {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil LinkedIn:', error);
      throw new Error('Impossible de récupérer le profil: ' + error.message);
    }
  }

  /**
   * Lire les données des posts planifiés depuis le stockage local
   * @private
   */
  _readScheduledPosts() {
    try {
      const rawData = fs.readFileSync(SCHEDULED_POSTS_PATH, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Erreur lors de la lecture des données de posts planifiés:', error);
      // Si erreur de lecture, retourner une structure vide
      return { posts: [] };
    }
  }

  /**
   * Écrire les données des posts planifiés dans le stockage local
   * @param {Object} data - Données à écrire
   * @private
   */
  _writeScheduledPosts(data) {
    try {
      fs.writeFileSync(SCHEDULED_POSTS_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Erreur lors de l\'écriture des données de posts planifiés:', error);
      throw new Error('Impossible d\'enregistrer les données: ' + error.message);
    }
  }

  /**
   * Encrypter le token LinkedIn (implémentation simplifiée pour le MVP)
   * Note: Dans une version production, utiliser une méthode d'encryption sécurisée
   * @param {string} token - Token d'accès LinkedIn
   * @private
   */
  _encryptToken(token) {
    // Pour le MVP, on stocke le token tel quel (à remplacer par une vraie encryption)
    return token;
  }

  /**
   * Décrypter le token LinkedIn (implémentation simplifiée pour le MVP)
   * Note: Dans une version production, utiliser une méthode de décryption sécurisée
   * @param {string} encryptedToken - Token d'accès LinkedIn encrypté
   * @private
   */
  _decryptToken(encryptedToken) {
    // Pour le MVP, on stocke le token tel quel (à remplacer par une vraie décryption)
    return encryptedToken;
  }
}

module.exports = SchedulerService;