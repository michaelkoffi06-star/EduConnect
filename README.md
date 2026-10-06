# EduConnect CI

Plateforme de mise en relation entre familles et instructeurs (cours à domicile et en ligne) à Abidjan,
Côte d'Ivoire. En ligne sur **[educonnect-ci.org](https://educonnect-ci.org)**.

Fondateur et développeur : Michaël Koffi.

## Fonctionnalités

- **Trouver un tuteur** : recherche d'instructeurs vérifiés par matière, niveau (primaire, collège,
  lycée), mode d'enseignement, ville et commune ; demande de mise en relation.
- **Devenir instructeur** : candidature avec photo, CNI et CV, validée par l'équipe ; modification du
  profil par lien personnel.
- **Bibliothèque** : cours, exercices, vidéos et liens rangés en étagère par matière, ouverts dans un
  classeur à onglets, lecture en ligne (y compris sur mobile) et téléchargement.
- **Comptes** élèves, parents et instructeurs : corrigés réservés aux membres, forum d'entraide
  (questions, salle des profs), marché d'annonces pour les instructeurs approuvés.
- **Administration** à trois rôles (`SUPER_ADMIN`, `PEDAGOGIE`, `ADMINISTRATIF`) : modération des
  instructeurs, demandes, bibliothèque, contrats, forum.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma 7 (adaptateur `pg`) ·
PostgreSQL (Docker en local, Neon en production) · Cloudflare R2 (fichiers) · Resend (emails) ·
Vercel (hébergement).

## Démarrer en local

Prérequis : Node.js 20 ou plus (22 recommandé), Docker.

```bash
npm install
docker start tutoring_postgres   # ou : docker compose up -d (première fois)
npx prisma db push               # crée les tables dans la base locale
npm run dev                      # http://localhost:3000
```

Pour tester sur téléphone, ouvrir l'adresse « Network » affichée par `npm run dev` (le PC doit être
couvert par `allowedDevOrigins` dans `next.config.ts`).

### Variables d'environnement

À placer dans un fichier `.env` à la racine (**jamais commité**, il est dans `.gitignore`) :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `ADMIN_SESSION_SECRET` | Signature des sessions admin (32 octets aléatoires au moins) |
| `USER_SESSION_SECRET` | Signature des sessions des comptes (distincte de la précédente en production) |
| `ADMIN_RECOVERY_KEY` | Clé de secours pour réinitialiser le mot de passe SUPER_ADMIN |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Accès Cloudflare R2 |
| `R2_BUCKET_PHOTOS`, `R2_PUBLIC_URL_PHOTOS` | Bucket public (photos, ressources) et son adresse publique |
| `R2_BUCKET_PRIVATE` | Bucket privé (CNI, CV, corrigés, envois en attente) |
| `RESEND_API_KEY` | Envoi des emails |
| `ADMIN_NOTIFICATION_EMAIL` | Adresse qui reçoit les notifications (candidatures, demandes…) |
| `SITE_URL` | Optionnel : adresse du site dans les emails (par défaut `https://educonnect-ci.org`) |
| `MAINTENANCE_MODE` | Optionnel : `true` affiche la page de maintenance |

Le premier compte admin se crée avec un script local, non versionné.

## Commandes

```bash
npm run dev          # serveur de développement
npx tsc --noEmit     # vérification des types
npm run build        # prisma generate + build de production
npm run lint         # lint (des erreurs anciennes subsistent, non bloquantes)
```

Après une modification de `prisma/schema.prisma` : `npx prisma db push` puis `npx prisma generate`.
Le schéma s'applique toujours avec `db push`, **jamais `prisma migrate`**.

## Déploiement

- `main` est déployée automatiquement en production par Vercel à chaque push : chaque fonctionnalité
  se développe sur une branche, vérifiée avec `npx tsc --noEmit` et `npm run build` avant la fusion.
- Si le schéma a changé, le pousser sur Neon **avant** de fusionner dans `main` :
  `DATABASE_URL="<url directe Neon, sans -pooler>" npx prisma db push`.
- Après la fusion, vérifier dans Vercel que le déploiement **Production** est bien celui du dernier commit.

## Organisation du code

```
src/
├── app/            # Pages (page.tsx serveur + <Nom>Client.tsx) et routes API (app/api/**)
├── components/     # Composants partagés (en-tête, transitions, bibliothèque, comptes, admin)
├── lib/            # Accès base, R2, emails, sessions, sécurité (rate-limit, site, permissions)
└── middleware.ts   # Protection des espaces admin et comptes
prisma/schema.prisma
scripts/            # Scripts ponctuels de maintenance des données
docs/documentation.md
```

## Documentation

Tout le détail (architecture, modèle de données, choix passés, sécurité, historique, pistes) est dans
**[`docs/documentation.md`](docs/documentation.md)**. Les consignes de travail pour Claude Code sont
dans [`CLAUDE.md`](CLAUDE.md).

Pour **comprendre** comment le projet est construit (requêtes, base de données, fichiers, sessions,
sécurité), avec un glossaire des termes clés : **[`docs/guide-du-projet.md`](docs/guide-du-projet.md)**.

## Sécurité

Pour signaler une faille, passer par le formulaire de contact de
[educonnect-ci.org](https://educonnect-ci.org) plutôt que d'ouvrir une issue publique.
