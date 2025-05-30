// frontend/src/components/generators/YouTubeToPost.js
import React, { useState } from 'react';
import './GeneratorStyles.css';

const YouTubeToPost = ({ onPostGenerated, setIsGenerating, selectedTone }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [includeTranscription, setIncludeTranscription] = useState(false);
  const [error, setError] = useState('');

  // Valider l'URL YouTube
  const isValidYoutubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*$/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      setError('Veuillez entrer une URL YouTube');
      return;
    }
    
    if (!isValidYoutubeUrl(videoUrl)) {
      setError('L\'URL saisie ne semble pas être une URL YouTube valide');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    
    try {
      // Appel à l'API pour générer le post (le serveur utilisera sa propre clé API)
      const response = await fetch('/api/generate/youtube-to-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl,
          transcription: includeTranscription ? transcription : null,
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
      <h2>YouTube vers Post LinkedIn</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          className="input-field"
          placeholder="Entrez l'URL de la vidéo YouTube..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        
        <div className="transcription-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={includeTranscription}
              onChange={() => setIncludeTranscription(!includeTranscription)}
            />
            <span>J'ai une transcription de la vidéo</span>
          </label>
        </div>
        
        {includeTranscription && (
          <textarea
            className="input-field"
            placeholder="Collez la transcription de la vidéo ici pour de meilleurs résultats..."
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            rows={8}
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
          <li>Pour de meilleurs résultats, utilisez des vidéos avec un contenu clair et pertinent.</li>
          <li>Fournir une transcription peut améliorer significativement la qualité du post généré.</li>
          <li>Les vidéos courtes ou moyennes (moins de 15 minutes) donnent généralement de meilleurs résultats.</li>
          <li>Le post sera généré avec le ton {selectedTone} que vous avez sélectionné.</li>
          <li>Le post inclura automatiquement le lien vers la vidéo YouTube.</li>
        </ul>
      </div>
    </div>
  );
};

export default YouTubeToPost;