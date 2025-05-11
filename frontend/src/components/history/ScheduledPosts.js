// frontend/src/components/history/ScheduledPosts.js
import React, { useState } from 'react';
import './HistoryStyles.css';

const ScheduledPosts = ({ posts, onCancelPost, onRefresh }) => {
  const [expandedPostId, setExpandedPostId] = useState(null);
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  const getTimeRemaining = (scheduledTime) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diff = scheduled - now;
    
    if (diff <= 0) {
      return 'Programmé pour publication imminente';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeString = '';
    
    if (days > 0) {
      timeString += `${days} jour${days > 1 ? 's' : ''} `;
    }
    
    if (hours > 0 || days > 0) {
      timeString += `${hours} heure${hours > 1 ? 's' : ''} `;
    }
    
    timeString += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    return `Publication dans ${timeString}`;
  };
  
  const toggleExpand = (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
    }
  };
  
  const handleCancelClick = (postId, event) => {
    event.stopPropagation(); // Empêcher le déclenchement du toggle
    
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce post planifié ?')) {
      onCancelPost(postId);
    }
  };
  
  return (
    <div className="scheduled-posts">
      <div className="header-with-action">
        <h2>Posts Planifiés</h2>
        <button className="refresh-button" onClick={onRefresh}>
          <i className="fas fa-sync-alt"></i> Actualiser
        </button>
      </div>
      
      {posts.length === 0 ? (
        <div className="empty-state">
          <i className="far fa-calendar-alt empty-icon"></i>
          <p>Aucun post planifié pour le moment.</p>
          <p className="empty-subtext">Vous pouvez planifier des posts depuis le générateur en choisissant une date et heure future.</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map(post => (
            <div 
              key={post.id} 
              className={`post-card ${expandedPostId === post.id ? 'expanded' : ''}`}
              onClick={() => toggleExpand(post.id)}
            >
              <div className="post-header">
                <div className="post-time">
                  <i className="far fa-clock"></i>
                  <span>{formatDate(post.scheduledTime)}</span>
                </div>
                <div className="post-status">
                  <span className="status-indicator pending"></span>
                  <span className="status-text">En attente</span>
                </div>
              </div>
              
              <div className="post-preview">
                <p>{post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}</p>
              </div>
              
              <div className="post-footer">
                <span className="time-remaining">{getTimeRemaining(post.scheduledTime)}</span>
                <button 
                  className="cancel-button"
                  onClick={(e) => handleCancelClick(post.id, e)}
                >
                  Annuler
                </button>
              </div>
              
              {expandedPostId === post.id && (
                <div className="post-expanded-content">
                  <div className="section">
                    <h4>Contenu complet</h4>
                    <div className="content-box">
                      {post.content.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  </div>
                  
                  {post.linkData && (
                    <div className="section">
                      <h4>Lien inclus</h4>
                      <div className="link-preview">
                        <div className="link-details">
                          <div className="link-title">{post.linkData.title || post.linkData.url}</div>
                          {post.linkData.description && (
                            <div className="link-description">{post.linkData.description}</div>
                          )}
                          <a href={post.linkData.url} target="_blank" rel="noopener noreferrer" className="link-url">
                            {post.linkData.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="section">
                    <h4>Informations supplémentaires</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Créé le:</span>
                        <span className="info-value">{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">ID:</span>
                        <span className="info-value">{post.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledPosts;