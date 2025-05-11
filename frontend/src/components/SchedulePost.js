// frontend/src/components/SchedulePost.js
import React, { useState } from 'react';
import './SchedulePost.css';

const SchedulePost = ({ content, linkUrl, linkTitle, linkDescription, onClose, onScheduleSuccess }) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState('');
  
  // Obtenir la date actuelle au format YYYY-MM-DD pour le min de l'input date
  const today = new Date().toISOString().split('T')[0];
  
  // Obtenir l'heure actuelle au format HH:MM pour le min de l'input time
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérification des champs
    if (!scheduledDate) {
      setError('Veuillez sélectionner une date');
      return;
    }
    
    if (!scheduledTime) {
      setError('Veuillez sélectionner une heure');
      return;
    }
    
    // Vérifier que la date + heure est dans le futur
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= now) {
      setError('La date et l\'heure de planification doivent être dans le futur');
      return;
    }
    
    // Tout est bon, on planifie le post
    setIsScheduling(true);
    setError('');
    
    // Récupérer le token LinkedIn
    const linkedInToken = localStorage.getItem('linkedInToken');
    if (!linkedInToken) {
      setError('Vous devez être connecté à LinkedIn pour planifier un post');
      setIsScheduling(false);
      return;
    }
    
    try {
      // Appel API pour planifier le post
      const response = await fetch('/api/history/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'linkedintoken': linkedInToken
        },
        body: JSON.stringify({
          content,
          scheduledTime: scheduledDateTime.toISOString(),
          linkUrl: linkUrl || null,
          linkTitle: linkTitle || null,
          linkDescription: linkDescription || null
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Succès, notification à l'utilisateur
        onScheduleSuccess(data.scheduledPost);
      } else {
        // Erreur
        throw new Error(data.message || 'Erreur lors de la planification du post');
      }
    } catch (error) {
      console.error('Erreur lors de la planification:', error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setIsScheduling(false);
    }
  };
  
  return (
    <div className="schedule-post-overlay">
      <div className="schedule-post-modal">
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <div className="schedule-post-header">
          <h2>Planifier la Publication</h2>
          <p>Choisissez quand vous souhaitez publier ce post sur LinkedIn</p>
        </div>
        
        <div className="schedule-post-preview">
          <h3>Aperçu du Post</h3>
          <div className="post-content-preview">
            {content.length > 200
              ? content.substring(0, 200) + '...'
              : content
            }
          </div>
          
          {linkUrl && (
            <div className="link-preview">
              <div className="link-info">
                <span className="link-url">{linkUrl}</span>
                {linkTitle && <span className="link-title">{linkTitle}</span>}
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="schedule-form">
          <div className="form-group">
            <label htmlFor="schedule-date">Date de publication</label>
            <input
              type="date"
              id="schedule-date"
              min={today}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              disabled={isScheduling}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="schedule-time">Heure de publication</label>
            <input
              type="time"
              id="schedule-time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              disabled={isScheduling}
              required
            />
            <small className="time-help">
              {scheduledDate === today 
                ? 'Pour aujourd\'hui, l\'heure doit être après ' + currentTime 
                : 'Heure au format 24h'
              }
            </small>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="action-buttons">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isScheduling}
            >
              Annuler
            </button>
            
            <button 
              type="submit" 
              className="schedule-button"
              disabled={isScheduling}
            >
              {isScheduling 
                ? 'Planification en cours...' 
                : 'Planifier la Publication'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulePost;