// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('linkedInToken');
        const aiKey = localStorage.getItem('aiApiKey');
        
        if (token && aiKey) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      <div className="container">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" /> : <Login setIsAuthenticated={setIsAuthenticated} />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/settings" 
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
