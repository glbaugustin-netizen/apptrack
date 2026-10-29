# AppTrack — passation pour Claude Code

Document de reprise : tout ce qu'il faut savoir pour continuer le projet sans l'historique des conversations.
État au 29/10/2026, dernier commit `370d551`. **Une refonte totale est en cours** : l'utilisateur veut repartir
de zéro, « brique par brique », pour faire un vrai dashboard. Ce qui suit décrit l'existant (à réutiliser ou
remplacer), surtout le backend, dont les données sont réelles et doivent rester lisibles.

---

## 1. Le projet et l'utilisateur

- Application web perso de productivité d'un élève : habitudes, tâches, calendrier, chrono de
  temps, notes scolaires (calquées sur Pronote) et arbre de compétences « façon jeu vidéo ».
- Usage réel : l'utilisateur s'en sert sur ordinateur **et sur téléphone** (le responsive compte).
- **Tout parle français** : l'interface, les messages de commit, les échanges. Tutoiement dans l'UI (« Ajoute… »).
- Il écrit vite et avec des fautes : reformuler sa demande avant de coder si elle est ambiguë, poser une
  question courte (AskUserQuestion) quand un choix lui revient vraiment.
- **Il autorise à commit + push sur `main` sans demander** (push = mise en prod, voir §3). Toujours compiler
  avant (voir §8), ne jamais réécrire l'historique ni forcer un push.
- Il veut des résultats vérifiés : tester dans un navigateur (captures, scénarios) avant d'annoncer que ça marche.
- Claude **n'a pas accès à son compte** (Firebase Auth en prod) : impossible de voir ses vraies données.
  Les tests se font sur une copie avec des données fictives (§8). Le dire honnêtement dans les comptes rendus.

## 2. Stack

