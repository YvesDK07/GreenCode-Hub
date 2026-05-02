# GreenCode Hub

**Plateforme collaborative de snippets de code éco-conçue.** Les développeurs partagent, comparent et votent pour des solutions de code classées par efficacité énergétique selon leur complexité algorithmique. Projet réalisé dans le cadre du module TI616 — Numérique Durable à l'EFREI Paris (2025-2026).

## Site déployé

**https://greencode-hub.onrender.com**

## Équipe — Groupe AFR2

| Membre | Rôle |
|--------|------|
| Yves de KERROS | Back-end (routes API, authentification, votes) |
| Raphael GIRARD | Front-end (templates EJS, CSS, responsive) |
| Lestyn JONES | Base de données (schéma, requêtes, seed) |
| Yohan DE LANDTSHEER | Documentation, tests, déploiement, CI/CD |
| Robinson DIALLO | Front-end complémentaire, wireframes, accessibilité |

## Stack technique

| Élément | Choix | Justification Green IT |
|---------|-------|----------------------|
| Front-end | HTML/CSS + EJS (SSR) | Zéro framework lourd, pages < 30 Ko |
| Back-end | Node.js + Express | Framework minimaliste, 5 dépendances |
| BDD | SQLite (sql.js) | Zéro serveur séparé, fichier unique |
| Auth | bcryptjs + express-session | Hashage bcrypt, sessions serveur |
| Déploiement | Render (free tier) | Infrastructure mutualisée |
| CI/CD | GitHub Actions | Contrôle taille CSS + vérification build |

## Installation locale

```bash
git clone https://github.com/YvesDK07/GreenCode-Hub.git
cd GreenCode-Hub
npm install
npm start
```

Le site est accessible sur **http://localhost:3000**

### Compte admin par défaut

- Email : `admin@greencode.hub`
- Mot de passe : `admin123`

## Structure du dépôt

```
GreenCode-Hub/
├── server.js              # Point d'entrée Express (SSR)
├── package.json           # 5 dépendances uniquement
├── .env.example           # Variables d'environnement (template)
├── .gitignore             # Exclusions (node_modules, .env, BDD)
│
├── db/
│   └── init.js            # Initialisation SQLite + seed données
│
├── middleware/
│   └── auth.js            # Middleware authentification + injection user
│
├── routes/
│   ├── auth.js            # CRUD utilisateurs (register, login, profile, delete)
│   └── snippets.js        # CRUD snippets + votes + catalogue + filtres
│
├── views/                 # Templates EJS (rendu côté serveur)
│   ├── partials/
│   │   ├── header.ejs     # Header + navigation
│   │   └── footer.ejs     # Footer + badge éco
│   ├── index.ejs          # Page d'accueil + engagements
│   ├── catalogue.ejs      # Catalogue filtrable
│   ├── snippet.ejs        # Fiche snippet détaillée
│   ├── new-snippet.ejs    # Formulaire création
│   ├── edit-snippet.ejs   # Formulaire modification
│   ├── login.ejs          # Connexion
│   ├── register.ejs       # Inscription
│   ├── profile.ejs        # Profil + gestion compte
│   └── about.ejs          # À propos + démarche Green IT
│
├── public/
│   └── style.css          # CSS unique (8.4 Ko, sobriété maximale)
│
├── docs/
│   ├── Rapport_GreenCodeHub.pdf   # Rapport final (Partie 1 + 2)
│   └── screenshots/               # Captures Lighthouse / EcoIndex
│
└── .github/
    └── workflows/
        └── ci.yml         # Pipeline CI (contrôle taille + build)
```

## Conventions de commit

Format : `[type] description courte en français`

| Type | Usage |
|------|-------|
| `[feat]` | Nouvelle fonctionnalité |
| `[fix]` | Correction de bug |
| `[style]` | CSS / design |
| `[docs]` | Documentation |
| `[refactor]` | Restructuration de code |
| `[test]` | Ajout de tests |
| `[chore]` | Maintenance |

## Rapport

Le rapport PDF complet (Partie 1 + Partie 2) est disponible dans [`docs/Rapport_GreenCodeHub.pdf`](docs/Rapport_GreenCodeHub.pdf).

## Métriques Green IT

| Indicateur | Valeur |
|------------|--------|
| Poids page d'accueil | 18 Ko (gzippé) |
| Requêtes HTTP / page | 3 |
| Score EcoIndex | A (95/100) |
| CO2 / visite | 0.04 g |
| Lighthouse Performance | 99/100 |
| Dépendances npm | 5 |
| Fichier CSS | 8.4 Ko (unique) |
