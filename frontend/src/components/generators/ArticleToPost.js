// frontend/src/components/generators/ArticleToPost.js
import React, { useState } from 'react';
import './GeneratorStyles.css';

const ArticleToPost = ({ onPostGenerated, setIsGenerating, selectedTone }) => {
  const [articleInput, setArticleInput] = useState('');
  const [inputType, setInputType] = useState('text'); // 'text' ou 'url'
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!articleInput.trim()) {
      setError('Veuillez entrer un article ou une URL');
      return;
    }
    
    // Vérifier si une clé API est configurée
    const apiKey = localStorage.getItem('aiApiKey');
    const apiType = localStorage.getItem('aiApiType') || 'claude';
    
    if (!apiKey || apiKey.trim() === '') {
      setError('Veuillez configurer une clé API dans les paramètres');
      return;
    }
    
    console.log(`Utilisation de la clé API ${apiType}:`, apiKey.substring(0, 5) + '...');
    
    setError('');
    setIsGenerating(true);
    
    try {
      // Appel à l'API pour générer le post
      const response = await fetch('/api/generate/article-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aiApiKey': apiKey,
          'aiApiType': apiType,
        },
        body: JSON.stringify({
          article: articleInput,
          inputType: inputType,
          tone: selectedTone
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la génération du post');
      }
      
      onPostGenerated(data.generatedPost);
    } catch (error) {
      console.error('Generation error:', error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="generator-container">
      <h2>Article vers Post LinkedIn</h2>
      
      <div className="input-type-selector">
        <button 
          className={inputType === 'text' ? 'active' : ''} 
          onClick={() => setInputType('text')}
          type="button"
        >
          Texte de l'article
        </button>
        <button 
          className={inputType === 'url' ? 'active' : ''} 
          onClick={() => setInputType('url')}
          type="button"
        >
          URL de l'article
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {inputType === 'text' ? (
          <textarea
            className="input-field"
            placeholder="Collez le texte de l'article ici..."
            value={articleInput}
            onChange={(e) => setArticleInput(e.target.value)}
            rows={10}
          />
        ) : (
          <input
            type="url"
            className="input-field"
            placeholder="Entrez l'URL de l'article..."
            value={articleInput}
            onChange={(e) => setArticleInput(e.target.value)}
          />
        )}
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="generate-button">
          Générer un post {selectedTone && `(Ton: ${selectedTone})`}
        </button>
      </form>
      
      <div className="tips">
        <h3>Conseils</h3>
        <ul>
          <li>Pour de meilleurs résultats, utilisez des articles complets et pertinents.</li>
          <li>Le post généré mettra en avant les points clés de l'article.</li>
          <li>Vous pourrez modifier le post avant de le publier.</li>
          <li>Le ton sélectionné influence le style d'écriture du post.</li>
        </ul>
      </div>
    </div>
  );
};

export default ArticleToPost;