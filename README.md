# LinkedIn Post Generator - MVP

Ce projet est un MVP (Minimum Viable Product) permettant de générer et publier automatiquement des posts LinkedIn à partir de différents types d'inputs.

## Fonctionnalités incluses dans le MVP

- **Authentification**
  - Connexion à LinkedIn via OAuth
  - Configuration des API Claude/OpenAI côté serveur uniquement
  - Stockage sécurisé des tokens

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

- **Publication**
  - Publication directe sur LinkedIn
  - Publication avec lien inclus

## Architecture technique

- **Frontend**
  - React.js pour l'interface utilisateur
  - Système de routage pour la navigation
  - Gestion de l'état avec hooks React

- **Backend**
  - Node.js avec Express pour l'API
  - Intégration avec LinkedIn API
  - Intégration avec Claude AI / OpenAI
  - Support multi-modèle (Claude 3 Sonnet/Haiku et GPT-4/3.5 Turbo)
  - Gestion des clés API exclusivement dans le backend

- **Sécurité**
  - Authentification OAuth pour LinkedIn
  - Stockage sécurisé des clés API dans les variables d'environnement du serveur
  - Vérification des tokens

## Configuration et déploiement

### Prérequis

- Node.js 14+ et npm
- Compte développeur LinkedIn avec une application configurée
- Clé API Claude AI ou OpenAI

### Variables d'environnement

1. Créez un fichier `.env` dans le dossier `backend` en vous basant sur le fichier `.env.example`

```
PORT=5000
NODE_ENV=development

# Configuration LinkedIn API
LINKEDIN_CLIENT_ID=votre_client_id_linkedin
LINKEDIN_CLIENT_SECRET=votre_client_secret_linkedin
LINKEDIN_REDIRECT_URI=http://localhost:3000/login

# Configuration des API IA (au moins une des deux est requise)
DEFAULT_AI_PROVIDER=claude  # ou 'openai'
CLAUDE_API_KEY=votre_cle_api_claude
OPENAI_API_KEY=votre_cle_api_openai
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
   - Configurez les clés API (Claude ou OpenAI) dans le fichier `.env` du backend
   - Connectez-vous avec votre compte LinkedIn

2. **Génération de posts**
   - Choisissez le type de contenu source (Article, Idée, YouTube, Python)
   - Sélectionnez le ton souhaité pour votre post
   - Entrez le contenu source et cliquez sur "Générer"

3. **Personnalisation et publication**
   - Modifiez le post généré si nécessaire
   - Ajoutez éventuellement un lien avec titre et description
   - Publiez directement sur votre profil LinkedIn

## Modifications récentes

### Mai 2025
- Refactorisation du middleware `initializeAIService` pour gérer les clés API exclusivement côté serveur
- Ajout du fichier `.env.example` comme référence pour la configuration
- Mise à jour de l'interface utilisateur pour refléter la nouvelle gestion des clés API

## Améliorations futures (post-MVP)

- **Fonctionnalités**
  - Planification des publications
  - Support d'images et de vidéos dans les posts
  - Historique des publications et analytics
  - Suggestions de hashtags populaires
  - Support de multiples comptes LinkedIn
  - Prévisualisation du rendu mobile

- **Technique**
  - Base de données pour stocker l'historique
  - Système de files d'attente pour les publications planifiées
  - Tests automatisés
  - CI/CD pour déploiement automatique
  - Support de LinkedIn Company Pages

## Licence

Copyright © 2025
