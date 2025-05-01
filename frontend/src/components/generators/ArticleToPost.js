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
    
    setError('');
    setIsGenerating(true);
    
    try {
      // Appel à l'API pour générer le post (le serveur utilisera sa propre clé API)
      const response = await fetch('/api/generate/article-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          article: articleInput,
          inputType: inputType,
          tone: selectedTone
        }),
      });

      // Tenter de lire la réponse JSON
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Erreur lors de la lecture de la réponse JSON:', jsonError);
        throw new Error('Réponse invalide du serveur');
      }

      // Vérifier si la réponse est OK
      if (!response.ok) {
        // Si nous avons reçu un message d'erreur du serveur, l'utiliser
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      // Si tout est bon, on a notre post généré
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
        
        <button 
          type="submit" 
          className="generate-button"
        >
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