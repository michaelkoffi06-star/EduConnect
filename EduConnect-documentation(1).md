# EduConnect — Documentation projet

**Plateforme de mise en relation entre familles et instructeurs particuliers, en Côte d'Ivoire.**

---

## 1. Présentation

EduConnect connecte les élèves du système scolaire (collège à terminale) avec des instructeurs qualifiés, pour du soutien scolaire à domicile ou en ligne.

**Point clé du modèle** : les parents/élèves ne contactent **jamais directement** un instructeur. Toute demande passe par l'équipe EduConnect, qui fait l'intermédiaire manuellement. Ce choix structure une bonne partie de l'architecture (voir section 5).

---

## 2. Stack technique

| Couche | Techno |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS |
| Base de données | PostgreSQL (via Docker en local) |
| ORM | Prisma |
| Email transactionnel | Resend |
| Build tool | Turbopack |

Le projet est un **monolithe Next.js unique** : le site vitrine (marketing) et l'application (recherche de tuteur, inscription instructeur, admin) vivent dans le même projet, sous des routes différentes. Ce n'était pas le cas au départ — vitrine et app ont été fusionnées en cours de route pour éviter de maintenir deux déploiements séparés.

---

## 3. Structure du projet

```
src/
├── middleware.ts                       # Protège /admin et /api/admin (voir §7bis) — à renommer proxy.ts un jour
├── app/
│   ├── page.tsx                        # Vitrine (accueil, fond clair)
│   ├── trouver-un-tuteur/page.tsx      # Recherche + fiches instructeurs
│   ├── register-instructor/page.tsx    # Inscription instructeur (+ upload fichiers)
│   ├── modifier-profil/[token]/page.tsx # Auto-édition du profil via lien secret
│   ├── admin/
│   │   ├── page.tsx                    # Panneau admin (thème sombre), protégé par le middleware
│   │   └── login/page.tsx              # Connexion admin (mot de passe)
│   └── api/
│       ├── instructors/route.ts              # Liste publique des instructeurs (APPROVED)
│       ├── subjects/route.ts                 # Liste des matières
│       ├── contact/route.ts                  # Demande de mise en relation → admin
│       ├── contact-message/route.ts          # Formulaire de contact général → admin
│       ├── register-instructor/route.ts      # Inscription + upload photo/CNI/CV
│       ├── instructors/edit/[token]/route.ts # GET/PATCH profil via jeton secret
│       └── admin/
│           ├── login/route.ts                    # Vérifie le mot de passe, pose le cookie de session
│           ├── logout/route.ts                   # Supprime le cookie de session
│           ├── instructors/route.ts              # Liste complète (modération)
│           ├── instructors/[id]/route.ts         # PATCH statut (APPROVED/SUSPENDED/PENDING)
│           ├── instructors/[id]/document/route.ts # Sert CNI/CV (protégé par le middleware, voir §7bis)
│           └── match-requests/route.ts + [id]/    # Gestion des demandes de mise en relation
├── components/
│   ├── SiteHeader.tsx      # Header partagé, thème clair/sombre selon la page
│   └── MarketingStyles.tsx # Ancien système CSS custom (conservé, plus utilisé activement)
└── lib/
    ├── prisma.ts           # Client Prisma (singleton, adaptateur pg)
    └── admin-auth.ts        # Création/vérification du token de session admin (voir §7bis)

prisma/
└── schema.prisma           # Schéma de données (source de vérité)

public/
├── uploads/photos/          # Photos de profil (publiques)
└── marketing/               # Assets de l'ancienne vitrine HTML/CSS (conservés)

private-uploads/
└── instructors/[id]/        # CNI + CV (JAMAIS servis directement, hors de public/)
```

---

## 4. Modèle de données (résumé)

- **`Instructor`** — profil, statut de modération (`PENDING` / `APPROVED` / `SUSPENDED`), `photoUrl` (public), `cniUrl`/`cvUrl` (privés, noms de fichiers seulement), `editToken` (UUID secret pour l'auto-édition).
- **`Subject`** + **`InstructorSubject`** — relation many-to-many entre instructeurs et matières.
- **`ContactMessage`** — messages du formulaire de contact général du site.
- **`MatchRequest`** — une demande "je veux cet instructeur", avec un `status` (`NEW` / `CONTACTED` / `DONE`) que l'admin fait avancer manuellement.

Voir `prisma/schema.prisma` pour le détail exact des champs et enums.

---

## 5. Flux principaux

### Un parent trouve un tuteur
1. `/trouver-un-tuteur` — liste filtrable par matière, données réelles via `/api/instructors`.
2. Le parent clique "Choisir cet instructeur" → modal → `POST /api/contact`.
3. Ça crée un `MatchRequest` en base **et** envoie un email à l'admin (jamais à l'instructeur).
4. L'admin traite la demande dans `/admin`, onglet "Demandes".

