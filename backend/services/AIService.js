// backend/services/AIService.js
const axios = require('axios');
const { JSDOM } = require('jsdom');

class AIService {
  constructor(apiKey, apiType = 'claude') {
    // N'utiliser que la clé API fournie explicitement, pas celle du .env
    this.apiKey = apiKey;
    this.apiType = apiType;
    
    // Vérifier si la clé API est valide
    if (!this.apiKey) {
      console.warn(`⚠️ Clé API ${this.apiType} non fournie`);
    } else {
      console.log(`✅ Clé API ${this.apiType} reçue, longueur: ${this.apiKey.length} caractères`);
    }
  }

  /**
   * Génère un post LinkedIn à partir d'un article
   * @param {string} article - Texte ou URL de l'article
   * @param {string} inputType - Type d'input ('text' ou 'url')
   * @param {string} tone - Ton souhaité pour le post (professionnel, casual, inspirant, etc.)
   */
  async generatePostFromArticle(article, inputType, tone = 'professionnel') {
    let articleContent = article;
    
    // Si c'est une URL, extraire le contenu de l'article
    if (inputType === 'url') {
      try {
        articleContent = await this.extractContentFromUrl(article);
      } catch (error) {
        throw new Error(`Erreur lors de l'extraction du contenu de l'URL: ${error.message}`);
      }
    }
    
    // Limiter la taille de l'article pour éviter de dépasser les limites de tokens
    const truncatedContent = this.truncateContent(articleContent, 10000);
    
    // Générer le prompt pour l'IA
    const prompt = this.createPromptForArticle(truncatedContent, tone);
    
    // Appeler l'API d'IA appropriée
    return await this.callAIApi(prompt);
  }

  /**
   * Génère un post LinkedIn à partir d'une idée
   * @param {string} idea - L'idée de post
   * @param {string} tone - Ton souhaité pour le post
   */
  async generatePostFromIdea(idea, tone = 'professionnel') {
    const prompt = this.createPromptForIdea(idea, tone);
    return await this.callAIApi(prompt);
  }

  /**
   * Génère un post LinkedIn à partir d'une vidéo YouTube
   * @param {string} videoUrl - URL de la vidéo YouTube
   * @param {string} transcription - Transcription optionnelle de la vidéo
   * @param {string} tone - Ton souhaité pour le post
   */
  async generatePostFromYouTube(videoUrl, transcription = null, tone = 'professionnel') {
    let videoContent = '';
    
    if (transcription) {
      videoContent = transcription;
    } else {
      try {
        // Dans un MVP, on peut utiliser l'API YouTube pour obtenir des métadonnées
        // comme le titre, la description, etc. pour créer un post
        const videoId = this.extractYouTubeId(videoUrl);
        const videoData = await this.fetchYouTubeMetadata(videoId);
        
        videoContent = `
          Titre: ${videoData.title}
          Description: ${videoData.description}
          Auteur: ${videoData.author}
          Durée: ${videoData.duration}
        `;
      } catch (error) {
        throw new Error(`Erreur lors de l'extraction des données YouTube: ${error.message}`);
      }
    }
    
    const prompt = this.createPromptForYouTube(videoUrl, videoContent, tone);
    return await this.callAIApi(prompt);
  }

  /**
   * Génère un post LinkedIn à partir d'un code Python
   * @param {string} pythonCode - Le code Python
   * @param {string} tone - Ton souhaité pour le post
   */
  async generatePostFromPythonCode(pythonCode, tone = 'professionnel') {
    const prompt = this.createPromptForPythonCode(pythonCode, tone);
    return await this.callAIApi(prompt);
  }

