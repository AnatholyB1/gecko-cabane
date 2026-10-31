# 17b-ACC02-DESIGN : processus d'invitation d'un administrateur

Décisions du propriétaire (2026-10-31) : invitation par LIEN email à usage unique valable 7 jours ; le nouvel admin a TOUS les droits ; « mot de passe oublié » inclus ; entrée « Accès » dans le menu du compte ; `/admin/signup` supprimé ; direction « luxe discret ».

## 1. Contexte et contraintes

- Le projet Supabase Auth est PARTAGÉ avec le portfolio : un compte du pool ne vaut pas accès gecko. La seule frontière est une ligne `gecko_admins` (vérifiée par `gecko_is_admin()` à chaque requête, et par RLS).
- Aucune base, mail ou compte réel n'est touché par cette phase : tout est derrière des modules testés avec des doubles (`src/utils/access/`).

## 2. Comparaison des options

| Critère | A. `inviteUserByEmail` | B. Lien de récupération (`generateLink`) | C. Jeton propre (retenu) |
|---|---|---|---|
| Durée du lien | Réglage GLOBAL du projet (OTP expiry, plafonné à 24 h) : 7 jours impossible | Idem | 7 jours exacts, par type de jeton |
| Compte avant acceptation | Créé immédiatement dans le pool partagé | Idem | Aucun compte avant l'acceptation |
| Usage unique | Oui (OTP) mais le lien est ouvert par les aperçus de messagerie (consommation involontaire) | Idem | L'ouverture (GET) ne consomme rien ; seul le POST du mot de passe consomme |
| Modèle d'email | Modèle Supabase PARTAGÉ avec le portfolio (texte unique pour deux applications) | Idem | Email Resend propre au Gecko |
| Lien vers `gecko_admins` | À faire après coup, hors transaction, et le compte existe déjà | Idem | Le compte et la ligne sont créés ensemble, rollback si l'un échoue |
| Révocation avant usage | Il faut supprimer l'utilisateur du pool partagé (dangereux) | Idem | Ligne de jeton révoquée, rien d'autre touché |
| Compte déjà présent (portfolio) | Le mot de passe de l'autre application peut être réinitialisé | Idem | Détecté, jamais modifié |
| Complexité | Faible | Faible | Moyenne : 1 table, 1 fonction SQL, ~400 lignes testées |

Choix : **C, jeton propre**. A et B ne peuvent pas tenir 7 jours, créent le compte avant l'acceptation, utilisent un modèle d'email partagé et exposent le pool de l'autre application. Le surcoût (une table et une fonction) est le prix de l'isolation.

## 3. Le processus

1. **Qui invite** : un administrateur connecté (`requireAdmin()`), depuis `/admin/acces`. Il saisit un email et confirme dans un dialogue (destinataire, validité 7 jours à usage unique, « tous les droits »). Tous les administrateurs ont les mêmes droits ; aucun rôle limité.
2. **Jeton** : 32 octets aléatoires (256 bits, base64url, 43 caractères). Seule l'empreinte SHA-256 est stockée (`gecko_access_tokens.token_hash`) : une lecture de la base ne permet pas de rejouer un lien. Le lien est `{base}/admin/invitation?token=...`, où `base` vient de `ACCESS_LINK_BASE_URL` ou du domaine public, jamais d'un en-tête de la requête (injection d'hôte).
3. **Expiration** : `expires_at = maintenant + 7 jours`. Une seule invitation vivante par adresse (index unique partiel) : « Renvoyer » révoque l'ancienne et en émet une nouvelle.
4. **Usage unique** : consommation par `UPDATE ... SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now() RETURNING ...` : une seule requête concurrente obtient la ligne.
5. **Pose du mot de passe** : la page publique `/admin/invitation?token=...` affiche l'email (lecture seule, lu en base), deux champs mot de passe et les critères (12 caractères, une lettre et un chiffre, identiques). Ouvrir la page NE consomme PAS le jeton. Le POST `/api/access/accept` envoie le jeton et les mots de passe dans le CORPS (jamais l'email : il vient de la base).
6. **Création de la ligne `gecko_admins`** : côté serveur uniquement (service role), dans l'ordre : valider le mot de passe, consommer le jeton, `auth.admin.createUser({ email_confirm: true })` (aucun email Supabase), puis `insert gecko_admins (id, email)`. Si l'insertion échoue, le compte créé est supprimé et le jeton est relâché (réessai possible).
7. **Fin** : écran « Votre accès est prêt », lien vers la connexion.

## 4. Cas limites et attaques

