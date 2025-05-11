// backend/services/HashtagService.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Chemin vers le fichier de stockage local des hashtags populaires (pour le MVP)
// Note: Dans une version production, on utiliserait une base de données
const HASHTAGS_STORAGE_PATH = path.join(__dirname, '../data/popular_hashtags.json');

// Catégories de hashtags pour faciliter les suggestions
const HASHTAG_CATEGORIES = [
  'technology',
  'business',
  'marketing',
  'career',
  'leadership',
  'development',
  'datascience',
  'programming',
  'ai',
  'education',
  'productivity',
  'networking',
  'entrepreneurship',
  'innovation'
];

class HashtagService {
  constructor() {
    // S'assurer que le dossier data existe
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // S'assurer que le fichier de hashtags existe
    if (!fs.existsSync(HASHTAGS_STORAGE_PATH)) {
      // Initialiser avec des hashtags par défaut pour le MVP
      this._initDefaultHashtags();
    }
    
    // Actualiser les hashtags une fois par jour (en arrière-plan)
    this._scheduleHashtagUpdate();
  }

  /**
   * Obtenir les hashtags populaires par catégorie
   * @param {string} category - Catégorie de hashtags (optionnel)
   * @param {number} limit - Nombre maximum de hashtags à retourner
   */
  async getPopularHashtags(category = null, limit = 10) {
    try {
      const hashtagsData = this._readHashtagsData();
      
      let hashtags;
      if (category && HASHTAG_CATEGORIES.includes(category)) {
        // Retourner les hashtags de la catégorie spécifiée
        hashtags = hashtagsData.categories[category] || [];
      } else {
        // Retourner les hashtags généraux
        hashtags = hashtagsData.general || [];
      }
      
      // Limiter le nombre de hashtags retournés
      return hashtags.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des hashtags populaires:', error);
      // Retourner une liste vide en cas d'erreur
      return [];
    }
  }

  /**
   * Suggérer des hashtags basés sur le contenu d'un texte
   * @param {string} content - Contenu du post
   * @param {number} limit - Nombre maximum de hashtags à suggérer
   */
  async suggestHashtags(content, limit = 5) {
    try {
      // Lire toutes les données de hashtags
      const hashtagsData = this._readHashtagsData();
      
      // Si le contenu est vide ou trop court, retourner les hashtags généraux
      if (!content || content.length < 10) {
        return hashtagsData.general.slice(0, limit);
      }
      
      // Analyser le texte pour identifier des mots-clés pertinents
      const keywords = this._extractKeywords(content.toLowerCase());
      
      // Chercher les hashtags correspondant aux mots-clés identifiés
      let suggestedHashtags = [];
      const allHashtags = {};
      
      // Ajouter les hashtags de chaque catégorie dans un objet pour éviter les doublons
      Object.values(hashtagsData.categories).forEach(categoryHashtags => {
        categoryHashtags.forEach(hashtag => {
          allHashtags[hashtag.tag] = hashtag;
        });
      });
      
      // Pour chaque mot-clé, trouver des hashtags correspondants
      for (const keyword of keywords) {
        const matchingHashtags = Object.values(allHashtags).filter(hashtag => 
          hashtag.tag.toLowerCase().includes(keyword) || 
          hashtag.relatedKeywords.some(k => k.toLowerCase().includes(keyword))
        );
        
        // Ajouter les hashtags correspondants à la liste des suggestions
        suggestedHashtags = [...suggestedHashtags, ...matchingHashtags];
        
        // Si on a suffisamment de hashtags, arrêter la recherche
        if (suggestedHashtags.length >= limit * 2) {
          break;
        }
      }
      
      // Si on n'a pas trouvé assez de hashtags, ajouter des hashtags généraux
      if (suggestedHashtags.length < limit) {
        const remainingCount = limit - suggestedHashtags.length;
        const generalHashtags = hashtagsData.general
          .filter(h => !suggestedHashtags.some(sh => sh.tag === h.tag))
          .slice(0, remainingCount);
        
        suggestedHashtags = [...suggestedHashtags, ...generalHashtags];
      }
      
      // Éliminer les doublons et prendre les 'limit' premiers hashtags
      return this._removeDuplicates(suggestedHashtags)
        .slice(0, limit)
        .sort((a, b) => b.popularity - a.popularity);
    } catch (error) {
      console.error('Erreur lors de la suggestion de hashtags:', error);
      
      // En cas d'erreur, retourner des hashtags généraux
      const hashtagsData = this._readHashtagsData();
      return hashtagsData.general.slice(0, limit);
    }
  }

