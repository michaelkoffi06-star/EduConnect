# EduConnect CI — consignes pour Claude

Plateforme de mise en relation familles ↔ instructeurs (Abidjan, Côte d'Ivoire), en ligne sur
https://educonnect-ci.org. Fondateur et seul développeur : Michaël Koffi.

**Documentation complète et à jour : [`docs/documentation.md`](docs/documentation.md)** — la lire avant
toute modification importante (architecture, modèle de données, choix passés, pièges déjà rencontrés).

## Façon de travailler

- Réponses, commentaires dans le code et messages de commit en **français** ; les noms de code
  (variables, fonctions, fichiers) restent en **anglais**, comme dans le code existant.
- Michaël lance lui-même les commandes : donner des commandes **prêtes à coller**, étape par étape,
  et lui demander la sortie du terminal quand il faut vérifier.
- Une **branche** par fonctionnalité conséquente (`git checkout -b <nom>`) : `main` est déployée
  automatiquement en production par Vercel à chaque push.
- Après chaque fonctionnalité livrée : mettre à jour `docs/documentation.md` (nouvelle section §7…,
  §3 structure, §4 modèle de données, §8 historique, §9 fonctionnalités à développer). Les récits
  d'incidents vont dans la doc ; ici, seulement la règle et sa raison.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 · Prisma 7 (adaptateur `pg`) ·
PostgreSQL (Docker `tutoring_postgres` en local, Neon en production) · Cloudflare R2 (fichiers) ·
Resend (emails) · Vercel (hébergement).

## Commandes

```bash
docker start tutoring_postgres   # base locale
npm run dev                      # http://localhost:3000 (téléphone : adresse « Network »)
npx prisma db push               # applique le schéma sur la base locale

# Vérification avant chaque push, dans cet ordre :
npx tsc --noEmit
npm run build                    # prisma generate && next build
```

`npm run lint` remonte de nombreuses erreurs déjà présentes (`any`, setState dans un effet) : non
bloquant (`next build` ne lance pas le lint), ne pas chercher à tout corriger au passage.

## Base de données

- Le schéma s'applique avec **`prisma db push`, jamais `prisma migrate`** : le dossier
  `prisma/migrations` est un reste du début du projet, une commande `migrate` proposerait de
  réinitialiser la base.
- **Schéma modifié ⇒ le pousser sur Neon AVANT de fusionner dans `main`**, sinon la production plante :
  `DATABASE_URL="<url directe Neon, sans -pooler>" npx prisma db push`. Neon peut répondre `P1001`
  quand il se réveille : relancer.

## Sécurité

- **Ne jamais afficher ni committer de secret** (`.env`, URL Neon avec mot de passe, `ADMIN_SESSION_SECRET`,
  `USER_SESSION_SECRET`, `ADMIN_RECOVERY_KEY`, clés R2/Resend). Si un secret apparaît en clair, le
  signaler pour qu'il soit changé.
- `create-admin-user.js` reste **local et non commité** (dans `.gitignore`).
- **Admin** : toute route `/api/bleSseD/**` commence par `requireRole(request, [...])`
  (`src/lib/admin-permissions.ts`). Le middleware (`src/middleware.ts`) protège `/bleSseD`, `/pedagogie`,
  `/administratif` et transmet le rôle via l'en-tête `x-admin-role`. Rôles : `SUPER_ADMIN`,
  `PEDAGOGIE`, `ADMINISTRATIF`.
- **Comptes du site** (élèves, parents, instructeurs) : session **séparée** de l'admin (cookie
  `user_session`, `src/lib/user-auth.ts`, pages `/mon-compte` et `/espace-instructeur` protégées par le
  middleware). Toute route réservée commence par `getCurrentUser(request)` (`src/lib/user-session.ts`),
  plus `isApprovedInstructor()` pour le marché et la salle des profs. `USER_SESSION_SECRET` est
  optionnel (repli sur `ADMIN_SESSION_SECRET`) mais à définir à part en production.
- Corrigés : bucket R2 **privé**, servis uniquement par URL signée aux comptes connectés (§7quindecies).

## Architecture et conventions

- Uploads : jamais de fichier dans le corps d'une requête API (limite Vercel 4,5 Mo) — le navigateur
  envoie directement vers R2 via une URL présignée, l'API ne reçoit que des métadonnées (§7septies).
- Pages publiques interactives : `page.tsx` (serveur, métadonnées SEO) + `<Nom>Client.tsx` (client).
- `next/image` : toute qualité utilisée (`quality={…}`) doit figurer dans `images.qualities` de
  `next.config.ts` — sinon Next.js 16 répond 400 et l'image ne s'affiche pas.
- Bibliothèque v2 (étagère + classeur, lecture PDF via PDF.js depuis un CDN) : §7quaterdecies.
  Comptes, corrigés, marché des instructeurs et forum : §7quindecies.

## Design (choix de Michaël)

- Pages comptes/forum/espace instructeur : composants communs dans `src/components/compte/ui.tsx`,
  fonds photo Unsplash dans `public/images/comptes/` (crédits en §7quindecies).
- **Photos de fond immobiles** (ni zoom ni glissement), **cartes flottantes droites** (`animate-float-y`,
  sans rotation), fondu entre les pages via `src/components/PageTransition.tsx`.
- Ne jamais laisser de `filter`/`transform` actif en permanence sur un conteneur de page (même
  `blur(0px)`) : ça dérègle les éléments `position: fixed` et `backdrop-blur` à l'intérieur — revenir
  à `none` au repos.

## Dépannage

- `next dev` répond 404 sur toutes les routes API (souvent après un changement de branche) :
  `rm -rf .next` puis relancer.
- Sur téléphone, page affichée mais sans JavaScript (menu inactif, contenus absents) : l'adresse du PC
  doit être couverte par `allowedDevOrigins` dans `next.config.ts`.
- Après un push sur `main`, vérifier dans Vercel que le déploiement marqué **Production** est bien
  celui du dernier commit (un ancien déploiement peut y rester).
