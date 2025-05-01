// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const [linkedInStatus, setLinkedInStatus] = useState('checking');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [apiStatus, setApiStatus] = useState({
    defaultProvider: 'claude',
    claudeConfigured: false,
    claudeValid: false,
    openaiConfigured: false,
    openaiValid: false
  });

  useEffect(() => {
    // Vérifier le statut de connexion LinkedIn
    checkLinkedInStatus();
    
    // Vérifier la configuration des API IA sur le serveur
    checkApiConfiguration();
  }, []);

  const checkApiConfiguration = async () => {
    try {
      const response = await fetch('/api/auth/api-config');
      
      if (response.ok) {
        const config = await response.json();
        setApiStatus(config);
      } else {
        console.error('Erreur lors de la récupération de la configuration API');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la configuration API:', error);
    }
  };

  const checkLinkedInStatus = async () => {
    try {
      const token = localStorage.getItem('linkedInToken');
      
      if (!token) {
        setLinkedInStatus('disconnected');
        return;
      }
      
      const response = await fetch('/api/linkedin/verify-token', {
        headers: {
          'linkedinToken': token
        }
      });
      
      if (response.ok) {
        setLinkedInStatus('connected');
        
        // Récupérer les informations du profil
        const profileResponse = await fetch('/api/linkedin/profile', {
          headers: {
            'linkedinToken': token
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // Stocker les informations du profil si nécessaire
        } else if (profileResponse.status === 401) {
          // Token révoqué ou expiré
          console.warn("Token LinkedIn révoqué ou expiré");
          setLinkedInStatus('expired');
          localStorage.removeItem('linkedInToken');
        }
      } else {
        if (response.status === 401) {
          // Token révoqué ou expiré
          setLinkedInStatus('expired');
          localStorage.removeItem('linkedInToken');
        } else {
          setLinkedInStatus('error');
        }
      }
    } catch (error) {
      console.error('LinkedIn status check error:', error);
      setLinkedInStatus('error');
    }
  };

  const handleReconnectLinkedIn = async () => {
    try {
      // Supprimer le token existant s'il y en a un
      localStorage.removeItem('linkedInToken');
      
      const response = await fetch('/api/auth/linkedin/url');
      const data = await response.json();
      
      if (response.ok) {
        // Rediriger vers l'URL d'authentification LinkedIn
        window.location.href = data.authUrl;
      } else {
        throw new Error('Erreur lors de la récupération de l\'URL d\'authentification LinkedIn');
      }
    } catch (error) {
      console.error('LinkedIn reconnect error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: `Erreur: ${error.message}`
      });
      
      setTimeout(() => {
        setNotification({ show: false });
      }, 5000);
    }
  };

  const getLinkedInStatusLabel = () => {
    switch (linkedInStatus) {
      case 'connected':
        return 'Connecté à LinkedIn';
      case 'disconnected':
        return 'Non connecté à LinkedIn';
      case 'expired':
        return 'Session LinkedIn expirée';
      case 'error':
        return 'Erreur de connexion à LinkedIn';
      default:
        return 'Vérification du statut LinkedIn...';
    }
  };

  const getLinkedInStatusClass = () => {
    switch (linkedInStatus) {
      case 'connected':
        return 'status-connected';
      case 'disconnected':
      case 'expired':
        return 'status-disconnected';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };
  
  // Fonction d'aide pour obtenir le statut de l'API sous forme de texte
  const getApiStatusText = (configured, valid) => {
    if (!configured) return 'Non configurée';
    if (valid) return 'Configurée et fonctionnelle';
    return 'Configurée mais invalide';
  };

  // Fonction d'aide pour obtenir la classe CSS du statut de l'API
  const getApiStatusClass = (configured, valid) => {
    if (!configured) return 'status-not-configured';
    if (valid) return 'status-valid';
    return 'status-invalid';
  };

  return (
    <div className="settings-container">
      <h1>Paramètres</h1>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="settings-card">
        <h2>Statut des API IA</h2>
        <div className="api-status-container">
          <div className={`api-status-item ${getApiStatusClass(apiStatus.claudeConfigured, apiStatus.claudeValid)}`}>
            <span className="api-name">Claude AI:</span>
            <span className="api-status">{getApiStatusText(apiStatus.claudeConfigured, apiStatus.claudeValid)}</span>
          </div>
          
          <div className={`api-status-item ${getApiStatusClass(apiStatus.openaiConfigured, apiStatus.openaiValid)}`}>
            <span className="api-name">OpenAI:</span>
            <span className="api-status">{getApiStatusText(apiStatus.openaiConfigured, apiStatus.openaiValid)}</span>
          </div>
          
          <div className="api-provider-default">
            <span>Fournisseur par défaut:</span>
            <span className="default-provider">{apiStatus.defaultProvider === 'claude' ? 'Claude AI' : 'OpenAI'}</span>
          </div>
        </div>
        
        <div className="api-status-info">
          <p>
            Les clés API sont configurées directement sur le serveur par l'administrateur. 
            Si vous rencontrez des problèmes avec la génération de contenu, veuillez contacter l'administrateur.
          </p>
        </div>
      </div>
      
      <div className="settings-card">
        <h2>Connexion LinkedIn</h2>
        
        <div className={`linkedin-status ${getLinkedInStatusClass()}`}>
          <span className="status-indicator"></span>
          <span className="status-text">{getLinkedInStatusLabel()}</span>
        </div>
        
        {(linkedInStatus === 'disconnected' || linkedInStatus === 'expired' || linkedInStatus === 'error') && (
          <button 
            onClick={handleReconnectLinkedIn} 
            className="linkedin-button"
          >
            Se connecter à LinkedIn
          </button>
        )}
        
        {linkedInStatus === 'connected' && (
          <div>
            <p className="status-info">
              Votre connexion à LinkedIn est active. Vous pouvez publier des posts directement depuis l'application.
            </p>
            <button 
              onClick={handleReconnectLinkedIn} 
              className="linkedin-button secondary"
            >
              Se reconnecter à LinkedIn
            </button>
          </div>
        )}
      </div>
      
      <div className="settings-card">
        <h2>À propos</h2>
        <p>LinkedIn Post Generator MVP</p>
        <p>Version: 1.0.0</p>
        <p>Une application pour générer et publier automatiquement des posts LinkedIn à partir de différentes sources.</p>
      </div>
    </div>
  );
};

export default Settings;