// frontend/src/pages/History.js
import React, { useState, useEffect } from 'react';
import ScheduledPosts from '../components/history/ScheduledPosts';
import PostHistory from '../components/history/PostHistory';
import PostStats from '../components/history/PostStats';
import './History.css';

const History = () => {
  const [activeTab, setActiveTab] = useState('scheduled');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [postHistory, setPostHistory] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postStats, setPostStats] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Charger les posts planifiés et l'historique
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const token = localStorage.getItem('linkedInToken');
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      if (activeTab === 'scheduled') {
        await fetchScheduledPosts(token);
      } else if (activeTab === 'history') {
        await fetchPostHistory(token);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScheduledPosts = async (token) => {
    const response = await fetch('/api/history/scheduled', {
      headers: {
        'linkedintoken': token
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des posts planifiés');
    }

    const data = await response.json();
    setScheduledPosts(data);
  };

  const fetchPostHistory = async (token) => {
    const response = await fetch('/api/history/posts', {
      headers: {
        'linkedintoken': token
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'historique des posts');
    }

    const data = await response.json();
    setPostHistory(data.posts || []);
  };

  const fetchPostStats = async (postId) => {
    const token = localStorage.getItem('linkedInToken');
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/history/posts/${postId}/stats`, {
        headers: {
          'linkedintoken': token
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques du post');
      }

      const data = await response.json();
      setPostStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setError('Erreur lors du chargement des statistiques. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSelect = (post) => {
    setSelectedPost(post);
    if (post && post.id) {
      fetchPostStats(post.id);
    } else {
      setPostStats(null);
    }
  };

  const handleCancelScheduledPost = async (postId) => {
    const token = localStorage.getItem('linkedInToken');
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/history/scheduled/${postId}`, {
        method: 'DELETE',
        headers: {
          'linkedintoken': token
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation du post planifié');
      }

      // Mettre à jour la liste des posts planifiés
      await fetchScheduledPosts(token);
      
      // Afficher un message de succès
      setNotification({
        show: true,
        type: 'success',
        message: 'Post planifié annulé avec succès'
      });
      
      // Masquer la notification après 3 secondes
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de l\'annulation du post planifié:', error);
      setError('Erreur lors de l\'annulation du post planifié. Veuillez réessayer.');
      
      // Afficher un message d'erreur
      setNotification({
        show: true,
        type: 'error',
        message: 'Erreur lors de l\'annulation du post planifié'
      });
      
      // Masquer la notification après 3 secondes
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="history-page">
      <h1>Gestion des Posts LinkedIn</h1>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={activeTab === 'scheduled' ? 'active' : ''} 
          onClick={() => setActiveTab('scheduled')}
        >
          Posts Planifiés
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          Historique des Posts
        </button>
      </div>
      
      <div className="tab-content">
        {error && <div className="error-message">{error}</div>}
        
        {isLoading ? (
          <div className="loading">Chargement en cours...</div>
        ) : (
          <>
            {activeTab === 'scheduled' && (
              <ScheduledPosts 
                posts={scheduledPosts}
                onCancelPost={handleCancelScheduledPost}
                onRefresh={fetchData}
              />
            )}
            
            {activeTab === 'history' && (
              <div className="history-container">
                <PostHistory 
                  posts={postHistory}
                  onSelectPost={handlePostSelect}
                  selectedPostId={selectedPost?.id}
                />
                
                {selectedPost && (
                  <PostStats 
                    post={selectedPost}
                    stats={postStats}
                    isLoading={isLoading}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;