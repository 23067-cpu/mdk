# NexaSolft - Gestion de Trésorerie

Application de gestion de trésorerie pour NexaSolft, développée avec Django (Backend), Next.js (Frontend) et SQL Server.

## Prérequis

- Docker Desktop installé et lancé.
- Git.

## Installation et Démarrage

1.  **Cloner le projet** (si ce n'est pas déjà fait).
2.  **Lancer l'application** :
    Ouvrez un terminal à la racine du projet et exécutez :
    ```bash
    docker-compose up --build
    ```
    Cela va construire les images et lancer les conteneurs :
    - **Base de données** (SQL Server) : Port 1433
    - **Backend** (Django) : http://localhost:8000
    - **Frontend** (Next.js) : http://localhost:3000

3.  **Accéder à l'application** :
    Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000).

## Structure du Projet

- `Backend/` : Code source API Django.
- `Frontend/` : Code source Interface Next.js.
- `docker-compose.yml` : Configuration des services Docker.

## Comptes de Démonstration

Un superutilisateur peut être créé via le conteneur backend :
```bash
docker-compose exec backend python manage.py createsuperuser
```

## Fonctionnalités Principales

- **Authentification** : Sécurisée par login/mot de passe.
- **Folios** : Ouverture, fermeture et suivi des soldes.
- **Transactions** : Enregistrement des entrées (Receipts) et sorties (Payments).
- **Reçus** : Génération de reçus (simulation PDF).