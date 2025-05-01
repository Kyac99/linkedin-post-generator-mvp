// frontend/src/components/generators/IdeaToPost.js
import React, { useState } from 'react';
import './GeneratorStyles.css';

const IdeaToPost = ({ onPostGenerated, setIsGenerating, selectedTone }) => {
  const [ideaInput, setIdeaInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ideaInput.trim()) {
      setError('Veuillez entrer une idée de post');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    
    try {
      // Appel à l'API pour générer le post (le serveur utilisera sa propre clé API)
      const response = await fetch('/api/generate/idea-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idea: ideaInput,
          tone: selectedTone
        }),
      });

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
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