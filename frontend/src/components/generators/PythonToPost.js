// frontend/src/components/generators/PythonToPost.js
import React, { useState, useEffect } from 'react';
import './GeneratorStyles.css';

const PythonToPost = ({ onPostGenerated, setIsGenerating, selectedTone }) => {
  const [pythonCode, setPythonCode] = useState('');
  const [error, setError] = useState('');
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState(false);

  // Vérifier si une clé API est configurée au chargement du composant
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('aiApiKey');
      if (apiKey && apiKey.trim() !== '') {
        setIsApiKeyConfigured(true);
        setError('');
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
    
    if (!pythonCode.trim()) {
      setError('Veuillez entrer du code Python');
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
      const response = await fetch('/api/generate/python-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aiApiKey': apiKey,
          'aiApiType': apiType,
        },
        body: JSON.stringify({ 
          pythonCode,
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
      <h2>Code Python vers Post LinkedIn</h2>
      
      {!isApiKeyConfigured && (
        <div className="api-key-warning">
          <p>⚠️ Aucune clé API n'est configurée. Veuillez configurer une clé API dans les <a href="/settings">paramètres</a>.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <textarea
          className="input-field code-input"
          placeholder="Collez votre code Python ici..."
          value={pythonCode}
          onChange={(e) => setPythonCode(e.target.value)}
          rows={12}
          style={{ fontFamily: 'monospace' }}
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
          <li>Assurez-vous que votre code est bien indenté et commenté pour de meilleurs résultats.</li>
          <li>Pour du code long, il est préférable de sélectionner une section spécifique et intéressante.</li>
          <li>Le ton {selectedTone} sera utilisé pour adapter la présentation technique du code.</li>
          <li>Vous pourrez toujours modifier le post généré avant de le publier.</li>
          <li>Les posts techniques avec un ton {selectedTone === 'informatif' ? 'informatif' : 'professionnel'} tendent à mieux performer.</li>
        </ul>
      </div>
    </div>
  );
};

export default PythonToPost;