  /**
   * Extraire les mots-clés significatifs d'un texte
   * @param {string} text - Texte à analyser
   * @private
   */
  _extractKeywords(text) {
    // Liste de mots vides (stopwords) à ignorer
    const stopwords = ["le", "la", "les", "un", "une", "des", "et", "ou", "pour", "par", "sur", "dans", "en", "avec", "sans", "ce", "cette", "ces", "que", "qui", "quoi", "dont", "où", "comment", "est", "sont", "sera", "seront", "a", "ont", "avez", "avoir", "être", "fait", "faire", "plus", "moins", "très", "peu", "beaucoup", "trop", "aussi"];
    
    // Nettoyer le texte
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remplacer la ponctuation par des espaces
      .replace(/\s+/g, ' ')      // Remplacer les espaces multiples par un seul espace
      .trim();
    
    // Diviser en mots
    const words = cleanText.split(' ');
    
    // Filtrer les mots vides et les mots trop courts
    const significantWords = words.filter(word => 
      word.length > 3 && !stopwords.includes(word)
    );
    
    // Compter la fréquence de chaque mot
    const wordCounts = {};
    significantWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Trier les mots par fréquence d'apparition
    const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
    
    // Prendre les 10 mots les plus fréquents
    return sortedWords.slice(0, 10);
  }

  /**
   * Éliminer les doublons dans une liste de hashtags
   * @param {Array} hashtags - Liste de hashtags avec possibles doublons
   * @private
   */
  _removeDuplicates(hashtags) {
    const uniqueHashtags = {};
    
    // Ajouter chaque hashtag dans un objet, en utilisant le tag comme clé
    hashtags.forEach(hashtag => {
      uniqueHashtags[hashtag.tag] = hashtag;
    });
    
    // Retourner les valeurs de l'objet (hashtags uniques)
    return Object.values(uniqueHashtags);
  }

  /**
   * Initialiser les hashtags par défaut pour le MVP
   * @private
   */
  _initDefaultHashtags() {
    const defaultHashtags = {
      lastUpdated: new Date().toISOString(),
      general: [
        { tag: '#LinkedInTips', popularity: 95, relatedKeywords: ['network', 'career', 'professional'] },
        { tag: '#Leadership', popularity: 93, relatedKeywords: ['management', 'team', 'business'] },
        { tag: '#Innovation', popularity: 90, relatedKeywords: ['technology', 'future', 'trends'] },
        { tag: '#DigitalMarketing', popularity: 88, relatedKeywords: ['marketing', 'digital', 'social media'] },
        { tag: '#CareerAdvice', popularity: 87, relatedKeywords: ['job', 'career', 'professional'] },
        { tag: '#AI', popularity: 85, relatedKeywords: ['artificial intelligence', 'machine learning', 'tech'] },
        { tag: '#WorkLifeBalance', popularity: 83, relatedKeywords: ['life', 'work', 'wellness'] },
        { tag: '#EmployeeBranding', popularity: 81, relatedKeywords: ['employer', 'brand', 'recruitment'] },
        { tag: '#RemoteWork', popularity: 80, relatedKeywords: ['work from home', 'remote', 'telework'] },
        { tag: '#PersonalDevelopment', popularity: 79, relatedKeywords: ['growth', 'learning', 'skills'] }
      ],
      categories: {
        technology: [
          { tag: '#Technology', popularity: 95, relatedKeywords: ['tech', 'digital', 'innovation'] },
          { tag: '#TechTrends', popularity: 90, relatedKeywords: ['trends', 'technology', 'future'] },
          { tag: '#AI', popularity: 88, relatedKeywords: ['artificial intelligence', 'machine learning'] },
          { tag: '#CloudComputing', popularity: 85, relatedKeywords: ['cloud', 'saas', 'aws'] },
          { tag: '#Cybersecurity', popularity: 83, relatedKeywords: ['security', 'data protection', 'privacy'] },
          { tag: '#IoT', popularity: 81, relatedKeywords: ['internet of things', 'connected', 'smart'] },
          { tag: '#BigData', popularity: 80, relatedKeywords: ['data', 'analytics', 'business intelligence'] },
          { tag: '#5G', popularity: 78, relatedKeywords: ['telecom', 'mobile', 'network'] },
          { tag: '#FutureTech', popularity: 75, relatedKeywords: ['future', 'innovation', 'emerging technology'] },
          { tag: '#DigitalTransformation', popularity: 73, relatedKeywords: ['transformation', 'digital', 'change'] }
        ],
        business: [
          { tag: '#Business', popularity: 94, relatedKeywords: ['entrepreneurship', 'company', 'corporate'] },
          { tag: '#Leadership', popularity: 92, relatedKeywords: ['lead', 'management', 'executive'] },
          { tag: '#Entrepreneur', popularity: 90, relatedKeywords: ['startup', 'business', 'founder'] },
          { tag: '#Innovation', popularity: 87, relatedKeywords: ['innovative', 'disruptive', 'new'] },
          { tag: '#Management', popularity: 85, relatedKeywords: ['leader', 'executive', 'director'] },
          { tag: '#Strategy', popularity: 83, relatedKeywords: ['strategic', 'planning', 'vision'] },
          { tag: '#Startup', popularity: 81, relatedKeywords: ['entrepreneur', 'venture', 'funding'] },
          { tag: '#BusinessStrategy', popularity: 79, relatedKeywords: ['strategy', 'growth', 'planning'] },
          { tag: '#FinancialServices', popularity: 76, relatedKeywords: ['finance', 'banking', 'investment'] },
          { tag: '#ChangeManagement', popularity: 74, relatedKeywords: ['change', 'transformation', 'adapt'] }
        ],
        marketing: [
          { tag: '#Marketing', popularity: 93, relatedKeywords: ['brand', 'advertising', 'promotion'] },
          { tag: '#DigitalMarketing', popularity: 91, relatedKeywords: ['digital', 'online', 'e-marketing'] },
          { tag: '#ContentMarketing', popularity: 89, relatedKeywords: ['content', 'blog', 'strategy'] },
          { tag: '#SocialMedia', popularity: 87, relatedKeywords: ['social', 'networks', 'platforms'] },
          { tag: '#MarketingStrategy', popularity: 85, relatedKeywords: ['strategy', 'campaign', 'planning'] },
          { tag: '#SEO', popularity: 83, relatedKeywords: ['search engine optimization', 'google', 'ranking'] },
          { tag: '#BrandStrategy', popularity: 81, relatedKeywords: ['branding', 'identity', 'positioning'] },
          { tag: '#CustomerExperience', popularity: 79, relatedKeywords: ['customer', 'experience', 'satisfaction'] },
          { tag: '#B2B', popularity: 77, relatedKeywords: ['business to business', 'professional services'] },
          { tag: '#InfluencerMarketing', popularity: 75, relatedKeywords: ['influencer', 'social media', 'partnership'] }
        ],
        programming: [
          { tag: '#Programming', popularity: 90, relatedKeywords: ['code', 'development', 'software'] },
          { tag: '#JavaScript', popularity: 88, relatedKeywords: ['js', 'frontend', 'web'] },
          { tag: '#Python', popularity: 86, relatedKeywords: ['coding', 'data science', 'machine learning'] },
          { tag: '#WebDevelopment', popularity: 85, relatedKeywords: ['web', 'frontend', 'backend'] },
          { tag: '#DevOps', popularity: 83, relatedKeywords: ['development', 'operations', 'CI/CD'] },
          { tag: '#MachineLearning', popularity: 81, relatedKeywords: ['ML', 'AI', 'data science'] },
          { tag: '#CodeQuality', popularity: 79, relatedKeywords: ['clean code', 'testing', 'maintenance'] },
          { tag: '#OpenSource', popularity: 77, relatedKeywords: ['GitHub', 'contribution', 'community'] },
          { tag: '#SoftwareEngineering', popularity: 75, relatedKeywords: ['engineering', 'architecture', 'design'] },
          { tag: '#AppleCodeConference', popularity: 73, relatedKeywords: ['WWDC', 'Swift', 'iOS'] }
        ]
      }
    };
    
    // Écrire les données par défaut
    fs.writeFileSync(HASHTAGS_STORAGE_PATH, JSON.stringify(defaultHashtags, null, 2));
    console.log('Hashtags par défaut initialisés');
  }