- **Next.js 14.2 (App Router)**, React 18, TypeScript 5 (`strict`), alias `@/*` → racine.
- **Zustand 5** pour tout l'état client (un store par module dans `lib/store/`).
- **Firebase 12** côté client uniquement : Auth (email + mot de passe) et Firestore. Aucun serveur, aucune
  route API, aucun middleware (l'ancien système Prisma/PostgreSQL/JWT a été supprimé en mai 2026).
- `next-themes` (thème clair/sombre par classe `.dark`, défaut clair), `@dnd-kit` (glisser-déposer des tâches).
- Tailwind est installé mais **quasiment pas utilisé** : tout le style est en `style={{…}}` inline + variables CSS
  de `app/globals.css`. `@tanstack/react-query` est installé (provider dans `lib/providers.tsx`) mais inutilisé.
- Icônes : **Tabler Icons** en webfont CDN (`<i className="ti ti-xxx" />`), police **Roboto** (Google Fonts).
- Pas d'ESLint configuré, **aucun test automatisé**.

## 3. Déploiement

- Prod : https://web-five-tau-32ddtly1kp.vercel.app — projet Vercel « web », **branché sur GitHub**
  `glbaugustin-netizen/apptrack` (dépôt **public**). **Chaque push sur `main` déploie en production**
  automatiquement ; les autres branches donnent des déploiements de preview.
- Suivre un déploiement : statut GitHub du commit, contexte « Vercel » :
  `gh api repos/glbaugustin-netizen/apptrack/commits/<sha>/status --jq '.statuses[] | select(.context=="Vercel") | .state'`
- Le CLI Vercel n'est pas connecté sur la machine, inutile pour déployer.
- Dépôt public : ne jamais committer de secret ni de donnée perso.

## 4. Arborescence

```
app/
  layout.tsx            Roboto + Tabler (CDN), Providers (thème)
  page.tsx              redirige vers /habits
  login/ register/      Firebase Auth (email/mot de passe)
  (dashboard)/          tout ce qui demande d'être connecté ; layout = DashboardShell
    habits/ (+stats)    work/ (+week, backlog, stats)   calendar/
    tracker/ (+week, projects, stats)   grades/ (+[subjectId]/[gradeId])   skills/
components/
  layout/               DashboardShell, Topbar, Sidebar, MobileBottomNav, ThemeToggle
  <module>/             composants par module (habits, work, calendar, tracker, grades, skills)
  ui/                   Modal (utilisé), Button/Input/Badge/Pill (inutilisés)
lib/
  firebase.ts           config web Firebase (publique par nature) → exporte auth et db
  modules.ts            liste des onglets : id, libellé, icône, couleurs, chemin
  store/*.store.ts      un store Zustand par module
  types/*.types.ts      modèles de données
  pronote.ts            lecture du « détail du calcul » Pronote (module notes)
  skillTree.ts          mise en page de l'arbre de compétences
  habitColors.ts        palette de 8 couleurs de l'app (+ icônes d'habitudes)
document_tech/          (non suivi par git) ARCHITECTURE.md, CHARTE_GRAPHIQUE.md, maquettes HTML d'origine
```

Dossiers **non suivis par git**, à connaître mais à ne pas confondre avec l'app :
- `web/` : **ancienne copie** clonée du même dépôt (avec un lien Vercel CLI et un `.env` PostgreSQL mort).
  Ce n'est PAS la source du déploiement. Elle fausse `tsc` lancé à la racine (voir §9).
- `app_mobile/` : app **Expo / React Native** (SDK 54) commencée en mai, branchée sur le même Firebase,
  écrans Habitudes / Travail / Calendrier / Tracker seulement. Jamais mise à jour depuis.
- `packages/shared/types/` : copie des types de 4 modules (prévu pour partager web/mobile, non branché).
- `proj/` : vide (restes de build).

## 5. Backend : Firebase

- Projet Firebase `apptrack-e55fe`. Config dans `lib/firebase.ts` (clé web publique, pas un secret).
- **Auth** : email + mot de passe (`lib/store/auth.store.ts` : `init` via `onAuthStateChanged`, `login`,
  `register` avec `displayName`, `logout`).
- **Firestore** : tout est rangé sous `users/{uid}/<collection>/{id}` ; chaque document contient aussi son `id`.
  Les ids sont générés côté client (`Math.random().toString(36).slice(2, 10)`).
- **Règles de sécurité** : gérées dans la console Firebase, **pas dans le dépôt** et jamais vues. Elles laissent
  passer toutes les collections ci-dessous (y compris celles ajoutées en septembre/octobre), donc probablement
  `match /users/{userId}/{document=**} { allow read, write: if request.auth.uid == userId; }`.
  Si une nouvelle collection échoue en écriture, c'est la première piste.

| Collection | Champs (types dans `lib/types/`) |
|---|---|
| `habits` | name, icon (Tabler), color, frequency (`daily`/`weekdays`/`weekend`/`custom`), targetDays, order, createdAt |
| `habitCompletions` | habitId, date — **id du document = `${habitId}_${date}`** |
| `tasks` | title, status (`todo`/`in_progress`/`done`), priority (`low`/`medium`/`high`), dueDate (YYYY-MM-DD, `null` = backlog), order, createdAt |
| `events` | title, startAt/endAt (`YYYY-MM-DDTHH:MM`), allDay, category (`work`/`personal`/`health`/`family`), color, createdAt |
| `projects` | name, color, archived, createdAt (time tracker) |
| `timeEntries` | projectId, description, tags[], startAt, endAt (`null` = chrono en cours), duration (s), createdAt |
| `subjects` | name, color, coefficient, createdAt (matières) |
| `grades` | subjectId, title, value, outOf, rescale, optional, coefficient, date, review, notes, createdAt |
| `skills` | name, emoji, description, unlocked, parentId (`null` = branche principale), order, color, createdAt |

Champs ajoutés après coup : les stores remplissent des valeurs par défaut au chargement pour les vieux
documents (`grades` : `rescale: true`, `optional: false` ; `skills` : `emoji: ""`, `unlocked: true`…).
Garder ce principe pour ne jamais casser les données existantes de l'utilisateur.

## 6. Architecture front (existant)

- `DashboardShell` : écoute l'auth, redirige vers `/login` sans utilisateur, puis appelle `load(uid)` de
  **tous** les stores (chacun fait un `getDocs` complet de ses collections, pas d'écoute temps réel).
- Navigation : `lib/modules.ts` → onglets de la `Topbar` (ordinateur) et `MobileBottomNav` (téléphone,
  ≤ 768 px) ; chaque module a sa barre latérale (`components/layout/Sidebar.tsx` aiguille selon le module),
  en tiroir avec bouton hamburger sur mobile.
- Stores : les mutations prennent `uid` en premier argument, écrivent dans Firestore et mettent à jour l'état
  (parfois de façon optimiste) ; les fenêtres (modales) sont pilotées par le store (`openModal`, `editingX`…).
- Style : variables CSS (`--color-background-primary`, `--color-text-secondary`, `--border-radius-md`…)
  redéfinies sous `.dark`. Charte d'origine dans `document_tech/CHARTE_GRAPHIQUE.md` (flat, bordures 0,5 px,
  pas d'ombres, poids 400/500). Le module Compétences s'en écarte volontairement (fond noir, néon).
- Couleur d'accent par module : Habitudes violet `#7F77DD`, Travail corail `#D85A30`, Calendrier bleu
  `#378ADD`, Time Tracker vert `#1D9E75`, Tracking rose `#D4537E`, Compétences ambre `#BA7517`.

## 7. Les modules et leurs règles métier

**Habitudes** (`/habits`) : liste du jour à cocher, bande de la semaine, séries (streak), stats du mois (heatmap).

**Travail** (`/work`) : tâches du jour (glisser-déposer pour l'ordre, filtres de statut), vue semaine en bas
où **cliquer sur un jour ouvre l'ajout de tâche à cette date** ; `/work/week` affiche les 7 jours avec un
bouton « Ajouter » chacun ; backlog = tâches sans date ; stats.

**Calendrier** (`/calendar`) : vues mois / semaine / jour, événements par catégorie.

**Time Tracker** (`/tracker`) : chrono start/stop (un seul en cours), entrées par projet et tag, semaine
(modifier/supprimer une entrée), projets, stats.

**Tracking = notes scolaires** (`/grades`, module id `grades`). L'utilisateur compare tout à **Pronote** :
- Vue d'ensemble = moyenne générale (moyennes des matières pondérées par le coef de la matière) + barres.
- Matière = moyenne, graphique d'évolution (notes /20 + moyenne cumulée), liste des évals, encadré
  « Détail du calcul » écrit **exactement comme Pronote** (`15,50×20/17(r) + 5,00×0,10 …`).
- Note = valeur + barème (saisie en une case : `15,50/17`, ou `15,5` = sur 20), coef, date,
  « Ce que je dois revoir » et « Notes libres » (enregistrement automatique pendant la frappe).
- **Formule (identique à Pronote, vérifiée sur ses vraies notes : 18,35)** :
  `moyenne = Σ(coef × note') / Σ(coef × barème') × 20`, où une note **ramenée sur 20** (`rescale`, le « (r) »
  de Pronote) compte `note' = note/barème×20, barème' = 20`, et une note non ramenée compte
  `note' = note, barème' = barème` (au prorata de son barème). Code : `subjectAverage` dans `grades.store.ts`.
- **Notes facultatives** (`optional`) : ne comptent que si elles font monter la moyenne (les meilleures d'abord,
  `countedGrades`) ; s'il n'y a que des facultatives, tout compte (le « (nf) » de Pronote).
  La règle exacte de Pronote avec plusieurs facultatives n'est pas connue avec certitude.
- **Synchro Pronote** : bouton « Pronote » sur une matière → on colle le « détail du calcul » de Pronote,
  `lib/pronote.ts` le lit (deux écritures : avec barèmes « … × 20 = », ou notes sur 20 avec la somme des coefs
  en bas ; repères `(r)`, `(nf)`…), associe chaque terme à une note de même valeur et corrige barème / coef /
  « ramenée », crée les manquantes, propose de supprimer celles en trop, en un seul lot Firestore.

**Compétences** (`/skills`) : arbre de compétences style jeu vidéo (référence visuelle : arbre d'atouts néon
type Cyberpunk 2077).
- Bulle de départ (prénom de l'utilisateur) en bas ; les branches poussent vers le haut en courbes néon
  (`lib/skillTree.ts` : arc de départ, éventail des sous-compétences, courbes de Bézier).
- Chaque compétence : emoji choisi (ou initiale), nom, description (info-bulle au survol), couleur de
  branche (palette néon `NEON_COLORS`, les anciennes couleurs sont converties par `neonColor`).
- Les « + » (bulles grises « verrouillées ») n'apparaissent qu'au survol de l'arbre (toujours visibles au doigt).
- **Déblocage** : case « Débloquée » ; grise sinon. On ne peut cocher une compétence que si tous ses ancêtres
  le sont ; décocher re-verrouille toute la descendance (`planSkillUpdate`, `lockedAncestor`).
- Toile : zoom à la molette (centré sur le curseur) ou au pincement, déplacement par glisser (un glisser
  n'ouvre jamais de bulle), boutons −/+/recentrer, fond à grille de points qui suit le zoom.

## 8. Vérifier une modification (méthode qui marche ici)

1. **Ne pas lancer `tsc` / `next build` à la racine** : le dossier `web/` (non suivi) y est inclus et casse
   le typage. Copier les fichiers suivis (+ nouveaux) dans un dossier de travail propre, `npm ci`, puis
   `npx tsc --noEmit` et `npx next build` — c'est ce que fera Vercel.
2. Pour voir l'UI sans compte : dans la copie seulement, remplacer l'effet d'auth de `DashboardShell` par
   un `seedPreview()` qui remplit les stores avec des données fictives et remplace les actions Firestore
   par des versions en mémoire (ne jamais committer ça). Lancer `next dev` dans la copie.
3. Piloter Chrome avec puppeteer-core (`C:/Program Files/Google/Chrome/Application/chrome.exe`) pour
   cliquer, taper, capturer. Chrome sans interface se déclare « tactile » : pour tester le survol, lancer avec
   `--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2`.
4. Vérifier mobile (390 px) et mode sombre (`localStorage.theme = "dark"`).

## 9. Pièges et dette technique

- Plusieurs pages calculent « aujourd'hui » en **UTC** (`new Date().toISOString().slice(0, 10)`) : faux entre
  minuit et 1-2 h du matin en France. Utiliser plutôt `formatISO(new Date())` de `lib/utils/date.ts`
  (heure locale ; attention, `todayISO()` du même fichier est en UTC).
- Dates en chaînes (`YYYY-MM-DD`, `YYYY-MM-DDTHH:MM`), sans fuseau.
- Chargement complet de chaque collection à la connexion, pas de pagination ni d'écoute temps réel.
- Couleurs codées en dur dans les composants malgré la charte ; pastilles de priorité peu lisibles en sombre.
- `tsconfig` sans `target` : éviter de déstructurer un itérateur (`[...map.entries()]`, `[...str.matchAll()]`),
  utiliser `Array.from`.
- Dates et nombres affichés en français (`toLocaleString("fr-FR")`, virgule décimale) ; les saisies acceptent
  virgule ou point.
- `.claude/launch.json` sert parfois aux aperçus : le supprimer après usage (il n'est pas ignoré par git).

## 10. Pour la refonte

- L'utilisateur veut « un vrai dashboard de fou », reconstruit brique par brique, avec l'esprit « menu de jeu
  vidéo » amorcé dans Compétences. Lui faire valider chaque brique avant la suivante.
- **Garder la compatibilité des données Firestore** (`users/{uid}/…`, noms de collections et de champs) ou
  prévoir une migration explicite : il a déjà de vraies notes, compétences, tâches, etc.
- Les règles métier du §7 (formule Pronote, facultatives, déblocage des compétences) ont été validées avec
  lui sur ses propres données : les reprendre telles quelles.
