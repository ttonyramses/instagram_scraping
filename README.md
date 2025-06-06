# Instagram Scraping Tool

Un outil de scraping Instagram développé en TypeScript utilisant Playwright pour l'automatisation du navigateur et l'extraction de données.

## Description

Ce projet est conçu pour extraire des informations d'Instagram, notamment :
- Les informations de profil des utilisateurs
- Les listes de followers (abonnés)
- Les listes de followings (abonnements)

L'application utilise une architecture modulaire basée sur l'injection de dépendances (InversifyJS) et suit les principes SOLID pour une meilleure maintenabilité et extensibilité.

## Structure du Projet

```
src/
├── core/               # Configuration de base (container, types)
├── database/           # Services et configurations de base de données
├── domaine/            # Logique métier, entités et DTOs
├── logger/             # Service de journalisation
└── scraping/           # Services de scraping
    ├── interface/      # Interfaces pour les services
    ├── service/        # Implémentations des services
    │   ├── auth.service.ts         # Gestion de l'authentification
    │   ├── browser.service.ts      # Gestion du navigateur
    │   ├── follower.service.ts     # Récupération des followers
    │   ├── following.service.ts    # Récupération des followings
    │   ├── hobby.service.ts        # Gestion des hobbies
    │   ├── scraping.service.ts     # Service principal (orchestrateur)
    │   └── user-info.service.ts    # Récupération des infos utilisateur
    ├── type/           # Types et enums
    └── utils/          # Utilitaires
```

## Fonctionnalités

- **Authentification Instagram** : Connexion et gestion des cookies
- **Extraction de profils** : Récupération des informations de profil (nom, bio, nombre d'abonnés, etc.)
- **Extraction de followers/followings** : Récupération des listes d'abonnés et d'abonnements
- **Gestion des hobbies** : Attribution de hobbies aux utilisateurs pour la catégorisation
- **Stockage en base de données** : Sauvegarde des données extraites

## Prérequis

- Node.js (v16 ou supérieur)
- npm ou yarn
- docker, docker-compose up -d
- Un compte Instagram valide

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd instagram_scraping

# Installer les dépendances
npm install

# Installer les navigateurs Playwright
npx playwright install
```

## Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Base de données
DATABASE_TYPE=sqlite
DATABASE_NAME=instagram.db
DATABASE_DIR=./.database

# Instagram
BASE_SCRAPING_URL=https://www.instagram.com
COOKIES_JSON_DIR=./.cookies
SELECTORS_JSON_DIR=./.selectors

# Paramètres de scraping
HEADLESS=true
WAIT_AFTER_ACTION_LONG=2000
WAIT_AFTER_ACTION_SHORT=500
NB_FOLLOW_QUERY_PROCESS=100
NB_FOLLOW_LOG_PROCESS=1000
NB_FOLLOW_PROCESS=5000
NB_THREAD_GET_INFO_USER=10
BLOCK_SIZE_THREAD_GET_INFO_USER=5000
MAX_USER_UPDATE=50000
```

## Utilisation

### Builder l'application
```bash
npm run build
```
### Lancer le service de base de données avec docker
```bash
docker-compose -f  src/database/docker/postgres.yml up -d
```

### Récupérer des cookies d'authentification

```bash
npm run start get-cookies -l logins.json -s selectors.json
```

### Extraire les informations de profil

```bash
npm run start scrap-info -u username1 username2 -c cookies.json -s selectors.json
```

### Extraire les followers

```bash
npm run start scrap-followers -u username -c cookies.json -s selectors.json
```

### Extraire les followings

```bash
npm run start scrap-followings -u username -c cookies.json -s selectors.json
```

### Ajouter des hobbies aux utilisateurs

```bash
npm run start add-hobby -u username1 username2 -hb hobby1 hobby2
```

## Architecture

Le projet utilise une architecture modulaire basée sur l'injection de dépendances avec InversifyJS. Les services sont organisés selon le principe de responsabilité unique :

- **ScrapingService** : Orchestrateur principal qui délègue aux services spécialisés
- **BrowserService** : Gestion du navigateur Playwright
- **AuthService** : Authentification et gestion des cookies
- **UserInfoService** : Récupération des informations de profil
- **FollowerService** : Gestion des followers
- **FollowingService** : Gestion des followings
- **HobbyScrapingService** : Application des hobbies aux utilisateurs

## Licence

ISC
