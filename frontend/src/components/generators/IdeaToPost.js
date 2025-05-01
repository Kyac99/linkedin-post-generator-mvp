// frontend/src/components/generators/IdeaToPost.js
import React, { useState, useEffect } from 'react';
import './GeneratorStyles.css';

const IdeaToPost = ({ onPostGenerated, setIsGenerating, selectedTone }) => {
  const [ideaInput, setIdeaInput] = useState('');
  const [error, setError] = useState('');
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(false);

  // Vérifier si une clé API est configurée au chargement du composant
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('aiApiKey');
      if (apiKey && apiKey.trim() !== '') {
        setIsApiKeyConfigured(true);
      } else {
        setIsApiKeyConfigured(false);
        setError('Veuillez configurer une clé API dans les paramètres');
      }
    };

    checkApiKey();
    // Vérifier à nouveau la clé API toutes les 5 secondes au cas où l'utilisateur la configure dans un autre onglet
    const interval = setInterval(checkApiKey, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ideaInput.trim()) {
      setError('Veuillez entrer une idée de post');
      return;
    }
    
    // Vérifier à nouveau si une clé API est configurée
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
      const response = await fetch('/api/generate/idea-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aiApiKey': apiKey,
          'aiApiType': apiType,
        },
        body: JSON.stringify({
          idea: ideaInput,
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
      <h2>Idée de Post LinkedIn</h2>
      
      {!isApiKeyConfigured && (
        <div className="api-key-warning">
          <p>⚠️ Aucune clé API n'est configurée. Veuillez configurer une clé API dans les <a href="/settings">paramètres</a>.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <textarea
          className="input-field"
          placeholder="Décrivez votre idée de post LinkedIn..."
          value={ideaInput}
          onChange={(e) => setIdeaInput(e.target.value)}
          rows={6}
        />
        
        {error && <p className="error-message">{error}</p>}
        
        <button 
          type="submit" 
          className="generate-button"
          disabled={!isApiKeyConfigured}
        >
          Générer un post {selectedTone && `(Ton: ${selectedTone})`}
        </button>
      </form>
      
      <div className="tips">
        <h3>Conseils</h3>
        <ul>
          <li>Soyez précis dans la description de votre idée.</li>
          <li>Incluez des éléments clés que vous souhaitez voir dans le post.</li>
          <li>Vous pourrez modifier le post avant de le publier.</li>
          <li>Le ton sélectionné influence le style d'écriture du post.</li>
        </ul>
      </div>
    </div>
  );
};

export default IdeaToPost;