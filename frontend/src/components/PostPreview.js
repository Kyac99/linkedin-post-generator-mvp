// frontend/src/components/PostPreview.js
import React, { useState } from 'react';
import './PostPreview.css';

const PostPreview = ({ content }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);

  // Mettre à jour le contenu édité lorsque le contenu original change
  React.useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Ici, vous pourriez propager les modifications au composant parent si nécessaire
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
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

  // Appliquer les formatages
  const formatContent = (text) => {
    let formatted = formatHashtags(text);
    formatted = formatMentions(formatted);
    return formatted;
  };

  return (
    <div className="post-preview">
      {isEditing ? (
        <div className="edit-mode">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="edit-textarea"
            rows={10}
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
        <p className="character-count">
          Caractères: {editedContent ? editedContent.length : 0}
          {editedContent && editedContent.length > 3000 && (
            <span className="warning"> (Dépasse la limite LinkedIn)</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default PostPreview;
