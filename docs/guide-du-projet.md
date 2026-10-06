# Comprendre EduConnect — guide d'apprentissage

Ce guide explique **comment le site est construit et pourquoi**, partie par partie, pour qu'un étudiant
(ou toi, dans six mois) puisse s'en servir pour apprendre le développement web à partir d'un vrai
projet en production. Il complète :

- le [README](../README.md), qui dit **quoi** faire (installer, lancer, déployer) ;
- la [documentation technique](documentation.md), qui consigne **tout** le détail et l'historique.

Ici, on prend le temps d'expliquer. Chaque mot technique en **gras** au moment où il apparaît est
défini dans le [glossaire](#13-glossaire) à la fin.

## Sommaire

1. [Ce que fait le site](#1-ce-que-fait-le-site)
2. [Vue d'ensemble : les pièces et comment elles se parlent](#2-vue-densemble--les-pièces-et-comment-elles-se-parlent)
3. [Le parcours d'une requête](#3-le-parcours-dune-requête)
4. [Organisation des fichiers](#4-organisation-des-fichiers)
5. [La base de données](#5-la-base-de-données)
6. [Les fichiers (photos, PDF) et Cloudflare R2](#6-les-fichiers-photos-pdf-et-cloudflare-r2)
7. [Connexion, sessions et rôles](#7-connexion-sessions-et-rôles)
8. [Les emails](#8-les-emails)
9. [Les fonctionnalités, une par une](#9-les-fonctionnalités-une-par-une)
10. [La sécurité : les principes appliqués](#10-la-sécurité--les-principes-appliqués)
11. [Travailler et mettre en production](#11-travailler-et-mettre-en-production)
12. [Pour s'exercer](#12-pour-sexercer)
13. [Glossaire](#13-glossaire)

---

## 1. Ce que fait le site

EduConnect met en relation des **familles** qui cherchent un répétiteur et des **instructeurs**
(professeurs, étudiants, répétiteurs) vérifiés par l'équipe, à Abidjan. Autour de ce cœur :

- une **bibliothèque** de cours, exercices, vidéos et liens, lisible sur téléphone ;
- des **comptes** pour les élèves, parents et instructeurs : corrigés des exercices, forum d'entraide,
  et pour les instructeurs approuvés, un marché d'annonces de familles ;
- des **panneaux d'administration** pour l'équipe, avec trois rôles différents.

Le site est **en ligne** : de vraies personnes s'en servent. Beaucoup de choix techniques expliqués
plus bas viennent de là : un projet d'école peut se permettre d'être fragile, un site public non.

---

## 2. Vue d'ensemble : les pièces et comment elles se parlent

```
          Navigateur (téléphone ou ordinateur)
             │                    │
             │ pages et API       │ envoi / lecture directe des fichiers
             ▼                    ▼
   ┌──────────────────┐    ┌──────────────────┐
   │ Vercel           │    │ Cloudflare R2    │  photos, PDF, CNI, CV
   │ (Next.js : pages │───▶│ (stockage de     │
   │  + routes API)   │    │  fichiers)       │
   └──────────────────┘    └──────────────────┘
        │          │
        │ Prisma   │ API Resend
        ▼          ▼
   ┌──────────┐  ┌──────────┐
   │ Neon     │  │ Resend   │  emails (confirmation, notifications…)
   │ (Postgre │  └──────────┘
   │  SQL)    │
   └──────────┘
```

| Pièce | Rôle | Pourquoi ce choix |
|---|---|---|
| **Next.js** (avec **React** et **TypeScript**) | Fabrique les pages et répond aux requêtes de l'**API** | Un seul projet pour le **frontend** et le **backend**, très bien hébergé par Vercel |
| **Tailwind CSS** | Le style (couleurs, marges, mise en page) | On écrit le style directement dans les composants, sans gros fichiers CSS |
| **PostgreSQL** | La **base de données** (instructeurs, comptes, ressources…) | Base relationnelle solide, gratuite, standard |
| **Prisma** | Fait le lien entre le code TypeScript et PostgreSQL | On écrit `prisma.instructor.findMany(...)` au lieu de requêtes **SQL** à la main, avec des types vérifiés |
| **Neon** | Héberge PostgreSQL en production | PostgreSQL « dans le cloud », offre gratuite |
| **Docker** | Fait tourner un PostgreSQL local pour développer | La même base qu'en production, sans rien installer à la main |
| **Cloudflare R2** | Stocke les fichiers (photos, PDF, CNI, CV) | Une base de données n'est pas faite pour les gros fichiers ; R2 est peu cher et sans frais de sortie |
| **Resend** | Envoie les emails | Envoyer des emails soi-même est compliqué (spam, réputation) |
| **Vercel** | Héberge le site | Met en ligne automatiquement à chaque `git push` sur `main` |
| **Git / GitHub** | Historique du code, sauvegarde | Chaque changement est daté, expliqué, et annulable |

**À retenir :** le site n'est pas « un programme » mais plusieurs **services** qui coopèrent. Le code
Next.js est le chef d'orchestre ; il ne stocke rien lui-même (ni données, ni fichiers).

---

## 3. Le parcours d'une requête

Quand quelqu'un tape `educonnect-ci.org/trouver-un-tuteur`, voici ce qui se passe.

1. **Le navigateur envoie une requête HTTP** (`GET /trouver-un-tuteur`) à Vercel.
2. **Le middleware** (`src/middleware.ts`) s'exécute **avant** tout le reste. Il regarde l'adresse
   demandée et décide : laisser passer, rediriger vers la connexion (page réservée et pas de session),
   ou afficher la page de maintenance si le site est en maintenance.
3. **Next.js trouve la page** grâce à l'**App Router** : le dossier `src/app/trouver-un-tuteur/`
   contient un fichier `page.tsx`, donc cette adresse existe.
4. **La page est fabriquée.** `page.tsx` est un **composant serveur** : il s'exécute sur Vercel, pose
   le titre et la description de la page (pour Google), puis affiche `TrouverUnTuteurClient.tsx`,
   un **composant client** qui tourne dans le navigateur et gère l'interactivité (filtres, clics).
5. **Le composant client demande les données** à l'API : `fetch('/api/instructors?subject=...')`.
6. **La route API** (`src/app/api/instructors/route.ts`) interroge la base via Prisma, ne garde que
   les instructeurs approuvés et seulement les champs publics, et renvoie du **JSON**.
7. **Le navigateur affiche** les fiches à partir de ce JSON.

```
navigateur ──GET /trouver-un-tuteur──▶ middleware ──▶ page.tsx (serveur) ──▶ HTML + JS
navigateur ──GET /api/instructors────▶ middleware ──▶ route.ts ──Prisma──▶ Neon
navigateur ◀──────────── JSON (instructeurs approuvés, champs publics) ─────────┘
```

**Pourquoi séparer `page.tsx` et `…Client.tsx` ?** Le composant serveur peut fournir des
**métadonnées** (titre, description, aperçu pour WhatsApp et Facebook) que Google lit ; le composant
client, lui, peut réagir aux clics. C'est une convention du projet : chaque page publique interactive
a les deux.

**Les codes de réponse HTTP** qu'on rencontre partout dans le code : `200` tout va bien, `201` créé,
`400` requête invalide (champ manquant…), `401` pas connecté, `403` connecté mais pas le droit,
`404` introuvable, `409` conflit (email déjà pris…), `429` trop de requêtes, `500` erreur du serveur.

---

## 4. Organisation des fichiers

```
src/
├── app/                      # App Router : un dossier = une adresse du site
│   ├── page.tsx              #   accueil (/)
│   ├── trouver-un-tuteur/    #   /trouver-un-tuteur (page.tsx + TrouverUnTuteurClient.tsx)
│   ├── bibliotheque/         #   /bibliotheque et /bibliotheque/[key] (une ressource)
│   ├── forum/ , mon-compte/ , inscription/ , connexion/ …
│   └── api/                  # les routes API : un dossier = une adresse /api/…
│       ├── instructors/route.ts         # GET /api/instructors
│       ├── register-instructor/route.ts # POST /api/register-instructor
│       └── …
├── components/               # morceaux d'interface réutilisés (en-tête, lecteur PDF…)
├── lib/                      # la logique partagée, sans interface
│   ├── prisma.ts             #   connexion à la base
│   ├── r2.ts                 #   fichiers sur R2
│   ├── user-session.ts …     #   comptes et sessions
│   └── rate-limit.ts …       #   sécurité
└── middleware.ts             # le « portier » qui voit passer toutes les requêtes
prisma/schema.prisma          # la description de la base de données
```

- **Un dossier entre crochets** (`[key]`, `[id]`, `[token]`) est une **route dynamique** :
  `/bibliotheque/[key]` répond à `/bibliotheque/theoreme-de-pythagore-3e-1b8daa`, et le code reçoit
  `key = "theoreme-de-pythagore-3e-1b8daa"`.
- **Dans une route API**, chaque méthode HTTP est une fonction exportée : `export async function GET`,
  `POST`, `PATCH`, `DELETE`.
- **`lib/`** contient ce qui ne dépend pas d'une page : si deux routes ont besoin de la même logique,
  elle va dans `lib/` au lieu d'être recopiée.

---

## 5. La base de données

### Le schéma

Toute la structure de la base est décrite dans **un seul fichier** : `prisma/schema.prisma`. Chaque
`model` devient une **table**, chaque ligne du modèle une **colonne**. Exemple simplifié :

```prisma
model Instructor {
  id        String        @id @default(uuid())   // identifiant unique, généré
  firstName String
  status    ProfileStatus @default(PENDING)      // en attente tant que l'équipe n'a pas validé
  email     String        @unique                // deux instructeurs ne peuvent pas avoir le même
  subjects  InstructorSubject[]                  // relation : ses matières
}
```

- `@id` : la **clé primaire**, ce qui identifie une ligne de façon unique.
- `@default(...)` : la valeur mise automatiquement si on n'en donne pas.
- `@unique` : la base refuse deux lignes avec la même valeur (erreur Prisma `P2002`).
- `enum` : une liste fermée de valeurs (`PENDING`, `APPROVED`, `SUSPENDED`).
- `String?` : le `?` veut dire que la colonne peut être vide (`null`).

### Les relations

Les tables sont reliées par des **clés étrangères**. Les trois formes à connaître, toutes présentes ici :

| Relation | Exemple dans EduConnect | Comment c'est fait |
|---|---|---|
| **Un à plusieurs** | Une matière (`Subject`) a plusieurs ressources (`Resource`) | `Resource.subjectId` pointe vers `Subject.id` |
| **Plusieurs à plusieurs** | Un instructeur enseigne plusieurs matières, une matière a plusieurs instructeurs | Une **table de liaison** `InstructorSubject` (une ligne = un couple instructeur-matière) |
| **Un à un** | Une fiche instructeur a au plus un compte de connexion | `User.instructorId` marqué `@unique` |

`onDelete: Cascade` dit à la base quoi faire quand on supprime le « parent » : supprimer aussi les
« enfants ». `onDelete: SetNull` les garde mais vide le lien : supprimer un chapitre de la
bibliothèque conserve ses ressources, simplement détachées.

### Les grandes familles de tables

| Famille | Tables | À quoi elles servent |
|---|---|---|
| Mise en relation | `Instructor`, `Subject`, `InstructorSubject`, `MatchRequest`, `WaitlistEntry` | Les instructeurs, leurs matières, les demandes des familles, la liste d'attente |
| Bibliothèque | `Chapter`, `Resource`, `Correction` | Classeurs, documents, corrigés |
| Comptes | `User`, `UserToken` | Comptes du site, jetons envoyés par email |
| Communauté | `ForumThread`, `ForumPost`, `ForumReport`, `MarketOffer`, `MarketInterest` | Forum, signalements, annonces et candidatures |
| Équipe | `AdminUser`, `Contract`, `ContractEntry`, `Feedback`, `ContactMessage` | Comptes admin, suivi des contrats, suggestions, messages |
| Technique | `LoginAttempt` | Compteur de tentatives (limites anti-abus) |

### Utiliser Prisma dans le code

```ts
// Les 10 instructeurs approuvés les plus récents, avec leurs matières
const instructors = await prisma.instructor.findMany({
  where: { status: 'APPROVED' },
  include: { subjects: { include: { subject: true } } },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

- `where` filtre, `orderBy` trie, `take` limite, `include` ramène les tables liées.
- `select` choisit **exactement** les colonnes à ramener : c'est ce qu'utilise la liste publique des
  instructeurs, pour ne jamais envoyer l'email, le WhatsApp ou les documents au navigateur.
- Tout est **asynchrone** (`await`) : la base est un autre service, la réponse prend du temps.

### Faire évoluer la base

Quand on ajoute un champ au schéma, il faut l'appliquer à la base : `npx prisma db push`. Deux règles
apprises à la dure :

1. **En production, on pousse le schéma sur Neon avant de mettre le code en ligne.** Sinon le nouveau
   code demande une colonne qui n'existe pas encore, et le site plante.
2. **`db push` et non `migrate`** dans ce projet (voir la doc technique). Dans un projet en équipe, on
   préférerait les **migrations**, qui gardent un historique des changements de la base.

---

## 6. Les fichiers (photos, PDF) et Cloudflare R2

### Pourquoi pas dans la base, ni sur le serveur ?

- Une base de données stocke très bien du texte et des nombres, mal des fichiers de plusieurs Mo.
- Vercel n'a pas de disque durable : un fichier écrit sur le serveur disparaît au prochain déploiement.
- Vercel refuse les requêtes de plus de **4,5 Mo** : une photo + une CNI + un CV envoyés d'un coup
  depuis un téléphone dépassent vite cette limite.

D'où **R2**, un service de **stockage objet** : on y range des fichiers sous une **clé** (un nom
comme `resources/1b8daa8e….pdf`), dans des **buckets** (des « bacs »).

### Deux buckets : public et privé

| Bucket | Contenu | Accès |
|---|---|---|
| Public | Photos des instructeurs, documents de la bibliothèque | Lisible par tout le monde à une adresse publique |
| Privé | CNI, CV, corrigés, envois en attente | Jamais lisible directement : seulement par **URL présignée** délivrée par le serveur, ou relu par le serveur lui-même pour l'équipe (CNI, CV) |

### L'envoi en trois temps (URL présignée)

Le fichier ne passe **jamais** par le serveur Next.js :

```
1. navigateur ──« je veux envoyer un PDF de 2 Mo »──▶ API ──▶ fabrique une URL présignée (valable 5 min)
2. navigateur ──PUT du fichier──────────────────────────────▶ R2 (vérifie la signature de l'URL)
3. navigateur ──« c'est envoyé »────────────────────────────▶ API ──▶ vérifie sur R2, puis écrit en base
```

Une **URL présignée** est une adresse R2 qui contient une **signature** calculée par le serveur avec
la clé secrète R2. Elle autorise **un seul type d'opération** (ici : déposer un fichier) **sur une clé
précise**, **pendant quelques minutes**. Sur les routes publiques, la taille exacte du fichier est
signée elle aussi : R2 refuse un fichier d'une autre taille. Le navigateur peut donc envoyer
directement à R2 sans jamais connaître la clé secrète.

Ce mécanisme impose une règle **CORS** côté R2 : la liste des sites autorisés à envoyer des fichiers
depuis un navigateur. C'est pourquoi un envoi échoue (« NetworkError ») si on utilise le site depuis
une autre adresse que `educonnect-ci.org`.

Le même principe sert à **lire** un fichier privé (un corrigé) : le serveur vérifie que la personne est
connectée, puis lui fournit une URL présignée de lecture valable 5 minutes (ou la redirige vers une URL
de téléchargement).

---

## 7. Connexion, sessions et rôles

### Ne jamais stocker un mot de passe

La base ne contient pas les mots de passe mais leur **hachage** (`passwordHash`), calculé avec
**scrypt** et un **sel** aléatoire propre à chaque compte (`src/lib/password.ts`). Un hachage ne se
« décode » pas : pour vérifier une connexion, on hache le mot de passe saisi avec le même sel et on
compare les deux résultats. Si la base fuitait, les mots de passe ne seraient pas lisibles.

### Rester connecté : la session

HTTP ne se souvient de rien d'une requête à l'autre. Après une connexion réussie, le serveur pose donc
un **cookie** contenant un **jeton de session** : le navigateur le renvoie automatiquement à chaque
requête, ce qui prouve qui l'on est.

Le jeton d'EduConnect ressemble à un **JWT** simplifié : `contenu.signature`.

- **Contenu** : qui (`sub` = l'identifiant du compte), quel rôle, jusqu'à quand (`exp`), en
  **base64url** (lisible par n'importe qui, ce n'est pas chiffré).
- **Signature** : un **HMAC-SHA256** du contenu, calculé avec un **secret** que seul le serveur connaît,
  rangé dans une variable d'environnement : `ADMIN_SESSION_SECRET` pour l'équipe, `USER_SESSION_SECRET`
  pour les comptes du site.

Si quelqu'un modifie le contenu (« role: SUPER_ADMIN »), la signature ne correspond plus et le jeton
est refusé. Sans le secret, impossible de fabriquer une signature valide.

Le cookie est posé avec trois protections :

| Option | Effet |
|---|---|
| `httpOnly` | Le JavaScript de la page ne peut pas lire le cookie (protège d'un vol par **XSS**) |
| `secure` | Envoyé uniquement en HTTPS (activé en production ; en local, le site tourne en HTTP) |
| `sameSite: 'lax'` | Pas envoyé par les requêtes `POST` venues d'autres sites (protège du **CSRF**) |

### Deux systèmes séparés

| | Équipe (admin) | Comptes du site |
|---|---|---|
| Qui | SUPER_ADMIN, PEDAGOGIE, ADMINISTRATIF | Élèves, parents, instructeurs |
| Table | `AdminUser` | `User` |
| Cookie | `admin_session` (7 jours) | `user_session` (30 jours) |
| Code | `src/lib/bleSseD-auth.ts`, `admin-permissions.ts` | `src/lib/user-auth.ts`, `user-session.ts` |

Les séparer évite qu'une faille côté comptes publics donne accès aux outils de l'équipe.

### Authentification et autorisation

Deux questions différentes, deux étapes dans le code :

1. **Authentification** : « qui es-tu ? ». Le middleware vérifie la signature du cookie avant même
   d'arriver à la page.
2. **Autorisation** : « as-tu le droit ? ». Chaque route admin commence par
   `await requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE'])`, qui relit le compte **en base** et
   refuse (`403`) si son rôle n'est pas dans la liste. C'est le **contrôle d'accès par rôle**.

Pourquoi relire en base alors que le rôle est déjà dans le jeton ? Parce qu'un jeton reste valable
7 jours : si on retire un rôle ou supprime un compte, il faut que ça prenne effet tout de suite. Le
champ `sessionVersion` sert à ça : il augmente à chaque changement de mot de passe ou de rôle, et tout
jeton portant une ancienne version est refusé.

### Les jetons envoyés par email

Confirmer une adresse ou réinitialiser un mot de passe passe par un lien contenant un jeton aléatoire.
La base n'en garde que le **hachage SHA-256** (table `UserToken`), avec une date d'expiration (1 h ou
48 h) et une date d'utilisation : un lien ne sert qu'une fois, et quelqu'un qui lirait la base ne
pourrait pas s'en servir.

---

## 8. Les emails

Les emails partent par l'**API** de Resend (`src/lib/resend.ts`, `src/lib/user-emails.ts`), depuis
l'adresse `notifications@educonnect-ci.org`. Le domaine a été vérifié chez Resend (enregistrements
**DNS**), sinon les emails finissent en spam ou sont refusés.

Deux règles de sécurité :

- **Tout texte saisi par un visiteur passe par `escapeHtml()`** avant d'être mis dans un email : un
  prénom comme `<a href="…">Cliquez ici</a>` est affiché tel quel au lieu de devenir un vrai lien.
- **Les liens des emails** sont construits avec l'adresse officielle du site (`siteOrigin()`), jamais
  avec l'adresse que la requête prétend avoir.

Un échec d'envoi est enregistré dans les journaux mais ne fait pas échouer l'inscription : l'email est
un plus, pas une condition.

---

## 9. Les fonctionnalités, une par une

### 9.1 Trouver un tuteur

- **Page** `src/app/trouver-un-tuteur/`, **API** `GET /api/instructors`.
- Les filtres (matière, niveau, mode, ville, commune) deviennent des paramètres d'adresse
  (`?subject=maths&level=LYCEE`), transformés en conditions `where` Prisma.
- **Seuls les instructeurs `APPROVED`** sont renvoyés, et avec un `select` qui exclut tout ce qui est
  privé.
- La **demande de mise en relation** (`POST /api/contact`) crée une `MatchRequest` et prévient l'équipe
  par email ; c'est l'équipe qui organise la suite. Si aucune fiche ne correspond, un petit formulaire
  propose de s'inscrire sur la **liste d'attente** de la matière (`WaitlistEntry`).

### 9.2 Devenir instructeur

- **Page** `src/app/register-instructor/`, **API** `POST /api/register-instructor/presign` puis
  `POST /api/register-instructor`.
- Le navigateur génère un identifiant (`crypto.randomUUID()`), envoie photo, CNI et CV vers R2 dans
  un dossier d'attente privé (`pending/`), puis envoie le formulaire. Le serveur vérifie les fichiers
  (présence, taille), les range à leur place définitive et crée la fiche **en statut `PENDING`** : elle
  n'apparaît sur le site qu'une fois validée par l'équipe.
- L'instructeur reçoit par email un **lien secret** `/modifier-profil/<editToken>` pour modifier sa
  fiche sans mot de passe. Toute modification repasse la fiche en `PENDING`, pour que l'équipe revoie
  les changements.

### 9.3 La bibliothèque

- **Pages** `src/app/bibliotheque/` (l'étagère) et `src/app/bibliotheque/[key]/` (le classeur).
- **Modèle** : une `Resource` (document, exercice, vidéo ou lien) appartient à une matière et
  éventuellement à un `Chapter`, le « classeur » qui regroupe les ressources d'un même chapitre en
  onglets (ordre donné par `position`).
- **Adresses lisibles** : chaque ressource a un **slug** (`theoreme-de-pythagore-3e-1b8daa`) calculé
  par `resourceSlug()` (`src/lib/library.ts`) : le titre passé dans `slugify()` (minuscules, sans
  accents, mots séparés par des tirets), plus six caractères de l'identifiant pour éviter deux slugs
  identiques. C'est meilleur pour Google et plus lisible qu'un identifiant.
- **Lecture des PDF sur téléphone** : les navigateurs mobiles affichent mal les PDF. Le composant
  `PdfReader` charge **PDF.js** (la bibliothèque de Mozilla) depuis un **CDN** et dessine chaque page
  dans le navigateur.
- **Téléchargement** : une URL présignée avec un en-tête `Content-Disposition: attachment` force
  l'enregistrement du fichier au lieu de son ouverture.
- **Compteur de vues** : compté une fois par ressource et par onglet du navigateur (`sessionStorage`), par un `POST` séparé,
  pour que les robots de Google qui lisent la page ne gonflent pas le compteur.

### 9.4 Comptes, corrigés, forum

- **Inscription** (`/inscription`) : mot de passe haché, email à confirmer avant de pouvoir se
  connecter (lien reçu par email, qui ouvre la page de connexion).
- **Corrigés** : rattachés à une ressource (`Correction`), stockés dans le bucket **privé**, servis
  uniquement aux comptes connectés via une URL présignée.
- **Forum** : deux espaces (`ForumSpace`) — « Questions », lisible par tous et où tout compte peut
  écrire, et « Salle des profs », réservée aux instructeurs approuvés. Chaque message peut être **signalé** (`ForumReport`) ;
  l'équipe masque (`hidden`) ce qui pose problème. Une limite empêche d'envoyer trop de messages en peu
  de temps.

### 9.5 Le marché des annonces

L'équipe publie les besoins des familles sous forme d'annonces **anonymes** (`MarketOffer` : matière,
niveau, commune, rythme, budget… sans nom ni contact de la famille). Les instructeurs approuvés se
positionnent (`MarketInterest`) ; l'équipe choisit, et l'instructeur retenu reçoit un email. La
contrainte `@@unique([offerId, instructorId])` empêche de se positionner deux fois sur la même annonce.

### 9.6 Les panneaux de l'équipe

Trois panneaux, un par rôle, chacun à sa propre adresse, et une même série de routes API protégées par
`requireRole`. C'est le principe du **moindre privilège** : chaque rôle n'a accès qu'à ce dont il a
besoin.

| Rôle | Peut |
|---|---|
| SUPER_ADMIN | Tout ; seul à gérer les comptes de l'équipe, les suggestions, la liste d'attente, les liens de modification et le remplacement des fichiers des instructeurs |
| PEDAGOGIE | Valider les instructeurs et consulter leurs CNI et CV, gérer la bibliothèque, les contrats, modérer le forum |
| ADMINISTRATIF | Gérer les demandes des familles et le marché ; voir les instructeurs en lecture seule |

---

## 10. La sécurité : les principes appliqués

Deux audits de sécurité ont été menés sur le site (octobre 2026, détail dans la doc technique,
§7sedecies). Les leçons, sous forme de règles générales :

1. **Ne jamais faire confiance au navigateur.** Tout ce qui arrive dans une requête peut avoir été
   fabriqué à la main. Le serveur revérifie tout : types, longueurs, droits, tailles de fichiers.
   Exemple réel : la route publique d'envoi de fichiers acceptait n'importe quel identifiant, donc
   n'importe qui pouvait remplacer la photo d'un instructeur existant. Corrigé en refusant les
   identifiants déjà utilisés.
2. **Ne renvoyer que le nécessaire.** Un `select` explicite plutôt que la ligne entière : la liste
   admin renvoyait le lien secret de modification des instructeurs à des rôles qui n'en avaient pas
   besoin.
3. **Échapper ce qu'on affiche.** React échappe automatiquement le texte affiché dans les pages ; les
   emails, eux, sont du HTML construit à la main, d'où `escapeHtml()`. C'est la protection contre
   l'**injection**, dont le **XSS**.
4. **Limiter les répétitions.** Sans limite, un robot peut tester des milliers de mots de passe ou
   envoyer des milliers d'emails. `rateLimit()` compte les requêtes par adresse **IP** dans la table
   `LoginAttempt`, et enregistre la tentative **avant** de compter, pour qu'une rafale de requêtes
   simultanées ne passe pas entre les gouttes (**condition de course**).
5. **Vérifier les redirections.** Après la connexion, le site renvoie vers la page demandée
   (`?suite=/forum`). Sans contrôle, un lien piégé pourrait renvoyer vers un faux site : c'est une
   **redirection ouverte**. Le code n'accepte qu'une adresse du site lui-même.
6. **Garder les secrets hors du code.** Mots de passe de base, clés R2 et Resend, secrets de session
   vivent dans les **variables d'environnement** (`.env` en local, réglages Vercel en production),
   jamais dans Git.
7. **Ne pas montrer les erreurs internes.** Une erreur `500` renvoie « Erreur serveur » ; le détail
   technique part dans les journaux, pas chez le visiteur, qui pourrait s'en servir pour attaquer.
8. **La discrétion n'est pas une protection.** Les panneaux admin ont des adresses peu évidentes, mais
   ce qui protège vraiment, c'est l'authentification et `requireRole`.

---

## 11. Travailler et mettre en production

### Le cycle d'une fonctionnalité

```
git checkout -b ma-fonctionnalite     # 1. une branche à part, main reste intacte
   … coder, tester en local (npm run dev) …
npx tsc --noEmit                      # 2. TypeScript vérifie les types
npm run build                         # 3. on construit comme en production
git commit -m "…" && git push         # 4. sauvegarde sur GitHub
   (schéma modifié ? npx prisma db push sur Neon d'abord)
git checkout main && git merge …      # 5. on fusionne dans main
git push origin main                  # 6. Vercel met en ligne automatiquement
```

- **Pourquoi une branche ?** `main` est en production : tout ce qui y arrive est en ligne dans la
  minute. La branche permet de travailler, tester et se tromper sans risque.
- **Pourquoi `tsc` et `build` ?** TypeScript attrape avant la mise en ligne des erreurs qui, en
  JavaScript pur, n'apparaîtraient que chez un utilisateur (un champ mal nommé, une valeur peut-être
  vide…).

### Local et production

| | En local | En production |
|---|---|---|
| Adresse | `http://localhost:3000` | `https://educonnect-ci.org` |
| Base | PostgreSQL dans Docker | Neon |
| Variables | fichier `.env` | réglages du projet sur Vercel |
| Mise à jour | instantanée (`npm run dev` recharge) | à chaque push sur `main` |

Les deux bases sont **différentes** : créer un instructeur de test en local ne le crée pas en ligne.

---

## 12. Pour s'exercer

Quelques questions pour vérifier sa compréhension en relisant le code :

1. Ouvre `src/app/api/instructors/route.ts`. Quels champs sont envoyés au navigateur ? Lesquels ne le
   sont pas, et pourquoi ?
2. Dans `prisma/schema.prisma`, trouve la relation entre `Resource` et `Chapter`. Que devient une
   ressource quand on supprime son chapitre ?
3. Dessine le trajet d'une photo d'instructeur, du téléphone jusqu'à la fiche affichée sur le site.
   Quels services traverse-t-elle ?
4. Pourquoi le jeton de session contient-il une signature, alors que son contenu est lisible par tout
   le monde ?
5. Trouve une route qui commence par `await requireRole(...)`. Que se passe-t-il si un compte
   ADMINISTRATIF l'appelle avec un rôle non autorisé ?
6. Ajoute (sur une branche !) un champ facultatif à un modèle, applique-le avec `db push`, et affiche-le
   dans une page. Quelles étapes de la section 11 ne faut-il pas oublier avant la mise en ligne ?

---

## 13. Glossaire

| Terme | Définition |
|---|---|
| **API** | Ensemble d'adresses (ici `/api/…`) qu'un programme appelle pour obtenir ou envoyer des données, en JSON, plutôt que des pages à afficher. |
| **App Router** | Système de Next.js où l'arborescence des dossiers de `src/app/` définit les adresses du site. |
| **Asynchrone (`async` / `await`)** | Code qui attend une réponse (base, réseau) sans bloquer le reste ; `await` « attend » le résultat. |
| **Authentification / autorisation** | Vérifier qui est la personne / vérifier ce qu'elle a le droit de faire. |
| **Backend / frontend** | Le code qui tourne sur le serveur / le code qui tourne dans le navigateur. |
| **Base de données relationnelle** | Données rangées en tables reliées entre elles (PostgreSQL). |
| **base64url** | Façon d'écrire des données binaires avec des lettres, chiffres, `-` et `_`, sans danger dans une adresse ou un cookie. Ce n'est pas du chiffrement. |
| **Bucket** | « Bac » de stockage dans R2 ; chaque bucket a ses propres règles d'accès. |
| **CDN** | Réseau de serveurs qui distribue des fichiers (ici PDF.js) au plus près des visiteurs. |
| **Clé primaire / clé étrangère** | Colonne qui identifie une ligne de façon unique / colonne qui pointe vers la clé primaire d'une autre table. |
| **Composant (React)** | Morceau d'interface réutilisable, écrit comme une fonction qui renvoie du JSX. |
| **Composant serveur / client** | Exécuté sur le serveur (accès aux données, métadonnées) / dans le navigateur (clics, état, `"use client"`). |
| **Condition de course** | Bug qui apparaît quand deux opérations simultanées s'entremêlent (ex. deux requêtes qui lisent le même compteur avant que l'une l'ait augmenté). |
| **Cookie** | Petite donnée que le navigateur garde pour un site et renvoie à chaque requête. |
| **CORS** | Règle par laquelle un serveur (ici R2) dit quels autres sites peuvent l'appeler depuis un navigateur. |
| **CSRF** | Attaque où un autre site fait envoyer une requête à ton insu, en profitant de ton cookie. |
| **DNS** | L'« annuaire » d'Internet : il relie un nom de domaine à des serveurs et porte des réglages (vérification d'emails…). |
| **Docker** | Outil qui fait tourner un logiciel (ici PostgreSQL) dans un conteneur isolé, identique partout. |
| **Enum** | Liste fermée de valeurs possibles pour un champ. |
| **Hachage** | Transformation à sens unique d'un texte en empreinte : on peut vérifier, pas retrouver l'original. |
| **HMAC** | Signature calculée avec un secret : prouve qu'un message vient du détenteur du secret et n'a pas été modifié. |
| **HTTP / HTTPS** | Le protocole du web (requête → réponse) ; HTTPS est sa version chiffrée. |
| **Injection** | Faille où une saisie est interprétée comme du code (HTML, SQL…) au lieu d'être traitée comme du texte. |
| **IP (adresse)** | Adresse réseau d'où vient une requête. |
| **JSON** | Format de texte pour échanger des données : `{"nom": "Koné", "matieres": ["maths"]}`. |
| **JSX** | Syntaxe de React qui ressemble à du HTML dans du JavaScript. |
| **JWT** | Format standard de jeton signé ; celui d'EduConnect en est une version simplifiée. |
| **Métadonnées** | Informations sur une page (titre, description, image d'aperçu) lues par Google et les réseaux sociaux. |
| **Middleware** | Code exécuté avant chaque requête, qui peut la laisser passer, la rediriger ou la refuser. |
| **Migration** | Fichier qui décrit un changement de la base, rejouable dans l'ordre ; alternative à `db push`. |
| **Moindre privilège** | Principe : donner à chacun uniquement les droits dont il a besoin. |
| **ORM** | Outil (ici Prisma) qui permet de manipuler la base avec des objets du langage plutôt qu'en SQL. |
| **Route dynamique** | Adresse avec une partie variable (`[key]`), reçue en paramètre par le code. |
| **Redirection ouverte** | Faille où un site accepte de renvoyer ses visiteurs vers n'importe quelle adresse. |
| **Sel** | Valeur aléatoire ajoutée au mot de passe avant hachage, pour que deux mots de passe identiques n'aient pas la même empreinte. |
| **Service** | Logiciel qui tourne à part et rend un service par le réseau (base, stockage, emails). |
| **Session** | Le fait de « rester connecté » entre plusieurs requêtes, grâce à un jeton dans un cookie. |
| **Slug** | Version d'un titre utilisable dans une adresse : `Théorème de Pythagore` → `theoreme-de-pythagore`. |
| **SQL** | Langage des bases relationnelles (`SELECT * FROM …`) ; Prisma l'écrit pour nous. |
| **Stockage objet** | Stockage de fichiers rangés par clé (R2, Amazon S3), sans dossiers réels. |
| **TypeScript** | JavaScript avec des types vérifiés avant l'exécution. |
| **URL présignée** | Adresse temporaire, signée par le serveur, qui autorise un type d'opération (déposer, lire) sur un fichier précis jusqu'à son expiration. |
| **UUID** | Identifiant aléatoire de 36 caractères, pratiquement impossible à deviner ou à dupliquer. |
| **Variable d'environnement** | Réglage (souvent secret) fourni au programme par son environnement plutôt qu'écrit dans le code. |
| **XSS** | Injection de code JavaScript dans une page vue par d'autres, pour voler leurs données ou agir à leur place. |
