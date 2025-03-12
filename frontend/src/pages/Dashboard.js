// frontend/src/pages/Dashboard.js
import React, { useState } from 'react';
import ArticleToPost from '../components/generators/ArticleToPost';
import IdeaToPost from '../components/generators/IdeaToPost';
import YouTubeToPost from '../components/generators/YouTubeToPost';
import PythonToPost from '../components/generators/PythonToPost';
import PostPreview from '../components/PostPreview';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('article');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const handlePostGenerated = (postContent) => {
    setGeneratedPost(postContent);
    setNotification({ 
      show: true, 
      type: 'success', 
      message: 'Post généré avec succès!' 
    });
    
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handlePublish = async () => {
    if (!generatedPost) {
      setNotification({ 
        show: true, 
        type: 'error', 
        message: 'Veuillez d\'abord générer un post!' 
      });
      return;
    }

    setIsPosting(true);
    
    try {
      // Appel à l'API pour publier sur LinkedIn
      const response = await fetch('/api/linkedin/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'linkedinToken': localStorage.getItem('linkedInToken')
        },
        body: JSON.stringify({ content: generatedPost }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNotification({ 
          show: true, 
          type: 'success', 
          message: 'Post publié avec succès sur LinkedIn!' 
        });
        setGeneratedPost('');
      } else {
        throw new Error(data.message || 'Erreur lors de la publication');
      }
    } catch (error) {
      console.error('Publication error:', error);
      setNotification({ 
        show: true, 
        type: 'error', 
        message: `Erreur: ${error.message}` 
      });
    } finally {
      setIsPosting(false);
      
      // Masquer la notification après 3 secondes
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    }
  };

  const renderTabContent = () => {
    const commonProps = {
      onPostGenerated: handlePostGenerated,
      setIsGenerating,
    };

    switch (activeTab) {
      case 'article':
        return <ArticleToPost {...commonProps} />;
      case 'idea':
        return <IdeaToPost {...commonProps} />;
      case 'youtube':
        return <YouTubeToPost {...commonProps} />;
      case 'python':
        return <PythonToPost {...commonProps} />;
      default:
        return <ArticleToPost {...commonProps} />;
    }
  };

  return (
    <div className="dashboard">
      <h1>Générateur de Posts LinkedIn</h1>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={activeTab === 'article' ? 'active' : ''} 
          onClick={() => setActiveTab('article')}
        >
          Article vers Post
        </button>
        <button 
          className={activeTab === 'idea' ? 'active' : ''} 
          onClick={() => setActiveTab('idea')}
        >
          Idée de Post
        </button>
        <button 
          className={activeTab === 'youtube' ? 'active' : ''} 
          onClick={() => setActiveTab('youtube')}
        >
          YouTube vers Post
        </button>
        <button 
          className={activeTab === 'python' ? 'active' : ''} 
          onClick={() => setActiveTab('python')}
        >
          Code Python vers Post
        </button>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
      
      {generatedPost && (
        <div className="preview-section">
          <h2>Aperçu du Post</h2>
          <PostPreview content={generatedPost} />
          
          <button 
            className="publish-button" 
            onClick={handlePublish}
            disabled={isPosting}
          >
            {isPosting ? 'Publication en cours...' : 'Publier sur LinkedIn'}
          </button>
        </div>
      )}
      
      {isGenerating && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Génération du post en cours...</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
