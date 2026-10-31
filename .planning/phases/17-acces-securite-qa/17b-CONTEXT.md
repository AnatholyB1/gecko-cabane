# 17b-CONTEXT : Accès (ACC-01, ACC-02) et refonte de la connexion

Branche `phase/17b-access` (issue de `milestone/v1.1`, fusionnée avec `milestone/v1.1` incluant 17a). Aucun push.

## Décisions du propriétaire (2026-10-31)

Invitation par lien email à usage unique, 7 jours ; tous les droits admin ; « mot de passe oublié » inclus ; entrée « Accès » dans le menu du compte ; `/admin/signup` supprimé ; direction « luxe discret ».

## Choix techniques

- Jeton propre plutôt que `inviteUserByEmail` / liens de récupération Supabase (durée plafonnée, compte créé avant acceptation, modèle d'email partagé avec le portfolio) : voir `17b-ACC02-DESIGN.md`.
- Toute la logique est dans `src/utils/access/service.ts` derrière `AccessDeps` (base, Auth admin, mailer) : testée avec des doubles, aucun service réel appelé.
- 2 migrations en fichiers, jamais appliquées : `020` (ACC-01, revoke seulement), `021` (table `gecko_access_tokens` + `gecko_revoke_admin`).
- Les écrans publics (connexion, oublié, invitation, réinitialisation) sont hors shell, dans `src/app/admin/**` avec `_auth/` (dossier privé, hors du scan i18n de `src/components`).

## Changements hors périmètre strict, justifiés

- `/api/auth/login` supprimée : doublon non référencé de la Server Action, sans contrôle `gecko_is_admin`, renvoyait le message brut de Supabase (recommandé par l'audit P9 §2.12).
- La connexion et le middleware ne transmettent plus de texte dans l'URL (`?error=`), seulement des codes (`e`, `m`) : supprime le contenu réfléchi.
- `rate-limit.ts` : 3 types de clé ajoutés (`acc-ip`, `acc-user`, `acc-email`).
- Tests existants mis à jour : `admin-route-group` (login n'importe plus « aucun composant admin » mais pas de shell), `admin-nav-links` (signup retiré, Accès ajouté), `admin-shell` (Accès actif), `safe-redirect` (route supprimée), `admin-routes-guarded` (4 routes ajoutées).

## Limites assumées

- Compte déjà présent dans le pool partagé : l'invitation ne l'associe pas automatiquement (jamais de modification du mot de passe de l'autre application) ; procédure manuelle.
- Le jeton est dans l'URL (journaux HTTP) ; usage unique et expiration le bornent.
- Primitive `ConfirmDialog` (phase 11, non modifiée) : le focus traverse un garde (SPAN puis BODY) avant de boucler dans le dialogue.
- Étiquettes de la barre du bas du shell à 12 px (shell D1, hors périmètre).
