// backend/services/AIService.js
const axios = require('axios');
const { JSDOM } = require('jsdom');
require('dotenv').config();

class AIService {
  // [Previous methods remain the same]

  /**
   * Appelle l'API Claude AI
   * @param {string} prompt - Le prompt à envoyer à l'API
   */
  async callClaudeApi(prompt) {
    try {
      console.log('Appel à l\'API Claude...');
      
      // Utiliser le modèle Claude 3 Sonnet - modèle performant et stable
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',  // Modèle Sonnet stable et performant
          max_tokens: 1024,
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000 // 30 secondes de timeout
        }
      );

      // Log du statut de la réponse
      console.log("Statut de l'appel Claude:", response.status);
      console.log("Type de réponse:", typeof response.data);
      console.log("Clés dans la réponse:", Object.keys(response.data));

      // Extraire la réponse générée
      if (response.data && response.data.content && response.data.content.length > 0) {
        console.log("Longueur de la réponse Claude:", response.data.content[0].text.length);
        return response.data.content[0].text;
      } else {
        console.error("Réponse Claude inattendue:", JSON.stringify(response.data));
        throw new Error('Format de réponse inattendu de Claude AI');
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API Claude:', 
                   error.response?.status, 
                   error.response?.data || error.message);
      
      // Afficher des détails plus spécifiques sur l'erreur pour le débogage
      if (error.response) {
        console.error('Détails de la réponse d\'erreur:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        });
        
        // Erreur de modèle non trouvé
        if (error.response.status === 404) {
          // Fallback vers Claude Haiku si Sonnet n'est pas disponible
          try {
            console.log('Tentative avec Claude 3 Haiku...');
            const fallbackResponse = await axios.post(
              'https://api.anthropic.com/v1/messages',
              {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [
                  { role: 'user', content: prompt }
                ]
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': this.apiKey,
                  'anthropic-version': '2023-06-01'
                },
                timeout: 30000
              }
            );
            
            console.log("Statut de l'appel Claude Haiku:", fallbackResponse.status);
            
            if (fallbackResponse.data && fallbackResponse.data.content && fallbackResponse.data.content.length > 0) {
              return fallbackResponse.data.content[0].text;
            } else {
              throw new Error('Format de réponse inattendu de Claude Haiku');
            }
          } catch (fallbackError) {
            console.error('Erreur avec le modèle de fallback Claude Haiku:', 
                         fallbackError.response?.status, 
                         fallbackError.response?.data || fallbackError.message);
            throw new Error('Erreur lors de la génération du post avec Claude AI');
          }
        }
        
        // Erreur d'authentification
        if (error.response.status === 401) {
          throw new Error('Clé API Claude invalide ou expirée. Veuillez vérifier votre clé API dans le fichier .env');
        }
        
        // Erreur de quota
        if (error.response.status === 429) {
          throw new Error('Quota d\'API Claude dépassé. Veuillez réessayer plus tard.');
        }
        
        // Autres erreurs avec message spécifique de l'API
        if (error.response.data && error.response.data.error && error.response.data.error.message) {
          throw new Error(`Erreur Claude API: ${error.response.data.error.message}`);
        }
      }
      
      // Erreur générique en dernier recours
      throw new Error('Erreur lors de la génération du post avec Claude AI: ' + error.message);
    }
  }

  /**
   * Vérifie la validité des clés API configurées dans le fichier .env
   */
  async verifyApiKeys() {
    const results = {
      claude: {
        configured: !!process.env.CLAUDE_API_KEY,
        valid: false,
        error: null
      }
    };
    
    // Vérifier la clé Claude si configurée
    if (results.claude.configured) {
      try {
        const claudeService = new AIService('claude');
        const response = await claudeService.callClaudeApi('Réponds simplement "OK" pour vérifier que l\'API fonctionne.');
        results.claude.valid = !!response;
      } catch (error) {
        results.claude.error = error.message;
      }
    }
    
    return results;
  }
}

module.exports = AIService;
