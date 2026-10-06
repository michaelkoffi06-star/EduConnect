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
| Base de données | PostgreSQL (via Docker en local, Neon en production) |
| ORM | Prisma |
| Email transactionnel | Resend |
| Build tool | Turbopack |

Le projet est un **monolithe Next.js unique** : le site vitrine (marketing) et l'application (recherche de tuteur, inscription instructeur, admin) vivent dans le même projet, sous des routes différentes. Ce n'était pas le cas au départ — vitrine et app ont été fusionnées en cours de route pour éviter de maintenir deux déploiements séparés.

---

## 3. Structure du projet

```
src/
├── middleware.ts                       # Protège /bleSseD, /pedagogie, /administratif et leurs API (voir §7bis/§7decies) ; /mon-compte et /espace-instructeur (comptes utilisateurs, §7quindecies)
├── lib/
│   ├── prisma.ts                       # Client Prisma (singleton, adaptateur pg)
│   ├── bleSseD-auth.ts                 # Création/vérification du token de session (payload {sub, username, role, exp}, voir §7bis)
│   ├── admin-permissions.ts            # getRoleFromHeaders() / requireRole() — contrôle d'accès par rôle (voir §7decies)
│   ├── password.ts                     # hashPassword/verifyPassword (scrypt, format salt:hash) — partagé par tous les comptes admin
│   ├── rate-limit.ts                   # rateLimit() / startAttempt() : limites par IP (formulaires, inscriptions, envois de fichiers, connexions) — §7sedecies
│   ├── contact.ts                      # Coordonnées publiques (email, téléphones, fiche vCard) — §7septdecies
│   ├── site.ts                         # siteOrigin() : adresse officielle du site pour les liens envoyés par email — §7sedecies
│   ├── library.ts                      # Bibliothèque : slugs, code de référence, forme publique d'une ressource, normalisation des liens
│   ├── library-server.ts               # Bibliothèque : recherche d'une ressource par slug ou id (serveur uniquement)
│   ├── r2.ts                           # Client S3/R2 + helpers upload/delete/get (voir §7ter), clés des corrigés (bucket privé), pending/ des inscriptions, uploadedFileError()
│   ├── user-auth.ts / user-session.ts  # Comptes utilisateurs : cookie de session, compte connecté, jetons d'email (voir §7quindecies)
│   ├── user-emails.ts                  # Emails aux comptes (confirmation, mot de passe oublié, instructeur retenu)
│   └── market.ts / forum.ts            # Marché des instructeurs et forum : validation, règles d'accès
├── app/
│   ├── inscription/ , connexion/       # Création de compte (élève/parent/instructeur) et connexion — page.tsx + <Nom>Client.tsx
│   ├── reinitialiser-mot-de-passe/     # Nouveau mot de passe (lien reçu par email)
│   ├── mon-compte/                     # Tableau de bord du compte (raccourcis, profil, mot de passe) — privé
│   ├── espace-instructeur/             # Marché des annonces, instructeurs approuvés — privé
│   ├── forum/ , forum/[id]/            # Forum (Questions, Salle des profs) et page d'un sujet
│   ├── bibliotheque/corriges/          # Étagère des corrigés, réservée aux comptes
│   ├── layout.tsx                      # Layout racine : métadonnées globales (Open Graph, Twitter Card, favicon, vérification Bing/Google — voir §7novies)
│   ├── page.tsx                        # Vitrine (accueil), données structurées JSON-LD (EducationalOrganization), lien WhatsApp du footer (voir §8)
│   ├── sitemap.ts                      # Génère /sitemap.xml (routes publiques, voir §7novies)
│   ├── robots.ts                       # Génère /robots.txt (bloque /bleSseD, /pedagogie, /administratif, /api, /modifier-profil)
│   ├── trouver-un-tuteur/
│   │   ├── page.tsx                    # Composant serveur : métadonnées uniquement, affiche le client
│   │   └── TrouverUnTuteurClient.tsx   # Recherche + fiches instructeurs (composant client, logique inchangée)
│   ├── bibliotheque/                   # Bibliothèque v2 (voir §7quaterdecies)
│   │   ├── layout.tsx                  # Polices propres à la bibliothèque (Cormorant Garamond, IBM Plex Mono)
│   │   ├── page.tsx                    # Composant serveur : métadonnées
│   │   ├── BibliothequeClient.tsx      # Accueil en étagère (une étagère par matière/type/niveau, recherche, vue liste)
│   │   └── [key]/
│   │       ├── page.tsx                # Page serveur d'une ressource (slug), métadonnées SEO, redirection id → slug
│   │       └── ClasseurClient.tsx      # Classeur à onglets : fiche d'index, lecture en ligne, téléchargement
│   ├── register-instructor/
│   │   ├── page.tsx                    # Composant serveur : métadonnées
│   │   └── RegisterInstructorClient.tsx # Inscription instructeur (+ upload fichiers)
│   ├── suggestions/ , soutenir/        # Même découpage page.tsx (serveur) + <Nom>Client.tsx
│   ├── modifier-profil/[token]/page.tsx # Auto-édition du profil via lien secret (pas de métadonnées : page privée, exclue du sitemap/robots)
│   ├── bleSseD/                        # Panneau SUPER_ADMIN (accès complet, voir §7bis/§7decies)
│   │   ├── page.tsx                    # Panneau admin (thème sombre) : Instructeurs, Demandes, Suggestions, Liste d'attente, Bibliothèque, Comptes, Mon compte
│   │   └── login/page.tsx              # Connexion SUPER_ADMIN (identifiant + mot de passe), avec "Mot de passe oublié ?" (voir §7terdecies)
│   ├── pedagogie/
│   │   └── page.tsx                    # Panneau PEDAGOGIE : Instructeurs (lecture/statut, sans re-upload fichiers), Bibliothèque (complet), Contrats (voir §7undecies), Mon compte
│   ├── administratif/
│   │   └── page.tsx                    # Panneau ADMINISTRATIF : Demandes (complet), Instructeurs (lecture seule), Bibliothèque (lecture seule), Mon compte
│   └── dev_edco_si/san_other/
│       └── login/page.tsx              # Connexion partagée PEDAGOGIE / ADMINISTRATIF, redirige selon le rôle renvoyé (voir §7decies)
├── api/
│       ├── instructors/route.ts              # Liste publique des instructeurs (APPROVED), filtrable (matière/niveau/mode/ville/commune)
│       ├── subjects/route.ts                 # Liste des matières
│       ├── contact/route.ts                  # Demande de mise en relation → admin
│       ├── contact-message/route.ts          # Formulaire de contact général → admin
│       ├── register-instructor/route.ts      # Inscription + upload photo/CNI/CV
│       ├── register-instructor/presign/route.ts # Présignature upload direct navigateur → R2
│       ├── instructors/edit/[token]/route.ts # GET/PATCH profil via jeton secret
│       ├── instructors/edit/[token]/files/route.ts # PATCH re-upload photo/CNI/CV (voir §7quater)
│       ├── waitlist/route.ts                 # POST : inscription liste d'attente (matière sans instructeur dispo)
│       ├── resources/route.ts                # Liste publique des ressources (filtres : subject, level, chapter, type, q)
│       ├── resources/[key]/route.ts          # Détail d'une ressource + documents de son classeur
│       ├── resources/[key]/view/route.ts     # POST — compte une consultation
│       ├── resources/[key]/download/route.ts # GET — téléchargement forcé (URL R2 signée) + compteur
│       ├── account/route.ts                  # PATCH — tout compte admin connecté change son propre identifiant/mot de passe (voir §7terdecies)
│       ├── dev_edco_si/san_other/login/route.ts # POST — vérifie identifiant/mot de passe pour PEDAGOGIE/ADMINISTRATIF, renvoie le rôle
│       └── bleSseD/
│           ├── login/route.ts                    # Vérifie identifiant/mot de passe SUPER_ADMIN, pose le cookie de session
│           ├── logout/route.ts                   # Supprime le cookie de session
│           ├── forgot-password/route.ts          # POST — réinitialise le mot de passe SUPER_ADMIN via ADMIN_RECOVERY_KEY (voir §7terdecies)
│           ├── admin-users/route.ts + [id]/       # CRUD des comptes admin, réservé SUPER_ADMIN (voir §7decies)
│           ├── instructors/route.ts              # Liste complète (modération) — accès filtré par rôle via requireRole()
│           ├── instructors/[id]/route.ts         # PATCH statut (APPROVED/SUSPENDED/PENDING)
│           ├── instructors/[id]/edit-link/route.ts # POST — nouveau lien /modifier-profil envoyé par email à l'instructeur (SUPER_ADMIN, §7sedecies)
│           ├── instructors/[id]/document/route.ts # Sert CNI/CV (protégé par le middleware)
│           ├── instructors/[id]/export/route.ts  # GET — génère et télécharge la fiche CSV d'un instructeur (infos + historique de contrats, voir §7duodecies)
│           ├── match-requests/route.ts + [id]/    # Gestion des demandes de mise en relation
│           ├── waitlist/route.ts                 # GET : liste d'attente (SUPER_ADMIN uniquement)
│           ├── resources/route.ts + [id]/         # CRUD bibliothèque (lecture pour les 3 rôles, écriture SUPER_ADMIN + PEDAGOGIE) ; PATCH chapitre/position/niveau
│           ├── chapters/route.ts + [id]/          # CRUD des chapitres (classeurs) de la bibliothèque
│           ├── subjects/[id]/route.ts             # PATCH — couleur d'une matière sur l'étagère
│           ├── resources/presign/route.ts         # Présignature upload document/exercice → R2
│           ├── feedback/route.ts + [id]/          # Suggestions (SUPER_ADMIN uniquement)
│           ├── contracts/route.ts + [id]/ + [id]/entries/ # CRUD contrats instructeur/matière/niveau + saisie mensuelle (voir §7undecies)
│           ├── corrections/ + presign/ + [id]/    # Corrigés : upload vers R2 privé, aperçu, retrait (voir §7quindecies)
│           ├── market-offers/ + [id]/ , market-interests/[id]/ # Marché : annonces et décisions sur les candidatures
│           └── forum/route.ts                     # Modération : signalements, masquer/rétablir
│       ├── compte/**                         # Comptes utilisateurs : inscription, connexion, confirmation, mot de passe (voir §7quindecies)
│       ├── corrections/ + [id]/              # Corrigés pour les comptes connectés (liste, URL signée)
│       ├── espace-instructeur/annonces/**    # Marché côté instructeur (annonces, candidature)
│       └── forum/**                          # Sujets, réponses, suppressions, signalements
├── components/
│   ├── SiteHeader.tsx      # Header partagé, thème clair/sombre selon la page
│   ├── ScrollReveal.tsx    # Fondu + glissement au chargement/scroll (IntersectionObserver)
│   ├── MarketingStyles.tsx # Ancien système CSS custom (conservé, plus utilisé activement)
│   ├── FileDropzone.tsx   # Zone de glisser-déposer réutilisable (register-instructor, modifier-profil)
│   ├── admin/LibraryManager.tsx     # Onglet Bibliothèque commun aux 3 panneaux admin (canEdit), colonne Corrigé
│   ├── admin/MarketManager.tsx      # Onglet Marché (/bleSseD, /administratif)
│   ├── admin/ForumModeration.tsx    # Onglet Forum (/bleSseD, /pedagogie)
│   ├── compte/ui.tsx                # Styles et composants des pages de comptes, hook useAccount()
│   ├── forum/shared.tsx             # Auteur + badge, dates relatives du forum
│   └── bibliotheque/
│       ├── shared.ts               # Types et utilitaires de l'étagère et du classeur (couleurs lisibles, vidéos intégrées…)
│       └── PdfReader.tsx           # Lecteur PDF page par page (PDF.js chargé depuis un CDN), plein écran

prisma/
└── schema.prisma           # Schéma de données (source de vérité)

create-admin-user.js         # Script local (non commité, voir §7decies) pour créer/mettre à jour un compte admin
scripts/backfill-resource-slugs.mjs  # Donne un slug aux ressources créées avant la bibliothèque v2 (lancé une fois, voir §7quaterdecies)

public/
├── uploads/photos/          # Vide, plus utilisé (photos servies depuis R2 désormais, voir §7ter)
├── images/hero/             # Fonds d'écran des sections héro (accueil, trouver-un-tuteur, register-instructor)
├── images/comptes/          # Fonds photo (Unsplash) des pages de comptes, espace instructeur et forum (voir §7quindecies)
├── images/bibliotheque/     # fond-etagere.jpg (fond de l'étagère, photo Unsplash) ; hero.jpeg / pattern.jpeg (ancienne bibliothèque, inutilisés)
└── marketing/               # Assets de l'ancienne vitrine HTML/CSS (dont le logo, réutilisé comme favicon et image Open Graph)

private-uploads/
└── instructors/[id]/        # Vide, plus utilisé (CNI/CV servis depuis R2 désormais, voir §7ter)
```

