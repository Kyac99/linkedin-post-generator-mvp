// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = () => {
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiApiType, setAiApiType] = useState('claude');
  const [linkedInStatus, setLinkedInStatus] = useState('checking');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Récupérer les informations stockées
    const storedApiKey = localStorage.getItem('aiApiKey') || '';
    const storedApiType = localStorage.getItem('aiApiType') || 'claude';
    
    setAiApiKey(storedApiKey);
    setAiApiType(storedApiType);
    
    // Vérifier le statut de connexion LinkedIn
    checkLinkedInStatus();
  }, []);

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
        }
      } else {
        setLinkedInStatus('expired');
      }
    } catch (error) {
      console.error('LinkedIn status check error:', error);
      setLinkedInStatus('error');
    }
  };

  const handleUpdateApiKey = async (e) => {
    e.preventDefault();
    
    if (!aiApiKey.trim()) {
      setNotification({
        show: true,
        type: 'error',
        message: 'Veuillez entrer une clé API'
      });
      return;
    }
    
    setLoading(true);
    setNotification({ show: false });
    
    try {
      console.log(`Tentative de mise à jour de la clé API ${aiApiType}:`, aiApiKey.substring(0, 5) + '...');
      
      // Vérifier la validité de la clé API
      const response = await fetch('/api/auth/verify-ai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey: aiApiKey,
          keyType: aiApiType 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Stocker la nouvelle clé API
        localStorage.setItem('aiApiKey', aiApiKey);
        localStorage.setItem('aiApiType', aiApiType);
        
        console.log(`Clé API ${aiApiType} mise à jour et stockée dans localStorage`);
        
        setNotification({
          show: true,
          type: 'success',
          message: 'Clé API mise à jour avec succès'
        });
        
        // Ajout d'un délai pour s'assurer que la mise à jour est bien prise en compte
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Un test rapide pour confirmer que la clé a bien été stockée
        const storedKey = localStorage.getItem('aiApiKey');
        console.log(`Clé stockée (vérification): ${storedKey ? storedKey.substring(0, 5) + '...' : 'non définie'}`);
      } else {
        throw new Error(data.message || 'Clé API invalide');
      }
    } catch (error) {
      console.error('API key update error:', error);
      setNotification({
        show: true,
        type: 'error',
        message: `Erreur: ${error.message}`
      });
    } finally {
      setLoading(false);
      
      // Masquer la notification après 3 secondes
      setTimeout(() => {
        setNotification({ show: false });
      }, 3000);
    }
  };

  const handleReconnectLinkedIn = async () => {
    try {
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
      }, 3000);
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

  return (
    <div className="settings-container">
      <h1>Paramètres</h1>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="settings-card">
        <h2>Configuration API IA</h2>
        
        <form onSubmit={handleUpdateApiKey}>
          <div className="form-group">
            <label>Type d'API IA:</label>
            <div className="api-type-selector">
              <button 
                type="button"
                className={aiApiType === 'claude' ? 'active' : ''} 
                onClick={() => setAiApiType('claude')}
              >
                Claude AI
              </button>
              <button 
                type="button"
                className={aiApiType === 'openai' ? 'active' : ''} 
                onClick={() => setAiApiType('openai')}
              >
                OpenAI
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label>Clé API {aiApiType === 'claude' ? 'Claude AI' : 'OpenAI'}:</label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder={`Entrez votre clé API ${aiApiType === 'claude' ? 'Claude AI' : 'OpenAI'}`}
            />
          </div>
          
          <button 
            type="submit" 
            className="update-button"
            disabled={loading}
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour la clé API'}
          </button>
        </form>
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
            Se reconnecter à LinkedIn
          </button>
        )}
        
        {linkedInStatus === 'connected' && (
          <p className="status-info">
            Votre connexion à LinkedIn est active. Vous pouvez publier des posts directement depuis l'application.
          </p>
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