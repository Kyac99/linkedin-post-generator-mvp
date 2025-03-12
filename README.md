# LinkedIn Post Generator - MVP

Ce projet est un MVP (Minimum Viable Product) permettant de générer et publier automatiquement des posts LinkedIn à partir de différents types d'inputs.

## Fonctionnalités incluses dans le MVP

- **Authentification**
  - Connexion à LinkedIn via OAuth
  - Configuration de l'API Claude/OpenAI
  - Stockage sécurisé des tokens et clés API

- **Génération de posts LinkedIn à partir de**
  - Articles (texte ou URL)
  - Idées de posts
  - Vidéos YouTube
  - Code Python

- **Aperçu et personnalisation**
  - Visualisation du post généré avant publication
  - Édition du contenu généré
  - Compteur de caractères

- **Publication**
  - Publication directe sur LinkedIn

## Architecture technique

- **Frontend**
  - React.js pour l'interface utilisateur
  - Système de routage pour la navigation
  - Gestion de l'état avec hooks React

- **Backend**
  - Node.js avec Express pour l'API
  - Intégration avec LinkedIn API
  - Intégration avec Claude AI / OpenAI

- **Sécurité**
  - Authentification OAuth pour LinkedIn
  - Stockage sécurisé des clés API
  - Vérification des tokens

## Configuration et déploiement

### Prérequis

- Node.js 14+ et npm
- Compte développeur LinkedIn avec une application configurée
- Clé API Claude AI ou OpenAI

### Variables d'environnement

Le fichier `.env` dans le dossier `backend` doit être configuré avec:

```
PORT=5000
NODE_ENV=development
LINKEDIN_CLIENT_ID=votre_client_id_linkedin
LINKEDIN_CLIENT_SECRET=votre_client_secret_linkedin
LINKEDIN_REDIRECT_URI=http://localhost:3000/login
```

### Installation

1. Cloner le dépôt
2. Installer les dépendances frontend et backend:
   ```
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Démarrer le backend:
   ```
   cd backend && npm start
   ```

4. Démarrer le frontend:
   ```
   cd frontend && npm start
   ```

5. Accéder à l'application via `http://localhost:3000`

## Améliorations futures (post-MVP)

- **Fonctionnalités**
  - Planification des publications
  - Support d'images et de vidéos dans les posts
  - Historique des publications et analytics
  - Suggestions de hashtags populaires
  - Support de multiples comptes LinkedIn

- **Technique**
  - Base de données pour stocker l'historique
  - Système de files d'attente pour les publications planifiées
  - Tests automatisés
  - CI/CD pour déploiement automatique

## Licence

Copyright © 2025
