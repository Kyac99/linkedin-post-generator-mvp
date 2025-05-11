// frontend/src/components/history/PostHistory.js
import React from 'react';
import './HistoryStyles.css';

const PostHistory = ({ posts, onSelectPost, selectedPostId }) => {
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

  return (
    <div className="post-history">
      <h2>Historique des Posts</h2>
      
      {posts.length === 0 ? (
        <div className="empty-state">
          <i className="far fa-file-alt empty-icon"></i>
          <p>Aucun post dans l'historique.</p>
          <p className="empty-subtext">Les posts publiés apparaîtront ici.</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map(post => (
            <div 
              key={post.id} 
              className={`post-card mini ${selectedPostId === post.id ? 'selected' : ''}`}
              onClick={() => onSelectPost(post)}
            >
              <div className="post-header">
                <div className="post-time">
                  <i className="far fa-calendar-check"></i>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                <div className="post-status">
                  <span className="status-indicator published"></span>
                  <span className="status-text">Publié</span>
                </div>
              </div>
              
              <div className="post-preview">
                <p>{post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</p>
              </div>
              
              <div className="post-footer">
                {post.metadata && post.metadata.type && (
                  <span className="post-type">
                    {post.metadata.type === 'article' && <i className="far fa-newspaper"></i>}
                    {post.metadata.type === 'idea' && <i className="far fa-lightbulb"></i>}
                    {post.metadata.type === 'youtube' && <i className="fab fa-youtube"></i>}
                    {post.metadata.type === 'python' && <i className="fab fa-python"></i>}
                    {post.metadata.type === 'article' && 'Post depuis Article'}
                    {post.metadata.type === 'idea' && 'Post depuis Idée'}
                    {post.metadata.type === 'youtube' && 'Post depuis YouTube'}
                    {post.metadata.type === 'python' && 'Post depuis Code Python'}
                  </span>
                )}
                <button className="view-details-button">
                  Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostHistory;