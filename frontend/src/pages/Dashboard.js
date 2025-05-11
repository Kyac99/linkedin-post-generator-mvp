// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import ArticleToPost from '../components/generators/ArticleToPost';
import IdeaToPost from '../components/generators/IdeaToPost';
import YouTubeToPost from '../components/generators/YouTubeToPost';
import PythonToPost from '../components/generators/PythonToPost';
import PostPreview from '../components/PostPreview';
import HashtagSuggestions from '../components/HashtagSuggestions';
import SchedulePost from '../components/SchedulePost';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('article');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [selectedTone, setSelectedTone] = useState('professionnel');
  const [includeLink, setIncludeLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [linkedInError, setLinkedInError] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Récupérer le profil utilisateur au chargement
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('linkedInToken');
        if (!token) return;

        const response = await fetch('/api/linkedin/profile', {
          headers: {
            'linkedintoken': token
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.profile);
          setLinkedInError(false);
        } else {
          // Token révoqué ou expiré
          if (response.status === 401) {
            console.warn("Token LinkedIn révoqué ou expiré");
            setLinkedInError(true);
            // Optionnel : Effacer le token stocké puisqu'il n'est plus valide
            localStorage.removeItem('linkedInToken');
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
        setLinkedInError(true);
      }
    };

    fetchUserProfile();
  }, []);

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

    if (includeLink && !linkUrl) {
      setNotification({ 
        show: true, 
        type: 'error', 
        message: 'Veuillez saisir une URL pour le lien!' 
      });
      return;
    }

    // Vérifier si l'utilisateur est connecté à LinkedIn
    const linkedInToken = localStorage.getItem('linkedInToken');
    if (!linkedInToken) {
      setNotification({ 
        show: true, 
        type: 'error', 
        message: 'Vous devez d\'abord vous connecter à LinkedIn dans les paramètres' 
      });
      return;
    }

    setIsPosting(true);
    
    try {
      // Déterminer l'endpoint en fonction de l'inclusion d'un lien
      const endpoint = includeLink ? '/api/linkedin/publish-with-link' : '/api/linkedin/publish';
      const body = includeLink 
        ? { content: generatedPost, linkUrl, linkTitle, linkDescription }
        : { content: generatedPost };
      
      // Appel à l'API pour publier sur LinkedIn
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'linkedintoken': linkedInToken
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNotification({ 
          show: true, 
          type: 'success', 
          message: 'Post publié avec succès sur LinkedIn!' 
        });
        setGeneratedPost('');
        setIncludeLink(false);
        setLinkUrl('');
        setLinkTitle('');
        setLinkDescription('');
      } else {
        // Si erreur 401, c'est que le token est expiré ou révoqué
        if (response.status === 401) {
          setLinkedInError(true);
          localStorage.removeItem('linkedInToken');
          throw new Error('Votre session LinkedIn a expiré. Veuillez vous reconnecter dans les paramètres.');
        } else {
          throw new Error(data.message || 'Erreur lors de la publication');
        }
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

  const handleScheduleSuccess = (scheduledPost) => {
    setShowScheduleModal(false);
    setNotification({
      show: true,
      type: 'success',
      message: `Post planifié pour le ${new Date(scheduledPost.scheduledTime).toLocaleString('fr-FR')}`
    });
    
    // Réinitialiser le formulaire
    setGeneratedPost('');
    setIncludeLink(false);
    setLinkUrl('');
    setLinkTitle('');
    setLinkDescription('');
    
    // Masquer la notification après 3 secondes
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleHashtagSelect = (hashtag) => {
    // Ajouter le hashtag à la fin du post
    setGeneratedPost(prev => {
      // Si le hashtag est déjà présent, ne pas l'ajouter à nouveau
      if (prev.includes(hashtag)) {
        return prev;
      }
      
      // Ajouter le hashtag avec un espace avant s'il n'est pas déjà présent à la fin
      if (prev.endsWith(hashtag) || prev.endsWith(hashtag + '\n')) {
        return prev;
      }
      
      // Ajouter à la fin ou sur une nouvelle ligne si c'est le premier hashtag
      const hasHashtags = /#\w+/.test(prev);
      
      if (hasHashtags) {
        // Si le post contient déjà des hashtags, ajouter le nouveau avec un espace
        return prev + ' ' + hashtag;
      } else {
        // Sinon, ajouter sur une nouvelle ligne
        return prev + '\n\n' + hashtag;
      }
    });
  };

  const renderTabContent = () => {
    const commonProps = {
      onPostGenerated: handlePostGenerated,
      setIsGenerating,
      selectedTone,
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

  const tones = [
    { value: 'professionnel', label: 'Professionnel' },
    { value: 'casual', label: 'Décontracté' },
    { value: 'inspirant', label: 'Inspirant' },
    { value: 'informatif', label: 'Informatif' },
    { value: 'humoristique', label: 'Humoristique' },
    { value: 'formel', label: 'Formel' },
    { value: 'storytelling', label: 'Storytelling' }
  ];

  return (
    <div className="dashboard">
      <h1>Générateur de Posts LinkedIn</h1>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {linkedInError && (
        <div className="linkedin-error-banner">
          <span>Votre session LinkedIn a expiré. Veuillez vous reconnecter dans les paramètres.</span>
        </div>
      )}
      
      {userProfile && (
        <div className="user-profile-banner">
          <span>Connecté en tant que: {userProfile.localizedFirstName} {userProfile.localizedLastName}</span>
        </div>
      )}
      
      <div className="tone-selector">
        <label htmlFor="tone-select">Ton du post:</label>
        <select 
          id="tone-select" 
          value={selectedTone} 
          onChange={(e) => setSelectedTone(e.target.value)}
          disabled={isGenerating}
        >
          {tones.map(tone => (
            <option key={tone.value} value={tone.value}>{tone.label}</option>
          ))}
        </select>
      </div>
      
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
          
          <div className="preview-content-wrapper">
            <div className="preview-main">
              <PostPreview 
                content={generatedPost} 
                setContent={setGeneratedPost}
              />
              
              <div className="link-options">
                <label className="include-link-checkbox">
                  <input
                    type="checkbox"
                    checked={includeLink}
                    onChange={(e) => setIncludeLink(e.target.checked)}
                    disabled={isPosting}
                  />
                  Inclure un lien dans le post
                </label>
                
                {includeLink && (
                  <div className="link-fields">
                    <div className="form-group">
                      <label htmlFor="link-url">URL du lien*</label>
                      <input
                        id="link-url"
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        required
                        disabled={isPosting}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="link-title">Titre du lien</label>
                      <input
                        id="link-title"
                        type="text"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        placeholder="Titre de votre lien (optionnel)"
                        disabled={isPosting}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="link-description">Description du lien</label>
                      <textarea
                        id="link-description"
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        placeholder="Brève description du lien (optionnel)"
                        disabled={isPosting}
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="preview-sidebar">
              <HashtagSuggestions 
                postContent={generatedPost} 
                onSelectHashtag={handleHashtagSelect}
              />
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="publish-button" 
              onClick={handlePublish}
              disabled={isPosting || linkedInError}
            >
              {isPosting ? 'Publication en cours...' : 'Publier maintenant'}
            </button>
            
            <button 
              className="schedule-button" 
              onClick={() => setShowScheduleModal(true)}
              disabled={isPosting || linkedInError}
            >
              <i className="far fa-calendar-alt"></i> Planifier
            </button>
            
            <Link to="/history" className="history-link">
              <i className="far fa-clock"></i> Posts planifiés
            </Link>
          </div>
          
          {linkedInError && (
            <p className="error-message">Vous devez vous reconnecter à LinkedIn dans les paramètres avant de pouvoir publier.</p>
          )}
        </div>
      )}
      
      {showScheduleModal && (
        <SchedulePost 
          content={generatedPost}
          linkUrl={includeLink ? linkUrl : null}
          linkTitle={includeLink ? linkTitle : null}
          linkDescription={includeLink ? linkDescription : null}
          onClose={() => setShowScheduleModal(false)}
          onScheduleSuccess={handleScheduleSuccess}
        />
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