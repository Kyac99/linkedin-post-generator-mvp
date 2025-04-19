// frontend/src/pages/Login.js
import React, { useState, useEffect, useCallback } from 'react';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [aiApiKey, setAiApiKey] = useState('');
  const [keyType, setKeyType] = useState('claude'); // 'claude' ou 'openai'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedInAuthUrl, setLinkedInAuthUrl] = useState('');

  // Définir handleLinkedInCallback avec useCallback pour pouvoir l'utiliser comme dépendance dans useEffect
  const handleLinkedInCallback = useCallback(async (code) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/linkedin/exchange-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('linkedInToken', data.accessToken);
        
        // Si l'API AI est déjà configurée, nous pouvons considérer l'utilisateur comme authentifié
        if (localStorage.getItem('aiApiKey')) {
          setIsAuthenticated(true);
        }
      } else {
        throw new Error(data.message || 'Erreur lors de l\'authentification LinkedIn');
      }
    } catch (error) {
      console.error('LinkedIn auth error:', error);
      setError(`Erreur d'authentification LinkedIn: ${error.message}`);
    } finally {
      setLoading(false);
      
      // Nettoyer l'URL pour éviter les problèmes si l'utilisateur actualise la page
      window.history.replaceState({}, document.title, '/login');
    }
  }, [setIsAuthenticated]); // Dépendances du useCallback

  useEffect(() => {
    // Récupérer l'URL d'authentification LinkedIn
    const fetchLinkedInAuthUrl = async () => {
      try {
        const response = await fetch('/api/linkedin/auth-url');
        const data = await response.json();
        
        if (response.ok) {
          setLinkedInAuthUrl(data.authUrl);
        } else {
          setError('Erreur lors de la récupération de l\'URL d\'authentification LinkedIn');
        }
      } catch (error) {
        console.error('LinkedIn auth URL error:', error);
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      }
    };

    fetchLinkedInAuthUrl();

    // Vérifier si on a un code d'autorisation dans l'URL (redirection après authentification LinkedIn)
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode) {
      handleLinkedInCallback(authCode);
    }
  }, [handleLinkedInCallback]); // Ajout de la dépendance manquante

  const handleAiApiSubmit = async (e) => {
    e.preventDefault();
    
    if (!aiApiKey.trim()) {
      setError('Veuillez entrer une clé API');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Vérifier la validité de la clé API
      const response = await fetch('/api/auth/verify-ai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey: aiApiKey,
          keyType: keyType 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Stocker la clé API localement de manière sécurisée
        localStorage.setItem('aiApiKey', aiApiKey);
        localStorage.setItem('aiApiType', keyType);
        
        // Si l'authentification LinkedIn est déjà configurée, nous pouvons considérer l'utilisateur comme authentifié
        if (localStorage.getItem('linkedInToken')) {
          setIsAuthenticated(true);
        }
      } else {
        throw new Error(data.message || 'Clé API invalide');
      }
    } catch (error) {
      console.error('AI API key verification error:', error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Configuration de l'application</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="auth-sections">
        <div className="auth-section">
          <h2>Étape 1: Connectez-vous à LinkedIn</h2>
          <p>Pour publier des posts automatiquement, vous devez autoriser l'application à accéder à votre compte LinkedIn.</p>
          
          {localStorage.getItem('linkedInToken') ? (
            <div className="success-message">✓ Connecté à LinkedIn</div>
          ) : (
            <a 
              href={linkedInAuthUrl} 
              className="linkedin-button"
              disabled={loading || !linkedInAuthUrl}
            >
              {loading ? 'Connexion...' : 'Se connecter avec LinkedIn'}
            </a>
          )}
        </div>
        
        <div className="auth-section">
          <h2>Étape 2: Configurez votre clé API IA</h2>
          <p>Entrez votre clé API pour utiliser Claude AI ou OpenAI.</p>
          
          {localStorage.getItem('aiApiKey') ? (
            <div className="success-message">✓ Clé API configurée</div>
          ) : (
            <form onSubmit={handleAiApiSubmit}>
              <div className="api-type-selector">
                <button 
                  type="button"
                  className={keyType === 'claude' ? 'active' : ''} 
                  onClick={() => setKeyType('claude')}
                >
                  Claude AI
                </button>
                <button 
                  type="button"
                  className={keyType === 'openai' ? 'active' : ''} 
                  onClick={() => setKeyType('openai')}
                >
                  OpenAI
                </button>
              </div>
              
              <input
                type="password"
                placeholder={`Entrez votre clé API ${keyType === 'claude' ? 'Claude AI' : 'OpenAI'}`}
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                disabled={loading}
              />
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Vérification...' : 'Enregistrer la clé API'}
              </button>
            </form>
          )}
        </div>
      </div>
      
      {localStorage.getItem('linkedInToken') && localStorage.getItem('aiApiKey') && (
        <div className="start-app">
          <p>Vous êtes prêt à utiliser l'application!</p>
          <button 
            onClick={() => setIsAuthenticated(true)} 
            className="start-button"
          >
            Commencer à générer des posts
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
