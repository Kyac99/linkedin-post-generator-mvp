// frontend/src/components/history/PostStats.js
import React from 'react';
import './HistoryStyles.css';

const PostStats = ({ post, stats, isLoading }) => {
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

  // Formater un nombre avec des séparateurs de milliers
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="post-stats">
      <h2>Détails du Post</h2>
      
      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      ) : (
        post && (
          <div className="stats-container">
            <div className="post-content-section">
              <div className="post-content">
                {post.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
            
            <div className="metrics-section">
              <h3>Statistiques d'engagement</h3>
              
              {stats ? (
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-icon">
                      <i className="far fa-thumbs-up"></i>
                    </div>
                    <div className="metric-value">{formatNumber(stats.stats.likes)}</div>
                    <div className="metric-label">Likes</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">
                      <i className="far fa-comment"></i>
                    </div>
                    <div className="metric-value">{formatNumber(stats.stats.comments)}</div>
                    <div className="metric-label">Commentaires</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">
                      <i className="fas fa-share"></i>
                    </div>
                    <div className="metric-value">{formatNumber(stats.stats.shares)}</div>
                    <div className="metric-label">Partages</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">
                      <i className="far fa-eye"></i>
                    </div>
                    <div className="metric-value">{formatNumber(stats.stats.views)}</div>
                    <div className="metric-label">Vues</div>
                  </div>
                </div>
              ) : (
                <div className="no-stats-message">
                  <p>Les statistiques détaillées ne sont pas encore disponibles pour ce post.</p>
                  <p>Elles sont généralement mises à jour quelques heures après la publication.</p>
                </div>
              )}
            </div>
            
            <div className="post-details-section">
              <h3>Informations du Post</h3>
              
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-label">ID du Post LinkedIn</div>
                  <div className="detail-value">{post.id}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Date de Publication</div>
                  <div className="detail-value">{formatDate(post.createdAt)}</div>
                </div>
                
                {post.metadata && (
                  <>
                    {post.metadata.type && (
                      <div className="detail-item">
                        <div className="detail-label">Type de Source</div>
                        <div className="detail-value">
                          {post.metadata.type === 'article' && 'Article'}
                          {post.metadata.type === 'idea' && 'Idée'}
                          {post.metadata.type === 'youtube' && 'Vidéo YouTube'}
                          {post.metadata.type === 'python' && 'Code Python'}
                        </div>
                      </div>
                    )}
                    
                    {post.metadata.tone && (
                      <div className="detail-item">
                        <div className="detail-label">Ton</div>
                        <div className="detail-value">{post.metadata.tone}</div>
                      </div>
                    )}
                    
                    {post.metadata.apiType && (
                      <div className="detail-item">
                        <div className="detail-label">API Utilisée</div>
                        <div className="detail-value">
                          {post.metadata.apiType === 'claude' ? 'Claude AI' : 'OpenAI'}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {stats && (
                  <div className="detail-item">
                    <div className="detail-label">Dernière Mise à Jour</div>
                    <div className="detail-value">{formatDate(stats.lastUpdated)}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="actions-section">
              <a 
                href={`https://www.linkedin.com/feed/update/${post.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-on-linkedin"
              >
                <i className="fab fa-linkedin"></i> Voir sur LinkedIn
              </a>
            </div>
          </div>
        )
      )}
      
      {!post && !isLoading && (
        <div className="empty-state">
          <i className="far fa-chart-bar empty-icon"></i>
          <p>Sélectionnez un post pour voir ses statistiques</p>
        </div>
      )}
    </div>
  );
};

export default PostStats;