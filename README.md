# ConstructAi

Assistant expert en construction pour le Québec et le Canada — interface conversationnelle similaire à Claude/ChatGPT, **installable comme app sur iPhone/Android (PWA)**.

## Fonctionnalités

- Interface chat en temps réel (streaming SSE)
- Expertise CNB 2025, CNÉB 2025, CNP 2025, CNPI 2025, CCQ, Code civil du Québec
- Historique des conversations (localStorage)
- Rendu Markdown avec coloration syntaxique
- Thème sombre, accent orange construction
- Responsive — mobile + desktop
- **PWA** : installable sur iPhone, Android et desktop (Chrome / Safari)
- Modèle : Gemini 2.5 Flash (gratuit via Google AI Studio)

## Architecture

```
├── server.js              # Backend Express pour développement local
├── api/
│   └── chat.js            # Fonction serverless (Vercel Edge) pour la production
├── public/
│   ├── index.html         # Interface
│   ├── style.css          # Thème sombre
│   ├── app.js             # Logique frontend + enregistrement du service worker
│   ├── manifest.json      # Manifeste PWA
│   ├── sw.js              # Service worker (cache offline + installabilité)
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── .env                   # Variables d'environnement (non versionné)
```

## Développement local

```bash
npm install
cp .env.example .env
# Éditer .env et y mettre votre clé Gemini
npm start
# → http://localhost:3000
```

Obtenir une clé Gemini gratuite : https://aistudio.google.com/app/apikey

## Déploiement Vercel (production gratuite)

1. https://vercel.com → **Add New → Project**
2. Importer le repo `ConstructAi`
3. Dans **Environment Variables** : ajouter `GEMINI_API_KEY` avec votre clé
4. Cliquer **Deploy** — l'URL `https://construct-ai.vercel.app` (ou similaire) est live

## Installation sur téléphone (PWA)

Une fois déployé sur Vercel :

### iPhone (Safari)
1. Ouvrir l'URL Vercel dans Safari
2. Bouton **Partager** → **Sur l'écran d'accueil**
3. ConstructAi apparaît comme une vraie app

### Android (Chrome)
1. Ouvrir l'URL Vercel dans Chrome
2. Menu ⋮ → **Installer l'application**

## Limites gratuites (Gemini 2.5 Flash)

- 15 requêtes/minute
- 1 500 requêtes/jour
- 1 M tokens/minute en entrée