| Cas | Comportement |
|---|---|
| Jeton inconnu, mal formé, falsifié, expiré, déjà utilisé, révoqué, ou d'un autre type | UNE seule réponse : « Ce lien n'est plus valable » (410 / page unique). Aucun oracle qui distinguerait « expiré » de « inconnu ». |
| Jeton rejoué | Le claim atomique ne renvoie rien : aucun second compte, aucun second droit. |
| Deux acceptations simultanées | Une seule réussit (test). |
| Mot de passe faible ou différent | Refusé AVANT de consommer le jeton : le lien reste valable. |
| L'adresse a déjà un compte du pool (portfolio) | Le mot de passe de l'autre application n'est jamais modifié, aucune ligne `gecko_admins` n'est créée. Le jeton est consommé et la personne voit « Un compte existe déjà avec cette adresse. Demandez à l'équipe technique de l'associer. » (la personne possède la boîte mail : pas de fuite). Cas traité à la main (section 7). |
| Admin retiré | Ses invitations en attente sont révoquées. |
| Retrait de soi-même | Refusé (garde applicative + fonction SQL). |
| Retrait du dernier administrateur | Refusé, atomiquement : la fonction SQL `gecko_revoke_admin` verrouille la table (deux admins qui se retirent mutuellement au même instant ne peuvent pas laisser zéro admin). |
| Non-admin (compte du portfolio) appelant l'API | 401 / 403 via `requireAdmin()`, rien n'est exécuté. |
| Requête inter-sites | Refusée si `Origin` ou `Sec-Fetch-Site` désigne une autre origine ; `Content-Type: application/json` obligatoire ; corps limité à 4 Ko. |
| Redirection ouverte | Tout paramètre `redirect` passe par `safe-redirect` ; l'adresse de connexion ne porte que des CODES (`e`, `m`), jamais de texte libre. |
| Fuite du jeton par Referer ou cache | `referrer: no-referrer`, rendu dynamique, aucune ressource tierce sur la page. Résidu : le jeton figure dans l'URL, donc dans les journaux HTTP de l'hébergeur ; il est à usage unique et expire. |
| Antivirus / aperçu de messagerie qui ouvre le lien | Sans effet (GET sans conséquence). |

## 5. Énumération d'emails

- Invitation : n'interroge jamais le pool d'authentification (seulement `gecko_admins`, que l'invitant est autorisé à voir).
- Connexion : « Email ou mot de passe incorrect. » pour identifiants faux, compte inconnu ou non confirmé ; le message brut de Supabase n'est jamais affiché ; le code d'erreur voyage par code, pas par texte.
- Mot de passe oublié : réponse JSON identique (200, même corps) pour un admin, une adresse inconnue ou un compte du portfolio ; le travail (recherche, jeton, email) est exécuté après la réponse (`after`), donc la durée ne trahit rien ; le dépassement du seuil par adresse répond lui aussi de façon neutre ; seuls les comptes de `gecko_admins` reçoivent un lien (jamais un compte de l'autre application).

## 6. Limitation de débit

Compteur `gecko_rate_limit_hit` existant, clés HMAC (jamais d'email ni d'IP en clair), échec fermé sans identité (plafond global), panne du limiteur signalée à Sentry.

| Route | Seuils |
|---|---|
| Invitation | 10 / h par admin, 20 / h par IP, 3 / jour par adresse |
| Mot de passe oublié | 5 / h par IP (429), 3 / h par adresse (réponse neutre) |
| Acceptation, réinitialisation | 20 / h par IP |

Un jeton de 256 bits n'est pas devinable ; la limite protège surtout contre l'abus d'envoi d'emails.

## 7. Mot de passe oublié

Jeton de même nature (type `reset`, 1 heure, usage unique, empreinte seule), lien `/admin/reinitialiser?token=...`. Appliqué UNIQUEMENT aux comptes présents dans `gecko_admins` (vérifié à la demande et de nouveau à l'usage). Un compte retiré entre-temps ne peut plus changer son mot de passe. Un jeton d'invitation ne peut pas servir à réinitialiser (type vérifié). Limite connue : un changement de mot de passe ne ferme pas les sessions déjà ouvertes (réglage Supabase, voir notes de déploiement).

Procédure manuelle, compte déjà dans le pool : l'équipe technique insère `gecko_admins (id, email)` avec l'`id` du compte existant (comme avant ACC-02).

## 8. Fichiers

`src/utils/access/{tokens,validation,service,email,http,deps}.ts` (logique pure, HTTP, adaptateurs de production), `src/app/api/access/**` (7 routes), `src/app/admin/(app)/acces/` + `src/components/admin/access/` (écran), `src/app/admin/{login,mot-de-passe-oublie,invitation,reinitialiser}/` et `_auth/` (écrans publics hors shell), `supabase/migrations/021_gecko_access_tokens.sql`.
