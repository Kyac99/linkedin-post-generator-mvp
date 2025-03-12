// frontend/src/components/generators/PythonToPost.js
import React, { useState } from 'react';
import './GeneratorStyles.css';

const PythonToPost = ({ onPostGenerated, setIsGenerating }) => {
  const [pythonCode, setPythonCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pythonCode.trim()) {
      setError('Veuillez entrer du code Python');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    
    try {
      // Appel à l'API pour générer le post
      const response = await fetch('/api/generate/python-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aiApiKey': localStorage.getItem('aiApiKey'),
          'aiApiType': localStorage.getItem('aiApiType') || 'claude',
        },
        body: JSON.stringify({ pythonCode }),
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
        
        <button type="submit" className="generate-button">
          Générer un post LinkedIn
        </button>
      </form>
      
      <div className="tips">
        <h3>Conseils</h3>
        <ul>
          <li>Assurez-vous que votre code est bien indenté et commenté pour de meilleurs résultats.</li>
          <li>Pour du code long, il est préférable de sélectionner une section spécifique et intéressante.</li>
          <li>Incluez une introduction ou description de ce que fait le code pour un contexte plus riche.</li>
          <li>Le post généré expliquera le code de manière accessible pour vos connexions LinkedIn.</li>
        </ul>
      </div>
    </div>
  );
};

export default PythonToPost;
