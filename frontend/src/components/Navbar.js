// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Pour connaître la route actuelle

  const handleLogout = () => {
    // Supprimer les tokens et clés stockés
    localStorage.removeItem('linkedInToken');
    localStorage.removeItem('aiApiKey');
    localStorage.removeItem('aiApiType');
    
    // Rediriger vers la page de connexion
    navigate('/login');
  };

  // Vérifier si un lien est actif
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <span className="logo-text">LinkedIn Post Generator</span>
          </Link>
        </div>
        
        <div className="navbar-menu">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            Dashboard
          </Link>
          <Link to="/history" className={`nav-link ${isActive('/history')}`}>
            Historique
          </Link>
          <Link to="/settings" className={`nav-link ${isActive('/settings')}`}>
            Paramètres
          </Link>
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;