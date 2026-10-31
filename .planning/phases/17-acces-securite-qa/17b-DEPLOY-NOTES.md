# 17b : notes de déploiement (à reporter dans `.planning/DEPLOY-CHECKLIST-v1.1.md`)

Rien n'est appliqué ni configuré par cette phase. Ordre conseillé, chaque ligne exige l'accord du propriétaire.

| # | Action | Qui | Quand |
|---|---|---|---|
| 1 | **ACC-01** : vérifier qu'aucune autre application ne lit `gecko_table*` (requêtes dans `17b-ACC01-NOTES.md`), puis accord écrit, puis appliquer `supabase/migrations/020_revoke_public_gecko_table_reads.sql` | propriétaire | avant ou après le déploiement, indépendant du reste |
| 2 | **ACC-02** : accord, puis appliquer `supabase/migrations/021_gecko_access_tokens.sql` (table `gecko_access_tokens` + fonction `gecko_revoke_admin`). À appliquer AVANT de déployer le code : sans elle, la page Accès répond une erreur et la connexion reste inchangée | propriétaire | avant déploiement |
| 3 | Variables d'environnement Vercel : `SUPABASE_SERVICE_ROLE_KEY` (déjà requise), `RESEND_API_KEY` et `RESEND_FROM_EMAIL` (déjà présentes, le domaine d'envoi doit être vérifié dans Resend), `RATE_LIMIT_SECRET` (déjà utilisée par les autres limiteurs). Optionnel : `ACCESS_LINK_BASE_URL` (https) pour tester sur une préversion ; absent = `https://geckocabanerestaurant.com` | propriétaire | avant déploiement |
| 4 | **Supabase, Authentication, URL Configuration** : aucune URL de redirection n'est nécessaire (les liens ne passent plus par Supabase Auth). Ne rien ajouter. Vérifier seulement que le « Site URL » n'est pas un domaine tiers | propriétaire | à vérifier |
| 5 | **Supabase, Authentication, Sign In / Providers, Email** : conserver « Allow new users to sign up » DÉSACTIVÉ (la création de comptes passe par l'API admin, qui l'ignore). Ne pas réactiver l'inscription publique : le pool est partagé avec le portfolio | propriétaire | à vérifier |
| 6 | **Supabase, Authentication, Emails (modèles)** : rien à modifier. Les emails d'invitation et de réinitialisation sont envoyés par Resend avec un texte propre ; le modèle Supabase (partagé avec le portfolio) n'est pas utilisé. | propriétaire | aucune action |
| 7 | **Durée de validité des liens** : fixée par l'application (7 jours pour une invitation, 1 heure pour une réinitialisation). Le réglage Supabase « OTP expiry » ne s'applique pas et ne doit pas être modifié (il concerne aussi le portfolio) | propriétaire | aucune action |
| 8 | **Sessions après changement de mot de passe** : Supabase ne ferme pas les sessions ouvertes. Pour les fermer, utiliser « Sign out » côté tableau de bord Supabase ou activer les réglages de session de l'offre Pro (optionnel) | propriétaire | optionnel |
| 9 | **Premier test** (après 1 et 2) : inviter une adresse que le propriétaire contrôle (pas un vrai collaborateur), ouvrir le lien dans un navigateur privé, choisir un mot de passe, se connecter, puis retirer cet accès depuis la page Accès | propriétaire + orchestrateur | après déploiement |
| 10 | Si une personne invitée a déjà un compte du portfolio : l'équipe technique insère à la main la ligne `gecko_admins` (voir `17b-ACC02-DESIGN.md` section 7) | équipe technique | au cas par cas |

Numérotation des migrations : 020 et 021 sont consécutives (le test `tests/migrations.test.ts` impose une suite sans trou). Si la phase 17a ajoute aussi un fichier 020, le dernier fusionné est renuméroté.