  /**
   * Extrait le contenu d'une URL
   * @param {string} url - L'URL à extraire
   */
  async extractContentFromUrl(url) {
    try {
      const response = await axios.get(url);
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      // Extraire le titre
      const title = document.querySelector('title')?.textContent || '';
      
      // Extraire le contenu principal
      // Cette logique pourrait être améliorée pour mieux cibler le contenu pertinent
      let content = '';
      
      // Essayer de trouver le contenu principal
      const articleContent = document.querySelector('article') || 
                           document.querySelector('.content') || 
                           document.querySelector('.post') || 
                           document.querySelector('main');
      
      if (articleContent) {
        content = articleContent.textContent;
      } else {
        // Fallback: extraire tous les paragraphes
        const paragraphs = document.querySelectorAll('p');
        content = Array.from(paragraphs).map(p => p.textContent).join('\n\n');
      }
      
      return `${title}\n\n${content}`;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du contenu:', error);
      throw new Error('Impossible d\'extraire le contenu de cette URL');
    }
  }

  /**
   * Extrait l'ID d'une vidéo YouTube à partir de son URL
   * @param {string} url - L'URL YouTube
   */
  extractYouTubeId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  /**
   * Récupère les métadonnées d'une vidéo YouTube
   * @param {string} videoId - L'ID de la vidéo YouTube
   */
  async fetchYouTubeMetadata(videoId) {
    // Note: Dans un MVP complet, vous utiliseriez l'API YouTube Data
    // Pour simplifier, on pourrait utiliser une bibliothèque comme youtube-dl ou scraper les données
    // Ici, on simule un résultat pour le MVP
    try {
      // Exemple de scraping basique (à améliorer dans une version production)
      const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
      const html = response.data;
      
      // Extraction simple du titre (à améliorer)
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Vidéo YouTube';
      
      // Extraction simple de la description (à améliorer)
      const descMatch = html.match(/\"description\":{\"simpleText\":\"(.*?)\"/);
      const description = descMatch ? descMatch[1] : 'Pas de description disponible';
      
      return {
        title,
        description: description.replace(/\\n/g, '\n'),
        author: 'Créateur YouTube', // Simplification pour le MVP
        duration: 'Non disponible' // Simplification pour le MVP
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées YouTube:', error);
      // Valeurs par défaut en cas d'erreur
      return {
        title: 'Vidéo YouTube',
        description: 'Impossible de récupérer la description',
        author: 'Créateur YouTube',
        duration: 'Non disponible'
      };
    }
  }

  /**
   * Tronquer le contenu pour respecter les limites de tokens
   * @param {string} content - Le contenu à tronquer
   * @param {number} maxLength - La longueur maximale
   */
  truncateContent(content, maxLength) {
    if (!content) return '';
    
    if (content.length <= maxLength) {
      return content;
    }
    
    // Tronquer mais essayer de finir sur une phrase complète
    let truncated = content.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    
    if (lastPeriod > maxLength * 0.8) { // S'assurer qu'on ne coupe pas trop tôt
      truncated = truncated.substring(0, lastPeriod + 1);
    }
    
    return `${truncated}\n\n[Contenu tronqué pour respecter les limites de l'API]`;
  }

  /**
   * Créer un prompt pour générer un post LinkedIn à partir d'un article
   * @param {string} articleContent - Le contenu de l'article
   * @param {string} tone - Le ton souhaité pour le post
   */
  createPromptForArticle(articleContent, tone) {
    return `
    Tu es un expert en marketing de contenu et en rédaction pour LinkedIn. Ta mission est de transformer l'article suivant en un post LinkedIn engageant et professionnel.

    Voici quelques conseils pour créer un excellent post LinkedIn:
    - Commence par un hook puissant pour capter l'attention
    - Sois concis et va à l'essentiel (max 1300 caractères)
    - Utilise des paragraphes courts et des espaces pour une meilleure lisibilité
    - Inclus 3-5 hashtags pertinents à la fin
    - Termine par une question ou un appel à l'action pour encourager l'engagement
    - Le ton du post doit être: ${tone}

    Voici l'article à transformer:
    ${articleContent}

    Génère uniquement le contenu du post LinkedIn sans commentaires additionnels.
    `;
  }

  /**
   * Créer un prompt pour générer un post LinkedIn à partir d'une idée
   * @param {string} idea - L'idée de post
   * @param {string} tone - Le ton souhaité pour le post
   */
  createPromptForIdea(idea, tone) {
    return `
    Tu es un expert en marketing de contenu et en rédaction pour LinkedIn. Ta mission est de transformer l'idée suivante en un post LinkedIn complet, engageant et professionnel.

    Voici quelques conseils pour créer un excellent post LinkedIn:
    - Commence par un hook puissant pour capter l'attention
    - Développe l'idée avec un exemple concret ou une histoire
    - Sois concis et va à l'essentiel (max 1300 caractères)
    - Utilise des paragraphes courts et des espaces pour une meilleure lisibilité
    - Inclus 3-5 hashtags pertinents à la fin
    - Termine par une question ou un appel à l'action pour encourager l'engagement
    - Le ton du post doit être: ${tone}

    Voici l'idée à développer:
    ${idea}

    Génère uniquement le contenu du post LinkedIn sans commentaires additionnels.
    `;
  }

  /**
   * Créer un prompt pour générer un post LinkedIn à partir d'une vidéo YouTube
   * @param {string} videoUrl - L'URL de la vidéo YouTube
   * @param {string} videoContent - Le contenu/métadonnées de la vidéo
   * @param {string} tone - Le ton souhaité pour le post
   */
  createPromptForYouTube(videoUrl, videoContent, tone) {
    return `
    Tu es un expert en marketing de contenu et en rédaction pour LinkedIn. Ta mission est de créer un post LinkedIn engageant qui fait la promotion de la vidéo YouTube suivante.

    Voici quelques conseils pour créer un excellent post LinkedIn:
    - Commence par un hook puissant pour capter l'attention
    - Explique pourquoi cette vidéo vaut la peine d'être regardée
    - Mentionne 2-3 points clés que le spectateur apprendra
    - Sois concis et va à l'essentiel (max 1300 caractères)
    - Utilise des paragraphes courts et des espaces pour une meilleure lisibilité
    - Inclus l'URL de la vidéo: ${videoUrl}
    - Inclus 3-5 hashtags pertinents à la fin
    - Termine par une question ou un appel à l'action pour encourager l'engagement
    - Le ton du post doit être: ${tone}

    Voici les informations sur la vidéo:
    ${videoContent}

    Génère uniquement le contenu du post LinkedIn sans commentaires additionnels.
    `;
  }

  /**
   * Créer un prompt pour générer un post LinkedIn à partir d'un code Python
   * @param {string} pythonCode - Le code Python
   * @param {string} tone - Le ton souhaité pour le post
   */
  createPromptForPythonCode(pythonCode, tone) {
    return `
    Tu es un expert en programmation Python et en marketing de contenu pour LinkedIn. Ta mission est de créer un post LinkedIn engageant qui explique le code Python suivant.

    Voici quelques conseils pour créer un excellent post LinkedIn:
    - Commence par un hook puissant pour capter l'attention
    - Explique ce que fait le code de façon claire et accessible
    - Mentionne un cas d'utilisation concret ou un problème que ce code résout
    - Ne colle pas le code entier, mais tu peux en inclure des extraits très courts si nécessaire
    - Sois concis et va à l'essentiel (max 1300 caractères)
    - Utilise des paragraphes courts et des espaces pour une meilleure lisibilité
    - Inclus 3-5 hashtags pertinents à la fin (#Python, #Coding, etc.)
    - Termine par une question ou un appel à l'action pour encourager l'engagement
    - Le ton du post doit être: ${tone}

    Voici le code Python à expliquer:
    ${pythonCode}

    Génère uniquement le contenu du post LinkedIn sans commentaires additionnels.
    `;
  }

  /**
   * Appelle l'API d'IA appropriée (Claude AI ou OpenAI)
   * @param {string} prompt - Le prompt à envoyer à l'API
   */
  async callAIApi(prompt) {
    if (!this.apiKey) {
      throw new Error('Clé API IA manquante. Veuillez configurer une clé API dans les paramètres.');
    }
    
    if (this.apiType === 'claude') {
      return await this.callClaudeApi(prompt);
    } else if (this.apiType === 'openai') {
      return await this.callOpenAIApi(prompt);
    } else {
      throw new Error('Type d\'API non pris en charge');
    }
  }

  /**
   * Appelle l'API Claude AI
   * @param {string} prompt - Le prompt à envoyer à l'API
   */
  async callClaudeApi(prompt) {
    try {
      // Utiliser le modèle Claude 3.5 Sonnet pour de meilleurs résultats
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20240620',
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
          }
        }
      );

      // Extraire la réponse générée
      return response.data.content[0].text;
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API Claude:', error.response?.data || error.message);
      
      // Fallback sur un modèle plus léger si nécessaire
      if (error.response?.status === 400 && error.response?.data?.error?.type === 'invalid_request_error') {
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
              }
            }
          );
          
          return fallbackResponse.data.content[0].text;
        } catch (fallbackError) {
          console.error('Erreur avec le modèle de fallback:', fallbackError);
          throw new Error('Erreur lors de la génération du post avec Claude AI');
        }
      }
      
      throw new Error('Erreur lors de la génération du post avec Claude AI');
    }
  }

  /**
   * Appelle l'API OpenAI
   * @param {string} prompt - Le prompt à envoyer à l'API
   */
  async callOpenAIApi(prompt) {
    let retries = 0;
    const maxRetries = 3;
    const initialDelay = 1000; // 1 seconde

    while (retries <= maxRetries) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-2024-05-13',  // Utiliser un modèle avec version spécifique
            messages: [
              { role: 'system', content: 'Vous êtes un expert en marketing de contenu pour LinkedIn.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 1024,
            temperature: 0.7
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 30000 // 30 secondes de timeout
          }
        );

        // Extraire la réponse générée
        return response.data.choices[0].message.content;
      } catch (error) {
        console.error(`Erreur lors de l'appel à l'API OpenAI (tentative ${retries + 1}/${maxRetries + 1}):`, error.response?.data || error.message);
        
        // Vérifier si l'erreur est récupérable (rate limit, timeout, etc.)
        const isRateLimitError = error.response?.status === 429;
        const isServerError = error.response?.status >= 500 && error.response?.status < 600;
        const isTimeoutError = error.code === 'ECONNABORTED';
        
        if ((isRateLimitError || isServerError || isTimeoutError) && retries < maxRetries) {
          // Backoff exponentiel
          const delay = initialDelay * Math.pow(2, retries);
          console.log(`Nouvelle tentative dans ${delay/1000} secondes...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        }
        
        // Si l'erreur est due à un modèle indisponible ou à un problème de requête, essayer avec un modèle de repli
        if (error.response?.status === 400 || error.response?.status === 404) {
          try {
            console.log('Tentative avec GPT-3.5 Turbo...');
            const fallbackResponse = await axios.post(
              'https://api.openai.com/v1/chat/completions',
              {
                model: 'gpt-3.5-turbo-0125', // Version spécifique de GPT-3.5 Turbo
                messages: [
                  { role: 'system', content: 'Vous êtes un expert en marketing de contenu pour LinkedIn.' },
                  { role: 'user', content: prompt }
                ],
                max_tokens: 1024,
                temperature: 0.7
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 30000
              }
            );
            
            return fallbackResponse.data.choices[0].message.content;
          } catch (fallbackError) {
            console.error('Erreur avec le modèle de fallback:', fallbackError);
            throw new Error('Erreur lors de la génération du post avec OpenAI');
          }
        }
        
        throw new Error('Erreur lors de la génération du post avec OpenAI: ' + (error.response?.data?.error?.message || error.message));
      }
    }
  }

  /**
   * Vérifie la validité d'une clé API
   */
  async verifyApiKey() {
    // Vérifier si une clé API est fournie
    if (!this.apiKey) {
      return false;
    }
    
    try {
      if (this.apiType === 'claude') {
        // Un simple appel d'API pour vérifier la validité de la clé
        await this.callClaudeApi('Répondez simplement "OK" pour vérifier que l\'API fonctionne.');
      } else if (this.apiType === 'openai') {
        await this.callOpenAIApi('Répondez simplement "OK" pour vérifier que l\'API fonctionne.');
      }
      return true;
    } catch (error) {
      console.error('Erreur de vérification de la clé API:', error);
      return false;
    }
  }
}

module.exports = AIService;