### Un instructeur s'inscrit
1. `/register-instructor` — formulaire avec upload obligatoire de 3 fichiers : photo (min. 800×800px, vérifié côté serveur sans dépendance externe), CNI, CV.
2. `POST /api/register-instructor` (multipart) valide, stocke les fichiers, crée l'`Instructor` en statut `PENDING`.
3. Email de notification à l'admin + (tentative de) confirmation à l'instructeur avec son `editLink`.
4. L'admin approuve/suspend dans `/admin`.
5. L'instructeur peut revenir modifier ses infos via son lien secret (`/modifier-profil/[token]`) — toute modification repasse le profil en `PENDING`.

---

## 6. Lancer le projet en local

```bash
npm install
docker start tutoring_postgres   # ou docker compose up -d si le conteneur n'existe pas encore
npx prisma generate
npm run dev
```

Variables d'environnement nécessaires (`.env`, jamais commité) :
```
DATABASE_URL=
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```

---

## 7. Limitations connues / à traiter avant mise en production

- ~~`/admin` n'a aucune authentification.~~ **Réglé.** `/admin/**` et `/api/admin/**` sont protégés par une session admin (cookie signé). Voir section 7bis.
- **Fichiers uploadés stockés sur disque local** (`public/uploads/`, `private-uploads/`). Ne survivra pas à un déploiement sur une plateforme à système de fichiers éphémère (ex. Vercel). Il faudra migrer vers un stockage cloud (S3, Cloudflare R2...) au moment de l'hébergement.
- **Resend est en mode sandbox** : les emails ne partent que vers l'adresse du compte Resend (l'admin). Les emails destinés aux instructeurs eux-mêmes ne fonctionneront qu'après vérification d'un domaine sur resend.com/domains.
- **`/modifier-profil/[token]`** ne permet de modifier que les champs texte — pas encore de re-upload de photo/CNI/CV.

---

## 7bis. Authentification admin

**Admin unique**, identifiants stockés en variable d'environnement (`.env`, jamais commité) :

```
ADMIN_SESSION_SECRET=   # clé de signature HMAC des cookies de session
ADMIN_PASSWORD_HASH=    # format salt:hash (scrypt)
```

**Principe** : un cookie de session (`admin_session`, httpOnly) signé en HMAC-SHA256, vérifié par un middleware qui protège `/admin/**` et `/api/admin/**` en un seul point d'entrée.

```
src/
├── middleware.ts (ou proxy.ts en Next.js 16, voir note)  # Vérifie le cookie sur /admin et /api/admin, redirige/401 sinon
├── lib/
│   └── admin-auth.ts                    # Création/vérification du token de session (HMAC, compatible Edge)
└── app/
    ├── admin/
    │   └── login/page.tsx                # Formulaire de connexion (mot de passe seul)
    └── api/admin/
        ├── login/route.ts                # Vérifie le mot de passe (scrypt) → pose le cookie
        └── logout/route.ts               # Supprime le cookie
```

**Détails techniques** :
- Le hachage du mot de passe (scrypt, coûteux, résistant au brute-force) est fait uniquement dans `api/admin/login`, qui tourne en runtime Node.
- La signature/vérification du cookie utilise Web Crypto (HMAC), compatible à la fois Edge et Node — nécessaire car le middleware Next.js tourne par défaut sur le runtime Edge, qui n'a pas accès à `crypto.scrypt`.
- Aucune dépendance npm supplémentaire.
- Session valable 7 jours.

**Note (Next.js 16)** : la convention `middleware.ts` est dépréciée au profit de `proxy.ts` (même fonctionnement, juste un renommage). Le fichier vit actuellement en `src/middleware.ts` — à renommer en `src/proxy.ts` quand on voudra suivre la nouvelle convention.

**Génération des secrets** (à faire une fois, en local) :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ADMIN_SESSION_SECRET
```
Le hash du mot de passe se génère via un script scrypt (salt + hash séparés par `:`).

**Limitation actuelle** : un seul compte admin, pas de gestion multi-utilisateurs. À revoir si l'équipe grandit.

---

## 8. Historique de conception (pour contexte)

Le projet a démarré comme deux choses séparées : une vitrine statique HTML/CSS/JS, et une app Next.js indépendante pour la gestion des instructeurs. Elles ont été fusionnées dans un seul projet Next.js pour simplifier le déploiement et la maintenance. Le design a ensuite évolué d'un thème sombre "glassmorphism" chargé vers un style plus sobre (fond blanc, moins de sections), avec un header unique simplifié (logo + menu hamburger) partagé entre toutes les pages sauf l'admin, resté en thème sombre.

Une authentification par mot de passe unique a ensuite été ajoutée devant `/admin` (voir section 7bis), fermant la faille de sécurité la plus urgente identifiée en section 7.
