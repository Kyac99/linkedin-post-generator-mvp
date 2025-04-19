// frontend/src/components/PostPreview.js
import React, { useState, useEffect } from 'react';
import './PostPreview.css';

const PostPreview = ({ content, setContent }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [charactersLeft, setCharactersLeft] = useState(1300);

  // Mettre à jour le contenu édité lorsque le contenu original change
  useEffect(() => {
    setEditedContent(content);
    calculateCharactersLeft(content);
  }, [content]);

  const calculateCharactersLeft = (text) => {
    const limit = 1300; // Limite recommandée pour LinkedIn
    const remaining = limit - (text ? text.length : 0);
    setCharactersLeft(remaining);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Propager les modifications au composant parent
    if (setContent) {
      setContent(editedContent);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setEditedContent(newContent);
    calculateCharactersLeft(newContent);
  };

  // Fonction pour détecter et formatter les hashtags
  const formatHashtags = (text) => {
    if (!text) return '';
    
    // Remplacer les hashtags par des spans stylisés
    return text.replace(
      /(#\w+)/g, 
      '<span class="hashtag">$1</span>'
    );
  };

  // Fonction pour détecter et formatter les mentions
  const formatMentions = (text) => {
    if (!text) return '';
    
    // Remplacer les mentions par des spans stylisés
    return text.replace(
      /(@\w+)/g, 
      '<span class="mention">$1</span>'
    );
  };

  // Fonction pour détecter et formatter les URLs
  const formatUrls = (text) => {
    if (!text) return '';
    
    // Expression régulière pour détecter les URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Remplacer les URLs par des liens cliquables
    return text.replace(
      urlRegex, 
      '<span class="url">$1</span>'
    );
  };

  // Appliquer les formatages
  const formatContent = (text) => {
    let formatted = formatHashtags(text);
    formatted = formatMentions(formatted);
    formatted = formatUrls(formatted);
    
    // Convertir les sauts de ligne en balises <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  const renderCharacterCount = () => {
    let className = "character-count";
    let message = "";
    
    if (charactersLeft < 0) {
      className += " exceeded";
      message = `Dépassement de ${Math.abs(charactersLeft)} caractères`;
    } else {
      message = `${charactersLeft} caractères restants`;
    }
    
    return <p className={className}>{message}</p>;
  };

  return (
    <div className="post-preview">
      {isEditing ? (
        <div className="edit-mode">
          <textarea
            value={editedContent}
            onChange={handleContentChange}
            className="edit-textarea"
            rows={10}
            placeholder="Modifiez votre post ici..."
          />
          <div className="edit-buttons">
            <button onClick={handleSave} className="save-button">Enregistrer</button>
            <button onClick={handleCancel} className="cancel-button">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="preview-mode">
          <div 
            className="preview-content" 
            dangerouslySetInnerHTML={{ __html: formatContent(editedContent) }}
          />
          <button onClick={handleEdit} className="edit-button">Modifier</button>
        </div>
      )}
      
      <div className="preview-info">
        {renderCharacterCount()}
        <p className="total-characters">
          Total: {editedContent ? editedContent.length : 0} caractères
          {editedContent && editedContent.length > 3000 && (
            <span className="warning"> (Dépasse la limite absolue LinkedIn)</span>
          )}
        </p>
        
        <div className="linkedin-limits-info">
          <p className="info-text">
            <span className="info-icon">ℹ️</span> LinkedIn recommande maximum 1300 caractères pour un engagement optimal.
            La limite absolue est de 3000 caractères.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostPreview;
