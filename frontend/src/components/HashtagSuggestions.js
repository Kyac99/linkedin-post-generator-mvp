// frontend/src/components/HashtagSuggestions.js
import React, { useState, useEffect } from 'react';
import './HashtagSuggestions.css';

const HashtagSuggestions = ({ postContent, onSelectHashtag }) => {
  const [hashtags, setHashtags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Charger les catégories au chargement du composant
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Effectuer la suggestion de hashtags basée sur le contenu du post
  useEffect(() => {
    if (postContent && postContent.length > 20) {
      suggestHashtagsFromContent(postContent);
    }
  }, [postContent]);
  
  // Charger les hashtags d'une catégorie quand la catégorie change
  useEffect(() => {
    if (selectedCategory) {
      fetchHashtagsByCategory(selectedCategory);
    }
  }, [selectedCategory]);
  
  // Récupérer les catégories de hashtags
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/hashtags/categories');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des catégories');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erreur catégories de hashtags:', error);
      setError('Impossible de charger les catégories de hashtags');
    }
  };
  
  // Récupérer les hashtags d'une catégorie spécifique
  const fetchHashtagsByCategory = async (category) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/hashtags/popular?category=${category}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des hashtags');
      }
      
      const data = await response.json();
      setHashtags(data.hashtags || []);
    } catch (error) {
      console.error('Erreur hashtags par catégorie:', error);
      setError('Impossible de charger les hashtags pour cette catégorie');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Suggérer des hashtags basés sur le contenu du post
  const suggestHashtagsFromContent = async (content) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/hashtags/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suggestion de hashtags');
      }
      
      const data = await response.json();
      setHashtags(data.hashtags || []);
      setSelectedCategory(null); // Réinitialiser la catégorie sélectionnée
    } catch (error) {
      console.error('Erreur suggestion de hashtags:', error);
      setError('Impossible de suggérer des hashtags basés sur votre contenu');
      // Fallback aux hashtags populaires généraux
      fetchHashtagsByCategory('technology');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gérer la sélection d'une catégorie
  const handleCategorySelect = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      suggestHashtagsFromContent(postContent);
    } else {
      setSelectedCategory(categoryId);
    }
  };
  
  return (
    <div className="hashtag-suggestions">
      <div className="hashtag-header">
        <h3>Suggestions de Hashtags</h3>
        {postContent && postContent.length > 20 && !selectedCategory && (
          <span className="auto-suggestion-badge">Auto</span>
        )}
      </div>
      
      <div className="categories-list">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategorySelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {error && <div className="suggestion-error">{error}</div>}
      
      <div className="hashtags-container">
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner-small"></div>
          </div>
        ) : hashtags.length > 0 ? (
          <div className="hashtags-grid">
            {hashtags.map(hashtag => (
              <button 
                key={hashtag.tag}
                className="hashtag-button"
                onClick={() => onSelectHashtag(hashtag.tag)}
              >
                {hashtag.tag}
                {hashtag.popularity && (
                  <span className="popularity-indicator" style={{ 
                    width: `${Math.min(hashtag.popularity, 100)}%` 
                  }}></span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="no-hashtags">
            Aucun hashtag disponible pour le moment
          </div>
        )}
      </div>
      
      <div className="hashtag-tip">
        <i className="fas fa-lightbulb"></i>
        <span>Cliquez sur un hashtag pour l'ajouter à votre post</span>
      </div>
    </div>
  );
};

export default HashtagSuggestions;