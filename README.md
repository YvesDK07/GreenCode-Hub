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
| Front-end | HTML/CSS + EJS (SSR) | Zéro framework lourd, zéro JS client, pages ≈ 4 Ko |
| Back-end | Node.js + Express | Framework minimaliste, 5 dépendances |
| BDD | SQLite (sql.js) | Zéro serveur séparé, fichier unique |
| Auth | bcryptjs + express-session | Hashage bcrypt, sessions serveur |
| Déploiement | Render (free tier) | Infrastructure mutualisée |
| CI/CD | GitHub Actions | Contrôle taille CSS + nb de dépendances + build |

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
│   └── style.css          # CSS unique (8,4 Ko, sobriété maximale)
│
├── docs/
│   ├── Rapport_GreenCodeHub.pdf   # Rapport final (Partie 1 + 2)
│   ├── GreenCodeHub-Présentation.pdf # Support de présentation
│   └── screenshots/               # Captures Lighthouse / EcoIndex
│
└── .github/
    └── workflows/
        └── ci.yml         # Pipeline CI (contrôle taille + build)
```

## Conventions de commit

Format cible : `[type] description courte en français`

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

## Métriques Green IT mesurées

Mesures réalisées sur la version finale déployée (mai 2026), via EcoIndex et Google Lighthouse.

### Page d'accueil — chiffres clés

| Indicateur | Valeur | Source |
|------------|--------|--------|
| Poids total de la page | **4 Ko** (0,004 Mo) | EcoIndex |
| Requêtes HTTP | **2** | EcoIndex |
| Éléments DOM | **95** | EcoIndex |
| Score EcoIndex | **92/100 — note A** | EcoIndex |
| CO2 / 1 000 visites | **1,16 kgCO2e** (≈ 1,16 g par visite) | EcoIndex |
| Eau / 1 000 visites | **17,4 litres** | EcoIndex |
| Lighthouse Performance | **100 / 100** | Lighthouse |
| Lighthouse Best Practices | **100 / 100** | Lighthouse |
| Lighthouse SEO | **90 / 100** | Lighthouse |
| Lighthouse Accessibilité | **77 / 100** | Lighthouse |
| Classement EcoIndex | **8 479 / 593 940** pages | EcoIndex |

### Lighthouse sur les 3 pages principales

| Page | Performance | Accessibilité | Best Practices | SEO |
|------|:-:|:-:|:-:|:-:|
| Accueil (`/`) | 100 | 77 | 100 | 90 |
| Catalogue (`/catalogue`) | 100 | 79 | 100 | 90 |
| Nouveau snippet (`/new`) | 99 | 84 | 100 | 90 |

### Caractéristiques techniques côté sobriété

- **5 dépendances npm** uniquement (`express`, `ejs`, `sql.js`, `bcryptjs`, `express-session`).
- **0 octet de JavaScript applicatif côté client** (tout est rendu côté serveur via EJS).
- **0 image** sur l'ensemble du site (icônes Unicode).
- **0 police externe** (font-family: system-ui).
- **1 seul fichier CSS** de 8,4 Ko, sans framework, sans pré-processeur.

## Pistes d'amélioration identifiées (v2)

Plusieurs optimisations classiques n'ont pas été implémentées dans cette version livrée et constituent les axes prioritaires d'une v2 : compression gzip côté Express, en-tête `Cache-Control` sur les ressources statiques, minification CSS via cssnano, index BDD explicites sur les clés étrangères, pagination `LIMIT/OFFSET` sur le catalogue. Le détail figure dans la section 8 du rapport.
