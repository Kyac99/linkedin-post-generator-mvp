// backend/services/LinkedInService.js
const axios = require('axios');
const qs = require('querystring');

class LinkedInService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    this.apiBaseUrl = 'https://api.linkedin.com/v2';
  }

  /**
   * Génère l'URL d'authentification LinkedIn
   */
  getAuthUrl() {
    const scopes = ['r_emailaddress', 'r_liteprofile', 'w_member_social'];
    
    return `https://www.linkedin.com/oauth/v2/authorization?${qs.stringify({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: this.generateRandomState()
    })}`;
  }

  /**
   * Génère un état aléatoire pour la sécurité OAuth
   */
  generateRandomState() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Échange le code d'autorisation contre un token d'accès
   * @param {string} authorizationCode - Le code d'autorisation obtenu après la redirection
   */
  async getAccessToken(authorizationCode) {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        qs.stringify({
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token LinkedIn:', error.response?.data || error.message);
      throw new Error('Impossible d\'obtenir le token d\'accès LinkedIn');
    }
  }

  /**
   * Récupère les informations du profil utilisateur
   * @param {string} accessToken - Le token d'accès LinkedIn
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error.response?.data || error.message);
      throw new Error('Impossible de récupérer les informations du profil LinkedIn');
    }
  }

  /**
   * Publie un post sur LinkedIn
   * @param {string} accessToken - Le token d'accès LinkedIn
   * @param {string} content - Le contenu du post
   */
  async publishPost(accessToken, content) {
    try {
      // Récupérer d'abord l'ID de l'utilisateur (URN)
      const profile = await this.getUserProfile(accessToken);
      const personUrn = `urn:li:person:${profile.id}`;

      // Créer le post
      const response = await axios.post(
        `${this.apiBaseUrl}/ugcPosts`,
        {
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la publication du post:', error.response?.data || error.message);
      throw new Error('Impossible de publier le post sur LinkedIn');
    }
  }

  /**
   * Publie un post avec une image sur LinkedIn
   * @param {string} accessToken - Le token d'accès LinkedIn
   * @param {string} content - Le contenu du post
   * @param {string} imageUrl - L'URL de l'image à inclure
   */
  async publishPostWithImage(accessToken, content, imageUrl) {
    // Note: Pour le MVP initial, cette fonctionnalité peut être considérée comme une amélioration future
    throw new Error('La publication avec image n\'est pas encore implémentée dans ce MVP');
  }

  /**
   * Vérifie si un token d'accès est valide
   * @param {string} accessToken - Le token d'accès à vérifier
   */
  async verifyAccessToken(accessToken) {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = LinkedInService;
