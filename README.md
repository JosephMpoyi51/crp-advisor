# CRP Advisor

Application autonome Node.js + Express + MySQL pour Hostinger.

## Fonctionnalites

- Accueil moderne animee
- Annuaire des outils IA
- Fiches outils detaillees
- Questionnaire 6 etapes
- Scoring et top 3 personnalise
- Comparateur tableau
- Alternatives par outil
- Blog/guides
- Newsletter
- Contact
- Proposition d'outil
- Avis utilisateurs
- API analytics
- Dashboard admin

## Installation Hostinger Node.js

1. Creer une base MySQL dans Hostinger.
2. Importer `database/schema.sql` dans phpMyAdmin.
3. Copier `.env.example` vers `.env` et renseigner les variables.
4. Lancer `npm install`.
5. Lancer `npm run seed` une premiere fois.
6. Configurer l'application Node.js avec `server.js` comme fichier de demarrage.

## Variables importantes

- `ADMIN_EMAIL` et `ADMIN_PASSWORD` creent le compte administrateur lors du seed.
- `JWT_SECRET` doit etre une longue chaine aleatoire.
- `APP_URL` doit correspondre a `https://advisor.critiqueplus.com`.