---

## 4. Modèle de données (résumé)

- **`Instructor`** — profil, statut de modération (`PENDING` / `APPROVED` / `SUSPENDED`), `photoUrl` (URL publique complète R2, ex. `https://pub-xxxx.r2.dev/<id>.jpg`), `cniUrl`/`cvUrl` (noms de fichiers seulement, ex. `cni.pdf` — la clé R2 complète est reconstruite à la lecture, voir §7ter), `editToken` (UUID secret pour l'auto-édition). `type` inclut désormais `REPETITEUR_PROFESSIONNEL` (en plus de `ETUDIANT`/`PROF_COLLEGE`/`PROF_LYCEE`) pour les instructeurs qui enseignent comme activité professionnelle sans être étudiant ni professeur en établissement. `levels` inclut désormais `PRIMAIRE` (en plus de `COLLEGE`/`LYCEE`/`ALL`). `mode` (`TeachingMode` : `DOMICILE`/`EN_LIGNE`/`LES_DEUX`), `city` et `commune` (String, cette dernière limitée à une liste fixe côté formulaire : les 13 communes d'Abidjan + Bingerville/Anyama/Songon, plus "Autre") permettent le filtrage géographique sur `/trouver-un-tuteur`. Depuis le système multi-rôles (§7decies), un instructeur peut aussi être lié à un ou plusieurs `Contract`.
- **`Subject`** + **`InstructorSubject`** — relation many-to-many entre instructeurs et matières. `Subject` est aussi lié à `Contract` (une matière peut faire l'objet de plusieurs contrats, un par instructeur/niveau).
- **`ContactMessage`** — messages du formulaire de contact général du site.
- **`MatchRequest`** — une demande "je veux cet instructeur", avec un `status` (`NEW` / `CONTACTED` / `DONE`) que l'admin fait avancer manuellement.
- **`WaitlistEntry`** — inscription d'un parent à la liste d'attente quand aucun instructeur n'est disponible pour une matière donnée (`email` + `subjectId`).
- **`Resource`** — un contenu de la bibliothèque pédagogique : `type` (`DOCUMENT`/`VIDEO`/`EXERCICE`/`LIEN`), `subjectId`, `level` (`AcademicLevel`, défaut `ALL`), et soit `fileUrl` (DOCUMENT/EXERCICE, fichier hébergé sur R2 — bucket photos, préfixe `resources/`), soit `externalUrl` (VIDEO/LIEN, URL externe type YouTube/Vimeo — pas d'upload vidéo). Depuis la v2 (§7quaterdecies) : `slug` (URL publique `/bibliotheque/<slug>`, unique), `chapterId` (classeur, optionnel), `position` (ordre des onglets dans le classeur), `refNumber` (auto-incrémenté, sert au code de référence affiché, ex. `MATH-3E-07-C`), `viewCount` et `downloadCount`. Accessible à tous sans authentification ; seul son éventuel corrigé (`Correction`, §7quindecies) est réservé aux comptes connectés.
- **`Chapter`** — un chapitre de la bibliothèque, affiché comme un classeur : `subjectId`, `title`, `slug` (unique par matière), `level`, `classe` (texte libre, ex. « 3e », « Tle D »), `order`. Sa suppression détache ses ressources sans les supprimer.
- **`Subject.color`** — couleur (hex) des tranches de la matière sur l'étagère ; sans couleur choisie, une couleur est attribuée automatiquement.
- **`AdminUser`** — un compte du back-office (`username` unique, `passwordHash` scrypt, `role` : `AdminRole`, `sessionVersion`). Remplace l'ancien mot de passe admin unique partagé (voir §7decies). `sessionVersion` est incrémenté à chaque changement de mot de passe ou de rôle pour invalider les sessions ouvertes (§7sedecies).
- **`AdminRole`** *(enum)* — `SUPER_ADMIN` / `PEDAGOGIE` / `ADMINISTRATIF`.
- **`Contract`** — un engagement instructeur/matière/niveau (`instructorId`, `subjectId`, `level`), créé et suivi depuis le panneau Pédagogie. Porte plusieurs `ContractEntry` (un par mois suivi).
- **`ContractEntry`** — une entrée mensuelle d'un contrat : `month` (date, premier du mois), `studentCount`, `sessionCount`, `amountReceived`. Unique par `(contractId, month)` — une seule entrée par mois et par contrat, modifiable (upsert) plutôt que dupliquée.
- **`User`** + **`UserRole`** *(enum `ELEVE`/`PARENT`/`INSTRUCTEUR`)* — compte du site (distinct d'`AdminUser`) : email unique en minuscules, `passwordHash`, prénom/nom, `classe` (élève), `emailVerifiedAt` (connexion impossible avant confirmation), `instructorId` (unique : compte instructeur ↔ fiche `Instructor`, supprimé avec la fiche), `sessionVersion` (incrémenté au changement de mot de passe, §7sedecies). Voir §7quindecies.
- **`UserToken`** + **`UserTokenType`** *(`VERIFY_EMAIL`/`RESET_PASSWORD`)* — jeton à usage unique envoyé par email ; seule l'empreinte SHA-256 (`tokenHash`) est stockée, avec `expiresAt`/`usedAt`.
- **`Correction`** — corrigé d'une `Resource` (un seul par ressource, `resourceId` unique) : `fileExt`, compteurs vues/téléchargements. Fichier dans le bucket R2 privé, `corrections/<id>.<ext>`.
- **`MarketOffer`** + **`MarketOfferStatus`** *(`OPEN`/`FILLED`/`CLOSED`)* — annonce du marché des instructeurs, publiée par l'équipe (matière, niveau, classe, mode, lieu, rythme, rémunération, description — jamais les coordonnées de la famille).
- **`MarketInterest`** + **`MarketInterestStatus`** *(`PENDING`/`SELECTED`/`DECLINED`)* — un instructeur positionné sur une annonce (unique par annonce et instructeur), avec un message optionnel.
- **`ForumThread`** + **`ForumSpace`** *(`QUESTIONS`/`SALLE_DES_PROFS`)*, **`ForumPost`**, **`ForumReport`** — sujets, réponses et signalements du forum ; `hidden` pour la modération, `replyCount` et `lastActivityAt` tenus à jour pour la liste.

Voir `prisma/schema.prisma` pour le détail exact des champs et enums.

---

## 5. Flux principaux

### Un parent trouve un tuteur
1. `/trouver-un-tuteur` — liste filtrable par matière, données réelles via `/api/instructors`.
2. Le parent clique "Choisir cet instructeur" → modal → `POST /api/contact`.
3. Ça crée un `MatchRequest` en base **et** envoie un email à l'admin (jamais à l'instructeur).
4. L'équipe (SUPER_ADMIN ou ADMINISTRATIF) traite la demande dans son panneau, onglet "Demandes".

### Un instructeur s'inscrit
1. `/register-instructor` — formulaire avec upload obligatoire de 3 fichiers : photo (min. 800×800px, vérifié côté serveur sans dépendance externe), CNI, CV.
2. `POST /api/register-instructor` (multipart) valide, stocke les fichiers, crée l'`Instructor` en statut `PENDING`.
3. Email de notification à l'admin + (tentative de) confirmation à l'instructeur avec son `editLink`.
4. L'équipe (SUPER_ADMIN ou PEDAGOGIE) approuve/suspend depuis son panneau.
5. L'instructeur peut revenir modifier ses infos via son lien secret (`/modifier-profil/[token]`) — toute modification (texte ou fichiers) repasse le profil en `PENDING`.

### La pédagogie suit un engagement instructeur
1. Depuis `/pedagogie`, onglet "Contrats", création d'un `Contract` (instructeur + matière + niveau).
2. Chaque mois, saisie d'une `ContractEntry` (nombre d'élèves, nombre de séances, montant reçu) — la saisie remplace celle du mois si elle existe déjà (pas de doublon).
3. L'historique complet est consultable par contrat, et exportable par instructeur (voir §7duodecies).

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
ADMIN_SESSION_SECRET=       # voir §7bis
USER_SESSION_SECRET=        # optionnel, voir §7quindecies (à défaut, ADMIN_SESSION_SECRET est utilisé)
ADMIN_RECOVERY_KEY=         # voir §7terdecies — jamais partagé en clair, y compris ici
R2_ACCOUNT_ID=              # voir §7ter
R2_ACCESS_KEY_ID=           # voir §7ter
R2_SECRET_ACCESS_KEY=       # voir §7ter
R2_BUCKET_PHOTOS=           # voir §7ter
R2_BUCKET_PRIVATE=          # voir §7ter
R2_PUBLIC_URL_PHOTOS=       # voir §7ter
```

**Créer un compte admin en local** (script non commité, voir §7decies) :
```bash
node --env-file=.env create-admin-user.js <identifiant> <mot_de_passe> <SUPER_ADMIN|PEDAGOGIE|ADMINISTRATIF>
```

---

## 7. Limitations connues / à traiter avant mise en production

- ~~`/admin` n'a aucune authentification.~~ **Réglé.** `/bleSseD/**`, `/pedagogie/**`, `/administratif/**` et leurs API sont protégés par une session admin (cookie signé), avec un contrôle d'accès par rôle. Voir sections 7bis et 7decies.
- ~~Fichiers uploadés stockés sur disque local.~~ **Réglé.** Photos, CNI et CV sont désormais stockés sur Cloudflare R2. Voir section 7ter.
- ~~Resend est en mode sandbox.~~ **Réglé.** Domaine `educonnect-ci.org` vérifié, emails envoyés depuis `notifications@educonnect-ci.org`. Voir section 7quinquies.
- ~~`/modifier-profil/[token]` ne permet de modifier que les champs texte.~~ **Réglé.** Photo/CNI/CV peuvent désormais être remplacés depuis ce même formulaire. Voir section 7quater.
- ~~Un seul compte admin, pas de gestion multi-utilisateurs.~~ **Réglé.** Système multi-comptes à trois rôles (SUPER_ADMIN/PEDAGOGIE/ADMINISTRATIF), gestion des comptes et récupération de mot de passe. Voir sections 7decies et 7terdecies.

---

## 7bis. Authentification admin (mécanisme de session)

Cette section décrit le mécanisme de session commun aux trois panneaux ; la gestion des comptes et des rôles est détaillée en §7decies.

**Principe** : un cookie de session (`admin_session`, httpOnly) signé en HMAC-SHA256, dont le payload contient `{ sub, username, role, exp }` (identifiant du compte, nom d'utilisateur, rôle, expiration). Un middleware unique vérifie ce cookie sur toutes les routes protégées, détermine si l'accès est autorisé selon le rôle, et transmet le rôle résolu aux routes API via l'en-tête interne `x-admin-role` (voir §7decies).

```
src/
├── middleware.ts (ou proxy.ts en Next.js 16, voir note)  # Vérifie le cookie, applique les règles d'accès par rôle, forwarde x-admin-role
├── lib/
│   ├── bleSseD-auth.ts                  # Création/vérification du token de session (HMAC, compatible Edge)
│   └── admin-permissions.ts             # getRoleFromHeaders() / requireRole() — voir §7decies
└── app/
    ├── bleSseD/login/page.tsx           # Connexion SUPER_ADMIN (identifiant + mot de passe, + "mot de passe oublié")
    ├── dev_edco_si/san_other/login/page.tsx # Connexion partagée PEDAGOGIE / ADMINISTRATIF
    └── api/
        ├── bleSseD/login/route.ts                # Vérifie identifiant + mot de passe SUPER_ADMIN → pose le cookie
        ├── bleSseD/logout/route.ts               # Supprime le cookie
        └── dev_edco_si/san_other/login/route.ts  # Vérifie identifiant + mot de passe PEDAGOGIE/ADMINISTRATIF → pose le cookie, renvoie le rôle
```

**Détails techniques** :
- Le hachage du mot de passe (scrypt, coûteux, résistant au brute-force) est centralisé dans `lib/password.ts` (`hashPassword`/`verifyPassword`, format `salt:hash`), utilisé par toutes les routes de connexion et de gestion de comptes.
- La signature/vérification du cookie utilise Web Crypto (HMAC), compatible à la fois Edge et Node — nécessaire car le middleware Next.js tourne par défaut sur le runtime Edge, qui n'a pas accès à `crypto.scrypt`.
- Aucune dépendance npm supplémentaire.
- Session valable 7 jours.

**Note (Next.js 16)** : la convention `middleware.ts` est dépréciée au profit de `proxy.ts` (même fonctionnement, juste un renommage). Le fichier vit actuellement en `src/middleware.ts` — Next.js affiche déjà "proxy.ts" dans les logs de compilation (nom interne de l'étape), mais le fichier physique n'a pas encore été renommé. À faire quand on voudra suivre la nouvelle convention : `mv src/middleware.ts src/proxy.ts`.

**Protection anti-bruteforce** : les routes de connexion (`/api/bleSseD/login`, `/api/dev_edco_si/san_other/login`) et de récupération (`/api/bleSseD/forgot-password`) limitent à 5 tentatives échouées par IP sur une fenêtre de 15 minutes (modèle `LoginAttempt` en base, comptage par IP via l'en-tête `x-forwarded-for`). Au-delà, la route renvoie `429` sans même vérifier les identifiants fournis.

---

## 7ter. Stockage de fichiers (Cloudflare R2)

**Fournisseur** : Cloudflare R2, choisi pour l'absence de frais de sortie (egress) et un palier gratuit généreux (10 Go / 10M lectures mensuelles). API compatible S3 (`@aws-sdk/client-s3`).

**Deux buckets** :
- `educonnect-photos` — public (accès direct via sous-domaine `r2.dev` ou domaine personnalisé)
- `educonnect-private` — privé, jamais exposé directement (CNI, CV)

**Variables d'environnement** (`.env`, jamais commité) :
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PHOTOS=educonnect-photos
R2_BUCKET_PRIVATE=educonnect-private
R2_PUBLIC_URL_PHOTOS=   # ex. https://pub-xxxx.r2.dev
```

**Fichiers concernés** :
```
src/
├── lib/
│   └── r2.ts                                     # Client S3/R2 + helpers (upload, delete, get, construction des clés)
└── app/api/
    ├── register-instructor/route.ts               # Upload initial (inscription) → écrit sur R2
    └── bleSseD/instructors/[id]/
        ├── files/route.ts                          # Remplacement de fichiers par l'admin → écrit sur R2
        └── document/route.ts                       # Sert CNI/CV à l'admin → lit depuis R2 (protégé par le middleware, voir §7bis)
```

**Convention de nommage des clés** :
- Photo publique : `<instructorId>.<ext>` à la racine du bucket `educonnect-photos`
- Documents privés : `instructors/<instructorId>/cni.<ext>` et `instructors/<instructorId>/cv.<ext>` dans `educonnect-private`

**Nettoyage effectué lors de la migration** : les instructeurs créés avant cette migration (fichiers en local uniquement, jamais poussés sur R2) ont été supprimés de la base ainsi que leurs fichiers locaux — pas de script de migration rétroactive vers R2, la base a été repartie propre. Le dossier `public/uploads/photos/` et `private-uploads/` ne sont plus utilisés par le code actif mais restent présents sur le disque (vides), pas encore supprimés du dépôt.

**Limitation connue** : le SDK AWS v3 affiche un avertissement de dépréciation pour Node < 22 à partir de janvier 2027 — à surveiller, pas urgent.

---

## 7quater. Re-upload de fichiers dans `/modifier-profil/[token]`

L'instructeur peut désormais remplacer sa photo, sa CNI et/ou son CV depuis son lien d'auto-édition, sans repasser par une nouvelle inscription.

**Principe** : trois champs fichiers optionnels dans le formulaire — laisser un champ vide conserve le fichier existant. À la soumission, les champs texte sont d'abord enregistrés (comme avant), puis les fichiers (si fournis) sont envoyés séparément via une route dédiée. Comme pour l'édition texte, tout remplacement de fichier repasse le profil en `PENDING`.

**Fichier ajouté** :
```
src/app/api/instructors/edit/[token]/
└── files/route.ts   # PATCH — accepte photo/cni/cv en multipart, upload vers R2 (voir §7ter),
                      # supprime l'ancien fichier si son extension change, repasse le statut en PENDING
```

Cette route réutilise la même logique de validation et d'upload R2 que `bleSseD/instructors/[id]/files/route.ts` (dimensions minimales de la photo, types MIME autorisés, tailles max), mais résout l'instructeur via son `editToken` plutôt qu'un `id`, puisque l'instructeur n'est jamais authentifié — le lien secret fait office d'unique protection.

---

## 7quinquies. Domaine et emails transactionnels (Resend)

**Domaine** : `educonnect-ci.org`, acheté et géré via Cloudflare Registrar (zone DNS déjà dans le même compte que R2). L'extension `.org` a été choisie pour rester sur un seul registraire simple à opérer, plutôt que `.ci` qui exige un registraire accrédité ARTCI/NIC.CI séparé.

**Vérification Resend** : domaine ajouté sur resend.com/domains puis vérifié quasi instantanément — Resend dispose d'une intégration native avec Cloudflare qui pose automatiquement les enregistrements DNS nécessaires (TXT, CNAME/DKIM), sans copier-coller manuel.

**Adresse d'expédition** : les emails partent désormais de `notifications@educonnect-ci.org` (auparavant `onboarding@resend.dev`, propre au mode sandbox). Concerne les deux emails envoyés dans `register-instructor/route.ts` : la notification admin et la confirmation à l'instructeur avec son lien d'édition — cette dernière ne fonctionnait pas du tout avant (silencieusement bloquée par le sandbox).

**Limitation levée** : les emails peuvent désormais être envoyés vers n'importe quelle adresse, plus seulement celle du compte Resend.

---

## 7sexies. Déploiement (Vercel + Neon)

**Hébergement** : Vercel, déployé automatiquement depuis la branche `main` du dépôt GitHub à chaque push.

**Base de données de production** : Neon (PostgreSQL managé). Deux chaînes de connexion distinctes :
- **Poolée** (avec `-pooler` dans l'hôte) — utilisée par `DATABASE_URL` en production, nécessaire car les fonctions serverless ouvrent de nombreuses connexions courtes.
- **Directe** (sans `-pooler`) — utilisée ponctuellement pour `npx prisma db push` lors des évolutions de schéma. **Le schéma doit être poussé manuellement sur Neon après chaque migration locale** (pas d'automatisation de ce côté pour l'instant).

**Build Vercel** : le script `build` a été modifié en `prisma generate && next build` — Prisma 7 requiert cette génération explicite car une politique de sécurité npm sur Vercel bloque l'exécution automatique du `postinstall` de Prisma.

**Mode maintenance** : contrôlé par la variable d'environnement `MAINTENANCE_MODE` (`true`/`false`), lue dans `src/middleware.ts`. Quand actif, tout le site public est remplacé par `/maintenance`, **sauf** `/bleSseD/**` (accès équipe toujours possible) et `/suggestions`, `/soutenir`, `/api/feedback` (exemptés explicitement pour rester joignables même avant l'ouverture officielle). Changer la variable sur Vercel puis redéployer (`vercel --prod` ou "Redeploy" dans le tableau de bord) suffit à basculer, sans toucher au code.

**Incident notable (variables d'environnement)** : `DATABASE_URL` s'est retrouvée vide sur Vercel après une manipulation des variables d'environnement via la CLI, provoquant une erreur 500 générale (Prisma retombant sur `localhost:5432` par défaut). Point de vigilance pour la suite : vérifier l'ensemble des variables d'environnement après toute manipulation CLI (`vercel env rm`/`add`), pas seulement celle qu'on modifie intentionnellement.

**Incident notable (mauvais déploiement en production)** : après un push contenant le système multi-rôles (commit `48d024f`), un ancien déploiement ("Redeploy of ...", rebuild d'un commit antérieur) est resté marqué comme déploiement de Production sur Vercel, alors que le nouveau build apparaissait pourtant comme "Ready" — résultat : le site en ligne montrait encore l'ancienne interface admin et l'ancien lien WhatsApp malgré le push. Diagnostiqué en comparant les horodatages/hash de commit dans la liste des déploiements Vercel ; corrigé en promouvant manuellement le bon déploiement via son menu "…" → "Promote to Production". Point de vigilance : après un push important, vérifier que le déploiement marqué "Production" correspond bien au dernier commit, pas seulement que le build a réussi.

---

## 7septies. Upload direct navigateur → R2 (contournement de la limite Vercel)

**Problème résolu** : les fonctions serverless Vercel refusent toute requête dépassant **4,5 Mo**, une limite non contournable. Les inscriptions depuis smartphone (photo + CNI + CV en une seule requête multipart) dépassaient régulièrement ce seuil, provoquant des échecs silencieux ("le serveur ne répond pas").

**Solution** : les fichiers ne transitent plus par l'API. Le navigateur uploade directement vers R2 via une URL présignée (signée temporairement, valable 5 minutes), et l'API ne reçoit que des métadonnées légères (type MIME, identifiants).

**Flux en trois temps**, appliqué aux trois formulaires concernés (`register-instructor`, admin, `modifier-profil`) :
1. **Présignature** — le navigateur demande une URL d'upload à une route `.../presign` (une par formulaire), qui calcule la clé R2 et signe l'URL via `getPresignedUploadUrl()` (`lib/r2.ts`).
2. **Upload direct** — le navigateur fait un `PUT` directement vers cette URL R2, sans jamais passer par le serveur Next.js.
3. **Finalisation** — le navigateur informe l'API (juste le type MIME, pas le fichier) que l'upload est terminé ; le serveur vérifie que l'objet existe bien sur R2 (`objectExists()`, via `HeadObjectCommand`) avant d'écrire en base — évite de créer des fiches avec des fichiers manquants si l'upload a été interrompu.

**Prérequis Cloudflare** : politique CORS sur les deux buckets (`educonnect-photos`, `educonnect-private`), autorisant `PUT`/`GET`/`HEAD` depuis `educonnect-ci.org` (et `localhost:3000` pour le développement) — sans ça, le navigateur bloque les requêtes vers R2 par sécurité.

Conséquence : les envois de fichiers (bibliothèque, corrigés, photos/CNI/CV) ne fonctionnent que depuis `https://educonnect-ci.org` (ou `localhost:3000`). Depuis l'adresse technique d'un déploiement Vercel (`…vercel.app`), ou depuis l'adresse réseau du PC en développement (`192.168.x.x:3000`), R2 refuse la requête préalable (403) et le formulaire affiche « NetworkError when attempting to fetch resource. » (incident du 02/10/2026, ajout d'un document depuis l'adresse Vercel). Ces adresses ne sont pas ajoutées à la règle CORS : celle d'un déploiement Vercel change à chaque fois.

**Conséquence sur la validation** : le serveur ne voit plus jamais les octets bruts d'une photo, donc la vérification des dimensions minimales (800×800px), auparavant faite en lisant les en-têtes binaires côté serveur, est désormais faite **côté navigateur** (`src/lib/image-utils.ts`, via un élément `<img>` et `naturalWidth`/`naturalHeight`).

---

## 7octies. Confidentialité et notification d'approbation

**Page `/confidentialite`** : explique aux instructeurs pourquoi la CNI/CV sont demandées, comment elles sont stockées (bucket R2 privé, jamais public), qui y a accès (équipe EduConnect uniquement), et comment demander une suppression de données. Liée depuis le footer de la vitrine et depuis le formulaire d'inscription instructeur (à côté de l'explication sur les documents).

**Email d'approbation** : le PATCH de statut d'un instructeur envoie désormais un email à l'instructeur (`notifications@educonnect-ci.org`) uniquement lors de la **transition** vers `APPROVED` (comparaison avec le statut précédent avant mise à jour) — pas à chaque action admin si le profil est déjà approuvé, pour éviter le spam.

**Point de vigilance connu** : les emails partent bien mais atterrissent parfois en spam côté destinataire — comportement attendu pour un domaine d'envoi récent (`educonnect-ci.org`), la réputation du domaine s'améliore avec le volume d'envois légitimes dans le temps. Une vérification DMARC plus poussée a été identifiée comme piste d'amélioration mais reportée (non urgent).

---

## 7novies. Référencement (SEO)

**Métadonnées globales** (`src/app/layout.tsx`) : `metadataBase`, modèle de titre (`%s | EduConnect CI`), mots-clés, Open Graph et Twitter Card (image : logo, `public/marketing/images/logo-light.png`). Chaque page publique définit ensuite son propre titre/description qui vient compléter (pas remplacer) ces valeurs par défaut.

**Contrainte technique** : les pages publiques interactives (`trouver-un-tuteur`, `bibliotheque`, `register-instructor`, `suggestions`, `soutenir`) sont des composants client (`'use client'`), qui ne peuvent pas exporter `metadata` en Next.js. Chacune a donc été scindée en deux fichiers : `page.tsx` (composant serveur, exporte uniquement les métadonnées et affiche le composant client) et `<Nom>Client.tsx` (toute la logique existante, inchangée). `/modifier-profil/[token]` (page privée à jeton) n'a volontairement pas reçu ce traitement — elle est exclue du sitemap et bloquée dans `robots.txt`.

**`sitemap.ts` / `robots.ts`** : conventions de fichiers Next.js générant respectivement `/sitemap.xml` (liste les pages publiques) et `/robots.txt` (autorise `/`, bloque `/bleSseD`, `/pedagogie`, `/administratif`, `/api`, `/modifier-profil`).

**Données structurées** : un bloc JSON-LD `EducationalOrganization` a été ajouté sur l'accueil (`src/app/page.tsx`), pour aider Google à reconnaître EduConnect comme une entité/marque.

**Favicon** : la solution finale a été de régénérer directement le fichier `src/app/favicon.ico` à partir du vrai logo (via Python/Pillow, plusieurs tailles embarquées : 16/32/48/64px). Les tentatives précédentes (convention de fichier `src/app/icon.png`, puis déclaration manuelle `metadata.icons` avec un paramètre `?v=2`/`?v=3`) n'avaient pas suffi : le fichier `favicon.ico` par défaut de Next.js/Vercel restait présent et était servi préférentiellement par certains navigateurs indépendamment de la métadonnée. Après remplacement du fichier lui-même et suppression de `icon.png`, le vrai logo s'affiche correctement dans le navigateur.

**Vérification Bing Webmaster Tools et Google Search Console** : les deux ont été vérifiées via balise meta (`msvalidate.01` pour Bing, ajoutée dans `metadata.other` du layout ; méthode équivalente pour Google), et le sitemap soumis aux deux avec succès. Point de vigilance rencontré sur Bing : la propriété avait d'abord été enregistrée avec l'URL du sitemap comme "site" (`.../sitemap.xml`) au lieu du domaine racine, ce qui faisait échouer la soumission (`Feed url is not part of the site`) — corrigé en supprimant et recréant la propriété avec la bonne URL racine.

**Distinction importante à garder en tête** : ce travail améliore le référencement (apparaître dans les résultats de recherche) mais ne garantit pas l'apparition dans les *suggestions* de la barre de recherche (auto-complétion), qui dépend uniquement du volume réel de recherches des utilisateurs au fil du temps — aucun levier technique direct.

---

## 7decies. Système admin multi-rôles

**Problème résolu** : un seul mot de passe admin partagé (voir §7bis) ne permettait ni de savoir qui avait fait quoi, ni de limiter l'accès de certaines personnes de l'équipe à certaines fonctions seulement (par exemple, la personne en charge des demandes de mise en relation n'a pas besoin de pouvoir modifier les fichiers CNI/CV des instructeurs).

**Trois rôles** (`AdminRole`) :

| Rôle | Panneau | Accès |
|---|---|---|
| `SUPER_ADMIN` | `/bleSseD` | Accès complet : Instructeurs (y compris re-upload de fichiers), Demandes, Suggestions, Liste d'attente, Bibliothèque, Contrats, Comptes (gestion de tous les comptes admin) |
| `PEDAGOGIE` | `/pedagogie` | Instructeurs (liste, changement de statut, liens CNI/CV — **sans** re-upload de fichiers), Bibliothèque (complet), Contrats (création + saisie mensuelle) |
| `ADMINISTRATIF` | `/administratif` | Demandes (complet), Instructeurs (lecture seule), Bibliothèque (lecture seule) |

Les onglets Suggestions et Liste d'attente restent réservés au `SUPER_ADMIN` (accessibles uniquement depuis `/bleSseD`). Chaque panneau dispose aussi d'un onglet "Mon compte" (voir §7terdecies).

**Connexion** :
- `SUPER_ADMIN` se connecte sur `/bleSseD/login` (identifiant + mot de passe), avec un lien "Mot de passe oublié ?" (voir §7terdecies).
- `PEDAGOGIE` et `ADMINISTRATIF` partagent une page de connexion commune, volontairement peu découvrable : `/dev_edco_si/san_other/login`. Après vérification, la redirection se fait vers `/administratif` ou `/pedagogie` selon le rôle renvoyé par l'API.

**Contrôle d'accès** : le middleware (§7bis) reconnaît trois familles de chemins protégés (`/bleSseD` + `/api/bleSseD`, `/pedagogie`, `/administratif`), vérifie que le rôle du cookie de session est autorisé pour le chemin demandé, puis transmet ce rôle aux routes API via l'en-tête interne `x-admin-role`. Comme la majorité des routes `/api/bleSseD/**` sont partagées entre les trois panneaux (pour éviter de dupliquer la logique métier), c'est un helper commun qui applique la règle fine par route :

```ts
// src/lib/admin-permissions.ts
getRoleFromHeaders(request)                    // lit x-admin-role
requireRole(request, ['SUPER_ADMIN', 'PEDAGOGIE'])  // renvoie une 403 si le rôle n'est pas autorisé, sinon null
```

Chaque route (`instructors`, `resources`, `feedback`, `waitlist`, `match-requests`, et leurs sous-routes) appelle `requireRole()` en tête de handler avec la liste des rôles autorisés pour cette action précise (par exemple : lecture des instructeurs ouverte aux 3 rôles, mais re-upload de fichiers réservé à `SUPER_ADMIN` + `PEDAGOGIE`).

**Modèle de données** : voir §4 (`AdminUser`, `AdminRole`).

**Créer un compte** : script local `create-admin-user.js` (upsert d'un `AdminUser` par identifiant/mot de passe/rôle) :
```bash
node --env-file=.env create-admin-user.js <identifiant> <mot_de_passe> <SUPER_ADMIN|PEDAGOGIE|ADMINISTRATIF>
```
**Décision volontaire** : ce script n'est **pas commité** (ajouté à `.gitignore`) — il ne doit exister qu'en local, pour éviter qu'un identifiant/mot de passe passé en argument ne se retrouve dans l'historique Git par erreur. La gestion courante des comptes (créer/modifier/supprimer un compte PEDAGOGIE ou ADMINISTRATIF, une fois le premier `SUPER_ADMIN` créé) se fait ensuite depuis l'onglet "Comptes" de `/bleSseD` (voir §7terdecies), le script local ne sert qu'à amorcer le tout premier compte.

---

## 7undecies. Suivi des contrats instructeurs (panneau Pédagogie)

**Objectif** : permettre à la pédagogie de suivre, mois par mois, l'activité réelle de chaque engagement instructeur/matière/niveau (nombre d'élèves, nombre de séances données, montant reçu), sans dépendre d'un tableau externe.

**Modèle** : un `Contract` représente un engagement (instructeur + matière + niveau). Chaque mois suivi est une `ContractEntry` (élèves, séances, montant), unique par contrat et par mois — ressaisir un mois déjà existant met à jour l'entrée plutôt que d'en créer une nouvelle (upsert sur `(contractId, month)`).

**Interface** (`/pedagogie`, onglet "Contrats") :
1. Créer un contrat : choisir un instructeur, une matière, un niveau.
2. Depuis un contrat, ajouter/mettre à jour l'entrée du mois en cours (ou d'un mois passé) : nombre d'élèves, nombre de séances, montant reçu.
3. Consulter l'historique mensuel complet d'un contrat.

**Routes API** :
```
/api/bleSseD/contracts             # GET liste, POST création
/api/bleSseD/contracts/[id]        # GET détail, DELETE
/api/bleSseD/contracts/[id]/entries # POST — upsert de l'entrée du mois indiqué
```
Accès réservé à `SUPER_ADMIN` + `PEDAGOGIE` (`requireRole`, voir §7decies).

**Lien avec l'export CSV** : l'historique de contrats d'un instructeur fait partie de sa fiche exportable (voir §7duodecies).

---

## 7duodecies. Export CSV par instructeur

**Contexte** : la pédagogie avait besoin d'une vue d'ensemble par instructeur (infos de profil + historique de contrats) à consulter hors ligne ou à partager. Une première piste (upload de fichiers arbitraires par instructeur) a été écartée au profit d'un **export généré automatiquement**, plus simple et toujours à jour.

**Route** : `GET /api/bleSseD/instructors/[id]/export` — génère un fichier CSV (délimiteur `;`, pour une ouverture correcte dans Excel en français) combinant :
- les informations de profil de l'instructeur (nom, contact, type, niveaux, matières, statut, ville/commune, mode d'enseignement) ;
- l'historique complet de ses contrats et entrées mensuelles (élèves/séances/montant par mois).

Un BOM UTF-8 est ajouté en tête de fichier pour qu'Excel affiche correctement les accents. Le téléchargement est déclenché par un bouton "Télécharger la fiche" dans l'onglet Instructeurs de `/pedagogie`.

**Accès** : `SUPER_ADMIN` + `PEDAGOGIE` (mêmes rôles que la gestion des contrats).

---

## 7terdecies. Gestion des comptes et récupération de mot de passe

**Auto-gestion ("Mon compte")** : chaque panneau (`/bleSseD`, `/pedagogie`, `/administratif`) dispose d'un onglet "Mon compte" permettant à un compte connecté de changer son propre identifiant et/ou mot de passe, après vérification du mot de passe actuel.
```
PATCH /api/account   # vérifie le mot de passe actuel, met à jour username/passwordHash du compte connecté
```

**Gestion multi-comptes (SUPER_ADMIN uniquement)** : onglet "Comptes" de `/bleSseD`, permettant de créer, modifier (rôle, identifiant, réinitialiser le mot de passe) ou supprimer n'importe quel compte admin.
```
GET/POST /api/bleSseD/admin-users        # liste / création
PATCH/DELETE /api/bleSseD/admin-users/[id]  # modification / suppression
```

**Mot de passe oublié (SUPER_ADMIN uniquement)** : depuis `/bleSseD/login`, un lien "Mot de passe oublié ?" bascule vers un formulaire demandant l'identifiant, une **clé de récupération** (`ADMIN_RECOVERY_KEY`, secret stocké en variable d'environnement — en local dans `.env` et sur Vercel, **jamais partagé en clair, y compris dans cette documentation**), et un nouveau mot de passe. La comparaison de la clé se fait en temps constant (`timingSafeEqual`) pour éviter les attaques par mesure de temps.
```
POST /api/bleSseD/forgot-password   # vérifie identifiant + ADMIN_RECOVERY_KEY, réinitialise le mot de passe si le compte est SUPER_ADMIN
```
Cette route est rate-limitée comme les routes de connexion (voir §7bis), et restreinte aux comptes `SUPER_ADMIN` — un compte PEDAGOGIE ou ADMINISTRATIF qui oublie son mot de passe doit passer par un SUPER_ADMIN (onglet Comptes), ce qui est volontaire : la clé de récupération est un mécanisme de dernier recours pour éviter un verrouillage total du compte le plus sensible, pas un flux self-service généralisé.

---

## 7quaterdecies. Bibliothèque v2 (étagère + classeur)

**Objectif** : remplacer la grille de cartes de `/bibliotheque` par une expérience plus parlante pour un élève — une étagère de livres pour choisir, un classeur à onglets pour lire — avec lecture en ligne (y compris sur téléphone) et téléchargement. Inspirations : une appli « Bookshelves » (étagère), un site d'archives à dossiers colorés (classeur), des timbres de collection (fiche).

**Accueil — l'étagère** (`/bibliotheque`, `BibliothequeClient.tsx`) :
- une étagère par matière (ou par type / par niveau, au choix), chaque ressource étant une tranche de livre à la couleur de sa matière ; titre vertical, étiquette de type (COURS, EXOS, VIDÉO, LIEN) ;
- étagères spéciales « Nouveautés » (ajouts des 45 derniers jours) et « Les plus consultées » (à partir de 3 ressources vues) ;
- recherche plein texte, filtre de niveau, bascule « Étagère / Liste » (la liste reste lisible pour qui a du mal avec les titres verticaux) ;
- fond : photo `public/images/bibliotheque/fond-etagere.jpg` (Unsplash, licence libre) sous un voile clair à 50 %, affichée via `next/image` (redimensionnée et compressée selon l'écran) ; si l'image manque, un mur en lambris dessiné en CSS prend le relais. ⚠️ La qualité demandée (70) doit figurer dans `images.qualities` de `next.config.ts` (voir §7quindecies), sinon Next.js 16 refuse l'image et c'est le lambris qui s'affiche. Textes posés sur la photo renforcés (halo clair, plaques derrière les noms d'étagère).

**Ouverture — le classeur** (`/bibliotheque/[key]`, page serveur + `ClasseurClient.tsx`) :
- le chapitre s'affiche comme un classeur sombre, un onglet coloré par document (ordre = `position`) ; changer d'onglet met à jour l'adresse (lien partageable vers le bon document) ;
- dossier ouvert : fiche d'index en police machine (référence, type, niveau, date d'ajout), description, lecture en ligne, bouton Télécharger, et sur ordinateur la liste « Dans ce classeur » ;
- lecture : PDF page par page avec plein écran (`PdfReader.tsx`, PDF.js 4.10 chargé depuis jsDelivr au moment de la lecture — les navigateurs Android n'affichent pas un PDF intégré) ; image affichée directement ; vidéo YouTube/Vimeo intégrée ; lien externe dans un nouvel onglet ;
- page rendue côté serveur avec titre/description propres (référencement), redirection permanente d'une ancienne URL par id vers l'URL par slug ; chaque ressource figure dans `sitemap.xml` (régénéré toutes les heures).

**Téléchargement** : `GET /api/resources/[key]/download` incrémente `downloadCount` puis redirige vers une URL R2 signée (5 min) avec `Content-Disposition: attachment` et un nom de fichier lisible — l'attribut HTML `download` est ignoré pour un fichier servi depuis un autre domaine. **Vues** : `POST /api/resources/[key]/view`, une fois par ressource et par session navigateur (la page GET ne compte rien, car les robots d'indexation la lisent aussi).

**Liens externes** : les adresses saisies sans `https://` (ex. « anglaisefacile.com ») étaient prises pour des pages du site (404). Elles sont normalisées (`normalizeExternalUrl`, seuls http/https acceptés) à l'enregistrement et à la lecture.

**Admin** (`LibraryManager.tsx`, onglet Bibliothèque de `/bleSseD` et `/pedagogie`, lecture seule dans `/administratif`) : couleurs des matières, création/modification/suppression des chapitres, rattachement d'une ressource à un chapitre et position dans le classeur (modifiables directement dans le tableau), compteurs vues/téléchargements, code de référence.

**Mise en production** (faite le 28/09/2026) : `npx prisma db push` sur Neon (URL directe) — l'avertissement sur les contraintes d'unicité `slug`/`refNumber` est sans risque, aucune ressource n'ayant de slug et `refNumber` étant auto-généré —, puis `scripts/backfill-resource-slugs.mjs` sur Neon (64 ressources), puis fusion de la branche `bibliotheque-v2` dans `main`.

**Points de vigilance rencontrés** :
- Après un changement de branche, `next dev` peut répondre 404 sur toutes les routes API (cache de développement corrompu) : `rm -rf .next` puis relancer.
- Tester sur téléphone en local exige que l'adresse du PC soit autorisée dans `allowedDevOrigins` (`next.config.ts`) ; sinon la page arrive sans JavaScript (menu inactif, contenus absents). Des jokers sur les plages privées (`10.*.*.*`, `192.168.*.*`, `172.*.*.*`) évitent de retoucher la config quand l'IP change. Sans effet en production.
- La lecture PDF lit le fichier directement sur R2 : la règle CORS du bucket photos doit autoriser `GET` depuis `educonnect-ci.org` (voir §7septies). En cas d'échec, le lecteur propose « Ouvrir le PDF » et « Télécharger ».

---

## 7quindecies. Comptes utilisateurs, corrigés, marché des instructeurs et forum

**Objectif** : donner un compte aux élèves, aux parents et aux instructeurs. Avec un compte :
- tous (élèves, parents, instructeurs) lisent et téléchargent les **corrigés** de la bibliothèque — le reste de la bibliothèque reste en libre accès ;
- tous participent au **forum** (questions des élèves, réponses de tous) ;
- les **instructeurs approuvés** accèdent en plus au **marché des annonces** (besoins des familles publiés par l'équipe) et à la **salle des profs** (forum entre instructeurs).

Décisions prises avec Michaël (29/09/2026) : annonces publiées **par l'équipe** (la règle « jamais de contact direct famille ↔ instructeur » est conservée) ; compte instructeur **lié à la fiche existante** et marché/salle des profs ouverts **seulement une fois la fiche approuvée** ; corrigés **rattachés aux documents/exercices** existants ; forum à **publication directe + signalement**.

### Comptes et session

- Modèle `User` (§4) : email unique (enregistré en minuscules), mot de passe scrypt (`lib/password.ts`, même format que les comptes admin), `role` (`ELEVE` / `PARENT` / `INSTRUCTEUR`), `emailVerifiedAt`, `instructorId` (compte instructeur ↔ fiche `Instructor`).
- **Session distincte de la session admin** : cookie httpOnly `user_session` (30 jours), signé en HMAC-SHA256 comme la session admin mais avec un préfixe propre (`lib/user-auth.ts`, compatible Edge) — un jeton utilisateur ne peut jamais passer pour un jeton admin, et inversement. Secret : `USER_SESSION_SECRET`, ou à défaut `ADMIN_SESSION_SECRET` (aucune nouvelle variable obligatoire).
- `lib/user-session.ts` (serveur) : `getCurrentUser(request)` relit le compte en base à chaque appel (un compte supprimé, non confirmé ou un instructeur suspendu perd l'accès immédiatement), `isApprovedInstructor()`, jetons d'email, limitation des tentatives.
- **Confirmation d'email obligatoire** avant la première connexion (lien valable 48 h). Depuis la correction du §7sedecies, le lien ouvre `/connexion?jeton=…` et l'adresse n'est confirmée **qu'avec le bon mot de passe** (`POST /api/compte/connexion` avec `confirmationToken`). L'ancien format `GET /api/compte/confirmer?jeton=…` redirige simplement vers cette page.
- **Jetons d'email** (`UserToken`) : seule l'empreinte SHA-256 est stockée, usage unique, un seul jeton actif par type ; mot de passe oublié valable 1 h.
- **Anti-bruteforce** : même table `LoginAttempt` que l'admin, avec un préfixe par usage (`compte:<ip>`, `oubli:<ip>`, `renvoi:<ip>`) — 5 essais / 15 min. Les routes « mot de passe oublié » et « renvoyer la confirmation » répondent pareil que l'email existe ou non.
- **Instructeurs** : le formulaire `/register-instructor` demande désormais un mot de passe et crée le compte avec la fiche (l'email de confirmation de candidature contient aussi le lien de confirmation du compte). Les instructeurs inscrits avant cette version créent leur accès depuis `/inscription` (profil « Instructeur ») avec **l'email de leur fiche** — la confirmation d'email prouve qu'ils en sont propriétaires. Depuis `/mon-compte`, un instructeur retrouve le lien de modification de sa fiche (`/modifier-profil/[token]`).
- **Middleware** : `/mon-compte` et `/espace-instructeur` redirigent vers `/connexion?suite=…` sans cookie valide (vérification de signature seulement ; les droits fins sont vérifiés par les API).
- Sur le forum, seuls le prénom et l'initiale du nom sont affichés (« Awa K. »), avec un badge Élève / Parent / Instructeur (badge Instructeur seulement si la fiche est approuvée).

### Corrigés

- Modèle `Correction` (un corrigé par document/exercice, `resourceId` unique). Fichier dans le **bucket R2 privé** `educonnect-private`, clé `corrections/<id>.<ext>` — jamais accessible par lien direct.
- `GET /api/corrections/[id]?mode=lecture` renvoie une URL signée (5 min) pour la lecture dans la page ; sans `mode`, redirige vers une URL signée de téléchargement. Compte connecté obligatoire.
- **Classeur** : un encadré « 🔒 Corrigé disponible » s'affiche sous le bouton Télécharger — « Lire le corrigé » / « Télécharger le corrigé » pour un compte connecté, « Se connecter / Créer un compte » sinon. `?corrige=1` dans l'URL ouvre directement le corrigé.
- **Étagère des corrigés** : `/bibliotheque/corriges` (lien depuis l'accueil de la bibliothèque), liste par matière, réservée aux comptes.
- **Admin** : colonne « Corrigé » dans l'onglet Bibliothèque (ajout par upload direct navigateur → R2 privé, aperçu, retrait). Supprimer une ressource efface aussi son corrigé.
- **Prérequis Cloudflare** : la règle CORS du bucket **privé** doit autoriser `PUT` (upload admin) et `GET` (lecteur PDF) depuis `educonnect-ci.org` — c'est déjà le cas d'après §7septies, à vérifier si l'ajout ou la lecture d'un corrigé échoue.

### Marché des instructeurs

- Modèles `MarketOffer` (titre, matière, niveau, classe, mode, ville/commune, rythme, rémunération indicative, description, statut `OPEN`/`FILLED`/`CLOSED`) et `MarketInterest` (instructeur positionné, message, statut `PENDING`/`SELECTED`/`DECLINED`, unique par annonce et instructeur).
- **Équipe** (onglet « Marché » de `/bleSseD` et `/administratif`, rôles `SUPER_ADMIN` + `ADMINISTRATIF`) : publie les annonces **sans coordonnées de la famille**, voit les instructeurs positionnés (WhatsApp, email, message), les retient ou les écarte. Retenir un instructeur lui envoie un email.
- **Instructeur approuvé** (`/espace-instructeur`) : annonces ouvertes (filtre « Mes matières »), bouton « Je suis intéressé(e) » avec message optionnel, onglet « Mes candidatures » avec leur état, retrait possible tant que la candidature est en attente.

### Forum

- Modèles `ForumThread` (espace `QUESTIONS` ou `SALLE_DES_PROFS`, matière et niveau optionnels, `replyCount`, `lastActivityAt`, `hidden`), `ForumPost`, `ForumReport`.
- `QUESTIONS` : **lecture publique** (indexable, titre de la question en métadonnées), écriture pour tout compte connecté. `SALLE_DES_PROFS` : lecture et écriture réservées aux instructeurs approuvés (non indexée).
- Publication immédiate ; anti-spam : 8 messages max par compte sur 10 minutes. L'auteur peut supprimer son sujet ou sa réponse ; tout compte peut signaler un message (une fois).
- **Modération** (onglet « Forum » de `/bleSseD` et `/pedagogie`) : signalements à traiter (masquer / classer sans suite) et derniers sujets (masquer / rétablir). Un message masqué disparaît du site mais reste en base.

### Fichiers

```
src/lib/user-auth.ts            # Cookie de session utilisateur (Edge + Node)
src/lib/user-session.ts         # getCurrentUser, droits, jetons d'email, anti-bruteforce
src/lib/user-emails.ts          # Emails : confirmation, mot de passe oublié, instructeur retenu
src/lib/market.ts, forum.ts     # Validation des annonces, règles d'accès du forum
src/components/compte/ui.tsx    # Styles et petits composants des pages de comptes, useAccount()
src/components/forum/shared.tsx # Auteur + badge, dates relatives
src/components/admin/MarketManager.tsx, ForumModeration.tsx
src/app/inscription, connexion, reinitialiser-mot-de-passe, mon-compte, espace-instructeur, forum, forum/[id], bibliotheque/corriges
src/app/api/compte/**                 # inscription, connexion, deconnexion, moi, confirmer, renvoyer-confirmation, mot-de-passe-oublie, reinitialiser, PATCH profil/mot de passe
src/app/api/corrections/**            # liste + fichier d'un corrigé (comptes connectés)
src/app/api/espace-instructeur/**     # annonces + candidature
src/app/api/forum/**                  # sujets, réponses, suppression, signalements
src/app/api/bleSseD/corrections/**, market-offers/**, market-interests/[id], forum
```

### Design des pages (fonds photo et transitions)

Les pages de cette section partagent un système visuel dans la continuité de l'accueil (or `#c9951a`, bleu nuit `#0d1b3e`, titres Cinzel), défini dans `src/components/compte/ui.tsx` :
- **`AuthShell`** (inscription, connexion, nouveau mot de passe) : écran partagé, photo sous un voile bleu nuit avec une phrase d'accroche et les avantages à gauche, formulaire à droite ; sur téléphone, la photo devient un bandeau que la carte du formulaire vient chevaucher.
- **`PageHero`** (mon compte, espace instructeur, forum) : grand bandeau photo sous un voile clair, carte flottante à droite (profil, chiffres clés), contenu qui chevauche le bas du bandeau. La page d'un sujet du forum utilise un bandeau sombre avec la question en titre.
- Cartes en verre dépoli, halos dorés qui dérivent lentement (`Glow`), avatars à initiales colorés selon le profil, icônes SVG en ligne (aucune dépendance), squelettes de chargement.
- **Transitions « fondantes »** (`globals.css`) : `animate-fade-blur` (flou → net + léger glissement, même esprit que `PageTransition`), `stagger` (apparition en cascade des cartes, délai via la variable CSS `--i`), `animate-drift`, `skeleton`. Toutes désactivées si l'appareil demande de réduire les animations (`prefers-reduced-motion`). Les **photos de fond restent immobiles** : un lent zoom (effet « Ken Burns ») avait été essayé puis retiré à la demande de Michaël (30/09/2026).
- L'étagère des corrigés reprend le fond photo de la bibliothèque (`fond-etagere.jpg`).
- Les cartes flottantes de ces pages utilisent `animate-float-y` (flottement vertical, **sans rotation**) ; l'animation `animate-float` de l'accueil garde sa légère inclinaison volontaire.

**Fondu entre les pages** (`src/components/PageTransition.tsx`, monté dans `layout.tsx`, s'applique à tout le site) :
- **Navigations internes** : au clic sur un lien interne, la page actuelle s'efface (animation CSS `pageLeave`, 220 ms), puis la navigation est lancée ; la nouvelle page apparaît avec `pageEnter` (450 ms). Ne sont pas interceptés : liens externes, nouvel onglet, `download`, routes `/api/**`, fichiers, et liens vers la page actuelle (changement de filtre ou d'ancre). Filet de sécurité : si la navigation n'aboutit pas, la page réapparaît au bout de 5 s.
- **Navigations complètes** (rechargement, `window.location` après connexion) : fondu natif du navigateur via `@view-transition { navigation: auto; }` (`globals.css`).
- Désactivé si l'appareil demande de réduire les animations.
- **Pièges rencontrés** : (1) une première version basculait des transitions CSS via `requestAnimationFrame` — quand le navigateur ne produit pas d'image (onglet en arrière-plan, appareil occupé), la nouvelle page pouvait rester invisible : d'où les `@keyframes`, qui démarrent sans dépendre des images affichées ; (2) animer un fort flou sur toute la page figeait l'animation pendant la construction de la nouvelle page (mesuré) : le flou est limité à 4 px ; (3) au repos, le conteneur ne porte **aucun** filtre ni transformation — l'ancienne version laissait `filter: blur(0px)`, ce qui dérègle les éléments `position: fixed` et `backdrop-blur` des pages.

**Photos** (`public/images/comptes/`, ~1,8 Mo au total, redimensionnées par `next/image`) — toutes gratuites sous [licence Unsplash](https://unsplash.com/license) (usage commercial libre, sans attribution obligatoire) :

| Fichier | Page | Photo Unsplash |
|---|---|---|
| `inscription.jpg` | Inscription | Classe, mains levées — Emmanuel Ikwuegbu (`M-4lFg1Xfag`) |
| `connexion.jpg` | Connexion, nouveau mot de passe | Élève qui écrit — Santi Vedrí (`O5EMzfdxedg`) |
| `mon-compte.jpg` | Mon compte | Jeunes diplômés — Nqobile Vundla (`zOt6a59k2BE`) |
| `espace-instructeur.jpg` | Espace instructeur, salle des profs | Enseignante devant sa classe — Emmanuel Ikwuegbu (`VC6MGt9ZoBA`) |
| `forum.jpg` | Forum | Étudiants avec ordinateurs, au Plateau à Abidjan — Iwaria Inc. (`vWqBjWbc_H4`) |

**Piège corrigé au passage (`next.config.ts`)** : depuis Next.js 16, `next/image` n'accepte par défaut que la qualité 75. Les fonds demandaient 70 et recevaient une erreur 400 — y compris le fond de l'étagère de la bibliothèque, qui affichait donc toujours le décor de secours en lambris au lieu de la photo. `images.qualities: [70, 75]` règle les deux.

### Mise en production

1. Pousser le schéma sur Neon **avant** de fusionner (nouvelles tables uniquement, aucune donnée existante touchée) : `DATABASE_URL="<url directe Neon>" npx prisma db push`.
2. Optionnel : ajouter `USER_SESSION_SECRET` sur Vercel (sinon `ADMIN_SESSION_SECRET` est utilisé).
3. Prévenir les instructeurs déjà inscrits (WhatsApp) qu'ils peuvent créer leur accès sur `/inscription` avec l'email de leur fiche.

---

## 7sedecies. Sécurité : audit d'octobre 2026 et corrections

Revue de toutes les routes API (66) et du middleware, faite le 01/10/2026 ; corrections livrées sur la branche `securite`. Ce qui était déjà solide : `requireRole` sur toutes les routes admin, en-tête de rôle non falsifiable, sessions admin/comptes séparées, scrypt, jetons d'email hachés à usage unique, forum sans email exposé ni HTML interprété.

**1. Grave — remplacement des fichiers d'un instructeur.** `POST /api/register-instructor/presign` (public) délivrait une URL d'envoi pour n'importe quel identifiant, y compris celui d'un instructeur existant ; ces identifiants étant publics (`/api/instructors`), n'importe qui pouvait remplacer la photo affichée, la CNI ou le CV d'un instructeur, et déposer des fichiers de taille illimitée sur R2. Corrections :
- refus (409) si l'identifiant appartient déjà à un instructeur ;
- taille obligatoire dans la demande (`size`), bornée (photo 5 Mo, CNI/CV 10 Mo, constantes `MAX_PHOTO_BYTES` / `MAX_DOC_BYTES` de `lib/r2.ts`) et **signée dans l'URL** (`ContentLength`) : R2 refuse un fichier d'une autre taille ;
- revérification côté serveur à la finalisation (`objectSize()`), fichier supprimé s'il dépasse ; même chose pour le re-upload via `/modifier-profil/[token]` ;
- 30 demandes d'URL par heure et par IP.

**2. Emails.** Les textes saisis (prénom, message, nom…) étaient insérés tels quels dans le HTML des emails — dont celui envoyé **à l'adresse saisie** lors d'une candidature instructeur, ce qui permettait d'envoyer des emails piégés depuis `notifications@educonnect-ci.org`. Tout passe désormais par `escapeHtml()` (`lib/user-emails.ts`). La demande de mise en relation relit le nom de l'instructeur en base (instructeur approuvé) au lieu de croire le navigateur. Les liens envoyés par email utilisent l'adresse officielle (`siteOrigin()` de `lib/site.ts` : `https://educonnect-ci.org` en production, variable `SITE_URL` possible) et plus l'adresse déduite de la requête. Les notifications partent toutes de `notifications@educonnect-ci.org`.

**3. Limitation par IP** (`rateLimit()` de `lib/rate-limit.ts`, table `LoginAttempt`, clés `rl:<usage>:<ip>`, nettoyage automatique des traces de plus de 2 jours) :

| Route | Limite |
|---|---|
| `/api/contact`, `/api/contact-message`, `/api/feedback` | 5 / heure |
| `/api/waitlist` | 10 / heure |
| `/api/compte/inscription` | 5 / heure |
| `/api/register-instructor` | 10 / heure |
| `/api/register-instructor/presign`, `/api/instructors/edit/[token]/files/presign` | 30 / heure |

Longueurs maximales ajoutées sur ces formulaires. Une panne du compteur laisse passer la requête (le site ne doit pas tomber pour ça).

**4. Pré-détournement de compte.** Quelqu'un pouvait créer un compte avec l'email d'une autre personne (ou d'un instructeur sans compte) ; si la vraie personne cliquait sur le lien de confirmation reçu, le compte s'activait **avec le mot de passe de l'intrus** et la connectait directement — pour un instructeur, l'intrus obtenait ensuite le lien de modification de la fiche. Désormais le lien de confirmation ouvre `/connexion?jeton=…` et l'adresse n'est confirmée qu'en se connectant avec le bon mot de passe (`consumeEmailTokenFor()` vérifie que le jeton appartient bien au compte). La vraie personne qui ne connaît pas ce mot de passe passe par « Mot de passe oublié », qui confirme aussi l'adresse.

**5. Révocation immédiate des sessions.** Les sessions (7 jours admin, 30 jours comptes) restaient valables après suppression d'un compte, changement de rôle ou de mot de passe. Nouveau champ `sessionVersion` (AdminUser et User), inscrit dans le jeton (`v`) :
- admin : le middleware transmet `x-admin-id` et `x-admin-sv` ; `requireRole()` est devenu **asynchrone** (`await requireRole(...)`) et relit le compte en base — c'est le rôle en base qui fait foi ; version incrémentée au changement de mot de passe (`/api/account`, mot de passe oublié) et au changement de mot de passe ou de rôle par le super-admin ;
- comptes : `getUserFromToken()` compare la version ; incrémentée au changement de mot de passe (`/api/compte`, réinitialisation). La session en cours reçoit un nouveau cookie, les autres appareils sont déconnectés.
Les jetons émis avant la correction (sans `v`) valent version 0 : personne n'est déconnecté par la mise à jour.

**6. Messages d'erreur.** Les réponses 500 ne renvoient plus le message technique interne (`details: error.message`), seulement journalisé côté serveur.

**Non corrigé (faible)** : les compteurs de vues/téléchargements de la bibliothèque peuvent être gonflés artificiellement ; pas d'en-têtes de sécurité dédiés (CSP, X-Frame-Options) — le risque de « clickjacking » est limité par les cookies `SameSite=Lax`.

**Mise en production** : schéma modifié (`sessionVersion`) ⇒ `prisma db push` sur Neon avant la fusion dans `main`.

### Deuxième passe (02/10/2026, branche `securite-2`)

Nouvelle revue indépendante après la mise en ligne de la première. Pas de faille critique ; corrections du point haut et des points moyens, **sans changement de schéma** :

**7. Lien de modification visible par toute l'équipe (haute).** `GET /api/bleSseD/instructors` renvoyait la fiche complète, `editToken` compris, aux trois rôles : un compte ADMINISTRATIF (lecture seule) pouvait récupérer le lien `/modifier-profil/…` de chaque instructeur et modifier sa fiche, son WhatsApp ou ses fichiers, durablement (le jeton ne changeait jamais). Désormais :
- `editToken` n'est plus jamais renvoyé à l'équipe (`omit` Prisma sur la liste, le changement de statut et le remplacement de fichiers) ; ADMINISTRATIF ne reçoit pas non plus `cniUrl`/`cvUrl` ;
- bouton **« Nouveau lien »** (panneau `/bleSseD`, SUPER_ADMIN) → `POST /api/bleSseD/instructors/[id]/edit-link` : nouveau jeton, l'ancien lien cesse de fonctionner, le nouveau part par email à l'instructeur (`sendNewEditLinkEmail`) — l'équipe ne le voit jamais. L'instructeur le retrouve aussi dans « Mon compte ».

**8. Redirection après connexion.** `/connexion?suite=/\site.com` renvoyait vers un autre site après une vraie connexion (le navigateur lit `/\` comme `//`). `safeNext()` refuse antislash et caractères de contrôle et vérifie que l'URL reste sur le site.

**9. Fichiers d'un instructeur.** Le remplacement de la photo/CNI/CV depuis l'admin (`instructors/[id]/files` et `/presign`) est réservé à **SUPER_ADMIN** (l'API acceptait aussi PEDAGOGIE, contrairement à la règle du §7decies), avec taille signée et revérifiée comme pour les routes publiques (`uploadedFileError()` de `lib/r2.ts`, partagé avec `/modifier-profil`).

**10. Export CSV.** Une valeur commençant par `= + - @` (saisie dans le formulaire public) devenait une formule dans Excel : `csvEscape()` la préfixe d'une apostrophe. Conséquence visible : un numéro WhatsApp en `+225…` apparaît `'+225…` dans le tableur.

**11. Limites de tentatives.** Le code comptait les tentatives puis enregistrait la nouvelle : 50 requêtes simultanées passaient toutes. `startAttempt()` (`lib/rate-limit.ts`) enregistre d'abord puis compte (au plus `max` passent) ; une connexion réussie retire sa tentative (`release()`), seuls les échecs comptent. Utilisé par `rateLimit()`, les connexions admin (`/bleSseD/login`, `/dev_edco_si/.../login`), la clé de secours et les comptes (`startUserAttempt()` : connexion, mot de passe oublié, renvoi de confirmation).

**12. Comptes de l'équipe.**
- Mot de passe de **12 caractères minimum** (`adminPasswordError()` de `lib/password.ts`) à la création, au changement et via la clé de secours ; les mots de passe existants restent valables jusqu'au prochain changement. Identifiant limité à 50 caractères.
- Impossible de rétrograder ou supprimer le **dernier SUPER_ADMIN** (409), ni de supprimer son propre compte.

**13. Envois de l'inscription instructeur.** On pouvait obtenir des URL d'envoi sans jamais finir l'inscription, et la photo arrivait directement dans le bucket **public**. Désormais tout arrive dans `pending/<id>/` du bucket **privé** (`pendingKey()`), et n'est déplacé vers l'emplacement définitif (`moveObject()`) qu'à la création de la fiche ; en cas d'échec de la création, les fichiers déplacés sont supprimés. **Règle de cycle de vie R2 à créer une fois** (tableau de bord Cloudflare → R2 → bucket privé → Settings → Object lifecycle rules) : préfixe `pending/`, suppression après 1 jour.

**Reste à traiter (faible)** : l'inscription d'un compte révèle si un email est déjà inscrit (et le temps de réponse de la connexion aussi) ; la déconnexion n'invalide pas le cookie (seulement effacé du navigateur) ; vérification du mot de passe actuel sans limite ; pas de contrôle de l'en-tête `Origin` sur les requêtes POST ; comptes non confirmés jamais purgés (un email peut être « squatté ») ; coût scrypt par défaut ; signalements du forum sans limite, sujet signalé supprimable par son auteur ; `PATCH /api/instructors/edit/[token]` sans longueurs maximales ; pas d'en-têtes de sécurité (CSP, X-Frame-Options) ; `robots.txt` cite `/bleSseD` ; `nodemailer` installé mais inutilisé.

---

## 7septdecies. Vitrine : les autres espaces du site et contacts cliquables

Branche `vitrine` (octobre 2026). L'accueil (`src/app/page.tsx`) ne parlait que de la mise en relation ; il présente maintenant aussi les espaces ajoutés depuis.

- **Section « Plus qu'une mise en relation »** (`#decouvrir`, entre « Comment ça marche » et l'appel final) : quatre cartes cliquables (constante `DISCOVER`) vers la bibliothèque, les corrigés, le forum et l'espace instructeur, chacune avec une étiquette d'accès (« Accès libre », « Avec un compte », « Lecture libre », « Instructeurs »), puis deux boutons « Créer un compte » / « Se connecter ». Images allégées pour le mobile dans `public/images/vitrine/` (800 px de large au plus, moins de 100 Ko), tirées des photos de la bibliothèque et des pages comptes.
- **Pied de page** sur quatre colonnes : nouvelle colonne « Explorer » (constante `EXPLORE_LINKS`) avec les liens vers toutes les pages publiques.
- **Contacts cliquables** : numéros en liens `tel:` (ouvrent le composeur du téléphone), adresse en lien `mailto:` (ouvre l'application de messagerie, Gmail sur Android) plus un lien « Écrire depuis Gmail » (fenêtre de rédaction de Gmail dans le navigateur, utile sur ordinateur), et un bouton « Enregistrer nos contacts » qui télécharge une fiche vCard (`public/educonnect.vcf`) que le téléphone propose d'ajouter au répertoire.
- **Nouvelle adresse de contact : `educonnect.ci@gmail.com`**, à la place de l'ancienne adresse personnelle, sur l'accueil et la page de confidentialité.
- Coordonnées centralisées dans `src/lib/contact.ts` (`CONTACT_EMAIL`, `CONTACT_PHONES`, `GMAIL_COMPOSE_URL`, `CONTACT_VCARD_PATH`) ; **la fiche `public/educonnect.vcf` reprend les mêmes valeurs et doit être modifiée en même temps.** Les données structurées (JSON-LD) de l'accueil incluent désormais l'email et les numéros (`contactPoint`).
- Les notifications envoyées à l'équipe partent toujours vers `ADMIN_NOTIFICATION_EMAIL` (variable Vercel), indépendante de l'adresse affichée.

---

## 8. Historique de conception (pour contexte)

Le projet a démarré comme deux choses séparées : une vitrine statique HTML/CSS/JS, et une app Next.js indépendante pour la gestion des instructeurs. Elles ont été fusionnées dans un seul projet Next.js pour simplifier le déploiement et la maintenance. Le design a ensuite évolué d'un thème sombre "glassmorphism" chargé vers un style plus sobre (fond blanc, moins de sections), avec un header unique simplifié (logo + menu hamburger) partagé entre toutes les pages sauf l'admin, resté en thème sombre.

Une authentification par mot de passe unique a ensuite été ajoutée devant `/admin` (voir section 7bis), fermant la faille de sécurité la plus urgente identifiée en section 7.

Le stockage des fichiers uploadés (photos, CNI, CV) a ensuite été migré du disque local vers Cloudflare R2 (voir section 7ter), condition nécessaire pour un futur déploiement sur une plateforme à système de fichiers éphémère comme Vercel.

Le formulaire d'auto-édition (`/modifier-profil/[token]`) a ensuite été complété pour permettre le remplacement de la photo/CNI/CV, pas seulement des champs texte (voir section 7quater).

Un domaine (`educonnect-ci.org`) a ensuite été acheté et vérifié sur Resend, levant le mode sandbox et permettant l'envoi d'emails transactionnels vers n'importe quel destinataire (voir section 7quinquies).

Les quatre pages orientées utilisateur (vitrine, trouver-un-tuteur, register-instructor, modifier-profil) ont ensuite reçu un passage de modernisation front-end : mise en page plus dynamique sur la vitrine (carte de vérification en hero, cartes instructeurs en portrait éditorial), filtres collants sur trouver-un-tuteur, zones de glisser-déposer réutilisables (`FileDropzone`) pour tous les uploads de fichiers, et alignement du thème de modifier-profil (auparavant sombre, résidu de l'ancien design) sur le reste du site.

Le projet a ensuite été déployé sur Vercel avec une base Neon en production, derrière un mode maintenance activable par variable d'environnement (`MAINTENANCE_MODE`) pour préparer l'ouverture au public sans exposer un site inachevé. Deux fonctionnalités ont été ajoutées à cette occasion : un formulaire de suggestions (`/suggestions`, stocké en base et visible dans un nouvel onglet admin) et une page de soutien financier (`/soutenir`, liens Mobile Money).

Un bug critique est apparu à l'ouverture au public : les fonctions serverless de Vercel refusent toute requête dépassant 4,5 Mo, ce qui bloquait les inscriptions depuis smartphone (photo + CNI + CV dépassant facilement cette limite). Les trois formulaires d'upload (`register-instructor`, admin, `modifier-profil`) ont été migrés vers un upload direct navigateur → R2 via URLs présignées (`getPresignedUploadUrl` dans `lib/r2.ts`), l'API ne recevant plus que les métadonnées et vérifiant l'existence des fichiers sur R2 avant d'enregistrer les changements en base. La validation des dimensions de photo (auparavant faite côté serveur en lisant les octets) a été déplacée côté navigateur (`lib/image-utils.ts`), le serveur ne voyant plus les fichiers bruts.

Une protection anti-bruteforce a ensuite été ajoutée sur `/api/bleSseD/login` (voir section 7bis), suite à un audit de sécurité ayant confirmé l'absence de mot de passe en dur et l'expiration correcte des sessions, mais révélé l'absence totale de limitation des tentatives de connexion.

Une page de confidentialité et un email de notification à l'approbation d'un profil instructeur ont ensuite été ajoutés (voir section 7octies), deux points relevés lors d'une revue de suggestions plus large portant aussi sur le filtrage par niveau, l'analytics, un système de notation, et un pipeline de vérification automatique.

Le filtre par niveau (collège/lycée) a ensuite été ajouté sur `/trouver-un-tuteur`, en complément du filtre par matière déjà existant (le champ `levels` existait déjà en base mais n'était pas exploité côté recherche).

Le panneau admin a ensuite été renommé de `/admin` vers `/bleSseD` (page et toutes les routes API associées, voir section 7bis), pour réduire sa découvrabilité par des scans automatisés — l'authentification restant la vraie protection, ce renommage n'est qu'une couche supplémentaire.

Une liste d'attente par matière a ensuite été ajoutée (`WaitlistEntry`) : quand une recherche sur `/trouver-un-tuteur` ne renvoie aucun instructeur, un petit formulaire "Être alerté(e)" apparaît à la place du message vide, et les inscriptions sont consultables dans un nouvel onglet admin.

Des filtres plus fins ont ensuite été ajoutés sur `/trouver-un-tuteur` : mode d'enseignement (à domicile / en ligne / les deux), ville et commune (liste fixe pour Abidjan et ses environs). À cette occasion, le niveau `PRIMAIRE` a été ajouté (en plus de collège/lycée), ainsi qu'un nouveau type d'instructeur `REPETITEUR_PROFESSIONNEL` pour ceux qui enseignent comme activité professionnelle sans être étudiant ni professeur en établissement. Ces champs sont saisis à l'inscription et modifiables via `/modifier-profil/[token]` ; les instructeurs déjà inscrits avant ce changement ont été invités par WhatsApp à mettre leur profil à jour (aucune migration automatique de données n'étant possible pour un champ obligatoire sans valeur par défaut pertinente).

Une bibliothèque de contenus pédagogiques a ensuite été ajoutée (`Resource`, page publique `/bibliotheque`) : documents et exercices (PDF/image, hébergés sur R2) ou vidéos et liens externes (YouTube/Vimeo, pas d'upload vidéo), classés par matière et niveau, gérés depuis un nouvel onglet admin. Le contenu est pour l'instant ouvert à tous sans restriction par compte, faute de système de compte parent/élève (voir §9.1) — une restriction par matière suivie pourra être ajoutée une fois ce prérequis construit.

Une refonte visuelle a ensuite été appliquée sur plusieurs pages : fonds d'écran photographiques sur les sections héro de l'accueil, `/trouver-un-tuteur`, `/register-instructor` et `/bibliotheque` (images statiques dans `public/images/`), animation de flottement sur la carte de statistiques de l'accueil (`@keyframes float` dans `globals.css`), et remplacement du favicon par défaut de Next.js par le vrai logo EduConnect.

Un travail de référencement (SEO) a ensuite été mené dans son ensemble : sitemap, robots.txt, métadonnées par page, Open Graph, données structurées, et vérification du site sur Bing Webmaster Tools et Google Search Console (voir §7novies pour le détail).

Le mot de passe admin unique a ensuite été remplacé par un système multi-comptes à trois rôles (`SUPER_ADMIN`/`PEDAGOGIE`/`ADMINISTRATIF`), chacun avec son propre panneau et son propre périmètre d'accès (voir §7decies) — un besoin apparu avec la croissance de l'équipe, où toutes les personnes n'ont ni besoin ni vocation à avoir accès à l'ensemble des fonctions (fichiers CNI/CV, suggestions, liste d'attente). À cette occasion, un suivi mensuel des contrats instructeur/matière/niveau (élèves, séances, montant reçu) a été ajouté pour la pédagogie (voir §7undecies), avec un export CSV par instructeur combinant profil et historique de contrats (voir §7duodecies) — remplaçant une première piste envisagée (upload de fichiers arbitraires par instructeur), jugée moins adaptée au besoin réel. Un mécanisme de récupération de mot de passe pour le compte `SUPER_ADMIN` a également été mis en place, via une clé de récupération secrète (voir §7terdecies), pour éviter tout risque de verrouillage total de l'accès admin.

Le lien WhatsApp du footer de la vitrine a ensuite été mis à jour : il pointait auparavant vers un numéro personnel (`wa.me/...`) et redirige désormais vers la chaîne WhatsApp officielle d'EduConnect.

La bibliothèque a ensuite été entièrement repensée (v2, voir §7quaterdecies) : accueil en étagère de livres colorés par matière, ouverture des ressources dans un classeur à onglets par chapitre, lecture en ligne compatible mobile (PDF page par page, vidéos intégrées) et téléchargement direct, avec de nouvelles données (chapitres, couleurs des matières, slugs, compteurs de vues et de téléchargements) et un onglet d'administration commun aux trois panneaux. Le travail a été mené sur une branche séparée (`bibliotheque-v2`), testé en local sur ordinateur et téléphone, puis fusionné dans `main` après la mise à jour du schéma Neon.

Des comptes utilisateurs ont ensuite été ouverts aux élèves, aux parents et aux instructeurs (voir §7quindecies), avec trois nouveautés : des corrigés rattachés aux documents de la bibliothèque et réservés aux membres (le reste restant en libre accès), un marché d'annonces où l'équipe publie anonymement les besoins des familles et où les instructeurs approuvés se positionnent, et un forum d'entraide (questions des élèves, salle des profs entre instructeurs) modéré par signalement. Le travail a été mené sur la branche `espaces-comptes`. Ces nouvelles pages ont ensuite reçu un habillage plus moderne (photos libres de droits en fond, cartes en verre dépoli, apparitions en fondu et en cascade), vérifié par captures d'écran sur ordinateur et téléphone ; à cette occasion, la photo de fond de l'étagère, jusque-là jamais affichée à cause d'un réglage de qualité d'image refusé par Next.js 16, a été rétablie.

Un audit de sécurité complet a ensuite été mené (voir §7sedecies) : il a révélé une faille grave (remplacement possible des fichiers d'un instructeur via la route publique d'envoi de fichiers) et plusieurs faiblesses (emails non échappés, absence de limite sur les formulaires publics, pré-détournement de compte, sessions non révoquées), toutes corrigées sur la branche `securite`. Une deuxième revue indépendante, une fois ces corrections en ligne, a trouvé le lien secret de modification des instructeurs exposé à toute l'équipe admin, ainsi que plusieurs faiblesses moyennes (redirection après connexion, rôles sur les fichiers, export CSV, limites contournables par rafale, envois d'inscription orphelins) : corrigées sur la branche `securite-2`.

La vitrine a ensuite été complétée (voir §7septdecies) pour présenter la bibliothèque, les corrigés, le forum et l'espace instructeur, avec des contacts cliquables (appel, email, fiche contact à enregistrer) et une nouvelle adresse de contact, `educonnect.ci@gmail.com`.

Reste à traiter : l'analytics, le système de notation, et le pipeline de vérification automatique.

---

## 9. Fonctionnalités à développer

Fonctionnalités identifiées comme nécessaires au bon fonctionnement et à la croissance de l'application. La liste d'attente par matière, les filtres mode/ville/commune, la bibliothèque de contenus pédagogiques, la refonte visuelle, le référencement (SEO), le système admin multi-rôles (comptes, contrats, export CSV, récupération de mot de passe), la bibliothèque v2 et les comptes utilisateurs (corrigés, marché, forum) ont depuis été développés (voir §8, §7decies à §7quindecies) ; ce qui suit reste à faire.

### 9.1 Croissance (augmenter les inscriptions)

- **Relier les demandes aux comptes parents.** Les comptes existent désormais (§7quindecies), mais une demande de mise en relation reste anonyme (email ressaisi à chaque fois). Étape suivante : pré-remplir la demande quand le parent est connecté et lui montrer le suivi de ses demandes dans `/mon-compte`, puis permettre à l'équipe de créer une annonce du marché directement depuis une demande.
- **Lien parent ↔ enfant** entre comptes (un parent suit l'activité de son enfant), et notifications (email/WhatsApp) quand quelqu'un répond à une question du forum.
- **Système de parrainage.** Un code de parrainage pour les parents ou instructeurs satisfaits — solution peu coûteuse, adaptée à un contexte où le bouche-à-oreille est probablement déjà le principal canal d'acquisition.

### 9.2 Expérience utilisateur

- **Notifications WhatsApp automatiques**, en plus de l'email — dans le contexte ivoirien, WhatsApp est probablement le canal le plus consulté par les utilisateurs. Un message automatique du type "Votre candidature a été approuvée" ou "Vous avez une nouvelle demande" via l'API WhatsApp Business serait plus fiable que l'email, surtout tant que la réputation du domaine Resend reste jeune (voir §7octies).
- **Badge de vérification à plusieurs niveaux**, au lieu d'un simple statut approuvé/suspendu — par exemple "Profil vérifié" (CNI/CV validés) vs "Profil vérifié + expérience confirmée" (références vérifiées par appel). Rassure les parents sur la qualité et différencie les meilleurs instructeurs.

### 9.3 Gestion (côté admin)

- **Tableau de bord analytique** : au-delà du trafic (Vercel Analytics), un tableau montrant les matières les plus demandées, le taux de conversion demande → mise en relation réussie, et le temps moyen de traitement d'une candidature — pour piloter l'activité plutôt que seulement l'observer.
- **Historique des candidatures rejetées/suspendues avec motif.** Utile si un instructeur repostule des mois plus tard : retrouver pourquoi il avait été refusé la première fois, sans avoir à s'en souvenir.
- **Export PDF** en complément du CSV (§7duodecies), pour une fiche instructeur directement présentable/imprimable, si le besoin se confirme au-delà du tableur.
- **Bibliothèque** : favoris enregistrés dans le navigateur (sans compte), vignette/couverture optionnelle par ressource, et réduction du poids de `fond-etagere.jpg` (~4 Mo dans le dépôt ; déjà allégée à l'affichage par `next/image`).
</content>
</invoke>
