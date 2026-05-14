# CRP Advisor

Application autonome Node.js + Express + MySQL pour Hostinger. Elle reprend la logique de recommandation de l'ancienne application, mais avec une structure plus propre et facile à maintenir.

## Fonctionnalités

- Page d'accueil moderne et animée
- Annuaire d'outils IA
- Questionnaire de recommandation en 6 étapes
- Résultats personnalisés avec score
- Comparateur d'outils
- Pages Deals, Blog, Contact et Proposer un outil
- API Express séparée du front
- Dashboard admin protégé par session JWT
- Support MySQL avec fallback mémoire en développement

## Structure

```text
server.js                 Entrée Express
public/index.html         Shell HTML
public/assets/app.css     Styles frontend
public/assets/app.js      Application frontend vanilla JS
src/routes/api.js         Routes API publiques et admin
src/lib/db.js             Accès MySQL + fallback mémoire
src/lib/scoring.js        Moteur de recommandation
src/lib/seed-data.js      Données de départ
database/schema.sql       Schéma SQL complet
database/seed.js          Initialisation outils + admin
```

## Installation Hostinger

1. Connecter ce dépôt GitHub dans Hostinger.
2. Définir le point d'entrée Node.js sur `server.js`.
3. Lancer `npm install`.
4. Renseigner les variables d'environnement à partir de `.env.example`.
5. Lancer `npm run seed` une fois pour créer les tables, les outils de départ et l'admin.
6. Démarrer l'application avec `npm start`.

## Admin

Pour créer ou mettre à jour l'accès admin, définissez `ADMIN_EMAIL` et `ADMIN_PASSWORD`, puis lancez:

```bash
npm run seed
```

Le dashboard est disponible sur `/admin`.
