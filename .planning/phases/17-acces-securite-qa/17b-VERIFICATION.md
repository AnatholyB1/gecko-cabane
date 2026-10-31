# 17b-VERIFICATION : exigence -> test

Gate (après fusion de `milestone/v1.1`) : `npx vitest run` 132 fichiers / 2158 tests verts (1 ignoré, antérieur) ; `npx tsc --noEmit` 0 erreur ; `npm run lint` 0 erreur (2 avertissements antérieurs) ; `npx next build` OK (variables publiques factices, `.env.local` écarté pendant le build, 4 pages et 7 routes `access` listées) ; re-`tsc` 0 erreur.

Nouveaux fichiers de test : `access-service` (51), `access-routes` (39), `access-static`, `access-deps`, `login-action`, plus `helpers/access-fakes.ts`.

| Exigence | Test / preuve |
|---|---|
| ACC-01 migration « revoke seulement », numéro suivant, rollback commenté, non appliquée | `access-static` « ACC-01 migration 020 » (6 tests : 4 politiques + SELECT anon, aucune instruction destructive, exactement 4 `drop`, rollback, un seul fichier) ; `migrations` (suite 007..021) ; `tables-removal` (aucun drop de table) |
| ACC-01 vérification autre application | `17b-ACC01-NOTES.md` (requêtes pour le propriétaire) ; non exécutable ici |
| ACC-02 invitation par lien, 7 jours, usage unique | `access-service` : « envoie un lien... 7 jours », « jeton rejoué », « deux acceptations simultanées », « juste avant l'expiration » |
| Jeton expiré / falsifié / inconnu / révoqué | `access-service` : « jeton expiré (7 jours + 1 ms) », « jeton falsifié ou inventé », « invitation révoquée », `peekToken` (10 variantes, une seule réponse) |
| Jeton jamais stocké en clair ; lien non issu d'un en-tête | `access-service` « stocke l'empreinte » ; `access-deps` `accessBaseUrl` (6 valeurs hostiles) ; migration 021 (`token_hash` unique, 64 hex) |
| Ouvrir le lien ne consomme pas | `access-service` « un lien valide reste valide après plusieurs ouvertures » |
| Ligne `gecko_admins` côté serveur seulement, jamais de droit à un compte de l'autre application | `access-service` « adresse déjà présente dans le pool partagé » ; « l'email vient de la base » ; `access-static` clés service-role (aucun composant client, une seule lecture de la clé) |
| Rollback si l'insertion échoue | `access-service` « échec de l'insertion gecko_admins... » |
| Auto-révocation, dernier admin | `access-service` (garde, `last`, non-appel de la base) ; `access-routes` (409) ; `access-static` migration 021 (`self`, `last`, verrou) |
| Non-admin appelant l'API | `access-routes` : 8 cas 401/403 (rien exécuté) ; `admin-routes-guarded` (4 routes) |
| Validation stricte, `{ error: string }`, pas de trace | `access-routes` (400 sur 7 corps, Content-Type, 500 générique sans détail) |
| Inter-sites (CSRF) | `access-routes` (Origin, Sec-Fetch-Site, `null`) |
| Limitation de débit, clés HMAC | `access-routes` (429, clés `acc-*:<hex>` sans email ni IP) |
| Énumération d'emails | `access-service` (adresse inconnue / invalide / portfolio = même retour, aucun envoi) ; `access-routes` (corps de réponse identiques, travail dans `after`, seuil par adresse neutre) ; `login-action` (compte inconnu = mauvais mot de passe, aucun message brut) |
| Mot de passe oublié limité aux admins ; usage unique ; 1 h | `access-service` (6 tests : rejeu, expiré, type d'invitation refusé, admin retiré) |
| Redirection ouverte | `login-action` (9 cibles hostiles) ; `safe-redirect` ; `access-static` (URL ne porte que des codes) |
| `/admin/signup` supprimé, test négatif | `access-static` « ACC-02 /admin/signup est supprimé et ne doit pas revenir » (4 tests, échoue si dossier, `signupAction`, `signUp(`, lien ou route `/api/auth/login` réapparaissent) ; `admin-nav-links` ; `admin-route-group` ; navigateur : HTTP 404 connecté |
| Entrée « Accès » active | `admin-shell`, `access-static` « entrée Accès active », `admin-nav-links` |
| Pas de fuite du jeton | `access-static` (referrer, dynamique, POST seulement) |
| Emails | `access-static` « emails » (lien dans texte et HTML, jamais dans le sujet, échappement) |
| Adaptateurs de production | `access-deps` (UPDATE conditionnel atomique, jokers LIKE échappés, empreinte jamais relue, `email_confirm: true`) |

## Navigateur (Chromium headless, `next build` + `next start` port 3119, Supabase simulé en local, Resend/API interceptés, aucun service réel)

Route de test temporaire hors matcher (`/gcm/p17b-test/*`), supprimée, non commitée. 9 écrans x 390 / 768 / 1440 = 27 combinaisons.
- Pages réelles (connexion, connexion avec erreur, oublié, invitation invalide, réinitialisation invalide) : 0 débordement, 0 texte < 14 px, 0 cible < 44 px, 0 violation axe.
- Écrans via la route de test (accepter, réinitialiser, Accès, erreur) : 0 débordement, 0 cible < 44 px. Écarts : `document-title` axe (artefact de la route de test sans titre) et étiquettes 12 px de la barre du bas du shell (hors périmètre, D1).
- Parcours : 46 vérifications, toutes OK sauf 2 attendus de script (redirection légitime vers `/admin/reservations` ; piège de focus à 6 Tab dû au garde de la primitive). Couvre : textes libres d'URL ignorés, redirection externe neutralisée, Tab/focus visible, Afficher/Masquer, erreur en `role=alert` + `aria-invalid`, aucun message Supabase, compte sans accès, connexion admin, `/admin/signup` 404, oublié neutre, acceptation (critères en texte, faible refusé avant l'API, 410, succès), Accès (pas de retrait de soi, dialogues : focus initial « Annuler », récapitulatif, Échap, retour du focus, envoi et retrait après confirmation seulement, seul admin sans boutons, échec d'envoi).
- Serveurs arrêtés par PID sur 3119 et 3121.

## Non prouvé

Envoi réel d'email (Resend), création réelle de compte, fonction SQL `gecko_revoke_admin` et migration 021 sur une vraie base, effet de la migration 020, comportement de `createUser` face à un vrai pool partagé, lecteur d'écran réel, zoom 200 %, parcours de bout en bout avec un vrai backend.
