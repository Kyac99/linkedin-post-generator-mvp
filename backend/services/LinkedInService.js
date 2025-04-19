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
      const errorMessage = error.response?.data?.error_description || 'Impossible d\'obtenir le token d\'accès LinkedIn';
      throw new Error(errorMessage);
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
   * Récupère l'adresse email de l'utilisateur
   * @param {string} accessToken - Le token d'accès LinkedIn
   */
  async getUserEmail(accessToken) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const emailElement = response.data.elements?.[0]?.['handle~']?.emailAddress;
      return emailElement || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'email:', error.response?.data || error.message);
      return null; // Retourne null au lieu de lancer une erreur car l'email n'est pas essentiel
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

      return {
        id: response.data.id,
        status: 'success',
        message: 'Post publié avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la publication du post:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Impossible de publier le post sur LinkedIn';
      throw new Error(errorMessage);
    }
  }

  /**
   * Publie un post avec un lien sur LinkedIn
   * @param {string} accessToken - Le token d'accès LinkedIn
   * @param {string} content - Le contenu du post
   * @param {string} linkUrl - L'URL du lien à inclure
   * @param {string} linkTitle - Le titre du lien (optionnel)
   * @param {string} linkDescription - La description du lien (optionnel)
   */
  async publishPostWithLink(accessToken, content, linkUrl, linkTitle = '', linkDescription = '') {
    try {
      // Récupérer d'abord l'ID de l'utilisateur (URN)
      const profile = await this.getUserProfile(accessToken);
      const personUrn = `urn:li:person:${profile.id}`;

      // Créer le post avec un lien
      const requestBody = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                originalUrl: linkUrl,
                title: {
                  text: linkTitle || 'Lien partagé'
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Ajouter la description si fournie
      if (linkDescription) {
        requestBody.specificContent['com.linkedin.ugc.ShareContent'].media[0].description = {
          text: linkDescription
        };
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/ugcPosts`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        id: response.data.id,
        status: 'success',
        message: 'Post avec lien publié avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la publication du post avec lien:', error.response?.data || error.message);
      throw new Error('Impossible de publier le post avec lien sur LinkedIn');
    }
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
      console.error('Erreur de vérification du token:', error.message);
      return false;
    }
  }

  /**
   * Rafraîchit un token d'accès expiré (si LinkedIn fournit un refresh_token)
   * @param {string} refreshToken - Le token de rafraîchissement
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        qs.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
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
      console.error('Erreur lors du rafraîchissement du token:', error.response?.data || error.message);
      throw new Error('Impossible de rafraîchir le token d\'accès LinkedIn');
    }
  }
}

module.exports = LinkedInService;