  /**
   * Planifier la mise à jour quotidienne des hashtags populaires
   * @private
   */
  _scheduleHashtagUpdate() {
    // Dans une version production, on ferait une mise à jour depuis une API externe
    // Pour le MVP, on actualise juste la date de dernière mise à jour
    const updateHashtags = () => {
      try {
        const data = this._readHashtagsData();
        data.lastUpdated = new Date().toISOString();
        this._writeHashtagsData(data);
        console.log('Hashtags populaires mis à jour');
      } catch (error) {
        console.error('Erreur lors de la mise à jour des hashtags:', error);
      }
    };
    
    // Mise à jour chaque jour à minuit
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0
    );
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      updateHashtags();
      // Ensuite, mettre en place une mise à jour quotidienne
      setInterval(updateHashtags, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * Lire les données de hashtags depuis le stockage local
   * @private
   */
  _readHashtagsData() {
    try {
      const rawData = fs.readFileSync(HASHTAGS_STORAGE_PATH, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Erreur lors de la lecture des données de hashtags:', error);
      // En cas d'erreur, réinitialiser les hashtags par défaut
      this._initDefaultHashtags();
      return this._readHashtagsData();
    }
  }

  /**
   * Écrire les données de hashtags dans le stockage local
   * @param {Object} data - Données à écrire
   * @private
   */
  _writeHashtagsData(data) {
    try {
      fs.writeFileSync(HASHTAGS_STORAGE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Erreur lors de l\'écriture des données de hashtags:', error);
      throw new Error('Impossible d\'enregistrer les données de hashtags: ' + error.message);
    }
  }
}

module.exports = HashtagService;