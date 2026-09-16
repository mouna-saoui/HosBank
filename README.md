# HosBank

Application web de gestion bancaire — Node.js, Express, EJS, PostgreSQL, Docker.

**Fonctionnalités en cours :** Authentification · Gestion des clients · Gestion des charges clients

| Technologie | Rôle |
|-------------|------|
| Node.js | Environnement d'exécution serveur |
| Express | Framework HTTP |
| EJS | Rendu HTML côté serveur |
| PostgreSQL | Base de données relationnelle |
| pg | Client PostgreSQL pour Node.js |
| Docker | Conteneurisation |
| pgAdmin 4 | Interface d'administration BDD |

---

## Architecture N-Tier

```text
Client (Navigateur)
        ↓
   Middleware          → auth, session, parsing
        ↓
     Routes            → définition des endpoints
        ↓
   Controllers         → gestion HTTP uniquement
        ↓
    Services           → logique métier
        ↓
  Repositories         → requêtes SQL via pg
        ↓
  Database (PostgreSQL)
```

> Règle absolue : `Route → Controller → Service → Repository → Database`
> ❌ Jamais de SQL dans un Controller. ❌ Jamais de logique métier dans une Route.

---

## Structure du projet

```text
HosBank/
├── database/
│   ├── migrations/Migration.js   → création des tables
│   └── seeds/Seed.js             → données initiales
├── public/                       → fichiers statiques (CSS, JS, images)
├── src/
│   ├── config/Database.js        → pool de connexion PostgreSQL
│   ├── controllers/controller.js → handlers HTTP
│   ├── middelewares/Middelware.js → auth, parsing, erreurs
│   ├── models/Model.js           → entités (Client, ChargeClient, Admin)
│   ├── repositories/Repository.js → requêtes SQL
│   ├── routes/Rout.js            → endpoints
│   └── services/Service.js       → logique métier
├── views/
│   ├── admin/     → dashboard admin
│   ├── auth/      → login
│   ├── charge-client/ → charges clients
│   ├── client/    → gestion clients
│   └── layouts/   → layout commun
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── server.js
```

---

## Quick Start

```bash
git clone https://github.com/mouna-saoui/HosBank.git
cd HosBank
cp .env.example .env
docker compose up --build
```

```
Application : http://localhost:3000
pgAdmin     : http://localhost:5555
```

---

## Variables d'environnement

Créer `.env` à la racine à partir de `.env.example` :

```env
POSTGRES_USER=your_user
POSTGRES_PW=your_password
PG_ADMIN_PW=your_pgadmin_password
```

> Ne jamais committer `.env` (listé dans `.gitignore`).

---

## Docker

Trois services définis dans `docker-compose.yml` :

| Service | Container | Image | Port |
|---------|-----------|-------|------|
| node | HosBank | Dockerfile local | 3000 |
| postgres | hosbank-db | postgres:17-alpine | 5432 |
| pgadmin | pgadmin | dpage/pgadmin4:snapshot | 5555 |

La base de données `hosbank` est créée automatiquement au premier démarrage.

Connexion depuis le container Node → host doit être `postgres` (nom du service), pas `localhost` :

```javascript
const pool = new Pool({
    host: "postgres",
    port: 5432,
    database: "hosbank",
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PW,
});
```

Commandes utiles :

```bash
docker compose ps
docker compose logs -f
docker compose down
```



## Ajouter une fonctionnalité

Suivre cet ordre sans exception :

```
1. Model      → définir l'entité dans src/models/Model.js
2. Migration  → créer la table dans database/migrations/Migration.js
3. Repository → écrire les requêtes SQL dans src/repositories/Repository.js
4. Service    → implémenter la logique métier dans src/services/Service.js
5. Controller → gérer la requête HTTP dans src/controllers/controller.js
6. Route      → enregistrer l'endpoint dans src/routes/Rout.js
7. View       → créer le template .ejs dans views/
8. Middleware → ajouter si auth ou validation nécessaire
```

---

## Git Workflow

### Branches

| Branche | Rôle |
|---------|------|
| `main` | Production — stable uniquement |
| `dev` | Intégration — toutes les features passent par ici avant main |
| `feature/<nom>` | Développement d'une fonctionnalité |

### Créer une branche et pousser son travail

```bash
# 1. Se placer sur dev et se mettre à jour
git checkout dev
git pull origin dev

# 2. Créer sa branche de feature
git checkout -b feature/<nom-de-la-feature>

# 3. Travailler, puis committer
git add .
git commit -m "feat: description de la feature"

# 4. Pousser la branche sur le remote
git push origin feature/<nom-de-la-feature>
```

### Créer une Pull Request vers `dev`

1. Aller sur GitHub → onglet **Pull requests** → **New pull request**
2. `base: dev` ← `compare: feature/<nom-de-la-feature>`
3. Rédiger un titre clair et décrire les changements
4. Assigner un reviewer si nécessaire
5. Attendre la review avant de merger

### Rebase de `feature` sur `dev` (avant la PR)

Avant d'ouvrir la PR, s'assurer que la branche est à jour avec `dev` :

```bash
git checkout dev
git pull origin dev

git checkout feature/<nom-de-la-feature>
git rebase dev

# En cas de conflits : résoudre, puis
git add .
git rebase --continue

# Forcer le push après rebase
git push origin feature/<nom-de-la-feature> --force
```

### Rebase de `dev` sur `main`

Une fois les features validées dans `dev`, intégrer dans `main` :

```bash
git checkout main
git pull origin main

git checkout dev
git rebase main

# En cas de conflits : résoudre, puis
git add .
git rebase --continue

git push origin dev --force
```

Puis ouvrir une Pull Request : `base: main` ← `compare: dev`.

> ❌ Ne jamais pousser directement sur `main` ou `dev` sans Pull Request.
> ✅ Toujours rebase avant d'ouvrir une PR pour garder un historique propre.

---

## Troubleshooting

**Port 3000 occupé**
```bash
lsof -i :3000
kill -9 <PID>
```

**Container ne démarre pas**
```bash
docker compose logs -f node
```

**Problème de dépendances**
```bash
rm -rf node_modules package-lock.json && npm install
docker compose up --build
```

**Connexion BDD échoue** → vérifier que `host` vaut `postgres` dans `src/config/Database.js`.

**Variables manquantes** → vérifier que `.env` contient `POSTGRES_USER`, `POSTGRES_PW`, `PG_ADMIN_PW`.
