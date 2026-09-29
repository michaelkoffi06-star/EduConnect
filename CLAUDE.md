# EduConnect CI — consignes pour Claude

Plateforme de mise en relation familles ↔ instructeurs (Abidjan, Côte d'Ivoire), en ligne sur
https://educonnect-ci.org. Fondateur et seul développeur : Michaël Koffi.

**Documentation complète et à jour : [`docs/documentation.md`](docs/documentation.md)** — la lire avant
toute modification importante (architecture, modèle de données, choix passés, pièges déjà rencontrés).

## Façon de travailler

- Tout se fait en **français** : réponses, commentaires dans le code, messages de commit.
- Michaël lance lui-même les commandes : donner des commandes **prêtes à coller**, étape par étape,
  et lui demander la sortie du terminal quand il faut vérifier.
- Travailler sur une **branche** pour toute fonctionnalité conséquente (`git checkout -b <nom>`) ;
  `main` est déployée automatiquement en production par Vercel à chaque push.
- Après chaque fonctionnalité livrée : mettre à jour `docs/documentation.md` (nouvelle section §7…,
  §3 structure, §4 modèle de données, §8 historique, §9 fonctionnalités à développer).

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 · Prisma 7 (adaptateur `pg`) ·
PostgreSQL (Docker `tutoring_postgres` en local, Neon en production) · Cloudflare R2 (fichiers) ·
Resend (emails) · Vercel (hébergement).

## Commandes

```bash
docker start tutoring_postgres   # base locale
npm run dev                      # http://localhost:3000 (téléphone : adresse « Network »)
npm run build                    # prisma generate && next build — à lancer avant chaque push
npx prisma db push               # applique le schéma sur la base locale
```

## Règles et pièges connus

- **Schéma Prisma modifié ⇒ le pousser sur Neon AVANT de fusionner dans `main`**, sinon la production
  plante : `DATABASE_URL="<url directe Neon, sans -pooler>" npx prisma db push`. Neon peut répondre
  `P1001` quand il se réveille : relancer.
- **Ne jamais afficher ni committer de secret** (`.env`, URL Neon avec mot de passe, `ADMIN_RECOVERY_KEY`,
  clés R2/Resend). Si un secret apparaît en clair, le signaler pour qu'il soit changé.
- `create-admin-user.js` reste **local et non commité** (dans `.gitignore`).
- Toute route `/api/bleSseD/**` commence par `requireRole(request, [...])` (`src/lib/admin-permissions.ts`) ;
  le middleware (`src/middleware.ts`) protège `/bleSseD`, `/pedagogie`, `/administratif` et transmet
  le rôle via l'en-tête `x-admin-role`. Rôles : `SUPER_ADMIN`, `PEDAGOGIE`, `ADMINISTRATIF`.
- Uploads : jamais de fichier dans le corps d'une requête API (limite Vercel 4,5 Mo) — le navigateur
  envoie directement vers R2 via une URL présignée, l'API ne reçoit que des métadonnées.
- Pages publiques interactives : `page.tsx` (serveur, métadonnées SEO) + `<Nom>Client.tsx` (client).
- Si `next dev` répond 404 sur toutes les routes API (souvent après un changement de branche) :
  `rm -rf .next` puis relancer.
- Après un push sur `main`, vérifier dans Vercel que le déploiement marqué **Production** est bien
  celui du dernier commit (un ancien déploiement est déjà resté en production).
- Bibliothèque v2 (étagère + classeur, lecture PDF via PDF.js depuis un CDN) : voir §7quaterdecies
  de la documentation.
- Comptes du site (élèves, parents, instructeurs) : session **séparée** de l'admin (cookie `user_session`,
  `src/lib/user-auth.ts`) ; toute route réservée commence par `getCurrentUser(request)`
  (`src/lib/user-session.ts`), et `isApprovedInstructor()` pour le marché et la salle des profs.
  Corrigés dans le bucket R2 **privé**. Voir §7quindecies.
