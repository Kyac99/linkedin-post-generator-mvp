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

- **Personnalisation avancée**
  - Sélection du ton (professionnel, casual, inspirant, etc.)
  - Visualisation du post généré avant publication
  - Édition du contenu généré
  - Compteur de caractères avec alertes
  - Ajout de liens optionnels avec titre et description
  - Suggestions de hashtags populaires et contextuels
  - Aide intelligente au contenu

- **Publication et gestion**
  - Publication directe sur LinkedIn
  - Publication avec lien inclus
  - Planification des publications à une date et heure futures
  - Historique des publications avec statistiques d'engagement
  - Gestion des posts planifiés

## Architecture technique

- **Frontend**
  - React.js pour l'interface utilisateur
  - Système de routage pour la navigation
  - Gestion de l'état avec hooks React
  - Interface responsive et intuitive

- **Backend**
  - Node.js avec Express pour l'API
  - Intégration avec LinkedIn API
  - Intégration avec Claude AI / OpenAI
  - Support multi-modèle (Claude 3.5 Sonnet et GPT-4o)
  - Système de planification des publications
  - Stockage des données de posts et statistiques

- **Sécurité**
  - Authentification OAuth pour LinkedIn
  - Stockage sécurisé des clés API
  - Vérification des tokens
  - Gestion des erreurs robuste

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
CLAUDE_API_KEY=votre_cle_api_claude
OPENAI_API_KEY=votre_cle_api_openai
DEFAULT_AI_PROVIDER=claude  # ou 'openai'
DEBUG_LEVEL=none  # options: none, basic, verbose
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

## Guide d'utilisation

1. **Configuration initiale**
   - Connectez-vous avec votre compte LinkedIn
   - Configurez votre clé API (Claude ou OpenAI)

2. **Génération de posts**
   - Choisissez le type de contenu source (Article, Idée, YouTube, Python)
   - Sélectionnez le ton souhaité pour votre post
   - Entrez le contenu source et cliquez sur "Générer"

3. **Personnalisation et publication**
   - Modifiez le post généré si nécessaire
   - Ajoutez des hashtags suggérés en fonction du contenu
   - Ajoutez éventuellement un lien avec titre et description
   - Publiez directement sur votre profil LinkedIn ou planifiez pour plus tard

4. **Planification et suivi**
   - Consultez vos posts planifiés dans l'onglet "Historique"
   - Annulez ou modifiez les posts planifiés
   - Visualisez les statistiques d'engagement des posts publiés

## Améliorations futures

- **Fonctionnalités**
  - Support d'images et de vidéos dans les posts
  - Support de multiples comptes LinkedIn
  - Prévisualisation du rendu mobile
  - Rapports analytiques avancés et export des données
  - Suggestions de contenu basées sur les performances passées
  - Intégration avec d'autres réseaux sociaux (Twitter, Facebook, etc.)

- **Technique**
  - Migration vers une base de données robuste (MongoDB, PostgreSQL)
  - Système de files d'attente avancé pour les publications planifiées
  - Tests automatisés et couverture de code
  - CI/CD pour déploiement automatique
  - Support de LinkedIn Company Pages
  - API publique pour intégrations tierces

## Changelog

### Version 1.1.0 (Mai 2025)
- Ajout de la planification des posts
- Ajout de l'historique des publications avec statistiques
- Ajout de suggestions de hashtags intelligentes et contextuelles
- Amélioration de l'interface utilisateur
- Correction de bugs et optimisation des performances

### Version 1.0.0 (Mars 2025)
- Version initiale du MVP
- Génération de posts à partir de différentes sources
- Publication directe sur LinkedIn
- Interface de base pour la génération et l'édition

## Licence

Copyright © 2025
