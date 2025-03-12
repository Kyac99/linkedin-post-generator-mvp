// frontend/src/components/generators/IdeaToPost.js
import React, { useState } from 'react';
import './GeneratorStyles.css';

const IdeaToPost = ({ onPostGenerated, setIsGenerating }) => {
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!idea.trim()) {
      setError('Veuillez entrer une idée de post');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    
    try {
      // Appel à l'API pour générer le post
      const response = await fetch('/api/generate/idea-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aiApiKey': localStorage.getItem('aiApiKey'),
          'aiApiType': localStorage.getItem('aiApiType') || 'claude',
        },
        body: JSON.stringify({ idea }),
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
      <h2>Transformer une idée en Post LinkedIn</h2>
      
      <form onSubmit={handleSubmit}>
        <textarea
          className="input-field"
          placeholder="Entrez votre idée de post ici..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={6}
        />
        
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="generate-button">
          Générer un post LinkedIn
        </button>
      </form>
      
      <div className="tips">
        <h3>Conseils</h3>
        <ul>
          <li>Soyez précis sur le sujet que vous souhaitez aborder.</li>
          <li>Incluez les points clés ou messages que vous voulez communiquer.</li>
          <li>Mentionnez le ton souhaité (professionnel, inspirant, éducatif, etc.).</li>
          <li>Indiquez votre audience cible pour un contenu plus pertinent.</li>
        </ul>
      </div>
    </div>
  );
};

export default IdeaToPost;
