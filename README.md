# Architecture Hexagonale - User Management

## 🏗️ Architecture

Cette application suit les principes de l'architecture hexagonale (Ports & Adapters) avec NestJS.

### Structure

```
src/
├── domain/              # Couche Domain (Logique métier)
│   ├── user/
│   ├── hobby/
│   └── weighting/
├── application/         # Couche Application (Cas d'usage)
│   ├── user/
│   ├── hobby/
│   └── weighting/
├── infrastructure/      # Couche Infrastructure (Adapters)
│   ├── persistence/
│   ├── services/
│   └── config/
└── presentation/        # Couche Presentation (Controllers/DTOs)
    ├── user/
    └── hobby/
```

## 🚀 Installation

```bash
# Installation des dépendances
npm install

# Configuration de la base de données
cp .env.example .env
# Modifier les variables dans .env

# Démarrage en mode développement
npm run start:dev
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de code
npm run test:cov
```

## 📚 API Endpoints

### Users
- `POST /users` - Créer un utilisateur
- `GET /users/:id` - Récupérer un utilisateur
- `PUT /users/:id` - Mettre à jour un utilisateur
- `DELETE /users/:id` - Supprimer un utilisateur

## 🔧 Architecture Details

### Domain Layer
- **Entities**: Logique métier pure
- **Value Objects**: Objets immuables
- **Ports**: Interfaces pour les dépendances

### Application Layer
- **Commands**: Actions à effectuer
- **Queries**: Requêtes de lecture
- **Handlers**: Orchestration des cas d'usage

### Infrastructure Layer
- **Repositories**: Implémentation de la persistance
- **Services**: Services externes
- **Mappers**: Conversion entre couches

### Presentation Layer
- **Controllers**: Points d'entrée HTTP
- **DTOs**: Validation et transfert de données
