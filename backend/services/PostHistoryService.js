// backend/services/PostHistoryService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de stockage local des posts (pour le MVP)
// Note: Dans une version production, on utiliserait une base de données
const POSTS_STORAGE_PATH = path.join(__dirname, '../data/posts_history.json');

class PostHistoryService {
  constructor() {
    // S'assurer que le dossier data existe
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // S'assurer que le fichier d'historique existe
    if (!fs.existsSync(POSTS_STORAGE_PATH)) {
      fs.writeFileSync(POSTS_STORAGE_PATH, JSON.stringify({
        posts: [],
        users: {}
      }));
    }
  }

  /**
   * Récupérer l'historique des posts d'un utilisateur
   * @param {string} linkedInToken - Token d'accès LinkedIn
   * @param {string} userId - ID de l'utilisateur (ou 'current' pour l'utilisateur connecté)
   * @param {number} page - Numéro de page
   * @param {number} limit - Nombre de posts par page
   */
  async getPostHistory(linkedInToken, userId = 'current', page = 1, limit = 10) {
    try {
      // Si c'est l'utilisateur courant, obtenir son ID
      let actualUserId = userId;
      if (userId === 'current') {
        const profile = await this._getUserProfile(linkedInToken);
        actualUserId = profile.id;
      }
      
      // Lire l'historique depuis le stockage local
      const data = this._readPostsData();
      
      // Filtrer les posts de l'utilisateur
      const userPosts = data.posts.filter(post => post.userId === actualUserId);
      
      // Trier par date (plus récents en premier)
      userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = userPosts.slice(startIndex, endIndex);
      
      return {
        posts: paginatedPosts,
        pagination: {
          page,
          limit,
          total: userPosts.length,
          totalPages: Math.ceil(userPosts.length / limit)
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des posts:', error);
      throw new Error('Impossible de récupérer l\'historique des posts: ' + error.message);
    }
  }

  /**
   * Récupérer les statistiques d'un post spécifique
   * @param {string} linkedInToken - Token d'accès LinkedIn
   * @param {string} postId - ID du post
   */
  async getPostStats(linkedInToken, postId) {
    try {
      // Lecture des données
      const data = this._readPostsData();
      
      // Rechercher le post
      const post = data.posts.find(p => p.id === postId);
      if (!post) {
        throw new Error('Post non trouvé');
      }
      
      // Pour le MVP, on retourne les stats stockées localement
      // Dans une version production, on ferait un appel à l'API LinkedIn
      return {
        postId,
        stats: post.stats || {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          impressions: 0
        },
        lastUpdated: post.statsUpdatedAt || post.createdAt
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du post:', error);
      throw new Error('Impossible de récupérer les statistiques du post: ' + error.message);
    }
  }

  /**
   * Ajouter un post à l'historique
   * @param {string} linkedInToken - Token d'accès LinkedIn
   * @param {string} postId - ID du post LinkedIn
   * @param {string} content - Contenu du post
   * @param {Object} metadata - Métadonnées du post (type, ton, etc.)
   */
  async addPostToHistory(linkedInToken, postId, content, metadata = {}) {
    try {
      // Obtenir le profil de l'utilisateur pour avoir son ID
      const profile = await this._getUserProfile(linkedInToken);
      const userId = profile.id;
      
      // Lire les données actuelles
      const data = this._readPostsData();
      
      // Ajouter le nouveau post
      const newPost = {
        id: postId,
        userId,
        content,
        createdAt: new Date().toISOString(),
        metadata,
        stats: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          impressions: 0
        },
        statsUpdatedAt: new Date().toISOString()
      };
      
      data.posts.push(newPost);
      
      // Mettre à jour ou ajouter l'utilisateur
      if (!data.users[userId]) {
        data.users[userId] = {
          id: userId,
          name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
          profileUrl: profile.vanityName ? `https://www.linkedin.com/in/${profile.vanityName}` : null
        };
      }
      
      // Enregistrer les données
      this._writePostsData(data);
      
      return newPost;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du post à l\'historique:', error);
      throw new Error('Impossible d\'ajouter le post à l\'historique: ' + error.message);
    }
  }

  /**
   * Mettre à jour les statistiques d'un post
   * @param {string} postId - ID du post
   * @param {Object} stats - Statistiques mises à jour
   */
  async updatePostStats(postId, stats) {
    try {
      // Lire les données
      const data = this._readPostsData();
      
      // Trouver le post
      const postIndex = data.posts.findIndex(p => p.id === postId);
      if (postIndex === -1) {
        throw new Error('Post non trouvé');
      }
      
      // Mettre à jour les stats
      data.posts[postIndex].stats = {
        ...data.posts[postIndex].stats,
        ...stats
      };
      data.posts[postIndex].statsUpdatedAt = new Date().toISOString();
      
      // Enregistrer les données
      this._writePostsData(data);
      
      return data.posts[postIndex];
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques:', error);
      throw new Error('Impossible de mettre à jour les statistiques: ' + error.message);
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
   * Lire les données de posts depuis le stockage local
   * @private
   */
  _readPostsData() {
    try {
      const rawData = fs.readFileSync(POSTS_STORAGE_PATH, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Erreur lors de la lecture des données de posts:', error);
      // Si erreur de lecture, retourner une structure vide
      return { posts: [], users: {} };
    }
  }

  /**
   * Écrire les données de posts dans le stockage local
   * @param {Object} data - Données à écrire
   * @private
   */
  _writePostsData(data) {
    try {
      fs.writeFileSync(POSTS_STORAGE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Erreur lors de l\'écriture des données de posts:', error);
      throw new Error('Impossible d\'enregistrer les données: ' + error.message);
    }
  }
}

module.exports = PostHistoryService;